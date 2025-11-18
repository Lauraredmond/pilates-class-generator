#!/usr/bin/env python3
"""Test the API endpoint directly"""

import requests
import json

url = "http://localhost:8000/api/agents/generate-sequence"

payload = {
    "target_duration_minutes": 30,
    "difficulty_level": "Beginner",
    "focus_areas": ["core"],
    "strictness_level": "guided",
    "include_mcp_research": False
}

print("Sending request to:", url)
print("Payload:", json.dumps(payload, indent=2))

response = requests.post(url, json=payload)

print("\nStatus Code:", response.status_code)
print("Response Headers:", dict(response.headers))
print("\nResponse Body:")
print(json.dumps(response.json(), indent=2))
