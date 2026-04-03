#!/bin/bash

# Test generate-complete-class endpoint directly
# Replace YOUR_JWT_TOKEN with a real token from localStorage

echo "Testing /api/agents/generate-complete-class endpoint..."
echo ""

curl -X POST "https://pilates-class-generator-api3.onrender.com/api/agents/generate-complete-class" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "class_plan": {
      "target_duration_minutes": 30,
      "difficulty_level": "Beginner",
      "focus_areas": ["core"],
      "strictness_level": "guided",
      "include_mcp_research": false
    },
    "include_music": true,
    "include_meditation": true
  }' | python3 -m json.tool | head -50

echo ""
echo "Check if response.data.movement_count exists at top level"
