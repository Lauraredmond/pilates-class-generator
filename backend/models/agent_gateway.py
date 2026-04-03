"""
Agent Gateway Models
Simplified request/response models optimized for AI agent integration
These models provide a simpler interface than the full API models
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ============================================
# AUTHENTICATION
# ============================================

class AgentLoginRequest(BaseModel):
    """Simplified login request for agents"""
    email: EmailStr = Field(..., description="User email address", example="user@example.com")
    password: str = Field(..., description="User password", example="SecurePass123!")


class AgentRegisterRequest(BaseModel):
    """Simplified registration request for agents"""
    email: EmailStr = Field(..., description="User email address", example="user@example.com")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)", example="SecurePass123!")
    full_name: Optional[str] = Field(None, description="User's full name", example="Jane Doe")


class AgentAuthResponse(BaseModel):
    """Simplified auth response for agents"""
    access_token: str = Field(..., description="JWT access token for API authentication")
    user_id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User email address")


class AgentUserProfile(BaseModel):
    """Simplified user profile for agents"""
    user_id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, description="User's full name")
    total_classes: int = Field(default=0, description="Total classes completed")
    current_level: str = Field(default="Beginner", description="Current difficulty level")


# ============================================
# CLASS GENERATION
# ============================================

class AgentGenerateClassRequest(BaseModel):
    """Simplified class generation request for agents"""
    duration_minutes: int = Field(
        ...,
        ge=10,
        le=120,
        description="Class duration in minutes (10-120)",
        example=60
    )
    difficulty_level: str = Field(
        ...,
        description="Difficulty level: Beginner, Intermediate, or Advanced",
        example="Beginner"
    )
    focus_areas: Optional[List[str]] = Field(
        None,
        description="Optional muscle groups to emphasize (e.g., core, legs, back)",
        example=["core", "back"]
    )
    include_music: bool = Field(
        default=True,
        description="Include music playlist in the class"
    )
    include_meditation: bool = Field(
        default=True,
        description="Include closing meditation script"
    )


class AgentMovementSummary(BaseModel):
    """Simplified movement summary for agents"""
    name: str = Field(..., description="Movement name", example="The Hundred")
    duration_seconds: int = Field(..., description="Duration in seconds", example=60)
    difficulty_level: str = Field(..., description="Difficulty level", example="Beginner")
    primary_muscles: List[str] = Field(..., description="Primary muscle groups", example=["Core"])


class AgentMusicSummary(BaseModel):
    """Simplified music summary for agents"""
    total_tracks: int = Field(..., description="Number of tracks in playlist", example=8)
    total_duration_seconds: int = Field(..., description="Total playlist duration", example=3600)
    genres: List[str] = Field(..., description="Music genres included", example=["Classical", "Ambient"])


class AgentClassResponse(BaseModel):
    """Simplified class response for agents"""
    class_id: str = Field(..., description="Unique class identifier")
    duration_minutes: int = Field(..., description="Total class duration in minutes")
    difficulty_level: str = Field(..., description="Class difficulty level")
    movement_count: int = Field(..., description="Number of movements in class")
    movements: List[AgentMovementSummary] = Field(..., description="List of movements")
    has_music: bool = Field(..., description="Whether class includes music")
    has_meditation: bool = Field(..., description="Whether class includes meditation")
    music: Optional[AgentMusicSummary] = Field(None, description="Music summary (if included)")
    created_at: str = Field(..., description="When class was created (ISO 8601)")


class AgentSavedClass(BaseModel):
    """Simplified saved class summary for agents"""
    class_id: str = Field(..., description="Unique class identifier")
    duration_minutes: int = Field(..., description="Class duration in minutes")
    difficulty_level: str = Field(..., description="Difficulty level")
    movement_count: int = Field(..., description="Number of movements")
    created_at: str = Field(..., description="When class was created")
    last_accessed: Optional[str] = Field(None, description="When class was last accessed")


# ============================================
# ANALYTICS
# ============================================

class AgentAnalyticsSummary(BaseModel):
    """Simplified analytics summary for agents"""
    total_classes: int = Field(..., description="Total classes completed", example=45)
    total_practice_minutes: int = Field(..., description="Total practice time in minutes", example=2700)
    current_level: str = Field(..., description="Current difficulty level", example="Intermediate")
    practice_streak_days: int = Field(..., description="Current practice streak in days", example=12)
    favorite_movements: List[str] = Field(..., description="Most practiced movements", example=["The Hundred", "Roll Up"])
    muscle_balance: dict = Field(
        ...,
        description="Muscle group balance percentages",
        example={"core": 35, "legs": 25, "back": 20, "arms": 15, "other": 5}
    )
    this_week_classes: int = Field(..., description="Classes completed this week", example=3)
    this_month_classes: int = Field(..., description="Classes completed this month", example=12)


class AgentTimeSeriesData(BaseModel):
    """Time series data for analytics views (simplified from analytics.py)"""
    label: str = Field(..., description="Movement or muscle group name", example="The Hundred")
    periods: List[int] = Field(..., description="Counts for each time period", example=[2, 5, 3, 4])
    period_labels: List[str] = Field(..., description="Labels for each period", example=["Week 1", "Week 2", "Week 3", "Week 4"])
    total: int = Field(..., description="Total count across all periods", example=14)


class AgentPracticeFrequencyData(BaseModel):
    """Practice frequency chart data (simplified from analytics.py)"""
    period_labels: List[str] = Field(..., description="Period labels", example=["Week 1", "Week 2", "Week 3", "Week 4"])
    class_counts: List[int] = Field(..., description="Number of classes per period", example=[3, 5, 2, 4])


class AgentDifficultyProgressionData(BaseModel):
    """Difficulty progression chart data (simplified from analytics.py)"""
    period_labels: List[str] = Field(..., description="Period labels", example=["Week 1", "Week 2", "Week 3", "Week 4"])
    beginner_counts: List[int] = Field(..., description="Beginner class counts", example=[2, 1, 0, 0])
    intermediate_counts: List[int] = Field(..., description="Intermediate class counts", example=[1, 3, 2, 2])
    advanced_counts: List[int] = Field(..., description="Advanced class counts", example=[0, 1, 2, 2])


class AgentMuscleDistributionData(BaseModel):
    """Muscle distribution data for doughnut/pie chart (simplified from analytics.py)"""
    muscle_groups: List[str] = Field(..., description="Muscle group names", example=["Core", "Legs", "Back", "Arms"])
    percentages: List[float] = Field(..., description="Percentage for each muscle group", example=[35.0, 25.0, 20.0, 15.0])


class AgentMovementFamilyDistributionData(BaseModel):
    """Movement family distribution data (simplified from analytics.py)"""
    families: List[str] = Field(..., description="Movement family names", example=["Flexion", "Extension", "Rotation"])
    percentages: List[float] = Field(..., description="Percentage for each family", example=[40.0, 30.0, 30.0])


class AgentPlayStatistics(BaseModel):
    """User play statistics (simplified from analytics.py)"""
    total_sessions: int = Field(..., description="Total play sessions", example=52)
    qualified_plays: int = Field(..., description="Qualified plays (>120s)", example=45)
    completed_classes: int = Field(..., description="Completed classes", example=38)
    total_play_minutes: int = Field(..., description="Total play time in minutes", example=2850)
    completion_rate_percentage: float = Field(..., description="Completion rate %", example=84.4)


# ============================================
# MOVEMENTS
# ============================================

class AgentMovementDetail(BaseModel):
    """Simplified movement detail for agents"""
    id: str = Field(..., description="Unique movement identifier")
    name: str = Field(..., description="Movement name", example="The Hundred")
    difficulty_level: str = Field(..., description="Difficulty level", example="Beginner")
    primary_muscles: List[str] = Field(..., description="Primary muscles targeted", example=["Core"])
    duration_seconds: int = Field(..., description="Typical duration in seconds", example=60)
    description: str = Field(..., description="Brief description of the movement")
    contraindications: List[str] = Field(
        default_factory=list,
        description="When to avoid this movement",
        example=["Neck injury", "Lower back pain"]
    )


# ============================================
# MUSIC
# ============================================

class AgentMusicPlaylist(BaseModel):
    """Simplified music playlist for agents"""
    playlist_id: str = Field(..., description="Unique playlist identifier")
    name: str = Field(..., description="Playlist name", example="Classical Calm")
    genre: str = Field(..., description="Music genre", example="Classical")
    total_tracks: int = Field(..., description="Number of tracks", example=12)
    total_duration_seconds: int = Field(..., description="Total duration", example=3600)
    suitable_for: List[str] = Field(..., description="Suitable class types", example=["Beginner", "Meditation"])


# ============================================
# COMMON RESPONSES
# ============================================

class AgentSuccessResponse(BaseModel):
    """Standard success response for agents"""
    success: bool = Field(default=True, description="Operation succeeded")
    message: str = Field(..., description="Human-readable success message")


class AgentErrorResponse(BaseModel):
    """Simplified error response for agents"""
    success: bool = Field(default=False, description="Operation failed")
    error: str = Field(..., description="Error type", example="validation_error")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
