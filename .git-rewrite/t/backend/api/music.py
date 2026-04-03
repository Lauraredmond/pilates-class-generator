"""
Music API Endpoints
Session 9: Music Integration

Provides endpoints for:
- Listing available stylistic periods
- Browsing playlists by period/intensity/use case
- Getting playlist details and tracks
- Getting individual track streaming URLs

Security:
- All endpoints validate streaming URLs before returning
- No API keys exposed to clients
- RLS policies enforce read-only access for clients
- Authenticated users only for starting class sessions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field

from services.music_source import (
    StylisticPeriod,
    MusicIntensity,
    MusicUseCase,
    MusicSourceException
)
from services.music_source_supabase import create_all_sources_source
from utils.supabase_client import get_supabase_client
from utils.logger import get_logger
from models.error import ErrorMessages

logger = get_logger(__name__)

router = APIRouter(prefix="/api/music", tags=["music"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class StylisticPeriodInfo(BaseModel):
    """Information about a musical stylistic period."""
    value: str
    name: str
    description: str
    era: str
    composers: List[str]
    traits: List[str]

class TrackResponse(BaseModel):
    """Music track response model."""
    id: str
    source: str
    title: str
    composer: Optional[str] = None
    artist_performer: Optional[str] = None
    duration_seconds: int
    audio_url: str
    stylistic_period: str
    bpm: Optional[int] = None
    mood_tags: List[str] = []
    license_type: Optional[str] = None

class PlaylistResponse(BaseModel):
    """Music playlist response model."""
    id: str
    name: str
    description: str
    intended_intensity: str
    intended_use: str
    stylistic_period: str
    duration_minutes_target: int
    track_count: int
    is_featured: bool = False

class PlaylistWithTracksResponse(BaseModel):
    """Playlist with full track list."""
    playlist: PlaylistResponse
    tracks: List[TrackResponse]
    total_duration_seconds: int


# =============================================================================
# STYLISTIC PERIOD DATA
# =============================================================================

STYLISTIC_PERIODS_INFO = {
    "BAROQUE": StylisticPeriodInfo(
        value="BAROQUE",
        name="Baroque Period",
        description="Ornamentation, contrast, dramatic expression",
        era="c. 1600–1750",
        composers=["Johann Sebastian Bach", "George Frideric Handel", "Antonio Vivaldi"],
        traits=["Harpsichord", "Counterpoint", "Terraced dynamics"]
    ),
    "CLASSICAL": StylisticPeriodInfo(
        value="CLASSICAL",
        name="Classical Period",
        description="Clean structure, symmetry, clarity",
        era="c. 1750–1820",
        composers=["Wolfgang Amadeus Mozart", "Joseph Haydn", "Early Ludwig van Beethoven"],
        traits=["Birth of the modern symphony", "String quartet", "Sonata form"]
    ),
    "ROMANTIC": StylisticPeriodInfo(
        value="ROMANTIC",
        name="Romantic Period",
        description="Emotional intensity, bigger orchestras, richer harmony",
        era="c. 1820–1910",
        composers=["Frédéric Chopin", "Pyotr Ilyich Tchaikovsky", "Late Beethoven", "Johannes Brahms"],
        traits=["Virtuoso performers", "Nationalism", "Program music"]
    ),
    "IMPRESSIONIST": StylisticPeriodInfo(
        value="IMPRESSIONIST",
        name="Impressionist Period",
        description="Colour, atmosphere, blurred edges",
        era="c. 1890–1920",
        composers=["Claude Debussy", "Maurice Ravel"],
        traits=["New scales (whole-tone, modal)", "Delicate textures", "Emphasis on timbre"]
    ),
    "MODERN": StylisticPeriodInfo(
        value="MODERN",
        name="Modern Period / 20th Century",
        description="Everything from atonality to minimalism to jazz influence",
        era="c. 1900–1975",
        composers=["Igor Stravinsky", "Arnold Schoenberg", "Béla Bartók", "Aaron Copland"],
        traits=["Break from tradition", "Experimentation", "Diverse styles"]
    ),
    "CONTEMPORARY": StylisticPeriodInfo(
        value="CONTEMPORARY",
        name="Contemporary / Postmodern",
        description="Minimalist, ambient, neo-classical works suitable for Pilates",
        era="1975–present",
        composers=["Philip Glass", "Arvo Pärt", "Max Richter", "Ludovico Einaudi"],
        traits=["Piano minimalism", "Gentle ambient textures", "Neo-classical fusion"]
    ),
    "JAZZ": StylisticPeriodInfo(
        value="JAZZ",
        name="Jazz",
        description="Smooth, relaxing jazz for a warm, sophisticated atmosphere",
        era="20th century–present",
        composers=["Miles Davis", "John Coltrane", "Bill Evans", "Various Modern Jazz Artists"],
        traits=["Smooth melodies", "Coffee shop ambiance", "Gentle improvisation", "Warm tones"]
    ),
    "CELTIC_TRADITIONAL": StylisticPeriodInfo(
        value="CELTIC_TRADITIONAL",
        name="Celtic Traditional",
        description="Traditional Celtic music for calm, flowing sessions",
        era="Traditional",
        composers=["Traditional Celtic artists"],
        traits=["Harp", "Flute", "Gentle melodies", "Natural flow"]
    )
}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/stylistic-periods", response_model=List[StylisticPeriodInfo])
async def get_stylistic_periods():
    """
    Get all available musical stylistic periods.

    Returns information about each period including:
    - Name and description
    - Historical era
    - Notable composers
    - Musical characteristics

    This endpoint is public (no authentication required) as it returns
    static reference information only.
    """
    return list(STYLISTIC_PERIODS_INFO.values())


@router.get("/playlists", response_model=List[PlaylistResponse])
async def get_playlists(
    stylistic_period: Optional[str] = Query(None, description="Filter by stylistic period"),
    intensity: Optional[str] = Query(None, description="Filter by intensity (LOW, MEDIUM, HIGH)"),
    use_case: Optional[str] = Query(None, description="Filter by use case (e.g., PILATES_SLOW_FLOW)"),
    supabase = Depends(get_supabase_client)
):
    """
    Get curated playlists filtered by period, intensity, or use case.

    Query Parameters:
    - stylistic_period: Filter by musical period (e.g., BAROQUE, ROMANTIC)
    - intensity: Filter by workout intensity (LOW, MEDIUM, HIGH)
    - use_case: Filter by intended use (PILATES_SLOW_FLOW, PILATES_CORE, etc.)

    Returns:
    - List of matching playlists with metadata

    Security:
    - Read-only access (RLS policies enforce this)
    - No authentication required for browsing
    - No internal IDs or sensitive data exposed
    """
    try:
        # Create music source
        music_source = create_all_sources_source(supabase)

        # Convert string parameters to enums if provided
        period_enum = StylisticPeriod(stylistic_period) if stylistic_period else None
        intensity_enum = MusicIntensity(intensity) if intensity else None
        use_case_enum = MusicUseCase(use_case) if use_case else None

        # Fetch playlists
        playlists = await music_source.get_playlists(
            stylistic_period=period_enum,
            intensity=intensity_enum,
            use_case=use_case_enum
        )

        # Convert to response models
        return [
            PlaylistResponse(
                id=str(p.id),
                name=p.name,
                description=p.description,
                intended_intensity=p.intended_intensity.value,
                intended_use=p.intended_use.value,
                stylistic_period=p.stylistic_period.value,
                duration_minutes_target=p.duration_minutes_target,
                track_count=p.track_count,
                is_featured=p.is_featured
            )
            for p in playlists
        ]

    except ValueError as e:
        logger.error(f"Invalid parameter value in get_playlists: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=ErrorMessages.VALIDATION_ERROR)
    except MusicSourceException as e:
        logger.error(f"Failed to fetch playlists: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/playlists/{playlist_id}", response_model=PlaylistWithTracksResponse)
async def get_playlist_details(
    playlist_id: str,
    supabase = Depends(get_supabase_client)
):
    """
    Get full details of a playlist including all tracks in order.

    Path Parameters:
    - playlist_id: UUID of the playlist

    Returns:
    - Playlist metadata
    - Complete ordered list of tracks
    - Total duration in seconds

    Security:
    - All streaming URLs are validated before returning
    - RLS policies ensure only active playlists are accessible
    """
    try:
        # Create music source
        music_source = create_all_sources_source(supabase)

        # Get playlist info
        playlists = await music_source.get_playlists()
        playlist = next((p for p in playlists if str(p.id) == playlist_id), None)

        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")

        # Get tracks
        tracks = await music_source.get_playlist_tracks(playlist_id)

        # Calculate total duration
        total_duration = sum(t.duration_seconds for t in tracks)

        # Convert to response model
        return PlaylistWithTracksResponse(
            playlist=PlaylistResponse(
                id=str(playlist.id),
                name=playlist.name,
                description=playlist.description,
                intended_intensity=playlist.intended_intensity.value,
                intended_use=playlist.intended_use.value,
                stylistic_period=playlist.stylistic_period.value,
                duration_minutes_target=playlist.duration_minutes_target,
                track_count=playlist.track_count,
                is_featured=playlist.is_featured
            ),
            tracks=[
                TrackResponse(
                    id=str(t.id),
                    source=t.source,
                    title=t.title,
                    composer=t.composer,
                    artist_performer=t.artist_performer,
                    duration_seconds=t.duration_seconds,
                    audio_url=t.audio_url,
                    stylistic_period=t.stylistic_period.value,
                    bpm=t.bpm,
                    mood_tags=t.mood_tags,
                    license_type=t.license_info.get('type') if t.license_info else None
                )
                for t in tracks
            ],
            total_duration_seconds=total_duration
        )

    except MusicSourceException as e:
        logger.error(f"Failed to fetch playlist {playlist_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/tracks", response_model=List[TrackResponse])
async def get_tracks(
    stylistic_period: Optional[str] = Query(None, description="Filter by stylistic period"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of tracks to return"),
    supabase = Depends(get_supabase_client)
):
    """
    Browse individual music tracks.

    Query Parameters:
    - stylistic_period: Filter by musical period
    - limit: Maximum tracks to return (1-100, default 50)

    Returns:
    - List of tracks matching criteria

    Security:
    - All streaming URLs validated
    - Only active tracks returned
    """
    try:
        # Create music source
        music_source = create_all_sources_source(supabase)

        # Convert string parameter to enum if provided
        period_enum = StylisticPeriod(stylistic_period) if stylistic_period else None

        # Fetch tracks
        tracks = await music_source.get_tracks(
            stylistic_period=period_enum,
            limit=limit
        )

        # Convert to response models
        return [
            TrackResponse(
                id=str(t.id),
                source=t.source,
                title=t.title,
                composer=t.composer,
                artist_performer=t.artist_performer,
                duration_seconds=t.duration_seconds,
                audio_url=t.audio_url,
                stylistic_period=t.stylistic_period.value,
                bpm=t.bpm,
                mood_tags=t.mood_tags,
                license_type=t.license_info.get('type') if t.license_info else None
            )
            for t in tracks
        ]

    except ValueError as e:
        logger.error(f"Invalid parameter value in get_tracks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=ErrorMessages.VALIDATION_ERROR)
    except MusicSourceException as e:
        logger.error(f"Failed to fetch tracks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/tracks/{track_id}/stream-url")
async def get_track_streaming_url(
    track_id: str,
    supabase = Depends(get_supabase_client)
):
    """
    Get the validated streaming URL for a specific track.

    Path Parameters:
    - track_id: UUID of the track

    Returns:
    - Validated streaming URL

    Security:
    - URL is validated against whitelist before returning
    - HTTPS only (or whitelisted HTTP domains)
    - No arbitrary URL fetching
    """
    try:
        # Create music source
        music_source = create_all_sources_source(supabase)

        # Get and validate streaming URL
        streaming_url = await music_source.get_streaming_url(track_id)

        return {
            "track_id": track_id,
            "streaming_url": streaming_url
        }

    except MusicSourceException as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Track not found")
        logger.error(f"Failed to get streaming URL for track {track_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/health")
async def music_health_check(supabase = Depends(get_supabase_client)):
    """
    Health check for music system.

    Returns:
    - Status of music database tables
    - Number of available tracks and playlists

    This endpoint can be used for monitoring.
    """
    try:
        # Create music source
        music_source = create_all_sources_source(supabase)

        # Check health
        is_healthy = await music_source.health_check()

        # Get counts
        all_tracks = await music_source.get_tracks(limit=1000)
        all_playlists = await music_source.get_playlists()

        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "tracks_available": len(all_tracks),
            "playlists_available": len(all_playlists),
            "sources": ["MUSOPEN", "FREEPD"]  # Will be dynamic in future
        }

    except Exception as e:
        logger.error(f"Music health check failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail=ErrorMessages.INTERNAL_ERROR)
