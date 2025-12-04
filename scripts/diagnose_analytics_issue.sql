-- Diagnose Analytics Blank Chart Issue
-- Run this in Supabase SQL Editor

-- ==============================================================================
-- STEP 1: Check if class_history table exists
-- ==============================================================================
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'class_history'
) AS class_history_table_exists;

-- ==============================================================================
-- STEP 2: Check how many records are in class_history
-- ==============================================================================
SELECT COUNT(*) as class_history_record_count FROM class_history;

-- ==============================================================================
-- STEP 3: Check if class_plans table has the 19 classes
-- ==============================================================================
SELECT COUNT(*) as class_plans_count FROM class_plans;

-- ==============================================================================
-- STEP 4: Sample a class_history record to see the structure
-- ==============================================================================
SELECT
    id,
    user_id,
    taught_date,
    total_movements_taught,
    jsonb_array_length(movements_snapshot) as movements_snapshot_count,
    movements_snapshot->0 as first_movement_sample  -- Check structure
FROM class_history
LIMIT 1;

-- ==============================================================================
-- STEP 5: Check if movements_snapshot includes muscle_groups
-- ==============================================================================
SELECT
    id,
    (movements_snapshot->0->>'name') as movement_name,
    (movements_snapshot->0->'muscle_groups') as muscle_groups_field  -- Should not be null
FROM class_history
WHERE movements_snapshot IS NOT NULL
LIMIT 3;

-- ==============================================================================
-- INTERPRETATION:
-- ==============================================================================
-- If Step 1 returns FALSE:
--   → Table doesn't exist. Need to run migration: 002_create_class_planning_schema.sql
--
-- If Step 2 returns 0:
--   → No classes have been saved to class_history (inserts are failing)
--   → Check Render logs for error messages containing "class_history"
--
-- If Step 3 returns 19 but Step 2 returns 0:
--   → Classes saved to class_plans but NOT to class_history (analytics table)
--   → Backend inserts are failing silently
--
-- If Step 5 shows muscle_groups as NULL:
--   → Movements don't include muscle_groups in snapshot
--   → Need to fix data structure being saved
-- ==============================================================================
