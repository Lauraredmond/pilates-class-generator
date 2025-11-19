"""
Analytics API Router
Endpoints for fetching user analytics data from class_history and movement_usage tables
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any
from pydantic import BaseModel
import os
import uuid
from datetime import datetime, timedelta, date
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger
from collections import defaultdict, Counter

# Load environment variables
load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)


# Pydantic models
class UserAnalyticsSummary(BaseModel):
    """Summary analytics for a user"""
    total_classes: int
    total_practice_time: int  # in minutes
    current_streak: int  # consecutive days with classes
    favorite_movement: str
    classes_this_week: int
    avg_class_duration: int  # in minutes


class MovementUsageData(BaseModel):
    """Movement usage data for charts"""
    movement: str
    week1: int
    week2: int
    week3: int
    week4: int
    week5: int
    total: int


class MuscleGroupHistory(BaseModel):
    """Muscle group distribution over time"""
    group: str
    week1: int
    week2: int
    week3: int
    week4: int
    week5: int
    total: int


@router.get("/summary/{user_id}", response_model=UserAnalyticsSummary)
async def get_user_analytics_summary(user_id: str):
    """
    Get summary analytics for a user

    Fetches data from class_history table and calculates:
    - Total classes generated
    - Total practice time
    - Current streak
    - Favorite movement
    - Classes this week
    - Average class duration
    """
    try:
        # Convert user_id to UUID format (matches sequence_agent conversion)
        user_uuid = _convert_to_uuid(user_id)

        # Fetch all class history for this user
        response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .order('taught_date', desc=True) \
            .execute()

        classes = response.data or []

        # Calculate total classes
        total_classes = len(classes)

        # Calculate total practice time
        total_practice_time = sum(c.get('actual_duration_minutes', 0) for c in classes)

        # Calculate average class duration
        avg_class_duration = total_practice_time // total_classes if total_classes > 0 else 0

        # Calculate current streak (consecutive days with classes)
        current_streak = _calculate_streak(classes)

        # Get favorite movement
        favorite_movement = await _get_favorite_movement(user_id)

        # Calculate classes this week
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        classes_this_week = sum(
            1 for c in classes
            if datetime.fromisoformat(c.get('taught_date', '')).date() >= week_start
        ) if classes else 0

        return UserAnalyticsSummary(
            total_classes=total_classes,
            total_practice_time=total_practice_time,
            current_streak=current_streak,
            favorite_movement=favorite_movement,
            classes_this_week=classes_this_week,
            avg_class_duration=avg_class_duration
        )

    except Exception as e:
        logger.error(f"Error fetching user analytics summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch analytics summary: {str(e)}"
        )


@router.get("/movement-history/{user_id}", response_model=List[MovementUsageData])
async def get_movement_usage_history(
    user_id: str,
    weeks: int = Query(default=5, ge=1, le=52)
):
    """
    Get movement usage history over the last N weeks

    Returns aggregated data showing how many times each movement was used per week
    """
    try:
        # Convert user_id to UUID format
        user_uuid = _convert_to_uuid(user_id)

        # Calculate date ranges for each week
        today = date.today()
        week_ranges = []
        for i in range(weeks):
            week_end = today - timedelta(days=i * 7)
            week_start = week_end - timedelta(days=7)
            week_ranges.append((week_start, week_end))

        # Fetch class history for the date range
        earliest_date = week_ranges[-1][0]
        response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = response.data or []

        # Aggregate movement counts by week
        movement_counts = defaultdict(lambda: [0] * weeks)

        for class_item in classes:
            class_date = datetime.fromisoformat(class_item.get('taught_date', '')).date()
            movements_snapshot = class_item.get('movements_snapshot', [])

            # Find which week this class belongs to
            for week_idx, (week_start, week_end) in enumerate(week_ranges):
                if week_start <= class_date <= week_end:
                    # Count movements in this class
                    for movement in movements_snapshot:
                        if movement.get('type') == 'movement':  # Skip transitions
                            movement_name = movement.get('name', 'Unknown')
                            movement_counts[movement_name][week_idx] += 1
                    break

        # Convert to response format
        result = []
        for movement_name, week_counts in movement_counts.items():
            result.append(MovementUsageData(
                movement=movement_name,
                week1=week_counts[4] if weeks > 4 else 0,
                week2=week_counts[3] if weeks > 3 else 0,
                week3=week_counts[2] if weeks > 2 else 0,
                week4=week_counts[1] if weeks > 1 else 0,
                week5=week_counts[0],
                total=sum(week_counts)
            ))

        # Sort by total usage (descending)
        result.sort(key=lambda x: x.total, reverse=True)

        return result[:20]  # Return top 20 movements

    except Exception as e:
        logger.error(f"Error fetching movement usage history: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch movement history: {str(e)}"
        )


@router.get("/muscle-group-history/{user_id}", response_model=List[MuscleGroupHistory])
async def get_muscle_group_history(
    user_id: str,
    weeks: int = Query(default=5, ge=1, le=52)
):
    """
    Get muscle group distribution over the last N weeks

    Returns aggregated data showing muscle group usage trends
    """
    try:
        # Convert user_id to UUID format
        user_uuid = _convert_to_uuid(user_id)

        # Calculate date ranges
        today = date.today()
        week_ranges = []
        for i in range(weeks):
            week_end = today - timedelta(days=i * 7)
            week_start = week_end - timedelta(days=7)
            week_ranges.append((week_start, week_end))

        # Fetch class history
        earliest_date = week_ranges[-1][0]
        response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = response.data or []

        # Aggregate muscle group counts by week
        muscle_counts = defaultdict(lambda: [0] * weeks)

        for class_item in classes:
            class_date = datetime.fromisoformat(class_item.get('taught_date', '')).date()
            movements_snapshot = class_item.get('movements_snapshot', [])

            # Find which week this class belongs to
            for week_idx, (week_start, week_end) in enumerate(week_ranges):
                if week_start <= class_date <= week_end:
                    # Count muscle groups in this class
                    for movement in movements_snapshot:
                        if movement.get('type') == 'movement':  # Skip transitions
                            muscle_groups = movement.get('muscle_groups', [])
                            for muscle_group in muscle_groups:
                                muscle_counts[muscle_group][week_idx] += 1
                    break

        # Convert to response format
        result = []
        for muscle_group, week_counts in muscle_counts.items():
            result.append(MuscleGroupHistory(
                group=muscle_group,
                week1=week_counts[4] if weeks > 4 else 0,
                week2=week_counts[3] if weeks > 3 else 0,
                week3=week_counts[2] if weeks > 2 else 0,
                week4=week_counts[1] if weeks > 1 else 0,
                week5=week_counts[0],
                total=sum(week_counts)
            ))

        # Sort by total usage (descending)
        result.sort(key=lambda x: x.total, reverse=True)

        return result[:10]  # Return top 10 muscle groups

    except Exception as e:
        logger.error(f"Error fetching muscle group history: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch muscle group history: {str(e)}"
        )


# Helper functions
def _convert_to_uuid(user_id: str) -> str:
    """
    Convert any user_id string to a valid UUID format
    Must match the conversion in sequence_agent.py
    """
    # If already a valid UUID, return as-is
    try:
        uuid.UUID(user_id)
        return user_id
    except ValueError:
        pass

    # Convert string to deterministic UUID using namespace
    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    user_uuid = uuid.uuid5(namespace, user_id)
    return str(user_uuid)


def _calculate_streak(classes: List[Dict[str, Any]]) -> int:
    """Calculate consecutive days with classes"""
    if not classes:
        return 0

    # Get unique dates (sorted descending)
    class_dates = sorted(
        set(datetime.fromisoformat(c.get('taught_date', '')).date() for c in classes),
        reverse=True
    )

    if not class_dates:
        return 0

    # Check if there's a class today or yesterday
    today = date.today()
    yesterday = today - timedelta(days=1)

    if class_dates[0] not in [today, yesterday]:
        return 0  # Streak broken

    # Count consecutive days
    streak = 1
    expected_date = class_dates[0] - timedelta(days=1)

    for class_date in class_dates[1:]:
        if class_date == expected_date:
            streak += 1
            expected_date -= timedelta(days=1)
        else:
            break

    return streak


async def _get_favorite_movement(user_id: str) -> str:
    """Get the most frequently used movement"""
    try:
        # Convert user_id to UUID format
        user_uuid = _convert_to_uuid(user_id)

        response = supabase.table('movement_usage') \
            .select('movement_id, usage_count') \
            .eq('user_id', user_uuid) \
            .order('usage_count', desc=True) \
            .limit(1) \
            .execute()

        if response.data and len(response.data) > 0:
            movement_id = response.data[0]['movement_id']

            # Get movement name
            movement_response = supabase.table('movements') \
                .select('name') \
                .eq('id', movement_id) \
                .execute()

            if movement_response.data:
                return movement_response.data[0]['name']

        return "The Hundred"  # Default favorite

    except Exception as e:
        logger.warning(f"Error getting favorite movement: {e}")
        return "The Hundred"
