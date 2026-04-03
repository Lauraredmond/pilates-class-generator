#!/usr/bin/env python3
"""
FUNCTIONAL TEST: Consecutive Muscle Usage Analysis
Tests if consecutive movements overuse the same muscle groups
"""

import requests
import json
from typing import List, Dict

def generate_class() -> Dict:
    """Generate a test class"""
    url = "https://pilates-class-generator-api3.onrender.com/api/agents/generate-sequence"
    payload = {
        "target_duration_minutes": 30,
        "difficulty_level": "Beginner",
        "focus_areas": [],
        "include_mcp_research": False
    }

    print("📊 Generating test class...")
    response = requests.post(url, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error: {response.status_code}")
        return None

def analyze_consecutive_muscle_usage(class_data: Dict) -> None:
    """Analyze if consecutive movements overuse same muscle groups"""
    sequence = class_data['data']['sequence']
    movements = [item for item in sequence if item.get('type') == 'movement']

    print("\n" + "=" * 80)
    print("CONSECUTIVE MUSCLE USAGE ANALYSIS")
    print("=" * 80)

    print(f"\nTotal movements: {len(movements)}")
    print(f"\nMovement sequence:")
    print("-" * 80)

    # Print sequence with muscles
    for i, movement in enumerate(movements):
        name = movement.get('name', 'Unknown')
        muscles = movement.get('muscle_groups', [])
        muscle_names = [m['name'] for m in muscles]

        print(f"\n{i+1}. {name}")
        print(f"   Muscles: {', '.join(muscle_names) if muscle_names else 'No data'}")

    # Analyze consecutive overuse
    print("\n" + "=" * 80)
    print("CONSECUTIVE MUSCLE OVERUSE CHECKS")
    print("=" * 80)

    overuse_found = False

    for i in range(len(movements) - 1):
        current_movement = movements[i]
        next_movement = movements[i + 1]

        current_muscles = set(m['name'] for m in current_movement.get('muscle_groups', []))
        next_muscles = set(m['name'] for m in next_movement.get('muscle_groups', []))

        overlap = current_muscles & next_muscles

        if overlap and len(overlap) > 0:
            overuse_found = True
            overlap_percentage = (len(overlap) / len(current_muscles)) * 100 if current_muscles else 0

            status = "✅" if overlap_percentage < 50 else "⚠️" if overlap_percentage < 80 else "❌"

            print(f"\n{status} Movement {i+1} → {i+2}: {current_movement.get('name')} → {next_movement.get('name')}")
            print(f"   Shared muscles ({len(overlap)}): {', '.join(overlap)}")
            print(f"   Overlap: {overlap_percentage:.1f}%")

            if overlap_percentage >= 80:
                print(f"   🚨 WARNING: High muscle overlap - student may fatigue!")
            elif overlap_percentage >= 50:
                print(f"   ⚠️  CAUTION: Moderate muscle overlap")

    if not overuse_found:
        print("\n✅ EXCELLENT: No consecutive muscle overlap detected!")
        print("   Each movement targets different muscle groups")
    else:
        print("\n📊 ANALYSIS COMPLETE")

    # Calculate overall muscle balance
    print("\n" + "=" * 80)
    print("OVERALL CLASS MUSCLE DISTRIBUTION")
    print("=" * 80)

    all_muscles = {}
    for movement in movements:
        for muscle in movement.get('muscle_groups', []):
            muscle_name = muscle['name']
            if muscle_name not in all_muscles:
                all_muscles[muscle_name] = 0
            all_muscles[muscle_name] += 1

    print("\nMuscle group frequency across all movements:")
    for muscle, count in sorted(all_muscles.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(movements)) * 100
        bar = "█" * int(percentage / 5)
        print(f"  {muscle:30s} {count}/{len(movements)} movements ({percentage:5.1f}%) {bar}")

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print(" FUNCTIONAL TEST: CONSECUTIVE MUSCLE USAGE IN CLASS PLANNING")
    print("=" * 80)
    print("\nExpectation: Well-designed classes should NOT have consecutive")
    print("movements that heavily overlap in muscle usage (>80% overlap)")
    print("to prevent unnecessary student fatigue.\n")

    class_data = generate_class()

    if class_data and 'data' in class_data:
        analyze_consecutive_muscle_usage(class_data)
    else:
        print("❌ Failed to generate class")

    print("\n" + "=" * 80)
    print(" TEST COMPLETE")
    print("=" * 80 + "\n")
