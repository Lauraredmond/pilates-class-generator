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
                    .eq('is_primary', True) \
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
            taught_date_str = class_item.get('taught_date')
            if not taught_date_str:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in difficulty_progression: {taught_date_str}")
                continue
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
                    .eq('is_primary', True) \
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
        logger.error(f"Error fetching muscle distribution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
            detail=f"Failed to fetch LLM logs: {str(e)}"
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
            detail=f"Failed to calculate LLM usage statistics: {str(e)}"
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
            detail=f"Failed to fetch LLM log: {str(e)}"
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
            .eq('is_primary', True) \
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
            detail=f"Failed to find user: {str(e)}"
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
            detail=f"Backfill failed: {str(e)}"
        )
