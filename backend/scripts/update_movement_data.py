#!/usr/bin/env python3
"""
Update Movement Data Script
Populates duration_seconds and movement_pattern for all 34 classical Pilates movements
Session 7: Database Data Fix
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from loguru import logger

# Load environment variables
load_dotenv()

# Configure logger
logger.remove()
logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>")


class MovementDataUpdater:
    """Updates movement durations and patterns in the database"""

    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info(f"Connected to Supabase: {self.supabase_url}")

    def add_movement_pattern_column(self):
        """Check if movement_pattern column exists"""
        logger.info("Checking for movement_pattern column...")

        try:
            # Try to select movement_pattern - if it fails, column doesn't exist
            result = self.supabase.table('movements').select('movement_pattern').limit(1).execute()
            logger.success("✓ movement_pattern column already exists")
            return True
        except Exception as e:
            # Column doesn't exist
            logger.warning(f"movement_pattern column not found")
            logger.warning("Will update durations only for now")
            return False

    def update_movement_data(self, has_pattern_column=True):
        """Update all movements with durations and patterns"""
        logger.info("Updating movement durations and patterns...")

        # Movement data: name -> (duration_seconds, movement_pattern)
        # Names match EXACTLY what's in the database
        movement_updates = {
            # Beginner Level (1-14)
            'The Hundred': (100, 'flexion'),
            'The Roll Up': (90, 'flexion'),
            'The Roll Over': (75, 'flexion'),
            'One leg circle': (120, 'flexion'),
            'Rolling back': (60, 'flexion'),
            'One leg stretch': (90, 'flexion'),  # Fixed name
            'Double leg stretch': (90, 'flexion'),
            'Spine stretch': (120, 'flexion'),  # Fixed name
            'Rocker with Open legs': (75, 'flexion'),  # Fixed name
            'The Corkscrew': (90, 'rotation'),  # Fixed name
            'The Saw': (120, 'rotation'),
            'The Swan Dive': (75, 'extension'),  # Fixed name
            'One leg kick': (90, 'extension'),  # Fixed name
            'Double leg kick': (90, 'extension'),

            # Intermediate Level (15-24)
            'Neck pull': (120, 'flexion'),
            'Scissors': (90, 'flexion'),
            'Bicycle (& Scissors)': (90, 'flexion'),  # Fixed name
            'Shoulder Bridge': (120, 'extension'),  # Fixed name (capitalized)
            'Spine twist': (90, 'rotation'),  # Fixed name (lowercase)
            'Jack knife': (75, 'flexion'),
            'Side kick': (120, 'lateral'),
            'Teaser': (90, 'balance'),

            # Advanced Level (23-34)
            'Hip twist': (90, 'rotation'),  # Fixed name
            'Swimming': (90, 'extension'),
            'Leg pull prone': (75, 'extension'),  # Fixed name
            'Leg pull supine': (75, 'extension'),  # Fixed name
            'Side kick kneeling': (90, 'lateral'),  # Fixed name
            'Side bend': (90, 'lateral'),  # Fixed name
            'Boomerang': (90, 'balance'),
            'The Seal': (60, 'flexion'),  # Fixed name
            'The Crab': (90, 'flexion'),  # Fixed name (not Control Balance)
            'Rocking': (75, 'extension'),
            'Control balance': (90, 'balance'),  # Fixed name (lowercase)
            'Push up': (75, 'extension'),
        }

        updated_count = 0
        failed_count = 0
        not_found = []

        for movement_name, (duration, pattern) in movement_updates.items():
            try:
                # Prepare update data
                update_data = {'duration_seconds': duration}
                if has_pattern_column:
                    update_data['movement_pattern'] = pattern

                # Update the movement
                result = self.supabase.table('movements').update(update_data).eq('name', movement_name).execute()

                if result.data:
                    updated_count += 1
                    if has_pattern_column:
                        logger.success(f"✓ {movement_name}: {duration}s, {pattern}")
                    else:
                        logger.success(f"✓ {movement_name}: {duration}s")
                else:
                    not_found.append(movement_name)
                    logger.warning(f"⚠ Movement not found: {movement_name}")

            except Exception as e:
                failed_count += 1
                logger.error(f"✗ Failed to update {movement_name}: {e}")

        logger.info(f"\nUpdate Summary:")
        logger.info(f"  Updated: {updated_count}")
        logger.info(f"  Failed: {failed_count}")
        logger.info(f"  Not found: {len(not_found)}")

        if not_found:
            logger.warning(f"\nMovements not found in database:")
            for name in not_found:
                logger.warning(f"  - {name}")

        return updated_count, failed_count, not_found

    def validate_updates(self, has_pattern_column=True):
        """Validate that all movements have duration and pattern"""
        logger.info("\nValidating movement data...")

        try:
            # Get all movements (conditional on pattern column)
            if has_pattern_column:
                result = self.supabase.table('movements').select(
                    'movement_number, name, duration_seconds, movement_pattern, difficulty_level'
                ).order('movement_number').execute()
            else:
                result = self.supabase.table('movements').select(
                    'movement_number, name, duration_seconds, difficulty_level'
                ).order('movement_number').execute()

            movements = result.data

            if not movements:
                logger.error("No movements found in database!")
                return False

            # Check for missing data
            missing_duration = [m for m in movements if m['duration_seconds'] is None]
            missing_pattern = [m for m in movements if has_pattern_column and m.get('movement_pattern') is None]

            logger.info(f"\nTotal movements: {len(movements)}")
            logger.info(f"Missing duration: {len(missing_duration)}")
            if has_pattern_column:
                logger.info(f"Missing pattern: {len(missing_pattern)}")

            if missing_duration:
                logger.warning("\nMovements without duration:")
                for m in missing_duration[:10]:  # Show first 10
                    logger.warning(f"  {m['movement_number']}. {m['name']}")
                if len(missing_duration) > 10:
                    logger.warning(f"  ... and {len(missing_duration) - 10} more")

            if has_pattern_column and missing_pattern:
                logger.warning("\nMovements without pattern:")
                for m in missing_pattern[:10]:  # Show first 10
                    logger.warning(f"  {m['movement_number']}. {m['name']}")
                if len(missing_pattern) > 10:
                    logger.warning(f"  ... and {len(missing_pattern) - 10} more")

            # Display sample of updated movements
            logger.info("\nSample of updated movements:")
            for m in movements[:5]:
                if has_pattern_column:
                    logger.info(
                        f"  {m['movement_number']}. {m['name']}: "
                        f"{m['duration_seconds']}s, {m.get('movement_pattern', 'N/A')} "
                        f"({m['difficulty_level']})"
                    )
                else:
                    logger.info(
                        f"  {m['movement_number']}. {m['name']}: "
                        f"{m['duration_seconds']}s ({m['difficulty_level']})"
                    )

            # Summary
            if has_pattern_column:
                success = len(missing_duration) == 0 and len(missing_pattern) == 0
            else:
                success = len(missing_duration) == 0

            if success:
                logger.success("\n✅ VALIDATION PASSED!")
                if has_pattern_column:
                    logger.success(f"All {len(movements)} movements have duration and pattern data")
                else:
                    logger.success(f"All {len(movements)} movements have duration data")
            else:
                logger.warning("\n⚠ VALIDATION INCOMPLETE")
                logger.warning(f"{len(missing_duration)} movements missing duration")
                if has_pattern_column:
                    logger.warning(f"{len(missing_pattern)} movements missing pattern")

            return success

        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False

    def run(self):
        """Execute the complete update process"""
        logger.info("="*60)
        logger.info("MOVEMENT DATA UPDATE")
        logger.info("="*60)

        try:
            # Step 1: Check movement_pattern column
            logger.info("\nSTEP 1: Check movement_pattern column")
            has_column = self.add_movement_pattern_column()

            if not has_column:
                logger.warning("\nWARNING: movement_pattern column not found")
                logger.warning("Will update duration_seconds only")
                logger.info("\nTo add movement_pattern column later:")
                logger.info("1. Go to Supabase SQL Editor")
                logger.info("2. Run the SQL from: backend/scripts/populate_movement_data.sql")

            # Step 2: Update movement data
            logger.info("\nSTEP 2: Update movement data")
            updated, failed, not_found = self.update_movement_data(has_pattern_column=has_column)

            if failed > 0:
                logger.warning(f"\n⚠ {failed} updates failed")

            # Step 3: Validate
            logger.info("\nSTEP 3: Validate updates")
            validation_passed = self.validate_updates(has_pattern_column=has_column)

            # Summary
            logger.info("\n" + "="*60)
            if validation_passed and failed == 0:
                logger.success("✅ MOVEMENT DATA UPDATE COMPLETED SUCCESSFULLY!")
                logger.info("="*60)
                logger.info("\nNext steps:")
                logger.info("  1. Test sequence generation: python agents/sequence_agent.py")
                logger.info("  2. Check backend API: http://localhost:8000/api/movements")
                logger.info("  3. Verify movement stats: http://localhost:8000/api/movements/stats/summary")
                return True
            else:
                logger.error("❌ MOVEMENT DATA UPDATE INCOMPLETE")
                logger.info("="*60)
                if not_found:
                    logger.info("\nAction needed: Check movement names in database")
                    logger.info("Run this to see all movement names:")
                    logger.info("  SELECT name FROM movements ORDER BY movement_number;")
                return False

        except Exception as e:
            logger.error(f"\n❌ UPDATE FAILED: {e}")
            return False


def main():
    """Main entry point"""
    try:
        updater = MovementDataUpdater()
        success = updater.run()

        if success:
            logger.success("\n✅ All done! Movement data is complete.")
            return 0
        else:
            logger.error("\n❌ Update incomplete. Check logs above for details.")
            return 1

    except Exception as e:
        logger.error(f"\n❌ Fatal error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
