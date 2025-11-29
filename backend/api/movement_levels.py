"""
Movement Levels API
Endpoints for movement progression levels (L1 → L2 → L3 → Full)
Session 11: Data Model Expansion
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from utils.auth import get_current_user_id

load_dotenv()

router = APIRouter(prefix="/api/movements", tags=["Movement Levels"])

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================
# PYDANTIC MODELS
# ============================================

class MovementLevel(BaseModel):
    id: str
    movement_id: str
    level_number: int  # 1, 2, 3, 4 (Full)
    level_name: str  # "Level 1", "Level 2", "Level 3", "Full"

    # Level-specific content
    narrative: Optional[str] = None
    setup_position: Optional[str] = None
    watch_out_points: Optional[List[str]] = None
    teaching_cues: Optional[Dict[str, Any]] = None
    visual_cues: Optional[List[str]] = None
    muscle_groups: Optional[Dict[str, Any]] = None
    duration_seconds: Optional[int] = None

    created_at: datetime
    updated_at: datetime


class MovementLevelCreate(BaseModel):
    movement_id: str
    level_number: int = Field(..., ge=1, le=4, description="Level 1-4")
    level_name: str
    narrative: Optional[str] = None
    setup_position: Optional[str] = None
    watch_out_points: Optional[List[str]] = None
    teaching_cues: Optional[Dict[str, Any]] = None
    visual_cues: Optional[List[str]] = None
    muscle_groups: Optional[Dict[str, Any]] = None
    duration_seconds: Optional[int] = None


# ============================================
# MOVEMENT LEVELS ENDPOINTS
# ============================================

@router.get("/{movement_id}/levels", response_model=List[MovementLevel])
async def get_movement_levels(
    movement_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all levels for a specific movement

    Returns L1 → L2 → L3 → Full progression (if they exist)
    Not all movements have all 4 levels - returns only what exists
    """
    try:
        result = supabase.table("movement_levels").select("*").eq(
            "movement_id", movement_id
        ).order("level_number").execute()

        return result.data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch movement levels: {str(e)}"
        )


@router.get("/{movement_id}/levels/{level_number}", response_model=MovementLevel)
async def get_movement_level(
    movement_id: str,
    level_number: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get a specific level for a movement

    Parameters:
    - movement_id: UUID of the movement
    - level_number: 1, 2, 3, or 4 (Full)
    """
    try:
        if level_number < 1 or level_number > 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Level number must be between 1 and 4"
            )

        result = supabase.table("movement_levels").select("*").eq(
            "movement_id", movement_id
        ).eq("level_number", level_number).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Level {level_number} not found for this movement"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch movement level: {str(e)}"
        )


@router.post("/{movement_id}/levels", response_model=MovementLevel, status_code=status.HTTP_201_CREATED)
async def create_movement_level(
    movement_id: str,
    level_data: MovementLevelCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new level for a movement (Admin only in production)

    This endpoint is for populating movement progression data.
    In production, should be restricted to admin users.
    """
    try:
        # Verify movement exists
        movement_result = supabase.table("movements").select("id").eq("id", movement_id).execute()
        if not movement_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movement not found"
            )

        # Check if level already exists for this movement
        existing = supabase.table("movement_levels").select("*").eq(
            "movement_id", movement_id
        ).eq("level_number", level_data.level_number).execute()

        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Level {level_data.level_number} already exists for this movement"
            )

        # Create level
        level_dict = level_data.dict()
        level_dict["created_at"] = datetime.utcnow().isoformat()
        level_dict["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("movement_levels").insert(level_dict).execute()

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create movement level: {str(e)}"
        )


@router.put("/{movement_id}/levels/{level_number}", response_model=MovementLevel)
async def update_movement_level(
    movement_id: str,
    level_number: int,
    level_data: MovementLevelCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update an existing movement level (Admin only in production)
    """
    try:
        # Find existing level
        existing = supabase.table("movement_levels").select("*").eq(
            "movement_id", movement_id
        ).eq("level_number", level_number).execute()

        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Level {level_number} not found for this movement"
            )

        # Update level
        level_dict = level_data.dict()
        level_dict["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("movement_levels").update(level_dict).eq(
            "movement_id", movement_id
        ).eq("level_number", level_number).execute()

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update movement level: {str(e)}"
        )


@router.delete("/{movement_id}/levels/{level_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movement_level(
    movement_id: str,
    level_number: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a movement level (Admin only in production)
    """
    try:
        result = supabase.table("movement_levels").delete().eq(
            "movement_id", movement_id
        ).eq("level_number", level_number).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Level {level_number} not found for this movement"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete movement level: {str(e)}"
        )
