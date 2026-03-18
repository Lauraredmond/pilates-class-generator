"""
Class plan models for Pilates class sequences
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class ClassMovement(BaseModel):
    """A movement within a class sequence"""
    movement_id: UUID = Field(..., description="Movement identifier")
    movement_name: str = Field(..., description="Movement Name")
    order_index: int = Field(..., description="Position in sequence (0-indexed)")
    duration_seconds: int = Field(..., description="Duration for this instance")
    custom_cues: Optional[str] = Field(None, description="Custom Cues")
    notes: Optional[str] = Field(None, description="Notes")

    class Config:
        from_attributes = True


class ClassPlanBase(BaseModel):
    """Base class plan model"""
    name: str  = Field(..., min_length=1, max_length=255, description="Name")
    description: Optional[str] = Field(None, description="Description")
    target_duration_minutes: int  = Field(default=60, ge=15, le=120, description="Target class duration in minutes")
    difficulty_level: str  = Field(default="Beginner", description="Difficulty level (Beginner, Intermediate, or Advanced)")
    is_public: bool  = Field(default=False, description="Whether the item is public")


class ClassPlanCreate(ClassPlanBase):
    """Model for creating a new class plan"""
    movements: List[ClassMovement] = Field(default_factory=list)


class ClassPlanUpdate(BaseModel):
    """Model for updating a class plan (all fields optional)"""
    name: Optional[str] = Field(None, description="Name")
    description: Optional[str] = Field(None, description="Description")
    target_duration_minutes: Optional[int] = Field(None, description="Target class duration in minutes")
    difficulty_level: Optional[str] = Field(None, description="Difficulty level (Beginner, Intermediate, or Advanced)")
    is_public: Optional[bool] = Field(None, description="Whether the item is public")
    movements: Optional[List[ClassMovement]] = Field(None, description="List of movements in the sequence")


class ClassPlan(ClassPlanBase):
    """Complete class plan model"""
    id: UUID
    user_id: UUID
    movements: List[ClassMovement]
    actual_duration_minutes: Optional[int] = None
    muscle_balance: Optional[dict] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassPlanSummary(BaseModel):
    """Summary of a class plan (for lists)"""
    id: UUID = Field(..., description="Unique identifier")
    name: str = Field(..., description="Name")
    description: Optional[str] = Field(None, description="Description")
    target_duration_minutes: int = Field(..., description="Target class duration in minutes")
    difficulty_level: str = Field(..., description="Difficulty level (Beginner, Intermediate, or Advanced)")
    movement_count: int = Field(..., description="Number of movement")
    created_at: datetime = Field(..., description="Creation timestamp")
    is_public: bool = Field(..., description="Whether the item is public")

    class Config:
        from_attributes = True


class SequenceValidation(BaseModel):
    """Validation result for a movement sequence"""
    is_valid: bool = Field(..., description="Whether valid")
    safety_score: float  = Field(..., ge=0.0, le=1.0, description="Safety Score")
    violations: List[str]  = Field(default_factory=list, description="Violations")
    warnings: List[str]  = Field(default_factory=list, description="Warnings")
    muscle_balance: dict  = Field(default_factory=dict, description="Muscle Balance")
    recommendations: List[str]  = Field(default_factory=list, description="Recommendations")


class MuscleBalance(BaseModel):
    """Muscle group balance tracking"""
    core: float = Field(0.0, description="Core")
    legs: float = Field(0.0, description="Legs")
    arms: float = Field(0.0, description="Arms")
    back: float = Field(0.0, description="Back")
    hip_flexors: float = Field(0.0, description="Hip Flexors")
    glutes: float = Field(0.0, description="Glutes")
    shoulders: float = Field(0.0, description="Shoulders")
    total_load: float = Field(0.0, description="Total Load")
    balance_score: float  = Field(..., ge=0.0, le=1.0, description="Balance Score")
