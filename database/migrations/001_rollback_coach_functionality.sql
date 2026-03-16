-- =====================================================
-- ROLLBACK MIGRATION: Remove Coach Functionality
-- Date: March 2024
-- Description: Rollback script to undo coach functionality changes
-- WARNING: This will lose all coach-specific data!
-- =====================================================

-- =====================================================
-- STEP 1: Drop coach-specific tables
-- =====================================================

DROP TABLE IF EXISTS coach_sport_sessions;
DROP TABLE IF EXISTS sport_exercises;

-- =====================================================
-- STEP 2: Restore is_admin field (if needed)
-- =====================================================

-- Add back the is_admin column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set is_admin based on user_type
UPDATE user_profiles
SET is_admin = true
WHERE user_type = 'admin';

-- =====================================================
-- STEP 3: Remove user_type column
-- =====================================================

-- Remove the constraint first
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_type_check;

-- Remove the column
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS user_type;

-- =====================================================
-- STEP 4: Drop helper function
-- =====================================================

DROP FUNCTION IF EXISTS get_user_type(UUID);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that user_type column is removed
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- AND column_name = 'user_type';

-- Check that tables are dropped
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('sport_exercises', 'coach_sport_sessions');