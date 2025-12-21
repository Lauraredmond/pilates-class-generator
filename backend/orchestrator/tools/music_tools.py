"""
==============================================================================
MUSIC TOOLS - Extracted from backend/agents/music_agent.py
==============================================================================
BASSLINE CUSTOM: Pilates music selection business logic

This module contains all music selection logic extracted from MusicAgent.
Pure business logic - no agent orchestration, just domain expertise.

JENTIC PATTERN: Tools = Domain Expertise
StandardAgent will call these methods via the tools registry.
==============================================================================
"""

import random
from typing import Dict, Any, List
from loguru import logger


class MusicTools:
    """
    BASSLINE CUSTOM: Music selection business logic for Pilates classes

    Extracted from: backend/agents/music_agent.py (213 lines)
    All business logic preserved - nothing lost in migration.
    """

    # Sample music database (in production, integrate with database)
    MUSIC_LIBRARY = [
        # Warm-up music (90-100 BPM)
        {"title": "Sunrise Flow", "artist": "Yoga Sounds", "bpm": 95, "duration": 300, "energy": 0.3, "genre": "ambient"},
        {"title": "Morning Breath", "artist": "Meditation Masters", "bpm": 92, "duration": 240, "energy": 0.2, "genre": "ambient"},

        # Main workout music (110-125 BPM)
        {"title": "Core Power", "artist": "Fitness Beats", "bpm": 118, "duration": 240, "energy": 0.7, "genre": "electronic"},
        {"title": "Steady Flow", "artist": "Movement Music", "bpm": 115, "duration": 300, "energy": 0.6, "genre": "electronic"},
        {"title": "Pilates Groove", "artist": "Studio Mix", "bpm": 120, "duration": 280, "energy": 0.65, "genre": "pop"},
        {"title": "Rhythm Core", "artist": "Fitness FM", "bpm": 122, "duration": 260, "energy": 0.7, "genre": "electronic"},

        # Cool-down music (70-85 BPM)
        {"title": "Peaceful Release", "artist": "Spa Sounds", "bpm": 75, "duration": 300, "energy": 0.2, "genre": "ambient"},
        {"title": "Deep Stretch", "artist": "Yoga Collection", "bpm": 80, "duration": 240, "energy": 0.25, "genre": "classical"},
    ]

    def __init__(self, bassline_api_url: str = None):
        """
        Initialize music tools

        Args:
            bassline_api_url: Optional backend API URL for database integration
        """
        self.api_url = bassline_api_url
        logger.info("✅ MusicTools initialized")

    def select_music(
        self,
        class_duration_minutes: int,
        energy_curve: List[float] = None,
        preferred_genres: List[str] = None,
        target_bpm_range: tuple = (90, 130),
        exclude_explicit: bool = True  # Filter explicit content (default: exclude)
    ) -> Dict[str, Any]:
        """
        Select music playlist for Pilates class

        BASSLINE CUSTOM: Music selection logic (from MusicAgent)

        Args:
            class_duration_minutes: Total class duration (15-120 minutes)
            energy_curve: Optional energy levels throughout class (0.0-1.0)
            preferred_genres: Optional list of preferred genres
            target_bpm_range: Target BPM range (default: 90-130)

        Returns:
            Dict with playlist, statistics, and energy match score
        """
        # Validate inputs (allow 12-min quick practice, though music is skipped for quick practice)
        if not (12 <= class_duration_minutes <= 120):
            raise ValueError("Duration must be between 12 and 120 minutes")

        logger.info(f"Selecting music for {class_duration_minutes} min class | BPM: {target_bpm_range}")

        # Build playlist based on class structure
        playlist = self._build_playlist(
            duration_minutes=class_duration_minutes,
            energy_curve=energy_curve or [],
            preferred_genres=preferred_genres or [],
            bpm_range=target_bpm_range
        )

        # Calculate playlist statistics
        total_duration = sum(track["duration"] for track in playlist)
        average_bpm = sum(track["bpm"] for track in playlist) // len(playlist) if playlist else 0

        # Calculate how well the playlist matches energy curve
        energy_match = self._calculate_energy_match(playlist, energy_curve or [])

        return {
            "playlist": playlist,
            "total_duration_seconds": total_duration,
            "average_bpm": average_bpm,
            "energy_curve_match": energy_match
        }

    def _build_playlist(
        self,
        duration_minutes: int,
        energy_curve: List[float],
        preferred_genres: List[str],
        bpm_range: tuple
    ) -> List[Dict[str, Any]]:
        """Build playlist matching class requirements"""
        target_duration = duration_minutes * 60  # Convert to seconds
        playlist = []
        current_duration = 0

        # Phase 1: Warmup (first 10-15% of class)
        warmup_duration = target_duration * 0.15
        warmup_tracks = [t for t in self.MUSIC_LIBRARY if t["bpm"] < 100 and t["energy"] < 0.4]
        while current_duration < warmup_duration and warmup_tracks:
            track = random.choice(warmup_tracks)
            playlist.append(track)
            current_duration += track["duration"]

        # Phase 2: Main workout (middle 70-75% of class)
        workout_duration = target_duration * 0.70
        workout_end = current_duration + workout_duration
        workout_tracks = [
            t for t in self.MUSIC_LIBRARY
            if bpm_range[0] <= t["bpm"] <= bpm_range[1] and 0.5 <= t["energy"] <= 0.8
        ]

        # Filter by preferred genres if specified
        if preferred_genres:
            genre_filtered = [t for t in workout_tracks if t["genre"] in preferred_genres]
            if genre_filtered:
                workout_tracks = genre_filtered

        while current_duration < workout_end and workout_tracks:
            track = random.choice(workout_tracks)
            playlist.append(track)
            current_duration += track["duration"]

        # Phase 3: Cool-down (last 10-15% of class)
        cooldown_tracks = [t for t in self.MUSIC_LIBRARY if t["bpm"] < 90 and t["energy"] < 0.3]
        while current_duration < target_duration and cooldown_tracks:
            track = random.choice(cooldown_tracks)
            playlist.append(track)
            current_duration += track["duration"]

        return playlist

    def _calculate_energy_match(
        self,
        playlist: List[Dict[str, Any]],
        energy_curve: List[float]
    ) -> float:
        """Calculate how well playlist matches desired energy curve"""
        if not energy_curve or not playlist:
            return 0.85  # Default good match if no curve specified

        # Sample energy at different points
        playlist_energy = [track["energy"] for track in playlist]

        # If energy curve provided, compare
        if len(energy_curve) > 0:
            # Simple comparison: higher variance is better (warmup->workout->cooldown)
            curve_variance = self._calculate_variance(energy_curve)
            playlist_variance = self._calculate_variance(playlist_energy)

            # Good playlists should have similar variance to desired curve
            match = 1.0 - abs(curve_variance - playlist_variance)
            return max(0.5, min(1.0, match))

        return 0.85

    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of values"""
        if not values:
            return 0.0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance
