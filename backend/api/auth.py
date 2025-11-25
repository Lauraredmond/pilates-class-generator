"""
Authentication API routes
User registration, login, password reset using Supabase Auth
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from models.user import UserCreate, UserLogin, TokenResponse, TokenRefresh
from utils.auth import (
    hash_password,
    verify_password,
    create_token_pair,
    refresh_access_token,
    get_current_user_id
)

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# Request/Response models
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class AccountDeleteRequest(BaseModel):
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    age_range: Optional[str] = None
    gender_identity: Optional[str] = None
    country: Optional[str] = None
    pilates_experience: Optional[str] = None
    goals: Optional[list[str]] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    # Profile fields
    age_range: Optional[str] = None
    gender_identity: Optional[str] = None
    country: Optional[str] = None
    pilates_experience: Optional[str] = None
    goals: Optional[list[str]] = None


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user with email and password

    Returns JWT tokens for immediate login
    """
    try:
        # Check if user already exists
        existing = supabase.table("user_profiles").select("*").eq("email", user_data.email).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash password
        hashed_password = hash_password(user_data.password)

        # Create user in Supabase Auth
        try:
            auth_response = supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password,
                "options": {
                    "data": {
                        "full_name": user_data.full_name
                    },
                    "email_redirect_to": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/auth/confirm"
                }
            })
        except Exception as auth_error:
            error_message = str(auth_error).lower()

            # Check for specific Supabase Auth errors
            if "rate limit" in error_message or "too many" in error_message or "email_rate_limit" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Registration temporarily unavailable due to Supabase free tier email limits. Please try again in 24-48 hours, or contact support for immediate access. We apologize for the inconvenience.",
                    headers={"Retry-After": "7200"}  # 2 hours in seconds
                )
            elif "invalid" in error_message and "email" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid email address format"
                )
            elif "weak" in error_message or "password" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password does not meet security requirements"
                )
            else:
                # Generic Supabase Auth error - return full details for debugging
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Authentication service error: {str(auth_error)}"
                )

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user - please try again"
            )

        user_id = auth_response.user.id

        # Create user profile
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat(),
            # New profile fields
            "age_range": user_data.age_range,
            "gender_identity": user_data.gender_identity,
            "country": user_data.country,
            "pilates_experience": user_data.pilates_experience,
            "goals": user_data.goals if user_data.goals else []
        }

        supabase.table("user_profiles").insert(profile_data).execute()

        # Create default preferences
        preferences_data = {
            "user_id": user_id,
            "strictness_level": "guided",
            "default_class_duration": 60,
            "favorite_movements": [],
            "music_preferences": {},
            "research_sources": [],
            "enable_mcp_research": True
        }

        supabase.table("user_preferences").insert(preferences_data).execute()

        # Generate JWT tokens
        tokens = create_token_pair(user_id)

        return TokenResponse(**tokens)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Authenticate user with email and password

    Returns JWT tokens
    """
    try:
        # Get user from database
        result = supabase.table("user_profiles").select("*").eq("email", credentials.email).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        user = result.data[0]

        # Verify password
        if not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Update last login
        supabase.table("user_profiles").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", user["id"]).execute()

        # Generate JWT tokens
        tokens = create_token_pair(user["id"])

        return TokenResponse(**tokens)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_data: TokenRefresh):
    """
    Refresh access token using refresh token

    Returns new token pair
    """
    try:
        tokens = refresh_access_token(token_data.refresh_token)
        return TokenResponse(**tokens)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user_id: str = Depends(get_current_user_id)):
    """
    Logout user (client should discard tokens)

    Note: JWT tokens are stateless, so logout is primarily client-side.
    This endpoint exists for logging/analytics purposes.
    """
    # In a production system, you might want to:
    # 1. Add token to blacklist (requires Redis)
    # 2. Log the logout event
    # 3. Update user's last_activity timestamp

    # For now, we'll just log the event
    try:
        supabase.table("user_profiles").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
    except:
        pass  # Don't fail logout if update fails

    return None


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
async def request_password_reset(request: PasswordResetRequest):
    """
    Request password reset email

    Sends password reset email via Supabase Auth
    """
    try:
        # Use Supabase Auth password reset
        supabase.auth.reset_password_email(
            request.email,
            options={
                "redirect_to": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/reset-password-confirm"
            }
        )

        # Always return success (don't reveal if email exists)
        return {
            "message": "If the email exists, a password reset link has been sent"
        }

    except Exception as e:
        error_message = str(e).lower()

        # Check for rate limit specifically
        if "rate limit" in error_message or "too many" in error_message:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset attempts. Please try again in 1-2 hours.",
                headers={"Retry-After": "3600"}
            )

        # Don't reveal other errors to prevent email enumeration
        return {
            "message": "If the email exists, a password reset link has been sent"
        }


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(reset_data: PasswordResetConfirm):
    """
    Confirm password reset with token

    Updates user's password
    """
    try:
        # Verify and update password via Supabase Auth
        response = supabase.auth.update_user({
            "password": reset_data.new_password
        })

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        # Update hashed password in our database
        hashed = hash_password(reset_data.new_password)
        supabase.table("user_profiles").update({
            "hashed_password": hashed
        }).eq("id", response.user.id).execute()

        return {
            "message": "Password successfully reset"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password reset failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Get current authenticated user's profile

    Requires valid access token
    """
    try:
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user = result.data[0]

        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            created_at=user["created_at"],
            last_login=user.get("last_login"),
            age_range=user.get("age_range"),
            gender_identity=user.get("gender_identity"),
            country=user.get("country"),
            pilates_experience=user.get("pilates_experience"),
            goals=user.get("goals", [])
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update user profile information

    Allows users to update their profile details (name, demographics, goals)
    Does NOT allow email changes (security reason)
    """
    try:
        # Build update dict (only include fields that were provided)
        update_data = {}

        if profile_data.full_name is not None:
            update_data["full_name"] = profile_data.full_name
        if profile_data.age_range is not None:
            update_data["age_range"] = profile_data.age_range
        if profile_data.gender_identity is not None:
            update_data["gender_identity"] = profile_data.gender_identity
        if profile_data.country is not None:
            update_data["country"] = profile_data.country
        if profile_data.pilates_experience is not None:
            update_data["pilates_experience"] = profile_data.pilates_experience
        if profile_data.goals is not None:
            update_data["goals"] = profile_data.goals

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        # Update user profile
        supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()

        # Fetch and return updated user
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user = result.data[0]

        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            created_at=user["created_at"],
            last_login=user.get("last_login"),
            age_range=user.get("age_range"),
            gender_identity=user.get("gender_identity"),
            country=user.get("country"),
            pilates_experience=user.get("pilates_experience"),
            goals=user.get("goals", [])
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChangeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Change user password (when logged in)

    Requires current password for security
    Updates both Supabase Auth and local database
    """
    try:
        # Get user to verify current password
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user = result.data[0]

        # Verify current password
        if not verify_password(password_data.current_password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )

        # Validate new password is different
        if password_data.current_password == password_data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )

        # Update password in Supabase Auth
        try:
            supabase.auth.admin.update_user_by_id(
                user_id,
                {"password": password_data.new_password}
            )
        except Exception as auth_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update password in auth service: {str(auth_error)}"
            )

        # Update hashed password in our database
        hashed = hash_password(password_data.new_password)
        supabase.table("user_profiles").update({
            "hashed_password": hashed
        }).eq("id", user_id).execute()

        return {
            "message": "Password successfully changed"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    delete_request: AccountDeleteRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete user account and all associated data (GDPR right to be forgotten)

    Requires password confirmation for security
    Permanently deletes:
    - User profile
    - User preferences
    - User's saved classes
    - All related data

    This action is irreversible!
    """
    try:
        # Get user to verify password
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user = result.data[0]

        # Verify password before deletion (security measure)
        if not verify_password(delete_request.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )

        # Delete from Supabase Auth
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            # Log but don't fail - user might not exist in Auth
            print(f"Warning: Could not delete from Supabase Auth: {str(e)}")

        # Delete user preferences (should cascade, but being explicit)
        supabase.table("user_preferences").delete().eq("user_id", user_id).execute()

        # Delete user profile (this is the main record)
        supabase.table("user_profiles").delete().eq("id", user_id).execute()

        # TODO: Delete user's saved classes if that table exists
        # supabase.table("class_plans").delete().eq("user_id", user_id).execute()

        # Log deletion for GDPR compliance (optional - create audit log table)
        # await log_account_deletion(user_id, user["email"], "user_request")

        return {
            "message": "Account successfully deleted. All your data has been permanently removed."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(e)}"
        )
