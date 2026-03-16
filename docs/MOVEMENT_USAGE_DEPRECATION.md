# Movement Usage Table Deprecation

## Migration Summary

The `movement_usage` table has been deprecated in favor of the `class_movements` table for tracking movement usage across user classes. This migration was completed in 3 phases on March 16, 2026.

## Background

### Problem
- The `movement_usage` table was originally designed to track how often each movement was used by each user
- It stored aggregated data: `usage_count` and `last_used_date` for each movement
- This approach had limitations:
  - Lost historical context (which classes used which movements)
  - Required separate write operations on class completion
  - Data inconsistency between `class_history` and `movement_usage`

### Solution
- The `class_movements` table already tracks every movement in every class
- Provides complete historical data with timestamps
- Single source of truth for movement tracking
- Better data consistency and easier querying

## Migration Phases

### Phase 1: Stop Writing (Completed)
- **File:** `backend/api/classes.py`
- **Change:** Removed movement_usage update logic from `/api/classes/save-completed` endpoint
- **Lines:** Removed lines 1234-1270
- **Impact:** No new data written to movement_usage table

### Phase 2: Migrate Reads (Completed)
- **Files Updated:**
  - `backend/api/analytics.py`: Updated `_get_favorite_movement` function
  - `backend/orchestrator/tools/sequence_tools.py`: Removed `_get_legacy_usage_weights` function
- **Changes:**
  - Analytics now counts movement occurrences from `class_movements`
  - Sequence generation uses `class_movements` for usage weights
  - Removed fallback to movement_usage table

### Phase 3: Drop Table (Ready to Execute)
- **Archive:** 80 records from movement_usage table documented
- **Migration:** `backend/migrations/drop_movement_usage_table.sql`
- **Cleanup:** Updated `clear_analytics_data.py` script
- **Status:** SQL migration ready to run in Supabase

## Data Migration

### Old Table Structure (movement_usage)
```sql
movement_usage {
  id: uuid
  user_id: uuid
  movement_id: uuid
  usage_count: integer
  last_used_date: date
  created_at: timestamp
  updated_at: timestamp
}
```

### New Table Structure (class_movements)
```sql
class_movements {
  id: uuid
  user_id: uuid
  class_plan_id: uuid
  movement_id: uuid
  movement_name: text
  class_generated_at: timestamp
  difficulty_level: text
  position_in_sequence: integer
  created_at: timestamp
}
```

## Code Changes

### Analytics Query (Before)
```python
# Old: Query movement_usage table
response = supabase.table('movement_usage') \
    .select('movement_id, usage_count') \
    .eq('user_id', user_uuid) \
    .order('usage_count', desc=True) \
    .limit(1) \
    .execute()
```

### Analytics Query (After)
```python
# New: Query class_movements table and count occurrences
response = supabase.table('class_movements') \
    .select('movement_id, movement_name') \
    .eq('user_id', user_uuid) \
    .execute()

# Count occurrences of each movement
movement_counts = {}
for record in response.data:
    movement_id = record.get('movement_id')
    if movement_id not in movement_counts:
        movement_counts[movement_id] = {'count': 0, 'name': movement_name}
    movement_counts[movement_id]['count'] += 1
```

## Benefits of Migration

1. **Complete Historical Data**: Every movement in every class is tracked with timestamps
2. **Single Source of Truth**: No data duplication between tables
3. **Better Analytics**: Can analyze movement patterns over time, not just counts
4. **Simpler Code**: One less table to maintain and update
5. **Data Consistency**: All movement data comes from the same source

## Running the Final Migration

To complete the migration and drop the deprecated table:

1. **Backup the data** (if not already done):
```sql
CREATE TABLE movement_usage_archive AS
SELECT * FROM movement_usage;
```

2. **Run the migration**:
```sql
DROP TABLE IF EXISTS movement_usage CASCADE;
```

3. **Verify application functionality**:
- Generate a test class
- Check analytics still work
- Verify sequencing reports show correct data

## Rollback Plan

If issues arise after dropping the table:

1. Recreate table from archive:
```sql
CREATE TABLE movement_usage AS
SELECT * FROM movement_usage_archive;
```

2. Revert code changes:
- Git revert the Phase 1 and Phase 2 commits
- Redeploy the application

## Files Modified

### Phase 1
- `backend/api/classes.py` - Removed movement_usage writes

### Phase 2
- `backend/api/analytics.py` - Updated favorite movement query
- `backend/orchestrator/tools/sequence_tools.py` - Removed legacy fallback

### Phase 3
- `backend/scripts/clear_analytics_data.py` - Updated cleanup script
- `backend/migrations/drop_movement_usage_table.sql` - Created drop script
- `backend/migrations/archive_movement_usage_data.py` - Created archive script
- `docs/MOVEMENT_USAGE_DEPRECATION.md` - This documentation

## Testing

After migration, verify:

1. **Analytics Dashboard**
   - Favorite movement displays correctly
   - Movement statistics are accurate

2. **Sequencing Reports**
   - Historical muscle balance shows data
   - Repertoire coverage tracks all movements

3. **Class Generation**
   - Movement variety is maintained
   - Usage weights work correctly

## Notes

- The movement_usage table had 80 records from earlier testing
- All production data is now tracked through class_movements
- The class_movements table has 405+ records with complete historical data
- No user-facing changes - everything continues to work normally