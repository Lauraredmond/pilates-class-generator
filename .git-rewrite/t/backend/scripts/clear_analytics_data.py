"""
Clear analytics data from class_history and movement_usage tables

This script is for testing purposes - clears all existing data so you can
verify that the analytics tables get populated correctly when you generate classes.

Usage:
    python backend/scripts/clear_analytics_data.py

Requires:
    - SUPABASE_URL in .env
    - SUPABASE_KEY in .env
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Load environment from backend directory
env_path = backend_path / '.env'
if not env_path.exists():
    # Try project root
    env_path = backend_path.parent / '.env'

load_dotenv(env_path)

def clear_analytics_tables():
    """Clear data from class_history and movement_usage tables"""

    # Initialize Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print("🧹 Clearing analytics data...")
    print()

    # Clear class_history table
    try:
        # First, count records
        count_result = supabase.table('class_history').select('id', count='exact').execute()
        history_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

        print(f"📊 class_history table: {history_count} records")

        if history_count > 0:
            # Delete all records
            delete_result = supabase.table('class_history').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"   ✅ Cleared {history_count} records from class_history")
        else:
            print(f"   ℹ️  class_history already empty")

    except Exception as e:
        print(f"   ❌ Error clearing class_history: {e}")

    print()

    # Clear movement_usage table
    try:
        # Count records
        count_result = supabase.table('movement_usage').select('id', count='exact').execute()
        usage_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

        print(f"📊 movement_usage table: {usage_count} records")

        if usage_count > 0:
            # Delete all records
            delete_result = supabase.table('movement_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"   ✅ Cleared {usage_count} records from movement_usage")
        else:
            print(f"   ℹ️  movement_usage already empty")

    except Exception as e:
        print(f"   ❌ Error clearing movement_usage: {e}")

    print()
    print("✅ Analytics tables cleared!")
    print()
    print("Next steps:")
    print("1. Generate 3-5 test classes in the app")
    print("2. Check that class_history table gets populated")
    print("3. Check that movement_usage table tracks usage")
    print("4. Verify analytics dashboard shows data")
    print()
    print("Note: class_plans table was NOT cleared (contains manually created classes)")
    print()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Clear analytics data from database')
    parser.add_argument('--confirm', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()

    print()
    print("=" * 60)
    print("  CLEAR ANALYTICS DATA")
    print("=" * 60)
    print()
    print("This will delete ALL records from:")
    print("  - class_history")
    print("  - movement_usage")
    print()

    if not args.confirm:
        response = input("Are you sure you want to continue? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print()
            print("❌ Operation cancelled")
            print()
            sys.exit(0)

    clear_analytics_tables()
