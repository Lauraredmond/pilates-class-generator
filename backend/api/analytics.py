"""
Analytics API Router V2
Enhanced with time period filtering and comprehensive data views
"""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum
import os
import uuid
from datetime import datetime, timedelta, date
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger
from collections import defaultdict

from models.error import ErrorMessages

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


class MovementFamilyDistributionData(BaseModel):
    """Movement family distribution for pie chart (Session: Movement Families)"""
    families: List[str]
    percentages: List[float]


# ==============================================================================
# PLAY SESSION TRACKING MODELS - December 24, 2025
# ==============================================================================

class PlaySessionStart(BaseModel):
    """Request to start a new play session"""
    user_id: str
    class_plan_id: Optional[str] = None
    playback_source: str = Field(..., description="'library', 'generated', 'shared', or 'preview'")
    device_info: Optional[dict] = None


class PlaySessionHeartbeat(BaseModel):
    """Request to update play session duration"""
    duration_seconds: int
    current_section_index: Optional[int] = None
    pause_count: Optional[int] = None
    skip_count: Optional[int] = None
    rewind_count: Optional[int] = None


class PlaySessionEnd(BaseModel):
    """Request to end a play session"""
    duration_seconds: int
    was_completed: bool = False
    max_section_reached: Optional[int] = None


class PlaySessionResponse(BaseModel):
    """Response after creating/updating play session"""
    session_id: str
    user_id: str
    class_plan_id: Optional[str] = None
    started_at: str
    duration_seconds: int
    is_qualified_play: bool
    was_completed: bool


class UserPlayStatistics(BaseModel):
    """Aggregated play statistics for a user"""
    user_id: str
    email: str
    total_sessions: int
    qualified_plays: int
    completed_classes: int
    unique_classes_played: int
    total_play_seconds: int
    avg_play_seconds: float
    longest_session_seconds: int
    first_play_date: Optional[str] = None
    last_play_date: Optional[str] = None
    avg_pauses_per_session: float
    completion_rate_percentage: float


class CreatorsVsPerformersReport(BaseModel):
    """Admin-only report comparing class creators vs performers"""
    total_users: int
    creators_only: int  # Created classes but never played >120s
    performers_only: int  # Played classes >120s but never created
    both: int  # Both create and perform
    creator_engagement_rate: float  # % of creators who also perform
    performer_creation_rate: float  # % of performers who also create
    time_series: List[dict]  # Historical data by period


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
        classes_this_week = 0
        if classes:
            for c in classes:
                taught_date_str = c.get('taught_date')
                if taught_date_str:
                    try:
                        class_date = datetime.fromisoformat(taught_date_str).date()
                        if class_date >= week_start:
                            classes_this_week += 1
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid taught_date format: {taught_date_str}")
                        continue

        return UserAnalyticsSummary(
            total_classes=total_classes,
            total_practice_time=total_practice_time,
            current_streak=current_streak,
            favorite_movement=favorite_movement,
            classes_this_week=classes_this_week,
            avg_class_duration=avg_class_duration
        )

    except Exception as e:
        logger.error(f"Error fetching user analytics summary for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


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
            taught_date_str = class_item.get('taught_date')
            if not taught_date_str:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in movement_history: {taught_date_str}")
                continue

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
        logger.error(f"Error fetching movement history for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/muscle-group-history/{user_id}", response_model=List[TimeSeriesData])
async def get_muscle_group_history(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get muscle group usage history with ALL 23 muscle groups
    Returns 0 counts for unused muscle groups

    OPTIMIZED: Batches all muscle group queries into 2 database calls
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

        # Collect all unique movement names
        unique_movement_names = set()
        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')
                    if movement_name:
                        unique_movement_names.add(movement_name)

        # BATCH QUERY: Get ALL muscle groups for ALL movements in ONE query
        muscle_groups_cache = {}
        if unique_movement_names:
            # Step 1: Get movement IDs for all movement names in one query
            movements_response = supabase.table('movements') \
                .select('id, name') \
                .in_('name', list(unique_movement_names)) \
                .execute()

            movement_name_to_id = {m['name']: m['id'] for m in movements_response.data}

            # Step 2: Get ALL muscle groups for ALL movement IDs in one query
            if movement_name_to_id:
                mm_response = supabase.table('movement_muscles') \
                    .select('movement_id, muscle_group_name') \
                    .in_('movement_id', list(movement_name_to_id.values())) \
                    .execute()

                # Build reverse lookup: movement_id → [muscle_group_names]
                movement_id_to_muscles = defaultdict(list)
                for item in mm_response.data:
                    movement_id = item['movement_id']
                    muscle_name = item.get('muscle_group_name')
                    if muscle_name:
                        movement_id_to_muscles[movement_id].append(muscle_name)

                # Build final cache: movement_name → [muscle_group_names]
                for name, mov_id in movement_name_to_id.items():
                    muscle_groups_cache[name] = movement_id_to_muscles.get(mov_id, [])

        # Aggregate counts using cached data
        for class_item in classes:
            taught_date_str = class_item.get('taught_date')
            if not taught_date_str:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in muscle_group_history: {taught_date_str}")
                continue

            movements_snapshot = class_item.get('movements_snapshot', [])

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    for movement in movements_snapshot:
                        if movement.get('type') == 'movement':
                            movement_name = movement.get('name')
                            if movement_name:
                                # Lookup from cache (no database query!)
                                muscle_groups = muscle_groups_cache.get(movement_name, [])
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
        logger.error(f"Error fetching muscle group history for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


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
            taught_date_str = class_item.get('taught_date')
            if not taught_date_str:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in practice_frequency: {taught_date_str}")
                continue

            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    class_counts[period_idx] += 1
                    break

        return PracticeFrequencyData(
            period_labels=period_labels,
            class_counts=class_counts
        )

    except Exception as e:
        logger.error(f"Error fetching practice frequency for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/difficulty-progression/{user_id}", response_model=DifficultyProgressionData)
async def get_difficulty_progression(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get difficulty progression data for bar chart

    Counts INDIVIDUAL MOVEMENTS by their difficulty rating (not classes by overall difficulty)
    Example: 10 classes with ~9 movements each = ~90 movements counted
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # Initialize counts for each difficulty
        beginner_counts = [0] * len(date_ranges)
        intermediate_counts = [0] * len(date_ranges)
        advanced_counts = [0] * len(date_ranges)

        # Fetch class history with movements_snapshot
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('taught_date, movements_snapshot') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Build cache of movement names to difficulty ratings
        # First, collect all unique movement names from all classes
        unique_movement_names = set()
        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')
                    if movement_name:
                        unique_movement_names.add(movement_name)

        # Fetch difficulty ratings for all movements in one query
        movement_difficulty_cache = {}
        if unique_movement_names:
            movements_response = supabase.table('movements') \
                .select('name, difficulty_level') \
                .in_('name', list(unique_movement_names)) \
                .execute()

            for movement in movements_response.data:
                movement_difficulty_cache[movement['name']] = movement.get('difficulty_level', 'Beginner')

        # Count MOVEMENTS (not classes) by difficulty per period
        for class_item in classes:
            taught_date_str = class_item.get('taught_date')
            if not taught_date_str:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in difficulty_progression: {taught_date_str}")
                continue

            movements_snapshot = class_item.get('movements_snapshot', [])

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    # Count each movement individually by its difficulty
                    for movement in movements_snapshot:
                        if movement.get('type') == 'movement':
                            movement_name = movement.get('name')
                            if movement_name:
                                # Lookup difficulty from cache
                                difficulty = movement_difficulty_cache.get(movement_name, 'Beginner')

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
        logger.error(f"Error fetching difficulty progression for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/muscle-distribution/{user_id}", response_model=MuscleDistributionData)
async def get_muscle_distribution(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.TOTAL)
):
    """
    Get muscle distribution data for doughnut chart

    OPTIMIZED: Batches all muscle group queries into 2 database calls
    (was 432 queries, now 2 queries for 24 classes)
    """
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

        # Collect all unique movement names
        unique_movement_names = set()
        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')
                    if movement_name:
                        unique_movement_names.add(movement_name)

        # BATCH QUERY: Get ALL muscle groups for ALL movements in ONE query
        muscle_groups_cache = {}
        if unique_movement_names:
            # Step 1: Get movement IDs for all movement names in one query
            movements_response = supabase.table('movements') \
                .select('id, name') \
                .in_('name', list(unique_movement_names)) \
                .execute()

            movement_name_to_id = {m['name']: m['id'] for m in movements_response.data}

            # Step 2: Get ALL muscle groups for ALL movement IDs in one query
            if movement_name_to_id:
                mm_response = supabase.table('movement_muscles') \
                    .select('movement_id, muscle_group_name') \
                    .in_('movement_id', list(movement_name_to_id.values())) \
                    .execute()

                # Build reverse lookup: movement_id → [muscle_group_names]
                movement_id_to_muscles = defaultdict(list)
                for item in mm_response.data:
                    movement_id = item['movement_id']
                    muscle_name = item.get('muscle_group_name')
                    if muscle_name:
                        movement_id_to_muscles[movement_id].append(muscle_name)

                # Build final cache: movement_name → [muscle_group_names]
                for name, mov_id in movement_name_to_id.items():
                    muscle_groups_cache[name] = movement_id_to_muscles.get(mov_id, [])

        # Count muscle group usage using cached data
        muscle_totals = defaultdict(int)

        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')
                    if movement_name:
                        # Lookup from cache (no database query!)
                        muscle_groups = muscle_groups_cache.get(movement_name, [])
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
        logger.error(f"Error fetching muscle distribution for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/movement-family-distribution/{user_id}", response_model=MovementFamilyDistributionData)
async def get_movement_family_distribution(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.TOTAL)
):
    """
    Get movement family distribution data for pie chart

    SESSION: Movement Families - December 2025
    Shows cumulative proportion of usage across 8 movement families
    (rolling, supine_abdominal, inversion, back_extension, hip_extensor,
     side_lying, seated_spinal_articulation, other)

    OPTIMIZED: Batches movement family queries into 2 database calls
    """
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

        # Collect all unique movement names
        unique_movement_names = set()
        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')
                    if movement_name:
                        unique_movement_names.add(movement_name)

        # BATCH QUERY: Get movement_family for ALL movements in ONE query
        movement_family_cache = {}
        if unique_movement_names:
            movements_response = supabase.table('movements') \
                .select('name, movement_family') \
                .in_('name', list(unique_movement_names)) \
                .execute()

            movement_family_cache = {
                m['name']: m.get('movement_family', 'other')
                for m in movements_response.data
            }

        # Count family usage using cached data
        family_totals = defaultdict(int)

        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')
                    if movement_name:
                        # Lookup from cache (no database query!)
                        family = movement_family_cache.get(movement_name, 'other')
                        family_totals[family] += 1

        # Calculate percentages
        total_count = sum(family_totals.values())

        if total_count == 0:
            return MovementFamilyDistributionData(families=[], percentages=[])

        # Sort by usage (most used first)
        sorted_families = sorted(family_totals.items(), key=lambda x: x[1], reverse=True)

        families = [f[0] for f in sorted_families]
        percentages = [(f[1] / total_count) * 100 for f in sorted_families]

        return MovementFamilyDistributionData(
            families=families,
            percentages=percentages
        )

    except Exception as e:
        logger.error(f"Error fetching movement family distribution for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


# Helper functions (same as before)
def _calculate_streak(classes: List[Dict[str, Any]]) -> int:
    """Calculate consecutive days with classes"""
    if not classes:
        return 0

    # Parse dates with error handling
    class_dates = []
    for c in classes:
        taught_date_str = c.get('taught_date')
        if taught_date_str:
            try:
                class_dates.append(datetime.fromisoformat(taught_date_str).date())
            except (ValueError, TypeError):
                continue

    # Remove duplicates and sort
    class_dates = sorted(set(class_dates), reverse=True)

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


# ==============================================================================
# ADMIN LLM OBSERVABILITY - Session 10: Jentic Integration
# ==============================================================================

async def verify_admin(user_id: str) -> bool:
    """
    Verify if user is an admin

    Returns True if user has is_admin=true in user_profiles table
    Raises HTTPException 403 if not admin
    """
    try:
        response = supabase.table("user_profiles").select("is_admin").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        is_admin = response.data[0].get("is_admin", False)

        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Admin access required. Only administrators can view LLM usage logs."
            )

        return True

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying admin status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to verify admin status"
        )


# Pydantic models for LLM logging
class LLMInvocationLogEntry(BaseModel):
    """Single LLM invocation log entry"""
    id: str
    created_at: str
    user_id: str
    method_used: str  # "ai_agent" or "direct_api"
    llm_called: bool
    llm_model: Optional[str] = None
    llm_prompt: Optional[str] = None
    llm_response: Optional[str] = None
    llm_iterations: Optional[int] = None
    request_data: dict
    processing_time_ms: float
    success: bool
    error_message: Optional[str] = None
    cost_estimate: str
    result_summary: Optional[dict] = None


class LLMLogsResponse(BaseModel):
    """Response for LLM logs endpoint"""
    logs: List[LLMInvocationLogEntry]
    total_count: int
    page: int
    page_size: int
    has_more: bool


class LLMUsageStats(BaseModel):
    """Aggregated LLM usage statistics"""
    total_invocations: int
    ai_agent_calls: int
    direct_api_calls: int
    llm_success_rate: float  # Percentage
    avg_processing_time_ms: float
    total_estimated_cost: str
    date_range: dict


@router.get("/llm-logs", response_model=LLMLogsResponse)
async def get_llm_invocation_logs(
    admin_user_id: str = Query(..., description="Admin user ID for authorization"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    method_filter: Optional[str] = Query(default=None, description="Filter by method: 'ai_agent' or 'direct_api'"),
    user_id_filter: Optional[str] = Query(default=None, description="Filter by specific user ID"),
    days_back: int = Query(default=30, ge=1, le=365, description="Number of days to look back")
):
    """
    Get LLM invocation logs (admin only)

    Returns paginated list of all LLM invocations with full details including:
    - Whether LLM was called or not
    - The prompt sent to LLM
    - The response from LLM
    - Processing time and cost estimates
    - Success/failure status

    **Admin Authorization Required**
    """
    # Verify admin access
    await verify_admin(admin_user_id)

    try:
        # Calculate date filter
        cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()

        # Build query
        query = supabase.table('llm_invocation_log').select('*', count='exact')

        # Apply filters
        query = query.gte('created_at', cutoff_date)

        if method_filter:
            query = query.eq('method_used', method_filter)

        if user_id_filter:
            query = query.eq('user_id', user_id_filter)

        # Order by most recent first
        query = query.order('created_at', desc=True)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        # Execute query
        response = query.execute()

        logs = response.data or []
        total_count = response.count if hasattr(response, 'count') and response.count else len(logs)

        has_more = total_count > (page * page_size)

        return LLMLogsResponse(
            logs=[LLMInvocationLogEntry(**log) for log in logs],
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching LLM logs: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/llm-usage-stats", response_model=LLMUsageStats)
async def get_llm_usage_statistics(
    admin_user_id: str = Query(..., description="Admin user ID for authorization"),
    days_back: int = Query(default=30, ge=1, le=365, description="Number of days to aggregate")
):
    """
    Get aggregated LLM usage statistics (admin only)

    Returns summary statistics about LLM usage:
    - Total invocations (AI agent vs direct API)
    - Success rates
    - Average processing times
    - Estimated costs

    **Admin Authorization Required**
    """
    # Verify admin access
    await verify_admin(admin_user_id)

    try:
        # Calculate date filter
        cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()

        # Fetch all logs in date range
        response = supabase.table('llm_invocation_log').select('*').gte('created_at', cutoff_date).execute()

        logs = response.data or []

        if not logs:
            return LLMUsageStats(
                total_invocations=0,
                ai_agent_calls=0,
                direct_api_calls=0,
                llm_success_rate=0.0,
                avg_processing_time_ms=0.0,
                total_estimated_cost="$0.00",
                date_range={
                    "start_date": cutoff_date,
                    "end_date": datetime.now().isoformat(),
                    "days": days_back
                }
            )

        # Calculate statistics
        total_invocations = len(logs)
        ai_agent_calls = len([log for log in logs if log['llm_called']])
        direct_api_calls = total_invocations - ai_agent_calls

        # Success rate (only for LLM calls)
        llm_logs = [log for log in logs if log['llm_called']]
        llm_success_count = len([log for log in llm_logs if log['success']])
        llm_success_rate = (llm_success_count / len(llm_logs) * 100) if llm_logs else 0.0

        # Average processing time
        processing_times = [log['processing_time_ms'] for log in logs if log['processing_time_ms']]
        avg_processing_time_ms = sum(processing_times) / len(processing_times) if processing_times else 0.0

        # Estimate total cost (rough calculation)
        # Assume $0.135 average per AI agent call (middle of $0.12-0.15 range)
        estimated_cost = ai_agent_calls * 0.135
        total_estimated_cost = f"${estimated_cost:.2f}"

        return LLMUsageStats(
            total_invocations=total_invocations,
            ai_agent_calls=ai_agent_calls,
            direct_api_calls=direct_api_calls,
            llm_success_rate=round(llm_success_rate, 2),
            avg_processing_time_ms=round(avg_processing_time_ms, 2),
            total_estimated_cost=total_estimated_cost,
            date_range={
                "start_date": cutoff_date,
                "end_date": datetime.now().isoformat(),
                "days": days_back
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating LLM usage stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/llm-logs/{log_id}", response_model=LLMInvocationLogEntry)
async def get_single_llm_log(
    log_id: str,
    admin_user_id: str = Query(..., description="Admin user ID for authorization")
):
    """
    Get detailed information about a single LLM invocation (admin only)

    Returns full details including the exact prompt and response.

    **Admin Authorization Required**
    """
    # Verify admin access
    await verify_admin(admin_user_id)

    try:
        response = supabase.table('llm_invocation_log').select('*').eq('id', log_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"LLM log with ID {log_id} not found"
            )

        log = response.data[0]

        return LLMInvocationLogEntry(**log)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching LLM log: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ==============================================================================
# ADMIN BACKFILL - Fix Blank Muscle Chart
# ==============================================================================

def get_movement_muscle_groups_by_name(movement_name: str) -> List[str]:
    """
    Fetch muscle groups for a movement by NAME (not ID)
    Used for backfilling class_history records

    Production schema: movement_muscles.muscle_group_name (text) stores name directly
    """
    try:
        # Step 1: Find movement ID by name
        movement_response = supabase.table('movements').select('id').eq('name', movement_name).execute()

        if not movement_response.data or len(movement_response.data) == 0:
            return []

        movement_id = movement_response.data[0]['id']

        # Step 2: Get muscle_group_name directly from movement_muscles (it's a text column, not FK)
        mm_response = supabase.table('movement_muscles') \
            .select('muscle_group_name') \
            .eq('movement_id', movement_id) \
            .execute()

        if not mm_response.data:
            return []

        # Extract muscle group names directly (no need for second query)
        muscle_groups = [item['muscle_group_name'] for item in mm_response.data if item.get('muscle_group_name')]
        return muscle_groups

    except Exception as e:
        logger.warning(f"Error fetching muscle groups for {movement_name}: {e}")
        return []


class BackfillResultsResponse(BaseModel):
    """Response from backfill operation"""
    success: bool
    records_processed: int
    records_updated: int
    movements_enriched: int
    message: str


@router.get("/admin/find-user-id")
async def find_user_id_by_email(
    email: str = Query(..., description="Email address to look up")
):
    """
    Find user ID by email address (no auth required for simplicity)

    Helper endpoint to find your user ID for admin operations
    """
    try:
        response = supabase.table('user_profiles').select('id, email, full_name, is_admin').eq('email', email).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"User with email {email} not found"
            )

        user = response.data[0]
        return {
            "user_id": user['id'],
            "email": user['email'],
            "full_name": user.get('full_name'),
            "is_admin": user.get('is_admin', False),
            "message": f"Use this user_id in the backfill endpoint: {user['id']}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding user: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.post("/admin/backfill-muscle-groups", response_model=BackfillResultsResponse)
async def backfill_muscle_groups_in_class_history(
    admin_user_id: str = Query(..., description="Admin user ID for authorization")
):
    """
    Backfill muscle_groups into class_history movements_snapshot (admin only)

    This endpoint fixes the blank muscle distribution chart by:
    1. Fetching all class_history records
    2. For each movement in movements_snapshot, fetching muscle_groups from database
    3. Updating the record with enriched data

    **Admin Authorization Required**

    **Usage:** Call this once to fix existing data. New classes already include muscle_groups.
    """
    try:
        # Verify admin access
        await verify_admin(admin_user_id)
    except HTTPException as e:
        logger.error(f"Admin verification failed: {e.detail}")
        raise

    try:
        logger.info(f"🔧 Starting backfill_muscle_groups for admin {admin_user_id}")

        # Fetch all class_history records
        response = supabase.table('class_history').select('*').execute()

        if not response.data:
            return BackfillResultsResponse(
                success=True,
                records_processed=0,
                records_updated=0,
                movements_enriched=0,
                message="No class_history records found to backfill"
            )

        total_records = len(response.data)
        updated_count = 0
        movement_count = 0

        logger.info(f"📊 Found {total_records} class_history records to process")

        for record in response.data:
            record_id = record['id']
            movements_snapshot = record.get('movements_snapshot', [])

            if not movements_snapshot:
                continue

            # Update each movement in the snapshot
            enriched_movements = []
            needs_update = False

            for movement in movements_snapshot:
                enriched_movement = movement.copy()

                # Only update movements (not transitions)
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name')

                    if movement_name:
                        # Check if already has muscle_groups
                        existing_muscle_groups = movement.get('muscle_groups')

                        if not existing_muscle_groups or len(existing_muscle_groups) == 0:
                            # Fetch muscle groups from database
                            muscle_groups = get_movement_muscle_groups_by_name(movement_name)

                            if muscle_groups:
                                enriched_movement['muscle_groups'] = muscle_groups
                                needs_update = True
                                movement_count += 1
                                logger.info(f"   ✅ {movement_name} → {muscle_groups}")

                enriched_movements.append(enriched_movement)

            # Update record if needed
            if needs_update:
                supabase.table('class_history').update({
                    'movements_snapshot': enriched_movements
                }).eq('id', record_id).execute()

                updated_count += 1
                logger.info(f"✅ Updated record {record_id}")

        logger.info(f"🎯 Backfill complete: {updated_count}/{total_records} records updated, {movement_count} movements enriched")

        return BackfillResultsResponse(
            success=True,
            records_processed=total_records,
            records_updated=updated_count,
            movements_enriched=movement_count,
            message=f"Successfully updated {updated_count} records with {movement_count} enriched movements. Refresh Analytics page to see muscle distribution chart!"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during backfill: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ==============================================================================
# CLASS SEQUENCING REPORT - Developer Tools
# ==============================================================================

class ClassSequencingReportResponse(BaseModel):
    """Response for class sequencing report"""
    report_content: str
    class_id: str
    class_date: str
    total_movements: int
    pass_status: bool


@router.get("/class-sequencing-report/{user_id}", response_model=ClassSequencingReportResponse)
async def get_class_sequencing_report(user_id: str):
    """
    Generate class sequencing validation report for most recent class

    Returns markdown-formatted report showing:
    - Movement sequence data
    - Consecutive muscle overlap analysis
    - Summary statistics
    - Detailed muscle group breakdown
    - Movement pattern proximity check
    - Historical muscle balance analysis

    **Used in Developer Tools section of Settings page**
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Fetch most recent class (sort by taught_date first, then created_at for same-day classes)
        response = supabase.table('class_history') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .order('taught_date', desc=True) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="No class history found for this user"
            )

        class_record = response.data[0]
        class_id = class_record['id']
        class_date = class_record.get('taught_date', 'Unknown')
        movements_snapshot = class_record.get('movements_snapshot', [])

        # Filter only movements (exclude transitions)
        movements = [m for m in movements_snapshot if m.get('type') == 'movement']

        if not movements:
            raise HTTPException(
                status_code=404,
                detail="No movements found in most recent class"
            )

        # Generate report
        report_lines = []
        report_lines.append("# Muscle Overlap Analysis Report")
        report_lines.append("")
        report_lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"**Class ID:** {class_id}")
        report_lines.append(f"**Class Date:** {class_date}")
        report_lines.append(f"**Total Movements:** {len(movements)}")
        report_lines.append("")

        # Movement Sequence Data (CSV)
        report_lines.append("## Movement Sequence Data (CSV)")
        report_lines.append("")
        report_lines.append("Position,Movement Name,Muscle Groups,Muscle Count")

        for idx, movement in enumerate(movements, start=1):
            name = movement.get('name', 'Unknown')
            muscle_groups = movement.get('muscle_groups', [])
            muscle_str = '; '.join(muscle_groups) if muscle_groups else 'None'
            muscle_count = len(muscle_groups)
            report_lines.append(f"{idx},{name},\"{muscle_str}\",{muscle_count}")

        report_lines.append("")

        # Consecutive Muscle Overlap Analysis
        report_lines.append("## Consecutive Muscle Overlap Analysis (CSV)")
        report_lines.append("")
        report_lines.append("Movement A,Movement B,Shared Muscles,Overlap Count,Overlap %,Pass (<50%)?")

        overlaps = []
        pass_count = 0
        fail_count = 0

        for i in range(len(movements) - 1):
            mov_a = movements[i]
            mov_b = movements[i + 1]

            name_a = mov_a.get('name', 'Unknown')
            name_b = mov_b.get('name', 'Unknown')

            muscles_a = set(mov_a.get('muscle_groups', []))
            muscles_b = set(mov_b.get('muscle_groups', []))

            shared = muscles_a.intersection(muscles_b)
            shared_str = '; '.join(sorted(shared)) if shared else 'None'

            overlap_count = len(shared)

            # Calculate overlap percentage (based on smaller muscle group set)
            if muscles_a and muscles_b:
                smaller_set_size = min(len(muscles_a), len(muscles_b))
                overlap_pct = (overlap_count / smaller_set_size * 100) if smaller_set_size > 0 else 0
            else:
                overlap_pct = 0

            overlaps.append(overlap_pct)

            pass_status = "PASS" if overlap_pct < 50 else "FAIL"
            if overlap_pct < 50:
                pass_count += 1
            else:
                fail_count += 1

            report_lines.append(f"{name_a},{name_b},\"{shared_str}\",{overlap_count},{overlap_pct:.1f}%,{pass_status}")

        report_lines.append("")

        # Summary Statistics
        report_lines.append("## Summary Statistics")
        report_lines.append("")
        total_pairs = len(overlaps)
        avg_overlap = sum(overlaps) / total_pairs if total_pairs > 0 else 0
        max_overlap = max(overlaps) if overlaps else 0

        report_lines.append(f"- Total Consecutive Pairs: {total_pairs}")
        report_lines.append(f"- Passed (<50% overlap): {pass_count} ({pass_count/total_pairs*100:.1f}%)" if total_pairs > 0 else "- Passed: 0")
        report_lines.append(f"- Failed (≥50% overlap): {fail_count} ({fail_count/total_pairs*100:.1f}%)" if total_pairs > 0 else "- Failed: 0")
        report_lines.append(f"- Average Overlap: {avg_overlap:.1f}%")
        report_lines.append(f"- Maximum Overlap: {max_overlap:.1f}%")
        report_lines.append("")

        if fail_count == 0:
            report_lines.append("### ✅ **ALL CHECKS PASSED:** No consecutive movements exceed 50% overlap")
        else:
            report_lines.append(f"### ❌ **{fail_count} FAILURE(S):** Some consecutive movements exceed 50% overlap")

        report_lines.append("")

        # Detailed Muscle Group Breakdown
        report_lines.append("## Detailed Muscle Group Breakdown")
        report_lines.append("")

        for idx, movement in enumerate(movements, start=1):
            name = movement.get('name', 'Unknown')
            muscle_groups = movement.get('muscle_groups', [])

            report_lines.append(f"### {idx}. {name}")
            report_lines.append(f"**Muscle Groups:** {', '.join(muscle_groups) if muscle_groups else 'None'}")

            if idx < len(movements):
                next_mov = movements[idx]
                next_muscles = set(next_mov.get('muscle_groups', []))
                current_muscles = set(muscle_groups)
                shared = current_muscles.intersection(next_muscles)

                if current_muscles and next_muscles:
                    smaller_size = min(len(current_muscles), len(next_muscles))
                    overlap_pct = (len(shared) / smaller_size * 100) if smaller_size > 0 else 0
                    report_lines.append(f"**Overlap with next:** {overlap_pct:.1f}% ({', '.join(sorted(shared)) if shared else 'None'})")

            report_lines.append("")

        # Movement Pattern Proximity Check
        report_lines.append("## Movement Pattern Proximity Check")
        report_lines.append("**Rule:** Similar movement patterns should not appear within 3 positions of each other.")
        report_lines.append("")

        # Fetch movement patterns from database
        movement_names = [m.get('name') for m in movements if m.get('name')]
        pattern_cache = {}

        if movement_names:
            patterns_response = supabase.table('movements') \
                .select('name, movement_pattern') \
                .in_('name', movement_names) \
                .execute()

            for mov in patterns_response.data:
                pattern_cache[mov['name']] = mov.get('movement_pattern', 'Unknown')

        # Check for pattern proximity violations
        proximity_violations = []
        for i in range(len(movements)):
            mov_name = movements[i].get('name')
            pattern = pattern_cache.get(mov_name, 'Unknown')

            # Check next 3 movements
            for j in range(i + 1, min(i + 4, len(movements))):
                next_mov_name = movements[j].get('name')
                next_pattern = pattern_cache.get(next_mov_name, 'Unknown')

                if pattern == next_pattern and pattern != 'Unknown':
                    distance = j - i
                    proximity_violations.append(f"- Position {i+1} ({mov_name}) and Position {j+1} ({next_mov_name}): Both {pattern} (distance: {distance})")

        if proximity_violations:
            report_lines.append(f"### ❌ **{len(proximity_violations)} VIOLATION(S):**")
            report_lines.extend(proximity_violations)
        else:
            report_lines.append("### ✅ **NO VIOLATIONS:** Movement patterns are well distributed")

        report_lines.append("")

        # Historical Muscle Balance Analysis
        report_lines.append("## Historical Muscle Balance Analysis")
        report_lines.append("**Goal:** Ensure all muscle groups are covered over time")
        report_lines.append("")

        # Count muscle groups in this class
        muscle_totals = defaultdict(int)
        for movement in movements:
            for muscle in movement.get('muscle_groups', []):
                muscle_totals[muscle] += 1

        if muscle_totals:
            report_lines.append("**This Class:**")
            sorted_muscles = sorted(muscle_totals.items(), key=lambda x: x[1], reverse=True)
            for muscle, count in sorted_muscles:
                report_lines.append(f"- {muscle}: {count} movement(s)")
        else:
            report_lines.append("**This Class:** No muscle group data available")

        report_lines.append("")

        # Movement Family Balance Analysis
        report_lines.append("## Movement Family Balance Analysis")
        report_lines.append("**Goal:** Class should roughly correlate with overall family distribution across 34 movements")
        report_lines.append("")

        # Fetch ALL movements from database to get overall family distribution
        all_movements_response = supabase.table('movements') \
            .select('name, movement_family') \
            .execute()

        all_movements = all_movements_response.data or []

        # Calculate overall distribution across 34 movements
        overall_family_counts = defaultdict(int)
        for mov in all_movements:
            family = mov.get('movement_family', 'other')
            overall_family_counts[family] += 1

        total_movements_db = len(all_movements)

        # Calculate class distribution
        class_family_counts = defaultdict(int)
        for movement in movements:
            # Need to lookup movement_family for this movement
            movement_name = movement.get('name')
            if movement_name:
                # Find in all_movements
                mov_data = next((m for m in all_movements if m['name'] == movement_name), None)
                if mov_data:
                    family = mov_data.get('movement_family', 'other')
                    class_family_counts[family] += 1

        total_movements_class = len(movements)

        # Compare proportions
        report_lines.append("### Overall Distribution (34 Movements)")
        sorted_overall = sorted(overall_family_counts.items(), key=lambda x: x[1], reverse=True)
        for family, count in sorted_overall:
            percentage = (count / total_movements_db * 100) if total_movements_db > 0 else 0
            report_lines.append(f"- {family}: {count} movements ({percentage:.1f}%)")

        report_lines.append("")
        report_lines.append("### This Class Distribution")
        sorted_class = sorted(class_family_counts.items(), key=lambda x: x[1], reverse=True)
        for family, count in sorted_class:
            percentage = (count / total_movements_class * 100) if total_movements_class > 0 else 0
            overall_pct = (overall_family_counts[family] / total_movements_db * 100) if total_movements_db > 0 else 0
            diff = percentage - overall_pct
            diff_str = f"(+{diff:.1f}%)" if diff > 0 else f"({diff:.1f}%)"
            report_lines.append(f"- {family}: {count} movements ({percentage:.1f}%) {diff_str} vs overall")

        report_lines.append("")

        # Check for over-representation (>50% higher than overall proportion)
        family_warnings = []
        for family, count in class_family_counts.items():
            class_pct = (count / total_movements_class * 100) if total_movements_class > 0 else 0
            overall_pct = (overall_family_counts[family] / total_movements_db * 100) if total_movements_db > 0 else 0

            # Check if class proportion is more than 50% higher than overall proportion
            if overall_pct > 0 and (class_pct / overall_pct) > 1.5:
                family_warnings.append(f"- **{family}**: {class_pct:.1f}% in class vs {overall_pct:.1f}% overall (overrepresented)")

        if family_warnings:
            report_lines.append("### ⚠️ **FAMILY BALANCE WARNINGS:**")
            report_lines.extend(family_warnings)
        else:
            report_lines.append("### ✅ **BALANCED:** Family distribution roughly correlates with overall proportions")

        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")
        report_lines.append("*Generated by Bassline Pilates Class Sequencing Analyzer*")

        # Combine into final report
        report_content = '\n'.join(report_lines)

        return ClassSequencingReportResponse(
            report_content=report_content,
            class_id=class_id,
            class_date=class_date,
            total_movements=len(movements),
            pass_status=(fail_count == 0)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating class sequencing report for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


# ==============================================================================
# ANALYTICS: Music Genre & Class Duration Distribution (Stacked Bar Charts)
# ==============================================================================

class MusicGenreDistributionData(BaseModel):
    """
    Music genre distribution for stacked bar chart

    OpenAPI Schema for music genre analytics over time periods
    """
    period_labels: List[str] = Field(
        ...,
        description="Time period labels (e.g., 'Mon', 'Week 1', 'Jan 2025')",
        example=["Week 1", "Week 2", "Week 3", "Week 4"]
    )
    genres: List[str] = Field(
        ...,
        description="All available music genres (Baroque, Classical, Romantic, Impressionist, Modern, Contemporary/Postmodern, Celtic Traditional, Jazz)",
        example=["Baroque", "Classical", "Romantic", "Impressionist", "Modern", "Contemporary/Postmodern", "Celtic Traditional", "Jazz"]
    )
    genre_counts: Dict[str, List[int]] = Field(
        ...,
        description="Count of classes per genre per period. Keys are genre names, values are arrays of counts matching period_labels",
        example={
            "Baroque": [2, 1, 0, 1],
            "Classical": [1, 2, 1, 0],
            "Jazz": [0, 0, 1, 2]
        }
    )


class ClassDurationDistributionData(BaseModel):
    """
    Class duration distribution for stacked bar chart

    OpenAPI Schema for class duration analytics over time periods
    """
    period_labels: List[str] = Field(
        ...,
        description="Time period labels (e.g., 'Mon', 'Week 1', 'Jan 2025')",
        example=["Week 1", "Week 2", "Week 3", "Week 4"]
    )
    durations: List[int] = Field(
        ...,
        description="All standard class durations in minutes (12, 30, 45, 60, 75, 90)",
        example=[12, 30, 45, 60, 75, 90]
    )
    duration_counts: Dict[str, List[int]] = Field(
        ...,
        description="Count of classes per duration per period. Keys are duration strings (e.g., '30'), values are arrays of counts matching period_labels",
        example={
            "12": [0, 1, 0, 0],
            "30": [2, 1, 3, 1],
            "60": [1, 2, 1, 2]
        }
    )


@router.get(
    "/music-genre-distribution/{user_id}",
    response_model=MusicGenreDistributionData,
    summary="Get music genre selection distribution over time",
    description="""
    Retrieve music genre selection analytics for stacked bar chart visualization.

    Returns time-series data showing how often each music genre (Baroque, Classical,
    Romantic, Impressionist, Modern, Contemporary/Postmodern, Celtic Traditional, Jazz)
    was selected by the user over the specified time period.

    **Use Cases:**
    - Understand user music preferences over time
    - Identify trends in music genre selection
    - Visualize music variety in class planning

    **Returns:**
    - Period labels for x-axis (e.g., "Week 1", "Week 2")
    - All 8 available music genres
    - Count of classes per genre per period for stacked bar visualization
    """,
    tags=["Analytics", "Music"],
    responses={
        200: {
            "description": "Music genre distribution retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "period_labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
                        "genres": ["Baroque", "Classical", "Romantic", "Impressionist", "Modern", "Contemporary/Postmodern", "Celtic Traditional", "Jazz"],
                        "genre_counts": {
                            "Baroque": [2, 1, 0, 1],
                            "Classical": [1, 2, 1, 0],
                            "Romantic": [0, 1, 2, 1],
                            "Jazz": [0, 0, 1, 2]
                        }
                    }
                }
            }
        },
        500: {"description": "Database error"}
    }
)
async def get_music_genre_distribution(
    user_id: str = Path(..., description="User UUID or identifier to fetch analytics for"),
    period: TimePeriod = Query(
        default=TimePeriod.WEEK,
        description="Time period granularity for aggregation. Options: day (last 7 days), week (last 4 weeks), month (last 12 months), total (all time)"
    )
):
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # All possible music genres (from CLAUDE.md)
        all_genres = [
            'Baroque',
            'Classical',
            'Romantic',
            'Impressionist',
            'Modern',
            'Contemporary/Postmodern',
            'Celtic Traditional',
            'Jazz'
        ]

        # Initialize counts for all genres and periods
        genre_counts = {genre: [0] * len(date_ranges) for genre in all_genres}

        # Fetch class history (with BOTH music genre fields)
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('taught_date, music_genre, cooldown_music_genre') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Count genres per period (count BOTH movement and cooldown music)
        for class_item in classes:
            taught_date_str = class_item.get('taught_date')
            movement_music = class_item.get('music_genre')
            cooldown_music = class_item.get('cooldown_music_genre')

            if not taught_date_str:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in music_genre_distribution: {taught_date_str}")
                continue

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    # Count movement music genre
                    if movement_music and movement_music in genre_counts:
                        genre_counts[movement_music][period_idx] += 1

                    # Count cooldown music genre (separate count - 2 selections per class)
                    if cooldown_music and cooldown_music in genre_counts:
                        genre_counts[cooldown_music][period_idx] += 1
                    break

        return MusicGenreDistributionData(
            period_labels=period_labels,
            genres=all_genres,
            genre_counts=genre_counts
        )

    except Exception as e:
        logger.error(f"Error fetching music genre distribution for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get(
    "/class-duration-distribution/{user_id}",
    response_model=ClassDurationDistributionData,
    summary="Get class duration selection distribution over time",
    description="""
    Retrieve class duration selection analytics for stacked bar chart visualization.

    Returns time-series data showing how often each standard class duration
    (12, 30, 45, 60, 75, 90 minutes) was selected by the user over the specified time period.

    **Use Cases:**
    - Understand user scheduling patterns over time
    - Identify trends in class duration preferences
    - Visualize duration variety in class planning

    **Returns:**
    - Period labels for x-axis (e.g., "Week 1", "Week 2")
    - All 6 standard duration options in minutes
    - Count of classes per duration per period for stacked bar visualization

    **Note:** Actual class durations are rounded to the nearest standard duration
    (e.g., 28 minutes → 30 minutes, 58 minutes → 60 minutes)
    """,
    tags=["Analytics", "Class Planning"],
    responses={
        200: {
            "description": "Class duration distribution retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "period_labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
                        "durations": [12, 30, 45, 60, 75, 90],
                        "duration_counts": {
                            "12": [0, 1, 0, 0],
                            "30": [2, 1, 3, 1],
                            "45": [1, 1, 0, 2],
                            "60": [1, 2, 1, 2],
                            "75": [0, 0, 1, 0],
                            "90": [0, 0, 0, 1]
                        }
                    }
                }
            }
        },
        500: {"description": "Database error"}
    }
)
async def get_class_duration_distribution(
    user_id: str = Path(..., description="User UUID or identifier to fetch analytics for"),
    period: TimePeriod = Query(
        default=TimePeriod.WEEK,
        description="Time period granularity for aggregation. Options: day (last 7 days), week (last 4 weeks), month (last 12 months), total (all time)"
    )
):
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # All standard durations (from user requirements)
        standard_durations = [12, 30, 45, 60, 75, 90]

        # Initialize counts for all durations and periods
        # Use string keys for JSON serialization
        duration_counts = {str(duration): [0] * len(date_ranges) for duration in standard_durations}

        # Fetch class history
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('taught_date, actual_duration_minutes') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Count durations per period
        for class_item in classes:
            taught_date_str = class_item.get('taught_date')
            duration = class_item.get('actual_duration_minutes')

            if not taught_date_str or not duration:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in class_duration_distribution: {taught_date_str}")
                continue

            # Round duration to nearest standard duration
            closest_duration = min(standard_durations, key=lambda x: abs(x - duration))

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    # Increment count for this duration in this period
                    duration_counts[str(closest_duration)][period_idx] += 1
                    break

        return ClassDurationDistributionData(
            period_labels=period_labels,
            durations=standard_durations,
            duration_counts=duration_counts
        )

    except Exception as e:
        logger.error(f"Error fetching class duration distribution for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


# ==============================================================================
# PLAY SESSION TRACKING - December 24, 2025
# ==============================================================================

@router.post("/play-session/start", response_model=PlaySessionResponse)
async def start_play_session(data: PlaySessionStart):
    """
    Start a new play session when user begins playing a class

    Returns session_id that should be used for heartbeat and end calls
    """
    try:
        user_uuid = _convert_to_uuid(data.user_id)

        # Create new session record
        session_data = {
            'user_id': user_uuid,
            'class_plan_id': data.class_plan_id,
            'playback_source': data.playback_source,
            'device_info': data.device_info or {},
            'duration_seconds': 0,
            'is_qualified_play': False,  # Will be set to True by trigger when duration > 120
            'was_completed': False
        }

        response = supabase.table('class_play_sessions').insert(session_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create play session")

        session = response.data[0]

        return PlaySessionResponse(
            session_id=session['id'],
            user_id=session['user_id'],
            class_plan_id=session.get('class_plan_id'),
            started_at=session['started_at'],
            duration_seconds=session['duration_seconds'],
            is_qualified_play=session['is_qualified_play'],
            was_completed=session['was_completed']
        )

    except Exception as e:
        logger.error(f"Error starting play session: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.put("/play-session/{session_id}/heartbeat", response_model=PlaySessionResponse)
async def update_play_session_heartbeat(session_id: str, data: PlaySessionHeartbeat):
    """
    Update play session with current duration and metrics

    Call this every 30 seconds during playback to track duration
    The database trigger will automatically set is_qualified_play=True when duration > 120
    """
    try:
        # Prepare update data
        update_data = {
            'duration_seconds': data.duration_seconds,
            'updated_at': datetime.now().isoformat()
        }

        if data.current_section_index is not None:
            update_data['current_section_index'] = data.current_section_index

        if data.pause_count is not None:
            update_data['pause_count'] = data.pause_count

        if data.skip_count is not None:
            update_data['skip_count'] = data.skip_count

        if data.rewind_count is not None:
            update_data['rewind_count'] = data.rewind_count

        # Update session
        response = supabase.table('class_play_sessions') \
            .update(update_data) \
            .eq('id', session_id) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Play session not found")

        session = response.data[0]

        return PlaySessionResponse(
            session_id=session['id'],
            user_id=session['user_id'],
            class_plan_id=session.get('class_plan_id'),
            started_at=session['started_at'],
            duration_seconds=session['duration_seconds'],
            is_qualified_play=session['is_qualified_play'],
            was_completed=session['was_completed']
        )

    except Exception as e:
        logger.error(f"Error updating play session heartbeat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.put("/play-session/{session_id}/end", response_model=PlaySessionResponse)
async def end_play_session(session_id: str, data: PlaySessionEnd):
    """
    End a play session when user stops/completes playback

    Sets final duration, completion status, and ended_at timestamp
    """
    try:
        update_data = {
            'duration_seconds': data.duration_seconds,
            'was_completed': data.was_completed,
            'ended_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        if data.max_section_reached is not None:
            update_data['max_section_reached'] = data.max_section_reached

        # Update session
        response = supabase.table('class_play_sessions') \
            .update(update_data) \
            .eq('id', session_id) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Play session not found")

        session = response.data[0]

        return PlaySessionResponse(
            session_id=session['id'],
            user_id=session['user_id'],
            class_plan_id=session.get('class_plan_id'),
            started_at=session['started_at'],
            duration_seconds=session['duration_seconds'],
            is_qualified_play=session['is_qualified_play'],
            was_completed=session['was_completed']
        )

    except Exception as e:
        logger.error(f"Error ending play session: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/user/{user_id}/play-statistics", response_model=UserPlayStatistics)
async def get_user_play_statistics(user_id: str):
    """
    Get aggregated play statistics for a user

    Uses the user_play_statistics database view for efficient querying
    Shows total sessions, qualified plays (>120s), completion rate, etc.
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Query the database view
        response = supabase.table('user_play_statistics') \
            .select('*') \
            .eq('user_id', user_uuid) \
            .execute()

        if not response.data or len(response.data) == 0:
            # Return zero stats if no play history
            return UserPlayStatistics(
                user_id=user_uuid,
                email="unknown",
                total_sessions=0,
                qualified_plays=0,
                completed_classes=0,
                unique_classes_played=0,
                total_play_seconds=0,
                avg_play_seconds=0.0,
                longest_session_seconds=0,
                first_play_date=None,
                last_play_date=None,
                avg_pauses_per_session=0.0,
                completion_rate_percentage=0.0
            )

        stats = response.data[0]

        return UserPlayStatistics(
            user_id=stats['user_id'],
            email=stats['email'],
            total_sessions=stats['total_sessions'],
            qualified_plays=stats['qualified_plays'],
            completed_classes=stats['completed_classes'],
            unique_classes_played=stats['unique_classes_played'],
            total_play_seconds=stats['total_play_seconds'],
            avg_play_seconds=float(stats['avg_play_seconds']),
            longest_session_seconds=stats['longest_session_seconds'],
            first_play_date=stats.get('first_play_date'),
            last_play_date=stats.get('last_play_date'),
            avg_pauses_per_session=float(stats['avg_pauses_per_session']),
            completion_rate_percentage=float(stats['completion_rate_percentage'])
        )

    except Exception as e:
        logger.error(f"Error fetching user play statistics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/admin/creators-vs-performers", response_model=CreatorsVsPerformersReport)
async def get_creators_vs_performers_report(
    admin_user_id: str = Query(..., description="Admin user ID for authorization"),
    period: TimePeriod = Query(default=TimePeriod.MONTH, description="Time period for historical data")
):
    """
    Get admin-only report comparing class creators vs class performers (admin only)

    Shows:
    - How many users only create classes but never play them
    - How many users only play classes but never create them
    - How many users both create and perform classes
    - Historical trends over time

    **Admin Authorization Required**
    """
    # Verify admin access
    await verify_admin(admin_user_id)

    try:
        # Get all users
        all_users_response = supabase.table('user_profiles') \
            .select('id, email') \
            .execute()

        all_users = all_users_response.data or []
        total_users = len(all_users)

        # Get users who have created classes
        creators_response = supabase.table('class_plans') \
            .select('user_id') \
            .execute()

        creator_user_ids = set(record['user_id'] for record in (creators_response.data or []))

        # Get users who have qualified plays (>120 seconds)
        performers_response = supabase.table('class_play_sessions') \
            .select('user_id') \
            .eq('is_qualified_play', True) \
            .execute()

        performer_user_ids = set(record['user_id'] for record in (performers_response.data or []))

        # Calculate categories
        creators_only = creator_user_ids - performer_user_ids
        performers_only = performer_user_ids - creator_user_ids
        both = creator_user_ids.intersection(performer_user_ids)

        # Calculate engagement rates
        creator_engagement_rate = (len(both) / len(creator_user_ids) * 100) if creator_user_ids else 0.0
        performer_creation_rate = (len(both) / len(performer_user_ids) * 100) if performer_user_ids else 0.0

        # Get historical time series data
        date_ranges, period_labels = _get_date_ranges(period)
        time_series = []

        for start_date, end_date in date_ranges:
            # Count creators in this period
            creators_in_period = supabase.table('class_plans') \
                .select('user_id', count='exact') \
                .gte('created_at', start_date.isoformat()) \
                .lte('created_at', end_date.isoformat()) \
                .execute()

            # Count performers in this period
            performers_in_period = supabase.table('class_play_sessions') \
                .select('user_id', count='exact') \
                .eq('is_qualified_play', True) \
                .gte('started_at', start_date.isoformat()) \
                .lte('started_at', end_date.isoformat()) \
                .execute()

            creator_count = creators_in_period.count if creators_in_period.count else 0
            performer_count = performers_in_period.count if performers_in_period.count else 0

            time_series.append({
                'period': f"{start_date.isoformat()} to {end_date.isoformat()}",
                'creators': creator_count,
                'performers': performer_count
            })

        return CreatorsVsPerformersReport(
            total_users=total_users,
            creators_only=len(creators_only),
            performers_only=len(performers_only),
            both=len(both),
            creator_engagement_rate=round(creator_engagement_rate, 2),
            performer_creation_rate=round(performer_creation_rate, 2),
            time_series=time_series
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating creators vs performers report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)
