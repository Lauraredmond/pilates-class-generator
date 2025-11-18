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
    setup_position: Optional[str] = None
    breathing_pattern: Optional[str] = None
    primary_muscles: Optional[List[str]] = Field(default_factory=list)
    secondary_muscles: Optional[List[str]] = Field(default_factory=list)
    duration_seconds: Optional[int] = None
    prerequisites: Optional[List[str]] = Field(default_factory=list)
    contraindications: Optional[List[str]] = Field(default_factory=list)
    modifications: Optional[dict] = Field(default_factory=dict)

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
