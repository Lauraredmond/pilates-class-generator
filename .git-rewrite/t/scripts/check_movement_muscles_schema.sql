-- Diagnostic: Check Actual Schema of movement_muscles Table
-- Run this in Supabase SQL Editor to see what columns exist

-- ==============================================================================
-- STEP 1: Check if table exists
-- ==============================================================================
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'movement_muscles'
ORDER BY ordinal_position;

-- ==============================================================================
-- STEP 2: Show sample data (first 5 rows)
-- ==============================================================================
SELECT *
FROM movement_muscles
LIMIT 5;

-- ==============================================================================
-- STEP 3: Test JOIN to muscle_groups (if columns match migration)
-- ==============================================================================
-- This will fail if column names are different
SELECT
    mm.id,
    mm.movement_id,
    mm.muscle_group_id,  -- ← This is the column that allegedly doesn't exist
    mm.is_primary,
    mg.name as muscle_group_name
FROM movement_muscles mm
LEFT JOIN muscle_groups mg ON mm.muscle_group_id = mg.id
LIMIT 5;

-- ==============================================================================
-- INTERPRETATION:
-- ==============================================================================
--
-- If STEP 1 shows different column names (e.g., "muscle_id" instead of "muscle_group_id"):
--   → Production schema doesn't match migration files
--   → Need to update backfill script with correct column names
--
-- If STEP 3 works without error:
--   → Schema is correct, error was elsewhere
--   → Re-run backfill script
--
-- If table doesn't exist (STEP 1 returns 0 rows):
--   → Migration wasn't applied to production
--   → Need to run migration first
-- ==============================================================================
