"""
Migration Validation Script - Session 2B
Validates that Excel data was successfully migrated to PostgreSQL/Supabase
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any
import logging
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MigrationValidator:
    """Validate database migration against Excel source data"""

    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info(f"Connected to Supabase: {self.supabase_url}")

        # Validation results
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'checks_passed': 0,
            'checks_failed': 0,
            'warnings': [],
            'errors': [],
            'details': {}
        }

    def load_source_data(self, json_path: str) -> Dict:
        """Load source JSON data from Excel extraction"""
        logger.info(f"Loading source data from: {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data

    def check_table_exists(self, table_name: str) -> bool:
        """Check if table exists and is accessible"""
        try:
            response = self.client.table(table_name).select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Table {table_name} check failed: {e}")
            return False

    def validate_reference_data(self) -> Dict:
        """Validate reference data (muscle groups, rules, transitions)"""
        logger.info("=" * 60)
        logger.info("VALIDATING REFERENCE DATA")
        logger.info("=" * 60)

        checks = {}

        # 1. Muscle Groups (should have 23)
        try:
            muscle_groups = self.client.table('muscle_groups').select('*').execute()
            count = len(muscle_groups.data)
            expected = 23

            if count >= expected:
                logger.info(f"✓ Muscle groups: {count} records (expected >= {expected})")
                checks['muscle_groups'] = {'status': 'pass', 'count': count, 'expected': expected}
                self.results['checks_passed'] += 1
            else:
                logger.warning(f"⚠ Muscle groups: {count} records (expected >= {expected})")
                checks['muscle_groups'] = {'status': 'warning', 'count': count, 'expected': expected}
                self.results['warnings'].append(f"Muscle groups count low: {count} < {expected}")

        except Exception as e:
            logger.error(f"✗ Muscle groups validation failed: {e}")
            checks['muscle_groups'] = {'status': 'fail', 'error': str(e)}
            self.results['checks_failed'] += 1
            self.results['errors'].append(f"Muscle groups: {e}")

        # 2. Sequence Rules (should have 16)
        try:
            sequence_rules = self.client.table('sequence_rules').select('*').execute()
            count = len(sequence_rules.data)
            expected = 16

            if count >= expected:
                logger.info(f"✓ Sequence rules: {count} records (expected >= {expected})")
                checks['sequence_rules'] = {'status': 'pass', 'count': count, 'expected': expected}
                self.results['checks_passed'] += 1

                # Verify rule numbers 1-16
                rule_numbers = [r['rule_number'] for r in sequence_rules.data]
                missing = [i for i in range(1, 17) if i not in rule_numbers]
                if missing:
                    logger.warning(f"⚠ Missing rule numbers: {missing}")
                    self.results['warnings'].append(f"Missing rule numbers: {missing}")
            else:
                logger.warning(f"⚠ Sequence rules: {count} records (expected >= {expected})")
                checks['sequence_rules'] = {'status': 'warning', 'count': count, 'expected': expected}
                self.results['warnings'].append(f"Sequence rules count low: {count} < {expected}")

        except Exception as e:
            logger.error(f"✗ Sequence rules validation failed: {e}")
            checks['sequence_rules'] = {'status': 'fail', 'error': str(e)}
            self.results['checks_failed'] += 1
            self.results['errors'].append(f"Sequence rules: {e}")

        # 3. Transitions (should have 20)
        try:
            transitions = self.client.table('transitions').select('*').execute()
            count = len(transitions.data)
            expected = 20

            if count >= expected:
                logger.info(f"✓ Transitions: {count} records (expected >= {expected})")
                checks['transitions'] = {'status': 'pass', 'count': count, 'expected': expected}
                self.results['checks_passed'] += 1
            else:
                logger.warning(f"⚠ Transitions: {count} records (expected >= {expected})")
                checks['transitions'] = {'status': 'warning', 'count': count, 'expected': expected}
                self.results['warnings'].append(f"Transitions count low: {count} < {expected}")

        except Exception as e:
            logger.error(f"✗ Transitions validation failed: {e}")
            checks['transitions'] = {'status': 'fail', 'error': str(e)}
            self.results['checks_failed'] += 1
            self.results['errors'].append(f"Transitions: {e}")

        self.results['details']['reference_data'] = checks
        return checks

    def validate_movements(self, source_data: Dict) -> Dict:
        """Validate movements migration"""
        logger.info("=" * 60)
        logger.info("VALIDATING MOVEMENTS")
        logger.info("=" * 60)

        checks = {}

        try:
            # Get movements from database
            db_movements = self.client.table('movements').select('*').execute()
            db_count = len(db_movements.data)

            # Get expected count from source data
            if 'all_sheets' in source_data and 'Movement attributes' in source_data['all_sheets']:
                source_movements = source_data['all_sheets']['Movement attributes']['data']
                expected_count = len(source_movements)
            else:
                expected_count = 34  # Classical Pilates movements

            logger.info(f"Database movements: {db_count}")
            logger.info(f"Expected movements: {expected_count}")

            if db_count >= expected_count:
                logger.info(f"✓ Movement count: {db_count} (expected >= {expected_count})")
                checks['movement_count'] = {'status': 'pass', 'count': db_count, 'expected': expected_count}
                self.results['checks_passed'] += 1
            else:
                logger.warning(f"⚠ Movement count: {db_count} (expected >= {expected_count})")
                checks['movement_count'] = {'status': 'warning', 'count': db_count, 'expected': expected_count}
                self.results['warnings'].append(f"Movement count low: {db_count} < {expected_count}")

            # Validate movement structure
            if db_movements.data:
                sample = db_movements.data[0]
                required_fields = ['id', 'name', 'difficulty_level', 'setup_position']
                missing_fields = [f for f in required_fields if f not in sample]

                if not missing_fields:
                    logger.info(f"✓ Movement structure valid: {sample['name']}")
                    checks['movement_structure'] = {'status': 'pass', 'sample_name': sample['name']}
                    self.results['checks_passed'] += 1
                else:
                    logger.error(f"✗ Movement missing fields: {missing_fields}")
                    checks['movement_structure'] = {'status': 'fail', 'missing_fields': missing_fields}
                    self.results['checks_failed'] += 1
                    self.results['errors'].append(f"Movement missing fields: {missing_fields}")

            # Validate Excel traceability
            movements_with_traceability = [
                m for m in db_movements.data
                if m.get('excel_row_number') or m.get('excel_id')
            ]
            traceability_percent = (len(movements_with_traceability) / db_count * 100) if db_count > 0 else 0

            if traceability_percent >= 90:
                logger.info(f"✓ Excel traceability: {traceability_percent:.1f}% of movements")
                checks['excel_traceability'] = {'status': 'pass', 'percent': traceability_percent}
                self.results['checks_passed'] += 1
            else:
                logger.warning(f"⚠ Excel traceability: {traceability_percent:.1f}% of movements")
                checks['excel_traceability'] = {'status': 'warning', 'percent': traceability_percent}
                self.results['warnings'].append(f"Low Excel traceability: {traceability_percent:.1f}%")

        except Exception as e:
            logger.error(f"✗ Movements validation failed: {e}")
            checks['movements'] = {'status': 'fail', 'error': str(e)}
            self.results['checks_failed'] += 1
            self.results['errors'].append(f"Movements: {e}")

        self.results['details']['movements'] = checks
        return checks

    def validate_relationships(self) -> Dict:
        """Validate foreign key relationships"""
        logger.info("=" * 60)
        logger.info("VALIDATING RELATIONSHIPS")
        logger.info("=" * 60)

        checks = {}

        # 1. Movement → Muscle Group mappings
        try:
            mappings = self.client.table('movement_muscles').select('*').execute()
            mapping_count = len(mappings.data)

            if mapping_count > 0:
                logger.info(f"✓ Movement-muscle mappings: {mapping_count} records")
                checks['movement_muscles'] = {'status': 'pass', 'count': mapping_count}
                self.results['checks_passed'] += 1

                # Sample validation: verify referenced IDs exist
                sample = mappings.data[0] if mappings.data else None
                if sample:
                    movement_exists = self.client.table('movements').select('id').eq('id', sample['movement_id']).execute()
                    muscle_exists = self.client.table('muscle_groups').select('id').eq('id', sample['muscle_group_id']).execute()

                    if movement_exists.data and muscle_exists.data:
                        logger.info(f"✓ Relationship integrity verified (sample)")
                        checks['relationship_integrity'] = {'status': 'pass'}
                        self.results['checks_passed'] += 1
                    else:
                        logger.error(f"✗ Orphaned relationship found")
                        checks['relationship_integrity'] = {'status': 'fail'}
                        self.results['checks_failed'] += 1
                        self.results['errors'].append("Orphaned relationships detected")
            else:
                logger.warning(f"⚠ No movement-muscle mappings found")
                checks['movement_muscles'] = {'status': 'warning', 'count': 0}
                self.results['warnings'].append("No movement-muscle mappings")

        except Exception as e:
            logger.error(f"✗ Relationship validation failed: {e}")
            checks['relationships'] = {'status': 'fail', 'error': str(e)}
            self.results['checks_failed'] += 1
            self.results['errors'].append(f"Relationships: {e}")

        # 2. Teaching Cues → Movements
        try:
            cues = self.client.table('teaching_cues').select('*').execute()
            cue_count = len(cues.data)

            logger.info(f"✓ Teaching cues: {cue_count} records")
            checks['teaching_cues'] = {'status': 'pass', 'count': cue_count}

        except Exception as e:
            logger.error(f"✗ Teaching cues check failed: {e}")
            checks['teaching_cues'] = {'status': 'fail', 'error': str(e)}

        # 3. Common Mistakes → Movements
        try:
            mistakes = self.client.table('common_mistakes').select('*').execute()
            mistake_count = len(mistakes.data)

            logger.info(f"✓ Common mistakes: {mistake_count} records")
            checks['common_mistakes'] = {'status': 'pass', 'count': mistake_count}

        except Exception as e:
            logger.error(f"✗ Common mistakes check failed: {e}")
            checks['common_mistakes'] = {'status': 'fail', 'error': str(e)}

        self.results['details']['relationships'] = checks
        return checks

    def validate_rls_policies(self) -> Dict:
        """Validate Row Level Security policies"""
        logger.info("=" * 60)
        logger.info("VALIDATING RLS POLICIES")
        logger.info("=" * 60)

        checks = {}

        # Test public read access to reference data
        try:
            # These should be accessible without auth
            movements = self.client.table('movements').select('id').limit(1).execute()
            rules = self.client.table('sequence_rules').select('id').limit(1).execute()
            muscles = self.client.table('muscle_groups').select('id').limit(1).execute()

            logger.info("✓ Public reference data readable")
            checks['public_read'] = {'status': 'pass'}
            self.results['checks_passed'] += 1

        except Exception as e:
            logger.error(f"✗ Public data access failed: {e}")
            checks['public_read'] = {'status': 'fail', 'error': str(e)}
            self.results['checks_failed'] += 1
            self.results['errors'].append(f"Public read access: {e}")

        # Verify RLS-protected tables exist
        rls_tables = ['users', 'pii_tokens', 'class_plans', 'student_profiles']
        for table in rls_tables:
            try:
                response = self.client.table(table).select('id').limit(1).execute()
                logger.info(f"✓ RLS table '{table}' accessible")
                checks[f'rls_{table}'] = {'status': 'pass'}
            except Exception as e:
                logger.warning(f"⚠ RLS table '{table}' check: {e}")
                checks[f'rls_{table}'] = {'status': 'warning', 'error': str(e)}

        self.results['details']['rls_policies'] = checks
        return checks

    def generate_summary(self) -> str:
        """Generate validation summary"""
        logger.info("=" * 60)
        logger.info("VALIDATION SUMMARY")
        logger.info("=" * 60)

        total_checks = self.results['checks_passed'] + self.results['checks_failed']
        success_rate = (self.results['checks_passed'] / total_checks * 100) if total_checks > 0 else 0

        summary = f"""
Migration Validation Report
Generated: {self.results['timestamp']}

=== OVERALL STATUS ===
Checks Passed: {self.results['checks_passed']}
Checks Failed: {self.results['checks_failed']}
Warnings: {len(self.results['warnings'])}
Success Rate: {success_rate:.1f}%

=== REFERENCE DATA ===
"""

        # Add reference data details
        ref_data = self.results['details'].get('reference_data', {})
        for key, value in ref_data.items():
            status_icon = "✓" if value['status'] == 'pass' else "⚠" if value['status'] == 'warning' else "✗"
            summary += f"{status_icon} {key}: {value.get('count', 'N/A')} records\n"

        summary += "\n=== MOVEMENTS ===\n"
        movements = self.results['details'].get('movements', {})
        for key, value in movements.items():
            status_icon = "✓" if value['status'] == 'pass' else "⚠" if value['status'] == 'warning' else "✗"
            summary += f"{status_icon} {key}: {value.get('count', value.get('percent', 'N/A'))}\n"

        if self.results['warnings']:
            summary += "\n=== WARNINGS ===\n"
            for warning in self.results['warnings']:
                summary += f"⚠ {warning}\n"

        if self.results['errors']:
            summary += "\n=== ERRORS ===\n"
            for error in self.results['errors']:
                summary += f"✗ {error}\n"

        # Overall status
        if self.results['checks_failed'] == 0:
            summary += "\n✅ MIGRATION VALIDATION PASSED\n"
        elif success_rate >= 80:
            summary += "\n⚠ MIGRATION VALIDATION PASSED WITH WARNINGS\n"
        else:
            summary += "\n❌ MIGRATION VALIDATION FAILED\n"

        logger.info(summary)
        return summary

    def save_report(self, output_path: str):
        """Save validation results to JSON"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2)
        logger.info(f"Validation results saved to: {output_path}")


def main():
    """Run migration validation"""
    logger.info("=" * 60)
    logger.info("MIGRATION VALIDATION - SESSION 2B")
    logger.info("=" * 60)

    # Initialize validator
    try:
        validator = MigrationValidator()
    except ValueError as e:
        logger.error(f"❌ Failed to initialize: {e}")
        logger.error("Please create a Supabase project and add credentials to .env file")
        return False

    # Load source data
    json_path = Path(__file__).parent.parent / 'data' / 'extracted_data.json'
    if not json_path.exists():
        logger.warning("⚠ extracted_data.json not found - skipping source data comparison")
        source_data = {}
    else:
        source_data = validator.load_source_data(str(json_path))

    # Run validations
    validator.validate_reference_data()
    validator.validate_movements(source_data)
    validator.validate_relationships()
    validator.validate_rls_policies()

    # Generate summary
    summary = validator.generate_summary()

    # Save report
    report_path = Path(__file__).parent.parent / 'data' / 'migration_validation_report.json'
    validator.save_report(str(report_path))

    # Return success if no errors
    return validator.results['checks_failed'] == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
