# New analytics endpoints for music genre and class duration
# To be added to analytics.py

from pydantic import BaseModel
from typing import List, Dict

class MusicGenreDistributionData(BaseModel):
    """Music genre distribution for ranked bar chart"""
    genres: List[str]  # Genres sorted by usage (most to least)
    counts: List[int]  # Total count for each genre (aligned with genres list)


class ClassDurationDistributionData(BaseModel):
    """Class duration distribution for stacked bar chart"""
    period_labels: List[str]
    durations: List[int]  # All standard durations (12, 30, 45, 60, 75, 90)
    duration_counts: Dict[str, List[int]]  # {duration: [counts per period]}


@router.get("/music-genre-distribution/{user_id}", response_model=MusicGenreDistributionData)
async def get_music_genre_distribution(
    user_id: str,
    period: TimePeriod = Query(default=TimePeriod.TOTAL)  # Default to total (no time filter needed)
):
    """
    Get music genre favorites ranked by total usage

    Returns genres sorted by usage count (most to least used) for a simple
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
        classes_response = supabase.table('class_history') \
            .select('music_genre') \
            .eq('user_id', user_uuid) \
            .execute()

        classes = classes_response.data or []

        # Count total usage per genre
        for class_item in classes:
            music_genre = class_item.get('music_genre')

            if music_genre and music_genre in genre_counts:
                genre_counts[music_genre] += 1

        # Sort genres by count (descending) and filter out unused genres
        sorted_genres = sorted(
            [(genre, count) for genre, count in genre_counts.items() if count > 0],
            key=lambda x: x[1],
            reverse=True
        )

        # If no genres used yet, return all genres with 0 counts
        if not sorted_genres:
            return MusicGenreDistributionData(
                genres=all_genres,
                counts=[0] * len(all_genres)
            )

        # Extract sorted genres and counts
        genres = [item[0] for item in sorted_genres]
        counts = [item[1] for item in sorted_genres]

        return MusicGenreDistributionData(
            genres=genres,
            counts=counts
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
