"""
Test the compliance endpoint to see what error occurs
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Get a test user's access token (you'll need to replace this with a real token)
# Or we can create a test user first

print("🧪 Testing /api/compliance/my-data endpoint...\n")

# Option 1: Test without authentication (should fail with 401)
print("Test 1: No authentication")
response = requests.get("https://pilates-class-generator-api3.onrender.com/api/compliance/my-data?format=json")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}\n")

# Option 2: Test with invalid token (should fail with 401)
print("Test 2: Invalid authentication")
response = requests.get(
    "https://pilates-class-generator-api3.onrender.com/api/compliance/my-data?format=json",
    headers={"Authorization": "Bearer invalid_token"}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}\n")

print("\n📝 To test with a real user:")
print("1. Login to https://basslinemvp.netlify.app")
print("2. Open browser console (F12)")
print("3. Run: localStorage.getItem('access_token')")
print("4. Copy the token and run:")
print("   export TOKEN='<your_token_here>'")
print("   python3 backend/scripts/test_compliance_endpoint.py")
