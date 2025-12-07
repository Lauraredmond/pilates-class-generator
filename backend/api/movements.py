"""
Movements API Router - Session 2B
Endpoints for retrieving Pilates movement data
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)


# Pydantic models for responses
class Movement(BaseModel):
    id: str
    movement_number: int  # Sequential ID (1-34)
    code: str  # URL-friendly identifier (e.g., "the_hundred")
    name: str
    category: str
    difficulty_level: str
    narrative: Optional[str] = None
    visual_cues: Optional[str] = None
    setup_position: Optional[str] = None
    breathing_pattern: Optional[str] = None
    primary_muscles: Optional[List[str]] = None
    secondary_muscles: Optional[List[str]] = None
    duration_seconds: Optional[int] = None
    prerequisites: Optional[List[str]] = None
    contraindications: Optional[List[str]] = None
    modifications: Optional[dict] = None

    # Voiceover audio (Session 13.5+) - MUST match database columns
    voiceover_url: Optional[str] = None
    voiceover_duration_seconds: Optional[int] = None
    voiceover_enabled: Optional[bool] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Movement])
async def get_all_movements():
    """
    Get all Pilates movements from the database
    """
    try:
        response = supabase.table('movements').select('*').execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.get("/search", response_model=List[Movement])
async def search_movements(
    difficulty: Optional[str] = None,
    muscle_group: Optional[str] = None,
    duration_min: Optional[int] = None,
    duration_max: Optional[int] = None,
    search: Optional[str] = None
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
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.get("/difficulty/{level}", response_model=List[Movement])
async def get_movements_by_difficulty(level: str):
    """
    Get movements filtered by difficulty level
    Valid levels: Beginner, Intermediate, Advanced
    """
    try:
        response = supabase.table('movements').select('*').eq('difficulty_level', level).execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
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
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{movement_id}", response_model=Movement)
async def get_movement_by_id(movement_id: str):
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
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
