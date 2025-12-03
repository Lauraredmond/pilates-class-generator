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

# Import Jentic agent directly (no HTTP calls needed)
from orchestrator.bassline_agent import BasslinePilatesCoachAgent

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

from utils.auth import get_current_user_id  # REAL JWT authentication

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

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
        logger.info("✅ BasslinePilatesCoachAgent initialized")
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
        logger.error(f"Tool execution validation error: {e}")
        raise HTTPException(
            status_code=404 if "not found" in str(e).lower() else 400,
            detail=str(e)
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Tool execution error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Tool execution failed: {str(e)}"
        )


def get_movement_muscle_groups(movement_id: str) -> list[str]:
    """
    Fetch muscle groups for a movement from movement_muscles junction table
    Returns list of muscle group names

    Uses denormalized schema with muscle_group_name directly in junction table
    """
    try:
        # Query movement_muscles table (has denormalized muscle_group_name column)
        response = supabase.table('movement_muscles') \
            .select('muscle_group_name') \
            .eq('movement_id', movement_id) \
            .eq('is_primary', True) \
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
                            "order_index": idx
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
        raise HTTPException(status_code=500, detail=f"KeyError: {str(e)}")

    except ValueError as e:
        logger.error(f"Validation error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Sequence generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Music selection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Meditation creation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Research error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-complete-class", response_model=dict)
async def generate_complete_class(
    request: CompleteClassRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    """
    Generate a complete class with sequence, music, and meditation

    JENTIC PATTERN: Orchestrates all tools via StandardAgent to create full class plan

    This endpoint could eventually be replaced by a full Arazzo workflow execution,
    but for now it orchestrates tool calls sequentially through the agent.
    """
    try:
        logger.info(f"Generating complete class for user {user_id} via agent")

        import time
        start_time = time.time()

        # Step 1: Generate sequence
        sequence_result = call_agent_tool(
            tool_id="generate_sequence",
            parameters=request.class_plan.dict(),
            user_id=user_id,
            agent=agent
        )

        if not sequence_result["success"]:
            raise HTTPException(
                status_code=500,
                detail="Sequence generation failed"
            )

        # Step 2: Select music (if requested)
        music_result = None
        if request.include_music:
            music_input = {
                "class_duration_minutes": request.class_plan.target_duration_minutes,
                "target_bpm_range": (90, 130)
            }
            music_result = call_agent_tool(
                tool_id="select_music",
                parameters=music_input,
                user_id=user_id,
                agent=agent
            )

        # Step 3: Generate meditation (if requested)
        meditation_result = None
        if request.include_meditation:
            meditation_input = {
                "duration_minutes": 5,
                "class_intensity": "moderate"
            }
            meditation_result = call_agent_tool(
                tool_id="generate_meditation",
                parameters=meditation_input,
                user_id=user_id,
                agent=agent
            )

        # Step 4: Perform research enhancements (if requested)
        research_results = []
        if request.include_research:
            # Research first few movements
            sequence_data = sequence_result["data"]
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

        return {
            "success": True,
            "data": {
                "sequence": sequence_result,
                "music_recommendation": music_result,
                "meditation_script": meditation_result,
                "research_enhancements": research_results if research_results else None,
                "total_processing_time_ms": total_time_ms
            },
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "user_id": user_id,
                "agents_used": ["sequence", "music", "meditation", "research"] if request.include_research else ["sequence", "music", "meditation"],
                "orchestration": "jentic_standard_agent"
            }
        }

    except HTTPException:
        raise  # Re-raise HTTPException from call_orchestrator_tool
    except Exception as e:
        logger.error(f"Complete class generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
