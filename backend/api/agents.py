"""
AI Agents API Router - Direct Agent Integration

SESSION 13.5 MIGRATION (Option A - Merged):
This file uses BasslinePilatesCoachAgent directly (no HTTP proxy to separate service).
The agent and tools are imported as Python modules.

JENTIC PATTERN:
Backend API (FastAPI) → StandardAgent → Tools → Business Logic

ARCHITECTURE:
- BasslinePilatesCoachAgent: Jentic StandardAgent with Pilates domain knowledge
- SequenceTools, MusicTools, MeditationTools, ResearchTools: Pure business logic modules
- All integrated into single backend service (simpler deployment)

BACKWARD COMPATIBILITY:
All endpoints preserve the same request/response interface as before.
Frontend code requires no changes.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from loguru import logger
import os
from dotenv import load_dotenv
from datetime import datetime
from supabase import create_client, Client
import uuid

# Import SimplifiedStandardAgent with ReWOO reasoner (Phase 2)
from orchestrator.simplified_agent import BasslinePilatesCoachAgent

from models import (
    SequenceGenerationRequest,
    SequenceGenerationResponse,
    MusicSelectionRequest,
    MusicSelectionResponse,
    MeditationRequest,
    MeditationResponse,
    ResearchRequest,
    ResearchResponse,
    CompleteClassRequest,
    CompleteClassResponse,
    AgentDecision
)
from models.error import ErrorMessages

from utils.auth import get_current_user_id  # REAL JWT authentication

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

# STARTUP LOG: Verify which Supabase we're connecting to
logger.info("=" * 80)
logger.info("🔧 SUPABASE CONNECTION")
logger.info("=" * 80)
logger.info(f"📍 SUPABASE_URL: {supabase_url}")
if 'lixvcebtwusmaipodcpc' in supabase_url:
    logger.warning("⚠️  WARNING: Connected to PRODUCTION Supabase!")
elif 'gntqrebxmpdjyuxztwww' in supabase_url:
    logger.info("✅ Connected to DEV Supabase")
else:
    logger.warning(f"⚠️  WARNING: Unknown Supabase project: {supabase_url}")
logger.info("=" * 80)

supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()

# JENTIC INTEGRATION: Agent instance (created once at startup)
_agent_instance = None

def get_agent() -> BasslinePilatesCoachAgent:
    """
    JENTIC PATTERN: Dependency injection for agent

    Returns singleton instance of BasslinePilatesCoachAgent.
    The agent is initialized once with Supabase client and reused.
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = BasslinePilatesCoachAgent(supabase_client=supabase)
        logger.info("=" * 80)
        logger.info("🤖 AGENT INITIALIZATION")
        logger.info("=" * 80)
        logger.info(f"📦 Agent class: {type(_agent_instance).__module__}.{type(_agent_instance).__name__}")
        logger.info(f"📦 Agent base classes: {[c.__name__ for c in type(_agent_instance).__mro__]}")
        logger.info(f"🔧 Has reasoner: {hasattr(_agent_instance, 'reasoner')}")
        if hasattr(_agent_instance, 'reasoner'):
            logger.info(f"📦 Reasoner class: {type(_agent_instance.reasoner).__module__}.{type(_agent_instance.reasoner).__name__}")
        logger.info("=" * 80)
    return _agent_instance


def call_agent_tool(
    tool_id: str,
    parameters: dict,
    user_id: str,
    agent: BasslinePilatesCoachAgent
) -> dict:
    """
    JENTIC PATTERN: Call StandardAgent tool directly (no HTTP, just Python import)

    The agent provides access to all tools:
    - SequenceTools (sequencing business logic)
    - MusicTools (music selection logic)
    - MeditationTools (meditation generation logic)
    - ResearchTools (MCP research logic)

    Args:
        tool_id: Tool identifier ('generate_sequence', 'select_music', etc.)
        parameters: Tool input parameters
        user_id: Authenticated user ID
        agent: BasslinePilatesCoachAgent instance (injected)

    Returns:
        Tool execution result

    Raises:
        HTTPException: If tool execution fails
    """
    try:
        logger.info(f"Executing tool {tool_id} for user {user_id}")

        # Execute tool directly via BasslinePilatesTools.execute()
        # No need to create tool object - execute() takes tool_id string
        result = agent.tools.execute(tool_id, parameters)

        return {
            "success": True,
            "data": result
        }

    except ValueError as e:
        # Tool not found or invalid parameters
        logger.error(f"Tool execution validation error for user {user_id}, tool {tool_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=404 if "not found" in str(e).lower() else 400,
            detail=ErrorMessages.VALIDATION_ERROR
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        # Server-side logging with full error details
        logger.error(f"Tool {tool_id} execution failed for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.INTERNAL_ERROR
        )


def normalize_music_genre(frontend_value: str) -> str:
    """
    Normalize music genre from frontend format to analytics format

    Frontend sends: UPPERCASE with underscores (e.g., "IMPRESSIONIST", "CELTIC_TRADITIONAL")
    Analytics expects: Title case with spaces (e.g., "Impressionist", "Celtic Traditional")

    Args:
        frontend_value: Genre value from frontend form (e.g., "BAROQUE", "CONTEMPORARY")

    Returns:
        Normalized genre value for analytics (e.g., "Baroque", "Contemporary/Postmodern")
    """
    # Mapping from frontend values to analytics values
    genre_mapping = {
        'BAROQUE': 'Baroque',
        'CLASSICAL': 'Classical',
        'ROMANTIC': 'Romantic',
        'IMPRESSIONIST': 'Impressionist',
        'MODERN': 'Modern',
        'CONTEMPORARY': 'Contemporary/Postmodern',
        'JAZZ': 'Jazz',
        'CELTIC_TRADITIONAL': 'Celtic Traditional'
    }

    normalized = genre_mapping.get(frontend_value)

    if not normalized:
        # Fallback: convert to title case and replace underscores with spaces
        logger.warning(f"Unknown music genre '{frontend_value}' - using fallback normalization")
        normalized = frontend_value.replace('_', ' ').title()

    return normalized


def get_movement_muscle_groups(movement_id: str) -> list[str]:
    """
    Fetch muscle groups for a movement from movement_muscles junction table
    Returns list of muscle group names

    Uses denormalized schema with muscle_group_name directly in junction table
    """
    try:
        # Query movement_muscles table (has denormalized muscle_group_name column)
        # NOTE: Removed .eq('is_primary', True) filter - all rows have is_primary=False by default
        response = supabase.table('movement_muscles') \
            .select('muscle_group_name') \
            .eq('movement_id', movement_id) \
            .execute()

        if not response.data:
            return []

        # Extract muscle group names safely with .get()
        muscle_groups = [
            item.get('muscle_group_name', 'Unknown')
            for item in response.data
            if isinstance(item, dict) and item.get('muscle_group_name')
        ]
        return muscle_groups

    except Exception as e:
        logger.warning(f"Failed to fetch muscle groups for movement {movement_id}: {e}", exc_info=True)
        return []


@router.post("/generate-sequence", response_model=dict)
async def generate_sequence(
    request: SequenceGenerationRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Generate a Pilates movement sequence using SequenceTools via agent

    JENTIC PATTERN: Backend API → StandardAgent → SequenceTools

    - **target_duration_minutes**: Total class duration (15-120 minutes)
    - **difficulty_level**: Beginner, Intermediate, or Advanced
    - **focus_areas**: Optional muscle groups to emphasize
    - **strictness_level**: strict, guided, or autonomous
    - **include_mcp_research**: Whether to enhance with web research
    """
    try:
        logger.info(f"Generating sequence for user {user_id} via agent")
        logger.info(f"Request data: {request.dict()}")

        # PHASE 2: Add user_id to inputs for movement usage tracking
        inputs_with_user = request.dict()
        inputs_with_user['user_id'] = user_id

        # JENTIC INTEGRATION: Call agent's SequenceTools directly
        result = call_agent_tool(
            tool_id="generate_sequence",
            parameters=inputs_with_user,
            user_id=user_id,
            agent=agent
        )

        logger.info(f"Orchestrator result success: {result.get('success')}")

        if not result["success"]:
            logger.error(f"Orchestrator returned failure: {result}")
            raise HTTPException(
                status_code=500,
                detail=f"Sequence generation failed: {result.get('error')}"
            )

        # ============================================================================
        # ANALYTICS: Save generated class to database for analytics tracking
        # ============================================================================
        try:
            sequence_data = result.get('data', {})
            sequence = sequence_data.get('sequence', [])

            # Use user_id from request body (passed by frontend with real authenticated user ID)
            actual_user_id = inputs_with_user.get('user_id', user_id)

            if sequence and actual_user_id:
                now = datetime.now().isoformat()

                # Prepare movements_snapshot with muscle groups for analytics
                movements_for_history = []
                for idx, movement in enumerate(sequence):
                    if movement.get('type') == 'movement':
                        # Fetch muscle groups from junction table
                        muscle_groups = get_movement_muscle_groups(movement.get('id', ''))

                        movements_for_history.append({
                            "type": "movement",
                            "name": movement.get('name', ''),
                            "muscle_groups": muscle_groups,
                            "duration_seconds": movement.get('duration_seconds', 60),
                            "order_index": idx,
                            # Voiceover audio fields (Session 13.5)
                            "voiceover_url": movement.get('voiceover_url'),
                            "voiceover_duration_seconds": movement.get('voiceover_duration_seconds'),
                            "voiceover_enabled": movement.get('voiceover_enabled', False)
                        })

                # Save to class_plans table
                class_plan_data = {
                    'name': f"{request.difficulty_level} Pilates Class ({request.target_duration_minutes} min)",
                    'user_id': actual_user_id,
                    'movements': sequence,  # Full sequence with all details
                    'duration_minutes': request.target_duration_minutes,
                    'difficulty_level': request.difficulty_level,
                    'notes': f"AI-generated {request.difficulty_level} class",
                    'muscle_balance': sequence_data.get('muscle_balance', {}),
                    'validation_status': {
                        'valid': True,
                        'safety_score': 1.0,
                        'warnings': []
                    },
                    'created_at': now,
                    'updated_at': now
                }

                db_response = supabase.table('class_plans').insert(class_plan_data).execute()

                if db_response.data and len(db_response.data) > 0:
                    # Safely extract class_plan_id
                    class_plan_record = db_response.data[0]
                    class_plan_id = class_plan_record.get('id')

                    if not class_plan_id:
                        logger.warning("Class plan saved but no ID returned - skipping class_history save")
                    else:
                        logger.info(f"✅ Saved class to class_plans table (ID: {class_plan_id}) for user {actual_user_id}")

                        # Save to class_history table for analytics
                        class_history_entry = {
                            'class_plan_id': class_plan_id,
                            'user_id': actual_user_id,
                            'taught_date': datetime.now().date().isoformat(),
                            'actual_duration_minutes': request.target_duration_minutes,
                            'attendance_count': 1,  # Generated = 1 attendance (self)
                            'movements_snapshot': movements_for_history,  # With muscle groups!
                            'instructor_notes': f"AI-generated {request.difficulty_level} class",
                            'difficulty_rating': None,
                            'muscle_groups_targeted': [],
                            'total_movements_taught': len(movements_for_history),
                            'created_at': now
                        }

                        supabase.table('class_history').insert(class_history_entry).execute()
                        logger.info(f"✅ Saved to class_history table for analytics tracking (user {actual_user_id})")
                else:
                    logger.warning("No data returned from class_plans insert - class may not have been saved")

        except Exception as db_error:
            # Don't fail the request if database save fails
            logger.error(f"❌ Failed to save class to database: {db_error}", exc_info=True)

        logger.info("Database save block completed, preparing to return result")
        return result

    except HTTPException:
        raise  # Re-raise HTTPException from call_orchestrator_tool
    except KeyError as e:
        import traceback
        logger.error(f"KeyError in generate_sequence: {e}", exc_info=True)

        # Log to beta_errors table for transparency
        try:
            stack_trace = traceback.format_exc()
            supabase.rpc('log_beta_error', {
                'p_error_type': 'KEYERROR_BYPASS',
                'p_severity': 'MEDIUM',
                'p_endpoint': '/api/agents/generate-sequence',
                'p_error_message': f"KeyError: {str(e)}",
                'p_stack_trace': stack_trace,
                'p_user_id': user_id,
                'p_request_data': request.dict(),
                'p_response_data': result if 'result' in locals() else None,
                'p_was_bypassed': True,
                'p_bypass_reason': 'Sequence generation succeeded but response serialization failed. Returning successful result to maintain app functionality.',
                'p_user_notified': True  # Frontend will show beta notification
            }).execute()
        except Exception as log_error:
            logger.warning(f"Failed to log beta error: {log_error}")

        # Return successful result anyway - the sequence was generated
        if 'result' in locals() and result.get('success'):
            logger.info("Returning successful result despite KeyError (logged to beta_errors table)")
            return result
        # Server-side logging with full error details
        logger.error(f"KeyError in sequence generation for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.INTERNAL_ERROR)

    except ValueError as e:
        logger.error(f"Validation error in sequence generation for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=ErrorMessages.VALIDATION_ERROR)
    except Exception as e:
        logger.error(f"Sequence generation error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.INTERNAL_ERROR)


@router.post("/select-music", response_model=dict)
async def select_music(
    request: MusicSelectionRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Select music playlist for a Pilates class using MusicTools via agent

    JENTIC PATTERN: Backend API → StandardAgent → MusicTools

    - **class_duration_minutes**: Duration of the class
    - **energy_curve**: Optional energy levels throughout class (0.0-1.0)
    - **preferred_genres**: Optional list of preferred genres
    - **target_bpm_range**: Target BPM range (default: 90-130)
    """
    try:
        logger.info(f"Selecting music for user {user_id} via agent")

        # JENTIC INTEGRATION: Call agent's MusicTools directly
        result = call_agent_tool(
            tool_id="select_music",
            parameters=request.dict(),
            user_id=user_id,
            agent=agent
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Music selection failed: {result.get('error')}"
            )

        return result

    except HTTPException:
        raise  # Re-raise HTTPException from call_orchestrator_tool
    except ValueError as e:
        logger.error(f"Validation error in music selection for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=ErrorMessages.VALIDATION_ERROR)
    except Exception as e:
        logger.error(f"Music selection error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.INTERNAL_ERROR)


@router.post("/create-meditation", response_model=dict)
async def create_meditation(
    request: MeditationRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Generate a meditation/cool-down script using MeditationTools via agent

    JENTIC PATTERN: Backend API → StandardAgent → MeditationTools

    - **duration_minutes**: Duration of meditation (2-15 minutes)
    - **class_intensity**: low, moderate, or high
    - **focus_theme**: Optional theme (mindfulness, body_scan, gratitude)
    - **include_breathing**: Whether to include breathing guidance
    """
    try:
        logger.info(f"Creating meditation for user {user_id} via agent")

        # JENTIC INTEGRATION: Call agent's MeditationTools directly
        result = call_agent_tool(
            tool_id="generate_meditation",
            parameters=request.dict(),
            user_id=user_id,
            agent=agent
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Meditation creation failed: {result.get('error')}"
            )

        return result

    except HTTPException:
        raise  # Re-raise HTTPException from call_orchestrator_tool
    except ValueError as e:
        logger.error(f"Validation error in meditation creation for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=ErrorMessages.VALIDATION_ERROR)
    except Exception as e:
        logger.error(f"Meditation creation error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.INTERNAL_ERROR)


@router.post("/research-cues", response_model=dict)
async def research_cues(
    request: ResearchRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Perform web research using ResearchTools via agent and MCP Playwright

    JENTIC PATTERN: Backend API → StandardAgent → ResearchTools → MCP

    - **research_type**: movement_cues, warmup, pregnancy, injury, or trends
    - **movement_name**: Name of movement (for movement_cues, pregnancy, injury)
    - **target_muscles**: List of muscles (for warmup)
    - **condition**: Condition to research (for pregnancy, injury)
    - **trusted_sources_only**: Only use trusted Pilates websites
    """
    try:
        logger.info(f"Performing research for user {user_id} via agent: {request.research_type}")

        # JENTIC INTEGRATION: Call agent's ResearchTools directly
        result = call_agent_tool(
            tool_id="research_cues",
            parameters=request.dict(),
            user_id=user_id,
            agent=agent
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Research failed: {result.get('error')}"
            )

        return result

    except HTTPException:
        raise  # Re-raise HTTPException from call_orchestrator_tool
    except ValueError as e:
        logger.error(f"Validation error in research for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=ErrorMessages.VALIDATION_ERROR)
    except Exception as e:
        logger.error(f"Research error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.INTERNAL_ERROR)


@router.post("/generate-complete-class", response_model=dict)
async def generate_complete_class(
    request: CompleteClassRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Generate a complete class with all 6 sections (Default vs Reasoner Mode)

    JENTIC PATTERN: Orchestrates all tools via StandardAgent to create full class plan

    DUAL MODE ARCHITECTURE:
    - Default Mode: Fast, free, database-driven ($0.00/class)
    - Reasoner Mode: AI-powered, personalized ($0.03-0.05/class) [Phase 2]

    This endpoint checks user_preferences.use_reasoner_mode to determine which mode to use.
    """
    try:
        logger.info(f"Generating complete class for user {user_id} via agent")

        import time
        start_time = time.time()

        # ============================================================================
        # CHECK USER MODE: Default vs AI Agent
        # ============================================================================
        try:
            user_prefs_response = supabase.table('user_preferences') \
                .select('use_ai_agent') \
                .eq('user_id', user_id) \
                .single() \
                .execute()

            use_ai_agent = user_prefs_response.data.get('use_ai_agent', False) if user_prefs_response.data else False
            logger.info(f"🔍 User ID: {user_id}")
            logger.info(f"🔍 use_ai_agent preference: {use_ai_agent}")
            logger.info(f"🎯 Selected mode: {'AI AGENT (ReWOO)' if use_ai_agent else 'DEFAULT (Direct DB)'}")
        except Exception as e:
            logger.warning(f"❌ Could not fetch user preferences: {e}. Defaulting to DEFAULT mode.")
            use_ai_agent = False

        # ============================================================================
        # AI AGENT MODE: ReWOO Reasoning (Plan→Execute→Reflect)
        # ============================================================================
        if use_ai_agent:
            logger.info("=" * 80)
            logger.info("🤖 AI AGENT MODE ACTIVATED - ReWOO Reasoning")
            logger.info("=" * 80)
            logger.info("📊 Expected cost: ~$0.12 (OpenAI GPT-4)")
            logger.info("⏱️  Expected duration: 5-10 seconds")
            logger.info("🔧 Using: SimplifiedStandardAgent with ReWOO reasoner")
            logger.info("=" * 80)

            # Build comprehensive goal for the agent
            goal = f"""
Create a complete {request.class_plan.difficulty_level} Pilates class with all 6 sections:

REQUIREMENTS:
- Duration: {request.class_plan.target_duration_minutes} minutes total
- Difficulty: {request.class_plan.difficulty_level}
- Focus areas: {', '.join(request.class_plan.focus_areas) if request.class_plan.focus_areas else 'balanced full body'}

SECTIONS NEEDED:
1. Preparation script (breathing, centering, Pilates principles)
2. Warmup routine (prepare muscles for main sequence)
3. Main movement sequence (classical Pilates exercises with safety rules)
4. Cooldown sequence (gentle stretching and recovery)
5. Closing meditation (body scan and restoration)
6. Homecare advice (actionable tips for between classes)

CRITICAL:
- All 6 sections must work together as a cohesive class experience
- Warmup and cooldown should complement the muscles used in main sequence
- Maintain classical Pilates safety rules (spinal progression, muscle balance)
- Total duration must match {request.class_plan.target_duration_minutes} minutes

OUTPUT:
Return all 6 sections with complete details (narrative, timing, instructions).
            """.strip()

            try:
                # Use SimplifiedStandardAgent's solve() method
                # This triggers Plan→Execute→Reflect reasoning loop
                result = agent.solve(goal)

                if not result.success:
                    logger.error(f"AI reasoning failed: {result.error_message}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"AI Agent reasoning failed: {result.error_message}"
                    )

                # Calculate total processing time
                total_time_ms = (time.time() - start_time) * 1000

                # Extract the final answer from reasoning result
                logger.info("=" * 80)
                logger.info("✅ AI AGENT EXECUTION COMPLETED")
                logger.info("=" * 80)
                logger.info(f"🔄 Iterations: {result.iterations}")
                logger.info(f"⏱️  Processing time: {total_time_ms:.0f}ms")
                logger.info(f"📦 Result namespace: {type(result).__module__}.{type(result).__name__}")
                logger.info(f"🔧 Steps executed: {len(result.steps) if hasattr(result, 'steps') else 0}")
                logger.info("=" * 80)

                # ============================================================
                # EXTRACT TOOL RESULTS FROM REWOO STEPS
                # ============================================================
                # The AI reasoning produced steps with tool results.
                # Extract them to match the DEFAULT mode response structure.

                logger.info(f"🔍 Result type: {type(result)}")
                logger.info(f"🔍 Result attributes: {dir(result)}")
                logger.info(f"🔍 Result success: {result.success}")
                logger.info(f"🔍 Result iterations: {result.iterations}")

                # Check if steps attribute exists
                if not hasattr(result, 'steps'):
                    logger.error("❌ ReasoningResult missing 'steps' attribute")
                    raise ValueError("AI reasoning result is malformed - missing steps data")

                steps = result.steps
                logger.info(f"🔍 Steps type: {type(steps)}")
                logger.info(f"🔍 Steps count: {len(steps) if steps else 0}")

                preparation = None
                warmup = None
                sequence_result = None
                cooldown = None
                meditation = None
                homecare = None
                music_result = None

                logger.info("🔧 TOOL EXECUTION RESULTS:")
                for i, step in enumerate(steps):
                    status_icon = "✅" if (step.result and not step.error) else "❌"
                    logger.info(f"  {status_icon} Step {i+1}: {step.tool_id}")
                    if step.error:
                        logger.info(f"      ERROR: {step.error[:100]}")
                    elif step.result:
                        result_preview = str(step.result)[:150] if step.result else "None"
                        logger.info(f"      RESULT: {result_preview}...")

                    if step.result and not step.error:
                        tool_id = step.tool_id

                        # Match both SELECT (DEFAULT) and GENERATE/RESEARCH (AI) tool variants
                        if tool_id in ("select_preparation", "generate_preparation"):
                            preparation = step.result
                        elif tool_id in ("select_warmup", "research_warmup"):
                            warmup = step.result
                        elif tool_id == "generate_sequence":
                            sequence_result = {"success": True, "data": step.result}
                        elif tool_id in ("select_cooldown", "research_cooldown"):
                            cooldown = step.result
                        elif tool_id == "generate_meditation":
                            meditation = step.result
                        elif tool_id in ("select_homecare", "generate_homecare"):
                            homecare = step.result
                        elif tool_id == "select_music":
                            music_result = {"success": True, "data": step.result}

                # Log final sections assembled
                logger.info("=" * 80)
                logger.info("📋 FINAL CLASS ASSEMBLY:")
                logger.info(f"  Section 1 (Preparation): {'✅' if preparation else '❌'}")
                logger.info(f"  Section 2 (Warmup): {'✅' if warmup else '❌'}")
                logger.info(f"  Section 3 (Sequence): {'✅' if sequence_result else '❌'}")
                logger.info(f"  Section 4 (Cooldown): {'✅' if cooldown else '❌'}")
                logger.info(f"  Section 5 (Meditation): {'✅' if meditation else '❌'}")
                logger.info(f"  Section 6 (Homecare): {'✅' if homecare else '❌'}")
                logger.info("=" * 80)

                # Return in SAME format as DEFAULT mode (so frontend works)
                return {
                    "success": True,
                    "data": {
                        "preparation": preparation,
                        "warmup": warmup,
                        "sequence": sequence_result,
                        "cooldown": cooldown,
                        "meditation": meditation,
                        "homecare": homecare,
                        "music_recommendation": music_result,
                        "research_enhancements": None,  # Not used in AI mode yet
                        "total_processing_time_ms": total_time_ms,
                        # Include AI reasoning details for debugging/transparency
                        "ai_reasoning": {
                            "iterations": result.iterations,
                            "steps_executed": len(result.steps),
                            "final_answer": result.final_answer[:500]  # Truncate for brevity
                        }
                    },
                    "metadata": {
                        "mode": "ai_agent",
                        "cost": 0.12,  # Approximate GPT-4 cost for full reasoning
                        "generated_at": datetime.now().isoformat(),
                        "user_id": user_id,
                        "sections_included": 6,
                        "reasoning_iterations": result.iterations,
                        "orchestration": "jentic_rewoo_reasoner"
                    }
                }

            except Exception as ai_error:
                logger.error(f"AI Agent error: {ai_error}", exc_info=True)
                # Fall back to DEFAULT mode if AI fails
                logger.warning("AI Agent failed, falling back to DEFAULT mode")
                use_ai_agent = False

        # ============================================================================
        # DEFAULT MODE: Direct Database Selection (Phase 1 - CURRENT)
        # ============================================================================
        logger.info("=" * 80)
        logger.info("🔵 DEFAULT MODE - Direct Database Selection")
        logger.info("=" * 80)
        logger.info("📊 Cost: $0.00 (no AI, database only)")
        logger.info("⏱️  Duration: <1 second")
        logger.info("🔧 Using: Direct Supabase queries")
        logger.info("=" * 80)

        # Step 0: Generate class_plan_id BEFORE sequence generation
        # This UUID will be used for quality logging reconciliation
        class_plan_id = str(uuid.uuid4())
        logger.info(f"🆔 Generated class_plan_id: {class_plan_id}")

        # Step 1: Generate main sequence (existing behavior)
        # CRITICAL: Add user_id AND class_plan_id to parameters for quality logging
        sequence_params = request.class_plan.dict()
        sequence_params['user_id'] = user_id
        sequence_params['class_plan_id'] = class_plan_id  # NEW: Pass for quality logging

        sequence_result = call_agent_tool(
            tool_id="generate_sequence",
            parameters=sequence_params,
            user_id=user_id,
            agent=agent
        )

        if not sequence_result["success"]:
            raise HTTPException(
                status_code=500,
                detail="Sequence generation failed"
            )

        # Extract muscle groups from generated sequence
        sequence_data = sequence_result.get("data", {})
        muscle_balance = sequence_data.get("muscle_balance", {})
        target_muscles = list(muscle_balance.keys()) if muscle_balance else []

        logger.info(f"Target muscles from sequence: {target_muscles}")

        # SPECIAL CASE: 12-minute "Quick movement practice" - Skip all 6 sections
        # User requirement: "Just 3 movements for daily practice, no warmup/cooldown/prep"
        is_quick_practice = request.class_plan.target_duration_minutes == 12

        if is_quick_practice:
            logger.info("✅ 12-minute quick practice: Skipping all 6 sections (movements only)")
            preparation = None
            warmup = None
            cooldown = None
            meditation = None
            homecare = None
            music_result = None  # No music selection for quick practice
            research_results = []  # No research for quick practice
            # NOTE: Do NOT return early - continue to class_history save below!
        else:
            # Step 2: Select preparation script (Section 1)
            try:
                prep_response = supabase.table('preparation_scripts') \
                    .select('*') \
                    .limit(1) \
                    .execute()

                preparation = prep_response.data[0] if prep_response.data else None
                logger.info(f"Selected preparation: {preparation.get('script_name') if preparation else 'None'}")
                # DEBUG: Check voiceover and video data in database response
                if preparation:
                    logger.info(f"🎙️ DEBUG: Preparation voiceover_enabled: {preparation.get('voiceover_enabled')}")
                    logger.info(f"🎙️ DEBUG: Preparation voiceover_url: {preparation.get('voiceover_url')}")
                    logger.info(f"🎙️ DEBUG: Preparation voiceover_duration: {preparation.get('voiceover_duration')}")
                    logger.info(f"🎥 DEBUG: Preparation video_url: {preparation.get('video_url')}")
                    logger.info(f"🔍 DEBUG: Preparation fields: {list(preparation.keys())}")
            except Exception as e:
                logger.error(f"Failed to fetch preparation script: {e}")
                preparation = None

            # Step 3: Select warm-up routine (Section 2)
            # NOTE: Migration 019 left only ONE warmup: "Comprehensive Full Body Warm-up"
            # So we can just select it directly (no need for RPC function)
            try:
                warmup_response = supabase.table('warmup_routines') \
                    .select('*') \
                    .eq('routine_name', 'Comprehensive Full Body Warm-up') \
                    .limit(1) \
                    .execute()

                warmup = warmup_response.data[0] if warmup_response.data else None
                logger.info(f"Selected warmup: {warmup.get('routine_name') if warmup else 'None'}")
                # DEBUG: Check voiceover and video data in database response
                if warmup:
                    logger.info(f"🎙️ DEBUG: Warmup voiceover_enabled: {warmup.get('voiceover_enabled')}")
                    logger.info(f"🎙️ DEBUG: Warmup voiceover_url: {warmup.get('voiceover_url')}")
                    logger.info(f"🎙️ DEBUG: Warmup voiceover_duration: {warmup.get('voiceover_duration')}")
                    logger.info(f"🎥 DEBUG: Warmup video_url: {warmup.get('video_url')}")
                    logger.info(f"🔍 DEBUG: Warmup fields: {list(warmup.keys())}")
            except Exception as e:
                logger.error(f"Failed to fetch warmup routine: {e}")
                warmup = None

            # Step 4: Main movements (Section 3) - Already generated above
            # The sequence_result contains the main movements

            # Step 5: Select cool-down sequence (Section 4)
            # Use "Full Body Recovery" as default cooldown (actual name in database)
            try:
                cooldown_response = supabase.table('cooldown_sequences') \
                    .select('*') \
                    .eq('sequence_name', 'Full Body Recovery') \
                    .limit(1) \
                    .execute()

                cooldown = cooldown_response.data[0] if cooldown_response.data else None
                logger.info(f"Selected cooldown: {cooldown.get('sequence_name') if cooldown else 'None'}")
            except Exception as e:
                logger.error(f"Failed to fetch cooldown sequence: {e}")
                cooldown = None

            # Step 6: Select meditation (Section 5)
            # For 30-min classes: skip meditation to allow more movements
            include_meditation = request.class_plan.target_duration_minutes > 30
            meditation = None

            if include_meditation:
                try:
                    meditation_response = supabase.table('closing_meditation_scripts') \
                        .select('*') \
                        .eq('post_intensity', 'moderate') \
                        .limit(1) \
                        .execute()

                    meditation = meditation_response.data[0] if meditation_response.data else None
                    logger.info(f"Selected meditation: {meditation.get('script_name') if meditation else 'None'}")
                except Exception as e:
                    logger.error(f"Failed to fetch meditation script: {e}")
                    meditation = None
            else:
                logger.info(f"⏭️  Skipping meditation for {request.class_plan.target_duration_minutes}-min class (meditation only for classes > 30 min)")

            # Step 7: Select homecare advice (Section 6)
            try:
                homecare_response = supabase.table('closing_homecare_advice') \
                    .select('*') \
                    .limit(1) \
                    .execute()

                homecare = homecare_response.data[0] if homecare_response.data else None
                logger.info(f"Selected homecare: {homecare.get('advice_name') if homecare else 'None'}")
            except Exception as e:
                logger.error(f"Failed to fetch homecare advice: {e}")
                homecare = None

            # Step 8: Select music (if requested)
            music_result = None
            selected_music_genre = None  # Track for analytics (movement music)
            selected_cooldown_music_genre = None  # Track for analytics (cooldown music)
            if request.include_music:
                music_input = {
                    "class_duration_minutes": request.class_plan.target_duration_minutes,
                    "target_bpm_range": (90, 130)
                }
                # Add preferred music styles if provided (for analytics tracking)
                if request.preferred_music_style:
                    music_input["preferred_genres"] = [request.preferred_music_style]
                    # ANALYTICS FIX: Normalize frontend format to analytics format
                    selected_music_genre = normalize_music_genre(request.preferred_music_style)
                    logger.info(f"Movement music genre: {request.preferred_music_style} → {selected_music_genre}")
                if request.cooldown_music_style:
                    # ANALYTICS FIX: Normalize frontend format to analytics format
                    selected_cooldown_music_genre = normalize_music_genre(request.cooldown_music_style)
                    logger.info(f"Cooldown music genre: {request.cooldown_music_style} → {selected_cooldown_music_genre}")

                music_result = call_agent_tool(
                    tool_id="select_music",
                    parameters=music_input,
                    user_id=user_id,
                    agent=agent
                )

            # Step 9: Perform research enhancements (if requested)
            research_results = []
            if request.include_research:
                # Research first few movements
                movements = sequence_data.get("sequence", [])[:3]

                for movement in movements:
                    research_input = {
                        "research_type": "movement_cues",
                        "movement_name": movement.get("name"),
                        "trusted_sources_only": True
                    }
                    research_result = call_agent_tool(
                        tool_id="research_cues",
                        parameters=research_input,
                        user_id=user_id,
                        agent=agent
                    )
                    if research_result["success"]:
                        research_results.append(research_result)

        # Calculate total processing time
        total_time_ms = (time.time() - start_time) * 1000

        # ============================================================================
        # ANALYTICS: Save complete class to class_history for analytics tracking
        # ============================================================================
        try:
            logger.info("📊 ANALYTICS: Starting database save (SCHEMA FIXED)")
            now = datetime.now().isoformat()

            # Extract movements from sequence for analytics
            sequence_data = sequence_result.get("data", {})
            sequence = sequence_data.get("sequence", [])

            movements_for_history = []
            for idx, movement in enumerate(sequence):
                if movement.get('type') == 'movement':
                    # Fetch muscle groups from junction table
                    muscle_groups = get_movement_muscle_groups(movement.get('id', ''))

                    movements_for_history.append({
                        "type": "movement",
                        "name": movement.get('name', ''),
                        "muscle_groups": muscle_groups,
                        "duration_seconds": movement.get('duration_seconds', 60),
                        "order_index": idx,
                        "voiceover_url": movement.get('voiceover_url'),
                        "voiceover_duration_seconds": movement.get('voiceover_duration_seconds'),
                        "voiceover_enabled": movement.get('voiceover_enabled', False)
                    })

            # Save to class_plans table first (SCHEMA CORRECTED)
            class_plan_data = {
                # NEW: Use pre-generated UUID for reconciliation with quality logs
                'id': class_plan_id,
                # SCHEMA FIX: Use 'title' not 'name'
                'title': f"{request.class_plan.difficulty_level} Pilates Class ({request.class_plan.target_duration_minutes} min)",
                'user_id': user_id,
                # SCHEMA FIX: Use 'main_sequence' not 'movements'
                'main_sequence': sequence,
                'duration_minutes': request.class_plan.target_duration_minutes,
                'difficulty_level': request.class_plan.difficulty_level,
                'total_movements': len(movements_for_history),
                'generated_by_ai': False,  # DEFAULT mode is database-driven
                'created_at': now,
                'updated_at': now
            }

            db_response = supabase.table('class_plans').insert(class_plan_data).execute()

            if db_response.data and len(db_response.data) > 0:
                # Verify the same class_plan_id was used
                inserted_id = db_response.data[0].get('id')
                logger.info(f"✅ Saved complete class to class_plans (ID: {inserted_id})")
                if inserted_id != class_plan_id:
                    logger.error(f"⚠️ WARNING: Inserted ID ({inserted_id}) doesn't match pre-generated ID ({class_plan_id})!")

                # Save to class_history with music_genre for analytics (SCHEMA CORRECTED)
                # SCHEMA FIX: muscle_groups_targeted is JSONB array, not object keys
                muscle_groups_array = list(sequence_data.get('muscle_balance', {}).keys())

                class_history_entry = {
                    'class_plan_id': class_plan_id,
                    'user_id': user_id,
                    'taught_date': datetime.now().date().isoformat(),
                    'actual_duration_minutes': request.class_plan.target_duration_minutes,
                    'attendance_count': 1,
                    'movements_snapshot': movements_for_history,
                    'instructor_notes': f"Complete class with all 6 sections. Movement music: {selected_music_genre or 'None'}, Cooldown music: {selected_cooldown_music_genre or 'None'}",
                    'difficulty_rating': None,
                    # SCHEMA FIX: Use array format
                    'muscle_groups_targeted': muscle_groups_array,
                    'total_movements_taught': len(movements_for_history),
                    # ANALYTICS: Save BOTH music genres! (migration 020 + 023)
                    'music_genre': selected_music_genre,  # Movement music (sections 1-3)
                    'cooldown_music_genre': selected_cooldown_music_genre,  # Cooldown music (sections 4-6)
                    'created_at': now
                }

                supabase.table('class_history').insert(class_history_entry).execute()
                logger.info(f"✅ Saved to class_history with music_genre: {selected_music_genre}")
                logger.info("📊 ANALYTICS: Database save completed successfully")

        except Exception as db_error:
            # Don't fail the request if analytics save fails
            logger.error(f"❌ ANALYTICS SAVE FAILED: {db_error}", exc_info=True)
            logger.error(f"❌ Error type: {type(db_error).__name__}")
            logger.error(f"❌ This is non-critical - class generation will continue")

        # DEBUG: Verify what's being sent to frontend
        logger.info("=" * 80)
        logger.info("🎙️🎥 DEBUG: FINAL RESPONSE CHECK")
        logger.info("=" * 80)
        if preparation:
            logger.info(f"🎙️ Preparation voiceover_enabled: {preparation.get('voiceover_enabled')}")
            logger.info(f"🎙️ Preparation voiceover_url: {preparation.get('voiceover_url')}")
            logger.info(f"🎥 Preparation video_url: {preparation.get('video_url')}")
        else:
            logger.info("❌ Preparation is None")
        if warmup:
            logger.info(f"🎙️ Warmup voiceover_enabled: {warmup.get('voiceover_enabled')}")
            logger.info(f"🎙️ Warmup voiceover_url: {warmup.get('voiceover_url')}")
            logger.info(f"🎥 Warmup video_url: {warmup.get('video_url')}")
        else:
            logger.info("❌ Warmup is None")
        logger.info("=" * 80)

        # DEBUG: Log data types before assembly
        logger.info("🔍 PRE-ASSEMBLY TYPE CHECK:")
        logger.info(f"  preparation: {type(preparation)}")
        logger.info(f"  warmup: {type(warmup)}")
        logger.info(f"  sequence_result: {type(sequence_result)}")
        logger.info(f"  cooldown: {type(cooldown)}")
        logger.info(f"  meditation: {type(meditation)}")
        logger.info(f"  homecare: {type(homecare)}")
        logger.info(f"  music_result: {type(music_result)}")
        logger.info(f"  research_results: {type(research_results)}")

        # Assemble complete class response with all 6 sections
        try:
            logger.info("🏗️ Building response dict...")
            response_dict = {
                "success": True,
                "data": {
                    "preparation": preparation,
                    "warmup": warmup,
                    "sequence": sequence_result,
                    "cooldown": cooldown,
                    "meditation": meditation,
                    "homecare": homecare,
                    "music_recommendation": music_result,
                    "research_enhancements": research_results if research_results else None,
                    "total_processing_time_ms": total_time_ms
                },
                "metadata": {
                    "mode": "default",
                    "cost": 0.00,
                    "generated_at": datetime.now().isoformat(),
                    "user_id": user_id,
                    "sections_included": 6,
                    "agents_used": ["sequence", "music", "meditation", "research"] if request.include_research else ["sequence", "music", "meditation"],
                    "orchestration": "jentic_standard_agent"
                }
            }
            logger.info("✅ Response dict built successfully")
            return response_dict
        except Exception as assembly_error:
            logger.error(f"❌ Error assembling response dict: {assembly_error}", exc_info=True)
            raise

    except HTTPException:
        raise  # Re-raise HTTPException from call_orchestrator_tool
    except Exception as e:
        logger.error(f"Complete class generation error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.INTERNAL_ERROR)


@router.get("/agent-info")
async def get_agent_info(agent: BasslinePilatesCoachAgent = Depends(get_agent)):
    """
    Get information about all available tools via agent

    JENTIC PATTERN: Reports on StandardAgent's available tools
    """
    try:
        tools_list = agent.tools.list_tools()

        # Convert tools info to agent-like structure for backward compatibility
        return {
            "agents": {
                "sequence": {
                    "name": "SequenceTools",
                    "description": "Pilates movement sequencing with safety rules",
                    "available": any(t["id"] == "generate_sequence" for t in tools_list)
                },
                "music": {
                    "name": "MusicTools",
                    "description": "Music selection and playlist building",
                    "available": any(t["id"] == "select_music" for t in tools_list)
                },
                "meditation": {
                    "name": "MeditationTools",
                    "description": "Meditation script generation",
                    "available": any(t["id"] == "generate_meditation" for t in tools_list)
                },
                "research": {
                    "name": "ResearchTools",
                    "description": "Web research via MCP Playwright",
                    "available": any(t["id"] == "research_cues" for t in tools_list)
                }
            },
            "agent": {
                "type": "BasslinePilatesCoachAgent",
                "architecture": "jentic_standard_agent",
                "tools_count": len(tools_list),
                "deployment": "integrated (Option A)"
            }
        }

    except Exception as e:
        logger.error(f"Failed to get agent info: {e}")
        # Return fallback info
        return {
            "agents": {
                "sequence": {"name": "SequenceTools", "available": False},
                "music": {"name": "MusicTools", "available": False},
                "meditation": {"name": "MeditationTools", "available": False},
                "research": {"name": "ResearchTools", "available": False}
            },
            "agent": {
                "type": "BasslinePilatesCoachAgent",
                "status": "unavailable",
                "error": str(e)
            }
        }


@router.get("/decisions/{user_id}")
async def get_user_decisions(
    user_id: str,
    limit: int = 10,
    agent_type: Optional[str] = None
):
    """
    Get user's agent decision history (EU AI Act transparency)

    - **user_id**: User ID to query
    - **limit**: Number of recent decisions to return
    - **agent_type**: Optional filter by agent type
    """
    # This would query the ai_decision_log table
    # Placeholder implementation
    return {
        "user_id": user_id,
        "decisions": [],
        "message": "Decision logging will be available once database tables are created"
    }
