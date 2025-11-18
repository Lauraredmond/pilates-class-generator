"""
Pydantic models for Pilates Class Planner v2.0
"""

from .user import (
    User,
    UserCreate,
    UserLogin,
    UserInDB,
    UserPreferences,
    TokenResponse,
    TokenRefresh
)

from .movement import (
    Movement,
    MovementCreate,
    MovementUpdate,
    MovementFilter,
    MovementStats
)

from .class_plan import (
    ClassPlan,
    ClassPlanCreate,
    ClassPlanUpdate,
    ClassPlanSummary,
    ClassMovement,
    SequenceValidation,
    MuscleBalance
)

from .agent import (
    AgentDecision,
    SequenceGenerationRequest,
    SequenceGenerationResponse,
    MusicSelectionRequest,
    MusicSelectionResponse,
    Track,
    MeditationRequest,
    MeditationResponse,
    ResearchRequest,
    ResearchResponse,
    ResearchSource,
    CompleteClassRequest,
    CompleteClassResponse
)

__all__ = [
    # User models
    "User",
    "UserCreate",
    "UserLogin",
    "UserInDB",
    "UserPreferences",
    "TokenResponse",
    "TokenRefresh",
    # Movement models
    "Movement",
    "MovementCreate",
    "MovementUpdate",
    "MovementFilter",
    "MovementStats",
    # Class plan models
    "ClassPlan",
    "ClassPlanCreate",
    "ClassPlanUpdate",
    "ClassPlanSummary",
    "ClassMovement",
    "SequenceValidation",
    "MuscleBalance",
    # Agent models
    "AgentDecision",
    "SequenceGenerationRequest",
    "SequenceGenerationResponse",
    "MusicSelectionRequest",
    "MusicSelectionResponse",
    "Track",
    "MeditationRequest",
    "MeditationResponse",
    "ResearchRequest",
    "ResearchResponse",
    "ResearchSource",
    "CompleteClassRequest",
    "CompleteClassResponse",
]
