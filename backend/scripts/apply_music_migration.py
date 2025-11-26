#!/usr/bin/env python3
"""
Apply Music Integration Migration (003) to Supabase
Session 9: Music Integration
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import from backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    """Apply the music integration migration to Supabase."""

    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for admin operations

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)

    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)

    # Read migration file
    migration_path = Path(__file__).parent.parent.parent / "database" / "migrations" / "003_music_integration.sql"

    if not migration_path.exists():
        print(f"❌ Error: Migration file not found at {migration_path}")
        sys.exit(1)

    with open(migration_path, 'r') as f:
        migration_sql = f.read()

    print("🎵 Applying Music Integration Migration...")
    print(f"   Migration file: {migration_path}")
    print(f"   Database: {supabase_url}")
    print()

    try:
        # Execute the migration SQL
        # Note: Supabase Python client doesn't have a direct SQL execution method
        # This migration should be applied via Supabase Dashboard SQL Editor or CLI
        print("⚠️  Manual Migration Required")
        print()
        print("Please apply this migration using one of these methods:")
        print()
        print("Method 1: Supabase Dashboard")
        print("  1. Go to https://supabase.com/dashboard")
        print("  2. Select your project")
        print("  3. Navigate to SQL Editor")
        print("  4. Copy and paste the contents of:")
        print(f"     {migration_path}")
        print("  5. Click 'Run'")
        print()
        print("Method 2: Supabase CLI")
        print("  1. Install Supabase CLI: npm install -g supabase")
        print("  2. Run: supabase db push")
        print()
        print("Method 3: PostgreSQL Direct Connection")
        print("  1. Get connection string from Supabase Dashboard")
        print("  2. Run: psql <connection-string> < database/migrations/003_music_integration.sql")
        print()

        # Verify migration with a test query
        print("After applying migration, verify with:")
        print("  SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'music_%';")
        print()

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
