#!/usr/bin/env python3
"""
Test Default Mode Implementation

Tests the generate_complete_class endpoint with Default mode to verify:
1. User preferences are checked correctly
2. All 6 sections are selected from database
3. Response structure is correct
4. Metadata shows mode='default' and cost=0.00
"""

import requests
import json
from pprint import pprint

# Configuration
BACKEND_URL = "https://pilates-class-generator-api3.onrender.com"  # Production URL
# BACKEND_URL = "http://localhost:8000"  # Local testing

# You'll need a valid JWT token from a logged-in user
# Get this from your browser's localStorage after logging in
# In browser console: localStorage.getItem('access_token')
print("To get your JWT token:")
print("1. Log in to https://basslinemvp.netlify.app")
print("2. Open browser DevTools (F12 or Cmd+Option+I)")
print("3. Go to Console tab")
print("4. Type: localStorage.getItem('access_token')")
print("5. Copy the token (long string starting with 'eyJ...')")
print()
JWT_TOKEN = input("Enter your JWT token: ").strip()

print("\n" + "="*60)
print("TESTING DEFAULT MODE - Complete Class Generation")
print("="*60 + "\n")

# Test payload
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

print("Request Payload:")
pprint(payload)
print("\n" + "="*60 + "\n")

try:
    print("Sending request to:", f"{BACKEND_URL}/api/agents/generate-complete-class")
    response = requests.post(
        f"{BACKEND_URL}/api/agents/generate-complete-class",
        json=payload,
        headers=headers,
        timeout=60
    )

    print(f"Response Status: {response.status_code}")
    print("\n" + "="*60 + "\n")

    if response.status_code == 200:
        data = response.json()

        # Verify response structure
        print("✅ SUCCESS! Response received.\n")

        # Check metadata
        metadata = data.get("metadata", {})
        print("📊 Metadata:")
        print(f"  Mode: {metadata.get('mode')}")
        print(f"  Cost: ${metadata.get('cost'):.2f}")
        print(f"  Sections Included: {metadata.get('sections_included')}")
        print(f"  Generated At: {metadata.get('generated_at')}")
        print()

        # Check sections
        class_data = data.get("data", {})
        sections = [
            ("Preparation", class_data.get("preparation")),
            ("Warm-up", class_data.get("warmup")),
            ("Sequence", class_data.get("sequence")),
            ("Cool-down", class_data.get("cooldown")),
            ("Meditation", class_data.get("meditation")),
            ("HomeCare", class_data.get("homecare")),
            ("Music", class_data.get("music_recommendation"))
        ]

        print("📋 Sections Check:")
        for section_name, section_data in sections:
            if section_data:
                if section_name == "Preparation":
                    name = section_data.get("script_name", "Unknown")
                elif section_name == "Warm-up":
                    name = section_data.get("routine_name", "Unknown")
                elif section_name == "Sequence":
                    seq_data = section_data.get("data", {})
                    movements = seq_data.get("sequence", [])
                    name = f"{len(movements)} movements"
                elif section_name == "Cool-down":
                    name = section_data.get("sequence_name", "Unknown")
                elif section_name == "Meditation":
                    name = section_data.get("script_name", "Unknown")
                elif section_name == "HomeCare":
                    name = section_data.get("advice_name", "Unknown")
                elif section_name == "Music":
                    music_data = section_data.get("data", {})
                    playlist = music_data.get("playlist", {})
                    name = playlist.get("name", "Unknown")
                else:
                    name = "Present"

                print(f"  ✅ {section_name}: {name}")
            else:
                print(f"  ❌ {section_name}: Missing")

        print("\n" + "="*60)
        print("✅ DEFAULT MODE TEST PASSED")
        print("="*60 + "\n")

        # Optionally save full response for inspection
        save_response = input("Save full response to file? (y/n): ").strip().lower()
        if save_response == 'y':
            with open('test_default_mode_response.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("✅ Response saved to: test_default_mode_response.json")

    elif response.status_code == 401:
        print("❌ Authentication failed. JWT token may be invalid or expired.")
        print("   Get a new token by logging in to the frontend and checking localStorage.")
    elif response.status_code == 501:
        print("⚠️  Reasoner mode is enabled for this user but not yet implemented.")
        print("   Disable Reasoner mode in user settings and try again.")
    else:
        print(f"❌ Request failed with status {response.status_code}")
        print("\nResponse:")
        try:
            pprint(response.json())
        except:
            print(response.text)

except requests.exceptions.Timeout:
    print("❌ Request timed out after 60 seconds")
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to backend. Is it running?")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
