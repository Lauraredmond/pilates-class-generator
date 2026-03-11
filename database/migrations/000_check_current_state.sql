-- =====================================================
-- DIAGNOSTIC SCRIPT: Check current database state
-- Date: March 2024
-- Description: Run this BEFORE migration to understand current state
-- =====================================================

-- =====================================================
-- Check current columns in user_profiles table
-- =====================================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- =====================================================
-- Check if is_admin field exists and has data
-- =====================================================
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            AND column_name = 'is_admin'
        )
        THEN 'is_admin column EXISTS'
        ELSE 'is_admin column DOES NOT EXIST'
    END AS is_admin_status;

-- Count admin users (if is_admin exists)
-- Uncomment if is_admin column exists:
-- SELECT COUNT(*) as admin_count
-- FROM user_profiles
-- WHERE is_admin = true;

-- =====================================================
-- Check if user_type field already exists
-- =====================================================
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            AND column_name = 'user_type'
        )
        THEN 'user_type column ALREADY EXISTS'
        ELSE 'user_type column DOES NOT EXIST'
    END AS user_type_status;

-- If user_type exists, check distribution
-- Uncomment if user_type column exists:
-- SELECT user_type, COUNT(*) as count
-- FROM user_profiles
-- GROUP BY user_type;

-- =====================================================
-- Count total users
-- =====================================================
SELECT COUNT(*) as total_users
FROM user_profiles;

-- =====================================================
-- Check if sport tables already exist
-- =====================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sport_exercises', 'coach_sport_sessions');

-- =====================================================
-- Check current constraints on user_profiles
-- =====================================================
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass;

-- =====================================================
-- Sample of current user data (first 5 users)
-- =====================================================
-- Be careful with this query - only run in dev/test environments
-- SELECT
--     user_id,
--     email,
--     CASE WHEN is_admin IS NOT NULL THEN is_admin ELSE false END as is_admin,
--     created_at
-- FROM user_profiles
-- LIMIT 5;