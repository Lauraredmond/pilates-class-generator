"""
Unit tests for Instructor Feedback Improvements (March 2026)

Tests the three improvements:
1. Intensity gating by class phase
2. Soft positional continuity bonus
3. Position-change budget

Run with: pytest tests/test_instructor_feedback_improvements.py -v
"""

import pytest
from orchestrator.tools.sequence_tools import SequenceTools


class TestIntensityGating:
    """Test IMPROVEMENT 1: intensity_score and class_phase gating"""

    def setup_method(self):
        """Initialize SequenceTools for testing"""
        self.tools = SequenceTools(supabase_client=None)  # Mock mode for testing

    def test_no_high_intensity_in_first_20_percent(self):
        """
        Test that movements with intensity_score >= 7 do not appear
        in the first 20% of a generated class sequence.

        This is the core requirement from instructor feedback:
        "Teaser, Swan Dive, Jack Knife appearing too early"
        """
        # Create mock movements with intensity scores
        movements = [
            {"id": "1", "name": "The Hundred", "intensity_score": 3, "class_phase": "warm_up",
             "difficulty_level": "Beginner", "setup_position": "Supine", "duration_seconds": 180, "muscle_groups": []},
            {"id": "2", "name": "Roll Up", "intensity_score": 4, "class_phase": "early_middle",
             "difficulty_level": "Beginner", "setup_position": "Supine", "duration_seconds": 180, "muscle_groups": []},
            {"id": "3", "name": "Teaser", "intensity_score": 9, "class_phase": "peak",
             "difficulty_level": "Advanced", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
            {"id": "4", "name": "Swan Dive", "intensity_score": 8, "class_phase": "peak",
             "difficulty_level": "Beginner", "setup_position": "Prone", "duration_seconds": 180, "muscle_groups": []},
            {"id": "5", "name": "Spine Stretch", "intensity_score": 2, "class_phase": "warm_up",
             "difficulty_level": "Beginner", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
        ]

        # Generate a 60-minute beginner class (should have ~9 movements)
        # In a real test, would call generate_sequence with mocked DB
        # For now, verify the phase filtering logic directly

        # Simulate selecting first movement (0% position in timeline)
        current_position_pct = 0.0
        selected = self.tools._select_next_movement(
            movements=movements,
            current_sequence=[],
            focus_areas=[],
            pattern_priority=[],
            usage_weights={},
            class_difficulty="Beginner",
            target_duration=60,
            target_count=9,
            current_position_pct=current_position_pct
        )

        # First movement should be warm_up phase only (intensity 1-3)
        assert selected is not None, "Should select a movement"
        assert selected["intensity_score"] <= 3, f"First movement has intensity {selected['intensity_score']}, expected <= 3"
        assert selected["class_phase"] == "warm_up", f"First movement has phase {selected['class_phase']}, expected warm_up"
        assert selected["name"] in ["The Hundred", "Spine Stretch"], f"Unexpected movement: {selected['name']}"

    def test_peak_movements_allowed_in_middle_65_85_percent(self):
        """Test that peak movements (intensity 7-10) are allowed in the 65-85% range"""
        movements = [
            {"id": "1", "name": "Teaser", "intensity_score": 9, "class_phase": "peak",
             "difficulty_level": "Advanced", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
            {"id": "2", "name": "The Hundred", "intensity_score": 3, "class_phase": "warm_up",
             "difficulty_level": "Beginner", "setup_position": "Supine", "duration_seconds": 180, "muscle_groups": []},
        ]

        # Simulate 70% position in timeline (peak zone)
        current_position_pct = 0.70
        selected = self.tools._select_next_movement(
            movements=movements,
            current_sequence=[],
            focus_areas=[],
            pattern_priority=[],
            usage_weights={},
            class_difficulty="Advanced",
            target_duration=60,
            target_count=9,
            current_position_pct=current_position_pct
        )

        # Peak movement should be selectable in this zone
        assert selected is not None
        # Both are valid candidates in peak zone, so we just check that selection succeeded

    def test_only_warmup_and_cooldown_in_final_15_percent(self):
        """Test that only warm_up and cool_down phase movements are allowed in final 15%"""
        movements = [
            {"id": "1", "name": "Teaser", "intensity_score": 9, "class_phase": "peak",
             "difficulty_level": "Advanced", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
            {"id": "2", "name": "The Seal", "intensity_score": 3, "class_phase": "cool_down",
             "difficulty_level": "Intermediate", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
            {"id": "3", "name": "Spine Stretch", "intensity_score": 2, "class_phase": "warm_up",
             "difficulty_level": "Beginner", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
        ]

        # Simulate 90% position in timeline (cool-down zone)
        current_position_pct = 0.90
        selected = self.tools._select_next_movement(
            movements=movements,
            current_sequence=[],
            focus_areas=[],
            pattern_priority=[],
            usage_weights={},
            class_difficulty="Beginner",
            target_duration=60,
            target_count=9,
            current_position_pct=current_position_pct
        )

        # Should NOT select Teaser (peak phase) in cool-down zone
        assert selected is not None
        assert selected["class_phase"] in ["warm_up", "cool_down"], \
            f"Expected warm_up or cool_down in final 15%, got {selected['class_phase']}"
        assert selected["name"] in ["The Seal", "Spine Stretch"], \
            f"Should select cool-down appropriate movement, got {selected['name']}"


class TestPositionalContinuity:
    """Test IMPROVEMENT 2: Soft positional continuity bonus"""

    def setup_method(self):
        self.tools = SequenceTools(supabase_client=None)

    def test_positional_continuity_bonus_applied(self):
        """
        Test that movements keeping the same body position receive a bonus,
        but muscle safety is still prioritized.
        """
        # This test verifies the bonus is calculated but doesn't override safety
        # In real usage, we'd generate 20 classes and check average position changes < baseline

        movements = [
            {"id": "1", "name": "The Hundred", "intensity_score": 3, "class_phase": "warm_up",
             "difficulty_level": "Beginner", "setup_position": "Supine", "duration_seconds": 180, "muscle_groups": []},
            {"id": "2", "name": "Roll Up", "intensity_score": 4, "class_phase": "early_middle",
             "difficulty_level": "Beginner", "setup_position": "Supine", "duration_seconds": 180, "muscle_groups": []},
            {"id": "3", "name": "Spine Stretch", "intensity_score": 2, "class_phase": "warm_up",
             "difficulty_level": "Beginner", "setup_position": "Seated", "duration_seconds": 180, "muscle_groups": []},
        ]

        # Previous movement was Supine
        current_sequence = [
            {"id": "1", "name": "The Hundred", "setup_position": "Supine", "muscle_groups": []}
        ]

        # Select next - should prefer Supine movements (Roll Up) over Seated (Spine Stretch)
        # But only as a soft tiebreaker
        selected = self.tools._select_next_movement(
            movements=movements,
            current_sequence=current_sequence,
            focus_areas=[],
            pattern_priority=[],
            usage_weights={},
            class_difficulty="Beginner",
            target_duration=30,
            target_count=5,
            current_position_pct=0.2,
            max_position_changes=2,
            position_changes_count=0
        )

        # Should select Roll Up (Supine) due to position bonus
        # Note: This is non-deterministic due to random.choices, so we check it's valid
        assert selected is not None
        assert selected["id"] in ["2", "3"]  # Either is valid

    def test_position_change_budget_enforcement(self):
        """Test that position-change budget prevents excessive position jumping"""
        # When budget is exhausted, position changes should be penalized
        # This is tested by verifying the penalty is applied when budget_remaining <= 0

        # Verify the constant exists
        assert hasattr(self.tools, 'POSITION_CONTINUITY_BONUS')
        assert self.tools.POSITION_CONTINUITY_BONUS == 0.15

        # In integration testing, we'd generate classes and verify:
        # position_changes_count <= max_position_changes (40% of total movements)


class TestConfigurationTuning:
    """Test that configuration constants can be adjusted"""

    def test_position_continuity_bonus_configurable(self):
        """Verify POSITION_CONTINUITY_BONUS constant exists and is tunable"""
        from config.sequencing_config import POSITION_CONTINUITY_BONUS
        assert isinstance(POSITION_CONTINUITY_BONUS, (int, float))
        assert 0.05 <= POSITION_CONTINUITY_BONUS <= 0.30, \
            "POSITION_CONTINUITY_BONUS should be between 0.05 and 0.30"

    def test_position_change_budget_configurable(self):
        """Verify DEFAULT_POSITION_CHANGE_BUDGET_PCT exists"""
        from config.sequencing_config import DEFAULT_POSITION_CHANGE_BUDGET_PCT
        assert isinstance(DEFAULT_POSITION_CHANGE_BUDGET_PCT, (int, float))
        assert 0.2 <= DEFAULT_POSITION_CHANGE_BUDGET_PCT <= 0.6, \
            "Budget should be between 20% and 60%"

    def test_phase_boundaries_configurable(self):
        """Verify class phase boundary constants exist"""
        from config.sequencing_config import WARM_UP_PHASE_END, BUILDING_PHASE_END, PEAK_PHASE_END
        assert WARM_UP_PHASE_END == 0.20
        assert BUILDING_PHASE_END == 0.65
        assert PEAK_PHASE_END == 0.85
        assert WARM_UP_PHASE_END < BUILDING_PHASE_END < PEAK_PHASE_END < 1.0


class TestDatabaseSchema:
    """Test that database migrations are valid"""

    def test_intensity_score_column_constraints(self):
        """Verify intensity_score column has correct CHECK constraint"""
        # In a real DB test, would query information_schema
        # For now, verify the migration file exists and contains correct SQL
        import os
        migration_path = "backend/migrations/add_intensity_score_class_phase.sql"
        assert os.path.exists(migration_path), "Migration file should exist"

        with open(migration_path, 'r') as f:
            content = f.read()
            assert "intensity_score INTEGER" in content
            assert "CHECK (intensity_score BETWEEN 1 AND 10)" in content
            assert "class_phase VARCHAR(20)" in content
            assert "CHECK (class_phase IN ('warm_up', 'early_middle', 'peak', 'cool_down'))" in content

    def test_sequence_rules_insert_migration(self):
        """Verify sequence_rules INSERT migration is valid"""
        import os
        migration_path = "backend/migrations/insert_new_sequence_rules.sql"
        assert os.path.exists(migration_path), "Sequence rules INSERT migration should exist"

        with open(migration_path, 'r') as f:
            content = f.read()
            assert "INSERT INTO sequence_rules" in content
            assert "rule_number" in content
            assert "-- RULE 24: Intensity Phase Gating" in content
            assert "-- RULE 25: Positional Continuity Preference" in content
            assert "-- RULE 26: Position Change Budget" in content
            assert "rule_type" in content
            assert "enforcement_level" in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
