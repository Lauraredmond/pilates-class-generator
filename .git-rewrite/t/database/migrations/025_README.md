# Migration 025: Split Swimming Movement

**Date:** December 13, 2025
**Risk Level:** 🟢 LOW
**Estimated Time:** 2 minutes

## Summary

Splits "Swimming" into two separate sub-movements:
1. **Swimming - Prone** (existing movement, renamed)
2. **Swimming - Box** (new movement, identical attributes)

## Why This is Safe

✅ **No code changes needed** - All movement references are database-driven
✅ **Stats page auto-updates** - Queries movements dynamically
✅ **No hardcoded movement names** - Verified across entire codebase
✅ **Foreign keys use CASCADE** - No orphaned references possible
✅ **Muscle mappings copied** - Swimming - Box inherits all muscle groups

## What Happens After Migration

### ✅ Works Automatically
- **Stats/Analytics Page:** Both Swimming variations appear in charts
- **Class Builder:** Both movements available for selection
- **AI Generation:** Can use either Swimming variation
- **Muscle Balance:** Calculations work correctly for both
- **Saved Classes:** Existing classes with "Swimming" now show "Swimming - Prone"

### 📝 Optional Next Steps (Not Required)

1. **Update Narratives** (if Swimming - Prone and Swimming - Box have different instructions)
   - Edit `narrative` field for each movement
   - Add different teaching cues if needed

2. **Add Separate Voiceovers** (if you want different audio for each)
   - Record Swimming - Box voiceover
   - Upload to Supabase Storage
   - Update `voiceover_url` and `voiceover_duration_seconds`

3. **Adjust Difficulty Rank** (if you want different ordering)
   - Swimming - Prone and Swimming - Box currently have same `difficulty_rank`
   - Update if you want one to appear before the other in lists

## How to Run

### In Supabase SQL Editor:

```sql
-- Copy the entire contents of 025_split_swimming_movement.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```

### Verification Queries:

```sql
-- Check both movements exist
SELECT name, difficulty_level, setup_position
FROM movements
WHERE name LIKE 'Swimming%'
ORDER BY name;

-- Expected Result:
-- Swimming - Box    | Advanced | Prone
-- Swimming - Prone  | Advanced | Prone

-- Check muscle mappings
SELECT m.name, mg.name as muscle_group, mm.is_primary
FROM movements m
JOIN movement_muscles mm ON m.id = mm.movement_id
JOIN muscle_groups mg ON mm.muscle_group_id = mg.id
WHERE m.name LIKE 'Swimming%'
ORDER BY m.name, mg.name;

-- Expected: Both movements should have identical muscle group mappings
```

## Rollback Plan

If you need to undo this migration:

```sql
-- Delete Swimming - Box
DELETE FROM movements WHERE name = 'Swimming - Box';

-- Rename Swimming - Prone back to Swimming
UPDATE movements SET name = 'Swimming' WHERE name = 'Swimming - Prone';
```

## Impact on Existing Data

### Saved Classes
- Any saved class containing "Swimming" will now show "Swimming - Prone"
- This is intentional and safe
- No data loss occurs

### Movement Statistics
- Historical stats for "Swimming" now appear under "Swimming - Prone"
- Swimming - Box starts with zero usage history
- Both count independently going forward

## Questions?

**Q: Will this break anything?**
A: No. All movement references are dynamic. The app will automatically recognize both movements.

**Q: Do I need to redeploy the frontend?**
A: No. Frontend loads movements from database. No code changes needed.

**Q: What about old classes that used "Swimming"?**
A: They now reference "Swimming - Prone" (renamed). Everything still works.

**Q: Can I reverse this later?**
A: Yes, use the rollback plan above. Safe to reverse anytime.
