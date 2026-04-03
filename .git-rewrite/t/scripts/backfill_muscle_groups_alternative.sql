-- Alternative Backfill: Add muscle_groups to class_history movements
-- Uses inline subquery instead of custom function to avoid schema issues

BEGIN;

-- ==============================================================================
-- STEP 1: Verify movements and muscle_groups tables have data
-- ==============================================================================
SELECT
    (SELECT COUNT(*) FROM movements) as total_movements,
    (SELECT COUNT(*) FROM muscle_groups) as total_muscle_groups,
    (SELECT COUNT(*) FROM movement_muscles) as total_movement_muscles_mappings;

-- ==============================================================================
-- STEP 2: Update class_history with muscle_groups using inline subquery
-- ==============================================================================
-- This approach builds muscle_groups array directly in the UPDATE statement
-- without requiring a custom function

UPDATE class_history
SET movements_snapshot = (
    SELECT jsonb_agg(
        CASE
            -- For movements: add muscle_groups by matching movement name
            WHEN elem->>'type' = 'movement' THEN
                elem || jsonb_build_object(
                    'muscle_groups',
                    -- Inline subquery to fetch muscle groups by movement name
                    COALESCE(
                        (
                            SELECT jsonb_agg(mg.name)
                            FROM movements m
                            JOIN movement_muscles mm ON m.id = mm.movement_id
                            JOIN muscle_groups mg ON mm.muscle_group_id = mg.id
                            WHERE m.name = elem->>'name'
                              AND mm.is_primary = true
                        ),
                        '[]'::jsonb
                    )
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
           AND elem->'muscle_groups' IS NOT NULL
           AND jsonb_array_length(elem->'muscle_groups') > 0)
    ) as movements_with_muscle_groups
FROM class_history;

-- ==============================================================================
-- STEP 4: Sample updated records
-- ==============================================================================
SELECT
    id,
    taught_date,
    movements_snapshot->0->>'name' as first_movement_name,
    movements_snapshot->0->'muscle_groups' as first_movement_muscles,
    jsonb_array_length(movements_snapshot->0->'muscle_groups') as muscle_count
FROM class_history
WHERE movements_snapshot IS NOT NULL
  AND jsonb_array_length(movements_snapshot) > 0
LIMIT 5;

COMMIT;

-- ==============================================================================
-- ADVANTAGES OF THIS APPROACH:
-- ==============================================================================
-- 1. No custom function = No schema dependency issues
-- 2. Inline subquery matches movements by NAME (not ID)
-- 3. Uses exact same JOIN logic as backend helper function
-- 4. Easier to debug (all logic visible in one query)
-- ==============================================================================

-- ==============================================================================
-- IF THIS STILL FAILS WITH "column does not exist":
-- ==============================================================================
-- Run the diagnostic script (check_movement_muscles_schema.sql) to see
-- actual column names in production database. They might differ from migrations.
-- ==============================================================================
