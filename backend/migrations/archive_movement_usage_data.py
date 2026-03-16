#!/usr/bin/env python3
"""
Archive movement_usage table data before dropping the table
Part of Phase 3 migration to deprecate movement_usage table

This script:
1. Exports all movement_usage data to JSON for archival
2. Creates a summary report
3. Prepares for safe table deletion
"""

import os
import json
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

def archive_movement_usage():
    """Archive all movement_usage data before table deletion"""

    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ ERROR: SUPABASE_URL and SUPABASE_KEY must be set")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print("=" * 60)
    print("MOVEMENT_USAGE TABLE ARCHIVE")
    print("=" * 60)
    print(f"Date: {datetime.now().isoformat()}")
    print()

    try:
        # Fetch all records from movement_usage
        response = supabase.table('movement_usage') \
            .select('*') \
            .order('created_at', desc=True) \
            .execute()

        records = response.data
        record_count = len(records)

        print(f"📊 Found {record_count} records in movement_usage table")

        if record_count > 0:
            # Create archive directory
            archive_dir = "/Users/lauraredmond/Documents/Bassline/Projects/MVP2/backend/migrations/archives"
            os.makedirs(archive_dir, exist_ok=True)

            # Generate archive filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_file = f"{archive_dir}/movement_usage_archive_{timestamp}.json"

            # Save to JSON
            with open(archive_file, 'w') as f:
                json.dump({
                    "table": "movement_usage",
                    "archived_at": datetime.now().isoformat(),
                    "record_count": record_count,
                    "reason": "Table deprecated in favor of class_movements",
                    "migration_phase": "Phase 3",
                    "data": records
                }, f, indent=2, default=str)

            print(f"✅ Data archived to: {archive_file}")

            # Generate summary statistics
            unique_users = len(set(r['user_id'] for r in records))
            unique_movements = len(set(r['movement_id'] for r in records))

            print()
            print("ARCHIVE SUMMARY:")
            print(f"  - Total records: {record_count}")
            print(f"  - Unique users: {unique_users}")
            print(f"  - Unique movements: {unique_movements}")

            # Find date range
            dates = [r.get('last_used_date') for r in records if r.get('last_used_date')]
            if dates:
                earliest = min(dates)
                latest = max(dates)
                print(f"  - Date range: {earliest} to {latest}")

            # Sample records
            print()
            print("SAMPLE RECORDS (first 3):")
            for i, record in enumerate(records[:3], 1):
                print(f"  {i}. User: {record['user_id'][:8]}...")
                print(f"     Movement: {record['movement_id'][:8]}...")
                print(f"     Usage count: {record.get('usage_count', 0)}")
                print(f"     Last used: {record.get('last_used_date')}")
        else:
            print("ℹ️  No records to archive (table is empty)")

        print()
        print("=" * 60)
        print("NEXT STEPS:")
        print("1. Review the archived data")
        print("2. Run the drop_movement_usage_table.sql migration")
        print("3. Update documentation")
        print("=" * 60)

        return record_count

    except Exception as e:
        print(f"❌ ERROR: Failed to archive data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    record_count = archive_movement_usage()
    sys.exit(0 if record_count >= 0 else 1)