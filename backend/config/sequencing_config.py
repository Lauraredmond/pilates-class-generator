"""
Sequencing Configuration
Tunable constants for Pilates class generation algorithm

INSTRUCTOR FEEDBACK - MARCH 2026:
These constants can be adjusted without touching core algorithm logic.
"""

# ==============================================================================
# POSITIONAL CONTINUITY (Improvement 2)
# ==============================================================================

# Soft preference bonus for keeping same body position between movements
# Higher value = stronger preference for grouping by position
# CRITICAL: Must remain smaller than muscle-overuse penalty to preserve safety
# Valid range: 0.05 - 0.30 (current: 0.15)
POSITION_CONTINUITY_BONUS = 0.15

# Maximum position changes allowed as percentage of total movements
# Default: 40% of movements can trigger position changes
# Example: 10-movement class allows 4 position changes
# Valid range: 0.2 - 0.6 (current: 0.4)
DEFAULT_POSITION_CHANGE_BUDGET_PCT = 0.4


# ==============================================================================
# INTENSITY GATING (Improvement 1)
# ==============================================================================

# Class timeline phase boundaries (percentage of class duration)
# These determine when different intensity levels are permitted

# Warm-up phase: 0-20% of class time
# Only movements with class_phase='warm_up' (intensity 1-3)
WARM_UP_PHASE_END = 0.20

# Building phase: 20-65% of class time
# Movements with class_phase in ('warm_up', 'early_middle') (intensity 1-6)
BUILDING_PHASE_END = 0.65

# Peak phase: 65-85% of class time
# All movements allowed including class_phase='peak' (intensity 7-10)
PEAK_PHASE_END = 0.85

# Cool-down phase: 85-100% of class time
# Only movements with class_phase in ('warm_up', 'cool_down') (intensity 1-4)
# (automatically from PEAK_PHASE_END to 1.0)


# ==============================================================================
# NOTES FOR TUNING
# ==============================================================================

# POSITION_CONTINUITY_BONUS:
# - Too low (< 0.10): Minimal grouping effect, positions still fragmented
# - Balanced (0.10 - 0.20): Soft preference without compromising muscle rules
# - Too high (> 0.30): May override muscle-balance considerations (dangerous)
#
# Current value 0.15 provides ~30-40% reduction in position changes
# while maintaining full muscle-safety compliance

# DEFAULT_POSITION_CHANGE_BUDGET_PCT:
# - Too low (< 0.3): Overly rigid, may block valid sequences
# - Balanced (0.3 - 0.5): Natural flow with flexibility
# - Too high (> 0.6): Defeats the purpose of position grouping
#
# Current value 0.4 allows enough variety while encouraging grouping

# PHASE BOUNDARIES:
# - Adjusting WARM_UP_PHASE_END controls how quickly intensity ramps
# - Reducing BUILDING_PHASE_END brings peak movements earlier
# - Increasing PEAK_PHASE_END extends high-intensity window
#
# Current boundaries follow classical Pilates progression and instructor feedback
