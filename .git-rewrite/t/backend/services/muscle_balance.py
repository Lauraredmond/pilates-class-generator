"""
Muscle Balance Tracking Service
Ensures balanced muscle group engagement across a class sequence
"""

from typing import List, Dict, Any
from collections import defaultdict
from loguru import logger


class MuscleBalanceCalculator:
    """
    Calculates muscle group balance across a movement sequence

    Critical Rule: No single muscle group should exceed 40% of total work
    """

    # Standard muscle groups
    MUSCLE_GROUPS = {
        'core', 'abs', 'abdominals', 'obliques',
        'legs', 'quads', 'hamstrings', 'calves',
        'arms', 'biceps', 'triceps',
        'back', 'spine', 'erector_spinae',
        'hip_flexors', 'hips',
        'glutes', 'gluteus',
        'shoulders', 'deltoids',
        'chest', 'pectorals'
    }

    # Muscle group categories
    MUSCLE_CATEGORIES = {
        'core': ['core', 'abs', 'abdominals', 'obliques'],
        'legs': ['legs', 'quads', 'quadriceps', 'hamstrings', 'calves', 'thighs'],
        'arms': ['arms', 'biceps', 'triceps', 'forearms'],
        'back': ['back', 'spine', 'erector_spinae', 'latissimus', 'lats'],
        'hip_flexors': ['hip_flexors', 'hips', 'hip'],
        'glutes': ['glutes', 'gluteus', 'buttocks'],
        'shoulders': ['shoulders', 'deltoids', 'delts'],
        'chest': ['chest', 'pectorals', 'pecs']
    }

    MAX_SINGLE_GROUP_PERCENTAGE = 40.0  # Critical threshold

    def __init__(self):
        """Initialize muscle balance calculator"""
        logger.info("Initialized MuscleBalanceCalculator with 40% max threshold")

    def calculate_balance(self, movements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate muscle balance across a sequence of movements

        Args:
            movements: List of movement dictionaries with fields:
                - primary_muscles: List[str] or str
                - duration_seconds: int (optional, defaults to 60)

        Returns:
            Dict with:
                - muscle_percentages: Dict[str, float] - percentage for each muscle category
                - total_duration: int - total duration in seconds
                - balance_score: float (0.0-1.0) - higher is more balanced
                - violations: List[str] - muscle groups exceeding threshold
                - warnings: List[str] - recommendations
        """
        if not movements:
            return {
                "muscle_percentages": {},
                "total_duration": 0,
                "balance_score": 0.0,
                "violations": ["Empty sequence"],
                "warnings": []
            }

        # Track duration per muscle category
        category_durations = defaultdict(int)
        total_duration = 0

        for movement in movements:
            duration = movement.get('duration_seconds', 60)  # Default 60 seconds
            total_duration += duration

            # Get primary muscles
            primary_muscles = movement.get('primary_muscles', [])
            if isinstance(primary_muscles, str):
                primary_muscles = [primary_muscles]

            # Normalize and categorize muscles
            for muscle in primary_muscles:
                muscle_lower = muscle.lower().strip()
                category = self._categorize_muscle(muscle_lower)
                if category:
                    category_durations[category] += duration

        # Calculate percentages
        muscle_percentages = {}
        for category, duration in category_durations.items():
            percentage = (duration / total_duration * 100) if total_duration > 0 else 0
            muscle_percentages[category] = round(percentage, 2)

        # Check for violations
        violations = []
        warnings = []

        for category, percentage in muscle_percentages.items():
            if percentage > self.MAX_SINGLE_GROUP_PERCENTAGE:
                violations.append(
                    f"{category.replace('_', ' ').title()} overworked: {percentage:.1f}% "
                    f"(max {self.MAX_SINGLE_GROUP_PERCENTAGE}%)"
                )

        # Check for underutilized muscle groups
        covered_categories = set(muscle_percentages.keys())
        important_categories = {'core', 'legs', 'back'}
        missing_categories = important_categories - covered_categories

        if missing_categories:
            warnings.append(
                f"Consider adding movements for: {', '.join(sorted(missing_categories))}"
            )

        # Check for minimal engagement (less than 5%)
        for category, percentage in muscle_percentages.items():
            if percentage < 5.0:
                warnings.append(
                    f"{category.replace('_', ' ').title()} minimally engaged ({percentage:.1f}%)"
                )

        # Calculate balance score
        balance_score = self._calculate_balance_score(muscle_percentages)

        return {
            "muscle_percentages": muscle_percentages,
            "total_duration": total_duration,
            "balance_score": round(balance_score, 3),
            "violations": violations,
            "warnings": warnings
        }

    def _categorize_muscle(self, muscle: str) -> str:
        """
        Categorize a muscle into one of the standard categories

        Args:
            muscle: Muscle name (lowercase)

        Returns:
            Category name or empty string if not recognized
        """
        for category, muscle_list in self.MUSCLE_CATEGORIES.items():
            if any(m in muscle for m in muscle_list):
                return category

        # Default mapping for common terms
        if 'core' in muscle or 'ab' in muscle:
            return 'core'
        elif 'leg' in muscle:
            return 'legs'
        elif 'arm' in muscle:
            return 'arms'
        elif 'back' in muscle:
            return 'back'
        elif 'shoulder' in muscle:
            return 'shoulders'
        elif 'glute' in muscle:
            return 'glutes'
        elif 'hip' in muscle:
            return 'hip_flexors'

        # Unknown muscle group - log and return empty
        logger.debug(f"Unknown muscle group: {muscle}")
        return ""

    def _calculate_balance_score(self, muscle_percentages: Dict[str, float]) -> float:
        """
        Calculate overall balance score

        Perfect balance would be equal distribution across all engaged muscle groups
        Score is based on:
        - Number of muscle groups engaged (diversity)
        - Evenness of distribution (no single group dominates)
        - Penalty for violations

        Args:
            muscle_percentages: Dict of category -> percentage

        Returns:
            Balance score between 0.0 and 1.0
        """
        if not muscle_percentages:
            return 0.0

        # Factor 1: Diversity (more muscle groups is better)
        num_groups = len(muscle_percentages)
        max_groups = 8  # All possible categories
        diversity_score = min(1.0, num_groups / max_groups)

        # Factor 2: Distribution evenness
        # Calculate standard deviation of percentages
        percentages = list(muscle_percentages.values())
        mean = sum(percentages) / len(percentages)
        variance = sum((p - mean) ** 2 for p in percentages) / len(percentages)
        std_dev = variance ** 0.5

        # Normalize std_dev (lower is better, more even distribution)
        # Perfect balance would have std_dev = 0
        # Max realistic std_dev is around 30
        evenness_score = max(0.0, 1.0 - (std_dev / 30.0))

        # Factor 3: Violation penalty
        violation_penalty = 0.0
        for percentage in percentages:
            if percentage > self.MAX_SINGLE_GROUP_PERCENTAGE:
                # Penalty increases with severity
                excess = percentage - self.MAX_SINGLE_GROUP_PERCENTAGE
                violation_penalty += (excess / 100.0)

        violation_score = max(0.0, 1.0 - violation_penalty)

        # Weighted average
        balance_score = (
            0.3 * diversity_score +
            0.4 * evenness_score +
            0.3 * violation_score
        )

        return max(0.0, min(1.0, balance_score))

    def get_recommendations(self, muscle_percentages: Dict[str, float]) -> List[str]:
        """
        Generate recommendations for improving muscle balance

        Args:
            muscle_percentages: Dict of category -> percentage

        Returns:
            List of recommendation strings
        """
        recommendations = []

        # Check for overworked groups
        for category, percentage in muscle_percentages.items():
            if percentage > self.MAX_SINGLE_GROUP_PERCENTAGE:
                recommendations.append(
                    f"Reduce {category.replace('_', ' ')} work (currently {percentage:.1f}%, "
                    f"max {self.MAX_SINGLE_GROUP_PERCENTAGE}%)"
                )

        # Check for underrepresented groups
        important_groups = {'core', 'legs', 'back'}
        for group in important_groups:
            if group not in muscle_percentages or muscle_percentages[group] < 10.0:
                current = muscle_percentages.get(group, 0)
                recommendations.append(
                    f"Increase {group} engagement (currently {current:.1f}%, "
                    f"recommended 15-25%)"
                )

        # Check for very unbalanced distribution
        if muscle_percentages:
            max_percentage = max(muscle_percentages.values())
            min_percentage = min(muscle_percentages.values())
            if max_percentage - min_percentage > 50:
                recommendations.append(
                    "Large imbalance detected. Consider redistributing movements "
                    "for more even muscle engagement"
                )

        return recommendations


# Global instance
muscle_balance_calculator = MuscleBalanceCalculator()
