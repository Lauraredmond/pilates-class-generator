"""
Coach API endpoints for sports-specific Pilates integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
import logging
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from api.auth import get_current_user
from models.user import User

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coach", tags=["Coach"])

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def coach_or_admin_required(current_user: User = Depends(get_current_user)):
    """Require coach or admin user type"""
    if current_user.user_type not in ["coach", "admin"]:
        raise HTTPException(status_code=403, detail="Coach or admin access required")
    return current_user

# ============================================================================
# SPORT EXERCISE ENDPOINTS
# ============================================================================

@router.get("/exercises/{sport}")
async def get_sport_exercises(
    sport: str = Path(..., description="Sport identifier (gaa, soccer, rugby)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    muscle_group: Optional[str] = Query(None, description="Filter by muscle group"),
    current_user: User = Depends(coach_or_admin_required)
):
    """
    Get sport-specific Pilates exercises with annotations.

    Returns exercises with sport relevance, injury prevention benefits,
    and position-specific applications.
    """
    try:
        # Build query
        query = supabase.table("sport_exercises").select("*").eq("sport", sport)

        # Add filters if provided
        if category:
            query = query.eq("category", category)

        if muscle_group:
            query = query.contains("muscle_groups", [muscle_group])

        # Execute query
        result = query.order("category", desc=False).order("exercise_name", desc=False).execute()

        return result.data or []

    except Exception as e:
        logger.error(f"Error fetching sport exercises: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercises")

@router.get("/exercises/{sport}/{exercise_id}")
async def get_sport_exercise_by_id(
    sport: str = Path(..., description="Sport identifier"),
    exercise_id: UUID = Path(..., description="Exercise ID"),
    current_user: User = Depends(coach_or_admin_required)
):
    """Get specific sport exercise by ID"""
    try:
        result = supabase.table("sport_exercises")\
            .select("*")\
            .eq("sport", sport)\
            .eq("id", str(exercise_id))\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Exercise not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching exercise: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercise")

# ============================================================================
# COACH SESSION ENDPOINTS
# ============================================================================

@router.get("/sessions")
async def get_coach_sessions(
    sport: Optional[str] = Query(None),
    team_name: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(coach_or_admin_required)
):
    """Get coach's training sessions"""
    try:
        # Build query based on user type
        query = supabase.table("coach_sport_sessions").select("*")

        # Coaches see only their sessions, admins see all
        if current_user.user_type != "admin":
            query = query.eq("coach_id", str(current_user.id))

        # Add filters
        if sport:
            query = query.eq("sport", sport)

        if team_name:
            query = query.ilike("team_name", f"%{team_name}%")

        # Add ordering and pagination
        result = query.order("created_at", desc=True).limit(limit).offset(offset).execute()

        return result.data or []

    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")

@router.post("/sessions")
async def create_coach_session(
    session_data: dict,
    current_user: User = Depends(coach_or_admin_required)
):
    """Create a new training session"""
    try:
        session_record = {
            "coach_id": str(current_user.id),
            "sport": session_data["sport"],
            "session_name": session_data["session_name"],
            "team_name": session_data.get("team_name"),
            "session_date": session_data.get("session_date"),
            "exercises": session_data["exercises"],  # Supabase handles JSON directly
            "notes": session_data.get("notes")
        }

        result = supabase.table("coach_sport_sessions").insert(session_record).execute()

        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create session")

    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@router.get("/sessions/{session_id}")
async def get_session_by_id(
    session_id: UUID = Path(...),
    current_user: User = Depends(coach_or_admin_required)
):
    """Get session by ID"""
    try:
        query = supabase.table("coach_sport_sessions").select("*").eq("id", str(session_id))

        # Add coach filter if not admin
        if current_user.user_type != "admin":
            query = query.eq("coach_id", str(current_user.id))

        result = query.execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch session")

@router.put("/sessions/{session_id}")
async def update_session(
    updates: dict,
    session_id: UUID = Path(..., description="Unique identifier (UUID) for the session"),
    current_user: User = Depends(coach_or_admin_required)
):
    """Update training session"""
    try:
        # Verify ownership
        check_result = supabase.table("coach_sport_sessions")\
            .select("coach_id")\
            .eq("id", str(session_id))\
            .execute()

        if not check_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = check_result.data[0]
        if current_user.user_type != "admin" and session["coach_id"] != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this session")

        # Build update data
        update_data = {}
        for field in ["session_name", "team_name", "session_date", "exercises", "notes"]:
            if field in updates:
                update_data[field] = updates[field]

        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("coach_sport_sessions")\
            .update(update_data)\
            .eq("id", str(session_id))\
            .execute()

        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update session")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(status_code=500, detail="Failed to update session")

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID = Path(..., description="Unique identifier (UUID) for the session"),
    current_user: User = Depends(coach_or_admin_required)
):
    """Delete training session"""
    try:
        # Verify ownership
        check_result = supabase.table("coach_sport_sessions")\
            .select("coach_id")\
            .eq("id", str(session_id))\
            .execute()

        if not check_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = check_result.data[0]
        if current_user.user_type != "admin" and session["coach_id"] != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this session")

        # Delete session
        supabase.table("coach_sport_sessions").delete().eq("id", str(session_id)).execute()

        return {"message": "Session deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")

# ============================================================================
# TEAM MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/teams")
async def get_coach_teams(
    current_user: User = Depends(coach_or_admin_required)
):
    """Get unique teams from coach's sessions"""
    try:
        # Get sessions based on user type
        query = supabase.table("coach_sport_sessions").select("team_name, sport, session_date")

        if current_user.user_type != "admin":
            query = query.eq("coach_id", str(current_user.id))

        query = query.not_.is_("team_name", "null")
        result = query.execute()

        # Process results to group by team_name and sport
        teams_dict = {}
        for session in result.data or []:
            key = (session["team_name"], session["sport"])
            if key not in teams_dict:
                teams_dict[key] = {
                    "team_name": session["team_name"],
                    "sport": session["sport"],
                    "session_count": 0,
                    "last_session": None
                }
            teams_dict[key]["session_count"] += 1
            if session["session_date"]:
                if not teams_dict[key]["last_session"] or session["session_date"] > teams_dict[key]["last_session"]:
                    teams_dict[key]["last_session"] = session["session_date"]

        # Sort by last_session descending
        teams_list = sorted(teams_dict.values(), key=lambda x: x["last_session"] or "", reverse=True)
        return teams_list

    except Exception as e:
        logger.error(f"Error fetching teams: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch teams")

# ============================================================================
# EXERCISE STATISTICS (for coaches)
# ============================================================================

@router.get("/stats/exercises")
async def get_exercise_usage_stats(
    sport: Optional[str] = Query(None),
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(coach_or_admin_required)
):
    """Get exercise usage statistics for coach's sessions"""
    try:
        # This would analyze the exercises JSON field in coach_sport_sessions
        # For now, returning placeholder
        return {
            "most_used_exercises": [],
            "muscle_group_distribution": {},
            "average_session_duration": 0,
            "total_sessions": 0,
            "period_days": period_days
        }

    except Exception as e:
        logger.error(f"Error fetching exercise stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")