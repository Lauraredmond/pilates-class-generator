"""
Vendor-Agnostic Music Source Layer
Session 9: Music Integration

This module provides an abstract interface for music sources (Musopen, FreePD, etc.)
allowing easy swapping and addition of new music providers without changing the
rest of the application.

Security Features:
- No API keys exposed to clients
- Validated and whitelisted streaming domains
- No generic "fetch any URL" proxy endpoints
- All external URLs validated before use
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import re
from urllib.parse import urlparse


class StylisticPeriod(str, Enum):
    """Musical stylistic periods for Pilates classes."""
    BAROQUE = "BAROQUE"
    CLASSICAL = "CLASSICAL"
    ROMANTIC = "ROMANTIC"
    IMPRESSIONIST = "IMPRESSIONIST"
    MODERN = "MODERN"
    CONTEMPORARY = "CONTEMPORARY"
    CELTIC_TRADITIONAL = "CELTIC_TRADITIONAL"


class MusicIntensity(str, Enum):
    """Intensity levels for workout matching."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class MusicUseCase(str, Enum):
    """Intended use cases for music."""
    PILATES_SLOW_FLOW = "PILATES_SLOW_FLOW"
    PILATES_CORE = "PILATES_CORE"
    PILATES_STRETCH = "PILATES_STRETCH"
    WARM_UP = "WARM_UP"
    COOL_DOWN = "COOL_DOWN"
    MEDITATION = "MEDITATION"
    GENERAL = "GENERAL"


@dataclass
class MusicTrack:
    """Represents a single music track from any source."""
    id: str
    source: str  # 'MUSOPEN', 'FREEPD', etc.
    title: str
    composer: Optional[str]
    artist_performer: Optional[str]
    duration_seconds: int
    audio_url: str  # Direct streaming URL
    stylistic_period: StylisticPeriod
    bpm: Optional[int] = None
    mood_tags: List[str] = None
    license_info: Dict[str, Any] = None
    quality_score: Optional[float] = None

    def __post_init__(self):
        if self.mood_tags is None:
            self.mood_tags = []
        if self.license_info is None:
            self.license_info = {}


@dataclass
class MusicPlaylist:
    """Represents a curated playlist for a specific workout type."""
    id: str
    name: str
    description: str
    intended_intensity: MusicIntensity
    intended_use: MusicUseCase
    stylistic_period: StylisticPeriod
    duration_minutes_target: int
    track_count: int
    is_active: bool = True
    is_featured: bool = False


class MusicSourceException(Exception):
    """Base exception for music source errors."""
    pass


class InvalidStreamingURLException(MusicSourceException):
    """Raised when a streaming URL fails security validation."""
    pass


class MusicSource(ABC):
    """
    Abstract base class for music sources.

    All music providers (Musopen, FreePD, Jamendo, etc.) must implement this interface.

    Security Requirements:
    - validate_streaming_url() must be called before returning any audio URL
    - API keys must never be exposed in responses
    - All external fetches must be from whitelisted domains only
    """

    # Whitelisted domains for this source (subclasses must define)
    ALLOWED_STREAMING_DOMAINS: List[str] = []

    @abstractmethod
    async def get_tracks(
        self,
        stylistic_period: Optional[StylisticPeriod] = None,
        intensity: Optional[MusicIntensity] = None,
        limit: int = 50
    ) -> List[MusicTrack]:
        """
        Fetch tracks from the music source.

        Args:
            stylistic_period: Filter by musical period
            intensity: Filter by intensity level
            limit: Maximum number of tracks to return

        Returns:
            List of MusicTrack objects

        Raises:
            MusicSourceException: If fetch fails
        """
        pass

    @abstractmethod
    async def get_playlists(
        self,
        stylistic_period: Optional[StylisticPeriod] = None,
        intensity: Optional[MusicIntensity] = None,
        use_case: Optional[MusicUseCase] = None
    ) -> List[MusicPlaylist]:
        """
        Fetch curated playlists from the music source.

        Args:
            stylistic_period: Filter by musical period
            intensity: Filter by intensity level
            use_case: Filter by intended use case

        Returns:
            List of MusicPlaylist objects

        Raises:
            MusicSourceException: If fetch fails
        """
        pass

    @abstractmethod
    async def get_playlist_tracks(self, playlist_id: str) -> List[MusicTrack]:
        """
        Get all tracks in a specific playlist, in order.

        Args:
            playlist_id: The playlist identifier

        Returns:
            List of MusicTrack objects in sequence order

        Raises:
            MusicSourceException: If playlist not found or fetch fails
        """
        pass

    @abstractmethod
    async def get_streaming_url(self, track_id: str) -> str:
        """
        Get the direct streaming URL for a track.

        Args:
            track_id: The track identifier

        Returns:
            Validated streaming URL

        Raises:
            InvalidStreamingURLException: If URL fails security validation
            MusicSourceException: If track not found

        Security:
            - URL must pass validate_streaming_url() check
            - Must be from ALLOWED_STREAMING_DOMAINS
        """
        pass

    def validate_streaming_url(self, url: str) -> bool:
        """
        Validate that a streaming URL is safe to use.

        Security checks:
        1. Must be HTTPS (or whitelisted HTTP domain)
        2. Must be from an allowed domain
        3. Must not contain suspicious patterns

        Args:
            url: The URL to validate

        Returns:
            True if valid

        Raises:
            InvalidStreamingURLException: If validation fails
        """
        if not url:
            raise InvalidStreamingURLException("Empty URL provided")

        # Parse URL
        try:
            parsed = urlparse(url)
        except Exception as e:
            raise InvalidStreamingURLException(f"Invalid URL format: {str(e)}")

        # Check protocol (must be HTTPS for security)
        if parsed.scheme not in ['https', 'http']:
            raise InvalidStreamingURLException(f"Invalid protocol: {parsed.scheme}. Must be https.")

        # Check domain whitelist
        domain = parsed.netloc.lower()

        # Remove port if present
        domain = domain.split(':')[0]

        # Check if domain is in whitelist (exact match or subdomain)
        allowed = False
        for allowed_domain in self.ALLOWED_STREAMING_DOMAINS:
            if domain == allowed_domain or domain.endswith(f".{allowed_domain}"):
                allowed = True
                break

        if not allowed:
            raise InvalidStreamingURLException(
                f"Domain '{domain}' not in whitelist: {self.ALLOWED_STREAMING_DOMAINS}"
            )

        # Check for suspicious patterns
        suspicious_patterns = [
            r'\.\./',  # Directory traversal
            r'javascript:',  # XSS
            r'data:',  # Data URLs
            r'file://',  # Local files
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                raise InvalidStreamingURLException(f"Suspicious pattern detected: {pattern}")

        return True

    @abstractmethod
    def get_source_name(self) -> str:
        """
        Get the name of this music source.

        Returns:
            Source name (e.g., "MUSOPEN", "FREEPD")
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the music source is available.

        Returns:
            True if source is healthy and responding

        Raises:
            MusicSourceException: If source is unavailable
        """
        pass


class MusicSourceRegistry:
    """
    Registry for managing multiple music sources.

    Allows the application to work with multiple providers
    and gracefully fall back if one is unavailable.
    """

    def __init__(self):
        self._sources: Dict[str, MusicSource] = {}
        self._primary_source: Optional[str] = None

    def register(self, source: MusicSource, is_primary: bool = False):
        """
        Register a music source.

        Args:
            source: MusicSource instance
            is_primary: Whether this is the primary source
        """
        source_name = source.get_source_name()
        self._sources[source_name] = source

        if is_primary:
            self._primary_source = source_name

    def get_source(self, source_name: str) -> Optional[MusicSource]:
        """Get a specific music source by name."""
        return self._sources.get(source_name)

    def get_primary_source(self) -> Optional[MusicSource]:
        """Get the primary music source."""
        if self._primary_source:
            return self._sources.get(self._primary_source)
        return None

    def get_all_sources(self) -> List[MusicSource]:
        """Get all registered music sources."""
        return list(self._sources.values())

    async def get_tracks_from_all_sources(
        self,
        stylistic_period: Optional[StylisticPeriod] = None,
        intensity: Optional[MusicIntensity] = None,
        limit_per_source: int = 25
    ) -> List[MusicTrack]:
        """
        Fetch tracks from all available sources.

        Args:
            stylistic_period: Filter by musical period
            intensity: Filter by intensity level
            limit_per_source: Max tracks per source

        Returns:
            Combined list of tracks from all sources
        """
        all_tracks = []

        for source in self._sources.values():
            try:
                tracks = await source.get_tracks(
                    stylistic_period=stylistic_period,
                    intensity=intensity,
                    limit=limit_per_source
                )
                all_tracks.extend(tracks)
            except MusicSourceException as e:
                # Log error but continue with other sources
                print(f"Warning: Failed to fetch from {source.get_source_name()}: {str(e)}")
                continue

        return all_tracks
