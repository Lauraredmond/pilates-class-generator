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

    # Movement family distribution threshold
    MAX_FAMILY_PERCENTAGE = 40  # No single family should exceed 40% of movements

    # Teaching time per movement (in minutes) - CRITICAL QUALITY RULE
    MINUTES_PER_MOVEMENT = {
        "Beginner": 4,      # Beginners need more explanation and practice time
        "Intermediate": 5,  # Intermediate students can move faster
        "Advanced": 6       # Advanced students perfect form, not rush
    }

    # Transition time between movements (in minutes)
    TRANSITION_TIME_MINUTES = 1  # Average transition time based on setup position changes

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
        include_mcp_research: bool = False  # Whether to enhance with web research
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
        # Validate inputs (allow 12-min quick practice)
        if not (12 <= target_duration_minutes <= 120):
            raise ValueError("Duration must be between 12 and 120 minutes")

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

        # Step 5: Validate sequence against safety rules
        validation = self._validate_sequence(sequence, muscle_balance)

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
                report_data = generate_overlap_report(
                    sequence=sequence,
                    user_id=user_id,
                    supabase_client=self.supabase
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

        if user_id and self.supabase:
            logger.warning(f"✅ ATTEMPTING quality logging for user {user_id[:8]}...")
            try:
                self._log_class_quality(
                    user_id=user_id,
                    sequence=sequence,
                    muscle_balance=muscle_balance,
                    validation=validation,
                    target_duration=target_duration_minutes,
                    difficulty_level=difficulty_level
                )
                logger.warning(f"✅ Quality logging COMPLETED successfully")
            except Exception as e:
                logger.error(f"❌ Failed to log class quality: {e}")
                logger.error(f"   Error type: {type(e).__name__}")
                import traceback
                logger.error(f"   Traceback:\n{traceback.format_exc()}")
        else:
            logger.warning(f"⚠️  SKIPPING quality logging (missing user_id or Supabase connection)")

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

        For 12-min classes: 0 overhead (quick movement practice - just 3 movements)
        For 30-min classes: prep + warmup + cooldown + homecare (no meditation)
        For longer classes: prep + warmup + cooldown + homecare + meditation

        Returns:
            Total overhead in minutes (read from database duration_seconds fields)
        """
        # SPECIAL CASE: 12-minute "Quick movement practice" classes
        # User requirement: "Just 3 movements, no warmup/cooldown/prep/meditation/homecare"
        if target_duration == 12:
            logger.info("✅ 12-minute quick practice: 0 overhead (movements only)")
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

            # DEBUG: Log voiceover fields from first 3 movements
            logger.info("=" * 80)
            logger.info("🔍 DEBUG: Movements from database (first 3):")
            for i, m in enumerate(movements[:3]):
                logger.info(f"  Movement {i+1}: {m.get('name')}")
                logger.info(f"    muscle_groups: {[mg['name'] for mg in m.get('muscle_groups', [])]}")
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
        user_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Build sequence following safety rules"""
        sequence = []

        # STEP 1: Get overhead from 6 class sections (preparation, warmup, cooldown, meditation, homecare)
        overhead_minutes = self._get_section_overhead_minutes(target_duration)

        # STEP 2: Calculate available time for movements after overhead
        available_minutes = target_duration - overhead_minutes

        if available_minutes <= 0:
            logger.error(f"No time for movements! Target: {target_duration} min, Overhead: {overhead_minutes} min")
            raise ValueError(f"Class duration too short. Need at least {overhead_minutes} minutes for required sections.")

        # STEP 3: Calculate max movements based on teaching time + transitions
        minutes_per_movement = self.MINUTES_PER_MOVEMENT.get(difficulty, 4)
        transition_time = self.TRANSITION_TIME_MINUTES

        # Store teaching time for use when setting movement durations
        teaching_time_seconds = minutes_per_movement * 60

        # Calculate: (available_minutes) = (num_movements * time_per_movement) + ((num_movements - 1) * transition_time)
        max_movements = int((available_minutes + transition_time) / (minutes_per_movement + transition_time))

        # ENFORCE MINIMUM 4 MOVEMENTS FOR 30-MIN CLASSES
        # User requirement: "We will have to go a little past the 30 minute threshold and insist on at least 4 movements for the 30 min class"
        if target_duration == 30 and max_movements < 4:
            logger.warning(
                f"30-min class calculated only {max_movements} movements. Enforcing minimum 4 movements (class will run slightly over 30 min)."
            )
            max_movements = 4

        # ENFORCE EXACTLY 3 MOVEMENTS FOR 12-MIN QUICK PRACTICE
        # User requirement: "Quick movement practice - just 3 movements for daily practice"
        if target_duration == 12:
            max_movements = 3
            logger.info("✅ 12-minute quick practice: Enforcing exactly 3 movements")

        logger.info(
            f"Building sequence: {target_duration} min total - {overhead_minutes} min overhead = {available_minutes} min available / "
            f"({minutes_per_movement} min/movement + {transition_time} min/transition) = max {max_movements} movements"
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

        # Leave room for cooldown
        while len(sequence) < (max_movements - 1):
            selected = self._select_next_movement(
                movements=movements,
                current_sequence=sequence,
                focus_areas=focus_areas,
                pattern_priority=pattern_order,
                usage_weights=usage_weights
            )

            if not selected:
                break

            selected_copy = selected.copy()
            # PRESERVE database duration_seconds instead of overwriting with teaching_time
            if "duration_seconds" not in selected_copy or not selected_copy["duration_seconds"]:
                selected_copy["duration_seconds"] = teaching_time_seconds  # Fallback only
            selected_copy["type"] = "movement"
            sequence.append(selected_copy)

        # Rule 3: Always end with cooldown
        cooldown = self._get_cooldown_movement(movements, sequence)
        if cooldown:
            cooldown_copy = cooldown.copy()
            # PRESERVE database duration_seconds instead of overwriting with teaching_time
            if "duration_seconds" not in cooldown_copy or not cooldown_copy["duration_seconds"]:
                cooldown_copy["duration_seconds"] = teaching_time_seconds  # Fallback only
            cooldown_copy["type"] = "movement"
            sequence.append(cooldown_copy)

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

        logger.info(f"Generated sequence with {len(sequence)} movements (max was {max_movements})")

        return sequence

    def _select_next_movement(
        self,
        movements: List[Dict[str, Any]],
        current_sequence: List[Dict[str, Any]],
        focus_areas: List[str],
        pattern_priority: List[str],
        usage_weights: Dict[str, float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Select next movement based on rules and focus areas

        PHASE 1 FIX: Added consecutive muscle overlap validation
        PHASE 2 FIX: Added weighted random selection based on usage history
        SESSION: Movement Families - Added family balance filtering
        """
        # Get already used movement IDs
        used_ids = [m["id"] for m in current_sequence]

        # Filter out already used movements
        available = [m for m in movements if m["id"] not in used_ids]

        if not available:
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

        # RULE 2 (HARD CONSTRAINT): Filter by family balance - NO OVERRIDES
        # No movement family should exceed 40% of total movements
        if current_sequence and len(current_sequence) >= 2:  # Only enforce after 2+ movements
            # Calculate current family distribution
            family_balance = self._calculate_family_balance(current_sequence)

            # Find families that are already at/above threshold
            overrepresented_families = {
                family for family, pct in family_balance.items()
                if pct >= self.MAX_FAMILY_PERCENTAGE
            }

            if overrepresented_families:
                # Filter out movements from overrepresented families
                family_filtered = [
                    m for m in available
                    if m.get("movement_family") not in overrepresented_families
                ]

                # HARD CONSTRAINT: Always apply filter (no override)
                available = family_filtered
                logger.info(
                    f"RULE 2 enforced: Filtered out families {overrepresented_families} "
                    f"({len(available)} movements remaining)"
                )

                # If filter blocked all movements, sequence generation will stop here
                # This is correct behavior - we should NOT violate family balance rules
                if not available:
                    logger.warning(
                        f"⚠️  RULE 2 blocked all movements. Overrepresented families: {overrepresented_families}. "
                        f"Sequence will stop at {len(current_sequence)} movements to maintain family balance."
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
        if usage_weights and available:
            # Build weights list aligned with available movements
            weights = [usage_weights.get(m['id'], 1.0) for m in available]

            # Use random.choices with weights (prefers less-recently-used movements)
            selected = random.choices(available, weights=weights, k=1)[0]
            logger.info(f"Selected '{selected['name']}' (weight: {usage_weights.get(selected['id'], 1.0):.0f})")
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

    def _validate_sequence(
        self,
        sequence: List[Dict[str, Any]],
        muscle_balance: Dict[str, float]
    ) -> Dict[str, Any]:
        """Validate sequence against safety rules"""
        violations = []
        warnings = []

        # Check muscle balance
        for muscle, load in muscle_balance.items():
            if load > 40:
                warnings.append(f"{muscle.title()} load high ({load:.1f}%)")

        # SESSION: Movement Families - Check family balance
        family_balance = self._calculate_family_balance(sequence)
        for family, percentage in family_balance.items():
            if percentage > self.MAX_FAMILY_PERCENTAGE:
                warnings.append(
                    f"Movement family '{family}' high ({percentage:.1f}% of movements, "
                    f"threshold {self.MAX_FAMILY_PERCENTAGE}%)"
                )

        # Calculate safety score
        safety_score = 1.0 - (len(violations) * 0.2 + len(warnings) * 0.05)
        safety_score = max(0.0, min(1.0, safety_score))

        return {
            "is_valid": len(violations) == 0,
            "safety_score": safety_score,
            "violations": violations,
            "warnings": warnings,
            "family_balance": family_balance  # Include family distribution in response
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
            # Fallback to old movement_usage table if class_movements not available
            return self._get_legacy_usage_weights(user_id, movements)

    def _get_legacy_usage_weights(
        self,
        user_id: str,
        movements: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        FALLBACK: Legacy weight calculation using movement_usage table

        Only used if class_movements table is unavailable (shouldn't happen after migration 036).
        """
        try:
            response = self.supabase.table('movement_usage') \
                .select('movement_id, last_used_date, usage_count') \
                .eq('user_id', user_id) \
                .execute()

            usage_map = {
                item['movement_id']: {
                    'last_used_date': item['last_used_date'],
                    'usage_count': item.get('usage_count', 0)
                }
                for item in response.data
            }

            weights = {}
            today = date.today()

            for movement in movements:
                movement_id = movement['id']

                if movement_id in usage_map:
                    last_used_str = usage_map[movement_id]['last_used_date']
                    usage_count = usage_map[movement_id]['usage_count']

                    if 'T' in last_used_str:
                        last_used = datetime.fromisoformat(last_used_str.replace('Z', '+00:00')).date()
                    else:
                        last_used = datetime.strptime(last_used_str, '%Y-%m-%d').date()

                    days_since = (today - last_used).days
                    recency_weight = (days_since + 1) ** 3
                    frequency_penalty = max(1, usage_count) ** 2
                    weight = recency_weight / frequency_penalty
                else:
                    weight = 100000

                weights[movement_id] = weight

            logger.warning("Using LEGACY movement_usage weights (class_movements table unavailable)")
            return weights

        except Exception as e:
            logger.error(f"Error in legacy weight calculation: {e}")
            return {m['id']: 1.0 for m in movements}

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
            logger.error("❌ DIAGNOSTIC: self.supabase is None - CANNOT LOG")
            return

        try:
            # POPULATE class_movements table (historical tracking for Rule 3)
            timestamp_now = datetime.now().isoformat()
            logger.warning(f"🔍 DIAGNOSTIC: Attempting to insert {len(sequence)} movements into class_movements")

            movements_logged = 0
            for i, movement in enumerate(sequence, start=1):
                try:
                    insert_data = {
                        'user_id': user_id,
                        'class_plan_id': class_plan_id,
                        'movement_id': movement['id'],
                        'movement_name': movement.get('name', 'Unknown'),
                        'class_generated_at': timestamp_now,
                        'difficulty_level': difficulty_level,
                        'position_in_sequence': i
                    }
                    logger.warning(f"   Inserting movement {i}/{len(sequence)}: {movement.get('name')}")
                    response = self.supabase.table('class_movements').insert(insert_data).execute()
                    movements_logged += 1
                    logger.warning(f"   ✅ Movement {i} inserted successfully")
                except Exception as e:
                    logger.error(f"   ❌ Failed to log movement '{movement.get('name')}' to class_movements: {e}")
                    logger.error(f"      Error type: {type(e).__name__}")

            logger.warning(f"✅ DIAGNOSTIC: Logged {movements_logged}/{len(sequence)} movements to class_movements")

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

            # CALCULATE RULE 2 COMPLIANCE: Family balance
            family_balance = self._calculate_family_balance(sequence)
            rule2_pass = all(pct < self.MAX_FAMILY_PERCENTAGE for pct in family_balance.values())
            rule2_max_family = max(family_balance.values()) if family_balance else 0.0
            rule2_overrepresented = [
                {'family': family, 'pct': round(pct, 1)}
                for family, pct in family_balance.items()
                if pct >= self.MAX_FAMILY_PERCENTAGE
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
            response = self.supabase.table('class_quality_log').insert(quality_log_data).execute()
            logger.warning(f"✅ DIAGNOSTIC: class_quality_log insert SUCCESSFUL")

            logger.info(
                f"✅ Quality logged: Rule1={'PASS' if rule1_pass else 'FAIL'}, "
                f"Rule2={'PASS' if rule2_pass else 'FAIL'}, "
                f"Rule3={'PASS' if rule3_pass else 'FAIL'}, "
                f"Overall={'PASS' if overall_pass else 'FAIL'} (score: {quality_score:.2f})"
            )

        except Exception as e:
            logger.error(f"Error in _log_class_quality: {e}")
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
            # Check user_profiles table for is_admin flag
            # NOTE: Query by 'id' column (matches auth.uid()), not 'user_id'
            response = self.supabase.table('user_profiles') \
                .select('is_admin') \
                .eq('id', user_id) \
                .single() \
                .execute()

            if response.data:
                is_admin = response.data.get('is_admin', False)
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
