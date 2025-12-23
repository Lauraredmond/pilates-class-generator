"""
Class Plans API Router - Session 5
Endpoints for creating and managing Pilates class plans
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
import os
import time
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger

from models.error import ErrorMessages

# Import services
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.sequence_validator import sequence_validator
from services.muscle_balance import muscle_balance_calculator
from utils.compliance import compliance_logger

# Load environment variables
load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)


# Helper functions
def get_movement_muscle_groups(movement_id: str) -> List[str]:
    """
    Fetch muscle groups for a movement from movement_muscles junction table

    Returns list of muscle group names (e.g., ["Core Strength", "Hip Mobility"])
    """
    try:
        # Production schema: movement_muscles.muscle_group_name (text) stores name directly
        mm_response = supabase.table('movement_muscles') \
            .select('muscle_group_name') \
            .eq('movement_id', movement_id) \
            .execute()

        if not mm_response.data:
            return []

        # Extract muscle group names directly (no need for second query)
        muscle_groups = [item['muscle_group_name'] for item in mm_response.data if item.get('muscle_group_name')]
        return muscle_groups

    except Exception as e:
        logger.warning(f"Failed to fetch muscle groups for movement {movement_id}: {e}")
        return []


# Pydantic models
class ClassMovement(BaseModel):
    """Movement within a class sequence"""
    movement_id: str
    movement_name: str
    order_index: int
    duration_seconds: int = 60
    custom_cues: Optional[str] = None
    notes: Optional[str] = None


class ClassPlanCreate(BaseModel):
    """Create new class plan"""
    name: str = Field(..., min_length=1, max_length=255)
    user_id: str
    movements: List[ClassMovement]
    duration: Optional[int] = None
    difficulty: str = "Beginner"
    notes: Optional[str] = None


class ClassPlanUpdate(BaseModel):
    """Update existing class plan"""
    name: Optional[str] = None
    movements: Optional[List[ClassMovement]] = None
    duration: Optional[int] = None
    difficulty: Optional[str] = None
    notes: Optional[str] = None


class ClassPlanResponse(BaseModel):
    """Class plan response"""
    id: str
    name: str
    user_id: str
    movements: List[ClassMovement]
    duration: Optional[int] = None
    difficulty: str
    notes: Optional[str] = None
    muscle_balance: dict
    validation_status: dict
    created_at: str
    updated_at: Optional[str] = None
    deleted_at: Optional[str] = None


@router.post("/", response_model=ClassPlanResponse, status_code=201)
async def create_class_plan(plan: ClassPlanCreate):
    """
    Create a new class plan with sequence validation

    Validates the movement sequence against 5 critical safety rules:
    1. Warm-up first
    2. Spinal progression (flexion before extension)
    3. Muscle balance (no group > 40%)
    4. Complexity progression
    5. Cool-down required

    Returns 400 if sequence violates safety rules.
    Logs decision to ai_decision_log for EU AI Act compliance.
    """
    start_time = time.time()

    try:
        # Step 1: Fetch full movement details from database
        movement_details = []
        for class_movement in plan.movements:
            # Fetch movement from database
            response = supabase.table('movements').select('*').eq('id', class_movement.movement_id).execute()

            if not response.data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Movement with ID {class_movement.movement_id} not found"
                )

            movement = response.data[0]
            # Merge class movement data with database movement data
            movement_details.append({
                'id': movement['id'],
                'name': movement['name'],
                'difficulty_level': movement.get('difficulty_level', 'Beginner'),
                'category': movement.get('category', ''),
                'primary_muscles': movement.get('primary_muscles', []),
                'duration_seconds': class_movement.duration_seconds,
                'order_index': class_movement.order_index,
                'custom_cues': class_movement.custom_cues,
                'notes': class_movement.notes
            })

        # Sort by order_index
        movement_details.sort(key=lambda x: x['order_index'])

        # Step 2: Validate sequence against safety rules
        validation_result = sequence_validator.validate_sequence(movement_details)

        if not validation_result['valid']:
            # Log validation failure
            processing_time_ms = (time.time() - start_time) * 1000
            await compliance_logger.log_validation_result(
                user_id=plan.user_id,
                movements=movement_details,
                validation_result=validation_result,
                processing_time_ms=processing_time_ms
            )

            # Return 400 with specific violations
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Sequence violates safety rules",
                    "violations": validation_result['errors'],
                    "warnings": validation_result['warnings'],
                    "safety_score": validation_result['safety_score']
                }
            )

        # Step 3: Calculate muscle balance
        muscle_balance_result = muscle_balance_calculator.calculate_balance(movement_details)

        # Check for muscle balance violations
        if muscle_balance_result['violations']:
            # This is a warning, not a hard failure (unless user wants strict mode)
            logger.warning(f"Muscle balance violations: {muscle_balance_result['violations']}")

        # Step 4: Calculate total duration
        total_duration = sum(m['duration_seconds'] for m in movement_details)
        duration_minutes = total_duration // 60

        # Step 5: Create class plan in database
        now = datetime.now().isoformat()

        class_plan_data = {
            'name': plan.name,
            'user_id': plan.user_id,
            'movements': [
                {
                    'movement_id': m['id'],
                    'movement_name': m['name'],
                    'order_index': m['order_index'],
                    'duration_seconds': m['duration_seconds'],
                    'custom_cues': m.get('custom_cues'),
                    'notes': m.get('notes')
                }
                for m in movement_details
            ],
            'duration_minutes': duration_minutes,
            'difficulty_level': plan.difficulty,
            'notes': plan.notes,
            'muscle_balance': muscle_balance_result['muscle_percentages'],
            'validation_status': {
                'valid': validation_result['valid'],
                'safety_score': validation_result['safety_score'],
                'warnings': validation_result['warnings']
            },
            'created_at': now,
            'updated_at': now
        }

        response = supabase.table('class_plans').insert(class_plan_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create class plan in database"
            )

        created_plan = response.data[0]

        # Step 6: Log successful validation to compliance log
        processing_time_ms = (time.time() - start_time) * 1000
        await compliance_logger.log_validation_result(
            user_id=plan.user_id,
            movements=movement_details,
            validation_result=validation_result,
            processing_time_ms=processing_time_ms
        )

        # Step 7: Return created plan
        return ClassPlanResponse(
            id=created_plan['id'],
            name=created_plan['name'],
            user_id=created_plan['user_id'],
            movements=[ClassMovement(**m) for m in created_plan['movements']],
            duration=created_plan.get('duration_minutes'),
            difficulty=created_plan.get('difficulty_level', 'Beginner'),
            notes=created_plan.get('notes'),
            muscle_balance=created_plan.get('muscle_balance', {}),
            validation_status=created_plan.get('validation_status', {}),
            created_at=created_plan['created_at'],
            updated_at=created_plan.get('updated_at'),
            deleted_at=created_plan.get('deleted_at')
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating class plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.INTERNAL_ERROR
        )


@router.get("/{class_id}", response_model=ClassPlanResponse)
async def get_class_plan(class_id: str):
    """
    Get a specific class plan by ID

    Returns full class plan with movement details, muscle balance, and validation status
    """
    try:
        response = supabase.table('class_plans').select('*').eq('id', class_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Class plan with ID {class_id} not found"
            )

        plan = response.data[0]

        # Check if soft deleted
        if plan.get('deleted_at'):
            raise HTTPException(
                status_code=404,
                detail=f"Class plan with ID {class_id} has been deleted"
            )

        return ClassPlanResponse(
            id=plan['id'],
            name=plan['name'],
            user_id=plan['user_id'],
            movements=[ClassMovement(**m) for m in plan.get('movements', [])],
            duration=plan.get('duration_minutes'),
            difficulty=plan.get('difficulty_level', 'Beginner'),
            notes=plan.get('notes'),
            muscle_balance=plan.get('muscle_balance', {}),
            validation_status=plan.get('validation_status', {}),
            created_at=plan['created_at'],
            updated_at=plan.get('updated_at'),
            deleted_at=plan.get('deleted_at')
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching class plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/user/{user_id}", response_model=List[ClassPlanResponse])
async def get_user_class_plans(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    """
    Get all class plans for a specific user

    Paginated results sorted by created_at DESC
    Excludes soft-deleted plans

    Query parameters:
    - limit: Number of results to return (1-100, default 20)
    - offset: Number of results to skip (for pagination)
    """
    try:
        # Query with pagination and filtering
        response = (
            supabase.table('class_plans')
            .select('*')
            .eq('user_id', user_id)
            .is_('deleted_at', 'null')
            .order('created_at', desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        plans = response.data or []

        return [
            ClassPlanResponse(
                id=plan['id'],
                name=plan['name'],
                user_id=plan['user_id'],
                movements=[ClassMovement(**m) for m in plan.get('movements', [])],
                duration=plan.get('duration_minutes'),
                difficulty=plan.get('difficulty_level', 'Beginner'),
                notes=plan.get('notes'),
                muscle_balance=plan.get('muscle_balance', {}),
                validation_status=plan.get('validation_status', {}),
                created_at=plan['created_at'],
                updated_at=plan.get('updated_at'),
                deleted_at=plan.get('deleted_at')
            )
            for plan in plans
        ]

    except Exception as e:
        logger.error(f"Error fetching user class plans: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.delete("/{class_id}", status_code=204)
async def delete_class_plan(class_id: str, user_id: str = Query(...)):
    """
    Soft delete a class plan

    Sets deleted_at timestamp instead of removing from database
    Verifies user owns the plan before deleting

    Query parameters:
    - user_id: User ID (for ownership verification)
    """
    try:
        # Fetch plan to verify ownership
        response = supabase.table('class_plans').select('*').eq('id', class_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Class plan with ID {class_id} not found"
            )

        plan = response.data[0]

        # Verify ownership
        if plan['user_id'] != user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to delete this class plan"
            )

        # Check if already deleted
        if plan.get('deleted_at'):
            raise HTTPException(
                status_code=404,
                detail=f"Class plan with ID {class_id} has already been deleted"
            )

        # Soft delete (set deleted_at timestamp)
        now = datetime.now().isoformat()
        supabase.table('class_plans').update({
            'deleted_at': now
        }).eq('id', class_id).execute()

        logger.info(f"Soft deleted class plan {class_id} for user {user_id}")

        # Return 204 No Content (FastAPI handles this)
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting class plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.put("/{class_id}", response_model=ClassPlanResponse)
async def update_class_plan(class_id: str, update: ClassPlanUpdate):
    """
    Update an existing class plan

    If movements are updated, re-validates sequence and recalculates muscle balance
    """
    try:
        # Fetch existing plan
        response = supabase.table('class_plans').select('*').eq('id', class_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Class plan with ID {class_id} not found"
            )

        existing_plan = response.data[0]

        # Check if deleted
        if existing_plan.get('deleted_at'):
            raise HTTPException(
                status_code=404,
                detail=f"Class plan with ID {class_id} has been deleted"
            )

        # Prepare update data
        update_data = {
            'updated_at': datetime.now().isoformat()
        }

        if update.name is not None:
            update_data['name'] = update.name

        if update.difficulty is not None:
            update_data['difficulty_level'] = update.difficulty

        if update.notes is not None:
            update_data['notes'] = update.notes

        # If movements are updated, re-validate and recalculate
        if update.movements is not None:
            # Fetch movement details
            movement_details = []
            for class_movement in update.movements:
                response = supabase.table('movements').select('*').eq('id', class_movement.movement_id).execute()

                if not response.data:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Movement with ID {class_movement.movement_id} not found"
                    )

                movement = response.data[0]
                movement_details.append({
                    'id': movement['id'],
                    'name': movement['name'],
                    'difficulty_level': movement.get('difficulty_level', 'Beginner'),
                    'category': movement.get('category', ''),
                    'primary_muscles': movement.get('primary_muscles', []),
                    'duration_seconds': class_movement.duration_seconds,
                    'order_index': class_movement.order_index,
                    'custom_cues': class_movement.custom_cues,
                    'notes': class_movement.notes
                })

            movement_details.sort(key=lambda x: x['order_index'])

            # Validate sequence
            validation_result = sequence_validator.validate_sequence(movement_details)

            if not validation_result['valid']:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Updated sequence violates safety rules",
                        "violations": validation_result['errors'],
                        "warnings": validation_result['warnings']
                    }
                )

            # Calculate muscle balance
            muscle_balance_result = muscle_balance_calculator.calculate_balance(movement_details)

            # Update movements and related data
            update_data['movements'] = [
                {
                    'movement_id': m['id'],
                    'movement_name': m['name'],
                    'order_index': m['order_index'],
                    'duration_seconds': m['duration_seconds'],
                    'custom_cues': m.get('custom_cues'),
                    'notes': m.get('notes')
                }
                for m in movement_details
            ]
            update_data['muscle_balance'] = muscle_balance_result['muscle_percentages']
            update_data['validation_status'] = {
                'valid': validation_result['valid'],
                'safety_score': validation_result['safety_score'],
                'warnings': validation_result['warnings']
            }
            update_data['duration_minutes'] = sum(m['duration_seconds'] for m in movement_details) // 60

        # Apply update
        response = supabase.table('class_plans').update(update_data).eq('id', class_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update class plan"
            )

        updated_plan = response.data[0]

        return ClassPlanResponse(
            id=updated_plan['id'],
            name=updated_plan['name'],
            user_id=updated_plan['user_id'],
            movements=[ClassMovement(**m) for m in updated_plan.get('movements', [])],
            duration=updated_plan.get('duration_minutes'),
            difficulty=updated_plan.get('difficulty_level', 'Beginner'),
            notes=updated_plan.get('notes'),
            muscle_balance=updated_plan.get('muscle_balance', {}),
            validation_status=updated_plan.get('validation_status', {}),
            created_at=updated_plan['created_at'],
            updated_at=updated_plan.get('updated_at'),
            deleted_at=updated_plan.get('deleted_at')
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating class plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.INTERNAL_ERROR
        )


# ==============================================================================
# AI-GENERATED CLASS ENDPOINT - Session 10: Jentic Integration
# ==============================================================================

class ClassGenerationRequest(BaseModel):
    """Request for AI-generated Pilates class"""
    user_id: str
    duration_minutes: int = Field(default=30, ge=10, le=120)
    difficulty: str = Field(default="Beginner")
    use_agent: Optional[bool] = None  # If None, fetch from user preferences


class ClassGenerationResponse(BaseModel):
    """Response from AI-generated class"""
    class_plan: dict
    method: str  # "ai_agent" or "direct_api"
    iterations: Optional[int] = None  # Only for AI agent
    success: bool
    cost_estimate: str
    processing_time_ms: float


@router.post("/generate", response_model=ClassGenerationResponse)
async def generate_class(request: ClassGenerationRequest):
    """
    Generate a Pilates class using AI Agent or Direct API

    This endpoint routes between two generation methods:

    1. **AI Agent (GPT-4)** - Costly but intelligent
       - Uses Jentic StandardAgent with ReWOO reasoner
       - LLM-powered planning and reflection
       - Cost: ~$0.12-0.15 per class
       - Time: 15-20 seconds

    2. **Direct API** - Free but basic
       - Simple rule-based sequence generation
       - No LLM calls
       - Cost: $0.00
       - Time: <1 second

    Toggle is controlled by `use_agent` parameter or user preferences.
    """
    start_time = time.time()

    try:
        # Determine which method to use
        use_agent = request.use_agent

        # If not specified, fetch from user preferences
        if use_agent is None:
            prefs_response = supabase.table("user_preferences").select("use_ai_agent").eq("user_id", request.user_id).execute()

            if prefs_response.data:
                use_agent = prefs_response.data[0].get("use_ai_agent", False)
            else:
                use_agent = False  # Default to free tier

        logger.info(f"Generating class for user {request.user_id} using {'AI Agent' if use_agent else 'Direct API'}")

        # ==============================================================================
        # ROUTE 1: AI AGENT (Jentic StandardAgent + GPT-4)
        # ==============================================================================
        if use_agent:
            try:
                # Import Jentic agent (only if needed to avoid startup overhead)
                sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'orchestrator'))
                from agent.bassline_agent import BasslinePilatesCoachAgent

                # Create agent instance
                agent = BasslinePilatesCoachAgent()

                # Define goal for agent
                goal = f"Create a {request.duration_minutes}-minute {request.difficulty} Pilates class"

                # Call agent.solve() (synchronous - Jentic design)
                logger.info(f"Calling agent.solve() with goal: {goal}")
                result = agent.solve(goal)

                # Extract class plan from result
                class_plan = {
                    "name": f"{request.difficulty} Pilates Class ({request.duration_minutes} min)",
                    "user_id": request.user_id,
                    "duration_minutes": request.duration_minutes,
                    "difficulty_level": request.difficulty,
                    "generated_by": "ai_agent",
                    "agent_result": {
                        "final_answer": result.final_answer,
                        "success": result.success,
                        "iterations": result.iterations,
                        "error_message": result.error_message
                    }
                }

                processing_time_ms = (time.time() - start_time) * 1000

                # ==============================================================================
                # SAVE TO DATABASE: Persist generated class for analytics
                # ==============================================================================
                try:
                    now = datetime.now().isoformat()
                    class_plan_db = {
                        'name': class_plan['name'],
                        'user_id': request.user_id,
                        'movements': class_plan.get('agent_result', {}).get('movements', []),  # Extract movements if structured
                        'duration_minutes': request.duration_minutes,
                        'difficulty_level': request.difficulty,
                        'notes': f"AI-generated class using GPT-4. Iterations: {result.iterations}",
                        'muscle_balance': {},  # Agent should provide this
                        'validation_status': {
                            'valid': True,
                            'safety_score': 1.0,
                            'warnings': []
                        },
                        'created_at': now,
                        'updated_at': now
                    }

                    db_response = supabase.table('class_plans').insert(class_plan_db).execute()
                    if db_response.data:
                        class_plan['id'] = db_response.data[0]['id']  # Add DB ID to response
                        logger.info(f"✅ Saved AI-generated class to class_plans table for user {request.user_id}")

                        # ==============================================================================
                        # ANALYTICS FIX: Also save to class_history table for analytics tracking
                        # ==============================================================================
                        try:
                            # Enrich agent movements with muscle_groups from database
                            agent_movements = class_plan.get('agent_result', {}).get('movements', [])
                            enriched_movements = []

                            for movement in agent_movements:
                                enriched_movement = movement.copy()

                                # If movement has an ID, fetch muscle_groups from database
                                movement_id = movement.get('id')
                                if movement_id:
                                    muscle_groups = get_movement_muscle_groups(movement_id)
                                    enriched_movement['muscle_groups'] = muscle_groups

                                # Ensure type field is set
                                if 'type' not in enriched_movement:
                                    enriched_movement['type'] = 'movement'

                                enriched_movements.append(enriched_movement)

                            class_history_entry = {
                                'class_plan_id': db_response.data[0]['id'],
                                'user_id': request.user_id,
                                'taught_date': datetime.now().date().isoformat(),
                                'actual_duration_minutes': request.duration_minutes,
                                'attendance_count': 1,  # Generated = 1 attendance (self)
                                'movements_snapshot': enriched_movements,  # FIXED: Use enriched movements with muscle_groups!
                                'instructor_notes': f"AI-generated {request.difficulty} class using GPT-4. Iterations: {result.iterations}",
                                'difficulty_rating': None,
                                'muscle_groups_targeted': [],  # Agent should provide this
                                'total_movements_taught': len(enriched_movements),
                                'created_at': now
                            }

                            supabase.table('class_history').insert(class_history_entry).execute()
                            logger.info(f"✅ Saved to class_history table for analytics tracking (user {request.user_id})")
                        except Exception as history_error:
                            logger.error(f"❌ Failed to save to class_history for analytics: {history_error}", exc_info=True)
                            # Continue anyway - class plan was saved successfully

                except Exception as db_error:
                    logger.error(f"❌ Failed to save class to database: {db_error}", exc_info=True)
                    # Continue anyway - user still gets the class plan

                # ==============================================================================
                # ADMIN LOGGING: Log AI Agent invocation to database
                # ==============================================================================
                try:
                    log_entry = {
                        'user_id': request.user_id,
                        'method_used': 'ai_agent',
                        'llm_called': True,
                        'llm_model': 'gpt-4-turbo',
                        'llm_prompt': goal,  # The goal sent to agent.solve()
                        'llm_response': result.final_answer if result.final_answer else str(result),
                        'llm_iterations': result.iterations,
                        'request_data': {
                            'duration_minutes': request.duration_minutes,
                            'difficulty': request.difficulty,
                            'use_agent': True
                        },
                        'processing_time_ms': processing_time_ms,
                        'success': result.success,
                        'error_message': result.error_message if hasattr(result, 'error_message') and result.error_message else None,
                        'cost_estimate': '$0.12-0.15',
                        'result_summary': {
                            'movements_count': len(class_plan.get('agent_result', {}).get('final_answer', '').split('Movement') if isinstance(class_plan.get('agent_result', {}).get('final_answer'), str) else []),
                            'iterations': result.iterations,
                            'success': result.success
                        }
                    }

                    supabase.table('llm_invocation_log').insert(log_entry).execute()
                    logger.info(f"✅ Logged AI Agent invocation for user {request.user_id}")
                except Exception as log_error:
                    # Don't fail the request if logging fails
                    logger.error(f"❌ Failed to log AI agent invocation: {log_error}", exc_info=True)

                return ClassGenerationResponse(
                    class_plan=class_plan,
                    method="ai_agent",
                    iterations=result.iterations,
                    success=result.success,
                    cost_estimate="$0.12-0.15",
                    processing_time_ms=processing_time_ms
                )

            except Exception as agent_error:
                logger.error(f"AI Agent failed: {agent_error}", exc_info=True)

                # ==============================================================================
                # ADMIN LOGGING: Log AI Agent FAILURE
                # ==============================================================================
                processing_time_ms = (time.time() - start_time) * 1000
                try:
                    log_entry = {
                        'user_id': request.user_id,
                        'method_used': 'ai_agent',
                        'llm_called': True,  # Attempted to call LLM
                        'llm_model': 'gpt-4-turbo',
                        'llm_prompt': f"Create a {request.duration_minutes}-minute {request.difficulty} Pilates class",
                        'llm_response': None,  # Failed before getting response
                        'llm_iterations': None,
                        'request_data': {
                            'duration_minutes': request.duration_minutes,
                            'difficulty': request.difficulty,
                            'use_agent': True
                        },
                        'processing_time_ms': processing_time_ms,
                        'success': False,
                        'error_message': str(agent_error),
                        'cost_estimate': '$0.00',  # Failed before completion
                        'result_summary': {
                            'error': 'AI agent initialization or execution failed',
                            'fallback': 'Will use direct API'
                        }
                    }

                    supabase.table('llm_invocation_log').insert(log_entry).execute()
                    logger.info(f"✅ Logged AI Agent FAILURE for user {request.user_id}")
                except Exception as log_error:
                    logger.error(f"❌ Failed to log AI agent failure: {log_error}", exc_info=True)

                # Fallback to direct API if agent fails
                logger.warning("Falling back to direct API due to agent error")
                use_agent = False  # Continue to direct API below

        # ==============================================================================
        # ROUTE 2: DIRECT API (Simple Rule-Based Generation)
        # ==============================================================================
        if not use_agent:
            # Fetch appropriate movements from database
            movements_response = supabase.table('movements').select('*').eq('difficulty_level', request.difficulty).limit(10).execute()

            if not movements_response.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"No movements found for difficulty level: {request.difficulty}"
                )

            movements = movements_response.data

            # Simple selection: first N movements that fit duration
            target_seconds = request.duration_minutes * 60
            selected_movements = []
            movements_for_history = []  # For analytics with muscle groups
            current_duration = 0

            for i, movement in enumerate(movements):
                movement_duration = movement.get('duration_seconds', 60)
                if current_duration + movement_duration <= target_seconds:
                    # Fetch muscle groups from junction table
                    muscle_groups = get_movement_muscle_groups(movement['id'])

                    # For API response
                    selected_movements.append({
                        "movement_id": movement['id'],
                        "movement_name": movement['name'],
                        "order_index": i,
                        "duration_seconds": movement_duration
                    })

                    # For class_history analytics (needs muscle groups!)
                    movements_for_history.append({
                        "type": "movement",
                        "name": movement['name'],
                        "muscle_groups": muscle_groups,  # FIXED: Use real muscle groups from junction table!
                        "duration_seconds": movement_duration,
                        "order_index": i
                    })

                    current_duration += movement_duration

                if current_duration >= target_seconds:
                    break

            class_plan = {
                "name": f"{request.difficulty} Pilates Class ({request.duration_minutes} min)",
                "user_id": request.user_id,
                "movements": selected_movements,
                "duration_minutes": current_duration // 60,
                "difficulty_level": request.difficulty,
                "generated_by": "direct_api"
            }

            processing_time_ms = (time.time() - start_time) * 1000

            # ==============================================================================
            # SAVE TO DATABASE: Persist class for analytics (Direct API route)
            # ==============================================================================
            try:
                now = datetime.now().isoformat()
                class_plan_db = {
                    'name': class_plan['name'],
                    'user_id': request.user_id,
                    'movements': selected_movements,
                    'duration_minutes': current_duration // 60,
                    'difficulty_level': request.difficulty,
                    'notes': "Rule-based class generation (no LLM)",
                    'muscle_balance': {},
                    'validation_status': {
                        'valid': True,
                        'safety_score': 1.0,
                        'warnings': []
                    },
                    'created_at': now,
                    'updated_at': now
                }

                db_response = supabase.table('class_plans').insert(class_plan_db).execute()
                if db_response.data:
                    class_plan['id'] = db_response.data[0]['id']
                    logger.info(f"✅ Saved Direct API class to class_plans table for user {request.user_id}")

                    # ==============================================================================
                    # ANALYTICS FIX: Also save to class_history table for analytics tracking
                    # ==============================================================================
                    try:
                        class_history_entry = {
                            'class_plan_id': db_response.data[0]['id'],
                            'user_id': request.user_id,
                            'taught_date': datetime.now().date().isoformat(),
                            'actual_duration_minutes': current_duration // 60,
                            'attendance_count': 1,
                            'movements_snapshot': movements_for_history,  # FIXED: Use movements_for_history with muscle_groups!
                            'instructor_notes': f"Rule-based {request.difficulty} class (no LLM)",
                            'difficulty_rating': None,
                            'muscle_groups_targeted': [],
                            'total_movements_taught': len(selected_movements),
                            'created_at': now
                        }

                        supabase.table('class_history').insert(class_history_entry).execute()
                        logger.info(f"✅ Saved to class_history table for analytics tracking (user {request.user_id})")
                    except Exception as history_error:
                        logger.error(f"❌ Failed to save to class_history for analytics: {history_error}", exc_info=True)

            except Exception as db_error:
                logger.error(f"❌ Failed to save Direct API class to database: {db_error}", exc_info=True)

            # ==============================================================================
            # ADMIN LOGGING: Log Direct API usage (no LLM)
            # ==============================================================================
            try:
                log_entry = {
                    'user_id': request.user_id,
                    'method_used': 'direct_api',
                    'llm_called': False,  # No LLM used
                    'llm_model': None,
                    'llm_prompt': None,
                    'llm_response': None,
                    'llm_iterations': None,
                    'request_data': {
                        'duration_minutes': request.duration_minutes,
                        'difficulty': request.difficulty,
                        'use_agent': False
                    },
                    'processing_time_ms': processing_time_ms,
                    'success': True,
                    'error_message': None,
                    'cost_estimate': '$0.00',  # Free - no LLM
                    'result_summary': {
                        'movements_count': len(selected_movements),
                        'method': 'simple_rule_based_selection',
                        'total_duration_seconds': current_duration
                    }
                }

                supabase.table('llm_invocation_log').insert(log_entry).execute()
                logger.info(f"✅ Logged Direct API usage for user {request.user_id} (no LLM)")
            except Exception as log_error:
                # Don't fail the request if logging fails
                logger.error(f"❌ Failed to log direct API usage: {log_error}", exc_info=True)

            return ClassGenerationResponse(
                class_plan=class_plan,
                method="direct_api",
                iterations=None,
                success=True,
                cost_estimate="$0.00",
                processing_time_ms=processing_time_ms
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating class: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.INTERNAL_ERROR
        )


# ==============================================================================
# SAVE COMPLETED CLASS - Session 13: Movement Variety
# ==============================================================================

class SaveCompletedClassRequest(BaseModel):
    """Request to save a completed class to database"""
    user_id: str
    difficulty: str
    duration_minutes: int
    movements_snapshot: List[dict]  # Full sequence with movements + transitions
    muscle_balance: dict
    class_name: Optional[str] = "Automatically Generated Class"


class SaveCompletedClassResponse(BaseModel):
    """Response after saving completed class"""
    class_history_id: str
    classes_completed: int
    experience_level: str
    message: str


@router.post("/save-completed", response_model=SaveCompletedClassResponse)
async def save_completed_class(request: SaveCompletedClassRequest):
    """
    Save a completed class to database (called when user clicks "Accept & Add to Class")

    This endpoint:
    1. Saves to class_plans table (appears in "Saved Classes" in GDPR export)
    2. Saves to class_history table linked to class_plan (appears in "Class History")
    3. Increments classes_completed in user_preferences
    4. Updates movement_usage for each movement
    5. Returns updated user stats

    GDPR Compliance: Classes saved via this endpoint will appear in both
    "Saved Classes" and "Class History" sections of the Article 15 data export.

    Session 13: Movement variety tracking
    Session 14: GDPR data export fix (save to both tables)
    """
    try:
        now = datetime.now()
        today = now.date().isoformat()

        # CRITICAL FIX: Enrich movements_snapshot with muscle_groups from database
        # Frontend doesn't always send muscle_groups, so we fetch them here
        logger.info(f"🔍 DEBUG: Enriching {len(request.movements_snapshot)} items from movements_snapshot")
        enriched_movements_snapshot = []
        for item in request.movements_snapshot:
            enriched_item = item.copy()

            if item.get('type') == 'movement':
                # Fetch muscle groups from junction table
                movement_id = item.get('id')
                movement_name = item.get('name', 'Unknown')
                if movement_id:
                    muscle_groups = get_movement_muscle_groups(movement_id)
                    enriched_item['muscle_groups'] = muscle_groups
                    logger.info(f"  ✅ Movement '{movement_name}' (ID: {movement_id}): {len(muscle_groups)} muscle groups fetched: {muscle_groups}")
                else:
                    logger.warning(f"  ⚠️ Movement '{movement_name}' has no ID, skipping muscle group enrichment")

            enriched_movements_snapshot.append(enriched_item)

        logger.info(f"✅ Enrichment complete: {len(enriched_movements_snapshot)} items enriched")

        # Extract movement IDs from snapshot (movements only, not transitions)
        movements_only = [
            m for m in enriched_movements_snapshot
            if m.get('type') == 'movement'
        ]

        # Extract all muscle groups targeted
        all_muscle_groups = []
        for movement in movements_only:
            muscle_groups = movement.get('muscle_groups', [])
            if isinstance(muscle_groups, list):
                all_muscle_groups.extend(muscle_groups)
        unique_muscle_groups = list(set(all_muscle_groups))

        # ==============================================================================
        # 1. SAVE TO CLASS_PLANS TABLE (for "Saved Classes" in GDPR export)
        # ==============================================================================
        # NOTE: class_plans table has these JSONB fields for movements:
        # - warm_up_movements, main_sequence, cool_down_movements (from schema)
        # But we'll use the simplified 'movements' field that other code uses
        class_plan_entry = {
            'title': request.class_name or f"{request.difficulty} Class - {today}",
            'user_id': request.user_id,
            'duration_minutes': request.duration_minutes,
            'difficulty_level': request.difficulty,
            'description': f"Accepted & saved from AI generation - {len(movements_only)} movements",  # Changed from 'notes' to 'description'
            'total_movements': len(movements_only),
            'main_sequence': request.movements_snapshot,  # Use main_sequence instead of movements
            'generated_by_ai': True,
            'sequence_validation_passed': True,
            'status': 'ready'  # Class is complete and ready
        }

        plan_response = supabase.table('class_plans').insert(class_plan_entry).execute()

        if not plan_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save class to class_plans"
            )

        class_plan_id = plan_response.data[0]['id']
        logger.info(f"✅ Saved class to class_plans (ID: {class_plan_id}) for user {request.user_id}")

        # ==============================================================================
        # 2. FIND EXISTING CLASS_HISTORY RECORD (created during generation)
        # ==============================================================================
        # BUGFIX: Don't create duplicate class_history record - it was already created
        # during class generation in /api/agents/generate-complete-class
        # Instead, query for the existing record by user_id and date
        logger.info(f"🔍 Looking for existing class_history record for user {request.user_id} on {today}")

        existing_history = supabase.table('class_history') \
            .select('id') \
            .eq('user_id', request.user_id) \
            .eq('taught_date', today) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()

        if existing_history.data:
            class_history_id = existing_history.data[0]['id']
            logger.info(f"✅ Found existing class_history record (ID: {class_history_id})")
        else:
            # Fallback: If no existing record found (shouldn't happen), create one
            logger.warning(f"⚠️ No existing class_history found - creating new one (this shouldn't happen)")
            class_history_entry = {
                'class_plan_id': class_plan_id,
                'user_id': request.user_id,
                'taught_date': today,
                'actual_duration_minutes': request.duration_minutes,
                'attendance_count': 1,
                'movements_snapshot': enriched_movements_snapshot,
                'instructor_notes': f"{request.difficulty} level - {request.duration_minutes} minutes - {len(movements_only)} movements",
                'difficulty_rating': None,
                'muscle_groups_targeted': unique_muscle_groups,
                'total_movements_taught': len(movements_only),
                'created_at': now.isoformat()
            }
            history_response = supabase.table('class_history').insert(class_history_entry).execute()
            class_history_id = history_response.data[0]['id'] if history_response.data else None

        # ==============================================================================
        # 3. UPDATE USER_PREFERENCES (increment classes_completed)
        # ==============================================================================
        # Fetch current preferences
        prefs_response = supabase.table('user_preferences') \
            .select('classes_completed, experience_level, first_class_date') \
            .eq('user_id', request.user_id) \
            .execute()

        if prefs_response.data:
            current_prefs = prefs_response.data[0]
            current_classes = current_prefs.get('classes_completed', 0)
            new_classes_completed = current_classes + 1

            # Update experience level based on classes completed
            if new_classes_completed < 10:
                experience_level = 'beginner'
            elif new_classes_completed < 50:
                experience_level = 'intermediate'
            else:
                experience_level = 'advanced'

            # Set first_class_date if this is the first class
            first_class_date = current_prefs.get('first_class_date')
            if not first_class_date:
                first_class_date = today

            # Update preferences
            supabase.table('user_preferences').update({
                'classes_completed': new_classes_completed,
                'experience_level': experience_level,
                'first_class_date': first_class_date
            }).eq('user_id', request.user_id).execute()

            logger.info(f"✅ Updated user preferences: classes_completed={new_classes_completed}, experience_level={experience_level}")
        else:
            # Create preferences if they don't exist
            new_classes_completed = 1
            experience_level = 'beginner'

            supabase.table('user_preferences').insert({
                'user_id': request.user_id,
                'classes_completed': 1,
                'experience_level': 'beginner',
                'first_class_date': today
            }).execute()

            logger.info(f"✅ Created user preferences: classes_completed=1, experience_level=beginner")

        # ==============================================================================
        # 4. UPDATE MOVEMENT_USAGE TABLE (for favorite movement tracking)
        # ==============================================================================
        for movement in movements_only:
            movement_id = movement.get('id')
            if not movement_id:
                continue

            # Check if usage record exists
            usage_response = supabase.table('movement_usage') \
                .select('*') \
                .eq('user_id', request.user_id) \
                .eq('movement_id', movement_id) \
                .execute()

            if usage_response.data:
                # Update existing record
                current_usage = usage_response.data[0]
                new_usage_count = current_usage.get('usage_count', 0) + 1

                supabase.table('movement_usage').update({
                    'usage_count': new_usage_count,
                    'last_used_date': today,
                    'updated_at': now.isoformat()
                }).eq('user_id', request.user_id).eq('movement_id', movement_id).execute()
            else:
                # Create new record
                supabase.table('movement_usage').insert({
                    'user_id': request.user_id,
                    'movement_id': movement_id,
                    'usage_count': 1,
                    'last_used_date': today,
                    'created_at': now.isoformat(),
                    'updated_at': now.isoformat()
                }).execute()

        logger.info(f"✅ Updated movement_usage for {len(movements_only)} movements")

        return SaveCompletedClassResponse(
            class_history_id=class_history_id,
            classes_completed=new_classes_completed,
            experience_level=experience_level,
            message=f"Class saved successfully! Total classes: {new_classes_completed}"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error saving completed class: {}", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.INTERNAL_ERROR
        )
