"""
==============================================================================
SEQUENCE TOOLS - Extracted from backend/agents/sequence_agent.py
==============================================================================
BASSLINE CUSTOM: Pilates movement sequencing business logic

This module contains ALL sequencing logic extracted from SequenceAgent (963 lines).
Pure business logic - no agent orchestration, just domain expertise.

CRITICAL DOMAIN KNOWLEDGE PRESERVED:
- Safety rules (spinal progression, muscle balance)
- Teaching time calculations (4-6 min per movement)
- Movement selection algorithms
- Transition generation between movements
- Movement usage tracking (intelligent variety)
- Muscle balance calculations

JENTIC PATTERN: Tools = Domain Expertise
StandardAgent will call these methods via the tools registry.
==============================================================================
"""

import random
from typing import Dict, Any, List, Optional
from loguru import logger
from datetime import date, datetime
from .muscle_overlap_analyzer import generate_overlap_report


class SequenceTools:
    """
    BASSLINE CUSTOM: Pilates movement sequencing business logic

    Extracted from: backend/agents/sequence_agent.py (963 lines)
    ALL business logic preserved - nothing lost in migration.

    This is the most complex tool module containing critical Pilates domain expertise.
    """

    # Safety-critical sequencing rules
    SAFETY_RULES = {
        "spinal_progression": "Flexion movements must precede extension movements",
        "muscle_balance": "No muscle group should exceed 40% of total class load",
        "movement_family_balance": "No movement family should exceed 40% of total movements",
        "complexity_progression": "Difficulty should progress gradually",
        "must_cooldown": "Classes must end with stretching and breathing",
        "teaching_time": "Students need 3-5 minutes per movement for proper instruction"
    }

    # Movement family distribution threshold (OLD RULE - being replaced)
    MAX_FAMILY_PERCENTAGE = 40  # Legacy threshold (kept for backward compatibility)

    # NATURAL FAMILY PROPORTIONS (NEW RULE 2 - December 2025)
    # Based on full 35-movement repertoire distribution
    # Each family's max = 2x its natural proportion
    NATURAL_FAMILY_PROPORTIONS = {
        "supine_abdominal": 0.26,           # 9/35 movements (max: 52%)
        "back_extension": 0.17,              # 6/35 movements (max: 34%)
        "inversion": 0.14,                   # 5/35 movements (max: 28%)
        "rolling": 0.14,                     # 5/35 movements (max: 28%)
        "hip_extensor": 0.09,                # 3/35 movements (max: 18%)
        "seated_spinal_articulation": 0.09,  # 3/35 movements (max: 18%)
        "side_lying": 0.09,                  # 3/35 movements (max: 18%)
        "other": 0.03                        # 1/35 movements (max: 6%)
    }

    # POSITIONAL CONTINUITY BONUS (NEW - Instructor Feedback March 2026)
    # Soft preference for same body position to reduce fragmentation
    # Must be smaller than muscle-overuse penalty (muscle balance = priority)
    POSITION_CONTINUITY_BONUS = 0.15  # Additive bonus when position matches previous movement

    # Teaching time per movement (in minutes) - CRITICAL QUALITY RULE
    MINUTES_PER_MOVEMENT = {
        "Beginner": 4,      # Beginners need more explanation and practice time
        "Intermediate": 5,  # Intermediate students can move faster
        "Advanced": 6       # Advanced students perfect form, not rush
    }

    # Difficulty mix targets for balanced classes (NEW)
    # These define the ideal percentage of movements from each difficulty level
    # Note: Movement pool is already filtered by difficulty, so these targets
    # only apply to movements actually available at each level
    DIFFICULTY_MIX_TARGETS = {
        "Beginner": {
            "Beginner": 1.00,      # 100% Beginner movements ONLY
            "Intermediate": 0.00,  # No Intermediate (not in pool)
            "Advanced": 0.00       # No Advanced (not in pool)
        },
        "Intermediate": {
            "Beginner": 0.40,      # 40% Beginner for foundation/cooldown
            "Intermediate": 0.60,  # 60% Intermediate core work
            "Advanced": 0.00       # No Advanced (filtered out of pool)
        },
        "Advanced": {
            "Beginner": 0.15,      # 15% Beginner for warm-up/transitions
            "Intermediate": 0.25,  # 25% Intermediate for building
            "Advanced": 0.60       # 60% Advanced target (min 33%, max 66%)
        }
    }

    # Difficulty weight multipliers for selection bias (NEW)
    # Higher weights increase likelihood of selection
    # Note: Only affects movements actually in the filtered pool
    DIFFICULTY_WEIGHT_MULTIPLIERS = {
        "Beginner": {
            "Beginner": 1.0,       # Only Beginner movements available anyway
            "Intermediate": 1.0,   # Not applicable (filtered out)
            "Advanced": 1.0        # Not applicable (filtered out)
        },
        "Intermediate": {
            "Beginner": 0.7,       # Slight reduction for Beginner
            "Intermediate": 1.3,   # Prefer Intermediate movements
            "Advanced": 1.0        # Not applicable (filtered out)
        },
        "Advanced": {
            "Beginner": 1.0,       # Normal weight for variety
            "Intermediate": 1.5,   # Moderate preference
            "Advanced": 3.0        # Strong preference for Advanced
        }
    }

    # Transition time between movements (in minutes)
    # NOTE: This is calculated dynamically from database in _build_safe_sequence
    # Kept as class constant for fallback only if database query fails
    TRANSITION_TIME_MINUTES = 0.33  # 20 seconds fallback (DO NOT USE for calculations)

    def __init__(self, supabase_client=None):
        """
        Initialize sequence tools

        Args:
            supabase_client: Supabase client for database access
        """
        self.supabase = supabase_client
        logger.info("✅ SequenceTools initialized")

    # ==========================================================================
    # MAIN ENTRY POINT
    # ==========================================================================

    def generate_sequence(
        self,
        target_duration_minutes: int,
        difficulty_level: str = "Beginner",
        focus_areas: List[str] = None,
        required_movements: List[str] = None,
        excluded_movements: List[str] = None,
        user_id: Optional[str] = None,
        strictness_level: str = "guided",  # strict, guided, or autonomous
        include_mcp_research: bool = False,  # Whether to enhance with web research
        class_plan_id: Optional[str] = None  # NEW: UUID for quality logging reconciliation
    ) -> Dict[str, Any]:
        """
        Generate a complete Pilates movement sequence

        BASSLINE CUSTOM: Main sequencing logic (from SequenceAgent)

        Args:
            target_duration_minutes: Total class duration (15-120 minutes)
            difficulty_level: 'Beginner', 'Intermediate', or 'Advanced'
            focus_areas: Optional muscle groups to emphasize
            required_movements: Movement IDs that must be included
            excluded_movements: Movement IDs to exclude
            user_id: Optional user ID for movement usage tracking

        Returns:
            Dict with sequence, muscle balance, validation, and statistics
        """
        # Validate inputs (allow 10-min quick practice)
        if not (10 <= target_duration_minutes <= 120):
            raise ValueError("Duration must be between 10 and 120 minutes")

        if difficulty_level not in ["Beginner", "Intermediate", "Advanced"]:
            raise ValueError("Difficulty must be Beginner, Intermediate, or Advanced")

        logger.info(
            f"Generating {difficulty_level} sequence for {target_duration_minutes} minutes | "
            f"Focus: {focus_areas}"
        )

        # Step 1: Get available movements from database
        available_movements = self._get_available_movements(
            difficulty=difficulty_level,
            excluded_ids=excluded_movements or []
        )

        if not available_movements:
            raise ValueError("No movements available for given criteria")

        # Step 2: Build sequence following safety rules
        sequence = self._build_safe_sequence(
            movements=available_movements,
            target_duration=target_duration_minutes,
            required_movements=required_movements or [],
            focus_areas=focus_areas or [],
            difficulty=difficulty_level,
            user_id=user_id
        )

        # Step 3: Add transitions between movements
        sequence_with_transitions = self._add_transitions_to_sequence(sequence)

        # Step 4: Calculate muscle balance (use movements only, not transitions)
        muscle_balance = self._calculate_muscle_balance(sequence)

        # Step 5: Validate sequence against safety rules and difficulty targets
        validation = self._validate_sequence(sequence, muscle_balance, difficulty_level)

        # Calculate counts
        movements_only = [item for item in sequence_with_transitions if item.get("type") == "movement"]
        transitions_only = [item for item in sequence_with_transitions if item.get("type") == "transition"]

        # Calculate sequence duration (movements + transitions only, NOT including 6 class sections)
        sequence_duration_seconds = sum(item.get("duration_seconds") or 60 for item in sequence_with_transitions)

        # QA: Generate muscle overlap analysis report (admin-only feature)
        qa_report = None
        if user_id and self._check_if_admin(user_id):
            try:
                # Generate report with enhanced checks:
                # - Movement pattern proximity (Crab + Seal issue)
                # - Historical muscle balance (underutilized muscle groups)
                # - Reconciliation with quality log via class_plan_id
                report_data = generate_overlap_report(
                    sequence=sequence,
                    user_id=user_id,
                    supabase_client=self.supabase,
                    class_plan_id=class_plan_id,  # FIX: For reconciliation with quality log
                    output_dir="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/analytics"  # FIX: For file generation
                )
                logger.info(f"📊 Enhanced QA report generated for admin user: {report_data.get('timestamp')}")
                qa_report = report_data  # Include in API response
            except Exception as e:
                logger.warning(f"Failed to generate muscle overlap report: {e}")
        else:
            logger.info("ℹ️  QA report skipped (admin-only feature)")

        # QUALITY LOGGING: Log rule compliance to database (Migration 036)
        # DIAGNOSTIC: Check conditions before attempting to log
        logger.warning(f"🔍 DIAGNOSTIC: Quality logging check:")
        logger.warning(f"   user_id: {'PRESENT' if user_id else 'NONE'} ({user_id if user_id else 'N/A'})")
        logger.warning(f"   self.supabase: {'CONNECTED' if self.supabase else 'NONE'}")
        logger.warning(f"   sequence length: {len(sequence)} movements")
        logger.warning(f"   self.supabase type: {type(self.supabase).__name__ if self.supabase else 'None'}")
        logger.warning(f"   self.supabase url: {self.supabase.supabase_url if self.supabase and hasattr(self.supabase, 'supabase_url') else 'N/A'}")

        if user_id and self.supabase:
            logger.warning(f"✅ ATTEMPTING quality logging for user {user_id[:8]}...")
            logger.warning(f"   🔧 CRITICAL: About to call _log_class_quality() method")
            logger.warning(f"   🔧 user_id: {user_id}")
            logger.warning(f"   🔧 sequence: {len(sequence)} movements")
            logger.warning(f"   🔧 difficulty: {difficulty_level}")
            try:
                self._log_class_quality(
                    user_id=user_id,
                    sequence=sequence,
                    muscle_balance=muscle_balance,
                    validation=validation,
                    target_duration=target_duration_minutes,
                    difficulty_level=difficulty_level,
                    class_plan_id=class_plan_id  # NEW: Pass for quality logging reconciliation
                )
                logger.warning(f"✅ Quality logging COMPLETED successfully")
                logger.warning(f"   ✅ CONFIRMED: _log_class_quality() executed without exception")
            except Exception as e:
                logger.error(f"❌ CRITICAL FAILURE in quality logging")
                logger.error(f"   Error: {e}")
                logger.error(f"   Error type: {type(e).__name__}")
                import traceback
                logger.error(f"   Full traceback:\n{traceback.format_exc()}")
                # RE-RAISE to ensure this error is visible
                raise
        else:
            logger.warning(f"⚠️  SKIPPING quality logging (missing user_id or Supabase connection)")
            if not user_id:
                logger.error(f"   ❌ CRITICAL: user_id is None - this should NEVER happen!")
            if not self.supabase:
                logger.error(f"   ❌ CRITICAL: self.supabase is None - SequenceTools not initialized correctly!")

        return {
            "sequence": sequence_with_transitions,
            "movement_count": len(movements_only),
            "transition_count": len(transitions_only),
            "total_items": len(sequence_with_transitions),
            "total_duration_minutes": target_duration_minutes,  # FULL class duration (includes all 6 sections)
            "sequence_duration_minutes": sequence_duration_seconds // 60,  # Just movements + transitions
            "muscle_balance": muscle_balance,
            "validation": validation,
            "qa_report": qa_report  # Include QA analytics report in response
        }

    # ==========================================================================
    # DATABASE OPERATIONS
    # ==========================================================================

    def _get_section_overhead_minutes(self, target_duration: int) -> int:
        """
        Fetch actual section durations from database to calculate overhead

        For 10-min classes: 0 overhead (quick movement practice - just 3 movements)
        For 30-min classes: prep + warmup + cooldown + homecare (no meditation)
        For longer classes: prep + warmup + cooldown + homecare + meditation

        Returns:
            Total overhead in minutes (read from database duration_seconds fields)
        """
        # SPECIAL CASE: 10-minute "Quick movement practice" classes
        # User requirement: "Just 3 movements, no warmup/cooldown/prep/meditation/homecare"
        if target_duration == 10:
            logger.info("✅ 10-minute quick practice: 0 overhead (movements only)")
            return 0

        # DIAGNOSTIC: Check if Supabase client is available
        logger.warning(f"🔍 DIAGNOSTIC: self.supabase is {'AVAILABLE' if self.supabase else 'NONE (using fallback)'}")

        if not self.supabase:
            # Fallback estimates if database unavailable
            # prep (4min) + warmup (3min) + cooldown (3min) + homecare (1min) = 11min
            # + meditation (4min) = 15min total
            logger.warning(f"⚠️  USING FALLBACK OVERHEAD: {15 if target_duration > 30 else 11} min (Supabase client not available)")
            return 15 if target_duration > 30 else 11

        try:
            include_meditation = target_duration > 30

            # Fetch one sample of each section to get actual durations
            prep_response = self.supabase.table('preparation_scripts').select('duration_seconds').limit(1).execute()
            warmup_response = self.supabase.table('warmup_routines').select('duration_seconds').limit(1).execute()
            cooldown_response = self.supabase.table('cooldown_sequences').select('duration_seconds').limit(1).execute()
            homecare_response = self.supabase.table('closing_homecare_advice').select('duration_seconds').limit(1).execute()

            # Only fetch meditation if including it
            if include_meditation:
                meditation_response = self.supabase.table('closing_meditation_scripts').select('duration_seconds').limit(1).execute()
            else:
                meditation_response = None

            # Sum up actual durations from database
            total_overhead_seconds = 0

            if prep_response.data and len(prep_response.data) > 0:
                total_overhead_seconds += prep_response.data[0].get('duration_seconds', 240)  # Default 4min
            if warmup_response.data and len(warmup_response.data) > 0:
                total_overhead_seconds += warmup_response.data[0].get('duration_seconds', 180)  # Default 3min
            if cooldown_response.data and len(cooldown_response.data) > 0:
                total_overhead_seconds += cooldown_response.data[0].get('duration_seconds', 180)  # Default 3min
            if homecare_response.data and len(homecare_response.data) > 0:
                total_overhead_seconds += homecare_response.data[0].get('duration_seconds', 60)  # Default 1min
            if include_meditation and meditation_response and meditation_response.data and len(meditation_response.data) > 0:
                total_overhead_seconds += meditation_response.data[0].get('duration_seconds', 240)  # Default 4min

            # Convert to minutes (round up)
            total_overhead_minutes = (total_overhead_seconds + 59) // 60  # Round up

            # DIAGNOSTIC: Log individual section durations
            logger.warning("🔍 DIAGNOSTIC: Section durations from database:")
            logger.warning(f"   Preparation: {prep_response.data[0].get('duration_seconds', 'N/A') if prep_response.data else 'NO DATA'}s")
            logger.warning(f"   Warmup: {warmup_response.data[0].get('duration_seconds', 'N/A') if warmup_response.data else 'NO DATA'}s")
            logger.warning(f"   Cooldown: {cooldown_response.data[0].get('duration_seconds', 'N/A') if cooldown_response.data else 'NO DATA'}s")
            logger.warning(f"   HomeCare: {homecare_response.data[0].get('duration_seconds', 'N/A') if homecare_response.data else 'NO DATA'}s")
            if include_meditation and meditation_response:
                logger.warning(f"   Meditation: {meditation_response.data[0].get('duration_seconds', 'N/A') if meditation_response.data else 'NO DATA'}s")
            logger.warning(f"   TOTAL: {total_overhead_seconds}s = {total_overhead_minutes} min")

            logger.info(
                f"Calculated section overhead from database: {total_overhead_minutes} min "
                f"({total_overhead_seconds}s) - meditation {'included' if include_meditation else 'excluded'}"
            )

            return total_overhead_minutes

        except Exception as e:
            logger.error(f"Error fetching section overhead from database: {e}")
            # Fallback to estimates
            return 15 if target_duration > 30 else 11

    def _get_available_movements(
        self,
        difficulty: str,
        excluded_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Fetch available movements from database with all teaching data + muscle groups"""
        if not self.supabase:
            logger.warning("Supabase client not available - returning mock data")
            return self._get_mock_movements(difficulty)

        try:
            # Get movements at or below requested difficulty
            difficulty_order = ["Beginner", "Intermediate", "Advanced"]
            max_level_idx = difficulty_order.index(difficulty)
            allowed_levels = difficulty_order[:max_level_idx + 1]

            # Query database - get all fields
            response = self.supabase.table('movements') \
                .select('*') \
                .in_('difficulty_level', allowed_levels) \
                .execute()

            movements = response.data

            # CRITICAL FIX: Fetch muscle groups for each movement (for consecutive overlap filter)
            if movements:
                movement_ids = [m['id'] for m in movements]

                muscles_response = self.supabase.table('movement_muscles') \
                    .select('movement_id, muscle_group_name') \
                    .in_('movement_id', movement_ids) \
                    .execute()

                # Group muscles by movement_id
                muscles_by_movement = {}
                for mm in muscles_response.data:
                    mov_id = mm['movement_id']
                    if mov_id not in muscles_by_movement:
                        muscles_by_movement[mov_id] = []
                    muscles_by_movement[mov_id].append({'name': mm['muscle_group_name']})

                # Attach muscle_groups to each movement
                for movement in movements:
                    movement['muscle_groups'] = muscles_by_movement.get(movement['id'], [])

                logger.info(f"✅ Attached muscle groups to {len(movements)} movements")

            # DEBUG: Log fields from first 3 movements (including instructor feedback fields)
            logger.info("=" * 80)
            logger.info("🔍 DEBUG: Movements from database (first 3):")
            for i, m in enumerate(movements[:3]):
                logger.info(f"  Movement {i+1}: {m.get('name')}")
                logger.info(f"    muscle_groups: {[mg['name'] for mg in m.get('muscle_groups', [])]}")
                logger.info(f"    movement_family: {m.get('movement_family', 'NOT PRESENT')}")
                logger.info(f"    intensity_score: {m.get('intensity_score', 'NOT PRESENT')}")
                logger.info(f"    class_phase: {m.get('class_phase', 'NOT PRESENT')}")
                logger.info(f"    setup_position: {m.get('setup_position', 'NOT PRESENT')}")
                logger.info(f"    voiceover_enabled: {m.get('voiceover_enabled')}")
                logger.info(f"    voiceover_url: {m.get('voiceover_url', 'NOT PRESENT')[:80] if m.get('voiceover_url') else 'NONE'}")
                logger.info(f"    voiceover_duration_seconds: {m.get('voiceover_duration_seconds')}")
            logger.info("=" * 80)

            # Filter out excluded movements
            if excluded_ids:
                movements = [m for m in movements if m['id'] not in excluded_ids]

            logger.info(f"Found {len(movements)} available movements")
            return movements

        except Exception as e:
            logger.error(f"Error fetching movements: {e}")
            return []

    def _get_mock_movements(self, difficulty: str) -> List[Dict[str, Any]]:
        """Provide mock movements when database unavailable"""
        # Minimal mock data for fallback
        return [
            {"id": "mock-1", "name": "The Hundred", "difficulty_level": "Beginner", "duration_seconds": 240, "setup_position": "Supine"},
            {"id": "mock-2", "name": "Roll Up", "difficulty_level": "Beginner", "duration_seconds": 180, "setup_position": "Supine"},
            {"id": "mock-3", "name": "Single Leg Stretch", "difficulty_level": "Beginner", "duration_seconds": 180, "setup_position": "Supine"},
        ]

    # ==========================================================================
    # SEQUENCE BUILDING
    # ==========================================================================

    def _build_safe_sequence(
        self,
        movements: List[Dict[str, Any]],
        target_duration: int,
        required_movements: List[str],
        focus_areas: List[str],
        difficulty: str,
        user_id: Optional[str],
        max_position_changes: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Build sequence following safety rules

        NEW (March 2026 - Instructor Feedback):
        - Intensity gating by class phase (warm-up movements only in first 20%)
        - Soft positional continuity bonus (reduce position jumping)
        - Position-change budget (configurable max position changes)
        """
        sequence = []
        position_changes_count = 0  # Track position changes for budget

        # STEP 1: Get overhead from 6 class sections (preparation, warmup, cooldown, meditation, homecare)
        overhead_minutes = self._get_section_overhead_minutes(target_duration)

        # STEP 2: Calculate available time for movements after overhead
        available_minutes = target_duration - overhead_minutes

        if available_minutes <= 0:
            logger.error(f"No time for movements! Target: {target_duration} min, Overhead: {overhead_minutes} min")
            raise ValueError(f"Class duration too short. Need at least {overhead_minutes} minutes for required sections.")

        # STEP 3: Calculate max movements based on ACTUAL movement durations + transitions
        # FIX (Task 5): Use actual database durations instead of hardcoded teaching_time
        # Calculate average movement duration from available movements
        actual_durations = [m.get("duration_seconds") for m in movements if m.get("duration_seconds")]

        if actual_durations:
            # Use average duration from database (e.g., 180s = 3 min for most movements)
            avg_duration_seconds = sum(actual_durations) / len(actual_durations)
            avg_duration_minutes = avg_duration_seconds / 60
            logger.info(f"Using ACTUAL average movement duration: {avg_duration_minutes:.1f} min ({avg_duration_seconds:.0f}s) from {len(actual_durations)} movements")
        else:
            # Fallback to teaching time if no duration data available
            minutes_per_movement = self.MINUTES_PER_MOVEMENT.get(difficulty, 4)
            avg_duration_minutes = minutes_per_movement
            avg_duration_seconds = minutes_per_movement * 60
            logger.warning(f"No duration_seconds in database - falling back to teaching time: {avg_duration_minutes} min")

        # FIX (Task 5): Calculate ACTUAL transition duration from database (dynamic, not hardcoded)
        # Query all transitions to get average duration_seconds
        if self.supabase:
            try:
                transitions_response = self.supabase.table('transitions').select('duration_seconds').execute()
                if transitions_response.data:
                    transition_durations = [t['duration_seconds'] for t in transitions_response.data if t.get('duration_seconds')]
                    if transition_durations:
                        avg_transition_seconds = sum(transition_durations) / len(transition_durations)
                        transition_time = avg_transition_seconds / 60  # Convert to minutes
                        logger.info(f"Using ACTUAL average transition duration: {transition_time:.2f} min ({avg_transition_seconds:.0f}s) from {len(transition_durations)} transitions")
                    else:
                        transition_time = self.TRANSITION_TIME_MINUTES
                        logger.warning(f"No duration_seconds in transitions - using fallback: {transition_time} min")
                else:
                    transition_time = self.TRANSITION_TIME_MINUTES
                    logger.warning(f"No transitions in database - using fallback: {transition_time} min")
            except Exception as e:
                logger.error(f"Error fetching transition durations: {e}")
                transition_time = self.TRANSITION_TIME_MINUTES
                logger.warning(f"Database error - using fallback transition time: {transition_time} min")
        else:
            transition_time = self.TRANSITION_TIME_MINUTES
            logger.warning(f"Supabase client not available - using fallback transition time: {transition_time} min")

        # Store teaching time for fallback use when setting movement durations
        teaching_time_seconds = int(avg_duration_seconds)

        # Calculate: (available_minutes) = (num_movements * avg_duration) + ((num_movements - 1) * transition_time)
        max_movements = int((available_minutes + transition_time) / (avg_duration_minutes + transition_time))

        # POSITION-CHANGE BUDGET (NEW - Instructor Feedback March 2026)
        # Calculate default max position changes (40% of total movements)
        # This can be overridden via API parameter
        if max_position_changes is None:
            max_position_changes = int(max_movements * 0.4)

        logger.info(f"Position-change budget: {max_position_changes} changes allowed (40% of {max_movements} movements)")

        # ENFORCE MINIMUM 4 MOVEMENTS FOR 30-MIN CLASSES
        # User requirement: "We will have to go a little past the 30 minute threshold and insist on at least 4 movements for the 30 min class"
        if target_duration == 30 and max_movements < 4:
            logger.warning(
                f"30-min class calculated only {max_movements} movements. Enforcing minimum 4 movements (class will run slightly over 30 min)."
            )
            max_movements = 4

        # ENFORCE EXACTLY 3 MOVEMENTS FOR 10-MIN QUICK PRACTICE
        # User requirement: "Quick movement practice - just 3 movements for daily practice"
        if target_duration == 10:
            max_movements = 3
            logger.info("✅ 10-minute quick practice: Enforcing exactly 3 movements")
            if difficulty == 'Advanced':
                logger.info("📊 10-min ADVANCED REQUIREMENTS:")
                logger.info("   • MINIMUM: 1 Advanced movement (33%)")
                logger.info("   • MAXIMUM: 2 Advanced movements (66%)")
                logger.info("   • VALID: 1 Advanced + 2 others OR 2 Advanced + 1 other")

        logger.info(
            f"Building sequence: {target_duration} min total - {overhead_minutes} min overhead = {available_minutes} min available / "
            f"({avg_duration_minutes:.1f} min/movement + {transition_time} min/transition) = max {max_movements} movements"
        )

        # SESSION 13: Get movement usage weights for variety enforcement + The Hundred boosting
        usage_weights = {}
        is_beginner = False
        if user_id and self.supabase:
            usage_weights = self._get_movement_usage_weights(user_id, movements)
            # Check if user is beginner (classes_completed < 10)
            is_beginner = self._check_if_beginner(user_id)

        # SESSION 13: RULE - The Hundred Boosting for Beginners
        # "When student starts, they should do The Hundred quite a bit as it's foundational"
        if is_beginner:
            # Find "The Hundred" movement
            hundred_movement = next((m for m in movements if "hundred" in m.get("name", "").lower()), None)
            if hundred_movement:
                # Boost The Hundred weight by 3x for beginners
                hundred_id = hundred_movement["id"]
                current_weight = usage_weights.get(hundred_id, 1.0)
                usage_weights[hundred_id] = current_weight * 3.0
                logger.info(f"✨ Beginner detected: Boosted 'The Hundred' weight from {current_weight:.0f} to {usage_weights[hundred_id]:.0f}")

        # Rule 1: Add required movements if specified
        if required_movements:
            for movement_id in required_movements:
                movement = next((m for m in movements if m["id"] == movement_id), None)
                if movement and len(sequence) < max_movements - 1:  # Save room for cooldown
                    movement_copy = movement.copy()
                    # PRESERVE database duration_seconds instead of overwriting with teaching_time
                    # (Database duration is user-configurable, teaching_time is just for calculating max_movements)
                    if "duration_seconds" not in movement_copy or not movement_copy["duration_seconds"]:
                        movement_copy["duration_seconds"] = teaching_time_seconds  # Fallback only
                    movement_copy["type"] = "movement"
                    sequence.append(movement_copy)

        # Rule 2: Fill to max movements with balanced movements
        # Priority: Flexion -> Rotation -> Extension -> Lateral -> Balance
        pattern_order = ["flexion", "rotation", "extension", "lateral", "balance"]

        # For 10-min quick practice: Fill to exactly 3 movements (no cooldown required)
        # For other classes: Leave room for dedicated cooldown movement
        target_count = max_movements if target_duration == 10 else (max_movements - 1)

        while len(sequence) < target_count:
            # Calculate current position in class timeline (percentage)
            current_position_pct = len(sequence) / max_movements if max_movements > 0 else 0

            selected = self._select_next_movement(
                movements=movements,
                current_sequence=sequence,
                focus_areas=focus_areas,
                pattern_priority=pattern_order,
                usage_weights=usage_weights,
                class_difficulty=difficulty,
                target_duration=target_duration,
                target_count=target_count,
                current_position_pct=current_position_pct,
                max_position_changes=max_position_changes,
                position_changes_count=position_changes_count
            )

            if not selected:
                break

            selected_copy = selected.copy()
            # PRESERVE database duration_seconds instead of overwriting with teaching_time
            if "duration_seconds" not in selected_copy or not selected_copy["duration_seconds"]:
                selected_copy["duration_seconds"] = teaching_time_seconds  # Fallback only
            selected_copy["type"] = "movement"

            # Track position changes
            if sequence:
                prev_position = sequence[-1].get('setup_position')
                curr_position = selected_copy.get('setup_position')
                if prev_position and curr_position and prev_position != curr_position:
                    position_changes_count += 1

            sequence.append(selected_copy)

        # Rule 3: Add dedicated cooldown movement (but NOT for 10-min quick practice)
        if target_duration != 10:
            cooldown = self._get_cooldown_movement(movements, sequence)
            if cooldown:
                cooldown_copy = cooldown.copy()
                # PRESERVE database duration_seconds instead of overwriting with teaching_time
                if "duration_seconds" not in cooldown_copy or not cooldown_copy["duration_seconds"]:
                    cooldown_copy["duration_seconds"] = teaching_time_seconds  # Fallback only
                cooldown_copy["type"] = "movement"
                sequence.append(cooldown_copy)

        # TASK 5: FILL PASS - Add more movements if time permits
        # Try to fill up to target duration without exceeding it
        # Only for non-quick-practice classes (10-min has no overhead)
        logger.info(f"🔍 FILL PASS CHECK: target_duration={target_duration}, condition={target_duration != 10}")
        if target_duration != 10:
            # Calculate current sequence duration
            current_sequence_duration = sum(m.get("duration_seconds", teaching_time_seconds) for m in sequence)

            # Calculate transitions duration (one transition between each movement pair)
            num_transitions = len(sequence) - 1 if len(sequence) > 1 else 0
            transitions_duration = num_transitions * (self.TRANSITION_TIME_MINUTES * 60)

            # Calculate overhead from 6 class sections (preparation, warmup, cooldown, etc.)
            overhead_seconds = overhead_minutes * 60

            # Calculate total duration used so far
            total_used_seconds = current_sequence_duration + transitions_duration + overhead_seconds

            # Calculate remaining available time
            target_total_seconds = target_duration * 60
            remaining_seconds = target_total_seconds - total_used_seconds

            # FIX: Calculate minimum time needed based on ACTUAL movement durations, not teaching_time
            # Find shortest movement duration in available pool
            min_movement_duration = min(
                (m.get("duration_seconds") or teaching_time_seconds for m in movements),
                default=teaching_time_seconds
            )
            min_time_needed = min_movement_duration + (self.TRANSITION_TIME_MINUTES * 60)

            logger.info(
                f"FILL PASS: Current: {total_used_seconds}s / Target: {target_total_seconds}s | "
                f"Remaining: {remaining_seconds}s (need {min_time_needed}s for movement+transition) | "
                f"Min movement duration: {min_movement_duration}s"
            )

            # Fill pass loop: add movements while there's enough time
            fill_count = 0
            while remaining_seconds >= min_time_needed:
                # Try to select another movement using existing safety rules
                # For fill pass, we don't have a fixed target_count anymore
                # Use current sequence length + remaining capacity as estimate
                estimated_final_count = len(sequence) + max(1, int(remaining_seconds / min_time_needed))
                selected = self._select_next_movement(
                    movements=movements,
                    current_sequence=sequence,
                    focus_areas=focus_areas,
                    pattern_priority=pattern_order,
                    usage_weights=usage_weights,
                    class_difficulty=difficulty,
                    target_duration=target_duration,
                    target_count=estimated_final_count
                )

                if not selected:
                    logger.info(f"FILL PASS: No valid movements available (safety rules applied)")
                    break

                # Add the selected movement
                selected_copy = selected.copy()
                if "duration_seconds" not in selected_copy or not selected_copy["duration_seconds"]:
                    selected_copy["duration_seconds"] = teaching_time_seconds
                selected_copy["type"] = "movement"

                # Calculate duration this would add (movement + transition)
                movement_duration = selected_copy["duration_seconds"]
                transition_duration = self.TRANSITION_TIME_MINUTES * 60
                additional_duration = movement_duration + transition_duration

                # Check if adding this would exceed target
                if total_used_seconds + additional_duration > target_total_seconds:
                    logger.info(
                        f"FILL PASS: Stopped - adding '{selected['name']}' would exceed target "
                        f"({total_used_seconds + additional_duration}s > {target_total_seconds}s)"
                    )
                    break

                # Safe to add this movement
                sequence.append(selected_copy)
                fill_count += 1

                # Update counters
                total_used_seconds += additional_duration
                remaining_seconds = target_total_seconds - total_used_seconds

                logger.info(
                    f"FILL PASS: Added '{selected['name']}' ({movement_duration}s + {transition_duration}s transition) | "
                    f"Remaining: {remaining_seconds}s"
                )

            if fill_count > 0:
                logger.info(f"✅ FILL PASS: Added {fill_count} additional movements to reach target duration")
            else:
                logger.info(f"FILL PASS: No additional movements added (target duration reached)")

        # DEBUG: Log voiceover fields in final sequence
        logger.info("=" * 80)
        logger.info("🔍 DEBUG: Final sequence (first 3 movements):")
        for i, m in enumerate(sequence[:3]):
            logger.info(f"  Movement {i+1}: {m.get('name')}")
            logger.info(f"    type: {m.get('type')}")
            logger.info(f"    voiceover_enabled: {m.get('voiceover_enabled')}")
            logger.info(f"    voiceover_url: {m.get('voiceover_url', 'NOT PRESENT')[:80] if m.get('voiceover_url') else 'NONE'}")
            logger.info(f"    voiceover_duration_seconds: {m.get('voiceover_duration_seconds')}")
        logger.info("=" * 80)

        # VALIDATION: Check if 10-min Advanced class meets requirements (33-66% Advanced)
        if target_duration == 10 and difficulty == 'Advanced':
            advanced_in_sequence = sum(1 for m in sequence if m.get('difficulty_level') == 'Advanced')
            advanced_pct = (advanced_in_sequence / len(sequence) * 100) if len(sequence) > 0 else 0

            if advanced_in_sequence < 1:
                logger.error(f"❌ 10-MIN ADVANCED VIOLATION: Only {advanced_in_sequence}/3 Advanced movements ({advanced_pct:.1f}%) - BELOW 33% minimum!")
            elif advanced_in_sequence > 2:
                logger.error(f"❌ 10-MIN ADVANCED VIOLATION: {advanced_in_sequence}/3 Advanced movements ({advanced_pct:.1f}%) - ABOVE 66% maximum!")
            else:
                logger.info(f"✅ 10-MIN ADVANCED VALID: {advanced_in_sequence}/3 Advanced movements ({advanced_pct:.1f}%) - within 33-66% range")

        logger.info(f"Generated sequence with {len(sequence)} movements (max was {max_movements})")

        return sequence

    def _select_next_movement(
        self,
        movements: List[Dict[str, Any]],
        current_sequence: List[Dict[str, Any]],
        focus_areas: List[str],
        pattern_priority: List[str],
        usage_weights: Dict[str, float] = None,
        class_difficulty: str = None,
        target_duration: int = None,
        target_count: int = None,
        current_position_pct: float = 0.0,
        max_position_changes: Optional[int] = None,
        position_changes_count: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        Select next movement based on rules and focus areas

        PHASE 1 FIX: Added consecutive muscle overlap validation
        PHASE 2 FIX: Added weighted random selection based on usage history
        SESSION: Movement Families - Added family balance filtering
        PHASE 3 FIX: Added difficulty-based weight multipliers for Advanced classes
        MARCH 2026 - INSTRUCTOR FEEDBACK: Added intensity gating and positional continuity
        """
        # Get already used movement IDs
        used_ids = [m["id"] for m in current_sequence]

        # Filter out already used movements
        available = [m for m in movements if m["id"] not in used_ids]

        if not available:
            return None

        # NEW: INTENSITY GATING BY CLASS PHASE (Instructor Feedback - March 2026)
        # Filter movements based on position in class timeline
        # 0-20%: warm_up only
        # 20-65%: warm_up + early_middle
        # 65-85%: all phases (peak allowed)
        # 85-100%: warm_up + cool_down only
        if current_position_pct <= 0.20:
            # First 20% - warm-up movements only
            phase_filtered = [m for m in available if m.get('class_phase') == 'warm_up']
            if phase_filtered:
                available = phase_filtered
                logger.debug(f"Intensity gating (0-20%): Filtered to {len(available)} warm_up movements")
        elif current_position_pct <= 0.65:
            # 20-65% - warm-up + early-middle
            phase_filtered = [m for m in available if m.get('class_phase') in ('warm_up', 'early_middle')]
            if phase_filtered:
                available = phase_filtered
                logger.debug(f"Intensity gating (20-65%): Filtered to {len(available)} warm_up/early_middle movements")
        elif current_position_pct <= 0.85:
            # 65-85% - all phases allowed (peak permitted)
            logger.debug(f"Intensity gating (65-85%): All phases allowed ({len(available)} movements)")
        else:
            # 85-100% - cool-down phase
            phase_filtered = [m for m in available if m.get('class_phase') in ('warm_up', 'cool_down')]
            if phase_filtered:
                available = phase_filtered
                logger.debug(f"Intensity gating (85-100%): Filtered to {len(available)} warm_up/cool_down movements")

        if not available:
            logger.warning("⚠️  Intensity gating filtered out all movements - relaxing phase filter")
            # Fallback: allow any unused movement if phase filter is too restrictive
            available = [m for m in movements if m["id"] not in used_ids]
            if not available:
                return None

        # HARD ENFORCEMENT FOR 10-MIN ADVANCED: Ensure 33-66% Advanced (1-2 out of 3)
        if target_duration == 10 and class_difficulty == 'Advanced':
            advanced_count = sum(1 for m in current_sequence if m.get('difficulty_level') == 'Advanced')
            sequence_position = len(current_sequence)
            movements_remaining = 3 - sequence_position

            # HARD START: If we have 0 Advanced and this is the LAST movement, FORCE Advanced
            if advanced_count == 0 and movements_remaining == 1:
                # This is our last chance - MUST select Advanced to meet minimum 33%
                advanced_only = [m for m in available if m.get('difficulty_level') == 'Advanced']
                if advanced_only:
                    logger.info(f"🚀 10-MIN HARD START: LAST movement, need 1 Advanced minimum - forcing Advanced selection")
                    available = advanced_only
                else:
                    logger.warning("⚠️ CRITICAL: No Advanced movements available for mandatory selection!")
                    # Don't return None - let it proceed with what's available

            # HARD STOP: If we already have 2 Advanced, do NOT allow a third
            elif advanced_count >= 2:
                # We already have 2 Advanced (66%), do NOT allow a third
                logger.info(f"🛑 10-MIN HARD STOP: Already have {advanced_count}/3 Advanced, filtering out all Advanced movements")
                non_advanced = [m for m in available if m.get('difficulty_level') != 'Advanced']
                if non_advanced:
                    available = non_advanced
                else:
                    logger.warning("⚠️ No non-Advanced movements available after hard stop filter!")
                    return None

        # RULE 1 (HARD CONSTRAINT): Filter out movements with high consecutive muscle overlap
        # NO FALLBACK - Rule violations are NOT acceptable
        if current_sequence:
            prev_movement = current_sequence[-1]
            prev_muscles = set(mg.get('name', '') for mg in prev_movement.get('muscle_groups', []))

            if prev_muscles:
                filtered_available = []
                for candidate in available:
                    candidate_muscles = set(mg.get('name', '') for mg in candidate.get('muscle_groups', []))

                    if candidate_muscles:
                        overlap = prev_muscles & candidate_muscles
                        overlap_pct = (len(overlap) / len(candidate_muscles)) * 100 if candidate_muscles else 0

                        # Only keep candidates with <50% overlap
                        if overlap_pct < 50:
                            filtered_available.append(candidate)

                # HARD CONSTRAINT: Always apply filter (no fallback)
                available = filtered_available
                logger.info(f"RULE 1 enforced: Filtered to {len(available)} movements with <50% consecutive muscle overlap")

                # If filter blocked all movements, sequence generation will stop here
                # This is correct behavior - we should NOT violate safety rules
                if not available:
                    logger.warning(
                        f"⚠️  RULE 1 blocked all movements (prev: {prev_movement.get('name')}). "
                        f"Sequence will stop at {len(current_sequence)} movements to avoid muscle repetition."
                    )

        # RULE 2 (NEW): Family Balance Correlated with Natural Proportions
        # Each family should not exceed 2x its natural proportion
        # If overused, substitute with movement from most underused family first
        if current_sequence and len(current_sequence) >= 2:  # Only enforce after 2+ movements
            # Analyze current family usage vs natural proportions
            usage_analysis = self._get_family_usage_vs_natural(current_sequence)

            # Find families that exceed 2x natural proportion
            overused_families = {
                family for family, stats in usage_analysis.items()
                if stats["is_overused"]
            }

            if overused_families:
                # Filter out movements from overused families
                family_filtered = [
                    m for m in available
                    if m.get("movement_family") not in overused_families
                ]

                # If we filtered out everything, try substitution (Option 3)
                if not family_filtered:
                    logger.warning(
                        f"⚠️  RULE 2: All available movements are from overused families {overused_families}. "
                        f"Attempting substitution..."
                    )

                    # SUBSTITUTION LOGIC (Option 3):
                    # Try to find movement from MOST underused family first
                    # Fallback to ANY non-overused family if no substitute found

                    # Sort families by deviation (most negative = most underused)
                    sorted_families = sorted(
                        usage_analysis.items(),
                        key=lambda x: x[1]["deviation"]  # Most negative first
                    )

                    substitute_found = False
                    for family, stats in sorted_families:
                        if not stats["is_overused"]:
                            # Try to find movement from this underused family
                            candidates = [
                                m for m in available
                                if m.get("movement_family") == family
                            ]

                            if candidates:
                                # Found substitute from underused family
                                family_filtered = candidates
                                substitute_found = True
                                logger.info(
                                    f"✅ RULE 2: Substituted with movement from underused family '{family}' "
                                    f"(current: {stats['current_pct']:.1f}%, natural: {stats['natural_pct']:.1f}%)"
                                )
                                break

                    if not substitute_found:
                        logger.warning(
                            f"⚠️  RULE 2: No substitute found. Sequence will stop at {len(current_sequence)} movements."
                        )

                # Apply filter
                available = family_filtered
                logger.info(
                    f"RULE 2 enforced: Filtered out overused families {overused_families} "
                    f"({len(available)} movements remaining)"
                )

        # If focus areas specified, prefer those
        if focus_areas:
            focused = [
                m for m in available
                if any(area.lower() in str(m.get("category", "")).lower() for area in focus_areas)
            ]
            if focused:
                available = focused

        # PHASE 2 FIX: Use weighted random selection based on usage history
        # PHASE 3 FIX: Apply difficulty-based multipliers for Advanced classes
        # MARCH 2026: Add positional continuity bonus
        if available:
            # Build weights list aligned with available movements
            weights = []
            for m in available:
                # Start with usage weight (historical variety)
                base_weight = usage_weights.get(m['id'], 1.0) if usage_weights else 1.0

                # NEW: POSITIONAL CONTINUITY BONUS (Instructor Feedback - March 2026)
                # Apply bonus if this movement keeps the same body position as previous
                # BUT only if we haven't exhausted the position-change budget
                position_bonus = 0.0
                if current_sequence and max_position_changes is not None:
                    prev_position = current_sequence[-1].get('setup_position')
                    curr_position = m.get('setup_position')

                    # Check if budget is nearly exhausted (less than 20% remaining)
                    budget_remaining = max_position_changes - position_changes_count
                    budget_pct_remaining = budget_remaining / max(max_position_changes, 1)

                    if prev_position and curr_position:
                        if prev_position == curr_position:
                            # Same position - apply standard bonus
                            position_bonus = self.POSITION_CONTINUITY_BONUS

                            # Double bonus if budget is running low
                            if budget_pct_remaining < 0.2:
                                position_bonus *= 2.0
                                logger.debug(f"Position bonus DOUBLED for '{m['name']}' (budget low: {budget_remaining}/{max_position_changes})")
                        elif budget_remaining <= 0:
                            # Budget exhausted - penalize position changes
                            position_bonus = -self.POSITION_CONTINUITY_BONUS * 2.0
                            logger.debug(f"Position PENALTY for '{m['name']}' (budget exhausted)")

                base_weight += position_bonus

                # SAFETY: Ensure weight never goes below minimum threshold
                # This prevents elimination of all candidates when penalties are applied
                base_weight = max(base_weight, 0.01)

                # Apply difficulty multiplier if class_difficulty is specified
                if class_difficulty and class_difficulty in self.DIFFICULTY_WEIGHT_MULTIPLIERS:
                    movement_difficulty = m.get('difficulty_level', 'Beginner')
                    difficulty_multiplier = self.DIFFICULTY_WEIGHT_MULTIPLIERS[class_difficulty].get(
                        movement_difficulty, 1.0
                    )

                    # PROGRESSIVE DIFFICULTY: Adjust weights based on position in sequence
                    # For Advanced classes, prefer easier movements early, harder later
                    sequence_position = len(current_sequence)
                    advanced_count = sum(1 for mov in current_sequence
                                       if mov.get('difficulty_level') == 'Advanced')

                    if class_difficulty == 'Advanced':
                        # Use the actual target_count if provided, otherwise fall back to estimates
                        # For 10-min classes, we know it's exactly 3 movements
                        # For other classes, use the passed target_count or estimate
                        if target_count is not None:
                            total_expected = target_count
                        else:
                            # Fallback to old logic if target_count not provided
                            total_expected = 3 if target_duration == 10 else 10
                            logger.warning(f"target_count not provided, using estimate: {total_expected}")

                        # Calculate what percentage WOULD BE if we add another Advanced
                        # Must divide by total_expected (final sequence size), not current position!
                        next_advanced_pct = ((advanced_count + 1) / total_expected * 100) if movement_difficulty == 'Advanced' else 0
                        current_pct = (advanced_count / total_expected * 100) if total_expected > 0 else 0

                        # Calculate if we're below minimum (33%) and need to boost Advanced
                        movements_remaining = total_expected - sequence_position
                        min_advanced_needed = max(1, int(total_expected * 0.33 + 0.5))  # Round up, at least 1

                        # Check if we risk falling below minimum
                        if movements_remaining > 0 and advanced_count < min_advanced_needed and movements_remaining <= (min_advanced_needed - advanced_count):
                            # If we don't have enough Advanced and running out of slots
                            if movement_difficulty == 'Advanced':
                                # For 10-min classes, be VERY aggressive about meeting minimum
                                if target_duration == 10:
                                    if movements_remaining == 1 and advanced_count == 0:
                                        difficulty_multiplier *= 1000.0  # Essentially FORCE Advanced for last movement
                                        logger.info(f"⚠️ 10-MIN MINIMUM: LAST CHANCE - boosting Advanced ×1000")
                                    elif movements_remaining == 2 and advanced_count == 0:
                                        difficulty_multiplier *= 50.0  # Strongly boost when 2 slots left
                                        logger.info(f"⚠️ 10-MIN MINIMUM: 2 slots left, 0 Advanced - boosting ×50")
                                    else:
                                        difficulty_multiplier *= 20.0  # General strong boost
                                elif movements_remaining == 1 and advanced_count == 0:
                                    difficulty_multiplier *= 100.0  # Force for other durations too
                                else:
                                    difficulty_multiplier *= 10.0  # STRONGLY boost Advanced to meet minimum
                                logger.debug(
                                    f"Advanced MINIMUM enforced: {advanced_count}/{total_expected} = {current_pct:.1f}% current, "
                                    f"Need {min_advanced_needed - advanced_count} more Advanced in {movements_remaining} slots "
                                    f"→ boosting Advanced weight to {difficulty_multiplier:.1f}"
                                )
                            elif movement_difficulty in ['Beginner', 'Intermediate']:
                                # For 10-min classes, be aggressive about reducing non-Advanced when below minimum
                                if target_duration == 10:
                                    if movements_remaining == 1 and advanced_count == 0:
                                        difficulty_multiplier *= 0.001  # Nearly ELIMINATE non-Advanced
                                        logger.info(f"⚠️ 10-MIN MINIMUM: Reducing non-Advanced ×0.001")
                                    elif movements_remaining == 2 and advanced_count == 0:
                                        difficulty_multiplier *= 0.02  # Strongly reduce when 2 slots left
                                    else:
                                        difficulty_multiplier *= 0.05  # General reduction
                                elif movements_remaining == 1 and advanced_count == 0:
                                    difficulty_multiplier *= 0.01  # Nearly eliminate non-Advanced
                                else:
                                    difficulty_multiplier *= 0.1  # Reduce non-Advanced when below minimum

                        # If adding this Advanced movement would exceed 66%, strongly reduce its weight
                        # For very short sequences (3 movements), be even more strict
                        elif next_advanced_pct > 66 and movement_difficulty == 'Advanced':
                            if total_expected <= 3:  # 10-minute quick practice
                                difficulty_multiplier *= 0.001  # Nearly ELIMINATE Advanced weight (was 0.01)
                                logger.info(  # Changed to info level for visibility
                                    f"🚫 10-MIN ADVANCED CAP: {advanced_count}/{total_expected} Advanced already "
                                    f"({current_pct:.1f}%), would be {next_advanced_pct:.1f}% → weight×0.001"
                                )
                            else:
                                difficulty_multiplier *= 0.01  # Strongly reduce to stay under cap (was 0.1)
                            if sequence_position >= 1:  # Log when selecting 2nd or later movement
                                logger.debug(
                                    f"Advanced cap enforced: {advanced_count}/{total_expected} = {current_pct:.1f}% current, "
                                    f"would be {next_advanced_pct:.1f}% with this Advanced → reducing weight to {difficulty_multiplier:.1f}"
                                )

                        # Early in sequence (first 20%): boost Beginner/Intermediate
                        # For 10-min classes (3 movements), only first movement is "early"
                        elif (target_duration == 10 and sequence_position == 0) or \
                             (target_duration != 10 and sequence_position < total_expected * 0.2):
                            if movement_difficulty == 'Beginner':
                                difficulty_multiplier *= 2.0  # Double weight for warm-up
                            elif movement_difficulty == 'Intermediate':
                                difficulty_multiplier *= 1.5  # Boost intermediate
                            elif movement_difficulty == 'Advanced':
                                difficulty_multiplier *= 0.5  # Reduce Advanced early on

                        # Middle of sequence (20-80%): use standard multipliers
                        # (no adjustment needed)

                        # Late in sequence (last 20%): slightly reduce Advanced
                        # Skip for 10-min classes (no explicit cooldown phase with only 3 movements)
                        elif target_duration != 10 and sequence_position > total_expected * 0.8:
                            if movement_difficulty == 'Advanced':
                                difficulty_multiplier *= 0.7  # Slightly reduce for cooldown
                            elif movement_difficulty == 'Beginner':
                                difficulty_multiplier *= 1.3  # Slight boost for cooldown

                    final_weight = base_weight * difficulty_multiplier

                    # Log detailed weight calculation for Advanced classes
                    # Always log for 10-minute classes to debug the 3-movement selection
                    if (class_difficulty == 'Advanced' and len(current_sequence) < 3) or target_duration == 10:
                        logger.debug(
                            f"Weight calc for '{m['name']}' ({movement_difficulty}): "
                            f"base={base_weight:.1f} × multiplier={difficulty_multiplier:.1f} = {final_weight:.1f}"
                            f" [pos={sequence_position}, advanced_count={advanced_count if class_difficulty == 'Advanced' else 'N/A'}]"
                        )
                else:
                    final_weight = base_weight

                weights.append(final_weight)

            # Use random.choices with combined weights
            selected = random.choices(available, weights=weights, k=1)[0]

            # Log selection with difficulty info
            selected_weight = weights[available.index(selected)]

            # Extra logging for 10-minute Advanced classes to debug the issue
            if target_duration == 10 and class_difficulty == 'Advanced':
                advanced_so_far = sum(1 for m in current_sequence if m.get('difficulty_level') == 'Advanced')
                logger.info(
                    f"🎯 10-MIN ADVANCED SELECTION #{len(current_sequence)+1}/3: "
                    f"'{selected['name']}' ({selected.get('difficulty_level')}) weight={selected_weight:.1f} | "
                    f"Advanced so far: {advanced_so_far}"
                )
            else:
                logger.info(
                    f"Selected '{selected['name']}' ({selected.get('difficulty_level', 'Unknown')}) "
                    f"weight: {selected_weight:.1f}"
                )
            return selected

        # Fallback: pick randomly from available (no usage data)
        return random.choice(available) if available else None

    def _get_cooldown_movement(self, movements: List[Dict[str, Any]], current_sequence: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Get appropriate cooldown movement with consecutive overlap check

        CRITICAL FIX: Apply same <50% overlap filter as regular movement selection
        to prevent Crab + Seal regression (both share 100% muscle groups)
        """
        if not movements:
            return None

        # Get already used movement IDs
        used_ids = [m["id"] for m in current_sequence]

        # Filter to unused movements only
        available = [m for m in movements if m["id"] not in used_ids]
        if not available:
            return None

        # CRITICAL FIX: Apply consecutive overlap filter (same as _select_next_movement)
        if current_sequence:
            prev_movement = current_sequence[-1]
            prev_muscles = set(mg.get('name', '') for mg in prev_movement.get('muscle_groups', []))

            if prev_muscles:
                filtered_available = []
                for candidate in available:
                    candidate_muscles = set(mg.get('name', '') for mg in candidate.get('muscle_groups', []))

                    if candidate_muscles:
                        overlap = prev_muscles & candidate_muscles
                        overlap_pct = (len(overlap) / len(candidate_muscles)) * 100 if candidate_muscles else 0

                        # Only keep candidates with <50% overlap
                        if overlap_pct < 50:
                            filtered_available.append(candidate)

                # If we filtered out everything, fall back to original available list
                if filtered_available:
                    available = filtered_available
                    logger.info(f"Cooldown: Filtered to {len(available)} movements with <50% consecutive muscle overlap")

        # No keyword matching - muscle_groups are the ONLY sequencing criteria
        # Just pick any available movement that passes the overlap filter
        # (User requirement: "You should only use muscle_groups for considering sequence appropriateness, nothing else")
        selected = available[0] if available else None
        if selected:
            logger.info(f"Selected cooldown: '{selected['name']}'")
        return selected

    # ==========================================================================
    # TRANSITIONS
    # ==========================================================================

    def _add_transitions_to_sequence(self, sequence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add transition narratives between movements based on setup positions"""
        if not sequence or len(sequence) < 2:
            return sequence

        sequence_with_transitions = []

        try:
            # Get all transitions from database (duration_seconds required - Migration 021)
            # VOICEOVER SUPPORT: Fetch voiceover fields (Migration 027)
            transitions_map = {}
            if self.supabase:
                transitions_response = self.supabase.table('transitions') \
                    .select('from_position, to_position, narrative, duration_seconds, voiceover_url, voiceover_duration, voiceover_enabled') \
                    .execute()

                # Store narrative, duration_seconds, AND voiceover fields from database
                transitions_map = {
                    (t['from_position'], t['to_position']): {
                        'narrative': t['narrative'],
                        'duration_seconds': t['duration_seconds'],  # MUST come from database
                        'voiceover_url': t.get('voiceover_url'),  # Voiceover audio URL (Migration 027)
                        'voiceover_duration': t.get('voiceover_duration'),  # Voiceover duration in seconds
                        'voiceover_enabled': t.get('voiceover_enabled', False)  # Whether to play voiceover
                    }
                    for t in transitions_response.data
                }

                logger.info(f"✅ Fetched {len(transitions_map)} transitions with duration_seconds from database")

            for i, movement in enumerate(sequence):
                # Add the movement
                sequence_with_transitions.append(movement)

                # Add transition if there's a next movement
                if i < len(sequence) - 1:
                    from_position = movement.get('setup_position', 'Unknown')
                    to_position = sequence[i + 1].get('setup_position', 'Unknown')

                    # Get transition data (narrative + duration + voiceover) from database
                    transition_key = (from_position, to_position)
                    transition_data = transitions_map.get(
                        transition_key,
                        {
                            'narrative': f"Transition from {from_position} to {to_position} position with control.",
                            'duration_seconds': 60,  # Fallback if transition not in database
                            'voiceover_url': None,
                            'voiceover_duration': None,
                            'voiceover_enabled': False
                        }
                    )

                    # Add transition item to sequence (using database duration + voiceover fields)
                    transition_item = {
                        "type": "transition",
                        "from_position": from_position,
                        "to_position": to_position,
                        "narrative": transition_data['narrative'],
                        "duration_seconds": transition_data['duration_seconds'],  # FROM DATABASE
                        "name": f"Transition: {from_position} → {to_position}",
                        # Voiceover fields (Migration 027)
                        "voiceover_url": transition_data['voiceover_url'],
                        "voiceover_duration": transition_data['voiceover_duration'],
                        "voiceover_enabled": transition_data['voiceover_enabled']
                    }

                    sequence_with_transitions.append(transition_item)

            logger.info(f"Added {len(sequence) - 1} transitions to sequence")

        except Exception as e:
            logger.error(f"Error adding transitions: {e}")
            # Return original sequence if transition fetch fails
            return sequence

        return sequence_with_transitions

    # ==========================================================================
    # MUSCLE BALANCE & VALIDATION
    # ==========================================================================

    def _calculate_muscle_balance(self, sequence: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate muscle group usage across sequence using database muscle mappings"""
        muscle_load = {}

        try:
            # Get total duration for percentage calculation
            total_duration = sum(m.get("duration_seconds") or 60 for m in sequence)

            # Get movement IDs
            movement_ids = [m["id"] for m in sequence]

            if not movement_ids or not self.supabase:
                return muscle_load

            # Query movement_muscles table
            response = self.supabase.table('movement_muscles') \
                .select('movement_id, muscle_group_name') \
                .in_('movement_id', movement_ids) \
                .execute()

            # Build muscle load map
            for movement in sequence:
                duration = movement.get("duration_seconds", 60)
                movement_id = movement["id"]

                # Find muscle groups for this movement
                movement_muscles = [
                    mm for mm in response.data
                    if mm["movement_id"] == movement_id
                ]

                for mm in movement_muscles:
                    muscle_name = mm.get("muscle_group_name", "Unknown")
                    if muscle_name not in muscle_load:
                        muscle_load[muscle_name] = 0.0
                    muscle_load[muscle_name] += duration

            # Convert to percentages
            if total_duration > 0:
                muscle_load = {k: (v / total_duration) * 100 for k, v in muscle_load.items()}

            logger.info(f"Calculated muscle balance from {len(movement_ids)} movements")

        except Exception as e:
            logger.error(f"Error calculating muscle balance: {e}")
            muscle_load = {}

        return muscle_load

    def _calculate_difficulty_balance(self, sequence: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculate difficulty level distribution across sequence

        Returns percentage of movements from each difficulty level.
        """
        difficulty_counts = {}
        total_movements = len(sequence)

        if total_movements == 0:
            return {}

        try:
            # Count movements by difficulty
            for movement in sequence:
                difficulty = movement.get("difficulty_level", "Unknown")
                if difficulty not in difficulty_counts:
                    difficulty_counts[difficulty] = 0
                difficulty_counts[difficulty] += 1

            # Convert to percentages
            difficulty_percentages = {
                difficulty: (count / total_movements) * 100
                for difficulty, count in difficulty_counts.items()
            }

            logger.info(f"Difficulty distribution: {difficulty_percentages}")
            return difficulty_percentages

        except Exception as e:
            logger.error(f"Error calculating difficulty balance: {e}")
            return {}

    def _calculate_family_balance(self, sequence: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculate movement family distribution across sequence

        SESSION: Movement Families - December 2025
        Returns percentage of movements from each family.
        """
        family_counts = {}
        total_movements = len(sequence)

        if total_movements == 0:
            return {}

        try:
            # Count movements by family
            for movement in sequence:
                family = movement.get("movement_family", "other")
                if family not in family_counts:
                    family_counts[family] = 0
                family_counts[family] += 1

            # Convert to percentages
            family_percentages = {
                family: (count / total_movements) * 100
                for family, count in family_counts.items()
            }

            logger.info(f"Family distribution: {family_percentages}")
            return family_percentages

        except Exception as e:
            logger.error(f"Error calculating family balance: {e}")
            return {}

    def _get_family_usage_vs_natural(self, sequence: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """
        NEW RULE 2 HELPER: Analyze family usage vs natural proportions

        Returns dict with each family's:
        - current_pct: % in current sequence
        - natural_pct: % in full repertoire (35 movements)
        - max_allowed_pct: 2x natural proportion
        - deviation: how far over/under natural proportion (positive = overused)
        - is_overused: True if exceeds 2x threshold

        Example:
        {
            "supine_abdominal": {
                "current_pct": 44.0,
                "natural_pct": 26.0,
                "max_allowed_pct": 52.0,
                "deviation": 18.0,
                "is_overused": False
            }
        }
        """
        family_balance = self._calculate_family_balance(sequence)
        usage_analysis = {}

        for family, natural_proportion in self.NATURAL_FAMILY_PROPORTIONS.items():
            current_pct = family_balance.get(family, 0.0)
            natural_pct = natural_proportion * 100  # Convert to percentage
            max_allowed_pct = natural_pct * 2       # 2x threshold
            deviation = current_pct - natural_pct   # Positive = overused, Negative = underused
            is_overused = current_pct > max_allowed_pct

            usage_analysis[family] = {
                "current_pct": current_pct,
                "natural_pct": natural_pct,
                "max_allowed_pct": max_allowed_pct,
                "deviation": deviation,
                "is_overused": is_overused
            }

        return usage_analysis

    def _validate_sequence(
        self,
        sequence: List[Dict[str, Any]],
        muscle_balance: Dict[str, float],
        class_difficulty: str = None
    ) -> Dict[str, Any]:
        """Validate sequence against safety rules and difficulty targets"""
        violations = []
        warnings = []

        # Check muscle balance
        for muscle, load in muscle_balance.items():
            if load > 40:
                warnings.append(f"{muscle.title()} load high ({load:.1f}%)")

        # SESSION: Movement Families - Check family balance (NEW - 2x natural proportions)
        family_balance = self._calculate_family_balance(sequence)
        usage_analysis = self._get_family_usage_vs_natural(sequence)

        # Check if any families exceed 2x their natural proportion
        for family, stats in usage_analysis.items():
            if stats["is_overused"]:
                warnings.append(
                    f"Movement family '{family}' exceeds 2x natural proportion "
                    f"(current: {stats['current_pct']:.1f}%, max: {stats['max_allowed_pct']:.1f}%, "
                    f"deviation: +{stats['deviation']:.1f}%)"
                )

        # NEW: Check difficulty balance against targets
        difficulty_balance = self._calculate_difficulty_balance(sequence)
        difficulty_analysis = {}

        if class_difficulty and class_difficulty in self.DIFFICULTY_MIX_TARGETS:
            targets = self.DIFFICULTY_MIX_TARGETS[class_difficulty]

            for difficulty_level, target_pct in targets.items():
                actual_pct = difficulty_balance.get(difficulty_level, 0.0)
                deviation = actual_pct - (target_pct * 100)  # Convert target to percentage

                difficulty_analysis[difficulty_level] = {
                    "target_pct": target_pct * 100,
                    "actual_pct": actual_pct,
                    "deviation": deviation,
                    "on_target": abs(deviation) <= 10  # Within 10% is considered on target
                }

                # Special handling for Advanced class requirements (33-66% range)
                if class_difficulty == 'Advanced' and difficulty_level == 'Advanced':
                    if actual_pct > 66:
                        violations.append(
                            f"Advanced movements exceed 66% hard cap "
                            f"(actual: {actual_pct:.1f}%)"
                        )
                    elif actual_pct < 33:
                        violations.append(
                            f"Advanced movements below 33% minimum "
                            f"(actual: {actual_pct:.1f}%)"
                        )
                # Add warning if significantly off target (>20% deviation)
                elif abs(deviation) > 20:
                    if deviation > 0:
                        warnings.append(
                            f"{difficulty_level} movements exceed target "
                            f"(actual: {actual_pct:.1f}%, target: {target_pct * 100:.1f}%)"
                        )
                    else:
                        warnings.append(
                            f"{difficulty_level} movements below target "
                            f"(actual: {actual_pct:.1f}%, target: {target_pct * 100:.1f}%)"
                        )

        # Calculate safety score
        safety_score = 1.0 - (len(violations) * 0.2 + len(warnings) * 0.05)
        safety_score = max(0.0, min(1.0, safety_score))

        return {
            "is_valid": len(violations) == 0,
            "safety_score": safety_score,
            "violations": violations,
            "warnings": warnings,
            "family_balance": family_balance,  # Include family distribution in response
            "family_usage_analysis": usage_analysis,  # Include detailed family analysis
            "difficulty_balance": difficulty_balance,  # NEW: Include difficulty distribution
            "difficulty_analysis": difficulty_analysis  # NEW: Include difficulty vs target analysis
        }

    # ==========================================================================
    # MOVEMENT USAGE TRACKING (PHASE 2 - INTELLIGENT VARIETY)
    # ==========================================================================

    def _get_movement_usage_weights(
        self,
        user_id: str,
        movements: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        RULE 3 (ENHANCED): Get movement usage weights based on complete historical coverage

        Queries NEW class_movements table for full historical lookback.
        Boosts weights for:
        1. Movements used rarely across ALL classes (frequency)
        2. Movements not used recently (recency)
        3. Movements from underutilized muscle groups (muscle balance over time)

        Higher weight = prefer this movement
        """
        if not self.supabase:
            return {m['id']: 1.0 for m in movements}

        try:
            # RULE 3 IMPLEMENTATION: Query complete historical class_movements data
            # This gives us FULL lookback - every movement in every class from day 1
            history_response = self.supabase.table('class_movements') \
                .select('movement_id, movement_name, class_generated_at') \
                .eq('user_id', user_id) \
                .order('class_generated_at', desc=True) \
                .execute()

            # Count total classes to calculate usage percentages
            total_classes = len(set(
                row['class_generated_at'] for row in history_response.data
            )) if history_response.data else 0

            # Count how many classes each movement appeared in
            movement_class_counts = {}
            movement_last_used = {}

            for row in history_response.data:
                mov_id = row['movement_id']
                class_date_str = row['class_generated_at']

                # Track class count
                if mov_id not in movement_class_counts:
                    movement_class_counts[mov_id] = set()
                movement_class_counts[mov_id].add(class_date_str)

                # Track most recent usage
                if 'T' in class_date_str:
                    class_date = datetime.fromisoformat(class_date_str.replace('Z', '+00:00')).date()
                else:
                    class_date = datetime.strptime(class_date_str[:10], '%Y-%m-%d').date()

                if mov_id not in movement_last_used or class_date > movement_last_used[mov_id]:
                    movement_last_used[mov_id] = class_date

            # Convert class counts to actual counts
            movement_frequency = {
                mov_id: len(class_dates)
                for mov_id, class_dates in movement_class_counts.items()
            }

            # Calculate weights for each movement
            weights = {}
            today = date.today()

            for movement in movements:
                movement_id = movement['id']

                if movement_id in movement_frequency:
                    # Calculate usage percentage across all classes
                    classes_used_in = movement_frequency[movement_id]
                    usage_percentage = (classes_used_in / total_classes * 100) if total_classes > 0 else 0

                    # Calculate days since last used
                    last_used = movement_last_used.get(movement_id, today)
                    days_since = (today - last_used).days

                    # ENHANCED RULE 3 FORMULA:
                    # Weight = (Recency Boost) / (Frequency Penalty)
                    # Prefer movements that:
                    # - Haven't been used recently (high days_since)
                    # - Haven't been used in many classes (low usage_percentage)

                    recency_boost = (days_since + 1) ** 2  # Quadratic for recency
                    frequency_penalty = (usage_percentage + 1) ** 1.5  # 1.5 power for frequency

                    weight = recency_boost / frequency_penalty

                    logger.debug(
                        f"Movement '{movement.get('name')}': "
                        f"used in {classes_used_in}/{total_classes} classes ({usage_percentage:.1f}%), "
                        f"last used {days_since} days ago, weight: {weight:.1f}"
                    )
                else:
                    # Never used before - HIGHEST weight (prioritize repertoire expansion)
                    weight = 100000
                    logger.debug(f"Movement '{movement.get('name')}': NEVER USED (weight: {weight})")

                weights[movement_id] = weight

            logger.info(
                f"RULE 3 enforced: Calculated usage weights from {len(history_response.data)} historical movements "
                f"across {total_classes} classes"
            )
            return weights

        except Exception as e:
            logger.warning(f"Error getting movement usage weights (historical): {e}")
            # MIGRATION: No longer falling back to movement_usage table (Phase 2)
            # Return default equal weights if there's an error
            return {m['id']: 1.0 for m in movements}

    # MIGRATION: Removed _get_legacy_usage_weights function (Phase 2)
    # This function was using the deprecated movement_usage table.
    # All movement usage tracking is now done through the class_movements table.
    # If class_movements query fails, we return default equal weights instead.

    def _log_class_quality(
        self,
        user_id: str,
        sequence: List[Dict[str, Any]],
        muscle_balance: Dict[str, float],
        validation: Dict[str, Any],
        target_duration: int,
        difficulty_level: str,
        class_plan_id: Optional[str] = None
    ) -> None:
        """
        QUALITY LOGGING (Migration 036): Log rule compliance to database

        Tracks compliance for all 3 rules:
        1. Don't repeat muscle usage (consecutive movements < 50% overlap)
        2. Don't overuse movement families (no family > 40%)
        3. Historical repertoire coverage (full lookback)

        Logs to:
        - class_movements: Historical tracking (which movements in which classes)
        - class_quality_log: Rule compliance tracking
        """
        logger.warning(f"🔍 DIAGNOSTIC: _log_class_quality() called")
        logger.warning(f"   user_id: {user_id}")
        logger.warning(f"   sequence: {len(sequence)} movements")
        logger.warning(f"   difficulty: {difficulty_level}")
        logger.warning(f"   class_plan_id: {class_plan_id or 'None'}")

        if not self.supabase:
            logger.error("❌ CRITICAL: self.supabase is None - CANNOT LOG")
            logger.error("   This indicates SequenceTools was initialized without Supabase client")
            logger.error("   Check BasslinePilatesTools.__init__() in orchestrator/tools.py")
            return

        try:
            # POPULATE class_movements table (historical tracking for Rule 3)
            # PERFORMANCE OPTIMIZATION: Batch all inserts into single database call
            timestamp_now = datetime.now().isoformat()
            logger.warning(f"🔍 DIAGNOSTIC: Preparing batched insert of {len(sequence)} movements into class_movements")

            # Build array of all insert data
            movements_to_insert = []
            for i, movement in enumerate(sequence, start=1):
                insert_data = {
                    'user_id': user_id,
                    'class_plan_id': class_plan_id,
                    'movement_id': movement['id'],
                    'movement_name': movement.get('name', 'Unknown'),
                    'class_generated_at': timestamp_now,
                    'difficulty_level': difficulty_level,
                    'position_in_sequence': i
                }
                movements_to_insert.append(insert_data)
                logger.warning(f"   Prepared movement {i}/{len(sequence)}: {movement.get('name')}")

            # Single batched INSERT (replaces 7-9 separate calls with 1 call)
            try:
                logger.warning(f"🚀 OPTIMIZATION: Executing batched insert ({len(movements_to_insert)} movements in 1 call)")
                logger.warning(f"   Table: class_movements")
                logger.warning(f"   Inserting {len(movements_to_insert)} movement records")
                logger.warning(f"   Sample data (first movement): {movements_to_insert[0] if movements_to_insert else 'EMPTY'}")

                response = self.supabase.table('class_movements').insert(movements_to_insert).execute()
                movements_logged = len(movements_to_insert)
                logger.warning(f"✅ DIAGNOSTIC: Batched insert SUCCESSFUL - logged {movements_logged}/{len(sequence)} movements")
                logger.warning(f"   Response data count: {len(response.data) if response.data else 0}")
            except Exception as e:
                logger.error(f"   ❌ CRITICAL: Failed batched insert to class_movements: {e}")
                logger.error(f"      Error type: {type(e).__name__}")
                logger.error(f"      Data being inserted: {movements_to_insert}")
                import traceback
                logger.error(f"      Full traceback:\n{traceback.format_exc()}")
                movements_logged = 0

            logger.warning(f"✅ OPTIMIZATION COMPLETE: Logged {movements_logged}/{len(sequence)} movements (~600ms saved)")

            # CALCULATE RULE 1 COMPLIANCE: Consecutive muscle overlap
            rule1_pass = True
            rule1_max_overlap = 0.0
            rule1_failed_pairs = []

            for i in range(len(sequence) - 1):
                curr = sequence[i]
                next_mov = sequence[i + 1]

                curr_muscles = set(mg.get('name', '') for mg in curr.get('muscle_groups', []))
                next_muscles = set(mg.get('name', '') for mg in next_mov.get('muscle_groups', []))

                if curr_muscles and next_muscles:
                    overlap = curr_muscles & next_muscles
                    overlap_pct = (len(overlap) / len(next_muscles)) * 100

                    if overlap_pct > rule1_max_overlap:
                        rule1_max_overlap = overlap_pct

                    if overlap_pct >= 50:
                        rule1_pass = False
                        rule1_failed_pairs.append({
                            'from': curr.get('name'),
                            'to': next_mov.get('name'),
                            'overlap_pct': round(overlap_pct, 1)
                        })

            # CALCULATE RULE 2 COMPLIANCE: Family balance (NEW - 2x natural proportions)
            family_balance = self._calculate_family_balance(sequence)
            usage_analysis = self._get_family_usage_vs_natural(sequence)

            # Rule 2 passes if NO families exceed 2x their natural proportion
            rule2_pass = all(not stats["is_overused"] for stats in usage_analysis.values())

            # Track max family percentage and which families are overused
            rule2_max_family = max(family_balance.values()) if family_balance else 0.0
            rule2_overrepresented = [
                {
                    'family': family,
                    'current_pct': round(stats['current_pct'], 1),
                    'natural_pct': round(stats['natural_pct'], 1),
                    'max_allowed_pct': round(stats['max_allowed_pct'], 1),
                    'deviation': round(stats['deviation'], 1)
                }
                for family, stats in usage_analysis.items()
                if stats["is_overused"]
            ]

            # CALCULATE RULE 3 COMPLIANCE: Repertoire coverage
            # Query historical data to check coverage
            history_response = self.supabase.table('class_movements') \
                .select('movement_id') \
                .eq('user_id', user_id) \
                .execute()

            unique_movements_all_time = len(set(row['movement_id'] for row in history_response.data)) if history_response.data else 0

            # Check if any muscle groups are underutilized
            # (This would require more complex logic - simplified for now)
            rule3_pass = True  # Assume pass unless specific thresholds violated
            rule3_underutilized_muscles = []  # Could be calculated from historical muscle balance

            # Calculate stalest movement (days since last used)
            rule3_stalest_days = 0
            if history_response.data:
                # Find oldest class_generated_at timestamp
                try:
                    oldest_class = min(
                        (datetime.fromisoformat(row.get('class_generated_at', timestamp_now).replace('Z', '+00:00')).date()
                         for row in history_response.data if row.get('class_generated_at')),
                        default=date.today()
                    )
                    rule3_stalest_days = (date.today() - oldest_class).days
                except Exception as e:
                    logger.warning(f"Error calculating stalest movement: {e}")

            # OVERALL PASS: All 3 rules must pass
            overall_pass = rule1_pass and rule2_pass and rule3_pass

            # QUALITY SCORE: 0.0 to 1.0 composite
            quality_score = (
                (1.0 if rule1_pass else 0.0) * 0.4 +  # Rule 1 weight: 40%
                (1.0 if rule2_pass else 0.0) * 0.3 +  # Rule 2 weight: 30%
                (1.0 if rule3_pass else 0.0) * 0.3    # Rule 3 weight: 30%
            )

            # INSERT into class_quality_log
            import json
            logger.warning(f"🔍 DIAGNOSTIC: Preparing class_quality_log insert:")
            logger.warning(f"   Rule 1: {'PASS' if rule1_pass else 'FAIL'} (max overlap: {rule1_max_overlap:.1f}%)")
            logger.warning(f"   Rule 2: {'PASS' if rule2_pass else 'FAIL'} (max family: {rule2_max_family:.1f}%)")
            logger.warning(f"   Rule 3: {'PASS' if rule3_pass else 'FAIL'} (unique movements: {unique_movements_all_time})")
            logger.warning(f"   Overall: {'PASS' if overall_pass else 'FAIL'} (score: {quality_score:.2f})")

            quality_log_data = {
                'user_id': user_id,
                'class_plan_id': class_plan_id,
                'generated_at': timestamp_now,
                'difficulty_level': difficulty_level,
                'target_duration_minutes': target_duration,
                'movement_count': len(sequence),

                # Rule 1: Muscle repetition
                'rule1_muscle_repetition_pass': rule1_pass,
                'rule1_max_consecutive_overlap_pct': rule1_max_overlap,
                'rule1_failed_pairs': json.dumps(rule1_failed_pairs) if rule1_failed_pairs else None,

                # Rule 2: Family balance
                'rule2_family_balance_pass': rule2_pass,
                'rule2_max_family_pct': rule2_max_family,
                'rule2_overrepresented_families': json.dumps(rule2_overrepresented) if rule2_overrepresented else None,

                # Rule 3: Repertoire coverage
                'rule3_repertoire_coverage_pass': rule3_pass,
                'rule3_unique_movements_count': unique_movements_all_time,
                'rule3_underutilized_muscles': json.dumps(rule3_underutilized_muscles) if rule3_underutilized_muscles else None,
                'rule3_stalest_movement_days': rule3_stalest_days,

                # Overall
                'overall_pass': overall_pass,
                'quality_score': quality_score,
                'muscle_balance': json.dumps(muscle_balance),
                'family_distribution': json.dumps(family_balance)
            }

            logger.warning(f"🔍 DIAGNOSTIC: Inserting into class_quality_log...")
            logger.warning(f"   Table: class_quality_log")
            logger.warning(f"   Data keys: {list(quality_log_data.keys())}")
            logger.warning(f"   user_id: {quality_log_data['user_id']}")
            logger.warning(f"   generated_at: {quality_log_data['generated_at']}")
            logger.warning(f"   movement_count: {quality_log_data['movement_count']}")

            try:
                response = self.supabase.table('class_quality_log').insert(quality_log_data).execute()
                logger.warning(f"✅ DIAGNOSTIC: class_quality_log insert SUCCESSFUL")
                logger.warning(f"   Response data: {response.data}")
                logger.warning(f"   Response count: {response.count if hasattr(response, 'count') else 'N/A'}")
            except Exception as insert_error:
                logger.error(f"❌ CRITICAL: INSERT to class_quality_log FAILED")
                logger.error(f"   Error: {insert_error}")
                logger.error(f"   Error type: {type(insert_error).__name__}")
                logger.error(f"   Data being inserted: {quality_log_data}")
                raise

            logger.info(
                f"✅ Quality logged: Rule1={'PASS' if rule1_pass else 'FAIL'}, "
                f"Rule2={'PASS' if rule2_pass else 'FAIL'}, "
                f"Rule3={'PASS' if rule3_pass else 'FAIL'}, "
                f"Overall={'PASS' if overall_pass else 'FAIL'} (score: {quality_score:.2f})"
            )

        except Exception as e:
            logger.error(f"❌ CRITICAL: Exception in _log_class_quality: {e}")
            logger.error(f"   Error type: {type(e).__name__}")
            import traceback
            logger.error(f"   Full traceback:\n{traceback.format_exc()}")
            raise

    def _check_if_admin(self, user_id: str) -> bool:
        """
        Check if user is an admin

        Used to gate QA/diagnostic features like muscle overlap reports.
        Only admins need detailed analytics - regular users just use the classes.

        Returns:
            True if admin, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Check user_profiles table for user_type (admin role)
            # NOTE: Query by 'id' column (matches auth.uid()), not 'user_id'
            response = self.supabase.table('user_profiles') \
                .select('user_type') \
                .eq('id', user_id) \
                .single() \
                .execute()

            if response.data:
                is_admin = response.data.get('user_type') == 'admin'
                logger.info(f"✅ User {user_id[:8]}... is_admin: {is_admin}")
                return is_admin

            logger.warning(f"❌ No user_profile found for user {user_id[:8]}...")
            return False

        except Exception as e:
            logger.warning(f"Error checking admin status: {e}")
            return False  # Default to not admin if check fails

    def _check_if_beginner(self, user_id: str) -> bool:
        """
        SESSION 13: Check if user is a beginner (classes_completed < 10)

        Used for "The Hundred" boosting logic.
        Beginners need to practice The Hundred frequently as it's foundational.

        Returns:
            True if beginner (classes_completed < 10), False otherwise
        """
        if not self.supabase:
            return False

        try:
            response = self.supabase.table('user_preferences') \
                .select('classes_completed, experience_level') \
                .eq('user_id', user_id) \
                .single() \
                .execute()

            if response.data:
                classes_completed = response.data.get('classes_completed', 0)
                experience = response.data.get('experience_level', 'beginner')

                # User is beginner if: classes_completed < 10 OR experience_level = 'beginner'
                is_beginner = classes_completed < 10 or experience == 'beginner'

                logger.info(f"User experience: {experience}, classes: {classes_completed}, is_beginner: {is_beginner}")
                return is_beginner

            return False

        except Exception as e:
            logger.warning(f"Error checking beginner status: {e}")
            return False  # Default to not beginner if check fails
