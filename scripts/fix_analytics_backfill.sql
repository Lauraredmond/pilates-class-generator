-- Fix Analytics by Backfilling class_history from class_plans
-- Run this in Supabase SQL Editor ONLY IF diagnostic shows class_history is empty

-- ==============================================================================
-- IMPORTANT: Only run this if:
-- 1. class_history table EXISTS but is EMPTY (0 records)
-- 2. class_plans table has 19 records
-- 3. You want to backfill analytics data from existing class_plans
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: Backfill class_history from class_plans
-- ==============================================================================
-- This will create class_history records for all existing class_plans
-- so that analytics can display data

INSERT INTO class_history (
    class_plan_id,
    user_id,
    taught_date,
    actual_duration_minutes,
    attendance_count,
    movements_snapshot,
    instructor_notes,
    difficulty_rating,
    muscle_groups_targeted,
    total_movements_taught,
    created_at
)
SELECT
    cp.id as class_plan_id,
    cp.user_id,
    COALESCE(cp.created_at::date, CURRENT_DATE) as taught_date,
    cp.target_duration_minutes as actual_duration_minutes,
    1 as attendance_count,  -- Assume generated classes were "taught" once

    -- Movements snapshot (need to parse from agent_result or movements array)
    COALESCE(
        cp.agent_result->'movements',  -- AI-generated classes
        '[]'::jsonb  -- Fallback if no movements
    ) as movements_snapshot,

    CONCAT('Backfilled from class_plan ', cp.id) as instructor_notes,
    NULL as difficulty_rating,
    '[]'::jsonb as muscle_groups_targeted,

    -- Count movements in snapshot
    CASE
        WHEN cp.agent_result->'movements' IS NOT NULL THEN
            jsonb_array_length(cp.agent_result->'movements')
        ELSE 0
    END as total_movements_taught,

    cp.created_at
FROM class_plans cp
WHERE NOT EXISTS (
    -- Don't duplicate if already in class_history
    SELECT 1 FROM class_history ch
    WHERE ch.class_plan_id = cp.id
);

-- ==============================================================================
-- STEP 2: Verify the backfill worked
-- ==============================================================================
SELECT
    COUNT(*) as total_records_in_class_history,
    MIN(taught_date) as earliest_class,
    MAX(taught_date) as latest_class,
    SUM(total_movements_taught) as total_movements_across_all_classes
FROM class_history;

-- ==============================================================================
-- STEP 3: Sample a record to verify muscle_groups are populated
-- ==============================================================================
SELECT
    id,
    taught_date,
    total_movements_taught,
    jsonb_array_length(movements_snapshot) as movements_count,
    movements_snapshot->0->'muscle_groups' as first_movement_muscles
FROM class_history
LIMIT 3;

COMMIT;

-- ==============================================================================
-- WHAT THIS SCRIPT DOES:
-- ==============================================================================
-- 1. Copies all class_plans records into class_history table
-- 2. Uses agent_result->movements as the movements_snapshot
-- 3. Sets taught_date to the class creation date
-- 4. Marks attendance_count as 1 (assumes class was "taught")
--
-- IMPORTANT NOTES:
-- - If movements_snapshot doesn't include muscle_groups, the chart will still be blank
-- - You may need to regenerate a NEW class to test if muscle_groups are included
-- - Check Render logs for "✅ Saved to class_history table" messages
-- ==============================================================================
