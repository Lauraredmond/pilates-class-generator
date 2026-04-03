#!/usr/bin/env python3
"""
UAT/QA Testing Script: Class Generation Intelligence Test
Tests for movement variety and consecutive muscle usage
"""

import requests
import json
from typing import List, Dict
from collections import Counter, defaultdict

# API Configuration
API_BASE = "https://pilates-class-generator-api3.onrender.com"

def generate_class(duration: int = 30, difficulty: str = "Beginner") -> Dict:
    """Generate a single class via API"""
    url = f"{API_BASE}/api/agents/generate-sequence"
    payload = {
        "target_duration_minutes": duration,
        "difficulty_level": difficulty,
        "focus_areas": [],
        "include_mcp_research": False
    }

    print(f"\n📊 Generating {difficulty} class ({duration} min)...")
    response = requests.post(url, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None

def analyze_consecutive_muscle_usage(class_data: Dict) -> Dict:
    """
    FUNCTIONAL TEST: Check if consecutive movements overuse same muscle groups
    A well-designed class should NOT have 3+ consecutive movements using the same primary muscle
    """
    sequence = class_data['data']['sequence']
    movements = [item for item in sequence if item.get('type') == 'movement']

    print("\n🔍 CONSECUTIVE MUSCLE USAGE ANALYSIS")
    print("=" * 80)

    consecutive_overuse = []

    for i, movement in enumerate(movements):
        if i == 0:
            continue

        current_muscles = set()
        if movement.get('muscle_groups'):
            current_muscles = {mg['name'] for mg in movement['muscle_groups'] if mg.get('is_primary')}

        prev_muscles = set()
        if movements[i-1].get('muscle_groups'):
            prev_muscles = {mg['name'] for mg in movements[i-1]['muscle_groups'] if mg.get('is_primary')}

        overlap = current_muscles & prev_muscles

        if overlap:
            consecutive_overuse.append({
                'movement_num': i + 1,
                'movement': movement.get('name'),
                'prev_movement': movements[i-1].get('name'),
                'shared_muscles': list(overlap)
            })
            print(f"⚠️  Movement {i} → {i+1}: {movements[i-1].get('name')} → {movement.get('name')}")
            print(f"   Shared primary muscles: {', '.join(overlap)}")

    if not consecutive_overuse:
        print("✅ No consecutive muscle overuse detected")
    else:
        print(f"\n❌ Found {len(consecutive_overuse)} cases of consecutive muscle overuse")

    return consecutive_overuse

def analyze_movement_sequence(class_data: Dict) -> None:
    """Display the full movement sequence with muscle groups"""
    sequence = class_data['data']['sequence']
    movements = [item for item in sequence if item.get('type') == 'movement']

    print("\n📋 MOVEMENT SEQUENCE")
    print("=" * 80)

    for i, movement in enumerate(movements):
        name = movement.get('name', 'Unknown')
        duration = movement.get('duration_seconds', 0) // 60

        muscles = "No muscle data"
        if movement.get('muscle_groups'):
            primary_muscles = [mg['name'] for mg in movement['muscle_groups'] if mg.get('is_primary')]
            if primary_muscles:
                muscles = ", ".join(primary_muscles)

        print(f"{i+1}. {name} ({duration} min) - Primary: {muscles}")

    print(f"\nTotal movements: {len(movements)}")

def test_movement_variety(num_classes: int = 10, difficulty: str = "Beginner") -> Dict:
    """
    UAT TEST: Generate multiple classes and check for movement variety
    Expectation: Movements should vary across classes, not too repetitive
    """
    print(f"\n🎯 MOVEMENT VARIETY TEST: Generating {num_classes} classes")
    print("=" * 80)

    all_movements = []
    all_starting_movements = []

    for i in range(num_classes):
        class_data = generate_class(duration=30, difficulty=difficulty)

        if not class_data or 'data' not in class_data:
            continue

        sequence = class_data['data']['sequence']
        movements = [item for item in sequence if item.get('type') == 'movement']

        # Track all movements
        for movement in movements:
            all_movements.append(movement.get('name'))

        # Track starting movement
        if movements:
            all_starting_movements.append(movements[0].get('name'))
            print(f"  Class {i+1}: Starts with '{movements[0].get('name')}'")

    # Analysis
    print("\n📊 VARIETY ANALYSIS RESULTS")
    print("=" * 80)

    # Starting movement frequency
    print("\n1. STARTING MOVEMENT DISTRIBUTION:")
    start_counter = Counter(all_starting_movements)
    for movement, count in start_counter.most_common():
        percentage = (count / num_classes) * 100
        print(f"   {movement}: {count}/{num_classes} classes ({percentage:.1f}%)")

    if len(start_counter) == 1:
        print("   ❌ CRITICAL: All classes start with the same movement!")

    # Overall movement frequency
    print("\n2. OVERALL MOVEMENT FREQUENCY:")
    movement_counter = Counter(all_movements)
    print(f"   Total unique movements used: {len(movement_counter)}")
    print(f"   Most frequently used movements:")
    for movement, count in movement_counter.most_common(10):
        print(f"   - {movement}: {count} times")

    # Calculate variety score
    total_movements = len(all_movements)
    unique_movements = len(movement_counter)
    variety_score = (unique_movements / total_movements) * 100 if total_movements > 0 else 0

    print(f"\n   Variety Score: {variety_score:.1f}% (higher is better)")
    print(f"   Ideal range: 60-80% (some repetition is good)")

    if variety_score < 40:
        print("   ❌ POOR: Too much repetition")
    elif variety_score < 60:
        print("   ⚠️  FAIR: Could use more variety")
    elif variety_score < 80:
        print("   ✅ GOOD: Healthy balance of repetition and variety")
    else:
        print("   ⚠️  WARNING: May be TOO varied (students need some repetition)")

    return {
        'start_counter': start_counter,
        'movement_counter': movement_counter,
        'variety_score': variety_score
    }

def test_difficulty_filtering() -> None:
    """
    QA TEST: Verify difficulty level filtering works correctly
    Beginner classes should NOT include Intermediate or Advanced movements
    """
    print("\n🎓 DIFFICULTY LEVEL FILTERING TEST")
    print("=" * 80)

    # Test Beginner
    print("\n1. Testing BEGINNER class:")
    beginner_class = generate_class(duration=30, difficulty="Beginner")
    if beginner_class and 'data' in beginner_class:
        sequence = beginner_class['data']['sequence']
        movements = [item for item in sequence if item.get('type') == 'movement']

        violations = []
        for movement in movements:
            difficulty = movement.get('difficulty_level', 'Unknown')
            if difficulty in ['Intermediate', 'Advanced']:
                violations.append(f"{movement.get('name')} ({difficulty})")

        if violations:
            print(f"   ❌ FAILED: Found {len(violations)} non-Beginner movements:")
            for v in violations:
                print(f"      - {v}")
        else:
            print("   ✅ PASSED: All movements are Beginner level")

    # Test Intermediate
    print("\n2. Testing INTERMEDIATE class:")
    intermediate_class = generate_class(duration=30, difficulty="Intermediate")
    if intermediate_class and 'data' in intermediate_class:
        sequence = intermediate_class['data']['sequence']
        movements = [item for item in sequence if item.get('type') == 'movement']

        violations = []
        for movement in movements:
            difficulty = movement.get('difficulty_level', 'Unknown')
            if difficulty == 'Advanced':
                violations.append(f"{movement.get('name')} ({difficulty})")

        if violations:
            print(f"   ❌ FAILED: Found {len(violations)} Advanced movements in Intermediate class:")
            for v in violations:
                print(f"      - {v}")
        else:
            print("   ✅ PASSED: No Advanced movements in Intermediate class")

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print(" UAT/QA/FUNCTIONAL TESTING: INTELLIGENT CLASS PLANNING")
    print("=" * 80)

    # Test 1: Single class analysis
    print("\n\n### TEST 1: SINGLE CLASS - CONSECUTIVE MUSCLE USAGE ###")
    class_data = generate_class(duration=30, difficulty="Beginner")
    if class_data and 'data' in class_data:
        analyze_movement_sequence(class_data)
        analyze_consecutive_muscle_usage(class_data)

    # Test 2: Movement variety across 10 classes
    print("\n\n### TEST 2: MOVEMENT VARIETY ACROSS 10 CLASSES ###")
    variety_results = test_movement_variety(num_classes=10, difficulty="Beginner")

    # Test 3: Difficulty filtering
    print("\n\n### TEST 3: DIFFICULTY LEVEL FILTERING ###")
    test_difficulty_filtering()

    print("\n" + "=" * 80)
    print(" TESTING COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
