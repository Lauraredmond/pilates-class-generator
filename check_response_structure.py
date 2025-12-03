#!/usr/bin/env python3
"""
Check the full response structure to understand what's happening
"""

import requests
import json

BACKEND_URL = "https://pilates-class-generator-api3.onrender.com"
JWT_TOKEN = input("Enter your JWT token: ").strip()

payload = {
    "class_plan": {
        "target_duration_minutes": 60,
        "difficulty_level": "Intermediate",
        "focus_areas": ["core", "glutes"],
        "strictness_level": "guided"
    },
    "include_music": True,
    "include_meditation": True,
    "include_research": False
}

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

print("Sending request...")
response = requests.post(
    f"{BACKEND_URL}/api/agents/generate-complete-class",
    json=payload,
    headers=headers,
    timeout=60
)

print(f"Status: {response.status_code}\n")

if response.status_code == 200:
    data = response.json()

    # Save full response
    with open('full_response.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("✅ Full response saved to: full_response.json")

    # Check cooldown specifically
    cooldown = data.get("data", {}).get("cooldown")
    print(f"\n🔍 Cooldown value:")
    print(f"  Type: {type(cooldown)}")
    print(f"  Value: {cooldown}")

    if cooldown is None:
        print("\n❌ Cooldown is None - this means the RPC function returned empty")
        print("   This could be because:")
        print("   1. Migration 013 was not applied to Supabase")
        print("   2. No cooldown matches the muscle groups")
        print("   3. The fallback logic didn't execute")

    # Check music
    music = data.get("data", {}).get("music_recommendation")
    print(f"\n🔍 Music value:")
    print(f"  Type: {type(music)}")
    if isinstance(music, dict):
        print(f"  Keys: {list(music.keys())}")

else:
    print(f"Error: {response.status_code}")
    print(response.text)
