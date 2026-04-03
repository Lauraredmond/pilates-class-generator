"""
Agent Gateway API Router
Simplified AI-agent-friendly endpoints that orchestrate existing backend
Optimized for Jentic/OpenClaw integration
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import List, Optional
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Import existing utilities
from utils.auth import (
    get_current_user_id,
    create_token_pair,
    hash_password,
    verify_password
)
from utils.logger import get_logger

# Import agent gateway models
from models.agent_gateway import (
    # Auth
    AgentLoginRequest,
    AgentRegisterRequest,
    AgentAuthResponse,
    AgentUserProfile,
    # Classes
    AgentGenerateClassRequest,
    AgentClassResponse,
    AgentMovementSummary,
    AgentMusicSummary,
    AgentSavedClass,
    # Analytics
    AgentAnalyticsSummary,
    AgentTimeSeriesData,
    AgentPracticeFrequencyData,
    AgentDifficultyProgressionData,
    AgentMuscleDistributionData,
    AgentMovementFamilyDistributionData,
    AgentPlayStatistics,
    # Movements
    AgentMovementDetail,
    # Music
    AgentMusicPlaylist,
    # Common
    AgentSuccessResponse,
    AgentErrorResponse
)

load_dotenv()
logger = get_logger(__name__)

router = APIRouter(
    prefix="/api/agent",
    tags=["Agent Gateway"]
)

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================================
# AUTHENTICATION
# ============================================================================

@router.post(
    "/auth/login",
    response_model=AgentAuthResponse,
    summary="Login (Agent Simplified)",
    description="Authenticate user and return JWT token. Simpler than /api/auth/login."
)
async def agent_login(request: AgentLoginRequest):
    """
    Simplified login for AI agents

    Returns only essential fields: access_token, user_id, email
    """
    try:
        # Fetch user from database
        result = supabase.table("user_profiles")\
            .select("id, email, hashed_password")\
            .eq("email", request.email)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        user = result.data[0]

        # Verify password
        if not verify_password(request.password, user["hashed_password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Create token
        token_data = create_token_pair(user["id"])

        return AgentAuthResponse(
            access_token=token_data["access_token"],
            user_id=str(user["id"]),
            email=user["email"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent login failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )


@router.post(
    "/auth/register",
    response_model=AgentAuthResponse,
    summary="Register (Agent Simplified)",
    description="Create new user account. Simpler than /api/auth/register."
)
async def agent_register(request: AgentRegisterRequest):
    """
    Simplified registration for AI agents

    Creates user account and returns JWT token immediately
    """
    try:
        # Check if user exists
        existing = supabase.table("user_profiles")\
            .select("id")\
            .eq("email", request.email)\
            .execute()

        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Create user
        hashed_password = hash_password(request.password)
        user_data = {
            "email": request.email,
            "hashed_password": hashed_password,
            "full_name": request.full_name,
            "created_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("user_profiles").insert(user_data).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user"
            )

        user = result.data[0]

        # Create token
        token_data = create_token_pair(user["id"])

        logger.info(f"New user registered via agent gateway: {user['email']}")

        return AgentAuthResponse(
            access_token=token_data["access_token"],
            user_id=str(user["id"]),
            email=user["email"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent registration failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )


@router.get(
    "/auth/me",
    response_model=AgentUserProfile,
    summary="Get Current User (Agent Simplified)",
    description="Get authenticated user profile with essential stats only."
)
async def agent_get_me(user_id: str = Depends(get_current_user_id)):
    """
    Get current user profile - simplified for agents

    Returns only essential fields: user_id, email, full_name, total_classes, current_level
    """
    try:
        # Fetch user
        user_result = supabase.table("user_profiles")\
            .select("id, email, full_name")\
            .eq("id", user_id)\
            .single()\
            .execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_result.data

        # Fetch user preferences for stats
        prefs_result = supabase.table("user_preferences")\
            .select("classes_completed, experience_level")\
            .eq("user_id", user_id)\
            .execute()

        total_classes = 0
        current_level = "Beginner"

        if prefs_result.data:
            prefs = prefs_result.data[0]
            total_classes = prefs.get("classes_completed", 0)
            current_level = prefs.get("experience_level", "beginner").title()

        return AgentUserProfile(
            user_id=str(user["id"]),
            email=user["email"],
            full_name=user.get("full_name"),
            total_classes=total_classes,
            current_level=current_level
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent get profile failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch profile"
        )


# ============================================================================
# CLASS GENERATION & MANAGEMENT
# ============================================================================

@router.post(
    "/classes/generate",
    response_model=AgentClassResponse,
    summary="Generate Pilates Class (Agent Entry Point)",
    description="High-level endpoint to generate a complete Pilates class. Orchestrates sequence generation, music selection, and meditation script."
)
async def agent_generate_class(
    request: AgentGenerateClassRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate complete Pilates class - MAIN AGENT WORKFLOW

    This is the primary entry point for AI agents to generate classes.
    Calls existing /api/classes/generate internally but returns simplified response.
    """
    try:
        # Call existing class generation endpoint
        # Import here to avoid circular dependency
        from api.classes import generate_class, ClassGenerationRequest

        # Convert agent request to internal request
        internal_request = ClassGenerationRequest(
            user_id=user_id,
            duration_minutes=request.duration_minutes,
            difficulty=request.difficulty_level,
            use_agent=False  # Use direct API by default (free)
        )

        # Generate class
        result = await generate_class(internal_request)

        # Extract movements from result
        class_plan = result.class_plan
        movements_data = class_plan.get("movements", [])

        # Convert to agent format
        movements = [
            AgentMovementSummary(
                name=m.get("movement_name", "Unknown"),
                duration_seconds=m.get("duration_seconds", 60),
                difficulty_level=request.difficulty_level,
                primary_muscles=["Core"]  # TODO: Fetch from database
            )
            for m in movements_data
        ]

        # Music summary (placeholder - TODO: integrate music selection)
        music_summary = None
        if request.include_music:
            music_summary = AgentMusicSummary(
                total_tracks=8,
                total_duration_seconds=request.duration_minutes * 60,
                genres=["Classical"]
            )

        return AgentClassResponse(
            class_id=class_plan.get("id", "pending"),
            duration_minutes=request.duration_minutes,
            difficulty_level=request.difficulty_level,
            movement_count=len(movements),
            movements=movements,
            has_music=request.include_music,
            has_meditation=request.include_meditation,
            music=music_summary,
            created_at=datetime.utcnow().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent class generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate class"
        )


@router.get(
    "/classes",
    response_model=List[AgentSavedClass],
    summary="List User's Saved Classes (Agent Simplified)",
    description="Get all saved classes for authenticated user. Returns simplified summaries only."
)
async def agent_list_classes(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    List user's saved classes - simplified for agents

    Returns only essential fields for each class
    """
    try:
        result = supabase.table("class_plans")\
            .select("id, duration_minutes, difficulty_level, created_at, updated_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        classes = [
            AgentSavedClass(
                class_id=str(c["id"]),
                duration_minutes=c.get("duration_minutes", 0),
                difficulty_level=c.get("difficulty_level", "Beginner"),
                movement_count=0,  # Not available in this query
                created_at=c["created_at"],
                last_accessed=c.get("updated_at")
            )
            for c in result.data
        ]

        return classes

    except Exception as e:
        logger.error(f"Agent list classes failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch classes"
        )


@router.get(
    "/classes/{class_id}",
    response_model=AgentClassResponse,
    summary="Get Class Details (Agent Simplified)",
    description="Get detailed information about a specific saved class."
)
async def agent_get_class(
    class_id: str = Path(..., description="Unique class identifier"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Get class details - simplified for agents
    """
    try:
        result = supabase.table("class_plans")\
            .select("*")\
            .eq("id", class_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Class not found")

        class_data = result.data

        # Extract movements from main_sequence
        movements_data = class_data.get("main_sequence", [])
        movements = [
            AgentMovementSummary(
                name=m.get("name", "Unknown"),
                duration_seconds=m.get("duration_seconds", 60),
                difficulty_level=class_data.get("difficulty_level", "Beginner"),
                primary_muscles=m.get("muscle_groups", ["Core"])
            )
            for m in movements_data if m.get("type") == "movement"
        ]

        return AgentClassResponse(
            class_id=str(class_data["id"]),
            duration_minutes=class_data.get("duration_minutes", 0),
            difficulty_level=class_data.get("difficulty_level", "Beginner"),
            movement_count=len(movements),
            movements=movements,
            has_music=False,  # TODO: Check if music was included
            has_meditation=False,  # TODO: Check if meditation was included
            music=None,
            created_at=class_data["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent get class failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch class"
        )


@router.delete(
    "/classes/{class_id}",
    response_model=AgentSuccessResponse,
    summary="Delete Class (Agent Simplified)",
    description="Soft delete a saved class (sets deleted_at timestamp)."
)
async def agent_delete_class(
    class_id: str = Path(..., description="Unique class identifier"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete class - simplified for agents
    """
    try:
        # Verify ownership
        result = supabase.table("class_plans")\
            .select("id, user_id")\
            .eq("id", class_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Class not found")

        if result.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        # Hard delete (since deleted_at column doesn't exist)
        supabase.table("class_plans")\
            .delete()\
            .eq("id", class_id)\
            .execute()

        logger.info(f"Class {class_id} deleted by user {user_id} via agent gateway")

        return AgentSuccessResponse(
            success=True,
            message=f"Class {class_id} deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent delete class failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete class"
        )


# ============================================================================
# ANALYTICS
# ============================================================================

@router.get(
    "/analytics",
    response_model=AgentAnalyticsSummary,
    summary="Get User Analytics (Agent Aggregated)",
    description="Aggregated user statistics - combines multiple analytics endpoints into one simple response."
)
async def agent_get_analytics(user_id: str = Depends(get_current_user_id)):
    """
    Get user analytics - aggregated summary for agents

    Combines data from:
    - user_preferences (total classes, level)
    - class_history (practice minutes, streaks)
    - movement tracking (favorite movements, muscle balance)
    """
    try:
        # Fetch user preferences
        prefs_result = supabase.table("user_preferences")\
            .select("classes_completed, experience_level, first_class_date")\
            .eq("user_id", user_id)\
            .execute()

        total_classes = 0
        current_level = "Beginner"

        if prefs_result.data:
            prefs = prefs_result.data[0]
            total_classes = prefs.get("classes_completed", 0)
            current_level = prefs.get("experience_level", "beginner").title()

        # Fetch class history for practice minutes
        history_result = supabase.table("class_history")\
            .select("actual_duration_minutes, taught_date")\
            .eq("user_id", user_id)\
            .execute()

        total_practice_minutes = sum(
            h.get("actual_duration_minutes", 0) for h in history_result.data
        )

        # Calculate practice streak (simplified)
        practice_streak_days = 0
        if history_result.data:
            # Sort by date descending
            sorted_history = sorted(
                history_result.data,
                key=lambda x: x["taught_date"],
                reverse=True
            )

            # Simple streak calculation (consecutive days)
            today = datetime.utcnow().date()
            last_practice = datetime.fromisoformat(sorted_history[0]["taught_date"]).date()

            if (today - last_practice).days <= 1:
                practice_streak_days = 1  # At least 1 day if practiced recently

        # TODO: Calculate favorite movements and muscle balance from class_history
        favorite_movements = ["The Hundred", "Roll Up"]  # Placeholder
        muscle_balance = {
            "core": 35,
            "legs": 25,
            "back": 20,
            "arms": 15,
            "other": 5
        }

        # Calculate this week/month classes
        this_week_classes = 0
        this_month_classes = 0

        today = datetime.utcnow().date()
        for h in history_result.data:
            taught_date = datetime.fromisoformat(h["taught_date"]).date()
            days_ago = (today - taught_date).days

            if days_ago <= 7:
                this_week_classes += 1
            if days_ago <= 30:
                this_month_classes += 1

        return AgentAnalyticsSummary(
            total_classes=total_classes,
            total_practice_minutes=total_practice_minutes,
            current_level=current_level,
            practice_streak_days=practice_streak_days,
            favorite_movements=favorite_movements,
            muscle_balance=muscle_balance,
            this_week_classes=this_week_classes,
            this_month_classes=this_month_classes
        )

    except Exception as e:
        logger.error(f"Agent analytics failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch analytics"
        )


@router.get(
    "/analytics/movement-history",
    response_model=List[AgentTimeSeriesData],
    summary="Get Movement History (Agent Analytics View)",
    description="Time series data showing movement usage over time periods (day/week/month)."
)
async def agent_get_movement_history(
    user_id: str = Depends(get_current_user_id),
    period: str = Query(default="week", description="Time period: day, week, month, total")
):
    """
    Get movement usage history - analytics view for agents

    Returns time series data for all movements showing usage patterns
    """
    try:
        # Import here to avoid circular dependency
        from api.analytics import get_movement_history, TimePeriod

        # Convert string to TimePeriod enum
        period_enum = TimePeriod(period)

        # Call existing analytics endpoint
        result = await get_movement_history(user_id=user_id, period=period_enum)

        # Convert to agent format (already matches AgentTimeSeriesData)
        return [
            AgentTimeSeriesData(
                label=item.label,
                periods=item.periods,
                period_labels=item.period_labels,
                total=item.total
            )
            for item in result
        ]

    except Exception as e:
        logger.error(f"Agent movement history failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch movement history"
        )


@router.get(
    "/analytics/muscle-group-history",
    response_model=List[AgentTimeSeriesData],
    summary="Get Muscle Group History (Agent Analytics View)",
    description="Time series data showing muscle group targeting over time periods."
)
async def agent_get_muscle_group_history(
    user_id: str = Depends(get_current_user_id),
    period: str = Query(default="week", description="Time period: day, week, month, total")
):
    """
    Get muscle group targeting history - analytics view for agents

    Returns time series data showing which muscle groups were targeted
    """
    try:
        from api.analytics import get_muscle_group_history, TimePeriod

        period_enum = TimePeriod(period)
        result = await get_muscle_group_history(user_id=user_id, period=period_enum)

        return [
            AgentTimeSeriesData(
                label=item.label,
                periods=item.periods,
                period_labels=item.period_labels,
                total=item.total
            )
            for item in result
        ]

    except Exception as e:
        logger.error(f"Agent muscle group history failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch muscle group history"
        )


@router.get(
    "/analytics/practice-frequency",
    response_model=AgentPracticeFrequencyData,
    summary="Get Practice Frequency (Agent Analytics View)",
    description="Shows how often user practices over time periods."
)
async def agent_get_practice_frequency(
    user_id: str = Depends(get_current_user_id),
    period: str = Query(default="week", description="Time period: day, week, month")
):
    """
    Get practice frequency - analytics view for agents

    Returns class counts per time period
    """
    try:
        from api.analytics import get_practice_frequency, TimePeriod

        period_enum = TimePeriod(period)
        result = await get_practice_frequency(user_id=user_id, period=period_enum)

        return AgentPracticeFrequencyData(
            period_labels=result.period_labels,
            class_counts=result.class_counts
        )

    except Exception as e:
        logger.error(f"Agent practice frequency failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch practice frequency"
        )


@router.get(
    "/analytics/difficulty-progression",
    response_model=AgentDifficultyProgressionData,
    summary="Get Difficulty Progression (Agent Analytics View)",
    description="Shows how user's difficulty level choices progress over time."
)
async def agent_get_difficulty_progression(
    user_id: str = Depends(get_current_user_id),
    period: str = Query(default="week", description="Time period: day, week, month")
):
    """
    Get difficulty progression - analytics view for agents

    Returns stacked data showing beginner/intermediate/advanced class counts
    """
    try:
        from api.analytics import get_difficulty_progression, TimePeriod

        period_enum = TimePeriod(period)
        result = await get_difficulty_progression(user_id=user_id, period=period_enum)

        return AgentDifficultyProgressionData(
            period_labels=result.period_labels,
            beginner_counts=result.beginner_counts,
            intermediate_counts=result.intermediate_counts,
            advanced_counts=result.advanced_counts
        )

    except Exception as e:
        logger.error(f"Agent difficulty progression failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch difficulty progression"
        )


@router.get(
    "/analytics/muscle-distribution",
    response_model=AgentMuscleDistributionData,
    summary="Get Muscle Distribution (Agent Analytics View)",
    description="Shows percentage breakdown of muscle groups targeted."
)
async def agent_get_muscle_distribution(
    user_id: str = Depends(get_current_user_id),
    period: str = Query(default="total", description="Time period: day, week, month, total")
):
    """
    Get muscle distribution - analytics view for agents

    Returns percentage breakdown for doughnut/pie chart
    """
    try:
        from api.analytics import get_muscle_distribution, TimePeriod

        period_enum = TimePeriod(period)
        result = await get_muscle_distribution(user_id=user_id, period=period_enum)

        return AgentMuscleDistributionData(
            muscle_groups=result.muscle_groups,
            percentages=result.percentages
        )

    except Exception as e:
        logger.error(f"Agent muscle distribution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch muscle distribution"
        )


@router.get(
    "/analytics/movement-family-distribution",
    response_model=AgentMovementFamilyDistributionData,
    summary="Get Movement Family Distribution (Agent Analytics View)",
    description="Shows percentage breakdown of movement families (flexion, extension, etc)."
)
async def agent_get_movement_family_distribution(
    user_id: str = Depends(get_current_user_id),
    period: str = Query(default="total", description="Time period: day, week, month, total")
):
    """
    Get movement family distribution - analytics view for agents

    Returns percentage breakdown for pie chart
    """
    try:
        from api.analytics import get_movement_family_distribution, TimePeriod

        period_enum = TimePeriod(period)
        result = await get_movement_family_distribution(user_id=user_id, period=period_enum)

        return AgentMovementFamilyDistributionData(
            families=result.families,
            percentages=result.percentages
        )

    except Exception as e:
        logger.error(f"Agent movement family distribution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch movement family distribution"
        )


@router.get(
    "/analytics/play-statistics",
    response_model=AgentPlayStatistics,
    summary="Get Play Statistics (Agent Analytics View)",
    description="Aggregated playback statistics showing session counts, completion rates, etc."
)
async def agent_get_play_statistics(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get user play statistics - analytics view for agents

    Returns aggregated playback data including sessions, completions, and duration
    """
    try:
        from api.analytics import get_user_play_statistics

        # Call existing analytics endpoint
        result = await get_user_play_statistics(user_id=user_id)

        return AgentPlayStatistics(
            total_sessions=result.total_sessions,
            qualified_plays=result.qualified_plays,
            completed_classes=result.completed_classes,
            total_play_minutes=result.total_play_seconds // 60,  # Convert to minutes
            completion_rate_percentage=result.completion_rate_percentage
        )

    except Exception as e:
        logger.error(f"Agent play statistics failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch play statistics"
        )


# ============================================================================
# MOVEMENTS
# ============================================================================

@router.get(
    "/movements",
    response_model=List[AgentMovementDetail],
    summary="Search Movements (Agent Simplified)",
    description="Search Pilates movements with simplified response. Filter by difficulty or muscle group."
)
async def agent_search_movements(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: Beginner, Intermediate, Advanced"),
    muscle_group: Optional[str] = Query(None, description="Filter by muscle group: Core, Legs, Back, Arms"),
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    Search movements - simplified for agents

    Returns only essential fields for each movement
    """
    try:
        query = supabase.table("movements").select("*")

        if difficulty:
            query = query.eq("difficulty_level", difficulty)

        # TODO: Add muscle group filter (requires join with movement_muscles)

        result = query.limit(limit).execute()

        movements = [
            AgentMovementDetail(
                id=str(m["id"]),
                name=m["name"],
                difficulty_level=m.get("difficulty_level", "Beginner"),
                primary_muscles=m.get("primary_muscles", ["Core"]),
                duration_seconds=m.get("duration_seconds", 60),
                description=m.get("description", ""),
                contraindications=m.get("contraindications", [])
            )
            for m in result.data
        ]

        return movements

    except Exception as e:
        logger.error(f"Agent search movements failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to search movements"
        )


# ============================================================================
# MUSIC
# ============================================================================

@router.get(
    "/music/playlists",
    response_model=List[AgentMusicPlaylist],
    summary="Get Music Playlists (Agent Simplified)",
    description="Get available music playlists with simplified details."
)
async def agent_get_playlists(
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    Get music playlists - simplified for agents

    Returns only essential fields for each playlist
    """
    try:
        # TODO: Implement music playlist fetching
        # For now, return placeholder
        return [
            AgentMusicPlaylist(
                playlist_id="playlist_1",
                name="Classical Calm",
                genre="Classical",
                total_tracks=12,
                total_duration_seconds=3600,
                suitable_for=["Beginner", "Meditation"]
            )
        ]

    except Exception as e:
        logger.error(f"Agent get playlists failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch playlists"
        )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get(
    "/health",
    response_model=AgentSuccessResponse,
    summary="Health Check",
    description="Simple health check endpoint for monitoring."
)
async def agent_health():
    """
    Health check - confirms agent gateway is operational
    """
    return AgentSuccessResponse(
        success=True,
        message="Agent gateway is healthy"
    )
