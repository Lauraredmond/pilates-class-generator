-- Check data for user 50b40bda-45ce-4c03-8e51-35d76341c192
-- Run this in Supabase SQL Editor to see what's actually in the database

-- 1. Check class_history table
SELECT
    COUNT(*) as class_history_count,
    MIN(created_at) as first_class,
    MAX(created_at) as last_class
FROM class_history
WHERE user_id = '50b40bda-45ce-4c03-8e51-35d76341c192';

-- 2. Check class_plans table
SELECT
    COUNT(*) as class_plans_count,
    MIN(created_at) as first_plan,
    MAX(created_at) as last_plan
FROM class_plans
WHERE user_id = '50b40bda-45ce-4c03-8e51-35d76341c192';

-- 3. Check movement_usage table
SELECT
    COUNT(*) as movement_usage_count
FROM movement_usage
WHERE user_id = '50b40bda-45ce-4c03-8e51-35d76341c192';

-- 4. Show latest 5 class_history entries (if any)
SELECT
    id,
    taught_date,
    actual_duration_minutes,
    total_movements_taught,
    created_at,
    jsonb_array_length(movements_snapshot) as movement_count
FROM class_history
WHERE user_id = '50b40bda-45ce-4c03-8e51-35d76341c192'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Show latest 5 class_plans entries (if any)
SELECT
    id,
    name,
    difficulty_level,
    duration_minutes,
    created_at,
    jsonb_array_length(movements) as movement_count
FROM class_plans
WHERE user_id = '50b40bda-45ce-4c03-8e51-35d76341c192'
ORDER BY created_at DESC
LIMIT 5;
