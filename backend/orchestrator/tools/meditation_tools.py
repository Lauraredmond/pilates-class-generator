"""
==============================================================================
MEDITATION TOOLS - Extracted from backend/agents/meditation_agent.py
==============================================================================
BASSLINE CUSTOM: Meditation script generation business logic

This module contains all meditation generation logic extracted from MeditationAgent.
Pure business logic - no agent orchestration, just domain expertise.

JENTIC PATTERN: Tools = Domain Expertise
StandardAgent will call these methods via the tools registry.
==============================================================================
"""

from typing import Dict, Any
from loguru import logger


class MeditationTools:
    """
    BASSLINE CUSTOM: Meditation script generation for Pilates classes

    Extracted from: backend/agents/meditation_agent.py (217 lines)
    All business logic preserved - nothing lost in migration.
    """

    MEDITATION_TEMPLATES = {
        "mindfulness": {
            "intro": "Find a comfortable position, either lying on your back or seated with a tall spine.",
            "themes": [
                "Bring your awareness to your breath, noticing the natural rhythm of inhale and exhale.",
                "Scan through your body, releasing any tension you find.",
                "Notice the sensations in your body after your practice.",
                "Allow thoughts to come and go like clouds passing in the sky."
            ],
            "closing": "Take a deep breath in, and as you exhale, slowly open your eyes when you're ready."
        },
        "body_scan": {
            "intro": "Lie comfortably on your back, arms by your sides, palms facing up.",
            "themes": [
                "Starting at your feet, notice any sensations - warmth, coolness, tingling.",
                "Slowly move your awareness up through your legs, noticing each part.",
                "Bring attention to your core, feeling the engagement from your practice.",
                "Scan through your chest, shoulders, arms, and finally your face and head."
            ],
            "closing": "Gently wiggle your fingers and toes, and slowly return to the present moment."
        },
        "gratitude": {
            "intro": "Settle into a comfortable resting position, allowing your body to be fully supported.",
            "themes": [
                "Reflect on your practice today, appreciating what your body can do.",
                "Think of one thing you're grateful for in this moment.",
                "Feel gratitude for taking this time for yourself.",
                "Send appreciation to your body for its strength and flexibility."
            ],
            "closing": "Carry this sense of gratitude with you as you move into the rest of your day."
        }
    }

    BREATHING_PATTERNS = {
        "calming": "Breathe in for 4 counts, hold for 4 counts, exhale for 6 counts.",
        "balancing": "Breathe in for 4 counts, exhale for 4 counts.",
        "energizing": "Breathe in for 6 counts, hold for 2 counts, exhale for 4 counts."
    }

    def __init__(self, bassline_api_url: str = None):
        """
        Initialize meditation tools

        Args:
            bassline_api_url: Optional backend API URL for database integration
        """
        self.api_url = bassline_api_url
        logger.info("✅ MeditationTools initialized")

    def generate_meditation(
        self,
        duration_minutes: int = 5,
        class_intensity: str = "moderate",
        focus_theme: str = None,
        include_breathing: bool = True
    ) -> Dict[str, Any]:
        """
        Generate meditation script for Pilates class cool-down

        BASSLINE CUSTOM: Meditation generation logic (from MeditationAgent)

        Args:
            duration_minutes: Duration of meditation (2-15 minutes)
            class_intensity: 'low', 'moderate', or 'high'
            focus_theme: Optional theme ('mindfulness', 'body_scan', 'gratitude')
            include_breathing: Whether to include breathing guidance

        Returns:
            Dict with script, theme, breathing pattern, and suggested position
        """
        # Validate inputs
        if not (2 <= duration_minutes <= 15):
            raise ValueError("Duration must be between 2 and 15 minutes")

        if class_intensity not in ["low", "moderate", "high"]:
            raise ValueError("class_intensity must be low, moderate, or high")

        # Select theme based on intensity if not provided
        theme = focus_theme or self._select_theme(class_intensity)

        logger.info(f"Generating {theme} meditation for {duration_minutes} minutes")

        # Build meditation script
        script = self._build_script(
            theme=theme,
            duration_minutes=duration_minutes,
            intensity=class_intensity,
            include_breathing=include_breathing
        )

        # Select breathing pattern
        breathing = self._select_breathing_pattern(class_intensity) if include_breathing else None

        # Determine position
        position = "supine" if class_intensity == "high" else "seated"

        # Return in format expected by frontend (PlaybackMeditation interface)
        return {
            "script_name": f"{theme.replace('_', ' ').title()} Meditation",
            "meditation_theme": theme,
            "script_text": script,
            "breathing_guidance": breathing,
            "duration_seconds": duration_minutes * 60,
            "post_intensity": class_intensity,
            "suggested_position": position
        }

    def _select_theme(self, intensity: str) -> str:
        """Select appropriate theme based on class intensity"""
        theme_map = {
            "low": "mindfulness",
            "moderate": "body_scan",
            "high": "gratitude"
        }
        return theme_map.get(intensity, "mindfulness")

    def _build_script(
        self,
        theme: str,
        duration_minutes: int,
        intensity: str,
        include_breathing: bool
    ) -> str:
        """Build complete meditation script"""
        template = self.MEDITATION_TEMPLATES.get(theme, self.MEDITATION_TEMPLATES["mindfulness"])

        script_parts = []

        # Introduction
        script_parts.append(template["intro"])
        script_parts.append("")

        # Add breathing if requested
        if include_breathing:
            breathing_pattern = self._select_breathing_pattern(intensity)
            script_parts.append(f"Begin with your breath: {breathing_pattern}")
            script_parts.append("")

        # Main themes (scale based on duration)
        num_themes = min(len(template["themes"]), max(2, duration_minutes // 2))
        for theme_line in template["themes"][:num_themes]:
            script_parts.append(theme_line)
            script_parts.append("")
            if include_breathing:
                script_parts.append("Take a few deep breaths here.")
                script_parts.append("")

        # Closing
        script_parts.append(template["closing"])

        return "\n".join(script_parts)

    def _select_breathing_pattern(self, intensity: str) -> str:
        """Select breathing pattern based on intensity"""
        pattern_map = {
            "low": "balancing",
            "moderate": "calming",
            "high": "calming"  # High intensity classes need calming breath
        }
        pattern_type = pattern_map.get(intensity, "calming")
        return self.BREATHING_PATTERNS[pattern_type]
