"""
Movement models for Pilates exercises
Based on the 34 classical movements from Excel database
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class MovementBase(BaseModel):
    """Base movement model"""
    movement_number: int = Field(..., description="Sequential ID (1-34)")
    code: str = Field(..., description="URL-friendly identifier")
    name: str = Field(..., description="Official movement name")
    category: str = Field(..., description="Movement category")
    difficulty_level: str = Field(..., description="Beginner, Intermediate, or Advanced")


class Movement(MovementBase):
    """Complete movement model with all details"""
    id: UUID
    narrative: Optional[str] = None
    visual_cues: Optional[str] = None
    watch_out_points: Optional[str] = None
    setup_position: Optional[str] = None
    breathing_pattern: Optional[str] = None
    primary_muscles: Optional[List[str]] = Field(default_factory=list)
    secondary_muscles: Optional[List[str]] = Field(default_factory=list)
    duration_seconds: Optional[int] = None
    prerequisites: Optional[List[str]] = Field(default_factory=list)
    contraindications: Optional[List[str]] = Field(default_factory=list)

    # Teaching metadata (Session: Movement Families - December 2025)
    modifications: Optional[str] = Field(None, description="Free-form modification suggestions for different levels")
    tips: Optional[str] = Field(None, description="Teaching tips and cues for instructors")
    movement_family: Optional[str] = Field(
        None,
        description="Movement family classification: rolling, supine_abdominal, inversion, back_extension, hip_extensor, side_lying, other"
    )

    # Level flags (Y/N indicating which levels exist)
    level_1_description: Optional[str] = Field(None, description="Y if Level 1 exists, N otherwise")
    level_2_description: Optional[str] = Field(None, description="Y if Level 2 exists, N otherwise")
    level_3_description: Optional[str] = Field(None, description="Y if Level 3 exists, N otherwise")
    full_version_description: Optional[str] = Field(None, description="Y if Full Version exists, N otherwise")

    # Voiceover audio (Session 13.5+)
    voiceover_url: Optional[str] = Field(None, description="Supabase Storage URL for pre-recorded voiceover audio")
    voiceover_duration_seconds: Optional[int] = Field(None, description="Duration of voiceover audio in seconds")
    voiceover_enabled: Optional[bool] = Field(False, description="Whether to play voiceover audio during this movement")

    # Video demonstration (AWS Phase 1 - December 2025)
    video_url: Optional[str] = Field(None, description="CloudFront CDN URL for movement demonstration video (375px wide, picture-in-picture)")

    class Config:
        from_attributes = True


class MovementCreate(MovementBase):
    """Model for creating new movements"""
    narrative: Optional[str] = None
    visual_cues: Optional[str] = None
    setup_position: Optional[str] = None
    breathing_pattern: Optional[str] = None
    primary_muscles: Optional[List[str]] = Field(default_factory=list)
    secondary_muscles: Optional[List[str]] = Field(default_factory=list)
    duration_seconds: Optional[int] = None


class MovementUpdate(BaseModel):
    """Model for updating movements (all fields optional)"""
    name: Optional[str] = None
    narrative: Optional[str] = None
    visual_cues: Optional[str] = None
    setup_position: Optional[str] = None
    breathing_pattern: Optional[str] = None
    duration_seconds: Optional[int] = None


class MovementFilter(BaseModel):
    """Filters for querying movements"""
    difficulty_level: Optional[str] = None
    category: Optional[str] = None
    primary_muscle: Optional[str] = None
    min_duration: Optional[int] = None
    max_duration: Optional[int] = None


class MovementStats(BaseModel):
    """Movement statistics"""
    total_movements: int
    by_difficulty: dict
    by_category: dict
    database_connected: bool
