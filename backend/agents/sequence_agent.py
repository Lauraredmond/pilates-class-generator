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

        # Step 5: Enhance with MCP research if requested
        mcp_enhancements = None
        if include_mcp and self.strictness_level in ["guided", "autonomous"]:
            mcp_enhancements = await self._enhance_with_mcp(sequence)

        # Calculate counts
        movements_only = [item for item in sequence_with_transitions if item.get("type") == "movement"]
        transitions_only = [item for item in sequence_with_transitions if item.get("type") == "transition"]

        # Calculate total duration (movements + transitions)
        total_duration_seconds = sum(item.get("duration_seconds") or 60 for item in sequence_with_transitions)

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
        """Fetch available movements from database"""
        try:
            # Get movements at or below requested difficulty
            difficulty_order = ["Beginner", "Intermediate", "Advanced"]
            max_level_idx = difficulty_order.index(difficulty)
            allowed_levels = difficulty_order[:max_level_idx + 1]

            # Query database
            response = self.supabase.table('movements') \
                .select('*') \
                .in_('difficulty_level', allowed_levels) \
                .execute()

            movements = response.data

            # Filter out excluded movements
            if excluded_ids:
                movements = [m for m in movements if m['id'] not in excluded_ids]

            logger.info(f"Found {len(movements)} available movements")
            return movements

        except Exception as e:
            logger.error(f"Error fetching movements: {e}")
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
        """Get appropriate warmup movement"""
        if not movements:
            return None
        warmup_keywords = ["hundred", "breathing", "pelvic"]
        warmup_movements = [
            m for m in movements
            if any(kw in m["name"].lower() for kw in warmup_keywords)
        ]
        return warmup_movements[0] if warmup_movements else movements[0]

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
        """Select next movement based on rules and focus areas"""
        # Get already used movement IDs
        used_ids = [m["id"] for m in current_sequence]

        # Filter out already used movements
        available = [m for m in movements if m["id"] not in used_ids]

        if not available:
            return None

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

            # Query movement_muscles and muscle_groups tables
            response = self.supabase.table('movement_muscles') \
                .select('movement_id, muscle_group_id, muscle_groups(name)') \
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
                    muscle_name = mm["muscle_groups"]["name"]
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
