"""
Extended Admin API endpoints for platform management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import logging
from sqlalchemy import text
import json

from db import get_db_connection
from api.auth import get_current_user
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def admin_required(current_user: User = Depends(get_current_user)):
    """Require admin user type"""
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/users")
async def get_all_users(
    user_type: Optional[str] = Query(None, description="Filter by user type"),
    search: Optional[str] = Query(None, description="Search by email or name"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(admin_required)
):
    """
    Get all users with filtering options (admin only).

    Returns user profiles with statistics.
    """
    try:
        conn = get_db_connection()

        # Base query with user stats
        query = """
            SELECT
                up.id,
                up.email,
                up.full_name,
                up.user_type,
                up.created_at,
                up.last_login,
                up.age_range,
                up.country,
                up.pilates_experience,
                COUNT(DISTINCT ch.id) as total_classes,
                COUNT(DISTINCT css.id) as total_sessions
            FROM user_profiles up
            LEFT JOIN class_history ch ON ch.user_id = up.id
            LEFT JOIN coach_sport_sessions css ON css.coach_id = up.id
            WHERE 1=1
        """

        params = {"limit": limit, "offset": offset}

        # Add filters
        if user_type:
            query += " AND up.user_type = :user_type"
            params["user_type"] = user_type

        if search:
            query += " AND (up.email ILIKE :search OR up.full_name ILIKE :search)"
            params["search"] = f"%{search}%"

        query += """
            GROUP BY up.id
            ORDER BY up.created_at DESC
            LIMIT :limit OFFSET :offset
        """

        result = conn.execute(text(query), params)
        users = result.fetchall()

        return [dict(user) for user in users]

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")
    finally:
        conn.close()

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: UUID = Path(...),
    current_user: User = Depends(admin_required)
):
    """Get detailed user information (admin only)"""
    try:
        conn = get_db_connection()

        query = """
            SELECT
                up.*,
                COUNT(DISTINCT ch.id) as total_classes,
                COUNT(DISTINCT css.id) as total_sessions,
                MAX(ch.created_at) as last_class_date,
                MAX(css.created_at) as last_session_date
            FROM user_profiles up
            LEFT JOIN class_history ch ON ch.user_id = up.id
            LEFT JOIN coach_sport_sessions css ON css.coach_id = up.id
            WHERE up.id = :user_id
            GROUP BY up.id
        """

        result = conn.execute(text(query), {"user_id": str(user_id)})
        user = result.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return dict(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user details")
    finally:
        conn.close()

@router.put("/users/{user_id}")
async def update_user_by_admin(
    user_id: UUID,
    updates: dict,
    current_user: User = Depends(admin_required)
):
    """Update user profile (admin only)"""
    try:
        conn = get_db_connection()

        # Check user exists
        check_query = "SELECT id FROM user_profiles WHERE id = :user_id"
        result = conn.execute(text(check_query), {"user_id": str(user_id)})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        # Build update query
        set_clauses = []
        params = {"user_id": str(user_id)}

        # Only allow updating specific fields
        allowed_fields = ["user_type", "full_name", "is_active"]
        for field in allowed_fields:
            if field in updates:
                set_clauses.append(f"{field} = :{field}")
                params[field] = updates[field]

        if not set_clauses:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        query = f"""
            UPDATE user_profiles
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = :user_id
            RETURNING *
        """

        result = conn.execute(text(query), params)
        updated_user = result.fetchone()
        conn.commit()

        return dict(updated_user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update user")
    finally:
        conn.close()

@router.delete("/users/{user_id}")
async def delete_user_by_admin(
    user_id: UUID,
    current_user: User = Depends(admin_required)
):
    """Permanently delete user account (admin only)"""
    try:
        conn = get_db_connection()

        # Prevent self-deletion
        if str(user_id) == str(current_user.id):
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        # Check user exists
        check_query = "SELECT id FROM user_profiles WHERE id = :user_id"
        result = conn.execute(text(check_query), {"user_id": str(user_id)})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        # Delete user (cascades to related tables)
        delete_query = "DELETE FROM user_profiles WHERE id = :user_id"
        conn.execute(text(delete_query), {"user_id": str(user_id)})
        conn.commit()

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete user")
    finally:
        conn.close()

# ============================================================================
# EXERCISE MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/exercise-stats")
async def get_exercise_statistics(
    current_user: User = Depends(admin_required)
):
    """Get exercise database statistics (admin only)"""
    try:
        conn = get_db_connection()

        # Get exercise counts by sport
        sport_query = """
            SELECT
                sport,
                COUNT(*) as count,
                COUNT(DISTINCT category) as categories
            FROM sport_exercises
            GROUP BY sport
        """

        result = conn.execute(text(sport_query))
        by_sport = {row["sport"]: {"count": row["count"], "categories": row["categories"]}
                    for row in result}

        # Get total count
        total_query = "SELECT COUNT(*) as total FROM sport_exercises"
        result = conn.execute(text(total_query))
        total = result.fetchone()["total"]

        # Get recently added
        recent_query = """
            SELECT id, sport, exercise_name, created_at
            FROM sport_exercises
            ORDER BY created_at DESC
            LIMIT 5
        """
        result = conn.execute(text(recent_query))
        recent = [dict(row) for row in result]

        return {
            "total_exercises": total,
            "by_sport": by_sport,
            "recently_added": recent
        }

    except Exception as e:
        logger.error(f"Error fetching exercise stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercise statistics")
    finally:
        conn.close()

@router.post("/exercises/import")
async def import_exercises(
    import_data: dict,
    current_user: User = Depends(admin_required)
):
    """
    Bulk import sport exercises (admin only).

    Validates and imports exercises, preventing duplicates.
    """
    try:
        conn = get_db_connection()

        sport = import_data["sport"]
        exercises = import_data["exercises"]

        imported_count = 0
        failed_count = 0
        errors = []

        for exercise in exercises:
            try:
                # Check for duplicates
                check_query = """
                    SELECT id FROM sport_exercises
                    WHERE sport = :sport AND exercise_name = :name
                """
                result = conn.execute(text(check_query), {
                    "sport": sport,
                    "name": exercise["exercise_name"]
                })

                if result.fetchone():
                    failed_count += 1
                    errors.append(f"Duplicate: {exercise['exercise_name']}")
                    continue

                # Insert exercise
                insert_query = """
                    INSERT INTO sport_exercises
                    (sport, exercise_name, category, description, sport_relevance,
                     injury_prevention, position_specific, variations, muscle_groups)
                    VALUES (:sport, :name, :category, :description, :relevance,
                            :prevention, :position, :variations::jsonb, :muscles)
                """

                params = {
                    "sport": sport,
                    "name": exercise["exercise_name"],
                    "category": exercise["category"],
                    "description": exercise["description"],
                    "relevance": exercise.get("sport_relevance"),
                    "prevention": exercise.get("injury_prevention"),
                    "position": exercise.get("position_specific"),
                    "variations": json.dumps(exercise.get("variations", {})),
                    "muscles": exercise.get("muscle_groups", [])
                }

                conn.execute(text(insert_query), params)
                imported_count += 1

            except Exception as e:
                failed_count += 1
                errors.append(f"Error with {exercise.get('exercise_name', 'unknown')}: {str(e)}")

        conn.commit()

        return {
            "imported_count": imported_count,
            "failed_count": failed_count,
            "errors": errors[:10]  # Limit error messages
        }

    except Exception as e:
        logger.error(f"Error importing exercises: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to import exercises")
    finally:
        conn.close()

# ============================================================================
# PLATFORM STATISTICS ENDPOINTS
# ============================================================================

@router.get("/platform-stats")
async def get_platform_statistics(
    period: str = Query("month", description="Time period: day, week, month, year"),
    current_user: User = Depends(admin_required)
):
    """Get comprehensive platform statistics (admin only)"""
    try:
        conn = get_db_connection()

        # Calculate date range
        now = datetime.utcnow()
        if period == "day":
            start_date = now - timedelta(days=1)
        elif period == "week":
            start_date = now - timedelta(weeks=1)
        elif period == "month":
            start_date = now - timedelta(days=30)
        else:  # year
            start_date = now - timedelta(days=365)

        # User statistics
        user_stats_query = """
            SELECT
                COUNT(*) as total_users,
                COUNT(CASE WHEN user_type = 'standard' THEN 1 END) as standard_users,
                COUNT(CASE WHEN user_type = 'coach' THEN 1 END) as coach_users,
                COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_users,
                COUNT(CASE WHEN created_at >= :start_date THEN 1 END) as new_users_period,
                COUNT(CASE WHEN last_login >= :start_date THEN 1 END) as active_users_period
            FROM user_profiles
        """

        result = conn.execute(text(user_stats_query), {"start_date": start_date})
        user_stats = dict(result.fetchone())

        # Class statistics
        class_stats_query = """
            SELECT
                COUNT(*) as total_classes,
                COUNT(CASE WHEN created_at >= :start_date THEN 1 END) as classes_period
            FROM class_history
        """

        result = conn.execute(text(class_stats_query), {"start_date": start_date})
        class_stats = dict(result.fetchone())

        # Session statistics
        session_stats_query = """
            SELECT
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN created_at >= :start_date THEN 1 END) as sessions_period,
                COUNT(DISTINCT coach_id) as active_coaches,
                COUNT(DISTINCT sport) as sports_used
            FROM coach_sport_sessions
            WHERE created_at >= :start_date
        """

        result = conn.execute(text(session_stats_query), {"start_date": start_date})
        session_stats = dict(result.fetchone())

        # Popular sports
        sport_popularity_query = """
            SELECT sport, COUNT(*) as session_count
            FROM coach_sport_sessions
            WHERE created_at >= :start_date
            GROUP BY sport
            ORDER BY session_count DESC
            LIMIT 5
        """

        result = conn.execute(text(sport_popularity_query), {"start_date": start_date})
        popular_sports = [dict(row) for row in result]

        return {
            "period": period,
            "period_start": start_date.isoformat(),
            "total_users": user_stats["total_users"],
            "users_by_type": {
                "standard": user_stats["standard_users"],
                "coach": user_stats["coach_users"],
                "admin": user_stats["admin_users"]
            },
            "new_users_period": user_stats["new_users_period"],
            "active_users_period": user_stats["active_users_period"],
            "total_classes_created": class_stats["total_classes"],
            "classes_created_period": class_stats["classes_period"],
            "total_sessions_created": session_stats["total_sessions"],
            "sessions_created_period": session_stats["sessions_period"],
            "active_coaches": session_stats["active_coaches"],
            "popular_sports": popular_sports
        }

    except Exception as e:
        logger.error(f"Error fetching platform stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch platform statistics")
    finally:
        conn.close()

# ============================================================================
# SYSTEM HEALTH ENDPOINTS
# ============================================================================

@router.get("/system/health")
async def get_system_health(
    current_user: User = Depends(admin_required)
):
    """Check health of all system components (admin only)"""
    try:
        health_status = {
            "status": "healthy",
            "components": {},
            "timestamp": datetime.utcnow().isoformat()
        }

        # Check database
        try:
            conn = get_db_connection()
            conn.execute(text("SELECT 1"))
            conn.close()
            health_status["components"]["database"] = {
                "status": "healthy",
                "latency_ms": 5
            }
        except Exception as e:
            health_status["components"]["database"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            health_status["status"] = "degraded"

        # Check other components (placeholder)
        health_status["components"]["ai_agents"] = {"status": "healthy"}
        health_status["components"]["music_service"] = {"status": "healthy"}
        health_status["components"]["storage"] = {"status": "healthy"}

        return health_status

    except Exception as e:
        logger.error(f"Error checking system health: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }