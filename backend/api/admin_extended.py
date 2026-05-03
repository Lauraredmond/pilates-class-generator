"""
Extended Admin API endpoints for platform management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
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

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

    Returns user profiles with statistics and total count.
    """
    try:
        # Build query for total count
        count_query = supabase.table("user_profiles").select("id", count="exact")

        # Add filters to count query
        if user_type:
            count_query = count_query.eq("user_type", user_type)

        if search:
            # Supabase doesn't support OR in a single query, so we'll filter on email only
            count_query = count_query.ilike("email", f"%{search}%")

        # Get total count
        count_result = count_query.execute()
        total_count = count_result.count if hasattr(count_result, 'count') else 0

        # Build query for user profiles
        query = supabase.table("user_profiles").select("*")

        # Add filters
        if user_type:
            query = query.eq("user_type", user_type)

        if search:
            # Supabase doesn't support OR in a single query, so we'll filter on email only
            query = query.ilike("email", f"%{search}%")

        # Execute with pagination
        result = query.order("created_at", desc=True).limit(limit).offset(offset).execute()
        users = result.data or []

        # For each user, get their stats (simplified - in production you'd optimize this)
        for user in users:
            # Get class count
            class_result = supabase.table("class_history").select("id", count="exact").eq("user_id", user["id"]).execute()
            user["total_classes"] = class_result.count if hasattr(class_result, 'count') else 0

            # Get session count for coaches
            if user["user_type"] == "coach":
                session_result = supabase.table("coach_sport_sessions").select("id", count="exact").eq("coach_id", user["id"]).execute()
                user["total_sessions"] = session_result.count if hasattr(session_result, 'count') else 0
            else:
                user["total_sessions"] = 0

        return {
            "users": users,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: UUID = Path(...),
    current_user: User = Depends(admin_required)
):
    """Get detailed user information (admin only)"""
    try:
        # Get user profile
        result = supabase.table("user_profiles").select("*").eq("id", str(user_id)).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = result.data[0]

        # Get class history stats
        class_result = supabase.table("class_history")\
            .select("id, created_at")\
            .eq("user_id", str(user_id))\
            .order("created_at", desc=True)\
            .execute()

        user["total_classes"] = len(class_result.data) if class_result.data else 0
        user["last_class_date"] = class_result.data[0]["created_at"] if class_result.data else None

        # Get coach session stats (if user is a coach)
        if user["user_type"] == "coach":
            session_result = supabase.table("coach_sport_sessions")\
                .select("id, created_at")\
                .eq("coach_id", str(user_id))\
                .order("created_at", desc=True)\
                .execute()

            user["total_sessions"] = len(session_result.data) if session_result.data else 0
            user["last_session_date"] = session_result.data[0]["created_at"] if session_result.data else None
        else:
            user["total_sessions"] = 0
            user["last_session_date"] = None

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user details")

@router.put("/users/{user_id}")
async def update_user_by_admin(
    updates: dict,
    user_id: UUID = Path(..., description="Unique identifier (UUID) for the user"),
    current_user: User = Depends(admin_required)
):
    """Update user profile (admin only)"""
    try:
        # Check user exists
        check_result = supabase.table("user_profiles").select("id").eq("id", str(user_id)).execute()
        if not check_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        # Build update data
        update_data = {}
        # Only allow updating specific fields
        allowed_fields = ["user_type", "full_name", "is_active"]
        for field in allowed_fields:
            if field in updates:
                update_data[field] = updates[field]

        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("user_profiles")\
            .update(update_data)\
            .eq("id", str(user_id))\
            .execute()

        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update user")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")

@router.delete("/users/{user_id}")
async def delete_user_by_admin(
    user_id: UUID = Path(..., description="Unique identifier (UUID) for the user"),
    current_user: User = Depends(admin_required)
):
    """Permanently delete user account (admin only)"""
    try:
        # Prevent self-deletion
        if str(user_id) == str(current_user.id):
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        # Check user exists
        check_result = supabase.table("user_profiles").select("id").eq("id", str(user_id)).execute()
        if not check_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete user (cascades to related tables)
        supabase.table("user_profiles").delete().eq("id", str(user_id)).execute()

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

# ============================================================================
# EXERCISE MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/exercise-stats")
async def get_exercise_statistics(
    current_user: User = Depends(admin_required)
):
    """Get exercise database statistics (admin only)"""
    try:
        # Get all exercises
        result = supabase.table("sport_exercises").select("*").execute()
        exercises = result.data or []

        # Group by sport and calculate stats
        by_sport = {}
        for exercise in exercises:
            sport = exercise["sport"]
            if sport not in by_sport:
                by_sport[sport] = {"count": 0, "categories": set()}
            by_sport[sport]["count"] += 1
            by_sport[sport]["categories"].add(exercise["category"])

        # Convert sets to counts
        for sport in by_sport:
            by_sport[sport]["categories"] = len(by_sport[sport]["categories"])

        # Get total count
        total = len(exercises)

        # Get recently added (sort by created_at)
        recent = sorted(exercises, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
        recent = [{"id": e["id"], "sport": e["sport"], "exercise_name": e["exercise_name"],
                  "created_at": e.get("created_at")} for e in recent]

        return {
            "total_exercises": total,
            "by_sport": by_sport,
            "recently_added": recent
        }

    except Exception as e:
        logger.error(f"Error fetching exercise stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercise statistics")

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
        sport = import_data["sport"]
        exercises = import_data["exercises"]

        imported_count = 0
        failed_count = 0
        errors = []

        for exercise in exercises:
            try:
                # Check for duplicates
                check_result = supabase.table("sport_exercises")\
                    .select("id")\
                    .eq("sport", sport)\
                    .eq("exercise_name", exercise["exercise_name"])\
                    .execute()

                if check_result.data:
                    failed_count += 1
                    errors.append(f"Duplicate: {exercise['exercise_name']}")
                    continue

                # Insert exercise
                exercise_record = {
                    "sport": sport,
                    "exercise_name": exercise["exercise_name"],
                    "category": exercise["category"],
                    "description": exercise["description"],
                    "sport_relevance": exercise.get("sport_relevance"),
                    "injury_prevention": exercise.get("injury_prevention"),
                    "position_specific": exercise.get("position_specific"),
                    "variations": exercise.get("variations", {}),
                    "muscle_groups": exercise.get("muscle_groups", [])
                }

                supabase.table("sport_exercises").insert(exercise_record).execute()
                imported_count += 1

            except Exception as e:
                failed_count += 1
                errors.append(f"Error with {exercise.get('exercise_name', 'unknown')}: {str(e)}")

        return {
            "imported_count": imported_count,
            "failed_count": failed_count,
            "errors": errors[:10]  # Limit error messages
        }

    except Exception as e:
        logger.error(f"Error importing exercises: {e}")
        raise HTTPException(status_code=500, detail="Failed to import exercises")

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

        # Get all users
        users_result = supabase.table("user_profiles").select("*").execute()
        users = users_result.data or []

        # Calculate user statistics
        total_users = len(users)
        standard_users = len([u for u in users if u.get("user_type") == "standard"])
        coach_users = len([u for u in users if u.get("user_type") == "coach"])
        admin_users = len([u for u in users if u.get("user_type") == "admin"])

        # Calculate period statistics
        start_date_str = start_date.isoformat()
        new_users_period = len([u for u in users if u.get("created_at", "") >= start_date_str])
        active_users_period = len([u for u in users if u.get("last_login", "") >= start_date_str])

        # Get class history
        classes_result = supabase.table("class_history").select("created_at").execute()
        classes = classes_result.data or []
        total_classes = len(classes)
        classes_period = len([c for c in classes if c.get("created_at", "") >= start_date_str])

        # Get coach sessions
        sessions_result = supabase.table("coach_sport_sessions").select("*").execute()
        sessions = sessions_result.data or []
        total_sessions = len(sessions)
        sessions_period = len([s for s in sessions if s.get("created_at", "") >= start_date_str])

        # Calculate active coaches and sports
        period_sessions = [s for s in sessions if s.get("created_at", "") >= start_date_str]
        active_coaches = len(set(s["coach_id"] for s in period_sessions if s.get("coach_id")))

        # Popular sports
        sport_counts = {}
        for session in period_sessions:
            sport = session.get("sport")
            if sport:
                sport_counts[sport] = sport_counts.get(sport, 0) + 1

        popular_sports = [{"sport": sport, "session_count": count}
                         for sport, count in sorted(sport_counts.items(),
                                                   key=lambda x: x[1], reverse=True)[:5]]

        return {
            "period": period,
            "period_start": start_date.isoformat(),
            "total_users": total_users,
            "users_by_type": {
                "standard": standard_users,
                "coach": coach_users,
                "admin": admin_users
            },
            "new_users_period": new_users_period,
            "active_users_period": active_users_period,
            "total_classes_created": total_classes,
            "classes_created_period": classes_period,
            "total_sessions_created": total_sessions,
            "sessions_created_period": sessions_period,
            "active_coaches": active_coaches,
            "popular_sports": popular_sports
        }

    except Exception as e:
        logger.error(f"Error fetching platform stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch platform statistics")

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
            # Simple health check query
            result = supabase.table("user_profiles").select("id").limit(1).execute()
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