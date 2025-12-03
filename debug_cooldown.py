#!/usr/bin/env python3
"""
Debug script to check cooldown selection logic
"""

from supabase import create_client, Client

SUPABASE_URL = "https://lixvcebtwusmaipodcpc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeHZjZWJ0d3VzbWFpcG9kY3BjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzNzA0MiwiZXhwIjoyMDc4NzEzMDQyfQ.-4z1GKTM5csj5hO3rY34xG4ZvAoWwIEabVajOY_fiXM"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*60)
print("DEBUGGING COOLDOWN SELECTION")
print("="*60 + "\n")

# Check all cooldown sequences
print("📋 All Cooldown Sequences in Database:")
cooldowns = supabase.table('cooldown_sequences').select('sequence_name, required_muscle_groups').execute()
for cd in cooldowns.data:
    print(f"  - {cd['sequence_name']}")
    print(f"    Required muscle groups: {cd['required_muscle_groups']}")
    print()

# Test with sample muscle groups (what a typical Intermediate class might have)
test_muscles = ['Core Strength', 'Glute Strength', 'Hip Flexor Strengthening']
print(f"🧪 Testing with muscle groups: {test_muscles}\n")

# Call the RPC function
try:
    result = supabase.rpc(
        'select_cooldown_by_muscle_groups',
        {'target_muscles': test_muscles, 'user_mode': 'default'}
    ).execute()

    print("RPC Response:")
    print(f"  Type: {type(result.data)}")
    print(f"  Length: {len(result.data) if result.data else 0}")
    print(f"  Data: {result.data}")

    if result.data and len(result.data) > 0:
        print(f"\n✅ Found cooldown: {result.data[0].get('sequence_name')}")
    else:
        print("\n❌ No cooldown found!")

except Exception as e:
    print(f"❌ Error calling RPC: {e}")

print("\n" + "="*60)
