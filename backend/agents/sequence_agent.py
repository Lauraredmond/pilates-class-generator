"""
Sequence Agent - Generates safe and effective Pilates movement sequences
Integrates MCP research for enhanced cues and modifications
"""

import random
from typing import Dict, Any, List, Optional
from loguru import logger

from agents.base_agent import BaseAgent
from services.mcp_client import mcp_client
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()


class SequenceAgent(BaseAgent):
    """
    Agent for generating Pilates movement sequences
    Enforces safety rules and muscle balance
    """

    # Safety-critical sequencing rules
    SAFETY_RULES = {
        "must_warmup": "Classes must start with breathing and gentle movements",
        "spinal_progression": "Flexion movements must precede extension movements",
        "muscle_balance": "No muscle group should exceed 40% of total class load",
        "complexity_progression": "Difficulty should progress gradually",
        "must_cooldown": "Classes must end with stretching and breathing",
        "teaching_time": "Students need 3-5 minutes per movement for proper instruction"
    }

    # Teaching time per movement (in minutes) - CRITICAL QUALITY RULE
    MINUTES_PER_MOVEMENT = {
        "Beginner": 4,      # Beginners need more explanation and practice time
        "Intermediate": 5,  # Intermediate students can move faster
        "Advanced": 6       # Advanced students perfect form, not rush
    }

    # Transition time between movements (in minutes)
    TRANSITION_TIME_MINUTES = 1  # Average transition time based on setup position changes

    # Movement patterns for sequencing
    MOVEMENT_PATTERNS = {
        "warmup": ["Breathing", "Pelvic Tilts", "Gentle Mobilization"],
        "flexion": ["The Hundred", "Roll Up", "Roll Over", "Single Leg Stretch"],
        "extension": ["Swan Dive", "Swimming", "Single Leg Kick"],
        "rotation": ["The Saw", "Spine Twist", "Corkscrew"],
        "lateral": ["Side Bend", "Side Kick Series"],
        "balance": ["Rolling Like a Ball", "Open Leg Rocker", "Teaser"]
    }

    def __init__(
        self,
        model_name: str = "gpt-3.5-turbo",
        strictness_level: str = "guided"
    ):
        super().__init__(
            agent_type="sequence",
            model_name=model_name,
            strictness_level=strictness_level
        )

        # Initialize Supabase for movement data
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        self.supabase = create_client(supabase_url, supabase_key)

        # MCP client for research
        self.mcp = mcp_client

    def _validate_inputs(self, inputs: Dict[str, Any]) -> None:
        """Validate sequence generation inputs"""
        if "target_duration_minutes" not in inputs:
            raise ValueError("target_duration_minutes is required")

        duration = inputs["target_duration_minutes"]
        if not (15 <= duration <= 120):
            raise ValueError("Duration must be between 15 and 120 minutes")

        valid_difficulties = ["Beginner", "Intermediate", "Advanced"]
        difficulty = inputs.get("difficulty_level", "Beginner")
        if difficulty not in valid_difficulties:
            raise ValueError(f"Difficulty must be one of {valid_difficulties}")

    async def _process_internal(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Generate movement sequence"""
        target_duration = inputs["target_duration_minutes"]
        difficulty = inputs.get("difficulty_level", "Beginner")
        focus_areas = inputs.get("focus_areas", [])
        required_movements = inputs.get("required_movements", [])
        excluded_movements = inputs.get("excluded_movements", [])
        include_mcp = inputs.get("include_mcp_research", True)

        logger.info(
            f"Generating {difficulty} sequence for {target_duration} minutes | "
            f"Focus: {focus_areas}"
        )

        # Step 1: Get available movements from database
        available_movements = await self._get_available_movements(
            difficulty=difficulty,
            excluded_ids=excluded_movements
        )

        # Step 2: Build sequence following safety rules
        sequence = await self._build_safe_sequence(
            movements=available_movements,
            target_duration=target_duration,
            required_movements=required_movements,
            focus_areas=focus_areas,
            difficulty=difficulty
        )

        # Step 2.5: Add transitions between movements
        sequence_with_transitions = await self._add_transitions_to_sequence(sequence)

        # Step 3: Calculate muscle balance (use movements only, not transitions)
        muscle_balance = self._calculate_muscle_balance(sequence)

        # Step 4: Validate sequence against safety rules
        validation = self._validate_sequence(sequence, muscle_balance)

        # Step 4.5: Generate LLM-based narrative variations for teaching cues
        await self._enhance_narrative_variations(sequence_with_transitions)

        # Step 5: Enhance with MCP research if requested
        mcp_enhancements = None
        if include_mcp and self.strictness_level in ["guided", "autonomous"]:
            mcp_enhancements = await self._enhance_with_mcp(sequence)

        # Calculate counts
        movements_only = [item for item in sequence_with_transitions if item.get("type") == "movement"]
        transitions_only = [item for item in sequence_with_transitions if item.get("type") == "transition"]

        # Calculate total duration (movements + transitions)
        total_duration_seconds = sum(item.get("duration_seconds") or 60 for item in sequence_with_transitions)

        # PHASE 2: Track movement usage for intelligent variety
        user_id = inputs.get("user_id")  # Optional - passed from API layer
        if user_id:
            try:
                await self._update_movement_usage(user_id=user_id, sequence=sequence)
                logger.info("PHASE 2: Movement usage tracking complete")
            except Exception as e:
                logger.warning(f"Movement usage tracking failed (non-critical): {e}")

            # Also save to class_history for analytics
            try:
                await self._save_class_history(
                    user_id=user_id,
                    sequence=sequence_with_transitions,
                    duration_minutes=total_duration_seconds // 60,
                    difficulty=inputs.get("difficulty_level", "Beginner"),
                    muscle_balance=muscle_balance
                )
                logger.info("Class history saved for analytics")
            except Exception as e:
                logger.warning(f"Class history tracking failed (non-critical): {e}")

        return {
            "sequence": sequence_with_transitions,  # Return sequence WITH transitions
            "movement_count": len(movements_only),  # Count only movements
            "transition_count": len(transitions_only),  # Count only transitions
            "total_items": len(sequence_with_transitions),  # Total items in sequence
            "total_duration_minutes": total_duration_seconds // 60,
            "muscle_balance": muscle_balance,
            "validation": validation,
            "mcp_enhancements": mcp_enhancements
        }

    async def _get_available_movements(
        self,
        difficulty: str,
        excluded_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Fetch available movements from database with all teaching data"""
        try:
            # Get movements at or below requested difficulty
            difficulty_order = ["Beginner", "Intermediate", "Advanced"]
            max_level_idx = difficulty_order.index(difficulty)
            allowed_levels = difficulty_order[:max_level_idx + 1]

            # Query database - get all fields including narrative, setup_position, watch_out_points
            response = self.supabase.table('movements') \
                .select('*') \
                .in_('difficulty_level', allowed_levels) \
                .execute()

            movements = response.data

            # Filter out excluded movements
            if excluded_ids:
                movements = [m for m in movements if m['id'] not in excluded_ids]

            # Enrich each movement with teaching_cues and muscle_groups
            for movement in movements:
                # Fetch teaching cues
                movement['teaching_cues'] = await self._get_teaching_cues(movement['id'])

                # Fetch muscle groups
                movement['muscle_groups'] = await self._get_muscle_groups(movement['id'])

            logger.info(f"Found {len(movements)} available movements with teaching data")
            return movements

        except Exception as e:
            logger.error(f"Error fetching movements: {e}")
            return []

    async def _get_teaching_cues(self, movement_id: str) -> List[Dict[str, Any]]:
        """Fetch teaching cues for a specific movement"""
        try:
            response = self.supabase.table('teaching_cues') \
                .select('cue_type, cue_text, cue_order, is_primary') \
                .eq('movement_id', movement_id) \
                .order('cue_order') \
                .execute()

            return response.data if response.data else []

        except Exception as e:
            logger.error(f"Error fetching teaching cues for movement {movement_id}: {e}")
            return []

    async def _get_muscle_groups(self, movement_id: str) -> List[Dict[str, Any]]:
        """Fetch muscle groups for a specific movement"""
        try:
            response = self.supabase.table('movement_muscles') \
                .select('muscle_group_name, is_primary') \
                .eq('movement_id', movement_id) \
                .execute()

            # Build muscle groups list from the simplified schema
            muscle_groups = []
            for mm in response.data:
                muscle_groups.append({
                    'name': mm.get('muscle_group_name', ''),
                    'category': None,  # Not in current schema
                    'is_primary': mm.get('is_primary', True)
                })

            return muscle_groups

        except Exception as e:
            logger.error(f"Error fetching muscle groups for movement {movement_id}: {e}")
            return []

    async def _build_safe_sequence(
        self,
        movements: List[Dict[str, Any]],
        target_duration: int,
        required_movements: List[str],
        focus_areas: List[str],
        difficulty: str = "Beginner"
    ) -> List[Dict[str, Any]]:
        """Build sequence following safety rules"""
        sequence = []

        # CRITICAL QUALITY RULE: Calculate max movements based on teaching time + transitions
        # Students need 4-6 minutes per movement (varies by difficulty)
        # Plus ~1 minute for each transition between movements
        minutes_per_movement = self.MINUTES_PER_MOVEMENT.get(difficulty, 4)
        transition_time = self.TRANSITION_TIME_MINUTES

        # Store teaching time for use when setting movement durations
        teaching_time_seconds = minutes_per_movement * 60

        # Calculate: (target_duration) = (num_movements * time_per_movement) + ((num_movements - 1) * transition_time)
        # Solving for num_movements: num_movements = (target_duration + transition_time) / (time_per_movement + transition_time)
        max_movements = int((target_duration + transition_time) / (minutes_per_movement + transition_time))

        logger.info(
            f"Building sequence: {target_duration} min / ({minutes_per_movement} min/movement + {transition_time} min/transition) "
            f"= max {max_movements} movements"
        )

        # Rule 1: Always start with warmup
        warmup = self._get_warmup_movement(movements)
        if warmup:
            # Override duration to teaching time
            warmup_copy = warmup.copy()
            warmup_copy["duration_seconds"] = teaching_time_seconds
            warmup_copy["type"] = "movement"  # Mark as movement
            sequence.append(warmup_copy)

        # Rule 2: Add required movements if specified
        if required_movements:
            for movement_id in required_movements:
                movement = next((m for m in movements if m["id"] == movement_id), None)
                if movement and len(sequence) < max_movements - 1:  # Save room for cooldown
                    # Override duration to teaching time
                    movement_copy = movement.copy()
                    movement_copy["duration_seconds"] = teaching_time_seconds
                    movement_copy["type"] = "movement"  # Mark as movement
                    sequence.append(movement_copy)

        # Rule 3: Fill to max movements with balanced movements
        # Priority: Flexion -> Rotation -> Extension -> Lateral -> Balance
        pattern_order = ["flexion", "rotation", "extension", "lateral", "balance"]

        # Leave room for cooldown
        while len(sequence) < (max_movements - 1):
            # Pick movement based on pattern order and focus areas
            selected = self._select_next_movement(
                movements=movements,
                current_sequence=sequence,
                focus_areas=focus_areas,
                pattern_priority=pattern_order
            )

            if not selected:
                break

            # Override duration to teaching time
            selected_copy = selected.copy()
            selected_copy["duration_seconds"] = teaching_time_seconds
            selected_copy["type"] = "movement"  # Mark as movement
            sequence.append(selected_copy)

        # Rule 4: Always end with cooldown
        cooldown = self._get_cooldown_movement(movements, sequence)
        if cooldown:
            # Override duration to teaching time
            cooldown_copy = cooldown.copy()
            cooldown_copy["duration_seconds"] = teaching_time_seconds
            cooldown_copy["type"] = "movement"  # Mark as movement
            sequence.append(cooldown_copy)

        logger.info(f"Generated sequence with {len(sequence)} movements (max was {max_movements})")

        return sequence

    def _get_warmup_movement(self, movements: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Get appropriate warmup movement with ROTATION for variety

        PHASE 1 FIX: Rotate warmup movements instead of always using "The Hundred"
        """
        if not movements:
            return None

        warmup_keywords = ["hundred", "breathing", "pelvic"]
        warmup_movements = [
            m for m in movements
            if any(kw in m["name"].lower() for kw in warmup_keywords)
        ]

        # PHASE 1 FIX: Use random.choice() to rotate warmup movements
        # This fixes the issue where 100% of classes started with "The Hundred"
        if warmup_movements:
            selected = random.choice(warmup_movements)
            logger.info(f"Selected warmup movement: {selected['name']}")
            return selected

        return movements[0] if movements else None

    def _get_cooldown_movement(self, movements: List[Dict[str, Any]], current_sequence: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Get appropriate cooldown movement"""
        if not movements:
            return None

        # Get already used movement IDs
        used_ids = [m["id"] for m in current_sequence]

        # Filter to unused movements only
        available = [m for m in movements if m["id"] not in used_ids]
        if not available:
            return None

        cooldown_keywords = ["seal", "breathing", "stretch"]
        cooldown_movements = [
            m for m in available
            if any(kw in m["name"].lower() for kw in cooldown_keywords)
        ]
        return cooldown_movements[0] if cooldown_movements else available[-1]

    def _select_next_movement(
        self,
        movements: List[Dict[str, Any]],
        current_sequence: List[Dict[str, Any]],
        focus_areas: List[str],
        pattern_priority: List[str]
    ) -> Optional[Dict[str, Any]]:
        """
        Select next movement based on rules and focus areas

        PHASE 1 FIX: Added consecutive muscle overlap validation
        """
        # Get already used movement IDs
        used_ids = [m["id"] for m in current_sequence]

        # Filter out already used movements
        available = [m for m in movements if m["id"] not in used_ids]

        if not available:
            return None

        # PHASE 1 FIX: Filter out movements with high consecutive muscle overlap
        # Get previous movement's muscles (if exists)
        if current_sequence:
            prev_movement = current_sequence[-1]
            prev_muscles = set(mg['name'] for mg in prev_movement.get('muscle_groups', []))

            if prev_muscles:
                # Filter available movements to avoid >50% muscle overlap
                filtered_available = []
                for candidate in available:
                    candidate_muscles = set(mg['name'] for mg in candidate.get('muscle_groups', []))

                    if candidate_muscles:
                        overlap = prev_muscles & candidate_muscles
                        overlap_pct = (len(overlap) / len(candidate_muscles)) * 100 if candidate_muscles else 0

                        # Only keep candidates with <50% overlap
                        if overlap_pct < 50:
                            filtered_available.append(candidate)
                        else:
                            logger.debug(
                                f"Skipping {candidate['name']} due to {overlap_pct:.1f}% muscle overlap with {prev_movement['name']}"
                            )

                # If we filtered out everything, fall back to original available list
                # (Better to have some overlap than no movement)
                if filtered_available:
                    available = filtered_available
                    logger.info(f"Filtered to {len(available)} movements with <50% consecutive muscle overlap")

        # If focus areas specified, prefer those
        if focus_areas:
            focused = [
                m for m in available
                if any(area.lower() in str(m.get("category", "")).lower() for area in focus_areas)
            ]
            if focused:
                return random.choice(focused)

        # Otherwise, pick randomly from available
        return random.choice(available)

    async def _add_transitions_to_sequence(self, sequence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add transition narratives between movements based on setup positions"""
        if not sequence or len(sequence) < 2:
            return sequence

        sequence_with_transitions = []

        try:
            # Get all transitions from database
            transitions_response = self.supabase.table('transitions') \
                .select('from_position, to_position, narrative') \
                .execute()

            transitions_map = {
                (t['from_position'], t['to_position']): t['narrative']
                for t in transitions_response.data
            }

            for i, movement in enumerate(sequence):
                # Add the movement
                sequence_with_transitions.append(movement)

                # Add transition if there's a next movement
                if i < len(sequence) - 1:
                    from_position = movement.get('setup_position', 'Unknown')
                    to_position = sequence[i + 1].get('setup_position', 'Unknown')

                    # Get transition narrative from database
                    transition_key = (from_position, to_position)
                    narrative = transitions_map.get(
                        transition_key,
                        f"Transition from {from_position} to {to_position} position with control."
                    )

                    # Add transition item to sequence
                    transition_item = {
                        "type": "transition",
                        "from_position": from_position,
                        "to_position": to_position,
                        "narrative": narrative,
                        "duration_seconds": 60,  # 1 minute transition time
                        "name": f"Transition: {from_position} → {to_position}"
                    }

                    sequence_with_transitions.append(transition_item)

            logger.info(f"Added {len(sequence) - 1} transitions to sequence")

        except Exception as e:
            logger.error(f"Error adding transitions: {e}")
            # Return original sequence if transition fetch fails
            return sequence

        return sequence_with_transitions

    def _calculate_muscle_balance(self, sequence: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate muscle group usage across sequence using database muscle mappings"""
        muscle_load = {}

        try:
            # Get total duration for percentage calculation
            total_duration = sum(m.get("duration_seconds") or 60 for m in sequence)

            # Get movement IDs
            movement_ids = [m["id"] for m in sequence]

            if not movement_ids:
                return muscle_load

            # Query movement_muscles table (simplified schema with muscle_group_name)
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

            logger.info(f"Calculated muscle balance from {len(movement_ids)} movements: {list(muscle_load.keys())}")

        except Exception as e:
            logger.error(f"Error calculating muscle balance: {e}")
            # Return empty dict if database query fails
            muscle_load = {}

        return muscle_load

    def _validate_sequence(
        self,
        sequence: List[Dict[str, Any]],
        muscle_balance: Dict[str, float]
    ) -> Dict[str, Any]:
        """Validate sequence against safety rules"""
        violations = []
        warnings = []

        # Check Rule 1: Has warmup
        if not sequence or "hundred" not in sequence[0]["name"].lower():
            if self.strictness_level == "strict":
                violations.append("Must start with warmup movement")
            else:
                warnings.append("Consider starting with warmup")

        # Check Rule 3: Muscle balance
        for muscle, load in muscle_balance.items():
            if load > 40:
                if self.strictness_level == "strict":
                    violations.append(f"{muscle.title()} overworked ({load:.1f}%)")
                else:
                    warnings.append(f"{muscle.title()} load high ({load:.1f}%)")

        # Calculate safety score
        safety_score = 1.0 - (len(violations) * 0.2 + len(warnings) * 0.05)
        safety_score = max(0.0, min(1.0, safety_score))

        return {
            "is_valid": len(violations) == 0,
            "safety_score": safety_score,
            "violations": violations,
            "warnings": warnings
        }

    async def _enhance_narrative_variations(self, sequence: List[Dict[str, Any]]) -> None:
        """
        Use LLM to generate narrative variations for teaching cues
        Modifies sequence in-place with varied phrasing
        """
        try:
            for item in sequence:
                if item.get("type") != "movement":
                    continue  # Skip transitions

                # Vary teaching cues
                if item.get("teaching_cues") and len(item["teaching_cues"]) > 0:
                    cue_texts = [cue.get("cue_text", "") for cue in item["teaching_cues"]]
                    if any(cue_texts):
                        varied_cues = await self.generate_narrative_variations(
                            texts=cue_texts,
                            variation_type="cue"
                        )
                        # Update cues with varied text
                        for i, varied_text in enumerate(varied_cues):
                            if i < len(item["teaching_cues"]):
                                item["teaching_cues"][i]["cue_text"] = varied_text

                # Vary setup position description
                if item.get("setup_position"):
                    varied_setup = await self.generate_narrative_variations(
                        texts=[f"Begin in {item['setup_position']} position"],
                        variation_type="setup"
                    )
                    if varied_setup:
                        # Store as a new field so frontend can use it
                        item["setup_instruction"] = varied_setup[0]

                # Vary muscle group descriptions
                if item.get("muscle_groups") and len(item["muscle_groups"]) > 0:
                    primary_muscles = [
                        mg.get("name", "")
                        for mg in item["muscle_groups"]
                        if mg.get("is_primary", True)
                    ]
                    if primary_muscles:
                        muscle_description = f"This movement targets your {', '.join(primary_muscles)}"
                        varied_muscle = await self.generate_narrative_variations(
                            texts=[muscle_description],
                            variation_type="muscle"
                        )
                        if varied_muscle:
                            # Store as a new field
                            item["muscle_description"] = varied_muscle[0]

            logger.info(f"Enhanced {len([i for i in sequence if i.get('type') == 'movement'])} movements with LLM narrative variations")

        except Exception as e:
            logger.warning(f"LLM narrative variation failed: {e}. Using original text.")

    async def _enhance_with_mcp(self, sequence: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Enhance sequence with MCP web research"""
        enhancements = {}

        try:
            # Research cues for key movements
            key_movements = sequence[:3]  # Research first 3 movements

            for movement in key_movements:
                cues = await self.mcp.search_movement_cues(
                    movement_name=movement["name"],
                    trusted_sites_only=True
                )
                enhancements[movement["id"]] = cues

            logger.info(f"Enhanced {len(enhancements)} movements with MCP research")

        except Exception as e:
            logger.warning(f"MCP enhancement failed: {e}")

        return enhancements

    def _calculate_confidence(self, output_data: Dict[str, Any]) -> float:
        """Calculate confidence based on validation and muscle balance"""
        validation = output_data.get("validation", {})
        safety_score = validation.get("safety_score", 0.5)

        muscle_balance = output_data.get("muscle_balance", {})
        balance_score = self._calculate_balance_score(muscle_balance)

        # Weighted average
        confidence = (safety_score * 0.6) + (balance_score * 0.4)

        return round(confidence, 2)

    def _calculate_balance_score(self, muscle_balance: Dict[str, float]) -> float:
        """Calculate how balanced the muscle usage is"""
        if not muscle_balance:
            return 0.5

        loads = list(muscle_balance.values())
        avg_load = sum(loads) / len(loads) if loads else 0

        # Calculate variance from average
        variance = sum((load - avg_load) ** 2 for load in loads) / len(loads) if loads else 0

        # Convert variance to score (lower variance = higher score)
        balance_score = max(0.0, 1.0 - (variance / 1000))

        return balance_score

    def _generate_reasoning(
        self,
        inputs: Dict[str, Any],
        output_data: Dict[str, Any]
    ) -> str:
        """Generate human-readable explanation"""
        movement_count = output_data.get("movement_count", 0)
        transition_count = output_data.get("transition_count", 0)
        validation = output_data.get("validation", {})
        muscle_balance = output_data.get("muscle_balance", {})

        reasoning_parts = [
            f"Generated {movement_count} movements with {transition_count} transitions for {inputs.get('difficulty_level', 'Beginner')} level.",
            f"Total duration: {output_data.get('total_duration_minutes', 0)} minutes.",
            f"Safety score: {validation.get('safety_score', 0):.2f}."
        ]

        # Add balance information
        top_muscles = sorted(muscle_balance.items(), key=lambda x: x[1], reverse=True)[:3]
        if top_muscles:
            muscle_str = ", ".join([f"{m[0]}: {m[1]:.1f}%" for m in top_muscles])
            reasoning_parts.append(f"Primary muscle focus: {muscle_str}.")

        # Add violations/warnings
        if validation.get("violations"):
            reasoning_parts.append(f"Violations: {', '.join(validation['violations'])}.")
        if validation.get("warnings"):
            reasoning_parts.append(f"Warnings: {', '.join(validation['warnings'])}.")

        return " ".join(reasoning_parts)

    async def _get_movement_usage_weights(
        self,
        user_id: str,
        movements: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        PHASE 2: Get movement usage weights based on history

        Queries existing movement_usage table to calculate weights.
        Higher weight = prefer this movement (less recently used)
        """
        try:
            from datetime import datetime, date

            # Query movement_usage table for this user
            response = self.supabase.table('movement_usage') \
                .select('movement_id, last_used_date') \
                .eq('user_id', user_id) \
                .execute()

            usage_map = {
                item['movement_id']: item['last_used_date']
                for item in response.data
            }

            # Calculate weights for each movement
            weights = {}
            today = date.today()

            for movement in movements:
                movement_id = movement['id']

                if movement_id in usage_map:
                    # Calculate days since last used
                    last_used_str = usage_map[movement_id]
                    # Handle both date and datetime formats
                    if 'T' in last_used_str:
                        last_used = datetime.fromisoformat(last_used_str.replace('Z', '+00:00')).date()
                    else:
                        last_used = datetime.strptime(last_used_str, '%Y-%m-%d').date()

                    days_since = (today - last_used).days

                    # Weight formula: (days + 1) ^ 2
                    # 1 day ago = 4, 7 days ago = 64, 30 days ago = 961
                    weight = (days_since + 1) ** 2
                else:
                    # Never used before - highest weight
                    weight = 10000

                weights[movement_id] = weight

            logger.info(f"PHASE 2: Calculated usage weights for {len(weights)} movements")
            return weights

        except Exception as e:
            logger.warning(f"Error getting movement usage weights: {e}. Using equal weights.")
            # Return equal weights if error
            return {m['id']: 1.0 for m in movements}

    async def _update_movement_usage(
        self,
        user_id: str,
        sequence: List[Dict[str, Any]]
    ) -> None:
        """
        PHASE 2: Update movement_usage table after generating class

        Tracks which movements were used and when, for variety enforcement.
        Uses existing movement_usage table from database schema.
        """
        try:
            from datetime import date

            # CRITICAL: Ensure user exists in users table (foreign key constraint)
            # This also converts temp user ID to UUID format
            user_uuid = await self._ensure_user_exists(user_id)

            today = date.today()

            # Get movement IDs from sequence (skip transitions)
            movement_ids = [
                item['id']
                for item in sequence
                if item.get('type') == 'movement'
            ]

            for movement_id in movement_ids:
                # Check if record exists
                existing = self.supabase.table('movement_usage') \
                    .select('id, usage_count') \
                    .eq('user_id', user_uuid) \
                    .eq('movement_id', movement_id) \
                    .execute()

                if existing.data and len(existing.data) > 0:
                    # Update existing record
                    current_count = existing.data[0].get('usage_count', 0)
                    self.supabase.table('movement_usage') \
                        .update({
                            'last_used_date': today.isoformat(),
                            'usage_count': current_count + 1
                        }) \
                        .eq('user_id', user_uuid) \
                        .eq('movement_id', movement_id) \
                        .execute()
                else:
                    # Insert new record
                    self.supabase.table('movement_usage') \
                        .insert({
                            'user_id': user_uuid,
                            'movement_id': movement_id,
                            'last_used_date': today.isoformat(),
                            'usage_count': 1
                        }) \
                        .execute()

            logger.info(f"PHASE 2: Updated movement usage for {len(movement_ids)} movements")

        except Exception as e:
            logger.warning(f"Error updating movement usage: {e}. Continuing without tracking.")
            # Don't fail class generation if tracking fails

    def _convert_to_uuid(self, user_id: str) -> str:
        """
        Convert any user_id string to a valid UUID format
        Uses UUID5 (deterministic hashing) so same input always gives same UUID
        """
        import uuid

        # If already a valid UUID, return as-is
        try:
            uuid.UUID(user_id)
            return user_id
        except ValueError:
            pass

        # Convert string to deterministic UUID using namespace
        # This ensures "temp-user-123" always converts to the same UUID
        namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # Standard namespace
        user_uuid = uuid.uuid5(namespace, user_id)
        logger.info(f"Converted '{user_id}' to UUID: {user_uuid}")
        return str(user_uuid)

    async def _ensure_user_exists(self, user_id: str) -> str:
        """
        Ensure user exists in users table (required for foreign key constraints)
        Creates temporary user if doesn't exist
        Returns the UUID version of the user_id
        """
        try:
            # Convert to UUID format
            user_uuid = self._convert_to_uuid(user_id)

            # Check if user exists
            existing = self.supabase.table('users') \
                .select('id') \
                .eq('id', user_uuid) \
                .execute()

            if not existing.data or len(existing.data) == 0:
                # Create temporary user (match actual database schema)
                self.supabase.table('users').insert({
                    'id': user_uuid,
                    'email_token': f"temp-{user_uuid}@bassline.com",  # Schema uses email_token (PII)
                    'full_name_token': 'Temporary User',  # Schema uses full_name_token (PII)
                    'role': 'instructor',
                    'is_active': True
                }).execute()
                logger.info(f"Created temporary user record with UUID: {user_uuid}")

            return user_uuid

        except Exception as e:
            logger.error(f"Error ensuring user exists: {e}")
            raise  # Re-raise because this is critical for FK constraints

    async def _save_class_history(
        self,
        user_id: str,
        sequence: List[Dict[str, Any]],
        duration_minutes: int,
        difficulty: str,
        muscle_balance: Dict[str, float]
    ) -> None:
        """
        Save generated class to class_history table for analytics

        This enables the analytics dashboard to show:
        - Total classes generated
        - Movement frequency over time
        - Muscle group distribution trends
        - User progress tracking
        """
        try:
            from datetime import datetime

            # CRITICAL: Ensure user exists in users table (foreign key constraint)
            # This also converts temp user ID to UUID format
            user_uuid = await self._ensure_user_exists(user_id)

            # Create movements snapshot (serialize for JSONB storage)
            movements_snapshot = [
                {
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'type': item.get('type', 'movement'),
                    'duration_seconds': item.get('duration_seconds'),
                    'muscle_groups': [mg.get('name') for mg in item.get('muscle_groups', [])]
                }
                for item in sequence
            ]

            # Insert into class_history (match actual database schema)
            self.supabase.table('class_history').insert({
                'user_id': user_uuid,
                'taught_date': datetime.now().date().isoformat(),  # Schema uses taught_date
                'actual_duration_minutes': duration_minutes,  # Schema uses actual_duration_minutes
                'movements_snapshot': movements_snapshot,
                'instructor_notes': f"AI-generated {difficulty} class with balanced muscle distribution"
            }).execute()

            logger.info(f"Saved class history for user UUID: {user_uuid}")

        except Exception as e:
            logger.warning(f"Error saving class history: {e}. Analytics may not update.")
            # Don't fail class generation if history save fails

    async def _get_fallback(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Provide safe fallback sequence"""
        # Return a simple, safe beginner sequence
        return {
            "sequence": [
                {"name": "The Hundred", "duration_seconds": 100},
                {"name": "Roll Up", "duration_seconds": 60},
                {"name": "Single Leg Stretch", "duration_seconds": 60},
                {"name": "Spine Stretch Forward", "duration_seconds": 60},
                {"name": "Seal", "duration_seconds": 60}
            ],
            "total_duration_minutes": 6,
            "muscle_balance": {"core": 80, "legs": 10, "back": 10},
            "validation": {
                "is_valid": True,
                "safety_score": 0.9,
                "violations": [],
                "warnings": ["Using fallback sequence"]
            },
            "fallback": True
        }
