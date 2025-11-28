-- ============================================================================
-- BACKFILL CLASS HISTORY FROM CLASS PLANS
-- ============================================================================
-- Purpose: Migrate existing class_plans to class_history for analytics
--
-- USAGE:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire script
--   3. Click "Run" to execute
--
-- This script will:
--   - Find all class_plans that don't have a class_history entry
--   - Create class_history entries for analytics tracking
--   - Skip any that already have history (idempotent/safe to re-run)
-- ============================================================================

-- Show preview of what will be backfilled (PREVIEW ONLY)
SELECT
    'PREVIEW: Classes to backfill' as status,
    cp.id as class_plan_id,
    cp.name as class_name,
    cp.user_id,
    cp.created_at,
    cp.duration_minutes,
    ARRAY_LENGTH(cp.movements::jsonb::jsonb[], 1) as movement_count
FROM class_plans cp
LEFT JOIN class_history ch ON ch.class_plan_id = cp.id
WHERE ch.id IS NULL  -- Only class_plans without history
ORDER BY cp.created_at DESC;

-- ============================================================================
-- ACTUAL BACKFILL (Uncomment to execute)
-- ============================================================================

/*
-- UNCOMMENT THIS SECTION TO ACTUALLY RUN THE BACKFILL

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
    DATE(cp.created_at) as taught_date,  -- Use class_plan creation date
    COALESCE(cp.duration_minutes, 0) as actual_duration_minutes,
    1 as attendance_count,  -- Assume self-practice
    COALESCE(cp.movements::jsonb, '[]'::jsonb) as movements_snapshot,
    COALESCE(
        cp.notes,
        'Backfilled from class plan (created ' || cp.created_at::text || ')'
    ) as instructor_notes,
    NULL as difficulty_rating,
    '[]'::jsonb as muscle_groups_targeted,
    COALESCE(ARRAY_LENGTH(cp.movements::jsonb::jsonb[], 1), 0) as total_movements_taught,
    NOW() as created_at
FROM class_plans cp
LEFT JOIN class_history ch ON ch.class_plan_id = cp.id
WHERE ch.id IS NULL  -- Only class_plans that don't have history yet
ON CONFLICT DO NOTHING;  -- Skip if somehow already exists

-- Show results
SELECT
    'BACKFILL COMPLETE' as status,
    COUNT(*) as total_backfilled
FROM class_history
WHERE created_at >= NOW() - INTERVAL '1 minute';  -- Just created entries

*/

-- ============================================================================
-- AFTER RUNNING: Verify analytics data
-- ============================================================================

-- Count class_history entries per user
SELECT
    user_id,
    COUNT(*) as total_classes,
    SUM(actual_duration_minutes) as total_minutes,
    MIN(taught_date) as first_class,
    MAX(taught_date) as latest_class
FROM class_history
GROUP BY user_id
ORDER BY total_classes DESC;
