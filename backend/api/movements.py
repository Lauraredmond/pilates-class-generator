"""
Movements API Router - Session 2B
Endpoints for retrieving Pilates movement data
"""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from utils.logger import get_logger
from models.error import ErrorMessages
from orchestrator.tools.sequence_tools import SequenceTools

# Load environment variables
load_dotenv()

logger = get_logger(__name__)

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)


# Pydantic models for responses
from pydantic import Field

class Movement(BaseModel):
    id: str = Field(..., example="550e8400-e29b-41d4-a716-446655440001", description="Unique movement identifier")
    movement_number: int = Field(..., example=1, description="Sequential ID (1-34)")
    code: str = Field(..., example="the_hundred", description="URL-friendly identifier")
    name: str = Field(..., example="The Hundred", description="Movement name")
    category: str = Field(..., example="Core", description="Movement category")
    difficulty_level: str = Field(..., example="Intermediate", description="Difficulty level: Beginner = Path(..., description="Difficulty level: Beginner, Intermediate, or Advanced"), Intermediate, or Advanced")
    narrative: Optional[str] = Field(None, example="The Hundred is a classic Pilates exercise that builds core strength and stamina. Pump your arms vigorously while maintaining a strong, stable core.")
    visual_cues: Optional[str] = Field(None, example="Imagine pressing your spine into the mat while your arms pump like pistons")
    setup_position: Optional[str] = Field(None, example="Supine", description="Starting position")
    breathing_pattern: Optional[str] = Field(None, example="Inhale for 5 pumps, exhale for 5 pumps")
    primary_muscles: Optional[List[str]] = Field(None, example=["Core", "Hip Flexors"])
    secondary_muscles: Optional[List[str]] = Field(None, example=["Shoulders", "Neck"])
    duration_seconds: Optional[int] = Field(None, example=60, description="Duration in seconds")
    prerequisites: Optional[List[str]] = Field(None, example=["Basic core control", "Neck strength"])
    contraindications: Optional[List[str]] = Field(None, example=["Neck injury", "Lower back pain"])
    modifications: Optional[dict] = Field(None, example={"easier": "Keep head down", "harder": "Lower legs to 45 degrees"})

    # Voiceover audio (Session 13.5+) - MUST match database columns
    voiceover_url: Optional[str] = Field(None, example="https://bassline-audio.s3.amazonaws.com/movements/the-hundred.mp3")
    voiceover_duration_seconds: Optional[int] = Field(None, example=65)
    voiceover_enabled: Optional[bool] = Field(None, example=True)

    # Video demonstration (AWS Phase 1 - December 2025)
    video_url: Optional[str] = Field(None, example="https://bassline-videos.s3.amazonaws.com/movements/the-hundred.mp4")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "movement_number": 1,
                "code": "the_hundred",
                "name": "The Hundred",
                "category": "Core",
                "difficulty_level": "Intermediate",
                "narrative": "The Hundred is a classic Pilates exercise that builds core strength and stamina.",
                "visual_cues": "Imagine pressing your spine into the mat",
                "setup_position": "Supine",
                "breathing_pattern": "Inhale for 5 pumps, exhale for 5 pumps",
                "primary_muscles": ["Core", "Hip Flexors"],
                "secondary_muscles": ["Shoulders", "Neck"],
                "duration_seconds": 60,
                "prerequisites": ["Basic core control"],
                "contraindications": ["Neck injury"],
                "modifications": {"easier": "Keep head down", "harder": "Lower legs"},
                "voiceover_url": "https://bassline-audio.s3.amazonaws.com/movements/the-hundred.mp3",
                "voiceover_duration_seconds": 65,
                "voiceover_enabled": True,
                "video_url": "https://bassline-videos.s3.amazonaws.com/movements/the-hundred.mp4"
            }
        }


@router.get("/", response_model=List[Movement])
async def get_all_movements():
    """
    Get all Pilates movements from the database
    """
    try:
        response = supabase.table('movements').select('*').execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch all movements: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/search", response_model=List[Movement])
async def search_movements(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level: 'Beginner', 'Intermediate', or 'Advanced'"),
    muscle_group: Optional[str] = Query(None, description="Filter by primary muscle group (e.g., 'core', 'legs', 'back'). Case-insensitive partial match."),
    duration_min: Optional[int] = Query(None, ge=1, description="Minimum duration in seconds (inclusive filter)"),
    duration_max: Optional[int] = Query(None, ge=1, description="Maximum duration in seconds (inclusive filter)"),
    search: Optional[str] = Query(None, description="Text search in movement name (case-insensitive partial match)")
):
    """
    Search and filter movements with multiple criteria

    Query parameters:
    - difficulty: Filter by difficulty level (Beginner, Intermediate, Advanced)
    - muscle_group: Filter by primary muscle group (partial match)
    - duration_min: Minimum duration in seconds
    - duration_max: Maximum duration in seconds
    - search: Text search in movement name (case-insensitive)

    Example: /movements/search?difficulty=Beginner&muscle_group=core&duration_max=120
    """
    try:
        # Start with base query
        query = supabase.table('movements').select('*')

        # Apply filters
        if difficulty:
            query = query.eq('difficulty_level', difficulty)

        if search:
            # Text search in name (using ilike for case-insensitive partial match)
            query = query.ilike('name', f'%{search}%')

        # Execute query
        response = query.execute()
        movements = response.data

        # Apply client-side filters for complex conditions
        filtered_movements = movements

        # Filter by muscle group (requires checking JSON array)
        if muscle_group:
            filtered_movements = [
                m for m in filtered_movements
                if muscle_group.lower() in str(m.get('primary_muscles', [])).lower()
            ]

        # Filter by duration range
        if duration_min is not None:
            filtered_movements = [
                m for m in filtered_movements
                if m.get('duration_seconds') and m.get('duration_seconds') >= duration_min
            ]

        if duration_max is not None:
            filtered_movements = [
                m for m in filtered_movements
                if m.get('duration_seconds') and m.get('duration_seconds') <= duration_max
            ]

        return filtered_movements

    except Exception as e:
        logger.error(f"Failed to search movements with filters: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/difficulty/{level}", response_model=List[Movement])
async def get_movements_by_difficulty(
    level: str = Path(..., description="Difficulty level to filter by: 'Beginner', 'Intermediate', or 'Advanced'")
):
    """
    Get movements filtered by difficulty level
    Valid levels: Beginner, Intermediate, Advanced
    """
    try:
        response = supabase.table('movements').select('*').eq('difficulty_level', level).execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch movements by difficulty {level}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/stats/summary")
async def get_movement_stats():
    """
    Get summary statistics about movements in the database
    """
    try:
        # Get all movements
        all_movements = supabase.table('movements').select('*').execute()

        # Count by difficulty
        difficulty_counts = {}
        for movement in all_movements.data:
            level = movement.get('difficulty_level', 'Unknown')
            difficulty_counts[level] = difficulty_counts.get(level, 0) + 1

        # Count by category
        category_counts = {}
        for movement in all_movements.data:
            category = movement.get('category', 'Unknown')
            category_counts[category] = category_counts.get(category, 0) + 1

        return {
            "total_movements": len(all_movements.data),
            "by_difficulty": difficulty_counts,
            "by_category": category_counts,
            "database_connected": True
        }
    except Exception as e:
        logger.error(f"Failed to fetch movement stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/{movement_id}", response_model=Movement)
async def get_movement_by_id(
    movement_id: str = Path(..., description="Unique identifier (UUID) for the Pilates movement")
):
    """
    Get a specific movement by ID
    """
    try:
        response = supabase.table('movements').select('*').eq('id', movement_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Movement with ID {movement_id} not found"
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch movement by ID {movement_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


# Request/Response models for add-transitions endpoint
class MovementInput(BaseModel):
    """Movement data as input for transition insertion"""
    id: str = Field(..., example="550e8400-e29b-41d4-a716-446655440001")
    name: str = Field(..., example="The Hundred")
    setup_position: Optional[str] = Field(None, example="Supine")
    duration_seconds: Optional[int] = Field(None, example=60)
    # Include all other fields that should be preserved
    difficulty_level: Optional[str] = Field(None, example="Intermediate")
    primary_muscles: Optional[List[str]] = Field(None, example=["Core", "Hip Flexors"])
    narrative: Optional[str] = Field(None, example="Classic core strengthening exercise")
    watch_out_points: Optional[str] = Field(None, example="Keep neck relaxed")
    teaching_cues: Optional[List[Dict[str, Any]]] = Field(None, example=[{"timing": "start", "cue": "Engage your core"}])
    muscle_groups: Optional[List[Dict[str, Any]]] = Field(None, example=[{"name": "Core", "percentage": 60}])
    voiceover_url: Optional[str] = Field(None, example="https://bassline-audio.s3.amazonaws.com/movements/the-hundred.mp3")
    voiceover_duration_seconds: Optional[int] = Field(None, example=65)
    voiceover_enabled: Optional[bool] = Field(None, example=True)
    video_url: Optional[str] = Field(None, example="https://bassline-videos.s3.amazonaws.com/movements/the-hundred.mp4")

    class Config:
        extra = 'allow'  # Allow extra fields to pass through
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "The Hundred",
                "setup_position": "Supine",
                "duration_seconds": 60,
                "difficulty_level": "Intermediate",
                "primary_muscles": ["Core", "Hip Flexors"],
                "narrative": "Classic core strengthening exercise"
            }
        }


class AddTransitionsRequest(BaseModel):
    """Request body for adding transitions to a movement sequence"""
    movements: List[MovementInput]

    class Config:
        json_schema_extra = {
            "example": {
                "movements": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440001",
                        "name": "The Hundred",
                        "setup_position": "Supine",
                        "duration_seconds": 60
                    },
                    {
                        "id": "660e8400-e29b-41d4-a716-446655440002",
                        "name": "Roll Up",
                        "setup_position": "Supine",
                        "duration_seconds": 45
                    }
                ]
            }
        }


class SequenceItemResponse(BaseModel):
    """Response item that can be either a movement or a transition"""
    type: str = Field(..., example="movement", description="Item type: 'movement' or 'transition'")
    # Movement fields
    id: Optional[str] = Field(None, example="550e8400-e29b-41d4-a716-446655440001")
    name: Optional[str] = Field(None, example="The Hundred")
    duration_seconds: Optional[int] = Field(None, example=60)
    setup_position: Optional[str] = Field(None, example="Supine")
    difficulty_level: Optional[str] = Field(None, example="Intermediate")
    primary_muscles: Optional[List[str]] = Field(None, example=["Core", "Hip Flexors"])
    narrative: Optional[str] = Field(None, example="Transition smoothly from supine to sitting")
    watch_out_points: Optional[str] = Field(None, example="Keep neck relaxed")
    teaching_cues: Optional[List[Dict[str, Any]]] = Field(None, example=[{"timing": "start", "cue": "Engage core"}])
    muscle_groups: Optional[List[Dict[str, Any]]] = Field(None, example=[{"name": "Core", "percentage": 60}])
    voiceover_url: Optional[str] = Field(None, example="https://bassline-audio.s3.amazonaws.com/transitions/supine-to-sitting.mp3")
    voiceover_duration_seconds: Optional[int] = Field(None, example=15)
    voiceover_enabled: Optional[bool] = Field(None, example=True)
    video_url: Optional[str] = Field(None, example="https://bassline-videos.s3.amazonaws.com/movements/the-hundred.mp4")
    # Transition fields
    from_position: Optional[str] = Field(None, example="Supine")
    to_position: Optional[str] = Field(None, example="Sitting")
    voiceover_duration: Optional[int] = Field(None, example=15)

    class Config:
        extra = 'allow'  # Allow extra fields to pass through
        json_schema_extra = {
            # JENTIC FIX: examples must be an ExamplesMap (object), not an array
            "example": {
                "type": "movement",
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "The Hundred",
                "duration_seconds": 60,
                "setup_position": "Supine",
                "difficulty_level": "Intermediate",
                "primary_muscles": ["Core", "Hip Flexors"],
                "narrative": "The Hundred is a classic Pilates exercise",
                "voiceover_url": "https://bassline-audio.s3.amazonaws.com/movements/the-hundred.mp3",
                "voiceover_duration_seconds": 65,
                "voiceover_enabled": True,
                "video_url": "https://bassline-videos.s3.amazonaws.com/movements/the-hundred.mp4"
            }
        }


@router.post("/add-transitions", response_model=List[SequenceItemResponse])
async def add_transitions_to_movements(request: AddTransitionsRequest):
    """
    Add database-sourced transitions between movements

    This endpoint is specifically for Recording Mode where we have a predefined
    sequence of all 34 movements and need to insert transitions from the database.

    Unlike the full sequence generation endpoint, this ONLY adds transitions -
    it doesn't filter movements, apply safety rules, or limit movement count.

    Request body:
    {
      "movements": [
        {
          "id": "uuid",
          "name": "The Hundred",
          "setup_position": "Supine",
          "duration_seconds": 300,
          ...
        },
        ...
      ]
    }

    Returns:
    [
      { "type": "movement", "id": "...", "name": "The Hundred", ... },
      { "type": "transition", "from_position": "Supine", "to_position": "Supine", "narrative": "...", "duration_seconds": 40, "voiceover_url": "...", ... },
      { "type": "movement", "id": "...", "name": "Open Leg Rocker", ... },
      ...
    ]
    """
    try:
        logger.info(f"[add-transitions] Received {len(request.movements)} movements")

        # Convert Pydantic models to dicts for SequenceTools
        movements_list = [m.dict() for m in request.movements]

        # Add "type": "movement" to each movement (required by _add_transitions_to_sequence)
        for movement in movements_list:
            movement["type"] = "movement"

        # Initialize SequenceTools with Supabase client
        sequence_tools = SequenceTools(supabase_client=supabase)

        # Use the existing _add_transitions_to_sequence method from sequence_tools.py
        # This fetches transitions from the database with all fields:
        # - narrative (from database, not hardcoded)
        # - duration_seconds (from database, not hardcoded 60)
        # - voiceover_url, voiceover_duration, voiceover_enabled
        sequence_with_transitions = sequence_tools._add_transitions_to_sequence(movements_list)

        logger.info(
            f"[add-transitions] Added transitions: "
            f"{len(sequence_with_transitions)} total items "
            f"({len(request.movements)} movements + {len(sequence_with_transitions) - len(request.movements)} transitions)"
        )

        return sequence_with_transitions

    except Exception as e:
        logger.error(f"Failed to add transitions to movements: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add transitions: {str(e)}"
        )
