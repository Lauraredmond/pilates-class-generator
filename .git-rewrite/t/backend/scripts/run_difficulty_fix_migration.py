#!/usr/bin/env python3
"""
Script to print SQL for fixing movement difficulty tags (Migration 006)
Usage: python3 scripts/run_difficulty_fix_migration.py
"""

import os
from pathlib import Path

def main():
    # Get the SQL migration file path
    project_root = Path(__file__).parent.parent.parent
    migration_file = project_root / "database" / "migrations" / "006_fix_movement_difficulty_tags.sql"

    if not migration_file.exists():
        print(f"❌ ERROR: Migration file not found at {migration_file}")
        return

    # Read and print the SQL
    with open(migration_file, 'r') as f:
        sql_content = f.read()

    print("=" * 80)
    print("MIGRATION 006: Fix Movement Difficulty Tags")
    print("=" * 80)
    print()
    print("This migration corrects incorrectly tagged movements:")
    print()
    print("  INTERMEDIATE (currently Beginner):")
    print("    - Neck pull")
    print("    - Scissors")
    print("    - Bicycle (& Scissors)")
    print()
    print("  ADVANCED (currently Beginner):")
    print("    - Swimming")
    print("    - Leg pull supine")
    print()
    print("=" * 80)
    print("SQL TO COPY AND PASTE INTO SUPABASE SQL EDITOR:")
    print("=" * 80)
    print()
    print(sql_content)
    print()
    print("=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print()
    print("1. Copy the SQL above (from UPDATE to COMMENT)")
    print("2. Go to: https://supabase.com/dashboard/project/lixvcebtwusmaipodcpc/sql/new")
    print("3. Paste the SQL into the editor")
    print("4. Click 'Run' button")
    print("5. Verify success (should see 'Success. No rows returned')")
    print()
    print("VERIFICATION:")
    print("-" * 80)
    print("After running, verify with this query:")
    print()
    print("SELECT name, difficulty_level")
    print("FROM movements")
    print("WHERE name IN ('Swimming', 'Neck pull', 'Scissors', 'Bicycle (& Scissors)', 'Leg pull supine')")
    print("ORDER BY difficulty_level, name;")
    print()
    print("Expected results:")
    print("  Swimming: Advanced")
    print("  Leg pull supine: Advanced")
    print("  Neck pull: Intermediate")
    print("  Scissors: Intermediate")
    print("  Bicycle (& Scissors): Intermediate")
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
