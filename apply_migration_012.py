#!/usr/bin/env python3
"""
Apply migration 012 to Supabase production database
"""

import os
from pathlib import Path
from supabase import create_client, Client

# Load Supabase credentials
SUPABASE_URL = "https://lixvcebtwusmaipodcpc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeHZjZWJ0d3VzbWFpcG9kY3BjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzNzA0MiwiZXhwIjoyMDc4NzEzMDQyfQ.-4z1GKTM5csj5hO3rY34xG4ZvAoWwIEabVajOY_fiXM"

# Read migration SQL
migration_path = Path(__file__).parent / "database" / "migrations" / "012_add_reasoner_mode_and_content.sql"

print(f"Reading migration from: {migration_path}")
with open(migration_path, 'r') as f:
    migration_sql = f.read()

print(f"Migration SQL size: {len(migration_sql)} characters")
print("\n" + "="*60)
print("APPLYING MIGRATION 012 TO SUPABASE")
print("="*60 + "\n")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Execute the migration using Supabase's RPC
    # Note: Supabase's Python client doesn't have direct SQL execution
    # We need to use the REST API's rpc() method with a custom function
    # Or use psql command directly

    print("⚠️  Note: Supabase Python client doesn't support direct SQL execution")
    print("Please apply this migration using one of these methods:\n")

    print("Method 1: Supabase Dashboard (Recommended)")
    print("  1. Go to: https://supabase.com/dashboard/project/lixvcebtwusmaipodcpc/editor")
    print("  2. Click 'SQL Editor'")
    print("  3. Paste the migration SQL from:")
    print(f"     {migration_path}")
    print("  4. Click 'Run'\n")

    print("Method 2: psql Command Line")
    print("  Run this command (you'll need the database password from Supabase dashboard):")
    print(f"  psql 'postgresql://postgres:[YOUR_DB_PASSWORD]@db.lixvcebtwusmaipodcpc.supabase.co:5432/postgres' -f {migration_path}\n")

    print("Method 3: Copy SQL to clipboard")
    print("  I can copy the SQL to your clipboard for easy pasting:")

except Exception as e:
    print(f"❌ Error: {e}")
    raise

print("\n" + "="*60)
print("Migration file is ready. Please apply using one of the methods above.")
print("="*60)
