"""
Sequence Validation Service
Implements the 5 critical safety rules for Pilates class sequencing
"""

from typing import List, Dict, Any, Optional
from loguru import logger


class SequenceValidator:
    """
    Validates movement sequences against Pilates safety rules

    Critical Rules (NEVER VIOLATE):
    1. Warm-up first - Always start with breathing and gentle movements
    2. Spinal progression - Flexion before extension (anatomical safety)
    3. Balance muscle groups - Don't overwork one area (max 40% per group)
    4. Complexity progression - Simple to complex within session
    5. Cool-down required - End with stretching and breathing
    """

    # Movement patterns for spinal progression rule
    FLEXION_PATTERNS = ['flexion', 'forward_bend', 'curl', 'roll']
    EXTENSION_PATTERNS = ['extension', 'backbend', 'arch', 'swan']

    # Warm-up movement indicators
    WARMUP_INDICATORS = ['breathing', 'gentle', 'warm', 'prep', 'hundred']

    # Cool-down movement indicators
    COOLDOWN_INDICATORS = ['stretch', 'breathing', 'relaxation', 'seal', 'rest']

    def __init__(self):
        """Initialize sequence validator"""
        logger.info("Initialized SequenceValidator with 5 critical safety rules")

    def validate_sequence(self, movements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate a sequence of movements against all safety rules

        Args:
            movements: List of movement dictionaries with fields:
                - name: str
                - difficulty_level: str (Beginner/Intermediate/Advanced)
                - primary_muscles: List[str]
                - category: str (optional, for pattern detection)
                - duration_seconds: int (optional)

        Returns:
            Dict with:
                - valid: bool
                - errors: List[str] (rule violations)
                - warnings: List[str] (recommendations)
                - safety_score: float (0.0-1.0)
        """
        errors = []
        warnings = []

        if not movements or len(movements) == 0:
            return {
                "valid": False,
                "errors": ["Sequence cannot be empty"],
                "warnings": [],
                "safety_score": 0.0
            }

        # Rule 1: Warm-up first
        warmup_check = self._check_warmup(movements)
        if not warmup_check["valid"]:
            errors.append(warmup_check["error"])
        if warmup_check.get("warning"):
            warnings.append(warmup_check["warning"])

        # Rule 2: Spinal progression (flexion before extension)
        spinal_check = self._check_spinal_progression(movements)
        if not spinal_check["valid"]:
            errors.append(spinal_check["error"])
        if spinal_check.get("warning"):
            warnings.append(spinal_check["warning"])

        # Rule 3: Balance muscle groups (checked separately in muscle_balance service)
        # This is a recommendation here
        muscle_warning = self._check_muscle_variety(movements)
        if muscle_warning:
            warnings.append(muscle_warning)

        # Rule 4: Complexity progression
        complexity_check = self._check_complexity_progression(movements)
        if not complexity_check["valid"]:
            errors.append(complexity_check["error"])
        if complexity_check.get("warning"):
            warnings.append(complexity_check["warning"])

        # Rule 5: Cool-down required
        cooldown_check = self._check_cooldown(movements)
        if not cooldown_check["valid"]:
            errors.append(cooldown_check["error"])
        if cooldown_check.get("warning"):
            warnings.append(cooldown_check["warning"])

        # Calculate safety score
        total_rules = 5
        violations = len(errors)
        safety_score = max(0.0, (total_rules - violations) / total_rules)

        is_valid = len(errors) == 0

        return {
            "valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "safety_score": safety_score
        }

    def _check_warmup(self, movements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check if sequence starts with warm-up movements"""
        if len(movements) == 0:
            return {"valid": False, "error": "Empty sequence"}

        first_movement = movements[0]
        first_name = first_movement.get('name', '').lower()
        first_difficulty = first_movement.get('difficulty_level', '').lower()
        first_category = first_movement.get('category', '').lower()

        # Check if first movement is a warm-up
        is_warmup = (
            any(indicator in first_name for indicator in self.WARMUP_INDICATORS) or
            any(indicator in first_category for indicator in self.WARMUP_INDICATORS) or
            'breathing' in first_name
        )

        if not is_warmup:
            # Check if it's at least a beginner movement
            if first_difficulty != 'beginner':
                return {
                    "valid": False,
                    "error": "Class must start with warm-up or gentle breathing exercises (Rule 1: Warm-up first)"
                }
            else:
                return {
                    "valid": True,
                    "warning": "Consider starting with a dedicated warm-up movement for optimal safety"
                }

        return {"valid": True}

    def _check_spinal_progression(self, movements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Check spinal progression: flexion must come before extension
        This is critical for anatomical safety
        """
        first_extension_index = None
        last_flexion_index = None

        for i, movement in enumerate(movements):
            name = movement.get('name', '').lower()
            category = movement.get('category', '').lower()

            # Check for extension patterns
            is_extension = any(pattern in name or pattern in category
                             for pattern in self.EXTENSION_PATTERNS)

            # Check for flexion patterns
            is_flexion = any(pattern in name or pattern in category
                           for pattern in self.FLEXION_PATTERNS)

            if is_extension and first_extension_index is None:
                first_extension_index = i

            if is_flexion:
                last_flexion_index = i

        # If we have both, check progression
        if first_extension_index is not None and last_flexion_index is not None:
            if first_extension_index < last_flexion_index:
                extension_name = movements[first_extension_index].get('name', 'Unknown')
                return {
                    "valid": False,
                    "error": f"Spinal extension ('{extension_name}') appears before all flexion movements complete (Rule 2: Flexion before extension)"
                }

        # If we have extensions but no flexions, that's a warning
        if first_extension_index is not None and last_flexion_index is None:
            return {
                "valid": True,
                "warning": "Sequence contains spinal extension without flexion warm-up. Consider adding flexion movements first."
            }

        return {"valid": True}

    def _check_muscle_variety(self, movements: List[Dict[str, Any]]) -> Optional[str]:
        """Check if there's variety in muscle groups (warning only)"""
        muscle_groups = set()

        for movement in movements:
            primary_muscles = movement.get('primary_muscles', [])
            if isinstance(primary_muscles, list):
                muscle_groups.update(primary_muscles)
            elif isinstance(primary_muscles, str):
                muscle_groups.add(primary_muscles)

        if len(muscle_groups) < 2:
            return "Consider adding variety in muscle groups for balanced workout"

        return None

    def _check_complexity_progression(self, movements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Check that difficulty progresses appropriately
        Should not jump from Beginner to Advanced without Intermediate
        """
        difficulty_map = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3
        }

        difficulty_sequence = []
        for movement in movements:
            level = movement.get('difficulty_level', 'beginner').lower()
            difficulty_sequence.append(difficulty_map.get(level, 1))

        # Check for big jumps (more than 1 level)
        for i in range(len(difficulty_sequence) - 1):
            jump = difficulty_sequence[i + 1] - difficulty_sequence[i]
            if jump > 1:
                return {
                    "valid": False,
                    "error": f"Difficulty jumps too quickly from {list(difficulty_map.keys())[difficulty_sequence[i]-1]} to {list(difficulty_map.keys())[difficulty_sequence[i+1]-1]} (Rule 4: Gradual complexity progression)"
                }

        # Check if Advanced movements appear in first 25% of class
        if len(movements) >= 4:
            first_quarter = movements[:len(movements)//4]
            for movement in first_quarter:
                if movement.get('difficulty_level', '').lower() == 'advanced':
                    return {
                        "valid": True,
                        "warning": "Advanced movements in first quarter of class may be too challenging for warm-up phase"
                    }

        return {"valid": True}

    def _check_cooldown(self, movements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check if sequence ends with cool-down"""
        if len(movements) == 0:
            return {"valid": False, "error": "Empty sequence"}

        last_movement = movements[-1]
        last_name = last_movement.get('name', '').lower()
        last_category = last_movement.get('category', '').lower()
        last_difficulty = last_movement.get('difficulty_level', '').lower()

        # Check if last movement is a cool-down
        is_cooldown = (
            any(indicator in last_name for indicator in self.COOLDOWN_INDICATORS) or
            any(indicator in last_category for indicator in self.COOLDOWN_INDICATORS)
        )

        if not is_cooldown:
            # Check if it's at least not advanced
            if last_difficulty == 'advanced':
                return {
                    "valid": False,
                    "error": "Class must end with cool-down or gentle movements, not advanced exercises (Rule 5: Cool-down required)"
                }
            else:
                return {
                    "valid": True,
                    "warning": "Consider ending with a dedicated cool-down movement (breathing, stretching) for optimal recovery"
                }

        return {"valid": True}

    def get_recommendations(self, movements: List[Dict[str, Any]]) -> List[str]:
        """
        Get recommendations for improving the sequence

        Args:
            movements: List of movements

        Returns:
            List of recommendation strings
        """
        recommendations = []

        if len(movements) < 3:
            recommendations.append("Short sequence. Consider adding more movements for a complete workout.")

        if len(movements) > 20:
            recommendations.append("Long sequence. Ensure adequate time for each movement.")

        # Check for warm-up
        first_name = movements[0].get('name', '').lower() if movements else ''
        if 'hundred' not in first_name and 'breathing' not in first_name:
            recommendations.append("Consider starting with 'The Hundred' as a classic Pilates warm-up")

        # Check for cool-down
        last_name = movements[-1].get('name', '').lower() if movements else ''
        if 'seal' not in last_name and 'stretch' not in last_name:
            recommendations.append("Consider ending with 'Seal' or stretching for a proper cool-down")

        return recommendations


# Global instance
sequence_validator = SequenceValidator()
