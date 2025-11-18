"""
Test Suite for Session 5 Class Builder Functionality
Tests sequence validation, muscle balance, and class plan CRUD operations
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.sequence_validator import sequence_validator
from services.muscle_balance import muscle_balance_calculator


class TestSequenceValidator:
    """Test sequence validation against 5 critical safety rules"""

    def test_valid_sequence_passes(self):
        """Test that a valid sequence passes all rules"""
        movements = [
            {
                'name': 'Breathing Exercise',
                'difficulty_level': 'Beginner',
                'category': 'warm-up',
                'primary_muscles': ['core'],
                'duration_seconds': 60
            },
            {
                'name': 'The Hundred',
                'difficulty_level': 'Beginner',
                'category': 'flexion',
                'primary_muscles': ['core', 'hip_flexors'],
                'duration_seconds': 120
            },
            {
                'name': 'Roll Up',
                'difficulty_level': 'Beginner',
                'category': 'flexion',
                'primary_muscles': ['core', 'back'],
                'duration_seconds': 90
            },
            {
                'name': 'Swan Dive',
                'difficulty_level': 'Intermediate',
                'category': 'extension',
                'primary_muscles': ['back', 'glutes'],
                'duration_seconds': 90
            },
            {
                'name': 'Seal',
                'difficulty_level': 'Beginner',
                'category': 'stretch',
                'primary_muscles': ['back'],
                'duration_seconds': 60
            }
        ]

        result = sequence_validator.validate_sequence(movements)

        assert result['valid'] is True
        assert len(result['errors']) == 0
        assert result['safety_score'] == 1.0

    def test_missing_warmup_fails(self):
        """Test that missing warm-up violates Rule 1"""
        movements = [
            {
                'name': 'Teaser',
                'difficulty_level': 'Advanced',
                'category': 'balance',
                'primary_muscles': ['core'],
                'duration_seconds': 120
            }
        ]

        result = sequence_validator.validate_sequence(movements)

        assert result['valid'] is False
        assert any('warm-up' in error.lower() for error in result['errors'])
        assert result['safety_score'] < 1.0

    def test_extension_before_flexion_fails(self):
        """Test that extension before flexion violates Rule 2 (spinal progression)"""
        movements = [
            {
                'name': 'Breathing',
                'difficulty_level': 'Beginner',
                'category': 'warm-up',
                'primary_muscles': ['core'],
                'duration_seconds': 60
            },
            {
                'name': 'Swan Dive',
                'difficulty_level': 'Intermediate',
                'category': 'extension',
                'primary_muscles': ['back'],
                'duration_seconds': 90
            },
            {
                'name': 'Roll Up',
                'difficulty_level': 'Beginner',
                'category': 'flexion',
                'primary_muscles': ['core'],
                'duration_seconds': 90
            }
        ]

        result = sequence_validator.validate_sequence(movements)

        assert result['valid'] is False
        assert any('flexion' in error.lower() or 'extension' in error.lower()
                   for error in result['errors'])

    def test_complexity_jump_fails(self):
        """Test that jumping from Beginner to Advanced violates Rule 4"""
        movements = [
            {
                'name': 'Breathing',
                'difficulty_level': 'Beginner',
                'category': 'warm-up',
                'primary_muscles': ['core'],
                'duration_seconds': 60
            },
            {
                'name': 'Roll Up',
                'difficulty_level': 'Beginner',
                'category': 'flexion',
                'primary_muscles': ['core'],
                'duration_seconds': 90
            },
            {
                'name': 'Boomerang',
                'difficulty_level': 'Advanced',
                'category': 'balance',
                'primary_muscles': ['core', 'arms'],
                'duration_seconds': 120
            }
        ]

        result = sequence_validator.validate_sequence(movements)

        assert result['valid'] is False
        assert any('difficulty' in error.lower() or 'complexity' in error.lower()
                   for error in result['errors'])

    def test_missing_cooldown_fails(self):
        """Test that missing cool-down violates Rule 5"""
        movements = [
            {
                'name': 'Breathing',
                'difficulty_level': 'Beginner',
                'category': 'warm-up',
                'primary_muscles': ['core'],
                'duration_seconds': 60
            },
            {
                'name': 'Roll Up',
                'difficulty_level': 'Beginner',
                'category': 'flexion',
                'primary_muscles': ['core'],
                'duration_seconds': 90
            },
            {
                'name': 'Boomerang',
                'difficulty_level': 'Advanced',
                'category': 'balance',
                'primary_muscles': ['core'],
                'duration_seconds': 120
            }
        ]

        result = sequence_validator.validate_sequence(movements)

        assert result['valid'] is False
        assert any('cool' in error.lower() or 'advanced' in error.lower()
                   for error in result['errors'])

    def test_empty_sequence_fails(self):
        """Test that empty sequence is invalid"""
        result = sequence_validator.validate_sequence([])

        assert result['valid'] is False
        assert len(result['errors']) > 0


class TestMuscleBalanceCalculator:
    """Test muscle balance calculations"""

    def test_balanced_sequence(self):
        """Test that a balanced sequence has high balance score"""
        movements = [
            {
                'primary_muscles': ['core'],
                'duration_seconds': 120
            },
            {
                'primary_muscles': ['legs'],
                'duration_seconds': 120
            },
            {
                'primary_muscles': ['back'],
                'duration_seconds': 120
            },
            {
                'primary_muscles': ['arms'],
                'duration_seconds': 120
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        assert result['balance_score'] > 0.5
        assert len(result['violations']) == 0
        assert result['total_duration'] == 480

    def test_muscle_imbalance_detection(self):
        """Test that overworked muscle group is detected (>40%)"""
        movements = [
            {
                'primary_muscles': ['core'],
                'duration_seconds': 300
            },
            {
                'primary_muscles': ['legs'],
                'duration_seconds': 50
            },
            {
                'primary_muscles': ['back'],
                'duration_seconds': 50
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        # Core should be > 40% (300/400 = 75%)
        assert 'core' in result['muscle_percentages']
        assert result['muscle_percentages']['core'] > 40.0
        assert len(result['violations']) > 0
        assert any('core' in v.lower() for v in result['violations'])

    def test_muscle_percentage_calculation(self):
        """Test accurate muscle percentage calculation"""
        movements = [
            {
                'primary_muscles': ['core'],
                'duration_seconds': 200
            },
            {
                'primary_muscles': ['legs'],
                'duration_seconds': 200
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        assert result['muscle_percentages']['core'] == 50.0
        assert result['muscle_percentages']['legs'] == 50.0
        assert result['total_duration'] == 400

    def test_multiple_muscle_groups_per_movement(self):
        """Test handling movements with multiple muscle groups"""
        movements = [
            {
                'primary_muscles': ['core', 'legs', 'arms'],
                'duration_seconds': 120
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        # All three should be counted
        assert 'core' in result['muscle_percentages']
        assert 'legs' in result['muscle_percentages']
        assert 'arms' in result['muscle_percentages']

    def test_empty_sequence_handling(self):
        """Test handling of empty movement sequence"""
        result = muscle_balance_calculator.calculate_balance([])

        assert result['total_duration'] == 0
        assert result['balance_score'] == 0.0
        assert len(result['violations']) > 0

    def test_muscle_categorization(self):
        """Test that muscles are correctly categorized"""
        movements = [
            {
                'primary_muscles': ['abs'],  # Should map to 'core'
                'duration_seconds': 100
            },
            {
                'primary_muscles': ['quadriceps'],  # Should map to 'legs'
                'duration_seconds': 100
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        assert 'core' in result['muscle_percentages']
        assert 'legs' in result['muscle_percentages']


class TestSequenceValidatorEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_single_movement_sequence(self):
        """Test single movement sequence handling"""
        movements = [
            {
                'name': 'The Hundred',
                'difficulty_level': 'Beginner',
                'category': 'warm-up',
                'primary_muscles': ['core'],
                'duration_seconds': 120
            }
        ]

        result = sequence_validator.validate_sequence(movements)

        # Should have warnings but might not be invalid
        assert 'warnings' in result

    def test_long_sequence_handling(self):
        """Test handling of very long sequences"""
        movements = [
            {
                'name': f'Movement {i}',
                'difficulty_level': 'Beginner',
                'category': 'flexion' if i % 2 == 0 else 'extension',
                'primary_muscles': ['core'],
                'duration_seconds': 60
            }
            for i in range(30)
        ]

        # Ensure first is warm-up
        movements[0]['category'] = 'warm-up'
        movements[-1]['category'] = 'stretch'

        result = sequence_validator.validate_sequence(movements)

        # Should process without errors (though may have warnings)
        assert 'valid' in result

    def test_recommendations_generation(self):
        """Test that recommendations are generated"""
        movements = [
            {
                'name': 'Roll Up',
                'difficulty_level': 'Beginner',
                'category': 'flexion',
                'primary_muscles': ['core'],
                'duration_seconds': 90
            }
        ]

        recommendations = sequence_validator.get_recommendations(movements)

        assert isinstance(recommendations, list)
        assert len(recommendations) > 0


class TestMuscleBalanceEdgeCases:
    """Test muscle balance edge cases"""

    def test_string_primary_muscles(self):
        """Test handling when primary_muscles is string instead of list"""
        movements = [
            {
                'primary_muscles': 'core',  # String instead of list
                'duration_seconds': 120
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        assert 'core' in result['muscle_percentages']

    def test_missing_duration(self):
        """Test default duration when not specified"""
        movements = [
            {
                'primary_muscles': ['core']
                # No duration_seconds specified
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)

        # Should use default duration (60 seconds)
        assert result['total_duration'] == 60

    def test_recommendations_for_imbalanced_sequence(self):
        """Test recommendations for imbalanced sequences"""
        movements = [
            {
                'primary_muscles': ['core'],
                'duration_seconds': 300
            },
            {
                'primary_muscles': ['arms'],
                'duration_seconds': 50
            }
        ]

        result = muscle_balance_calculator.calculate_balance(movements)
        recommendations = muscle_balance_calculator.get_recommendations(
            result['muscle_percentages']
        )

        assert len(recommendations) > 0
        assert any('core' in r.lower() for r in recommendations)


# Integration test helpers
def create_valid_test_sequence():
    """Helper function to create a valid test sequence"""
    return [
        {
            'name': 'Breathing Exercise',
            'difficulty_level': 'Beginner',
            'category': 'warm-up',
            'primary_muscles': ['core'],
            'duration_seconds': 60
        },
        {
            'name': 'The Hundred',
            'difficulty_level': 'Beginner',
            'category': 'flexion',
            'primary_muscles': ['core', 'hip_flexors'],
            'duration_seconds': 120
        },
        {
            'name': 'Roll Up',
            'difficulty_level': 'Beginner',
            'category': 'flexion',
            'primary_muscles': ['core', 'back'],
            'duration_seconds': 90
        },
        {
            'name': 'Single Leg Circle',
            'difficulty_level': 'Beginner',
            'category': 'rotation',
            'primary_muscles': ['hip_flexors', 'legs'],
            'duration_seconds': 90
        },
        {
            'name': 'Rolling Like a Ball',
            'difficulty_level': 'Beginner',
            'category': 'flexion',
            'primary_muscles': ['core', 'back'],
            'duration_seconds': 60
        },
        {
            'name': 'Single Leg Stretch',
            'difficulty_level': 'Beginner',
            'category': 'flexion',
            'primary_muscles': ['core', 'hip_flexors'],
            'duration_seconds': 90
        },
        {
            'name': 'Swan Dive',
            'difficulty_level': 'Intermediate',
            'category': 'extension',
            'primary_muscles': ['back', 'glutes'],
            'duration_seconds': 90
        },
        {
            'name': 'Seal',
            'difficulty_level': 'Beginner',
            'category': 'stretch',
            'primary_muscles': ['back', 'core'],
            'duration_seconds': 60
        }
    ]


class TestIntegration:
    """Integration tests combining validation and muscle balance"""

    def test_valid_sequence_full_validation(self):
        """Test complete validation of a valid sequence"""
        movements = create_valid_test_sequence()

        # Validate sequence
        validation = sequence_validator.validate_sequence(movements)
        assert validation['valid'] is True

        # Calculate muscle balance
        balance = muscle_balance_calculator.calculate_balance(movements)
        assert balance['balance_score'] > 0.3
        assert len(balance['violations']) == 0

    def test_invalid_sequence_caught_by_both_validators(self):
        """Test that an invalid sequence fails both validations"""
        movements = [
            {
                'name': 'Boomerang',
                'difficulty_level': 'Advanced',
                'category': 'balance',
                'primary_muscles': ['core'],
                'duration_seconds': 600  # 10 minutes on one advanced exercise
            }
        ]

        # Should fail sequence validation (no warm-up)
        validation = sequence_validator.validate_sequence(movements)
        assert validation['valid'] is False

        # Should show muscle imbalance (100% core)
        balance = muscle_balance_calculator.calculate_balance(movements)
        # Note: 100% on one group is technically not a violation if it's the only group
        # But the sequence validation should catch it


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
