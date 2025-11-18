"""
Class plan models for Pilates class sequences
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class ClassMovement(BaseModel):
    """A movement within a class sequence"""
    movement_id: UUID
    movement_name: str
    order_index: int = Field(..., description="Position in sequence (0-indexed)")
    duration_seconds: int = Field(..., description="Duration for this instance")
    custom_cues: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ClassPlanBase(BaseModel):
    """Base class plan model"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    target_duration_minutes: int = Field(default=60, ge=15, le=120)
    difficulty_level: str = Field(default="Beginner")
    is_public: bool = Field(default=False)


class ClassPlanCreate(ClassPlanBase):
    """Model for creating a new class plan"""
    movements: List[ClassMovement] = Field(default_factory=list)


class ClassPlanUpdate(BaseModel):
    """Model for updating a class plan (all fields optional)"""
    name: Optional[str] = None
    description: Optional[str] = None
    target_duration_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None
    is_public: Optional[bool] = None
    movements: Optional[List[ClassMovement]] = None


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
    id: UUID
    name: str
    description: Optional[str] = None
    target_duration_minutes: int
    difficulty_level: str
    movement_count: int
    created_at: datetime
    is_public: bool

    class Config:
        from_attributes = True


class SequenceValidation(BaseModel):
    """Validation result for a movement sequence"""
    is_valid: bool
    safety_score: float = Field(..., ge=0.0, le=1.0)
    violations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    muscle_balance: dict = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)


class MuscleBalance(BaseModel):
    """Muscle group balance tracking"""
    core: float = 0.0
    legs: float = 0.0
    arms: float = 0.0
    back: float = 0.0
    hip_flexors: float = 0.0
    glutes: float = 0.0
    shoulders: float = 0.0
    total_load: float = 0.0
    balance_score: float = Field(..., ge=0.0, le=1.0)
