"""
Analytics API Router V2
Enhanced with time period filtering and comprehensive data views
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum
import os
import uuid
from datetime import datetime, timedelta, date
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger
from collections import defaultdict

# Load environment variables
load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)


# Enums
class TimePeriod(str, Enum):
    DAY = "day"      # Last 7 days (daily granularity)
    WEEK = "week"    # Last 4 weeks (weekly granularity)
    MONTH = "month"  # Last 12 months (monthly granularity)
    TOTAL = "total"  # All time (single total)


# Pydantic models
class UserAnalyticsSummary(BaseModel):
    """Summary analytics for a user"""
    total_classes: int
    total_practice_time: int  # in minutes
    current_streak: int  # consecutive days with classes
    favorite_movement: str
    classes_this_week: int
    avg_class_duration: int  # in minutes


class TimeSeriesData(BaseModel):
    """Generic time series data with dynamic columns"""
    label: str  # Movement name or muscle group name
    periods: List[int]  # Counts for each time period
    period_labels: List[str]  # Labels for each period (e.g., "Mon", "Week 1", "Jan 2025")
    total: int


class ChartDataPoint(BaseModel):
    """Single data point for charts"""
    label: str
    value: int


class PracticeFrequencyData(BaseModel):
    """Practice frequency chart data"""
    period_labels: List[str]
    class_counts: List[int]


class DifficultyProgressionData(BaseModel):
    """Difficulty progression chart data"""
    period_labels: List[str]
    beginner_counts: List[int]
    intermediate_counts: List[int]
    advanced_counts: List[int]


class MuscleDistributionData(BaseModel):
    """Muscle distribution for doughnut chart"""
    muscle_groups: List[str]
    percentages: List[float]


# Helper functions
def _convert_to_uuid(user_id: str) -> str:
    """Convert any user_id string to a valid UUID format"""
    try:
        uuid.UUID(user_id)
        return user_id
    except ValueError:
        pass

    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    user_uuid = uuid.uuid5(namespace, user_id)
    return str(user_uuid)


def _get_date_ranges(period: TimePeriod) -> tuple[List[tuple[date, date]], List[str]]:
    """
    Calculate date ranges and labels based on time period

    Returns: (date_ranges, labels)
    - date_ranges: List of (start_date, end_date) tuples
    - labels: List of string labels for each period
    """
    today = date.today()
    ranges = []
    labels = []

    if period == TimePeriod.DAY:
        # Last 7 days
        for i in range(7):
            day = today - timedelta(days=i)
            ranges.append((day, day))
            labels.append(day.strftime("%a"))  # Mon, Tue, Wed...
        ranges.reverse()
        labels.reverse()

    elif period == TimePeriod.WEEK:
        # Last 4 weeks
        for i in range(4):
            week_end = today - timedelta(days=i * 7)
            week_start = week_end - timedelta(days=6)
            ranges.append((week_start, week_end))
            labels.append(f"Week {4-i}")
        ranges.reverse()
        labels.reverse()

    elif period == TimePeriod.MONTH:
        # Last 12 months
        for i in range(12):
            # Calculate first and last day of month
            if i == 0:
                month_end = today
            else:
                temp_date = today.replace(day=1) - timedelta(days=i * 30)
                month_end = (temp_date.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            month_start = month_end.replace(day=1)
            ranges.append((month_start, month_end))
            labels.append(month_end.strftime("%b %Y"))  # Jan 2025, Dec 2024...
        ranges.reverse()
        labels.reverse()

    elif period == TimePeriod.TOTAL:
        # All time - single range
        ranges.append((date(2020, 1, 1), today))  # Start from 2020 or adjust as needed
        labels.append("Total")

    return ranges, labels


# Endpoints
@router.get("/summary/{user_id}", response_model=UserAnalyticsSummary)
async def get_user_analytics_summary(user_id: str):
    """Get summary analytics for a user"""
    try:
        user_uuid = _convert_to_uuid(user_id)

        response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .order('taught_date', desc=True) \
            .execute()

        classes = response.data or []
        total_classes = len(classes)
        total_practice_time = sum(c.get('actual_duration_minutes', 0) for c in classes)
        avg_class_duration = total_practice_time // total_classes if total_classes > 0 else 0

        # Calculate streak
        current_streak = _calculate_streak(classes)

        # Get favorite movement
        favorite_movement = await _get_favorite_movement(user_id)

        # Classes this week
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
        logger.error(f"Error fetching summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/movement-history/{user_id}", response_model=List[TimeSeriesData])
async def get_movement_history(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get movement usage history with ALL movements from database
    Returns 0 counts for unused movements
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # Fetch ALL movements from database
        all_movements_response = supabase.table('movements') \
            .select('id, name') \
            .execute()

        all_movements = {m['name']: m['id'] for m in all_movements_response.data}

        # Initialize counts for ALL movements
        movement_counts = {name: [0] * len(date_ranges) for name in all_movements.keys()}

        # Fetch class history
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Aggregate counts
        for class_item in classes:
            class_date = datetime.fromisoformat(class_item.get('taught_date', '')).date()
            movements_snapshot = class_item.get('movements_snapshot', [])

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    for movement in movements_snapshot:
                        if movement.get('type') == 'movement':
                            movement_name = movement.get('name', '')
                            if movement_name in movement_counts:
                                movement_counts[movement_name][period_idx] += 1
                    break

        # Convert to response format
        result = []
        for movement_name, counts in movement_counts.items():
            result.append(TimeSeriesData(
                label=movement_name,
                periods=counts,
                period_labels=period_labels,
                total=sum(counts)
            ))

        # Sort by total usage (most used first)
        result.sort(key=lambda x: x.total, reverse=True)

        return result

    except Exception as e:
        logger.error(f"Error fetching movement history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/muscle-group-history/{user_id}", response_model=List[TimeSeriesData])
async def get_muscle_group_history(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get muscle group usage history with ALL 23 muscle groups
    Returns 0 counts for unused muscle groups
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # Fetch ALL muscle groups from database
        all_muscle_groups_response = supabase.table('muscle_groups') \
            .select('name') \
            .execute()

        all_muscle_groups = [mg['name'] for mg in all_muscle_groups_response.data]

        # Initialize counts for ALL muscle groups
        muscle_counts = {name: [0] * len(date_ranges) for name in all_muscle_groups}

        # Fetch class history
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Aggregate counts
        for class_item in classes:
            class_date = datetime.fromisoformat(class_item.get('taught_date', '')).date()
            movements_snapshot = class_item.get('movements_snapshot', [])

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    for movement in movements_snapshot:
                        if movement.get('type') == 'movement':
                            muscle_groups = movement.get('muscle_groups', [])
                            for muscle_group in muscle_groups:
                                if muscle_group in muscle_counts:
                                    muscle_counts[muscle_group][period_idx] += 1
                    break

        # Convert to response format
        result = []
        for muscle_group_name, counts in muscle_counts.items():
            result.append(TimeSeriesData(
                label=muscle_group_name,
                periods=counts,
                period_labels=period_labels,
                total=sum(counts)
            ))

        # Sort by total usage (most used first)
        result.sort(key=lambda x: x.total, reverse=True)

        return result

    except Exception as e:
        logger.error(f"Error fetching muscle group history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/practice-frequency/{user_id}", response_model=PracticeFrequencyData)
async def get_practice_frequency(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """Get practice frequency data for line chart"""
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # Initialize counts
        class_counts = [0] * len(date_ranges)

        # Fetch class history
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('taught_date') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Count classes per period
        for class_item in classes:
            class_date = datetime.fromisoformat(class_item.get('taught_date', '')).date()

            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    class_counts[period_idx] += 1
                    break

        return PracticeFrequencyData(
            period_labels=period_labels,
            class_counts=class_counts
        )

    except Exception as e:
        logger.error(f"Error fetching practice frequency: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/difficulty-progression/{user_id}", response_model=DifficultyProgressionData)
async def get_difficulty_progression(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """Get difficulty progression data for bar chart"""
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # Initialize counts for each difficulty
        beginner_counts = [0] * len(date_ranges)
        intermediate_counts = [0] * len(date_ranges)
        advanced_counts = [0] * len(date_ranges)

        # Fetch class history with difficulty info
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('taught_date, instructor_notes') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Count classes by difficulty per period
        for class_item in classes:
            class_date = datetime.fromisoformat(class_item.get('taught_date', '')).date()
            notes = class_item.get('instructor_notes', '')

            # Determine difficulty from instructor notes
            difficulty = 'Beginner'  # default
            if 'Intermediate' in notes:
                difficulty = 'Intermediate'
            elif 'Advanced' in notes:
                difficulty = 'Advanced'
            elif 'Beginner' in notes:
                difficulty = 'Beginner'

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    if difficulty == 'Beginner':
                        beginner_counts[period_idx] += 1
                    elif difficulty == 'Intermediate':
                        intermediate_counts[period_idx] += 1
                    elif difficulty == 'Advanced':
                        advanced_counts[period_idx] += 1
                    break

        return DifficultyProgressionData(
            period_labels=period_labels,
            beginner_counts=beginner_counts,
            intermediate_counts=intermediate_counts,
            advanced_counts=advanced_counts
        )

    except Exception as e:
        logger.error(f"Error fetching difficulty progression: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/muscle-distribution/{user_id}", response_model=MuscleDistributionData)
async def get_muscle_distribution(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.TOTAL)
):
    """Get muscle distribution data for doughnut chart"""
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges
        date_ranges, _ = _get_date_ranges(period)
        earliest_date = date_ranges[0][0]

        # Fetch class history
        classes_response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Count muscle group usage
        muscle_totals = defaultdict(int)

        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    muscle_groups = movement.get('muscle_groups', [])
                    for muscle_group in muscle_groups:
                        muscle_totals[muscle_group] += 1

        # Calculate percentages
        total_count = sum(muscle_totals.values())

        if total_count == 0:
            return MuscleDistributionData(muscle_groups=[], percentages=[])

        # Sort by usage and take top 10 for readability
        sorted_muscles = sorted(muscle_totals.items(), key=lambda x: x[1], reverse=True)[:10]

        muscle_groups = [m[0] for m in sorted_muscles]
        percentages = [(m[1] / total_count) * 100 for m in sorted_muscles]

        return MuscleDistributionData(
            muscle_groups=muscle_groups,
            percentages=percentages
        )

    except Exception as e:
        logger.error(f"Error fetching muscle distribution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions (same as before)
def _calculate_streak(classes: List[Dict[str, Any]]) -> int:
    """Calculate consecutive days with classes"""
    if not classes:
        return 0

    class_dates = sorted(
        set(datetime.fromisoformat(c.get('taught_date', '')).date() for c in classes),
        reverse=True
    )

    if not class_dates:
        return 0

    today = date.today()
    yesterday = today - timedelta(days=1)

    if class_dates[0] not in [today, yesterday]:
        return 0

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
        user_uuid = _convert_to_uuid(user_id)

        response = supabase.table('movement_usage') \
            .select('movement_id, usage_count') \
            .eq('user_id', user_uuid) \
            .order('usage_count', desc=True) \
            .limit(1) \
            .execute()

        if response.data and len(response.data) > 0:
            movement_id = response.data[0]['movement_id']

            movement_response = supabase.table('movements') \
                .select('name') \
                .eq('id', movement_id) \
                .execute()

            if movement_response.data:
                return movement_response.data[0]['name']

        return "The Hundred"

    except Exception as e:
        logger.warning(f"Error getting favorite movement: {e}")
        return "The Hundred"
