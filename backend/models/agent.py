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
    target_duration_minutes: int = Field(default=60, ge=12, le=120)  # Allow 12-min quick practice
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
    class_duration_minutes: int
    energy_curve: List[float] = Field(
        default_factory=list,
        description="Energy levels throughout class (0.0-1.0)"
    )
    preferred_genres: Optional[List[str]] = None
    exclude_explicit: bool = True
    target_bpm_range: Optional[tuple[int, int]] = Field(
        default=(90, 130),
        description="Target BPM range"
    )


class Track(BaseModel):
    """Individual music track"""
    title: str
    artist: str
    bpm: int
    duration_seconds: int
    energy_level: float = Field(..., ge=0.0, le=1.0)
    url: Optional[str] = None
    source: str = "soundcloud"  # or "spotify", "youtube", etc.


class MusicSelectionResponse(BaseModel):
    """Response from music agent"""
    playlist: List[Track]
    total_duration_seconds: int
    average_bpm: int
    energy_curve_match: float = Field(..., ge=0.0, le=1.0)
    agent_decision: AgentDecision


# ============================================
# MEDITATION AGENT MODELS
# ============================================

class MeditationRequest(BaseModel):
    """Request for meditation/cool-down script"""
    duration_minutes: int = Field(default=5, ge=2, le=15)
    class_intensity: str = Field(
        default="moderate",
        description="low, moderate, high"
    )
    focus_theme: Optional[str] = Field(
        default=None,
        description="Theme: mindfulness, body_scan, gratitude, etc."
    )
    include_breathing: bool = True


class MeditationResponse(BaseModel):
    """Response from meditation agent"""
    script: str = Field(..., description="Full meditation script")
    duration_minutes: int
    theme: str
    breathing_pattern: Optional[str] = None
    suggested_position: str = Field(
        default="supine",
        description="supine, seated, or corpse_pose"
    )
    agent_decision: AgentDecision


# ============================================
# RESEARCH AGENT MODELS (MCP)
# ============================================

class ResearchRequest(BaseModel):
    """Request for MCP web research"""
    research_type: str = Field(
        ...,
        description="movement_cues, warmup, pregnancy, injury, trends"
    )
    movement_name: Optional[str] = None
    target_muscles: Optional[List[str]] = None
    condition: Optional[str] = None
    trusted_sources_only: bool = True


class ResearchSource(BaseModel):
    """A research source from MCP"""
    url: str
    title: str
    excerpt: str
    accessed: datetime
    quality_score: float = Field(..., ge=0.0, le=1.0)
    is_medical: bool = False
    credentials: Optional[str] = None


class ResearchResponse(BaseModel):
    """Response from research agent"""
    research_type: str
    findings: Dict[str, Any]
    sources: List[ResearchSource]
    quality_score: float = Field(..., ge=0.0, le=1.0)
    cache_hit: bool
    agent_decision: AgentDecision


# ============================================
# AGENT ORCHESTRATION
# ============================================

class CompleteClassRequest(BaseModel):
    """Request to generate a complete class with all agents"""
    class_plan: SequenceGenerationRequest
    include_music: bool = True
    include_meditation: bool = True
    include_research: bool = True


class CompleteClassResponse(BaseModel):
    """Complete class with sequence, music, and meditation"""
    sequence: SequenceGenerationResponse
    music: Optional[MusicSelectionResponse] = None
    meditation: Optional[MeditationResponse] = None
    research_enhancements: Optional[List[ResearchResponse]] = None
    total_processing_time_ms: float
