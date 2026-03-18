"""
AI Agent models for class generation and recommendations
EU AI Act compliant with decision logging
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class AgentDecision(BaseModel):
    """Base model for all agent decisions (EU AI Act compliance)"""
    agent_type: str = Field(..., description="sequence, music, meditation, or research")
    decision_id: UUID
    user_id: UUID
    timestamp: datetime
    input_parameters: Dict[str, Any]
    output_data: Dict[str, Any]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="Human-readable explanation")
    model_used: str
    processing_time_ms: float

    class Config:
        from_attributes = True


# ============================================
# SEQUENCE AGENT MODELS
# ============================================

class SequenceGenerationRequest(BaseModel):
    """Request to generate a movement sequence"""
    target_duration_minutes: int = Field(default=60, ge=10, le=120)  # Allow 10-min quick practice
    difficulty_level: str = Field(default="Beginner")
    focus_areas: Optional[List[str]] = Field(
        default=None,
        description="Muscle groups to emphasize: core, legs, back, etc."
    )
    required_movements: Optional[List[UUID]] = Field(
        default=None,
        description="Movements that must be included"
    )
    excluded_movements: Optional[List[UUID]] = Field(
        default=None,
        description="Movements to avoid"
    )
    strictness_level: str = Field(
        default="guided",
        description="strict, guided, or autonomous"
    )
    include_mcp_research: bool = Field(
        default=True,
        description="Enhance with web research"
    )


class SequenceGenerationResponse(BaseModel):
    """Response from sequence generation"""
    sequence: List[Dict[str, Any]]
    total_duration_minutes: int
    muscle_balance: Dict[str, float]
    validation: Dict[str, Any]
    mcp_enhancements: Optional[Dict[str, Any]] = None
    agent_decision: AgentDecision


# ============================================
# MUSIC AGENT MODELS
# ============================================

class MusicSelectionRequest(BaseModel):
    """Request for music recommendations"""
    class_duration_minutes: int = Field(
        ...,
        ge=1,
        le=120,
        description="Duration of the class in minutes. Used to select tracks that fit the total class time."
    )
    energy_curve: List[float] = Field(
        default_factory=list,
        description="Energy levels throughout class (0.0-1.0). Each value represents target energy for a segment of the class."
    )
    preferred_genres: Optional[List[str]] = Field(
        default=None,
        description="List of preferred music genres (e.g., ['Classical', 'Jazz']). If not specified, uses system defaults."
    )
    exclude_explicit: bool = Field(
        default=True,
        description="Whether to exclude explicit content from music selection. Default is True for family-friendly classes."
    )
    # JENTIC FIX: Use List instead of tuple to avoid anyOf array without items field
    target_bpm_range: Optional[List[int]] = Field(
        default=[90, 130],
        description="Target BPM range [min, max]. BPM (beats per minute) determines music tempo. Default 90-130 is suitable for Pilates.",
        min_length=2,
        max_length=2
    )


class Track(BaseModel):
    """Individual music track"""
    title: str = Field(..., description="Title of the music track")
    artist: str = Field(..., description="Name of the artist or composer")
    bpm: int = Field(..., ge=40, le=200, description="Beats per minute (tempo) of the track")
    duration_seconds: int = Field(..., ge=1, description="Duration of the track in seconds")
    energy_level: float = Field(..., ge=0.0, le=1.0, description="Energy level of the track (0.0 = calm, 1.0 = high energy)")
    url: Optional[str] = Field(None, description="URL to stream or download the track (if available)")
    source: str = Field(default="soundcloud", description="Music source platform (soundcloud, spotify, youtube, etc.)")


class MusicSelectionResponse(BaseModel):
    """Response from music agent"""
    playlist: List[Track] = Field(..., description="List of selected music tracks for the class")
    total_duration_seconds: int = Field(..., description="Total duration of the playlist in seconds")
    average_bpm: int = Field(..., description="Average BPM (tempo) across all tracks in the playlist")
    energy_curve_match: float = Field(..., ge=0.0, le=1.0, description="How well the playlist matches the requested energy curve (0.0-1.0, higher is better)")
    agent_decision: AgentDecision = Field(..., description="AI decision logging metadata for transparency (EU AI Act compliance)")


# ============================================
# MEDITATION AGENT MODELS
# ============================================

class MeditationRequest(BaseModel):
    """Request for meditation/cool-down script"""
    duration_minutes: int = Field(
        default=5,
        ge=2,
        le=15,
        description="Duration of meditation in minutes (2-15 min). Longer meditations provide deeper relaxation."
    )
    class_intensity: str = Field(
        default="moderate",
        description="Intensity level of the preceding class: 'low', 'moderate', or 'high'. Determines meditation pacing and recovery focus."
    )
    focus_theme: Optional[str] = Field(
        default=None,
        description="Meditation theme: 'mindfulness', 'body_scan', 'gratitude', 'breath_awareness', etc. If not specified, theme is selected automatically."
    )
    include_breathing: bool = Field(
        default=True,
        description="Whether to include breathing exercises in the meditation. Breathing guidance helps with relaxation and recovery."
    )


class MeditationResponse(BaseModel):
    """Response from meditation agent"""
    script: str = Field(..., description="Complete meditation script with step-by-step guidance for the instructor to read aloud")
    duration_minutes: int = Field(..., description="Actual duration of the meditation in minutes")
    theme: str = Field(..., description="The meditation theme used (e.g., 'mindfulness', 'body_scan')")
    breathing_pattern: Optional[str] = Field(None, description="Breathing pattern guidance (e.g., '4-7-8 breath', 'box breathing'). None if breathing not included.")
    suggested_position: str = Field(
        default="supine",
        description="Recommended body position for meditation: 'supine' (lying on back), 'seated', or 'corpse_pose' (savasana)"
    )
    agent_decision: AgentDecision = Field(..., description="AI decision logging metadata for transparency (EU AI Act compliance)")


# ============================================
# RESEARCH AGENT MODELS (MCP)
# ============================================

class ResearchRequest(BaseModel):
    """Request for MCP web research"""
    research_type: str = Field(
        ...,
        description="Type of research to perform: 'movement_cues', 'warmup', 'pregnancy', 'injury', or 'trends'. Determines search strategy and trusted sources."
    )
    movement_name: Optional[str] = Field(
        None,
        description="Name of the Pilates movement to research (required for 'movement_cues', 'pregnancy', 'injury' research types)"
    )
    target_muscles: Optional[List[str]] = Field(
        None,
        description="List of target muscle groups (required for 'warmup' research type)"
    )
    condition: Optional[str] = Field(
        None,
        description="Medical condition or concern to research (e.g., 'diastasis recti', 'lower back pain'). Used for 'pregnancy' and 'injury' research."
    )
    trusted_sources_only: bool = Field(
        default=True,
        description="Whether to limit research to trusted Pilates websites only. Recommended for safety and accuracy."
    )


class ResearchSource(BaseModel):
    """A research source from MCP"""
    url: str = Field(..., description="URL of the source website")
    title: str = Field(..., description="Title of the article or page")
    excerpt: str = Field(..., description="Relevant excerpt from the source that answers the research query")
    accessed: datetime = Field(..., description="Timestamp when the source was accessed")
    quality_score: float = Field(..., ge=0.0, le=1.0, description="Quality/credibility score of the source (0.0-1.0, higher is more trustworthy)")
    is_medical: bool = Field(default=False, description="Whether this is a medical/clinical source (requires special handling for safety)")
    credentials: Optional[str] = Field(None, description="Author credentials or website authority information (if available)")


class ResearchResponse(BaseModel):
    """Response from research agent"""
    research_type: str = Field(..., description="Type of research that was performed ('movement_cues', 'warmup', etc.)")
    findings: Dict[str, Any] = Field(..., description="Structured research findings with key insights organized by topic")
    sources: List[ResearchSource] = Field(..., description="List of sources used for this research, with quality scores and excerpts")
    quality_score: float = Field(..., ge=0.0, le=1.0, description="Overall quality score of the research results (0.0-1.0, based on source credibility)")
    cache_hit: bool = Field(..., description="Whether these results were retrieved from cache (True) or newly researched (False)")
    agent_decision: AgentDecision = Field(..., description="AI decision logging metadata for transparency (EU AI Act compliance)")


# ============================================
# AGENT ORCHESTRATION
# ============================================

class CompleteClassRequest(BaseModel):
    """Request to generate a complete class with all agents"""
    class_plan: SequenceGenerationRequest = Field(..., description="Movement sequence generation parameters (duration, difficulty, focus areas)")
    include_music: bool = Field(default=True, description="Whether to generate music recommendations for the class")
    include_meditation: bool = Field(default=True, description="Whether to include a closing meditation script")
    include_research: bool = Field(default=False, description="Whether to enhance class with web research (MCP). Disabled by default - experimental feature.")
    preferred_music_style: Optional[str] = Field(None, description="Preferred music genre for movement sections (prep, warmup, movements). Used for analytics tracking.")
    cooldown_music_style: Optional[str] = Field(None, description="Preferred music genre for cooldown sections (cooldown, meditation, homecare). Used for analytics tracking.")


class CompleteClassResponse(BaseModel):
    """Complete class with sequence, music, and meditation"""
    sequence: SequenceGenerationResponse = Field(..., description="Generated movement sequence with all movements, transitions, and safety validation")
    music: Optional[MusicSelectionResponse] = Field(None, description="Music playlist recommendation (if include_music was True)")
    meditation: Optional[MeditationResponse] = Field(None, description="Closing meditation script (if include_meditation was True)")
    research_enhancements: Optional[List[ResearchResponse]] = Field(None, description="Web research findings to enhance movements (if include_research was True)")
    total_processing_time_ms: float = Field(..., description="Total time taken to generate the complete class in milliseconds")
