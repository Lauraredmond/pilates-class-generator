-- Backfill Muscle Groups in class_history from Database Tables
-- This will fix the blank muscle chart by adding muscle_groups to existing records

-- ==============================================================================
-- PROBLEM:
-- ==============================================================================
-- movements_snapshot in class_history is missing muscle_groups field
-- Backend tried to enrich but movements might not have had 'id' field
-- Muscle data exists in movements + movement_muscles + muscle_groups tables
-- Need to backfill from database

-- ==============================================================================
-- SOLUTION:
-- ==============================================================================
-- For each movement in class_history.movements_snapshot:
-- 1. Match movement by name to movements table
-- 2. JOIN with movement_muscles and muscle_groups
-- 3. Update movements_snapshot to include muscle_groups array

BEGIN;

-- ==============================================================================
-- STEP 1: Create temporary function to add muscle groups to a movement
-- ==============================================================================
CREATE OR REPLACE FUNCTION add_muscle_groups_to_movement(movement_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
    muscle_array TEXT[];
BEGIN
    -- Find movement by name and get its muscle groups
    SELECT ARRAY_AGG(mg.name)
    INTO muscle_array
    FROM movements m
    JOIN movement_muscles mm ON m.id = mm.movement_id
    JOIN muscle_groups mg ON mm.muscle_group_id = mg.id
    WHERE m.name = movement_name
      AND mm.is_primary = true;

    -- Return array (or empty array if not found)
    RETURN COALESCE(muscle_array, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- STEP 2: Update all class_history records with enriched movements_snapshot
-- ==============================================================================
-- WARNING: This updates ALL records. Make a backup first if needed.

UPDATE class_history
SET movements_snapshot = (
    SELECT jsonb_agg(
        CASE
            -- For movements: add muscle_groups from database
            WHEN elem->>'type' = 'movement' THEN
                elem || jsonb_build_object(
                    'muscle_groups',
                    to_jsonb(add_muscle_groups_to_movement(elem->>'name'))
                )
            -- For transitions: keep as-is
            ELSE elem
        END
    )
    FROM jsonb_array_elements(movements_snapshot) AS elem
)
WHERE movements_snapshot IS NOT NULL
  AND jsonb_array_length(movements_snapshot) > 0;

-- ==============================================================================
-- STEP 3: Verify the update worked
-- ==============================================================================
SELECT
    COUNT(*) as total_classes_updated,
    SUM(
        (SELECT COUNT(*)
         FROM jsonb_array_elements(movements_snapshot) AS elem
         WHERE elem->>'type' = 'movement'
           AND jsonb_array_length(elem->'muscle_groups') > 0)
    ) as movements_with_muscle_groups
FROM class_history;

-- ==============================================================================
-- STEP 4: Sample a few updated records
-- ==============================================================================
SELECT
    id,
    taught_date,
    movements_snapshot->0->>'name' as first_movement_name,
    movements_snapshot->0->>'type' as first_movement_type,
    movements_snapshot->0->'muscle_groups' as first_movement_muscles,
    jsonb_array_length(movements_snapshot->0->'muscle_groups') as muscle_count
FROM class_history
WHERE movements_snapshot IS NOT NULL
LIMIT 5;

-- ==============================================================================
-- STEP 5: Clean up temporary function
-- ==============================================================================
DROP FUNCTION IF EXISTS add_muscle_groups_to_movement(TEXT);

COMMIT;

-- ==============================================================================
-- EXPECTED RESULTS:
-- ==============================================================================
-- After running this script:
-- 1. All movements in class_history should have muscle_groups array
-- 2. muscle_count should be > 0 (e.g., 2-4 muscle groups per movement)
-- 3. Go to Analytics page and refresh - muscle chart should now display!
--
-- If muscle chart is STILL blank after this:
-- - Check browser console for errors
-- - Verify frontend is calling /api/analytics/muscle-distribution/{user_id}
-- - Check Render backend logs for errors in analytics endpoint
-- ==============================================================================
