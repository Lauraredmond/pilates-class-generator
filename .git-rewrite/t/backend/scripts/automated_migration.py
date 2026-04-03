"""
Automated Database Migration and Population Script
Session 7: Complete database setup with data population
"""

import os
import json
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger
import sys

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))


class DatabaseMigrator:
    """Handles automated database migration and population"""

    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        # Database password (different from service role key)
        # Get from: Supabase Dashboard → Settings → Database → Connection string
        self.db_password = os.getenv('SUPABASE_DB_PASSWORD', self.supabase_key)

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

        # Extract database connection from Supabase URL
        # Format: https://PROJECT_REF.supabase.co
        project_ref = self.supabase_url.replace('https://', '').replace('.supabase.co', '')

        # Supabase direct connection string format
        # Using connection pooler (port 6543 for session mode)
        self.db_url = f"postgresql://postgres.{project_ref}:{self.db_password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

        self.migrations_dir = Path(__file__).parent.parent.parent / 'database' / 'migrations'
        self.data_dir = Path(__file__).parent.parent / 'data'

        logger.info(f"Migrations directory: {self.migrations_dir}")
        logger.info(f"Data directory: {self.data_dir}")
        logger.info(f"Project reference: {project_ref}")

    def connect(self):
        """Establish database connection"""
        try:
            conn = psycopg2.connect(self.db_url)
            logger.success("✅ Database connection established")
            return conn
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise

    def run_migration_file(self, conn, migration_file: str):
        """Execute a single migration SQL file"""
        migration_path = self.migrations_dir / migration_file

        logger.info(f"📄 Running migration: {migration_file}")

        try:
            with open(migration_path, 'r') as f:
                sql = f.read()

            cursor = conn.cursor()
            cursor.execute(sql)
            conn.commit()
            cursor.close()

            logger.success(f"✅ {migration_file} completed successfully")
            return True

        except Exception as e:
            logger.error(f"❌ {migration_file} failed: {e}")
            conn.rollback()
            return False

    def run_all_migrations(self):
        """Execute all migration files in order"""
        migration_files = [
            '001_create_movements_schema.sql',
            '002_create_class_planning_schema.sql',
            '003_create_rls_policies.sql',
            '004_remove_excel_references.sql'
        ]

        logger.info("🚀 Starting database migrations...")

        conn = self.connect()

        try:
            for migration_file in migration_files:
                success = self.run_migration_file(conn, migration_file)
                if not success:
                    logger.error(f"Migration stopped at {migration_file}")
                    return False

            logger.success("✅ All migrations completed successfully!")
            return True

        finally:
            conn.close()
            logger.info("Database connection closed")

    def load_excel_data(self):
        """Load extracted Excel data"""
        data_file = self.data_dir / 'extracted_data.json'

        logger.info(f"📊 Loading Excel data from {data_file}")

        try:
            with open(data_file, 'r') as f:
                data = json.load(f)

            logger.success(f"✅ Loaded data from {data['metadata']['source_file']}")
            return data

        except Exception as e:
            logger.error(f"❌ Failed to load Excel data: {e}")
            raise

    def parse_movement_data(self, excel_data):
        """Transform Excel JSON into movement records"""
        logger.info("🔄 Parsing movement data from Excel...")

        # Get Movement summaries sheet data
        movement_sheet = excel_data['sheets'].get('Movement summaries', {})
        sample_data = movement_sheet.get('sample_data', [])

        if not sample_data or len(sample_data) < 2:
            logger.error("❌ No movement data found in Excel")
            return []

        # First row is headers, skip it
        headers = sample_data[0]

        # Find key column indices
        movement_col = 0  # "Movement" is first column
        levels_col = headers.index('#Levels') if '#Levels' in headers else None
        watch_out_col = None
        visual_col = None

        for i, header in enumerate(headers):
            if header == 'Watch Out Points':
                watch_out_col = i
            elif header == 'Visualisations':
                visual_col = i

        movements = []

        # Parse each movement row (skip header row)
        for row in sample_data[1:]:
            if not row or len(row) == 0:
                continue

            movement_name = row[movement_col]

            # Skip empty rows or non-movement rows
            if not movement_name or movement_name in ['Movement', '', None]:
                continue

            # Extract muscle groups (Y indicators in columns 1-23)
            muscle_groups = []
            for i in range(1, min(24, len(row))):
                if i < len(headers) and row[i] == 'Y':
                    muscle_group = headers[i]
                    if muscle_group and muscle_group not in ['Movement', '#Levels']:
                        muscle_groups.append(muscle_group)

            # Extract other fields
            levels = row[levels_col] if levels_col and levels_col < len(row) else None
            watch_out = row[watch_out_col] if watch_out_col and watch_out_col < len(row) else None
            visual_cues = row[visual_col] if visual_col and visual_col < len(row) else None

            movement = {
                'name': movement_name,
                'muscle_groups': muscle_groups,
                'levels': levels,
                'watch_out_points': watch_out,
                'visual_cues': visual_cues
            }

            movements.append(movement)

        logger.success(f"✅ Parsed {len(movements)} movements from Excel")
        return movements

    def get_movement_attributes(self, excel_data):
        """Get additional movement attributes from Movement attributes sheet"""
        logger.info("🔄 Loading movement attributes...")

        attrs_sheet = excel_data['sheets'].get('Movement attributes', {})
        sample_data = attrs_sheet.get('sample_data', [])

        if not sample_data or len(sample_data) < 2:
            return {}

        # Parse headers and data
        headers = sample_data[0]

        # Find column indices
        name_col = 0
        narrative_col = headers.index('Narrative') if 'Narrative' in headers else None
        setup_col = headers.index('Setup position') if 'Setup position' in headers else None
        difficulty_col = headers.index('Difficulty') if 'Difficulty' in headers else None
        category_col = headers.index('Category') if 'Category' in headers else None

        attributes = {}

        for row in sample_data[1:]:
            if not row or len(row) == 0:
                continue

            name = row[name_col]
            if not name or name in ['Movement', '', None]:
                continue

            attributes[name] = {
                'narrative': row[narrative_col] if narrative_col and narrative_col < len(row) else None,
                'setup_position': row[setup_col] if setup_col and setup_col < len(row) else 'Supine',
                'difficulty_level': row[difficulty_col] if difficulty_col and difficulty_col < len(row) else 'Beginner',
                'category': row[category_col] if category_col and category_col < len(row) else 'Mat-based'
            }

        logger.success(f"✅ Loaded attributes for {len(attributes)} movements")
        return attributes

    def populate_movements(self):
        """Populate movements table from Excel data"""
        logger.info("🎯 Populating movements table...")

        # Load Excel data
        excel_data = self.load_excel_data()

        # Parse movement data
        movements = self.parse_movement_data(excel_data)
        attributes = self.get_movement_attributes(excel_data)

        if not movements:
            logger.error("❌ No movements to populate")
            return False

        # Connect to database
        conn = self.connect()
        cursor = conn.cursor()

        try:
            inserted_count = 0

            for idx, movement in enumerate(movements, start=1):
                name = movement['name']

                # Get attributes for this movement
                attrs = attributes.get(name, {})

                # Generate code (URL-friendly version)
                code = name.lower().replace(' ', '_').replace('-', '_')

                # Clean narrative (replace placeholder text)
                narrative = attrs.get('narrative')
                if narrative and 'This is' in narrative:
                    narrative = f"Classical Pilates movement: {name}"

                # Insert movement
                insert_sql = """
                INSERT INTO movements (
                    movement_number,
                    code,
                    name,
                    category,
                    difficulty_level,
                    setup_position,
                    narrative,
                    visual_cues,
                    watch_out_points,
                    breathing_pattern
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (name) DO NOTHING
                RETURNING id;
                """

                cursor.execute(insert_sql, (
                    idx,
                    code,
                    name,
                    attrs.get('category', 'Mat-based'),
                    attrs.get('difficulty_level', 'Beginner'),
                    attrs.get('setup_position', 'Supine'),
                    narrative,
                    movement.get('visual_cues'),
                    movement.get('watch_out_points'),
                    None  # breathing_pattern as JSONB
                ))

                result = cursor.fetchone()
                if result:
                    movement_id = result[0]
                    inserted_count += 1

                    # Insert muscle group mappings
                    for muscle_group_name in movement.get('muscle_groups', []):
                        # Get muscle group ID
                        cursor.execute(
                            "SELECT id FROM muscle_groups WHERE name = %s",
                            (muscle_group_name,)
                        )
                        mg_result = cursor.fetchone()

                        if mg_result:
                            mg_id = mg_result[0]

                            # Insert mapping
                            cursor.execute("""
                                INSERT INTO movement_muscles (movement_id, muscle_group_id, is_primary)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (movement_id, muscle_group_id) DO NOTHING
                            """, (movement_id, mg_id, True))

                    logger.info(f"  ✓ {idx}. {name} ({attrs.get('difficulty_level', 'Beginner')})")

            conn.commit()
            logger.success(f"✅ Inserted {inserted_count} movements successfully!")

            return True

        except Exception as e:
            logger.error(f"❌ Failed to populate movements: {e}")
            conn.rollback()
            return False

        finally:
            cursor.close()
            conn.close()

    def validate_database(self):
        """Validate migration and data population"""
        logger.info("🔍 Validating database...")

        conn = self.connect()
        cursor = conn.cursor()

        try:
            # Check tables exist
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = [row[0] for row in cursor.fetchall()]

            expected_tables = [
                'movements', 'muscle_groups', 'movement_muscles',
                'sequence_rules', 'transitions', 'teaching_cues',
                'users', 'class_plans', 'class_movements',
                'class_history', 'movement_usage', 'student_profiles'
            ]

            logger.info(f"📊 Tables created: {len(tables)}")
            for table in tables:
                logger.info(f"  ✓ {table}")

            # Verify expected tables
            missing_tables = [t for t in expected_tables if t not in tables]
            if missing_tables:
                logger.warning(f"⚠️  Missing tables: {missing_tables}")

            # Count movements
            cursor.execute("SELECT COUNT(*) FROM movements;")
            movement_count = cursor.fetchone()[0]
            logger.info(f"📌 Movements: {movement_count}")

            # Count muscle groups
            cursor.execute("SELECT COUNT(*) FROM muscle_groups;")
            mg_count = cursor.fetchone()[0]
            logger.info(f"📌 Muscle groups: {mg_count}")

            # Count sequence rules
            cursor.execute("SELECT COUNT(*) FROM sequence_rules;")
            rule_count = cursor.fetchone()[0]
            logger.info(f"📌 Sequence rules: {rule_count}")

            # Count transitions
            cursor.execute("SELECT COUNT(*) FROM transitions;")
            trans_count = cursor.fetchone()[0]
            logger.info(f"📌 Transitions: {trans_count}")

            # Count movement-muscle mappings
            cursor.execute("SELECT COUNT(*) FROM movement_muscles;")
            mapping_count = cursor.fetchone()[0]
            logger.info(f"📌 Movement-muscle mappings: {mapping_count}")

            # Sample movements
            logger.info("\n🎯 Sample movements:")
            cursor.execute("""
                SELECT movement_number, code, name, difficulty_level, setup_position
                FROM movements
                ORDER BY movement_number
                LIMIT 5;
            """)

            for row in cursor.fetchall():
                logger.info(f"  {row[0]}. {row[2]} ({row[3]}, {row[4]})")

            # Validation summary
            logger.info("\n" + "="*60)
            if movement_count >= 34 and mg_count >= 20 and rule_count >= 10:
                logger.success("✅ DATABASE VALIDATION PASSED!")
                logger.success(f"   - {movement_count} movements loaded")
                logger.success(f"   - {mg_count} muscle groups")
                logger.success(f"   - {rule_count} safety rules")
                logger.success(f"   - {trans_count} transitions")
                logger.success(f"   - {mapping_count} movement-muscle mappings")
                return True
            else:
                logger.warning("⚠️  Database populated but incomplete")
                return False

        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            return False

        finally:
            cursor.close()
            conn.close()

    def run_full_migration(self):
        """Execute complete migration process"""
        logger.info("="*60)
        logger.info("🚀 PILATES CLASS PLANNER - DATABASE MIGRATION")
        logger.info("="*60)

        try:
            # Step 1: Run migrations
            logger.info("\n📋 STEP 1: Running database migrations...")
            if not self.run_all_migrations():
                logger.error("❌ Migrations failed. Aborting.")
                return False

            # Step 2: Populate movements
            logger.info("\n📋 STEP 2: Populating movements from Excel data...")
            if not self.populate_movements():
                logger.error("❌ Movement population failed. Aborting.")
                return False

            # Step 3: Validate
            logger.info("\n📋 STEP 3: Validating database...")
            if not self.validate_database():
                logger.warning("⚠️  Validation incomplete but migration succeeded")

            logger.info("\n" + "="*60)
            logger.success("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            logger.info("="*60)
            logger.info("\n🎉 Your Pilates database is ready!")
            logger.info("📊 Next steps:")
            logger.info("   1. Test backend API: http://localhost:8000/api/movements")
            logger.info("   2. Check movement stats: http://localhost:8000/api/movements/stats/summary")
            logger.info("   3. Connect frontend to backend")

            return True

        except Exception as e:
            logger.error(f"\n❌ MIGRATION FAILED: {e}")
            return False


def main():
    """Main entry point"""
    migrator = DatabaseMigrator()
    success = migrator.run_full_migration()

    if success:
        logger.success("\n✅ All done! Database is ready to use.")
        return 0
    else:
        logger.error("\n❌ Migration failed. Check logs above for details.")
        return 1


if __name__ == "__main__":
    exit(main())
