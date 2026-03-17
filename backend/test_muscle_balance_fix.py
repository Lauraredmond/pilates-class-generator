#!/usr/bin/env python3
"""
Test to verify the fix for Historical Muscle Balance calculation
This test confirms that the _check_historical_muscle_balance function
now queries the correct table (class_movements instead of movement_usage)
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.orchestrator.tools.muscle_overlap_analyzer import _check_historical_muscle_balance
from unittest.mock import Mock, MagicMock
import json

def test_historical_muscle_balance_uses_correct_table():
    """
    Test that _check_historical_muscle_balance queries class_movements table
    instead of the old movement_usage table (which had no data)
    """

    # Mock Supabase client
    mock_supabase = Mock()

    # Create mock response data simulating class_movements table data
    mock_class_movements_data = [
        {
            'movement_id': 'mov1',
            'movement_name': 'The Hundred',
            'class_generated_at': '2024-01-15T10:00:00Z'
        },
        {
            'movement_id': 'mov2',
            'movement_name': 'Roll Up',
            'class_generated_at': '2024-01-15T10:00:00Z'
        },
        {
            'movement_id': 'mov1',
            'movement_name': 'The Hundred',
            'class_generated_at': '2024-01-20T10:00:00Z'
        }
    ]

    # Mock movements data
    mock_movements_data = [
        {'id': 'mov1', 'name': 'The Hundred'},
        {'id': 'mov2', 'name': 'Roll Up'}
    ]

    # Mock movement muscles data
    mock_muscles_data = [
        {'movement_id': 'mov1', 'muscle_group_name': 'Core strength'},
        {'movement_id': 'mov1', 'muscle_group_name': 'Hip flexors'},
        {'movement_id': 'mov2', 'muscle_group_name': 'Core strength'},
        {'movement_id': 'mov2', 'muscle_group_name': 'Spinal mobility'}
    ]

    # Setup mock chain for class_movements query (FIXED table)
    mock_class_movements_response = Mock()
    mock_class_movements_response.data = mock_class_movements_data

    mock_movements_response = Mock()
    mock_movements_response.data = mock_movements_data

    mock_muscles_response = Mock()
    mock_muscles_response.data = mock_muscles_data

    # Configure the mock to track which table was queried
    tables_queried = []

    def mock_table(table_name):
        tables_queried.append(table_name)
        if table_name == 'class_movements':
            # Return mock for class_movements table
            mock_query = Mock()
            mock_query.select = Mock(return_value=mock_query)
            mock_query.eq = Mock(return_value=mock_query)
            mock_query.order = Mock(return_value=mock_query)
            mock_query.execute = Mock(return_value=mock_class_movements_response)
            return mock_query
        elif table_name == 'movements':
            mock_query = Mock()
            mock_query.select = Mock(return_value=mock_query)
            mock_query.in_ = Mock(return_value=mock_query)
            mock_query.execute = Mock(return_value=mock_movements_response)
            return mock_query
        elif table_name == 'movement_muscles':
            mock_query = Mock()
            mock_query.select = Mock(return_value=mock_query)
            mock_query.in_ = Mock(return_value=mock_query)
            mock_query.execute = Mock(return_value=mock_muscles_response)
            return mock_query
        return Mock()

    mock_supabase.table = mock_table

    # Current sequence (for the test)
    current_sequence = [
        {
            'id': 'mov3',
            'name': 'Single Leg Stretch',
            'muscle_groups': [
                {'name': 'Core strength'},
                {'name': 'Hip flexors'}
            ]
        }
    ]

    # Call the function
    result = _check_historical_muscle_balance(
        user_id='test-user-123',
        current_sequence=current_sequence,
        supabase_client=mock_supabase
    )

    # VERIFY THE FIX:
    # 1. Check that class_movements table was queried (not movement_usage)
    assert 'class_movements' in tables_queried, \
        f"ERROR: Function should query 'class_movements' table. Tables queried: {tables_queried}"

    assert 'movement_usage' not in tables_queried, \
        f"ERROR: Function should NOT query old 'movement_usage' table. Tables queried: {tables_queried}"

    # 2. Verify result is not None (was returning None with movement_usage table)
    assert result is not None, \
        "ERROR: Function returned None - should return data when class_movements has records"

    # 3. Verify result has expected structure
    assert 'classes_analyzed' in result, "Missing 'classes_analyzed' in result"
    assert 'days_since_start' in result, "Missing 'days_since_start' in result"
    assert 'historical_muscles' in result, "Missing 'historical_muscles' in result"
    assert 'current_class_muscles' in result, "Missing 'current_class_muscles' in result"

    print("✅ TEST PASSED: _check_historical_muscle_balance now queries the correct table!")
    print(f"   - Queried tables: {tables_queried}")
    print(f"   - Result contains {len(result.get('historical_muscles', {}))} muscle groups")
    print(f"   - Classes analyzed: {result.get('classes_analyzed', 0)}")

    return True

def test_movement_coverage_still_works():
    """
    Verify that _check_historical_movement_coverage still works correctly
    (it was already using class_movements table)
    """
    from backend.orchestrator.tools.muscle_overlap_analyzer import _check_historical_movement_coverage

    # Mock Supabase client
    mock_supabase = Mock()

    # Mock data
    mock_movements_data = [{'id': f'mov{i}', 'name': f'Movement {i}', 'difficulty_level': 'Beginner'}
                          for i in range(1, 36)]

    mock_class_movements_data = [
        {
            'movement_id': 'mov1',
            'movement_name': 'The Hundred',
            'class_generated_at': '2024-01-15T10:00:00Z'
        },
        {
            'movement_id': 'mov2',
            'movement_name': 'Roll Up',
            'class_generated_at': '2024-01-20T10:00:00Z'
        }
    ]

    # Setup responses
    mock_movements_response = Mock()
    mock_movements_response.data = mock_movements_data

    mock_class_response = Mock()
    mock_class_response.data = mock_class_movements_data

    def mock_table(table_name):
        if table_name == 'movements':
            mock_query = Mock()
            mock_query.select = Mock(return_value=mock_query)
            mock_query.execute = Mock(return_value=mock_movements_response)
            return mock_query
        elif table_name == 'class_movements':
            mock_query = Mock()
            mock_query.select = Mock(return_value=mock_query)
            mock_query.eq = Mock(return_value=mock_query)
            mock_query.order = Mock(return_value=mock_query)
            mock_query.execute = Mock(return_value=mock_class_response)
            return mock_query
        return Mock()

    mock_supabase.table = mock_table

    current_sequence = [
        {'id': 'mov3', 'name': 'Single Leg Stretch'}
    ]

    result = _check_historical_movement_coverage(
        user_id='test-user-123',
        current_sequence=current_sequence,
        supabase_client=mock_supabase
    )

    assert result is not None, "Movement coverage should return data"
    assert 'total_unique_movements' in result
    assert 'repertoire_gaps' in result

    print("✅ TEST PASSED: _check_historical_movement_coverage still works correctly")
    print(f"   - Found {result.get('total_unique_movements', 0)} unique movements in history")
    print(f"   - Identified {len(result.get('repertoire_gaps', []))} movements never practiced")

    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Historical Muscle Balance Fix")
    print("=" * 60)

    try:
        # Test 1: Verify the fix
        test_historical_muscle_balance_uses_correct_table()
        print()

        # Test 2: Verify movement coverage still works
        test_movement_coverage_still_works()
        print()

        print("=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("The fix correctly changed the table from 'movement_usage' to 'class_movements'")
        print("This resolves the 'No historical data available' issue in sequencing reports")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)