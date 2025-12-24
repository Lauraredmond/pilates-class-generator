"""
Supabase-Based Music Source Implementation
Session 9: Music Integration

This implementation reads music tracks and playlists from the Supabase database.
The database is populated with real tracks from Musopen/FreePD via separate
ingestion scripts.

This avoids directly calling external APIs on every request and provides:
- Better performance (database is faster than external API calls)
- Caching of curated content
- Offline capability
- Cost control (no API rate limit issues)
"""

from typing import List, Optional
from supabase import Client

from .music_source import (
    MusicSource,
    MusicTrack,
    MusicPlaylist,
    StylisticPeriod,
    MusicIntensity,
    MusicUseCase,
    MusicSourceException,
    InvalidStreamingURLException
)


class SupabaseMusicSource(MusicSource):
    """
    Music source that reads from Supabase database tables.

    The database contains pre-ingested tracks from Musopen, FreePD, and other sources.
    This approach provides better performance and control than calling external APIs directly.

    Security Features:
    - Validates all streaming URLs before returning
    - RLS policies prevent unauthorized modifications
    - Only returns active, approved tracks
    """

    # Allowed domains for streaming (will be validated per track source)
    ALLOWED_STREAMING_DOMAINS = [
        'musopen.org',
        'storage.musopen.org',
        'freepd.com',
        'files.freepd.com',
        'cdn.freepd.com',
        'archive.org',  # Internet Archive for public domain classical music
        's3.us-east-1.amazonaws.com',  # AWS S3 bucket for self-hosted tracks
        's3.amazonaws.com',  # General AWS S3 domain
        'amazonaws.com',  # AWS domain (covers all regions)
        # Add more as sources are added
    ]

    def __init__(self, supabase_client: Client, source_filter: Optional[str] = None):
        """
        Initialize Supabase music source.

        Args:
            supabase_client: Authenticated Supabase client
            source_filter: Optional filter (e.g., 'MUSOPEN', 'FREEPD')
                          If None, returns tracks from all sources
        """
        self.supabase = supabase_client
        self.source_filter = source_filter

    async def get_tracks(
        self,
        stylistic_period: Optional[StylisticPeriod] = None,
        intensity: Optional[MusicIntensity] = None,
        limit: int = 50
    ) -> List[MusicTrack]:
        """Fetch tracks from Supabase database."""

        try:
            # Build query
            query = self.supabase.table('music_tracks').select('*')

            # Apply filters
            query = query.eq('is_active', True)

            if self.source_filter:
                query = query.eq('source', self.source_filter)

            if stylistic_period:
                query = query.eq('stylistic_period', stylistic_period.value)

            # Note: intensity filtering would require joining with playlists
            # For now, we return all tracks matching period

            # Limit results
            query = query.limit(limit)

            # Execute query
            response = query.execute()

            # Convert to MusicTrack objects
            tracks = []
            for row in response.data:
                try:
                    # Validate streaming URL before creating track
                    self.validate_streaming_url(row['audio_url'])

                    track = MusicTrack(
                        id=row['id'],
                        source=row['source'],
                        title=row['title'],
                        composer=row.get('composer'),
                        artist_performer=row.get('artist_performer'),
                        duration_seconds=row['duration_seconds'],
                        audio_url=row['audio_url'],
                        stylistic_period=StylisticPeriod(row['stylistic_period']),
                        bpm=row.get('bpm'),
                        mood_tags=row.get('mood_tags', []),
                        license_info=row.get('license_info', {}),
                        quality_score=row.get('quality_score')
                    )
                    tracks.append(track)

                except InvalidStreamingURLException as e:
                    # Skip tracks with invalid URLs
                    print(f"Warning: Skipping track {row.get('id')} - invalid URL: {str(e)}")
                    continue

            return tracks

        except Exception as e:
            raise MusicSourceException(f"Failed to fetch tracks from database: {str(e)}")

    async def get_playlists(
        self,
        stylistic_period: Optional[StylisticPeriod] = None,
        intensity: Optional[MusicIntensity] = None,
        use_case: Optional[MusicUseCase] = None
    ) -> List[MusicPlaylist]:
        """Fetch curated playlists from Supabase database."""

        try:
            # Build query
            query = self.supabase.table('music_playlists').select('*')

            # Apply filters
            query = query.eq('is_active', True)

            if stylistic_period:
                query = query.eq('stylistic_period', stylistic_period.value)

            if intensity:
                query = query.eq('intended_intensity', intensity.value)

            if use_case:
                query = query.eq('intended_use', use_case.value)

            # Execute query
            response = query.execute()

            # Convert to MusicPlaylist objects
            playlists = []
            for row in response.data:
                # Get track count for this playlist
                track_count_response = self.supabase.table('music_playlist_tracks') \
                    .select('id', count='exact') \
                    .eq('playlist_id', row['id']) \
                    .execute()

                track_count = track_count_response.count if track_count_response.count else 0

                playlist = MusicPlaylist(
                    id=row['id'],
                    name=row['name'],
                    description=row.get('description', ''),
                    intended_intensity=MusicIntensity(row['intended_intensity']),
                    intended_use=MusicUseCase(row['intended_use']),
                    stylistic_period=StylisticPeriod(row['stylistic_period']),
                    duration_minutes_target=row.get('duration_minutes_target', 0),
                    track_count=track_count,
                    is_active=row.get('is_active', True),
                    is_featured=row.get('is_featured', False)
                )
                playlists.append(playlist)

            return playlists

        except Exception as e:
            raise MusicSourceException(f"Failed to fetch playlists from database: {str(e)}")

    async def get_playlist_tracks(self, playlist_id: str) -> List[MusicTrack]:
        """Get all tracks in a playlist, in order."""

        try:
            # Use the database function for better performance
            response = self.supabase.rpc(
                'get_playlist_with_tracks',
                {'playlist_id_param': playlist_id}  # Fixed: database function expects 'playlist_id_param' not 'playlist_uuid'
            ).execute()

            if not response.data:
                return []

            # Convert to MusicTrack objects
            # NOTE: Migration 024 simplified the function to return fewer fields
            # We need to fetch full track details separately for each track
            tracks = []
            for row in response.data:
                try:
                    # Fetch full track details from music_tracks table
                    track_details = self.supabase.table('music_tracks') \
                        .select('*') \
                        .eq('id', row['track_id']) \
                        .single() \
                        .execute()

                    if not track_details.data:
                        continue

                    track_data = track_details.data

                    # Validate streaming URL
                    self.validate_streaming_url(track_data['audio_url'])

                    track = MusicTrack(
                        id=track_data['id'],
                        source=track_data['source'],
                        title=track_data['title'],
                        composer=track_data.get('composer'),
                        artist_performer=track_data.get('artist_performer'),
                        duration_seconds=track_data['duration_seconds'],
                        audio_url=track_data['audio_url'],
                        stylistic_period=StylisticPeriod(track_data['stylistic_period']),
                        bpm=track_data.get('bpm'),
                        mood_tags=track_data.get('mood_tags', []),
                        license_info=track_data.get('license_info', {})
                    )
                    tracks.append(track)

                except InvalidStreamingURLException as e:
                    print(f"Warning: Skipping track {row.get('track_id')} - invalid URL: {str(e)}")
                    continue

            return tracks

        except Exception as e:
            raise MusicSourceException(f"Failed to fetch playlist tracks: {str(e)}")

    async def get_streaming_url(self, track_id: str) -> str:
        """Get the validated streaming URL for a track."""

        try:
            response = self.supabase.table('music_tracks') \
                .select('audio_url') \
                .eq('id', track_id) \
                .eq('is_active', True) \
                .single() \
                .execute()

            if not response.data:
                raise MusicSourceException(f"Track not found: {track_id}")

            audio_url = response.data['audio_url']

            # Validate URL before returning
            self.validate_streaming_url(audio_url)

            return audio_url

        except InvalidStreamingURLException:
            raise  # Re-raise validation errors
        except Exception as e:
            raise MusicSourceException(f"Failed to get streaming URL: {str(e)}")

    def get_source_name(self) -> str:
        """Get the name of this music source."""
        if self.source_filter:
            return f"SUPABASE_{self.source_filter}"
        return "SUPABASE"

    async def health_check(self) -> bool:
        """Check if Supabase database is accessible."""
        try:
            # Simple query to verify database access
            response = self.supabase.table('music_tracks') \
                .select('id') \
                .limit(1) \
                .execute()

            return True

        except Exception as e:
            raise MusicSourceException(f"Supabase health check failed: {str(e)}")


# Convenience factory functions for common sources
def create_musopen_source(supabase_client: Client) -> SupabaseMusicSource:
    """Create a music source filtered to Musopen tracks only."""
    return SupabaseMusicSource(supabase_client, source_filter='MUSOPEN')


def create_freepd_source(supabase_client: Client) -> SupabaseMusicSource:
    """Create a music source filtered to FreePD tracks only."""
    return SupabaseMusicSource(supabase_client, source_filter='FREEPD')


def create_all_sources_source(supabase_client: Client) -> SupabaseMusicSource:
    """Create a music source that returns tracks from all providers."""
    return SupabaseMusicSource(supabase_client, source_filter=None)
