#!/usr/bin/env python3
"""
Verify migration 012 was applied successfully
"""

from supabase import create_client, Client

SUPABASE_URL = "https://lixvcebtwusmaipodcpc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeHZjZWJ0d3VzbWFpcG9kY3BjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzNzA0MiwiZXhwIjoyMDc4NzEzMDQyfQ.-4z1GKTM5csj5hO3rY34xG4ZvAoWwIEabVajOY_fiXM"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*60)
print("VERIFYING MIGRATION 012")
print("="*60 + "\n")

# Check table counts
tables = [
    'preparation_scripts',
    'warmup_routines',
    'cooldown_sequences',
    'closing_meditation_scripts',
    'closing_homecare_advice'
]

print("📊 Content Inventory:\n")
for table in tables:
    try:
        result = supabase.table(table).select("*", count="exact").execute()
        count = result.count if hasattr(result, 'count') else len(result.data)
        print(f"  ✅ {table}: {count} rows")
    except Exception as e:
        print(f"  ❌ {table}: Error - {e}")

# Check if new columns exist by trying to query them
print("\n🔧 New Columns Check:\n")

try:
    # Check user_preferences for use_reasoner_mode
    result = supabase.table('user_preferences').select("use_reasoner_mode").limit(1).execute()
    print(f"  ✅ user_preferences.use_reasoner_mode: Exists")
except Exception as e:
    print(f"  ❌ user_preferences.use_reasoner_mode: {e}")

try:
    # Check preparation_scripts for required_elements
    result = supabase.table('preparation_scripts').select("required_elements, allow_ai_generation").limit(1).execute()
    print(f"  ✅ preparation_scripts.required_elements: Exists")
    print(f"  ✅ preparation_scripts.allow_ai_generation: Exists")
except Exception as e:
    print(f"  ❌ preparation_scripts new columns: {e}")

try:
    # Check warmup_routines for required_muscle_groups
    result = supabase.table('warmup_routines').select("required_muscle_groups, allow_ai_generation").limit(1).execute()
    print(f"  ✅ warmup_routines.required_muscle_groups: Exists")
    print(f"  ✅ warmup_routines.allow_ai_generation: Exists")
except Exception as e:
    print(f"  ❌ warmup_routines new columns: {e}")

# Sample a warm-up routine to verify content
print("\n🔍 Sample Warm-up Routine:\n")
try:
    result = supabase.table('warmup_routines').select("routine_name, focus_area, required_muscle_groups").limit(1).execute()
    if result.data:
        routine = result.data[0]
        print(f"  Name: {routine.get('routine_name')}")
        print(f"  Focus: {routine.get('focus_area')}")
        print(f"  Muscle Groups: {routine.get('required_muscle_groups')}")
except Exception as e:
    print(f"  ❌ Error fetching sample: {e}")

print("\n" + "="*60)
print("✅ VERIFICATION COMPLETE")
print("="*60 + "\n")
