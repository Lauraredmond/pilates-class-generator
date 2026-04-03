-- Check Movements Snapshot Structure in class_history
-- Run this to see WHY the muscle chart is blank

-- ==============================================================================
-- STEP 1: Check if muscle_groups field exists in movements_snapshot
-- ==============================================================================
SELECT
    id,
    taught_date,
    -- Extract first movement from snapshot
    movements_snapshot->0 as first_movement,

    -- Check if it has 'type' field
    movements_snapshot->0->>'type' as movement_type,

    -- Check if it has 'muscle_groups' field
    movements_snapshot->0->'muscle_groups' as muscle_groups_field,

    -- Check if muscle_groups is an array and count items
    jsonb_array_length(movements_snapshot->0->'muscle_groups') as muscle_groups_count
FROM class_history
WHERE movements_snapshot IS NOT NULL
  AND jsonb_array_length(movements_snapshot) > 0
LIMIT 5;

-- ==============================================================================
-- STEP 2: Count how many movements have muscle_groups populated
-- ==============================================================================
WITH movement_data AS (
    SELECT
        id,
        jsonb_array_elements(movements_snapshot) as movement
    FROM class_history
    WHERE movements_snapshot IS NOT NULL
)
SELECT
    COUNT(*) as total_movements,
    COUNT(CASE WHEN movement->>'type' = 'movement' THEN 1 END) as movements_with_type,
    COUNT(CASE WHEN movement->'muscle_groups' IS NOT NULL THEN 1 END) as movements_with_muscle_field,
    COUNT(CASE WHEN jsonb_array_length(movement->'muscle_groups') > 0 THEN 1 END) as movements_with_populated_muscles
FROM movement_data;

-- ==============================================================================
-- STEP 3: Sample actual muscle_groups values
-- ==============================================================================
WITH movement_data AS (
    SELECT
        jsonb_array_elements(movements_snapshot) as movement
    FROM class_history
    WHERE movements_snapshot IS NOT NULL
    LIMIT 3
)
SELECT
    movement->>'name' as movement_name,
    movement->>'type' as movement_type,
    movement->'muscle_groups' as muscle_groups
FROM movement_data
WHERE movement->>'type' = 'movement'
LIMIT 10;

-- ==============================================================================
-- INTERPRETATION:
-- ==============================================================================
--
-- If muscle_groups_count is NULL or 0:
--   → Movements don't have muscle_groups populated
--   → Backend is NOT including muscle data when saving to class_history
--   → Need to fix backend code that inserts into class_history
--
-- If movement_type is NULL:
--   → Movements don't have 'type' field
--   → Backend is not setting type='movement' vs type='transition'
--   → Need to fix data structure being saved
--
-- If total_movements is high but movements_with_populated_muscles is 0:
--   → Structure exists but data is empty arrays
--   → Need to populate muscle_groups from database when saving
--
-- ==============================================================================
