-- Migration 022: Add is_admin flag to user_profiles
-- Created: 2025-12-17
-- Purpose: Gate QA/diagnostic features to admin users only

-- ============================================================================
-- ADD IS_ADMIN COLUMN
-- ============================================================================

-- Add is_admin boolean column (defaults to false for security)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN user_profiles.is_admin IS 'Admin flag - gates access to QA reports, analytics, and diagnostic features';

-- ============================================================================
-- CREATE INDEX FOR ADMIN QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- ============================================================================
-- SET YOUR ACCOUNT AS ADMIN (replace with your actual user_id)
-- ============================================================================

-- IMPORTANT: Run this query with YOUR actual user_id to make yourself admin
-- Get your user_id from Supabase Authentication or user_profiles table:
-- SELECT user_id FROM user_profiles WHERE email = 'your_email@example.com';

-- Example (replace with your user_id):
-- UPDATE user_profiles SET is_admin = true WHERE user_id = 'your-uuid-here';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check column was added:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles' AND column_name = 'is_admin';

-- Check your admin status:
-- SELECT user_id, email, is_admin FROM user_profiles WHERE is_admin = true;

-- Count admin vs regular users:
-- SELECT is_admin, COUNT(*) FROM user_profiles GROUP BY is_admin;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- QA reports are now admin-only features:
-- - Muscle overlap analytics reports
-- - Sequence generation statistics
-- - Diagnostic logs and debugging tools
--
-- Regular users don't need these - they just use the classes.
-- Only platform admins (you) need detailed analytics for quality assurance.
--
-- To add new admins:
-- UPDATE user_profiles SET is_admin = true WHERE email = 'new_admin@example.com';
