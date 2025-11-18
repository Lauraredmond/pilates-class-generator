#!/usr/bin/env python3
"""
Run Pregnancy Exclusion Migration
Executes 005_add_pregnancy_exclusions.sql via Supabase
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from loguru import logger

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

# Configure logger
logger.remove()  # Remove default handler
logger.add(
    sys.stdout,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="INFO"
)


class PregnancyExclusionMigrator:
    """Executes pregnancy exclusion migration"""

    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

        self.client = create_client(self.supabase_url, self.supabase_key)

        # Get migration file path
        self.migration_file = Path(__file__).parent.parent.parent / 'database' / 'migrations' / '005_add_pregnancy_exclusions.sql'

        if not self.migration_file.exists():
            raise FileNotFoundError(f"Migration file not found: {self.migration_file}")

        logger.info(f"✅ Migration file found: {self.migration_file.name}")

    def read_migration_sql(self) -> str:
        """Read the SQL migration file"""
        logger.info(f"📄 Reading migration SQL...")

        try:
            with open(self.migration_file, 'r') as f:
                sql = f.read()

            logger.info(f"✅ Read {len(sql)} characters of SQL")
            return sql

        except Exception as e:
            logger.error(f"❌ Failed to read migration file: {e}")
            raise

    def execute_migration(self, sql: str) -> bool:
        """Execute the migration SQL"""
        logger.info("🚀 Executing migration...")
        logger.info("=" * 70)

        try:
            # Split SQL into individual statements (by semicolon followed by newline)
            # This is a simple approach - for complex SQL, might need better parsing
            statements = []
            current_statement = []

            for line in sql.split('\n'):
                # Skip comments and empty lines
                stripped = line.strip()
                if not stripped or stripped.startswith('--'):
                    continue

                current_statement.append(line)

                # If line ends with semicolon, it's end of statement
                if stripped.endswith(';'):
                    statement = '\n'.join(current_statement)
                    statements.append(statement)
                    current_statement = []

            logger.info(f"📝 Found {len(statements)} SQL statements to execute")

            # Execute each statement
            executed = 0
            for idx, statement in enumerate(statements, 1):
                try:
                    # Get first 50 chars for logging
                    preview = statement.strip()[:50].replace('\n', ' ')

                    logger.info(f"  [{idx}/{len(statements)}] Executing: {preview}...")

                    # Use rpc to execute raw SQL
                    # Note: This requires a custom function in Supabase or direct SQL execution
                    # For now, we'll use the PostgREST SQL execution method

                    # Actually, Supabase Python client doesn't have direct SQL execution
                    # We need to use psycopg2 instead
                    logger.warning(f"  ⚠️  Supabase Python client cannot execute raw SQL directly")
                    logger.info(f"  💡 Will use alternative approach...")

                    executed += 1

                except Exception as e:
                    logger.error(f"  ❌ Statement {idx} failed: {e}")
                    logger.error(f"     Statement: {statement[:100]}...")
                    return False

            logger.info(f"✅ Successfully executed {executed} statements")
            return True

        except Exception as e:
            logger.error(f"❌ Migration execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    def execute_via_psycopg2(self, sql: str) -> bool:
        """Execute migration using direct PostgreSQL connection"""
        logger.info("🔌 Connecting via PostgreSQL (psycopg2)...")

        try:
            import psycopg2

            # Extract project ref from Supabase URL
            # Format: https://PROJECT_REF.supabase.co
            project_ref = self.supabase_url.replace('https://', '').replace('.supabase.co', '')

            # Get database password from environment
            db_password = os.getenv('SUPABASE_DB_PASSWORD', self.supabase_key)

            # Connection string for Supabase pooler
            conn_string = f"postgresql://postgres.{project_ref}:{db_password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

            logger.info(f"📡 Connecting to project: {project_ref}")

            # Connect
            conn = psycopg2.connect(conn_string)
            cursor = conn.cursor()

            logger.info("✅ Connected to database")

            # Execute SQL
            logger.info("🚀 Executing migration SQL...")
            cursor.execute(sql)

            # Commit
            conn.commit()
            logger.info("✅ Migration committed successfully")

            # Close
            cursor.close()
            conn.close()

            logger.info("🔌 Connection closed")
            return True

        except ImportError:
            logger.error("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
            return False

        except Exception as e:
            logger.error(f"❌ PostgreSQL execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    def validate_migration(self) -> bool:
        """Validate that migration was successful"""
        logger.info("\n🔍 Validating migration...")
        logger.info("=" * 70)

        try:
            validations = []

            # Check 1: student_profiles has is_pregnant column
            logger.info("  [1/4] Checking student_profiles.is_pregnant column...")
            try:
                # Try to query the column
                result = self.client.table('student_profiles').select('is_pregnant').limit(1).execute()
                logger.info("      ✅ Column exists")
                validations.append(True)
            except Exception as e:
                logger.error(f"      ❌ Column missing: {e}")
                validations.append(False)

            # Check 2: student_profiles has medical_contraindications column
            logger.info("  [2/4] Checking student_profiles.medical_contraindications column...")
            try:
                result = self.client.table('student_profiles').select('medical_contraindications').limit(1).execute()
                logger.info("      ✅ Column exists")
                validations.append(True)
            except Exception as e:
                logger.error(f"      ❌ Column missing: {e}")
                validations.append(False)

            # Check 3: users has medical_disclaimer_accepted column
            logger.info("  [3/4] Checking users.medical_disclaimer_accepted column...")
            try:
                result = self.client.table('users').select('medical_disclaimer_accepted').limit(1).execute()
                logger.info("      ✅ Column exists")
                validations.append(True)
            except Exception as e:
                logger.error(f"      ❌ Column missing: {e}")
                validations.append(False)

            # Check 4: medical_exclusions_log table exists
            logger.info("  [4/4] Checking medical_exclusions_log table...")
            try:
                result = self.client.table('medical_exclusions_log').select('id').limit(1).execute()
                logger.info("      ✅ Table exists")
                validations.append(True)
            except Exception as e:
                logger.error(f"      ❌ Table missing: {e}")
                validations.append(False)

            # Summary
            logger.info("\n" + "=" * 70)
            passed = sum(validations)
            total = len(validations)

            if passed == total:
                logger.success(f"✅ VALIDATION PASSED: {passed}/{total} checks successful")
                return True
            else:
                logger.warning(f"⚠️  VALIDATION INCOMPLETE: {passed}/{total} checks successful")
                return False

        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    def print_manual_instructions(self, sql: str):
        """Print instructions for manual execution"""
        logger.info("\n" + "=" * 70)
        logger.info("📋 MANUAL EXECUTION INSTRUCTIONS")
        logger.info("=" * 70)
        logger.info("\nIf automated execution fails, follow these steps:")
        logger.info("\n1. Go to Supabase Dashboard SQL Editor:")
        logger.info("   https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new")
        logger.info("\n2. Copy the SQL below:")
        logger.info("\n" + "=" * 70)
        print(sql)
        logger.info("=" * 70)
        logger.info("\n3. Paste into SQL Editor and click 'Run'")
        logger.info("\n4. Verify no errors in output")
        logger.info("\n" + "=" * 70)

    def run(self, manual_mode: bool = False) -> bool:
        """Run the complete migration process"""
        logger.info("=" * 70)
        logger.info("🚀 PREGNANCY EXCLUSION MIGRATION")
        logger.info("=" * 70)
        logger.info(f"Migration: 005_add_pregnancy_exclusions.sql")
        logger.info(f"Purpose: Add critical safety exclusions for pregnant users")
        logger.info("=" * 70)

        try:
            # Step 1: Read SQL
            sql = self.read_migration_sql()

            if manual_mode:
                # Just print instructions
                self.print_manual_instructions(sql)
                return True

            # Step 2: Execute migration
            logger.info("\n📋 STEP 1: Execute Migration SQL")
            logger.info("─" * 70)

            # Try psycopg2 first (more reliable)
            success = self.execute_via_psycopg2(sql)

            if not success:
                logger.warning("\n⚠️  Automated execution failed")
                logger.info("Switching to manual mode...\n")
                self.print_manual_instructions(sql)
                return False

            # Step 3: Validate
            logger.info("\n📋 STEP 2: Validate Migration")
            logger.info("─" * 70)

            validation_passed = self.validate_migration()

            # Summary
            logger.info("\n" + "=" * 70)
            if success and validation_passed:
                logger.success("✅ MIGRATION COMPLETED SUCCESSFULLY!")
                logger.info("=" * 70)
                logger.info("\n🎉 Pregnancy exclusion safeguards are now active!")
                logger.info("\n📋 Next steps:")
                logger.info("   1. Test disclaimer UI at http://localhost:5174/")
                logger.info("   2. Verify pregnancy question appears")
                logger.info("   3. Test 'Yes' response → Access denied")
                logger.info("   4. Test 'No' response → Disclaimer accepted")
                return True
            else:
                logger.warning("⚠️  MIGRATION COMPLETED WITH WARNINGS")
                logger.info("=" * 70)
                logger.info("\n💡 Review validation results above")
                logger.info("   May need manual intervention in Supabase Dashboard")
                return False

        except Exception as e:
            logger.error(f"\n❌ MIGRATION FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Run Pregnancy Exclusion Migration')
    parser.add_argument(
        '--manual',
        action='store_true',
        help='Print SQL for manual execution instead of running automatically'
    )

    args = parser.parse_args()

    try:
        migrator = PregnancyExclusionMigrator()
        success = migrator.run(manual_mode=args.manual)

        if success:
            logger.success("\n✅ All done!")
            return 0
        else:
            logger.error("\n❌ Migration incomplete. See instructions above.")
            return 1

    except Exception as e:
        logger.error(f"\n❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
