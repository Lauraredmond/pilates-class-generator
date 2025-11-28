"""
Backfill Class History from Class Plans

This script migrates existing class_plans to class_history table
for users whose analytics are showing zero due to the regression fix.

USAGE:
    python scripts/backfill_class_history.py [--user-id USER_ID] [--dry-run]

    --user-id: Only backfill for specific user (optional)
    --dry-run: Preview what would be done without making changes
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)


def backfill_class_history(user_id: str = None, dry_run: bool = False):
    """
    Backfill class_history from existing class_plans

    Args:
        user_id: If provided, only backfill for this user
        dry_run: If True, only preview changes without writing to database
    """

    logger.info("=" * 80)
    logger.info("BACKFILL CLASS HISTORY FROM CLASS PLANS")
    logger.info("=" * 80)

    if dry_run:
        logger.warning("🔍 DRY RUN MODE - No changes will be made to database")

    # Step 1: Fetch all class_plans (or for specific user)
    query = supabase.table('class_plans').select('*')

    if user_id:
        query = query.eq('user_id', user_id)
        logger.info(f"📊 Fetching class plans for user: {user_id}")
    else:
        logger.info("📊 Fetching ALL class plans from database")

    class_plans_response = query.execute()
    class_plans = class_plans_response.data or []

    logger.info(f"✅ Found {len(class_plans)} class plans to process")

    if not class_plans:
        logger.warning("⚠️ No class plans found. Nothing to backfill.")
        return

    # Step 2: Check which ones already have class_history entries
    existing_history_response = supabase.table('class_history').select('class_plan_id').execute()
    existing_history_ids = {h['class_plan_id'] for h in (existing_history_response.data or [])}

    logger.info(f"📋 {len(existing_history_ids)} class plans already have history entries")

    # Step 3: Backfill missing entries
    backfilled_count = 0
    skipped_count = 0

    for class_plan in class_plans:
        plan_id = class_plan['id']

        # Skip if already has history entry
        if plan_id in existing_history_ids:
            logger.debug(f"⏭️ Skipping {plan_id[:8]}... (already has history)")
            skipped_count += 1
            continue

        # Create class_history entry
        class_history_entry = {
            'class_plan_id': plan_id,
            'user_id': class_plan['user_id'],
            'taught_date': class_plan.get('created_at', datetime.now().isoformat())[:10],  # Extract date part
            'actual_duration_minutes': class_plan.get('duration_minutes', 0),
            'attendance_count': 1,  # Assume self-practice
            'movements_snapshot': class_plan.get('movements', []),
            'instructor_notes': class_plan.get('notes', f"Backfilled from class plan (created {class_plan.get('created_at', 'unknown')})"),
            'difficulty_rating': None,
            'muscle_groups_targeted': [],
            'total_movements_taught': len(class_plan.get('movements', [])),
            'created_at': datetime.now().isoformat()
        }

        if dry_run:
            logger.info(f"🔍 [DRY RUN] Would create history for class plan {plan_id[:8]}... ({class_plan.get('name', 'Unnamed')})")
            backfilled_count += 1
        else:
            try:
                supabase.table('class_history').insert(class_history_entry).execute()
                logger.info(f"✅ Backfilled history for class plan {plan_id[:8]}... ({class_plan.get('name', 'Unnamed')})")
                backfilled_count += 1
            except Exception as e:
                logger.error(f"❌ Failed to backfill {plan_id[:8]}...: {e}")

    # Step 4: Summary
    logger.info("=" * 80)
    logger.info("BACKFILL COMPLETE")
    logger.info("=" * 80)
    logger.info(f"📊 Total class plans processed: {len(class_plans)}")
    logger.info(f"✅ Backfilled: {backfilled_count}")
    logger.info(f"⏭️ Skipped (already had history): {skipped_count}")

    if dry_run:
        logger.warning("🔍 This was a DRY RUN - run again without --dry-run to apply changes")
    else:
        logger.success(f"🎉 Successfully backfilled {backfilled_count} class history entries!")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Backfill class_history from class_plans")
    parser.add_argument("--user-id", type=str, help="Only backfill for specific user ID")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing to database")

    args = parser.parse_args()

    backfill_class_history(
        user_id=args.user_id,
        dry_run=args.dry_run
    )
