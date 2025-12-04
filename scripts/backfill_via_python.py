#!/usr/bin/env python3
"""
Backfill muscle_groups into class_history movements_snapshot using Supabase Python API
This approach uses the same method as the working backend code
"""
import os
import sys
import json
from dotenv import load_dotenv

# Load environment
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

from supabase import create_client

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

def get_movement_muscle_groups(movement_name: str):
    """
    Fetch muscle groups for a movement by NAME (not ID)
    This matches the backend logic but searches by name instead
    """
    try:
        # First, find movement ID by name
        movement_response = supabase.table('movements').select('id').eq('name', movement_name).execute()

        if not movement_response.data or len(movement_response.data) == 0:
            print(f"   ⚠️  Movement not found in database: {movement_name}")
            return []

        movement_id = movement_response.data[0]['id']

        # Now fetch muscle groups using the working backend approach
        response = supabase.table('movement_muscles') \
            .select('muscle_group_id, muscle_groups(name)') \
            .eq('movement_id', movement_id) \
            .eq('is_primary', True) \
            .execute()

        if not response.data:
            return []

        # Extract muscle group names
        muscle_groups = [item['muscle_groups']['name'] for item in response.data if item.get('muscle_groups')]
        return muscle_groups

    except Exception as e:
        print(f"   ❌ Error fetching muscle groups for {movement_name}: {e}")
        return []

def backfill_class_history():
    """
    Update all class_history records with muscle_groups
    """
    print("=" * 80)
    print("BACKFILLING MUSCLE GROUPS IN CLASS_HISTORY")
    print("=" * 80)

    # Fetch all class_history records
    print("\n📥 Fetching class_history records...")
    response = supabase.table('class_history').select('*').execute()

    if not response.data:
        print("❌ No class_history records found!")
        return

    total_records = len(response.data)
    print(f"✅ Found {total_records} class_history records")

    updated_count = 0
    movement_count = 0

    for record in response.data:
        record_id = record['id']
        movements_snapshot = record.get('movements_snapshot', [])

        if not movements_snapshot:
            continue

        # Update each movement in the snapshot
        enriched_movements = []
        needs_update = False

        for movement in movements_snapshot:
            enriched_movement = movement.copy()

            # Only update movements (not transitions)
            if movement.get('type') == 'movement':
                movement_name = movement.get('name')

                if movement_name:
                    # Check if already has muscle_groups
                    existing_muscle_groups = movement.get('muscle_groups')

                    if not existing_muscle_groups or len(existing_muscle_groups) == 0:
                        # Fetch muscle groups from database
                        muscle_groups = get_movement_muscle_groups(movement_name)

                        if muscle_groups:
                            enriched_movement['muscle_groups'] = muscle_groups
                            needs_update = True
                            movement_count += 1
                            print(f"   ✅ {movement_name} → {muscle_groups}")
                    else:
                        print(f"   ⏭️  {movement_name} already has muscle groups (skipping)")

            enriched_movements.append(enriched_movement)

        # Update record if needed
        if needs_update:
            try:
                supabase.table('class_history').update({
                    'movements_snapshot': enriched_movements
                }).eq('id', record_id).execute()

                updated_count += 1
                print(f"\n✅ Updated record {record_id}")

            except Exception as e:
                print(f"\n❌ Failed to update record {record_id}: {e}")

    print("\n" + "=" * 80)
    print("BACKFILL COMPLETE")
    print("=" * 80)
    print(f"✅ Updated {updated_count}/{total_records} class_history records")
    print(f"✅ Enriched {movement_count} movements with muscle_groups")
    print("\n🎯 Next step: Refresh Analytics page to see muscle distribution chart!")
    print("=" * 80)

if __name__ == "__main__":
    backfill_class_history()
