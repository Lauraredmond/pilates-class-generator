"""
Quick script to generate a class and save the QA report
"""
import requests
import json
from datetime import datetime

# Backend URL
BACKEND_URL = "https://pilates-class-generator-api3.onrender.com"

# Your user credentials (you're the admin)
# Note: We'll need a valid JWT token

print("This script needs a valid JWT token from your login session.")
print("Please:")
print("1. Open the app in your browser")
print("2. Open DevTools (F12)")
print("3. Go to Application tab -> Local Storage")
print("4. Copy the 'token' value")
print()
token = input("Paste your JWT token here: ").strip()

if not token:
    print("No token provided. Exiting.")
    exit(1)

# Make request to generate class
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "difficulty": "Beginner",
    "duration": 30,
    "focus_areas": [],
    "ai_mode": False  # Use DEFAULT mode for faster generation
}

print("\nGenerating class...")
response = requests.post(
    f"{BACKEND_URL}/api/agents/generate-complete-class",
    headers=headers,
    json=payload,
    timeout=60
)

if response.status_code != 200:
    print(f"Error: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()

# Extract QA report
qa_report = data.get("data", {}).get("sequence", {}).get("data", {}).get("qa_report")

if not qa_report:
    print("No QA report found in response!")
    print("Are you logged in as an admin user?")
    exit(1)

# Save report
timestamp = qa_report.get("timestamp", datetime.now().strftime("%Y%m%d_%H%M%S"))
filename = f"muscle_overlap_report_{timestamp}.md"
filepath = f"analytics/{filename}"

with open(filepath, 'w') as f:
    f.write(qa_report["content"])

print(f"\n✅ Report saved to: {filepath}")
print(f"📊 Report timestamp: {timestamp}")
print(f"\nYou can now open the file to see:")
print("  - Section 5: Movement Pattern Proximity Check (NEW)")
print("  - Section 6: Historical Muscle Balance Analysis (NEW)")
