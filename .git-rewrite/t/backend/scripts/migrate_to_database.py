"""
Database Migration Script - Session 2B
Imports extracted Excel data (JSON) into PostgreSQL/Supabase
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseMigrator:
    """Migrate Excel data from JSON to Supabase/PostgreSQL"""

    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info(f"Connected to Supabase: {self.supabase_url}")

        self.stats = {
            'movements_inserted': 0,
            'muscle_mappings_inserted': 0,
            'teaching_cues_inserted': 0,
            'mistakes_inserted': 0,
            'errors': []
        }

    def load_json_data(self, json_path: str) -> Dict:
        """Load extracted JSON data"""
        logger.info(f"Loading JSON data from: {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"JSON loaded successfully")
        return data

    def get_muscle_group_id(self, muscle_group_name: str) -> str:
        """Get muscle group ID by name"""
        try:
            response = self.client.table('muscle_groups').select('id').eq('name', muscle_group_name).execute()
            if response.data:
                return response.data[0]['id']
            else:
                logger.warning(f"Muscle group not found: {muscle_group_name}")
                return None
        except Exception as e:
            logger.error(f"Error fetching muscle group {muscle_group_name}: {e}")
            return None

    def migrate_movements(self, data: Dict) -> Dict[str, str]:
        """
        Migrate movements from Movement attributes sheet
        Returns mapping of movement names to IDs
        """
        logger.info("=" * 60)
        logger.info("MIGRATING MOVEMENTS")
        logger.info("=" * 60)

        movement_id_map = {}

        # Get movement attributes from all_sheets
        if 'all_sheets' not in data or 'Movement attributes' not in data['all_sheets']:
            logger.error("Movement attributes sheet not found in JSON")
            return movement_id_map

        movements_data = data['all_sheets']['Movement attributes']['data']
        logger.info(f"Found {len(movements_data)} movements to migrate")

        for idx, movement_row in enumerate(movements_data, 1):
            try:
                movement_name = movement_row.get('Movement')
                if not movement_name:
                    logger.warning(f"Skipping row {idx}: No movement name")
                    continue

                # Build movement record
                movement_record = {
                    'excel_row_number': movement_row.get('_row_number'),
                    'excel_id': f"{movement_name.lower().replace(' ', '_')}_{idx}",
                    'name': movement_name,
                    'category': movement_row.get('Category', 'Mat-based'),
                    'difficulty_level': movement_row.get('Difficulty', 'Beginner'),
                    'difficulty_rank': idx,  # Use Excel order as rank
                    'narrative': movement_row.get('Narrative', ''),
                    'visual_cues': movement_row.get('Visual cues', ''),
                    'setup_position': movement_row.get('Setup position', 'Supine'),
                    'created_from_excel': True
                }

                # Insert movement
                response = self.client.table('movements').insert(movement_record).execute()

                if response.data:
                    movement_id = response.data[0]['id']
                    movement_id_map[movement_name] = movement_id
                    self.stats['movements_inserted'] += 1
                    logger.info(f"✓ Inserted: {movement_name} (ID: {movement_id})")
                else:
                    logger.error(f"✗ Failed to insert: {movement_name}")

            except Exception as e:
                logger.error(f"✗ Error inserting movement {movement_row.get('Movement', 'Unknown')}: {e}")
                self.stats['errors'].append(str(e))

        logger.info(f"\nMovements migrated: {self.stats['movements_inserted']}/{len(movements_data)}")
        return movement_id_map

    def migrate_muscle_mappings(self, data: Dict, movement_id_map: Dict[str, str]):
        """
        Migrate movement → muscle group mappings from Movement summaries sheet
        """
        logger.info("=" * 60)
        logger.info("MIGRATING MUSCLE GROUP MAPPINGS")
        logger.info("=" * 60)

        # Get Movement summaries (has Y/N indicators for muscle groups)
        if 'all_sheets' not in data or 'Movement summaries' not in data['all_sheets']:
            logger.error("Movement summaries sheet not found")
            return

        summaries_data = data['all_sheets']['Movement summaries']['data']

        # First row is header with muscle group names
        if len(summaries_data) < 1:
            logger.error("No data in Movement summaries")
            return

        # Find the header row (might be row 0 or 1)
        header_row = summaries_data[0]

        # Process each movement row
        for movement_row in summaries_data[1:]:  # Skip header
            try:
                # First column should be movement name
                # Check different possible column names
                movement_name = None
                for key in movement_row.keys():
                    if movement_row[key] in movement_id_map:
                        movement_name = movement_row[key]
                        break

                if not movement_name:
                    # Try to get from first value
                    first_value = list(movement_row.values())[0] if movement_row else None
                    if first_value in movement_id_map:
                        movement_name = first_value

                if not movement_name or movement_name not in movement_id_map:
                    continue

                movement_id = movement_id_map[movement_name]

                # Iterate through columns to find Y indicators
                for col_name, value in movement_row.items():
                    if value == 'Y':
                        # Column name is the muscle group
                        muscle_group_id = self.get_muscle_group_id(col_name)

                        if muscle_group_id:
                            try:
                                mapping_record = {
                                    'movement_id': movement_id,
                                    'muscle_group_id': muscle_group_id,
                                    'is_primary': True
                                }

                                self.client.table('movement_muscles').insert(mapping_record).execute()
                                self.stats['muscle_mappings_inserted'] += 1

                            except Exception as e:
                                # Might be duplicate, that's okay
                                if 'duplicate' not in str(e).lower():
                                    logger.warning(f"Could not insert mapping {movement_name} → {col_name}: {e}")

            except Exception as e:
                logger.error(f"Error processing muscle mappings: {e}")

        logger.info(f"\nMuscle mappings migrated: {self.stats['muscle_mappings_inserted']}")

    def migrate_watch_out_points(self, data: Dict, movement_id_map: Dict[str, str]):
        """
        Extract "Watch Out Points" and insert as common_mistakes
        """
        logger.info("=" * 60)
        logger.info("MIGRATING WATCH OUT POINTS")
        logger.info("=" * 60)

        # Get Movement summaries which has "Watch Out Points" column
        if 'all_sheets' not in data or 'Movement summaries' not in data['all_sheets']:
            return

        summaries_data = data['all_sheets']['Movement summaries']['data']

        for movement_row in summaries_data[1:]:  # Skip header
            try:
                # Get movement name and watch out points
                movement_name = None
                watch_out_text = None

                # Try to find movement name and watch out points
                for key, value in movement_row.items():
                    if value in movement_id_map:
                        movement_name = value
                    if 'watch' in key.lower() or 'Watch Out' in key:
                        watch_out_text = value

                if not movement_name or not watch_out_text or not isinstance(watch_out_text, str):
                    continue

                movement_id = movement_id_map[movement_name]

                # Split by common delimiters
                mistakes = [m.strip() for m in watch_out_text.split('*') if m.strip()]
                if not mistakes:
                    mistakes = [m.strip() for m in watch_out_text.split('/') if m.strip()]

                for mistake_desc in mistakes:
                    if mistake_desc:
                        mistake_record = {
                            'movement_id': movement_id,
                            'mistake_description': mistake_desc,
                            'severity': 'medium'
                        }

                        self.client.table('common_mistakes').insert(mistake_record).execute()
                        self.stats['mistakes_inserted'] += 1

            except Exception as e:
                logger.error(f"Error migrating watch out points: {e}")

        logger.info(f"\nWatch out points migrated: {self.stats['mistakes_inserted']}")

    def migrate_visual_cues(self, data: Dict, movement_id_map: Dict[str, str]):
        """
        Extract visual cues/imagery and insert as teaching_cues
        """
        logger.info("=" * 60)
        logger.info("MIGRATING VISUAL CUES")
        logger.info("=" * 60)

        # Get Movement summaries which has "Visualisations" column
        if 'all_sheets' not in data or 'Movement summaries' not in data['all_sheets']:
            return

        summaries_data = data['all_sheets']['Movement summaries']['data']

        for movement_row in summaries_data[1:]:  # Skip header
            try:
                movement_name = None
                visual_cue_text = None

                for key, value in movement_row.items():
                    if value in movement_id_map:
                        movement_name = value
                    if 'visual' in key.lower() or 'Visualisations' in key:
                        visual_cue_text = value

                if not movement_name or not visual_cue_text or not isinstance(visual_cue_text, str):
                    continue

                movement_id = movement_id_map[movement_name]

                # Create teaching cue
                cue_record = {
                    'movement_id': movement_id,
                    'cue_type': 'visual',
                    'cue_text': visual_cue_text,
                    'is_primary': True,
                    'cue_order': 1
                }

                self.client.table('teaching_cues').insert(cue_record).execute()
                self.stats['teaching_cues_inserted'] += 1

            except Exception as e:
                if 'duplicate' not in str(e).lower():
                    logger.error(f"Error migrating visual cues: {e}")

        logger.info(f"\nVisual cues migrated: {self.stats['teaching_cues_inserted']}")

    def validate_migration(self, movement_id_map: Dict[str, str]):
        """Validate that migration was successful"""
        logger.info("=" * 60)
        logger.info("VALIDATING MIGRATION")
        logger.info("=" * 60)

        try:
            # Count movements
            movements_count = len(self.client.table('movements').select('id').execute().data)
            logger.info(f"✓ Movements in database: {movements_count}")

            # Count muscle mappings
            mappings_count = len(self.client.table('movement_muscles').select('id').execute().data)
            logger.info(f"✓ Muscle mappings in database: {mappings_count}")

            # Count teaching cues
            cues_count = len(self.client.table('teaching_cues').select('id').execute().data)
            logger.info(f"✓ Teaching cues in database: {cues_count}")

            # Count common mistakes
            mistakes_count = len(self.client.table('common_mistakes').select('id').execute().data)
            logger.info(f"✓ Common mistakes in database: {mistakes_count}")

            # Count sequence rules
            rules_count = len(self.client.table('sequence_rules').select('id').execute().data)
            logger.info(f"✓ Sequence rules in database: {rules_count}")

            # Count transitions
            transitions_count = len(self.client.table('transitions').select('id').execute().data)
            logger.info(f"✓ Transitions in database: {transitions_count}")

            logger.info("\n✅ Migration validation complete!")

            return True

        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            return False

    def print_summary(self):
        """Print migration summary"""
        logger.info("=" * 60)
        logger.info("MIGRATION SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Movements inserted: {self.stats['movements_inserted']}")
        logger.info(f"Muscle mappings inserted: {self.stats['muscle_mappings_inserted']}")
        logger.info(f"Teaching cues inserted: {self.stats['teaching_cues_inserted']}")
        logger.info(f"Common mistakes inserted: {self.stats['mistakes_inserted']}")
        logger.info(f"Errors encountered: {len(self.stats['errors'])}")

        if self.stats['errors']:
            logger.warning("\nErrors:")
            for error in self.stats['errors'][:10]:  # Show first 10
                logger.warning(f"  - {error}")


def main():
    """Main migration workflow"""
    logger.info("=" * 60)
    logger.info("PILATES DATABASE MIGRATION - SESSION 2B")
    logger.info("=" * 60)

    # Paths
    json_path = Path(__file__).parent.parent / 'data' / 'extracted_data.json'

    # Initialize migrator
    try:
        migrator = DatabaseMigrator()
    except ValueError as e:
        logger.error(f"❌ Failed to initialize: {e}")
        logger.error("Please create a Supabase project and add credentials to .env file")
        return False

    # Load JSON data
    data = migrator.load_json_data(str(json_path))

    # Run migrations
    movement_id_map = migrator.migrate_movements(data)
    migrator.migrate_muscle_mappings(data, movement_id_map)
    migrator.migrate_watch_out_points(data, movement_id_map)
    migrator.migrate_visual_cues(data, movement_id_map)

    # Validate
    migrator.validate_migration(movement_id_map)

    # Summary
    migrator.print_summary()

    logger.info("\n✅ Migration complete!")
    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
