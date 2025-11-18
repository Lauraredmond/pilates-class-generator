"""
Meditation Agent - Generates cool-down meditation scripts
Adapts to class intensity and user preferences
"""

from typing import Dict, Any
from loguru import logger

from agents.base_agent import BaseAgent


class MeditationAgent(BaseAgent):
    """
    Agent for generating meditation and cool-down scripts
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

    def __init__(
        self,
        model_name: str = "gpt-3.5-turbo",
        strictness_level: str = "guided"
    ):
        super().__init__(
            agent_type="meditation",
            model_name=model_name,
            strictness_level=strictness_level
        )

    def _validate_inputs(self, inputs: Dict[str, Any]) -> None:
        """Validate meditation generation inputs"""
        duration = inputs.get("duration_minutes", 5)
        if not (2 <= duration <= 15):
            raise ValueError("Duration must be between 2 and 15 minutes")

        intensity = inputs.get("class_intensity", "moderate")
        if intensity not in ["low", "moderate", "high"]:
            raise ValueError("class_intensity must be low, moderate, or high")

    async def _process_internal(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Generate meditation script"""
        duration_minutes = inputs.get("duration_minutes", 5)
        intensity = inputs.get("class_intensity", "moderate")
        theme = inputs.get("focus_theme") or self._select_theme(intensity)
        include_breathing = inputs.get("include_breathing", True)

        logger.info(f"Generating {theme} meditation for {duration_minutes} minutes")

        # Build meditation script
        script = self._build_script(
            theme=theme,
            duration_minutes=duration_minutes,
            intensity=intensity,
            include_breathing=include_breathing
        )

        # Select breathing pattern
        breathing = self._select_breathing_pattern(intensity) if include_breathing else None

        # Determine position
        position = "supine" if intensity == "high" else "seated"

        return {
            "script": script,
            "duration_minutes": duration_minutes,
            "theme": theme,
            "breathing_pattern": breathing,
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

    def _calculate_confidence(self, output_data: Dict[str, Any]) -> float:
        """Calculate confidence in meditation script"""
        script = output_data.get("script", "")
        script_length = len(script.split())

        # Confidence based on script completeness
        # Good scripts have 100-300 words
        if 100 <= script_length <= 300:
            return 0.95
        elif 50 <= script_length < 100:
            return 0.80
        elif script_length > 300:
            return 0.85
        else:
            return 0.60

    def _generate_reasoning(
        self,
        inputs: Dict[str, Any],
        output_data: Dict[str, Any]
    ) -> str:
        """Generate explanation of meditation selection"""
        theme = output_data.get("theme", "mindfulness")
        duration = output_data.get("duration_minutes", 5)
        intensity = inputs.get("class_intensity", "moderate")
        breathing = output_data.get("breathing_pattern")

        reasoning = (
            f"Generated {duration}-minute {theme} meditation script for {intensity} intensity class. "
        )

        if breathing:
            reasoning += f"Includes calming breathing pattern. "

        reasoning += f"Suggested position: {output_data.get('suggested_position', 'supine')}."

        return reasoning

    async def _get_fallback(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Provide fallback meditation"""
        return {
            "script": (
                "Find a comfortable resting position.\n\n"
                "Close your eyes and bring your awareness to your breath.\n\n"
                "Notice the natural rhythm of your breathing.\n\n"
                "Take a moment to appreciate your practice today.\n\n"
                "When you're ready, slowly open your eyes and return to the present moment."
            ),
            "duration_minutes": 3,
            "theme": "mindfulness",
            "breathing_pattern": self.BREATHING_PATTERNS["calming"],
            "suggested_position": "supine",
            "fallback": True
        }
