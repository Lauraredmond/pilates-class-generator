# Movement Level Flags Update

## Overview

Updated the movements table to use level description fields as Y/N flags instead of TEXT narratives. All level narratives are now stored in the main `narrative` field.

## Database Changes

### Migration 011: Convert Level Fields to Flags

**File:** `migrations/011_convert_level_fields_to_flags.sql`

**Changes:**
1. Added `level_3_description` column (was missing from original schema)
2. Converted existing TEXT fields to VARCHAR(1):
   - `level_1_description`: TEXT → VARCHAR(1)
   - `level_2_description`: TEXT → VARCHAR(1)
   - `level_3_description`: VARCHAR(1) (new)
   - `full_version_description`: TEXT → VARCHAR(1)
3. Added CHECK constraints to ensure only 'Y' or 'N' values
4. Updated column comments to reflect new purpose

**To Apply:**
```bash
# Run migration in Supabase SQL editor
psql $DATABASE_URL < database/migrations/011_convert_level_fields_to_flags.sql
```

### Data Population Scripts

#### 1. Watch Out Points & Visual Cues

**File:** `database/update_movement_watch_points_and_visual_cues.sql`

**Purpose:** Populate `watch_out_points` and `visual_cues` fields from Excel data

**Source:** `Movements_summaries.xlsx` (Watch Out Points and Visualisations columns)

**Coverage:**
- All 34 movements have watch_out_points populated
- 18 movements have visual_cues populated (16 do not have visual cues in source data)

**To Apply:**
```bash
psql $DATABASE_URL < database/update_movement_watch_points_and_visual_cues.sql
```

#### 2. Level Flags (Y/N)

**File:** `database/update_movement_level_flags.sql`

**Purpose:** Populate level flag fields with Y or N based on Excel Levels column

**Source:** `Movements_summaries.xlsx` (Levels column)

**Summary Statistics:**
- Total movements: 34
- Movements with Level 1: 17
- Movements with Level 2: 15
- Movements with Level 3: 5
- Movements with Full Version: 34

**Special Cases:**
- "One level with modifications???" → Only FV = 'Y'
- "One" (Movement 10: Corkscrew) → Treated as FV only

**To Apply:**
```bash
psql $DATABASE_URL < database/update_movement_level_flags.sql
```

## Code Changes

### Backend (Python)

**File:** `backend/models/movement.py`

**Changes:**
- Added `watch_out_points` field to Movement model
- Added 4 level flag fields:
  - `level_1_description: Optional[str]`
  - `level_2_description: Optional[str]`
  - `level_3_description: Optional[str]`
  - `full_version_description: Optional[str]`

### Frontend (TypeScript)

**File:** `frontend/src/store/useStore.ts`

**Changes to Movement interface:**
- Added `watch_out_points?: string`
- Added 4 level flag fields:
  - `level_1_description?: string` // 'Y' or 'N'
  - `level_2_description?: string` // 'Y' or 'N'
  - `level_3_description?: string` // 'Y' or 'N'
  - `full_version_description?: string` // 'Y' or 'N'

**File:** `frontend/src/components/class-playback/ClassPlayback.tsx`

**Changes to PlaybackMovement interface:**
- Added `visual_cues?: string`
- Added 4 level flag fields (same as above)

## Verification

### Database Verification Query

```sql
-- Check level flags are populated correctly
SELECT movement_number, name,
       level_1_description as L1,
       level_2_description as L2,
       level_3_description as L3,
       full_version_description as FV
FROM movements
ORDER BY movement_number;
```

### Expected Results

Example output:
```
movement_number | name            | L1 | L2 | L3 | FV
----------------|-----------------|----|----|----|----|
1               | The Hundred     | Y  | Y  | N  | Y  |
6               | One leg stretch | Y  | Y  | Y  | Y  |
8               | Spine stretch   | N  | N  | N  | Y  |
```

## Data Sources

All data sourced from:
- **Excel File:** `/Users/lauraredmond/Documents/Bassline/Admin/7. Product/Design Documentation/Movements_summaries.xlsx`
- **Columns Used:**
  - "Levels" (Column Z) → Level flags
  - "Watch Out Points" + adjacent columns → watch_out_points
  - "Visualisations" + adjacent columns → visual_cues

## Migration Order

**IMPORTANT:** Execute in this exact order:

1. ✅ Run migration 011 (convert fields to VARCHAR(1))
2. ✅ Run update_movement_watch_points_and_visual_cues.sql
3. ✅ Run update_movement_level_flags.sql
4. ✅ Verify data with verification queries
5. ✅ Deploy updated backend code
6. ✅ Deploy updated frontend code

## Rollback Plan

If issues occur:

```sql
-- Rollback by recreating original TEXT columns
ALTER TABLE movements DROP COLUMN level_1_description;
ALTER TABLE movements DROP COLUMN level_2_description;
ALTER TABLE movements DROP COLUMN level_3_description;
ALTER TABLE movements DROP COLUMN full_version_description;

ALTER TABLE movements ADD COLUMN level_1_description TEXT;
ALTER TABLE movements ADD COLUMN level_2_description TEXT;
ALTER TABLE movements ADD COLUMN full_version_description TEXT;
```

## Future Enhancements

Potential future work:
1. Separate level narratives into movement_levels table (already exists from migration 009)
2. Add UI to display available levels to users
3. Allow users to select preferred level during class playback
4. Track which levels users complete for progression tracking

## Notes

- All 34 movements have Full Version (FV = 'Y')
- Only 5 movements have all 4 levels (L1, L2, L3, FV)
- 17 movements have only Full Version (no progressive levels)
- Level narratives can be separated later if needed
