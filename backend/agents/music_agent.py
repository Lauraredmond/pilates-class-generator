"""
Music Agent - Recommends music for Pilates classes
Matches BPM to movement rhythm and class energy curve
"""

import random
from typing import Dict, Any, List
from loguru import logger

from agents.base_agent import BaseAgent


class MusicAgent(BaseAgent):
    """
    Agent for selecting appropriate music for Pilates classes
    """

    # Sample music database (in production, integrate with SoundCloud API)
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

    def __init__(
        self,
        model_name: str = "gpt-3.5-turbo",
        strictness_level: str = "guided"
    ):
        super().__init__(
            agent_type="music",
            model_name=model_name,
            strictness_level=strictness_level
        )

    def _validate_inputs(self, inputs: Dict[str, Any]) -> None:
        """Validate music selection inputs"""
        if "class_duration_minutes" not in inputs:
            raise ValueError("class_duration_minutes is required")

        duration = inputs["class_duration_minutes"]
        if not (15 <= duration <= 120):
            raise ValueError("Duration must be between 15 and 120 minutes")

    async def _process_internal(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Select music playlist for class"""
        duration_minutes = inputs["class_duration_minutes"]
        energy_curve = inputs.get("energy_curve", [])
        preferred_genres = inputs.get("preferred_genres", [])
        exclude_explicit = inputs.get("exclude_explicit", True)
        target_bpm_range = inputs.get("target_bpm_range", (90, 130))

        logger.info(f"Selecting music for {duration_minutes} min class | BPM: {target_bpm_range}")

        # Build playlist based on class structure
        playlist = self._build_playlist(
            duration_minutes=duration_minutes,
            energy_curve=energy_curve,
            preferred_genres=preferred_genres,
            bpm_range=target_bpm_range
        )

        # Calculate playlist statistics
        total_duration = sum(track["duration"] for track in playlist)
        average_bpm = sum(track["bpm"] for track in playlist) // len(playlist) if playlist else 0

        # Calculate how well the playlist matches energy curve
        energy_match = self._calculate_energy_match(playlist, energy_curve)

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

    def _calculate_confidence(self, output_data: Dict[str, Any]) -> float:
        """Calculate confidence in music selection"""
        playlist = output_data.get("playlist", [])
        energy_match = output_data.get("energy_curve_match", 0.5)

        # Confidence based on:
        # - Having enough tracks (0.3 weight)
        # - Energy curve match (0.7 weight)

        track_score = min(1.0, len(playlist) / 10)  # 10+ tracks is ideal
        confidence = (track_score * 0.3) + (energy_match * 0.7)

        return round(confidence, 2)

    def _generate_reasoning(
        self,
        inputs: Dict[str, Any],
        output_data: Dict[str, Any]
    ) -> str:
        """Generate explanation of music selection"""
        playlist = output_data.get("playlist", [])
        avg_bpm = output_data.get("average_bpm", 0)
        energy_match = output_data.get("energy_curve_match", 0)

        reasoning = (
            f"Selected {len(playlist)} tracks with average BPM of {avg_bpm}. "
            f"Playlist includes warmup, workout, and cool-down phases. "
            f"Energy curve match: {energy_match:.1%}."
        )

        if inputs.get("preferred_genres"):
            reasoning += f" Filtered for preferred genres: {', '.join(inputs['preferred_genres'])}."

        return reasoning

    async def _get_fallback(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Provide fallback playlist"""
        # Return a simple balanced playlist
        return {
            "playlist": self.MUSIC_LIBRARY[:5],  # First 5 tracks
            "total_duration_seconds": sum(t["duration"] for t in self.MUSIC_LIBRARY[:5]),
            "average_bpm": 105,
            "energy_curve_match": 0.7,
            "fallback": True
        }
