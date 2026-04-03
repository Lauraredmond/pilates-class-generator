#!/usr/bin/env python3
"""
Check actual movement_muscles table schema in production Supabase
"""
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load .env from backend directory
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

from supabase import create_client

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

print("=" * 80)
print("CHECKING MOVEMENT_MUSCLES TABLE SCHEMA")
print("=" * 80)

# Query movement_muscles table
try:
    response = supabase.table('movement_muscles').select('*').limit(3).execute()

    if response.data and len(response.data) > 0:
        print(f"\n✅ Found {len(response.data)} rows in movement_muscles table")
        print(f"\n📋 ACTUAL COLUMNS:")
        columns = list(response.data[0].keys())
        for col in columns:
            print(f"   - {col}")

        print(f"\n📊 SAMPLE DATA:")
        for i, row in enumerate(response.data, 1):
            print(f"\nRow {i}:")
            for key, value in row.items():
                print(f"   {key}: {value}")
    else:
        print("\n⚠️  Table exists but has no data")

except Exception as e:
    print(f"\n❌ ERROR querying movement_muscles table:")
    print(f"   {e}")

print("\n" + "=" * 80)
print("CHECKING MUSCLE_GROUPS TABLE")
print("=" * 80)

# Query muscle_groups table for reference
try:
    response = supabase.table('muscle_groups').select('*').limit(5).execute()

    if response.data and len(response.data) > 0:
        print(f"\n✅ Found {len(response.data)} rows in muscle_groups table")
        print(f"\n📋 COLUMNS:")
        columns = list(response.data[0].keys())
        for col in columns:
            print(f"   - {col}")

        print(f"\n📊 SAMPLE DATA:")
        for i, row in enumerate(response.data[:3], 1):
            print(f"\nRow {i}:")
            for key, value in row.items():
                print(f"   {key}: {value}")
    else:
        print("\n⚠️  Table exists but has no data")

except Exception as e:
    print(f"\n❌ ERROR querying muscle_groups table:")
    print(f"   {e}")

print("\n" + "=" * 80)
