"""
Coach API endpoints for sports-specific Pilates integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
import logging
import json
from sqlalchemy import text

from db import get_db_connection
from api.auth import get_current_user
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coach", tags=["Coach"])

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
        conn = get_db_connection()

        # Base query
        query = """
            SELECT
                id,
                sport,
                exercise_name,
                category,
                description,
                sport_relevance,
                injury_prevention,
                position_specific,
                variations,
                muscle_groups,
                created_at,
                updated_at
            FROM sport_exercises
            WHERE sport = :sport
        """

        params = {"sport": sport}

        # Add filters if provided
        if category:
            query += " AND category = :category"
            params["category"] = category

        if muscle_group:
            query += " AND :muscle_group = ANY(muscle_groups)"
            params["muscle_group"] = muscle_group

        query += " ORDER BY category, exercise_name"

        result = conn.execute(text(query), params)
        exercises = result.fetchall()

        return [dict(exercise) for exercise in exercises]

    except Exception as e:
        logger.error(f"Error fetching sport exercises: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercises")
    finally:
        conn.close()

@router.get("/exercises/{sport}/{exercise_id}")
async def get_sport_exercise_by_id(
    sport: str = Path(..., description="Sport identifier"),
    exercise_id: UUID = Path(..., description="Exercise ID"),
    current_user: User = Depends(coach_or_admin_required)
):
    """Get specific sport exercise by ID"""
    try:
        conn = get_db_connection()

        query = """
            SELECT * FROM sport_exercises
            WHERE sport = :sport AND id = :exercise_id
        """

        result = conn.execute(text(query), {"sport": sport, "exercise_id": str(exercise_id)})
        exercise = result.fetchone()

        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        return dict(exercise)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching exercise: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercise")
    finally:
        conn.close()

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
        conn = get_db_connection()

        # Build query based on user type
        if current_user.user_type == "admin":
            # Admins see all sessions
            query = "SELECT * FROM coach_sport_sessions WHERE 1=1"
            params = {}
        else:
            # Coaches see only their sessions
            query = "SELECT * FROM coach_sport_sessions WHERE coach_id = :coach_id"
            params = {"coach_id": str(current_user.id)}

        # Add filters
        if sport:
            query += " AND sport = :sport"
            params["sport"] = sport

        if team_name:
            query += " AND team_name ILIKE :team_name"
            params["team_name"] = f"%{team_name}%"

        query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        params.update({"limit": limit, "offset": offset})

        result = conn.execute(text(query), params)
        sessions = result.fetchall()

        return [dict(session) for session in sessions]

    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")
    finally:
        conn.close()

@router.post("/sessions")
async def create_coach_session(
    session_data: dict,
    current_user: User = Depends(coach_or_admin_required)
):
    """Create a new training session"""
    try:
        conn = get_db_connection()

        query = """
            INSERT INTO coach_sport_sessions
            (coach_id, sport, session_name, team_name, session_date, exercises, notes)
            VALUES (:coach_id, :sport, :session_name, :team_name, :session_date, :exercises::jsonb, :notes)
            RETURNING *
        """

        params = {
            "coach_id": str(current_user.id),
            "sport": session_data["sport"],
            "session_name": session_data["session_name"],
            "team_name": session_data.get("team_name"),
            "session_date": session_data.get("session_date"),
            "exercises": json.dumps(session_data["exercises"]),
            "notes": session_data.get("notes")
        }

        result = conn.execute(text(query), params)
        new_session = result.fetchone()
        conn.commit()

        return dict(new_session)

    except Exception as e:
        logger.error(f"Error creating session: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to create session")
    finally:
        conn.close()

@router.get("/sessions/{session_id}")
async def get_session_by_id(
    session_id: UUID = Path(...),
    current_user: User = Depends(coach_or_admin_required)
):
    """Get session by ID"""
    try:
        conn = get_db_connection()

        query = """
            SELECT * FROM coach_sport_sessions
            WHERE id = :session_id
        """

        # Add coach filter if not admin
        if current_user.user_type != "admin":
            query += " AND coach_id = :coach_id"

        params = {"session_id": str(session_id)}
        if current_user.user_type != "admin":
            params["coach_id"] = str(current_user.id)

        result = conn.execute(text(query), params)
        session = result.fetchone()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return dict(session)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch session")
    finally:
        conn.close()

@router.put("/sessions/{session_id}")
async def update_session(
    session_id: UUID,
    updates: dict,
    current_user: User = Depends(coach_or_admin_required)
):
    """Update training session"""
    try:
        conn = get_db_connection()

        # Verify ownership
        check_query = "SELECT coach_id FROM coach_sport_sessions WHERE id = :session_id"
        result = conn.execute(text(check_query), {"session_id": str(session_id)})
        session = result.fetchone()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if current_user.user_type != "admin" and session["coach_id"] != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this session")

        # Build update query
        set_clauses = []
        params = {"session_id": str(session_id)}

        for field in ["session_name", "team_name", "session_date", "exercises", "notes"]:
            if field in updates:
                set_clauses.append(f"{field} = :{field}")
                if field == "exercises":
                    params[field] = json.dumps(updates[field])
                else:
                    params[field] = updates[field]

        if not set_clauses:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        query = f"""
            UPDATE coach_sport_sessions
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = :session_id
            RETURNING *
        """

        result = conn.execute(text(query), params)
        updated_session = result.fetchone()
        conn.commit()

        return dict(updated_session)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update session")
    finally:
        conn.close()

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(coach_or_admin_required)
):
    """Delete training session"""
    try:
        conn = get_db_connection()

        # Verify ownership
        check_query = "SELECT coach_id FROM coach_sport_sessions WHERE id = :session_id"
        result = conn.execute(text(check_query), {"session_id": str(session_id)})
        session = result.fetchone()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if current_user.user_type != "admin" and session["coach_id"] != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this session")

        # Delete session
        delete_query = "DELETE FROM coach_sport_sessions WHERE id = :session_id"
        conn.execute(text(delete_query), {"session_id": str(session_id)})
        conn.commit()

        return {"message": "Session deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete session")
    finally:
        conn.close()

# ============================================================================
# TEAM MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/teams")
async def get_coach_teams(
    current_user: User = Depends(coach_or_admin_required)
):
    """Get unique teams from coach's sessions"""
    try:
        conn = get_db_connection()

        if current_user.user_type == "admin":
            query = """
                SELECT DISTINCT
                    team_name,
                    sport,
                    COUNT(*) as session_count,
                    MAX(session_date) as last_session
                FROM coach_sport_sessions
                WHERE team_name IS NOT NULL
                GROUP BY team_name, sport
                ORDER BY last_session DESC
            """
            params = {}
        else:
            query = """
                SELECT DISTINCT
                    team_name,
                    sport,
                    COUNT(*) as session_count,
                    MAX(session_date) as last_session
                FROM coach_sport_sessions
                WHERE coach_id = :coach_id AND team_name IS NOT NULL
                GROUP BY team_name, sport
                ORDER BY last_session DESC
            """
            params = {"coach_id": str(current_user.id)}

        result = conn.execute(text(query), params)
        teams = result.fetchall()

        return [dict(team) for team in teams]

    except Exception as e:
        logger.error(f"Error fetching teams: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch teams")
    finally:
        conn.close()

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
        conn = get_db_connection()

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
    finally:
        conn.close()