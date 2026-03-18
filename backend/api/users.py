"""
User profile and statistics API
Manage user profiles, preferences, and view statistics
"""

from fastapi import APIRouter, HTTPException, status, Depends, Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from utils.auth import get_current_user_id, hash_password
from models.user import UserPreferences
from utils.logger import get_logger
from models.error import ErrorMessages

load_dotenv()

logger = get_logger(__name__)

router = APIRouter(prefix="/api/users", tags=["Users"])

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# Request/Response models
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, description="Full Name")
    email: Optional[EmailStr] = Field(None, description="Email address")


class PasswordChange(BaseModel):
    current_password: str = Field(..., description="Current Password")
    new_password: str = Field(..., description="New Password")


class UserStats(BaseModel):
    total_classes: int = Field(..., description="Total Classes")
    total_duration_minutes: int = Field(..., description="Total Duration Minutes")
    total_movements: int = Field(..., description="Total Movements")
    classes_this_week: int = Field(..., description="Classes This Week")
    classes_this_month: int = Field(..., description="Classes This Month")
    current_streak_days: int = Field(..., description="Current Streak Days")
    favorite_movements: List[dict] = Field(..., description="Favorite Movements")
    muscle_group_distribution: dict = Field(..., description="Muscle Group Distribution")
    difficulty_distribution: dict = Field(..., description="Difficulty Distribution")
    total_research_insights: int = Field(..., description="Total Research Insights")


class UserProfile(BaseModel):
    id: str = Field(..., description="Unique identifier")
    email: str = Field(..., description="Email address")
    full_name: Optional[str] = Field(..., description="Full Name")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_login: Optional[datetime] = Field(..., description="Last Login")
    preferences: UserPreferences = Field(..., description="Preferences")


@router.get("/me/profile", response_model=UserProfile)
async def get_user_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get current user's complete profile with preferences
    """
    try:
        # Get user profile
        profile_result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()

        if not profile_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )

        profile = profile_result.data[0]

        # Get user preferences
        prefs_result = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()

        preferences = UserPreferences(**prefs_result.data[0]) if prefs_result.data else UserPreferences()

        return UserProfile(
            id=profile["id"],
            email=profile["email"],
            full_name=profile.get("full_name"),
            created_at=profile["created_at"],
            last_login=profile.get("last_login"),
            preferences=preferences
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch profile for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.put("/me/profile")
async def update_user_profile(
    profile_update: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update current user's profile information
    """
    try:
        update_data = {}

        if profile_update.full_name is not None:
            update_data["full_name"] = profile_update.full_name

        if profile_update.email is not None:
            # Check if new email already exists
            existing = supabase.table("user_profiles").select("*").eq("email", profile_update.email).neq("id", user_id).execute()
            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            update_data["email"] = profile_update.email

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()

        return {
            "message": "Profile updated successfully",
            "updated_fields": list(update_data.keys())
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update profile for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.PROFILE_UPDATE_FAILED
        )


@router.post("/me/change-password")
async def change_password(
    password_data: PasswordChange,
    user_id: str = Depends(get_current_user_id)
):
    """
    Change user's password
    """
    try:
        # Get current user
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user = result.data[0]

        # Verify current password
        from utils.auth import verify_password
        if not verify_password(password_data.current_password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Hash new password
        new_hashed = hash_password(password_data.new_password)

        # Update password in database
        supabase.table("user_profiles").update({
            "hashed_password": new_hashed,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        # Update in Supabase Auth
        supabase.auth.update_user({
            "password": password_data.new_password
        })

        return {
            "message": "Password changed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change failed for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.PASSWORD_CHANGE_FAILED
        )


@router.get("/me/stats", response_model=UserStats)
async def get_user_stats(user_id: str = Depends(get_current_user_id)):
    """
    Get user's class planning and usage statistics
    """
    try:
        # Get all user's classes
        classes_result = supabase.table("generated_sequences").select("*").eq("user_id", user_id).execute()
        classes = classes_result.data or []

        # Calculate stats
        total_classes = len(classes)
        total_duration = sum(c.get("total_duration", 0) for c in classes)
        total_movements = sum(c.get("movement_count", 0) for c in classes)

        # Classes this week/month (simplified - would need proper date filtering)
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        classes_this_week = len([
            c for c in classes
            if datetime.fromisoformat(c["created_at"].replace('Z', '+00:00')) > week_ago
        ])

        classes_this_month = len([
            c for c in classes
            if datetime.fromisoformat(c["created_at"].replace('Z', '+00:00')) > month_ago
        ])

        # Get preferences for favorite movements
        prefs_result = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
        favorite_movements = []

        if prefs_result.data and prefs_result.data[0].get("favorite_movements"):
            fav_ids = prefs_result.data[0]["favorite_movements"]
            if fav_ids:
                movements_result = supabase.table("movement_details").select("id, name, difficulty_level").in_("id", fav_ids[:5]).execute()
                favorite_movements = movements_result.data or []

        # Muscle group distribution (placeholder - would need complex query)
        muscle_distribution = {
            "Core": 35,
            "Legs": 25,
            "Arms": 20,
            "Back": 15,
            "Other": 5
        }

        # Difficulty distribution
        difficulty_distribution = {
            "Beginner": 40,
            "Intermediate": 35,
            "Advanced": 25
        }

        # Current streak (placeholder - would need daily tracking)
        current_streak = 0

        # MCP research insights (placeholder)
        research_insights = 0

        return UserStats(
            total_classes=total_classes,
            total_duration_minutes=total_duration,
            total_movements=total_movements,
            classes_this_week=classes_this_week,
            classes_this_month=classes_this_month,
            current_streak_days=current_streak,
            favorite_movements=favorite_movements,
            muscle_group_distribution=muscle_distribution,
            difficulty_distribution=difficulty_distribution,
            total_research_insights=research_insights
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch stats for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(user_id: str = Depends(get_current_user_id)):
    """
    Delete user account (GDPR compliance)

    Permanently deletes user data
    """
    try:
        # Delete in correct order (respect foreign key constraints)
        # 1. First, delete tables that reference user_profiles
        tables_referencing_user_profiles = [
            "class_sequencing_reports",  # This was missing and causing the error
            "beta_feedback",
            "llm_invocation_log",
            "play_sessions",
            "user_preferences"
        ]

        for table in tables_referencing_user_profiles:
            try:
                supabase.table(table).delete().eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete from {table} for user {user_id}: {str(e)}")
                # Continue with other deletions even if one fails

        # 2. Then delete tables that reference users (auth.users)
        tables_referencing_users = [
            "class_history",
            "class_plans",
            "medical_exclusions_log",
            "movement_usage",
            "student_profiles"
        ]

        for table in tables_referencing_users:
            try:
                supabase.table(table).delete().eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete from {table} for user {user_id}: {str(e)}")

        # Also delete where user is an instructor
        try:
            supabase.table("student_profiles").delete().eq("instructor_id", user_id).execute()
        except Exception as e:
            logger.warning(f"Failed to delete instructor references for user {user_id}: {str(e)}")

        # 3. Delete generated_sequences (also references user_id)
        try:
            supabase.table("generated_sequences").delete().eq("user_id", user_id).execute()
        except Exception as e:
            logger.warning(f"Failed to delete generated_sequences for user {user_id}: {str(e)}")

        # 4. Finally, delete the user profile itself
        supabase.table("user_profiles").delete().eq("id", user_id).execute()

        # 5. Delete from Supabase Auth
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            logger.warning(f"Failed to delete from Supabase Auth for user {user_id}: {str(e)}")
            # Don't fail if auth deletion fails - the data is already deleted

        return None

    except Exception as e:
        logger.error(f"Account deletion failed for user {user_id}: {str(e)}", exc_info=True)
        # Provide more detailed error message
        error_msg = str(e)
        if "foreign key constraint" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Account deletion failed. Some data may have been deleted. Please contact support. Error: {error_msg}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_ERROR
            )


@router.get("/me/preferences", response_model=UserPreferences)
async def get_user_preferences(user_id: str = Depends(get_current_user_id)):
    """
    Get user's preferences
    """
    try:
        result = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()

        if not result.data:
            # Return defaults if no preferences exist
            return UserPreferences()

        return UserPreferences(**result.data[0])

    except Exception as e:
        logger.error(f"Failed to fetch preferences for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.put("/me/preferences", response_model=UserPreferences)
async def update_user_preferences(
    preferences: UserPreferences,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update user's preferences
    """
    try:
        prefs_data = preferences.dict()
        prefs_data["user_id"] = user_id
        prefs_data["updated_at"] = datetime.utcnow().isoformat()

        # Upsert (insert or update)
        result = supabase.table("user_preferences").upsert(prefs_data).execute()

        return UserPreferences(**result.data[0])

    except Exception as e:
        logger.error(f"Failed to update preferences for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )
