# New analytics endpoints for music genre and class duration
# To be added to analytics.py

from pydantic import BaseModel
from typing import List, Dict

class MusicGenreDistributionData(BaseModel):
    """Music genre distribution for stacked bar chart"""
    period_labels: List[str]
    genres: List[str]  # All unique genres (Baroque, Classical, Romantic, Jazz, etc.)
    genre_counts: Dict[str, List[int]]  # {genre: [counts per period]}


class ClassDurationDistributionData(BaseModel):
    """Class duration distribution for stacked bar chart"""
    period_labels: List[str]
    durations: List[int]  # All standard durations (12, 30, 45, 60, 75, 90)
    duration_counts: Dict[str, List[int]]  # {duration: [counts per period]}


@router.get("/music-genre-distribution/{user_id}", response_model=MusicGenreDistributionData)
async def get_music_genre_distribution(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get music genre selection distribution for stacked bar chart

    Shows how often each music genre (Baroque, Classical, Romantic, Impressionist,
    Modern, Contemporary/Postmodern, Celtic Traditional, Jazz) was selected over time.
    """
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

        # Fetch class history
        earliest_date = date_ranges[0][0]
        classes_response = supabase.table('class_history') \
            .select('taught_date, music_genre') \
            .eq('user_id', user_uuid) \
            .gte('taught_date', earliest_date.isoformat()) \
            .execute()

        classes = classes_response.data or []

        # Count genres per period
        for class_item in classes:
            taught_date_str = class_item.get('taught_date')
            music_genre = class_item.get('music_genre')

            if not taught_date_str or not music_genre:
                continue

            try:
                class_date = datetime.fromisoformat(taught_date_str).date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid taught_date in music_genre_distribution: {taught_date_str}")
                continue

            # Find which period this class belongs to
            for period_idx, (start_date, end_date) in enumerate(date_ranges):
                if start_date <= class_date <= end_date:
                    # Increment count for this genre in this period
                    if music_genre in genre_counts:
                        genre_counts[music_genre][period_idx] += 1
                    break

        return MusicGenreDistributionData(
            period_labels=period_labels,
            genres=all_genres,
            genre_counts=genre_counts
        )

    except Exception as e:
        logger.error(f"Error fetching music genre distribution for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/class-duration-distribution/{user_id}", response_model=ClassDurationDistributionData)
async def get_class_duration_distribution(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.WEEK)
):
    """
    Get class duration selection distribution for stacked bar chart

    Shows how often each standard class duration (12, 30, 45, 60, 75, 90 minutes)
    was selected over time.
    """
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
