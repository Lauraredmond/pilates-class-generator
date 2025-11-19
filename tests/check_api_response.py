#!/usr/bin/env python3
import requests
import json

url = "https://pilates-class-generator-api3.onrender.com/api/agents/generate-sequence"
payload = {
    "target_duration_minutes": 30,
    "difficulty_level": "Beginner",
    "focus_areas": [],
    "include_mcp_research": False
}

print("Generating class...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    data = response.json()

    # Print first movement in detail
    sequence = data['data']['sequence']
    first_movement = [item for item in sequence if item.get('type') == 'movement'][0]

    print("\nFirst movement details:")
    print(json.dumps(first_movement, indent=2))
else:
    print(f"Error: {response.status_code}")
    print(response.text)
