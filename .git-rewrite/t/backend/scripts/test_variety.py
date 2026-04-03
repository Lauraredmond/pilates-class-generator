#!/usr/bin/env python3
"""
Test script to generate multiple classes and analyze movement variety
"""
import requests
import json
import time
from collections import Counter

API_URL = "https://pilates-class-generator-api3.onrender.com"
USER_ID = "82906f6d-2a73-53c5-8d04-151b12ef43cf"

def generate_class(class_num):
    """Generate a single class"""
    print(f"Generating class {class_num}...", end=" ", flush=True)

    response = requests.post(
        f"{API_URL}/api/agents/generate-sequence",
        json={
            "user_id": USER_ID,
            "target_duration_minutes": 30,
            "difficulty_level": "Beginner",
            "focus_areas": [],
            "strictness_level": "guided",
            "include_mcp_research": False
        },
        timeout=30
    )

    if response.status_code == 200:
        data = response.json()
        movements = [m for m in data['data']['sequence'] if m['type'] == 'movement']
        movement_names = [m['name'] for m in movements]
        print(f"✓ {len(movements)} movements: {', '.join(movement_names[:3])}...")
        return movement_names
    else:
        print(f"✗ Error {response.status_code}")
        return []

def main():
    print("=" * 80)
    print("MOVEMENT VARIETY TEST - Generating 10 Classes")
    print("=" * 80)
    print()

    all_movements = []

    for i in range(1, 11):
        movements = generate_class(i)
        all_movements.extend(movements)
        time.sleep(2)  # Rate limiting

    print()
    print("=" * 80)
    print("VARIETY ANALYSIS")
    print("=" * 80)
    print()

    # Count movement frequency
    movement_counts = Counter(all_movements)
    total_movements = len(all_movements)

    print(f"Total movements generated: {total_movements}")
    print(f"Unique movements used: {len(movement_counts)}")
    print()
    print("Movement Usage Frequency:")
    print("-" * 80)

    for movement, count in movement_counts.most_common():
        percentage = (count / total_movements) * 100
        bar = "█" * int(percentage)
        print(f"{movement:40s} {count:3d} ({percentage:5.1f}%) {bar}")

    print()
    print("=" * 80)
    print("VARIETY METRICS")
    print("=" * 80)

    # Calculate variety score
    if len(movement_counts) > 0:
        avg_usage = total_movements / len(movement_counts)
        variety_score = (len(movement_counts) / total_movements) * 100
        print(f"Average usage per movement: {avg_usage:.1f}")
        print(f"Variety score: {variety_score:.1f}% (target: 60-80%)")

        # Check for overuse
        overused = [m for m, c in movement_counts.items() if c > avg_usage * 1.5]
        if overused:
            print(f"\n⚠️  Overused movements (>1.5x average): {', '.join(overused)}")

        # Check for underuse
        underused = [m for m, c in movement_counts.items() if c == 1]
        if underused:
            print(f"\n✓ Single-use movements: {len(underused)} ({', '.join(underused[:5])}...)")

if __name__ == "__main__":
    main()
