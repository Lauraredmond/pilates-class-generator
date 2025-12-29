"""
Analytics API Router V2
Enhanced with time period filtering and comprehensive data views
"""

from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks, Depends
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum
import os
import uuid
from datetime import datetime, timedelta, date, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger
from collections import defaultdict

from models.error import ErrorMessages
from orchestrator.tools.muscle_overlap_analyzer import generate_overlap_report
from utils.auth import get_current_user_id

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
    top_3_movements: List[str]  # Top 3 most-selected movements
    coverage_percentage: int  # % coverage of top 3 across total selections


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


# ==============================================================================
# EARLY SKIP ANALYTICS MODELS - December 29, 2025
# ==============================================================================

class SectionStartRequest(BaseModel):
    """Request to start tracking a section playback event"""
    play_session_id: str
    section_type: str  # 'preparation', 'warmup', 'movement', 'cooldown', 'meditation', 'homecare'
    section_index: int  # 0-based position in playback sequence
    movement_id: Optional[str] = None  # Only for movement sections
    movement_name: Optional[str] = None  # Only for movement sections
    planned_duration_seconds: int  # From PlaybackItem.duration_seconds
    class_plan_id: Optional[str] = None  # Optional: class may be deleted or ad-hoc


class SectionEndRequest(BaseModel):
    """Request to end tracking a section playback event"""
    section_event_id: str
    ended_reason: str  # 'completed', 'skipped_next', 'skipped_previous', 'exited', 'jumped'


class SectionEventResponse(BaseModel):
    """Response after creating/updating section event"""
    section_event_id: str
    started_at: str
    is_early_skip: Optional[bool] = None  # Only set after section ends


class EarlySkipBySection(BaseModel):
    """Early skip statistics for a section type"""
    section_type: str
    total_plays: int
    early_skips: int
    early_skip_rate_pct: float
    avg_duration_seconds: float
    avg_planned_duration: float


class EarlySkipByMovement(BaseModel):
    """Early skip statistics for a specific movement"""
    movement_id: str
    movement_name: str
    total_plays: int
    early_skips: int
    early_skip_rate_pct: float
    avg_duration_seconds: float
    avg_planned_duration: float


class DataSourceMetadata(BaseModel):
    """Metadata about data source for transparency"""
    table_name: str
    sql_query: str
    description: str


class EarlySkipAnalytics(BaseModel):
    """Aggregated early skip analytics for admin dashboard (with SQL transparency)"""
    by_section_type: List[EarlySkipBySection]
    by_movement: List[EarlySkipByMovement]  # Top 10 most-skipped movements
    overall_stats: Dict[str, Any]  # Total plays, total early skips, overall rate

    # SQL transparency - show exactly how data was derived
    data_sources: List[DataSourceMetadata]


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

        # Get top 3 movements with coverage percentage
        top_movements_data = await _get_top_movements_with_coverage(user_id)

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
            avg_class_duration=avg_class_duration,
            top_3_movements=top_movements_data["top_3_movements"],
            coverage_percentage=top_movements_data["coverage_percentage"]
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


async def _get_top_movements_with_coverage(user_id: str) -> dict:
    """Get top 3 most-selected movements and their combined coverage percentage

    Uses same data source as Movement History table: class_history.movements_snapshot
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Fetch class history (same as Movement History table)
        classes_response = supabase.table('class_history') \
            .select('movements_snapshot') \
            .eq('user_id', user_uuid) \
            .execute()

        classes = classes_response.data or []

        if not classes:
            return {
                "top_3_movements": ["No data yet"],
                "coverage_percentage": 0
            }

        # Count movement occurrences from movements_snapshot
        movement_counts = {}
        total_movements = 0

        for class_item in classes:
            movements_snapshot = class_item.get('movements_snapshot', [])
            for movement in movements_snapshot:
                if movement.get('type') == 'movement':
                    movement_name = movement.get('name', '')
                    if movement_name:
                        movement_counts[movement_name] = movement_counts.get(movement_name, 0) + 1
                        total_movements += 1

        if total_movements == 0:
            return {
                "top_3_movements": ["No data yet"],
                "coverage_percentage": 0
            }

        # Sort by count and get top 3
        sorted_movements = sorted(movement_counts.items(), key=lambda x: x[1], reverse=True)
        top_3_movements = [name for name, count in sorted_movements[:3]]

        # Calculate coverage percentage
        top_3_count = sum(count for name, count in sorted_movements[:3])
        coverage_percentage = round((top_3_count / total_movements) * 100)

        return {
            "top_3_movements": top_3_movements,
            "coverage_percentage": coverage_percentage
        }

    except Exception as e:
        logger.warning(f"Error getting top movements with coverage: {e}", exc_info=True)
        return {
            "top_3_movements": ["No data yet"],
            "coverage_percentage": 0
        }


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


@router.get("/class-sequencing-report/all-users/latest", response_model=ClassSequencingReportResponse)
async def get_latest_class_sequencing_report_all_users(
    admin_user_id: str = Query(..., description="Admin user ID for authorization")
):
    """
    Generate class sequencing validation report for most recent class across ALL users (admin only)

    Returns markdown-formatted report showing:
    - Movement sequence data
    - Consecutive muscle overlap analysis
    - Summary statistics
    - Detailed muscle group breakdown
    - Movement pattern proximity check
    - Historical muscle balance analysis

    **Admin Authorization Required**
    **Used in Developer Tools section of Settings page**
    """
    # Verify admin access
    await verify_admin(admin_user_id)

    try:
        # Fetch most recent class ACROSS ALL USERS (no user_id filter)
        response = supabase.table('class_history') \
            .select('*') \
            .order('taught_date', desc=True) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="No class history found in database"
            )

        class_record = response.data[0]
        class_id = class_record['class_plan_id']
        class_date = class_record.get('taught_date', 'Unknown')
        movements_snapshot = class_record.get('movements_snapshot', [])
        user_id = class_record.get('user_id')  # Get user_id for historical lookup

        # Filter only movements (exclude transitions)
        movements = [m for m in movements_snapshot if m.get('type') == 'movement']

        if not movements:
            raise HTTPException(
                status_code=404,
                detail="No movements found in most recent class"
            )

        # Transform muscle_groups from list of strings to list of dicts
        for movement in movements:
            muscle_groups = movement.get('muscle_groups', [])
            if muscle_groups and isinstance(muscle_groups[0], str):
                movement['muscle_groups'] = [{"name": mg} for mg in muscle_groups]

        # Generate report using muscle_overlap_analyzer
        logger.info(f"Calling generate_overlap_report() for class_plan_id={class_id}, user_id={user_id} (all users mode)")

        report_result = generate_overlap_report(
            sequence=movements,
            user_id=str(user_id),
            supabase_client=supabase,
            class_plan_id=class_id,
            output_dir="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/analytics"
        )

        report_content = report_result.get("content", "")
        logger.info(f"Report generated successfully. File saved: {report_result.get('file_path', 'N/A')}")

        # Calculate fail_count for pass_status
        fail_count = 0
        for i in range(len(movements) - 1):
            muscles_a = set(mg.get('name', '') for mg in movements[i].get('muscle_groups', []))
            muscles_b = set(mg.get('name', '') for mg in movements[i + 1].get('muscle_groups', []))
            shared = muscles_a.intersection(muscles_b)

            if muscles_a and muscles_b:
                smaller_set_size = min(len(muscles_a), len(muscles_b))
                overlap_pct = (len(shared) / smaller_set_size * 100) if smaller_set_size > 0 else 0
                if overlap_pct >= 50:
                    fail_count += 1

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
        logger.error(f"Error generating class sequencing report for all users: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorMessages.DATABASE_ERROR
        )


@router.get("/class-sequencing-report/{user_id}", response_model=ClassSequencingReportResponse)
async def get_class_sequencing_report(user_id: str):
    """
    Generate class sequencing validation report for most recent class FOR SPECIFIC USER

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

        # Fetch most recent class FOR THIS USER ONLY
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
        class_id = class_record['class_plan_id']  # FIX: Use FK to class_plans, not class_history's own id
        class_date = class_record.get('taught_date', 'Unknown')
        movements_snapshot = class_record.get('movements_snapshot', [])

        # Filter only movements (exclude transitions)
        movements = [m for m in movements_snapshot if m.get('type') == 'movement']

        if not movements:
            raise HTTPException(
                status_code=404,
                detail="No movements found in most recent class"
            )

        # FIX: Transform muscle_groups from list of strings to list of dicts
        # class_history stores: {"muscle_groups": ["Core", "Legs"]}
        # generate_overlap_report expects: {"muscle_groups": [{"name": "Core"}, {"name": "Legs"}]}
        for movement in movements:
            muscle_groups = movement.get('muscle_groups', [])
            if muscle_groups and isinstance(muscle_groups[0], str):
                # Convert list of strings to list of dicts
                movement['muscle_groups'] = [{"name": mg} for mg in muscle_groups]

        # Generate report using muscle_overlap_analyzer (includes Historical Movement Coverage)
        logger.info(f"Calling generate_overlap_report() for class_plan_id={class_id}, user_id={str(user_uuid)}")

        report_result = generate_overlap_report(
            sequence=movements,
            user_id=str(user_uuid),
            supabase_client=supabase,
            class_plan_id=class_id,  # FIX: Use correct class_plan_id for reconciliation
            output_dir="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/analytics"  # FIX: Save report file
        )

        report_content = report_result.get("content", "")
        logger.info(f"Report generated successfully. File saved: {report_result.get('file_path', 'N/A')}")

        # Calculate fail_count for pass_status (check for ≥50% overlap failures)
        fail_count = 0
        for i in range(len(movements) - 1):
            # Extract muscle names from muscle_groups (now list of dicts)
            muscles_a = set(mg.get('name', '') for mg in movements[i].get('muscle_groups', []))
            muscles_b = set(mg.get('name', '') for mg in movements[i + 1].get('muscle_groups', []))
            shared = muscles_a.intersection(muscles_b)

            if muscles_a and muscles_b:
                smaller_set_size = min(len(muscles_a), len(muscles_b))
                overlap_pct = (len(shared) / smaller_set_size * 100) if smaller_set_size > 0 else 0
                if overlap_pct >= 50:
                    fail_count += 1

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
    Music genre favorites ranked by total usage

    OpenAPI Schema for horizontal bar chart showing user's favorite music genres
    sorted by usage (most to least used)
    """
    genres: List[str] = Field(
        ...,
        description="Music genres sorted by usage (most to least). Only includes genres with at least 1 class.",
        example=["Classical", "Baroque", "Jazz", "Romantic"]
    )
    counts: List[int] = Field(
        ...,
        description="Total number of classes for each genre (aligned with genres list)",
        example=[12, 8, 5, 3]
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
    summary="Get favorite music genres ranked by usage",
    description="""
    Retrieve user's favorite music genres ranked by total usage.

    Returns a simple ranked list showing which music genres (Baroque, Classical,
    Romantic, Impressionist, Modern, Contemporary/Postmodern, Celtic Traditional, Jazz)
    the user has selected most frequently across all their classes.

    **Use Cases:**
    - Understand user's overall music preferences
    - Show favorite genres at a glance
    - Visualize music variety in horizontal bar chart

    **Returns:**
    - Genres sorted by usage (most to least used)
    - Total count for each genre
    - Only includes genres with at least 1 class
    """,
    tags=["Analytics", "Music"],
    responses={
        200: {
            "description": "Music genre favorites retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "genres": ["Classical", "Baroque", "Jazz", "Romantic"],
                        "counts": [12, 8, 5, 3]
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
        default=TimePeriod.TOTAL,
        description="Time period (ignored - always returns total across all time)"
    )
):
    """
    Get music genre favorites ranked by total usage

    Returns genres sorted by usage (most to least used) for a simple
    horizontal bar chart showing user's favorite music genres.
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

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

        # Initialize counts for all genres
        genre_counts = {genre: 0 for genre in all_genres}

        # Fetch ALL class history (no date filter - total usage)
        # Select BOTH music_genre (movements) and cooldown_music_genre (cooldown)
        classes_response = supabase.table('class_history') \
            .select('music_genre, cooldown_music_genre') \
            .eq('user_id', user_uuid) \
            .execute()

        classes = classes_response.data or []

        # Count total usage per genre (count BOTH movement and cooldown music)
        for class_item in classes:
            movement_music = class_item.get('music_genre')
            cooldown_music = class_item.get('cooldown_music_genre')

            # Count movement music genre
            if movement_music and movement_music in genre_counts:
                genre_counts[movement_music] += 1

            # Count cooldown music genre (separate count - 2 selections per class)
            if cooldown_music and cooldown_music in genre_counts:
                genre_counts[cooldown_music] += 1

        # Sort ALL genres by count (descending) - include genres with 0 count
        sorted_genres = sorted(
            [(genre, count) for genre, count in genre_counts.items()],
            key=lambda x: x[1],
            reverse=True
        )

        # Extract sorted genres and counts (includes all 8 genres, even if 0)
        genres = [item[0] for item in sorted_genres]
        counts = [item[1] for item in sorted_genres]

        return MusicGenreDistributionData(
            genres=genres,
            counts=counts
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


# ==============================================================================
# QUALITY TRACKING ANALYTICS - Developer Tools (December 24, 2025)
# ==============================================================================

class QualityTrendData(BaseModel):
    """
    Quality tracking trend data for the three golden rules

    Shows pass/fail counts over time periods for each rule
    """
    period_labels: List[str] = Field(
        ...,
        description="Time period labels (e.g., 'Week 1', 'Week 2')",
        example=["Week 1", "Week 2", "Week 3", "Week 4"]
    )
    rule1_pass_counts: List[int] = Field(
        ...,
        description="Number of classes that passed Rule 1 (muscle repetition) per period"
    )
    rule1_fail_counts: List[int] = Field(
        ...,
        description="Number of classes that failed Rule 1 per period"
    )
    rule2_pass_counts: List[int] = Field(
        ...,
        description="Number of classes that passed Rule 2 (family balance) per period"
    )
    rule2_fail_counts: List[int] = Field(
        ...,
        description="Number of classes that failed Rule 2 per period"
    )
    rule3_pass_counts: List[int] = Field(
        ...,
        description="Number of classes that passed Rule 3 (repertoire coverage) per period"
    )
    rule3_fail_counts: List[int] = Field(
        ...,
        description="Number of classes that failed Rule 3 per period"
    )
    overall_pass_rate: float = Field(
        ...,
        description="Overall pass rate percentage across all periods"
    )
    total_classes: int = Field(
        ...,
        description="Total number of classes tracked"
    )


class QualityLogEntry(BaseModel):
    """Single quality log entry with full rule compliance details"""
    id: str
    class_plan_id: Optional[str] = None  # FIX: Add for reconciliation with sequencing report
    user_id: str
    user_email: Optional[str] = None  # User email for admin tracking
    generated_at: str
    difficulty_level: str
    movement_count: int

    # Rule 1: Muscle repetition
    rule1_muscle_repetition_pass: bool
    rule1_max_consecutive_overlap_pct: Optional[float] = None
    rule1_failed_pairs: Optional[Any] = None  # JSON field - Supabase returns as string

    # Rule 2: Family balance
    rule2_family_balance_pass: bool
    rule2_max_family_pct: Optional[float] = None
    rule2_overrepresented_families: Optional[Any] = None  # JSON field - Supabase returns as string

    # Rule 3: Repertoire coverage
    rule3_repertoire_coverage_pass: bool
    rule3_unique_movements_count: Optional[int] = None
    rule3_stalest_movement_days: Optional[int] = None

    # Overall
    overall_pass: bool
    quality_score: Optional[float] = None


@router.get("/quality-trends", response_model=QualityTrendData)
async def get_quality_trends(
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get quality tracking trends for the three golden rules across ALL users

    Admin-only feature: Shows aggregate pass/fail counts for all users
    to monitor overall class generation quality across the platform

    Returns pass/fail counts per period for visualization in Developer Tools dashboard

    **Three Golden Rules:**
    - Rule 1: Don't repeat muscle usage (consecutive movements < 50% overlap)
    - Rule 2: Don't overuse movement families (no family > 40%)
    - Rule 3: Historical repertoire coverage (full lookback on all movements)
    """
    try:
        # Get date ranges and labels
        date_ranges, period_labels = _get_date_ranges(period)

        # Initialize counts for all periods
        rule1_pass = [0] * len(date_ranges)
        rule1_fail = [0] * len(date_ranges)
        rule2_pass = [0] * len(date_ranges)
        rule2_fail = [0] * len(date_ranges)
        rule3_pass = [0] * len(date_ranges)
        rule3_fail = [0] * len(date_ranges)

        # Fetch quality logs for ALL users
        earliest_date = date_ranges[0][0]
        response = supabase.table('class_quality_log') \
            .select('*') \
            .gte('generated_at', earliest_date.isoformat()) \
            .execute()

        logs = response.data or []
        total_classes = len(logs)
        total_overall_pass = 0

        # Aggregate counts per period
        for log in logs:
            generated_at_str = log.get('generated_at')
            if not generated_at_str:
                continue

            try:
                generated_date = datetime.fromisoformat(generated_at_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid generated_at in quality_trends: {generated_at_str}")
                continue

            # Find which period this log belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= generated_date <= end_date:
                    # Rule 1 counts
                    if log.get('rule1_muscle_repetition_pass'):
                        rule1_pass[period_idx] += 1
                    else:
                        rule1_fail[period_idx] += 1

                    # Rule 2 counts
                    if log.get('rule2_family_balance_pass'):
                        rule2_pass[period_idx] += 1
                    else:
                        rule2_fail[period_idx] += 1

                    # Rule 3 counts
                    if log.get('rule3_repertoire_coverage_pass'):
                        rule3_pass[period_idx] += 1
                    else:
                        rule3_fail[period_idx] += 1

                    # Overall pass rate
                    if log.get('overall_pass'):
                        total_overall_pass += 1

                    break

        # Calculate overall pass rate
        overall_pass_rate = (total_overall_pass / total_classes * 100) if total_classes > 0 else 0.0

        return QualityTrendData(
            period_labels=period_labels,
            rule1_pass_counts=rule1_pass,
            rule1_fail_counts=rule1_fail,
            rule2_pass_counts=rule2_pass,
            rule2_fail_counts=rule2_fail,
            rule3_pass_counts=rule3_pass,
            rule3_fail_counts=rule3_fail,
            overall_pass_rate=round(overall_pass_rate, 2),
            total_classes=total_classes
        )

    except Exception as e:
        logger.error("Error fetching quality trends: {}", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/quality-logs", response_model=List[QualityLogEntry])
async def get_quality_logs(
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of logs to return")
):
    """
    Get detailed quality log entries for recent classes across ALL users

    Admin-only feature: Shows all users' class generation quality logs
    with user email for tracking which user generated each class

    Returns full rule compliance details including:
    - User email (for admin tracking by user)
    - Pass/fail status for each of the three golden rules
    - Specific failure information (failed pairs, overrepresented families, etc.)
    - Quality scores and metrics

    Used in Developer Tools dashboard to show detailed quality history
    """
    try:
        # Fetch recent quality logs for ALL users
        response = supabase.table('class_quality_log') \
            .select('*') \
            .order('generated_at', desc=True) \
            .limit(limit) \
            .execute()

        logs = response.data or []

        # Get unique user_ids from logs
        user_ids = list(set([log['user_id'] for log in logs if log.get('user_id')]))

        # Fetch user emails for all user_ids in one query
        user_emails = {}
        if user_ids:
            users_response = supabase.table('user_profiles') \
                .select('id, email') \
                .in_('id', user_ids) \
                .execute()

            # Create a mapping of user_id -> email
            for user in users_response.data or []:
                user_emails[user['id']] = user['email']

        # Transform to QualityLogEntry format with user_email
        result = []
        for log in logs:
            user_id = log.get('user_id')
            user_email = user_emails.get(user_id) if user_id else None

            # Create log entry with user_email
            log_entry = {**log, 'user_email': user_email}

            result.append(QualityLogEntry(**log_entry))

        return result

    except Exception as e:
        logger.error("Error fetching quality logs: {}", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


# ==============================================================================
# AUTO-GENERATION OF SEQUENCING REPORTS - Background Task
# ==============================================================================

async def generate_and_save_sequencing_report_background(
    class_plan_id: str,
    user_id: str,
    movements_snapshot: List[Dict[str, Any]]
):
    """
    Background task to generate and save sequencing report to database

    This runs AFTER class creation completes, so it doesn't slow down the app.
    Reports are stored in class_sequencing_reports table for later retrieval.

    **Performance Impact:** ZERO - runs asynchronously after API response
    """
    try:
        logger.info(f"🔄 Background task: Generating sequencing report for class {class_plan_id}")

        # Filter only movements (exclude transitions)
        movements = [m for m in movements_snapshot if m.get('type') == 'movement']

        if not movements or len(movements) == 0:
            logger.warning(f"⚠️ No movements in class {class_plan_id}, skipping report generation")
            return

        # Transform muscle_groups from list of strings to list of dicts (if needed)
        for movement in movements:
            muscle_groups = movement.get('muscle_groups', [])
            if muscle_groups and isinstance(muscle_groups[0], str):
                movement['muscle_groups'] = [{"name": mg} for mg in muscle_groups]

        # ENRICHMENT FIX: Get actual movement_family from movements table
        # If movements_snapshot has all "other", join to movements table to get real values
        movement_names = [m.get('name') for m in movements if m.get('name')]
        logger.info(f"🔍 DEBUG: Attempting to enrich {len(movement_names)} movement names: {movement_names[:5]}...")
        if movement_names:
            try:
                movements_response = supabase.table('movements') \
                    .select('name, movement_family') \
                    .in_('name', movement_names) \
                    .execute()

                logger.info(f"🔍 DEBUG: Query returned {len(movements_response.data) if movements_response.data else 0} rows")
                if movements_response.data:
                    logger.info(f"🔍 DEBUG: Sample result: {movements_response.data[0]}")

                # Build lookup map
                family_lookup = {
                    m['name']: m.get('movement_family', 'other')
                    for m in movements_response.data
                }

                logger.info(f"🔍 DEBUG: Built lookup map with {len(family_lookup)} entries")

                # Enrich movements with actual family values
                enriched_count = 0
                for movement in movements:
                    movement_name = movement.get('name')
                    if movement_name in family_lookup:
                        movement['movement_family'] = family_lookup[movement_name]
                        enriched_count += 1

                logger.info(f"✅ Enriched {enriched_count}/{len(movements)} movements with movement_family from database")
            except Exception as e:
                logger.error(f"❌ Failed to enrich movement_family: {e}", exc_info=True)

        # Generate report using muscle_overlap_analyzer
        report_result = generate_overlap_report(
            sequence=movements,
            user_id=str(user_id),
            supabase_client=supabase,
            class_plan_id=class_plan_id,
            output_dir="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/analytics"
        )

        report_content = report_result.get("content", "")

        # Calculate fail_count for pass_status
        # CRITICAL FIX: Use same formula as muscle_overlap_analyzer.py (divide by NEXT movement's muscles, not smaller set)
        # CRITICAL FIX 2: Check BOTH Rule 1 AND Rule 2 (family balance) - not just Rule 1

        # Rule 1: Consecutive Muscle Overlap
        rule1_fail_count = 0
        for i in range(len(movements) - 1):
            current_muscles = set(mg.get('name', '') for mg in movements[i].get('muscle_groups', []))
            next_muscles = set(mg.get('name', '') for mg in movements[i + 1].get('muscle_groups', []))
            shared = current_muscles.intersection(next_muscles)

            if current_muscles and next_muscles:
                # FORMULA MUST MATCH muscle_overlap_analyzer.py line 88:
                # overlap_pct = (overlap_count / len(next_muscles)) * 100
                overlap_pct = (len(shared) / len(next_muscles) * 100) if next_muscles else 0
                if overlap_pct >= 50:
                    rule1_fail_count += 1

        # Rule 2: Movement Family Balance
        # Calculate family distribution (must match muscle_overlap_analyzer.py lines 169-189)
        family_counts = {}
        for movement in movements:
            family = movement.get('movement_family', 'other')  # Use 'other' to match QA report
            if family not in family_counts:
                family_counts[family] = 0
            family_counts[family] += 1

        # Check if any family exceeds 40% threshold
        MAX_FAMILY_PERCENTAGE = 40.0
        rule2_pass = True
        rule2_fail_count = 0
        if movements:
            for family, count in family_counts.items():
                family_pct = (count / len(movements)) * 100
                if family_pct > MAX_FAMILY_PERCENTAGE:  # FIXED: Changed >= to > (matches sequence_tools.py line 1170)
                    rule2_pass = False
                    rule2_fail_count += 1  # Count how many families exceed threshold

        # Overall pass status: BOTH Rule 1 AND Rule 2 must pass
        pass_status = (rule1_fail_count == 0 and rule2_pass)

        # Total fail count for database (Rule 1 failures + Rule 2 violations)
        fail_count = rule1_fail_count + rule2_fail_count

        # Save report to database (NOT filesystem)
        report_data = {
            'class_plan_id': class_plan_id,
            'user_id': user_id,
            'report_content': report_content,
            'pass_status': pass_status,
            'total_movements': len(movements),
            'fail_count': fail_count
        }

        # Insert or update (upsert on class_plan_id unique constraint)
        supabase.table('class_sequencing_reports').upsert(report_data).execute()

        logger.info(f"✅ Background task: Saved sequencing report for class {class_plan_id} (pass={pass_status})")

    except Exception as e:
        logger.error(f"❌ Background task failed: Error generating sequencing report for class {class_plan_id}: {str(e)}", exc_info=True)
        # Don't raise - background tasks should fail gracefully


@router.post("/trigger-report-generation/{class_plan_id}")
async def trigger_sequencing_report_generation(
    class_plan_id: str,
    background_tasks: BackgroundTasks
):
    """
    Trigger async report generation for a specific class

    This endpoint is called AFTER class creation. It schedules a background task
    to generate the sequencing report without blocking the API response.

    **Performance Impact:**
    - API responds immediately (< 10ms)
    - Report generation happens in background (doesn't block user)
    - No slowdown to class creation flow

    **Usage:** Call this from class creation endpoint after saving class to database
    """
    try:
        # Fetch class from class_history
        response = supabase.table('class_history') \
            .select('*') \
            .eq('class_plan_id', class_plan_id) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Class with class_plan_id {class_plan_id} not found"
            )

        class_record = response.data[0]
        user_id = class_record.get('user_id')
        movements_snapshot = class_record.get('movements_snapshot', [])

        # Schedule background task (doesn't block)
        background_tasks.add_task(
            generate_and_save_sequencing_report_background,
            class_plan_id=class_plan_id,
            user_id=user_id,
            movements_snapshot=movements_snapshot
        )

        return {
            "message": "Report generation scheduled in background",
            "class_plan_id": class_plan_id,
            "status": "pending"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering report generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/sequencing-report/{class_plan_id}")
async def get_saved_sequencing_report(class_plan_id: str):
    """
    Retrieve or generate a sequencing report for a class

    **Behavior:**
    1. If report exists in database → return it immediately
    2. If report doesn't exist → generate on-demand, save to database, return it

    **Use Case:** Manual download for classes created before auto-generation feature

    **Performance:**
    - Cached reports: Instant retrieval (~10ms)
    - On-demand generation: ~200ms (no LLM, pure computation)
    """
    try:
        # Step 1: Try to retrieve existing report
        response = supabase.table('class_sequencing_reports') \
            .select('*') \
            .eq('class_plan_id', class_plan_id) \
            .execute()

        # If report exists, return it
        if response.data and len(response.data) > 0:
            report = response.data[0]
            logger.info(f"✅ Retrieved existing sequencing report for class {class_plan_id}")
            return {
                "class_plan_id": report['class_plan_id'],
                "report_content": report['report_content'],
                "pass_status": report['pass_status'],
                "total_movements": report['total_movements'],
                "fail_count": report['fail_count'],
                "generated_at": report['generated_at']
            }

        # Step 2: Report doesn't exist - generate on-demand
        logger.info(f"🔄 No existing report found for class {class_plan_id} - generating on-demand")

        # Try to fetch class from class_history first (has movements_snapshot field)
        class_response = supabase.table('class_history') \
            .select('*') \
            .eq('class_plan_id', class_plan_id) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()

        user_id = None
        movements_snapshot = []

        if class_response.data and len(class_response.data) > 0:
            # Found in class_history - use movements_snapshot
            class_record = class_response.data[0]
            user_id = class_record.get('user_id')
            movements_snapshot = class_record.get('movements_snapshot', [])
            logger.info(f"✅ Found class in class_history table")
        else:
            # Not in class_history - try class_plans table as fallback
            logger.info(f"⚠️ Class not found in class_history, trying class_plans...")
            plans_response = supabase.table('class_plans') \
                .select('*') \
                .eq('id', class_plan_id) \
                .limit(1) \
                .execute()

            if not plans_response.data or len(plans_response.data) == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"Class {class_plan_id} not found in class_history or class_plans. Cannot generate report."
                )

            # Found in class_plans - use main_sequence field instead
            plan_record = plans_response.data[0]
            user_id = plan_record.get('user_id')
            # class_plans has 'main_sequence' instead of 'movements_snapshot'
            main_sequence = plan_record.get('main_sequence', [])

            # Transform main_sequence to movements_snapshot format
            # main_sequence contains full movement objects with all details
            # We need to extract just what movements_snapshot would have
            movements_snapshot = []
            for idx, item in enumerate(main_sequence):
                if item.get('type') == 'movement':
                    # Extract movement data in movements_snapshot format
                    # CRITICAL: Include movement_family for Rule 2 (Family Balance) calculations
                    movements_snapshot.append({
                        "type": "movement",
                        "name": item.get('name', ''),
                        "muscle_groups": item.get('muscle_groups', []),
                        "duration_seconds": item.get('duration_seconds', 60),
                        "movement_family": item.get('movement_family', 'other'),  # FIX: Include for Rule 2
                        "order_index": idx
                    })

            logger.info(f"✅ Found class in class_plans table, extracted {len(movements_snapshot)} movements from main_sequence")

        # Generate report synchronously (runs in this request)
        # This is the SAME logic as generate_and_save_sequencing_report_background
        # but runs synchronously instead of in background task

        # Filter only movements (exclude transitions)
        movements = [m for m in movements_snapshot if m.get('type') == 'movement']

        if not movements or len(movements) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Class {class_plan_id} has no movements in snapshot. Cannot generate report."
            )

        # Transform muscle_groups from list of strings to list of dicts (if needed)
        for movement in movements:
            muscle_groups = movement.get('muscle_groups', [])
            if muscle_groups and isinstance(muscle_groups[0], str):
                movement['muscle_groups'] = [{"name": mg} for mg in muscle_groups]

        # ENRICHMENT FIX: Get actual movement_family from movements table
        # If movements_snapshot has all "other", join to movements table to get real values
        movement_names = [m.get('name') for m in movements if m.get('name')]
        logger.info(f"🔍 DEBUG: Attempting to enrich {len(movement_names)} movement names: {movement_names[:5]}...")
        if movement_names:
            try:
                movements_response = supabase.table('movements') \
                    .select('name, movement_family') \
                    .in_('name', movement_names) \
                    .execute()

                logger.info(f"🔍 DEBUG: Query returned {len(movements_response.data) if movements_response.data else 0} rows")
                if movements_response.data:
                    logger.info(f"🔍 DEBUG: Sample result: {movements_response.data[0]}")

                # Build lookup map
                family_lookup = {
                    m['name']: m.get('movement_family', 'other')
                    for m in movements_response.data
                }

                logger.info(f"🔍 DEBUG: Built lookup map with {len(family_lookup)} entries")

                # Enrich movements with actual family values
                enriched_count = 0
                for movement in movements:
                    movement_name = movement.get('name')
                    if movement_name in family_lookup:
                        movement['movement_family'] = family_lookup[movement_name]
                        enriched_count += 1

                logger.info(f"✅ Enriched {enriched_count}/{len(movements)} movements with movement_family from database")
            except Exception as e:
                logger.error(f"❌ Failed to enrich movement_family: {e}", exc_info=True)

        # Generate report using muscle_overlap_analyzer
        report_result = generate_overlap_report(
            sequence=movements,
            user_id=str(user_id),
            supabase_client=supabase,
            class_plan_id=class_plan_id,
            output_dir="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/analytics"
        )

        report_content = report_result.get("content", "")

        # Calculate fail_count for pass_status using corrected formula
        # CRITICAL FIX: Check BOTH Rule 1 AND Rule 2 (family balance) - not just Rule 1

        # Rule 1: Consecutive Muscle Overlap
        rule1_fail_count = 0
        for i in range(len(movements) - 1):
            current_muscles = set(mg.get('name', '') for mg in movements[i].get('muscle_groups', []))
            next_muscles = set(mg.get('name', '') for mg in movements[i + 1].get('muscle_groups', []))
            shared = current_muscles.intersection(next_muscles)

            if current_muscles and next_muscles:
                # FORMULA MUST MATCH muscle_overlap_analyzer.py
                overlap_pct = (len(shared) / len(next_muscles) * 100) if next_muscles else 0
                if overlap_pct >= 50:
                    rule1_fail_count += 1

        # Rule 2: Movement Family Balance
        # Calculate family distribution (must match muscle_overlap_analyzer.py lines 169-189)
        family_counts = {}
        for movement in movements:
            family = movement.get('movement_family', 'other')  # Use 'other' to match QA report
            if family not in family_counts:
                family_counts[family] = 0
            family_counts[family] += 1

        # Check if any family exceeds 40% threshold
        MAX_FAMILY_PERCENTAGE = 40.0
        rule2_pass = True
        rule2_fail_count = 0
        if movements:
            for family, count in family_counts.items():
                family_pct = (count / len(movements)) * 100
                if family_pct > MAX_FAMILY_PERCENTAGE:  # FIXED: Changed >= to > (matches sequence_tools.py line 1170)
                    rule2_pass = False
                    rule2_fail_count += 1  # Count how many families exceed threshold

        # Overall pass status: BOTH Rule 1 AND Rule 2 must pass
        pass_status = (rule1_fail_count == 0 and rule2_pass)

        # Total fail count for database (Rule 1 failures + Rule 2 violations)
        fail_count = rule1_fail_count + rule2_fail_count

        # Save report to database
        report_data = {
            'class_plan_id': class_plan_id,
            'user_id': user_id,
            'report_content': report_content,
            'pass_status': pass_status,
            'total_movements': len(movements),
            'fail_count': fail_count
        }

        # Insert or update (upsert on class_plan_id unique constraint)
        supabase.table('class_sequencing_reports').upsert(report_data).execute()

        logger.info(f"✅ Generated and saved on-demand sequencing report for class {class_plan_id} (pass={pass_status})")

        # Return newly generated report
        return {
            "class_plan_id": class_plan_id,
            "report_content": report_content,
            "pass_status": pass_status,
            "total_movements": len(movements),
            "fail_count": fail_count,
            "generated_at": report_data.get('generated_at', datetime.now().isoformat())
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving/generating sequencing report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


# ==============================================================================
# EARLY SKIP ANALYTICS ENDPOINTS - December 29, 2025
# ==============================================================================

@router.post("/playback/section-start", response_model=SectionEventResponse)
async def start_section_event(
    data: SectionStartRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Start tracking a section playback event

    Called when a new section begins playback (ONE event per section start).
    Excludes transitions per requirements (they auto-advance every 20s).

    Performance: Low frequency (~12 calls per 30min class)
    """
    try:
        user_uuid = _convert_to_uuid(user_id)

        # Prepare event data
        event_data = {
            'user_id': user_uuid,
            'play_session_id': data.play_session_id,
            'class_plan_id': data.class_plan_id,
            'section_type': data.section_type,
            'section_index': data.section_index,
            'movement_id': data.movement_id,
            'movement_name': data.movement_name,
            'planned_duration_seconds': data.planned_duration_seconds,
            'started_at': datetime.now(timezone.utc).isoformat()
        }

        # Insert event record
        response = supabase.table('playback_section_events').insert(event_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create section event")

        event = response.data[0]

        logger.debug(f"Section started: {data.section_type} (index {data.section_index}, session {data.play_session_id})")

        return SectionEventResponse(
            section_event_id=event['id'],
            started_at=event['started_at']
        )

    except Exception as e:
        logger.error(f"Error starting section event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.put("/playback/section-end", response_model=SectionEventResponse)
async def end_section_event(data: SectionEndRequest):
    """
    End tracking a section playback event

    Called when section ends (auto-advance, skip, or exit).
    Computes duration and is_early_skip server-side.

    IDEMPOTENT: Safe to call multiple times (won't overwrite existing ended_at)

    Early Skip Logic:
    - Threshold: 60s for most sections, 20s for transitions
    - Early skip = duration < threshold AND ended_reason != 'completed'
    - Natural completion (timer ran out) is NOT an early skip
    """
    try:
        ended_at = datetime.now(timezone.utc)

        # Fetch existing record
        existing_response = supabase.table('playback_section_events') \
            .select('*') \
            .eq('id', data.section_event_id) \
            .execute()

        if not existing_response.data:
            raise HTTPException(status_code=404, detail="Section event not found")

        event = existing_response.data[0]

        # IDEMPOTENCY: Skip if already ended
        if event.get('ended_at'):
            logger.debug(f"Section already ended: {data.section_event_id} (idempotent call)")
            return SectionEventResponse(
                section_event_id=event['id'],
                started_at=event['started_at'],
                is_early_skip=event.get('is_early_skip')
            )

        # Compute duration
        started_at_dt = datetime.fromisoformat(event['started_at'].replace('Z', '+00:00'))
        duration_seconds = int((ended_at - started_at_dt).total_seconds())

        # Determine early skip threshold (60s for most, 20s for transitions)
        threshold = 20 if event['section_type'] == 'transition' else 60

        # Early skip ONLY if user specifically skipped the section (not exited entire class)
        # 'exited' means user closed entire class playback, not skipping this specific section
        is_early_skip = (
            duration_seconds < threshold and
            data.ended_reason in ['skipped_next', 'skipped_previous']
        )

        # Update record
        update_data = {
            'ended_at': ended_at.isoformat(),
            'duration_seconds': duration_seconds,
            'ended_reason': data.ended_reason,
            'is_early_skip': is_early_skip,
            'updated_at': ended_at.isoformat()
        }

        response = supabase.table('playback_section_events') \
            .update(update_data) \
            .eq('id', data.section_event_id) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Failed to update section event")

        updated_event = response.data[0]

        logger.debug(f"Section ended: {event['section_type']} (duration: {duration_seconds}s, early_skip: {is_early_skip}, reason: {data.ended_reason})")

        return SectionEventResponse(
            section_event_id=updated_event['id'],
            started_at=updated_event['started_at'],
            is_early_skip=updated_event['is_early_skip']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending section event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/early-skips", response_model=EarlySkipAnalytics)
async def get_early_skip_analytics(
    admin_user_id: str = Query(..., description="Admin user ID for authorization"),
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    class_id: Optional[str] = Query(None, description="Filter by specific class plan ID")
):
    """
    Get early skip analytics (ADMIN ONLY)

    Returns aggregated statistics:
    - Skip rates by section type (prep, warmup, movement, cooldown, meditation, homecare)
    - Top 10 most-skipped movements (min 10 plays for statistical significance)
    - Overall platform stats (total plays, total early skips, overall rate)

    **Admin Authorization Required**
    """
    # Verify admin access
    await verify_admin(admin_user_id)

    try:
        # Build WHERE clause for filters
        where_clauses = ["ended_at IS NOT NULL"]

        if from_date:
            where_clauses.append(f"started_at >= '{from_date}'::date")
        if to_date:
            where_clauses.append(f"started_at <= '{to_date}'::date")
        if class_id:
            where_clauses.append(f"class_plan_id = '{class_id}'")

        where_clause = " AND ".join(where_clauses)

        # Query 1: Skip rates by section type (using database view)
        section_response = supabase.table('playback_section_events') \
            .select('section_type, is_early_skip, duration_seconds, planned_duration_seconds') \
            .execute()

        # Aggregate in Python (simpler than raw SQL for now)
        section_stats_dict = {}
        for event in (section_response.data or []):
            section_type = event['section_type']
            if section_type not in section_stats_dict:
                section_stats_dict[section_type] = {
                    'total': 0,
                    'early_skips': 0,
                    'duration_sum': 0,
                    'planned_sum': 0
                }

            section_stats_dict[section_type]['total'] += 1
            if event.get('is_early_skip'):
                section_stats_dict[section_type]['early_skips'] += 1
            section_stats_dict[section_type]['duration_sum'] += event.get('duration_seconds', 0)
            section_stats_dict[section_type]['planned_sum'] += event.get('planned_duration_seconds', 0)

        by_section_type = [
            EarlySkipBySection(
                section_type=section_type,
                total_plays=stats['total'],
                early_skips=stats['early_skips'],
                early_skip_rate_pct=round((stats['early_skips'] / stats['total'] * 100) if stats['total'] > 0 else 0, 1),
                avg_duration_seconds=round(stats['duration_sum'] / stats['total'], 1) if stats['total'] > 0 else 0,
                avg_planned_duration=round(stats['planned_sum'] / stats['total'], 1) if stats['total'] > 0 else 0
            )
            for section_type, stats in section_stats_dict.items()
        ]

        # Query 2: Top 10 most-skipped movements
        movement_response = supabase.table('playback_section_events') \
            .select('movement_id, movement_name, is_early_skip, duration_seconds, planned_duration_seconds') \
            .eq('section_type', 'movement') \
            .not_.is_('movement_id', 'null') \
            .execute()

        # Aggregate by movement
        movement_stats_dict = {}
        for event in (movement_response.data or []):
            movement_id = event['movement_id']
            if movement_id not in movement_stats_dict:
                movement_stats_dict[movement_id] = {
                    'movement_name': event['movement_name'],
                    'total': 0,
                    'early_skips': 0,
                    'duration_sum': 0,
                    'planned_sum': 0
                }

            movement_stats_dict[movement_id]['total'] += 1
            if event.get('is_early_skip'):
                movement_stats_dict[movement_id]['early_skips'] += 1
            movement_stats_dict[movement_id]['duration_sum'] += event.get('duration_seconds', 0)
            movement_stats_dict[movement_id]['planned_sum'] += event.get('planned_duration_seconds', 0)

        # Filter min 10 plays and sort by skip rate
        movements_list = []
        for movement_id, stats in movement_stats_dict.items():
            if stats['total'] >= 10:
                movements_list.append(
                    EarlySkipByMovement(
                        movement_id=movement_id,
                        movement_name=stats['movement_name'],
                        total_plays=stats['total'],
                        early_skips=stats['early_skips'],
                        early_skip_rate_pct=round((stats['early_skips'] / stats['total'] * 100), 1),
                        avg_duration_seconds=round(stats['duration_sum'] / stats['total'], 1),
                        avg_planned_duration=round(stats['planned_sum'] / stats['total'], 1)
                    )
                )

        by_movement = sorted(movements_list, key=lambda x: x.early_skip_rate_pct, reverse=True)[:10]

        # Query 3: Overall stats
        all_events = section_response.data or []
        total_plays = len(all_events)
        total_early_skips = sum(1 for e in all_events if e.get('is_early_skip'))
        overall_skip_rate_pct = round((total_early_skips / total_plays * 100) if total_plays > 0 else 0, 1)

        overall_stats = {
            "total_plays": total_plays,
            "total_early_skips": total_early_skips,
            "overall_skip_rate_pct": overall_skip_rate_pct
        }

        # Build SQL query strings for transparency (what the user can run in Supabase)
        data_sources = [
            DataSourceMetadata(
                table_name="playback_section_events",
                sql_query=f"""
-- Skip rates by section type
SELECT
  section_type,
  COUNT(*) as total_plays,
  SUM(CASE WHEN is_early_skip THEN 1 ELSE 0 END) as early_skips,
  ROUND(100.0 * SUM(CASE WHEN is_early_skip THEN 1 ELSE 0 END) / COUNT(*), 1) as early_skip_rate_pct,
  ROUND(AVG(duration_seconds), 1) as avg_duration_seconds,
  ROUND(AVG(planned_duration_seconds), 1) as avg_planned_duration
FROM playback_section_events
WHERE {where_clause}
GROUP BY section_type
ORDER BY early_skip_rate_pct DESC;
                """.strip(),
                description="Skip rates aggregated by section type (preparation, warmup, movement, cooldown, meditation, homecare)"
            ),
            DataSourceMetadata(
                table_name="playback_section_events",
                sql_query=f"""
-- Top 10 most-skipped movements (minimum 10 plays for statistical significance)
SELECT
  movement_id,
  movement_name,
  COUNT(*) as total_plays,
  SUM(CASE WHEN is_early_skip THEN 1 ELSE 0 END) as early_skips,
  ROUND(100.0 * SUM(CASE WHEN is_early_skip THEN 1 ELSE 0 END) / COUNT(*), 1) as early_skip_rate_pct,
  ROUND(AVG(duration_seconds), 1) as avg_duration_seconds,
  ROUND(AVG(planned_duration_seconds), 1) as avg_planned_duration
FROM playback_section_events
WHERE {where_clause}
  AND section_type = 'movement'
  AND movement_id IS NOT NULL
GROUP BY movement_id, movement_name
HAVING COUNT(*) >= 10
ORDER BY early_skip_rate_pct DESC
LIMIT 10;
                """.strip(),
                description="Movements with highest skip rates (requires minimum 10 plays to avoid skewed data from low sample sizes)"
            ),
            DataSourceMetadata(
                table_name="playback_section_events",
                sql_query=f"""
-- Overall platform statistics
SELECT
  COUNT(*) as total_plays,
  SUM(CASE WHEN is_early_skip THEN 1 ELSE 0 END) as total_early_skips,
  ROUND(100.0 * SUM(CASE WHEN is_early_skip THEN 1 ELSE 0 END) / COUNT(*), 1) as overall_skip_rate_pct
FROM playback_section_events
WHERE {where_clause};
                """.strip(),
                description="Platform-wide early skip statistics across all sections and classes"
            ),
            DataSourceMetadata(
                table_name="playback_section_events",
                sql_query=f"""
-- ended_reason breakdown (diagnostic query)
SELECT
  ended_reason,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM playback_section_events
WHERE {where_clause}
GROUP BY ended_reason
ORDER BY count DESC;
                """.strip(),
                description="Breakdown of why sections ended (completed, skipped_next, skipped_previous, exited) for diagnostic purposes"
            )
        ]

        return EarlySkipAnalytics(
            by_section_type=by_section_type,
            by_movement=by_movement,
            overall_stats=overall_stats,
            data_sources=data_sources
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching early skip analytics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)
