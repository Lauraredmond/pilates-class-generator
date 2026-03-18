"""
Class Sections API
Endpoints for all 6 Pilates class sections (Session 11)
"""

from fastapi import APIRouter, HTTPException, status, Depends, Path
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from utils.auth import get_current_user_id
from utils.logger import get_logger
from models.error import ErrorMessages

load_dotenv()

logger = get_logger(__name__)

router = APIRouter(prefix="/api/class-sections", tags=["Class Sections"])

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================
# PYDANTIC MODELS
# ============================================

class PreparationScript(BaseModel):
    id: str = Field(..., description="Unique identifier")
    script_name: str = Field(..., description="Script Name")
    script_type: str = Field(..., description="Script Type")  # 'centering', 'breathing', 'principles'
    narrative: str = Field(..., description="Narrative")
    key_principles: List[str] = Field(..., description="Key Principles")
    duration_seconds: int = Field(..., description="Duration in seconds")
    voiceover_url: Optional[str] = Field(None, description="URL for voiceover")
    voiceover_duration: Optional[int] = Field(None, description="Voiceover Duration")
    voiceover_enabled: Optional[bool] = Field(False, description="Voiceover Enabled")
    video_url: Optional[str] = Field(None, description="URL for video")  # AWS CloudFront video demonstration (optional)
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class WarmupRoutine(BaseModel):
    id: str = Field(..., description="Unique identifier")
    routine_name: str = Field(..., description="Routine Name")
    focus_area: str = Field(..., description="Focus Area")  # 'spine', 'hips', 'shoulders', 'full_body'
    narrative: str = Field(..., description="Narrative")
    movements: Any = Field(..., description="List of movements in the sequence")  # JSONB - can be array or object
    duration_seconds: int = Field(..., description="Duration in seconds")
    contraindications: List[str] = Field(..., description="Contraindications")
    modifications: Optional[Any] = Field(None, description="Modifications")  # JSONB - can be array or object
    difficulty_level: str = Field(..., description="Difficulty level (Beginner, Intermediate, or Advanced)")
    voiceover_url: Optional[str] = Field(None, description="URL for voiceover")
    voiceover_duration: Optional[int] = Field(None, description="Voiceover Duration")
    voiceover_enabled: Optional[bool] = Field(False, description="Voiceover Enabled")
    video_url: Optional[str] = Field(None, description="URL for video")  # AWS CloudFront video demonstration (optional)
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class CooldownSequence(BaseModel):
    id: str = Field(..., description="Unique identifier")
    sequence_name: str = Field(..., description="Sequence Name")
    intensity_level: str = Field(..., description="Intensity Level")  # 'gentle', 'moderate', 'deep'
    narrative: str = Field(..., description="Narrative")
    stretches: Any = Field(..., description="Stretches")  # JSONB - can be array or object
    duration_seconds: int = Field(..., description="Duration in seconds")
    target_muscles: List[str] = Field(..., description="Target Muscles")
    recovery_focus: str = Field(..., description="Recovery Focus")
    voiceover_url: Optional[str] = Field(None, description="URL for voiceover")
    voiceover_duration: Optional[int] = Field(None, description="Voiceover Duration")
    voiceover_enabled: Optional[bool] = Field(False, description="Voiceover Enabled")
    video_url: Optional[str] = Field(None, description="URL for video")  # AWS CloudFront video demonstration (optional)
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ClosingMeditationScript(BaseModel):
    id: str = Field(..., description="Unique identifier")
    script_name: str = Field(..., description="Script Name")
    meditation_theme: str = Field(..., description="Meditation Theme")  # 'body_scan', 'gratitude', 'breath', 'mindfulness'
    script_text: str = Field(..., description="Script Text")
    breathing_guidance: Optional[str] = Field(None, description="Breathing Guidance")
    duration_seconds: int = Field(..., description="Duration in seconds")
    post_intensity: str = Field(..., description="Post Intensity")  # 'high', 'moderate', 'low'
    voiceover_url: Optional[str] = Field(None, description="URL for voiceover")
    voiceover_duration: Optional[int] = Field(None, description="Voiceover Duration")
    voiceover_enabled: Optional[bool] = Field(False, description="Voiceover Enabled")
    video_url: Optional[str] = Field(None, description="URL for video")  # AWS CloudFront video demonstration (optional)
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ClosingHomecareAdvice(BaseModel):
    id: str = Field(..., description="Unique identifier")
    advice_name: str = Field(..., description="Advice Name")
    focus_area: str = Field(..., description="Focus Area")  # 'spine_care', 'injury_prevention', 'recovery', 'daily_practice'
    advice_text: str = Field(..., description="Advice Text")
    actionable_tips: List[str] = Field(..., description="Actionable Tips")
    duration_seconds: int = Field(..., description="Duration in seconds")
    related_to_class_focus: bool = Field(..., description="Related To Class Focus")
    voiceover_url: Optional[str] = Field(None, description="URL for voiceover")
    voiceover_duration: Optional[int] = Field(None, description="Voiceover Duration")
    voiceover_enabled: Optional[bool] = Field(False, description="Voiceover Enabled")
    video_url: Optional[str] = Field(None, description="URL for video")  # AWS CloudFront video demonstration (optional)
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


# ============================================
# PREPARATION SCRIPTS ENDPOINTS
# ============================================

@router.get("/preparation", response_model=List[PreparationScript])
async def get_preparation_scripts(
    script_type: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all preparation scripts

    Optional filters:
    - script_type: centering, breathing, principles
    """
    try:
        query = supabase.table("preparation_scripts").select("*")

        if script_type:
            query = query.eq("script_type", script_type)

        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"Failed to fetch preparation scripts: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/preparation/{script_id}", response_model=PreparationScript)
async def get_preparation_script(
    script_id: str = Path(..., description="Unique identifier (UUID) for the preparation/meditation script"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific preparation script by ID"""
    try:
        result = supabase.table("preparation_scripts").select("*").eq("id", script_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preparation script not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch preparation script {script_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ============================================
# WARMUP ROUTINES ENDPOINTS
# ============================================

@router.get("/warmup", response_model=List[WarmupRoutine])
async def get_warmup_routines(
    focus_area: Optional[str] = None,
    difficulty: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all warmup routines

    Optional filters:
    - focus_area: spine, hips, shoulders, full_body
    - difficulty: Beginner, Intermediate, Advanced
    """
    try:
        query = supabase.table("warmup_routines").select("*")

        if focus_area:
            query = query.eq("focus_area", focus_area)
        if difficulty:
            query = query.eq("difficulty_level", difficulty)

        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"Failed to fetch warmup routines: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/warmup/{routine_id}", response_model=WarmupRoutine)
async def get_warmup_routine(
    routine_id: str = Path(..., description="Unique identifier (UUID) for the warmup routine"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific warmup routine by ID"""
    try:
        result = supabase.table("warmup_routines").select("*").eq("id", routine_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warmup routine not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch warmup routine {routine_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ============================================
# COOLDOWN SEQUENCES ENDPOINTS
# ============================================

@router.get("/cooldown", response_model=List[CooldownSequence])
async def get_cooldown_sequences(
    intensity: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all cooldown sequences

    Optional filters:
    - intensity: gentle, moderate, deep
    """
    try:
        query = supabase.table("cooldown_sequences").select("*")

        if intensity:
            query = query.eq("intensity_level", intensity)

        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"Failed to fetch cooldown sequences: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/cooldown/{sequence_id}", response_model=CooldownSequence)
async def get_cooldown_sequence(
    sequence_id: str = Path(..., description="Unique identifier (UUID) for the cooldown sequence"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific cooldown sequence by ID"""
    try:
        result = supabase.table("cooldown_sequences").select("*").eq("id", sequence_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cooldown sequence not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch cooldown sequence {sequence_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ============================================
# CLOSING MEDITATION ENDPOINTS
# ============================================

@router.get("/closing-meditation", response_model=List[ClosingMeditationScript])
async def get_closing_meditations(
    theme: Optional[str] = None,
    post_intensity: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all closing meditation scripts

    Optional filters:
    - theme: body_scan, gratitude, breath, mindfulness
    - post_intensity: high, moderate, low (intensity of class that preceded)
    """
    try:
        query = supabase.table("closing_meditation_scripts").select("*")

        if theme:
            query = query.eq("meditation_theme", theme)
        if post_intensity:
            query = query.eq("post_intensity", post_intensity)

        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"Failed to fetch closing meditations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/closing-meditation/{script_id}", response_model=ClosingMeditationScript)
async def get_closing_meditation(
    script_id: str = Path(..., description="Unique identifier (UUID) for the preparation/meditation script"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific closing meditation script by ID"""
    try:
        result = supabase.table("closing_meditation_scripts").select("*").eq("id", script_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Closing meditation script not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch closing meditation {script_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ============================================
# CLOSING HOMECARE ADVICE ENDPOINTS
# ============================================

@router.get("/closing-homecare", response_model=List[ClosingHomecareAdvice])
async def get_closing_homecare_advice(
    focus_area: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all closing homecare advice

    Optional filters:
    - focus_area: spine_care, injury_prevention, recovery, daily_practice
    """
    try:
        query = supabase.table("closing_homecare_advice").select("*")

        if focus_area:
            query = query.eq("focus_area", focus_area)

        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"Failed to fetch homecare advice: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/closing-homecare/{advice_id}", response_model=ClosingHomecareAdvice)
async def get_homecare_advice(
    advice_id: str = Path(..., description="Unique identifier (UUID) for the homecare advice"),
    user_id: str = Depends(get_current_user_id)
):
    """Get specific homecare advice by ID"""
    try:
        result = supabase.table("closing_homecare_advice").select("*").eq("id", advice_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Homecare advice not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch homecare advice {advice_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorMessages.DATABASE_ERROR
        )
