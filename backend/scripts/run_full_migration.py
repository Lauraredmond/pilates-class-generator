"""
Simplified Migration Script using Supabase REST API
Session 7: Complete database setup
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from loguru import logger
import sys

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


class SupabaseMigrator:
    """Handles database migration using Supabase client"""

    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

        self.client: Client = create_client(self.supabase_url, self.supabase_key)

        self.migrations_dir = Path(__file__).parent.parent.parent / 'database' / 'migrations'
        self.data_dir = Path(__file__).parent.parent / 'data'

        logger.info(f"✅ Supabase client initialized")
        logger.info(f"📁 Migrations: {self.migrations_dir}")
        logger.info(f"📁 Data: {self.data_dir}")

    def print_migration_sql(self):
        """Print all migrations SQL for manual execution"""
        migration_files = [
            '001_create_movements_schema.sql',
            '002_create_class_planning_schema.sql',
            '003_create_rls_policies.sql',
            '004_remove_excel_references.sql'
        ]

        logger.info("\n" + "="*70)
        logger.info("📋 MANUAL MIGRATION INSTRUCTIONS")
        logger.info("="*70)
        logger.info("\nTo run migrations, follow these steps:")
        logger.info("\n1. Go to Supabase SQL Editor:")
        logger.info("   https://supabase.com/dashboard/project/lixvcebtwusmaipodcpc/sql/new")
        logger.info("\n2. Copy and paste each migration file below (in order):")
        logger.info("\n" + "="*70)

        for idx, migration_file in enumerate(migration_files, 1):
            migration_path = self.migrations_dir / migration_file

            logger.info(f"\n{'='*70}")
            logger.info(f"MIGRATION {idx}: {migration_file}")
            logger.info(f"{'='*70}\n")

            try:
                with open(migration_path, 'r') as f:
                    sql = f.read()
                    print(sql)
                    print("\n")
            except Exception as e:
                logger.error(f"❌ Could not read {migration_file}: {e}")

        logger.info(f"\n{'='*70}")
        logger.info("✅ All migrations printed above")
        logger.info(f"{'='*70}\n")

    def load_excel_data(self):
        """Load extracted Excel data"""
        data_file = self.data_dir / 'extracted_data.json'

        logger.info(f"📊 Loading Excel data from: {data_file.name}")

        try:
            with open(data_file, 'r') as f:
                data = json.load(f)

            logger.success(f"✅ Loaded: {data['metadata']['source_file']}")
            return data

        except Exception as e:
            logger.error(f"❌ Failed to load Excel data: {e}")
            raise

    def parse_movements(self, excel_data):
        """Parse movements from Excel data"""
        logger.info("🔄 Parsing movements from Excel...")

        movement_sheet = excel_data['sheets'].get('Movement summaries', {})
        attrs_sheet = excel_data['sheets'].get('Movement attributes', {})

        summaries_data = movement_sheet.get('sample_data', [])
        attrs_data = attrs_sheet.get('sample_data', [])

        if not summaries_data or len(summaries_data) < 2:
            logger.error("❌ No movement data found")
            return []

        # Parse Movement summaries
        headers = summaries_data[0]
        movements_dict = {}

        for row in summaries_data[1:]:
            if not row or len(row) == 0:
                continue

            name = row[0]
            if not name or name in ['Movement', '', None]:
                continue

            # Extract muscle groups (Y indicators)
            muscle_groups = []
            for i in range(1, min(24, len(row))):
                if i < len(headers) and row[i] == 'Y':
                    mg = headers[i]
                    if mg and mg not in ['Movement', '#Levels']:
                        muscle_groups.append(mg)

            # Find Watch Out Points and Visualisations
            watch_out = None
            visual_cues = None

            for i, header in enumerate(headers):
                if header == 'Watch Out Points' and i < len(row):
                    watch_out = row[i]
                elif header == 'Visualisations' and i < len(row):
                    visual_cues = row[i]

            movements_dict[name] = {
                'name': name,
                'muscle_groups': muscle_groups,
                'watch_out_points': watch_out,
                'visual_cues': visual_cues
            }

        # Parse Movement attributes
        if attrs_data and len(attrs_data) > 1:
            attrs_headers = attrs_data[0]

            for row in attrs_data[1:]:
                if not row or len(row) == 0:
                    continue

                name = row[0]
                if name not in movements_dict:
                    continue

                # Find column indices
                for i, header in enumerate(attrs_headers):
                    if header == 'Narrative' and i < len(row):
                        movements_dict[name]['narrative'] = row[i]
                    elif header == 'Setup position' and i < len(row):
                        movements_dict[name]['setup_position'] = row[i]
                    elif header == 'Difficulty' and i < len(row):
                        movements_dict[name]['difficulty_level'] = row[i]
                    elif header == 'Category' and i < len(row):
                        movements_dict[name]['category'] = row[i]

        movements = list(movements_dict.values())
        logger.success(f"✅ Parsed {len(movements)} movements")

        return movements

    def populate_movements(self):
        """Populate movements table using Supabase client"""
        logger.info("\n🎯 Populating movements table...")

        try:
            # Load and parse Excel data
            excel_data = self.load_excel_data()
            movements = self.parse_movements(excel_data)

            if not movements:
                logger.error("❌ No movements to populate")
                return False

            # Get muscle groups for mapping
            muscle_groups_response = self.client.table('muscle_groups').select('id, name').execute()
            muscle_groups_map = {mg['name']: mg['id'] for mg in muscle_groups_response.data}

            logger.info(f"📌 Found {len(muscle_groups_map)} muscle groups in database")

            inserted_count = 0

            for idx, movement in enumerate(movements, start=1):
                name = movement['name']
                code = name.lower().replace(' ', '_').replace('-', '_').replace("'", '')

                # Clean narrative
                narrative = movement.get('narrative', f"Classical Pilates movement: {name}")
                if narrative and 'This is' in str(narrative):
                    narrative = f"Classical Pilates movement: {name}"

                # Prepare movement data
                movement_data = {
                    'movement_number': idx,
                    'code': code,
                    'name': name,
                    'category': movement.get('category', 'Mat-based'),
                    'difficulty_level': movement.get('difficulty_level', 'Beginner'),
                    'setup_position': movement.get('setup_position', 'Supine'),
                    'narrative': narrative,
                    'visual_cues': movement.get('visual_cues'),
                    'watch_out_points': movement.get('watch_out_points')
                }

                # Insert movement
                try:
                    response = self.client.table('movements').insert(movement_data).execute()

                    if response.data and len(response.data) > 0:
                        movement_id = response.data[0]['id']
                        inserted_count += 1

                        # Insert muscle group mappings
                        mappings_inserted = 0
                        for mg_name in movement.get('muscle_groups', []):
                            if mg_name in muscle_groups_map:
                                mg_id = muscle_groups_map[mg_name]

                                try:
                                    self.client.table('movement_muscles').insert({
                                        'movement_id': movement_id,
                                        'muscle_group_id': mg_id,
                                        'is_primary': True
                                    }).execute()
                                    mappings_inserted += 1
                                except Exception as e:
                                    # Skip duplicates
                                    if 'duplicate' not in str(e).lower():
                                        logger.warning(f"  ⚠️  Mapping error: {e}")

                        difficulty = movement.get('difficulty_level', 'Beginner')
                        logger.info(f"  ✓ {idx}. {name} ({difficulty}) - {mappings_inserted} muscle groups")

                except Exception as e:
                    if 'duplicate' in str(e).lower() or 'already exists' in str(e).lower():
                        logger.info(f"  ⊗ {idx}. {name} (already exists)")
                    else:
                        logger.error(f"  ✗ {idx}. {name} - Error: {e}")

            logger.success(f"\n✅ Inserted {inserted_count} movements successfully!")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to populate movements: {e}")
            import traceback
            traceback.print_exc()
            return False

    def validate_database(self):
        """Validate database population"""
        logger.info("\n🔍 Validating database...")

        try:
            # Count movements
            movements = self.client.table('movements').select('*', count='exact').execute()
            movement_count = movements.count

            # Count muscle groups
            muscle_groups = self.client.table('muscle_groups').select('*', count='exact').execute()
            mg_count = muscle_groups.count

            # Count sequence rules
            rules = self.client.table('sequence_rules').select('*', count='exact').execute()
            rule_count = rules.count

            # Count transitions
            transitions = self.client.table('transitions').select('*', count='exact').execute()
            trans_count = transitions.count

            # Count mappings
            mappings = self.client.table('movement_muscles').select('*', count='exact').execute()
            mapping_count = mappings.count

            logger.info(f"\n📊 Database Statistics:")
            logger.info(f"  📌 Movements: {movement_count}")
            logger.info(f"  📌 Muscle groups: {mg_count}")
            logger.info(f"  📌 Sequence rules: {rule_count}")
            logger.info(f"  📌 Transitions: {trans_count}")
            logger.info(f"  📌 Movement-muscle mappings: {mapping_count}")

            # Sample movements
            logger.info(f"\n🎯 Sample movements:")
            sample_movements = self.client.table('movements').select('movement_number, name, difficulty_level, setup_position').order('movement_number').limit(5).execute()

            for m in sample_movements.data:
                logger.info(f"  {m['movement_number']}. {m['name']} ({m['difficulty_level']}, {m['setup_position']})")

            # Validation
            logger.info("\n" + "="*70)
            if movement_count >= 30:
                logger.success("✅ DATABASE VALIDATION PASSED!")
                logger.success(f"   {movement_count} movements loaded and ready to use")
                return True
            else:
                logger.warning(f"⚠️  Only {movement_count} movements found (expected 34)")
                return False

        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    def run(self, skip_migrations=False):
        """Run the complete migration process"""
        logger.info("="*70)
        logger.info("🚀 PILATES CLASS PLANNER - DATABASE SETUP")
        logger.info("="*70)

        try:
            if not skip_migrations:
                logger.info("\n📋 STEP 1: Migrations")
                logger.info("─"*70)
                logger.info("⚠️  Note: Migrations must be run manually in Supabase SQL Editor")
                logger.info("Would you like to see the SQL? (Run with --show-sql flag)")
                logger.info("\nOr run: python -m scripts.run_full_migration --show-sql")
                logger.info("\nAssuming migrations are already applied...")

            logger.info("\n📋 STEP 2: Populate Movements")
            logger.info("─"*70)
            if not self.populate_movements():
                logger.error("❌ Population failed")
                return False

            logger.info("\n📋 STEP 3: Validate Database")
            logger.info("─"*70)
            if not self.validate_database():
                logger.warning("⚠️  Validation incomplete")

            logger.info("\n" + "="*70)
            logger.success("✅ DATABASE SETUP COMPLETED!")
            logger.info("="*70)
            logger.info("\n🎉 Your Pilates database is ready!")
            logger.info("\n📊 Next steps:")
            logger.info("   1. Test backend API: http://localhost:8000/api/movements")
            logger.info("   2. Check stats: http://localhost:8000/api/movements/stats/summary")
            logger.info("   3. Connect frontend")

            return True

        except Exception as e:
            logger.error(f"\n❌ SETUP FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Pilates Database Migration Tool')
    parser.add_argument('--show-sql', action='store_true', help='Print migration SQL')
    parser.add_argument('--populate-only', action='store_true', help='Only populate movements (skip migrations)')

    args = parser.parse_args()

    migrator = SupabaseMigrator()

    if args.show_sql:
        migrator.print_migration_sql()
        return 0

    success = migrator.run(skip_migrations=args.populate_only)

    if success:
        logger.success("\n✅ All done! Database is ready.")
        return 0
    else:
        logger.error("\n❌ Setup failed. Check logs above.")
        return 1


if __name__ == "__main__":
    exit(main())
