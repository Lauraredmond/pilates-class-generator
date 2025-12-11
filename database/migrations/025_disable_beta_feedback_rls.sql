-- Migration 025: Disable RLS on beta_feedback table
-- Date: December 11, 2025
-- Purpose: Fix feedback submission - app uses custom JWT auth, not Supabase Auth
--
-- Problem:
-- - RLS policy requires: auth.uid() = user_id
-- - But app uses custom JWT tokens (utils/auth.py), not Supabase Auth
-- - auth.uid() always returns NULL → RLS blocks all inserts
-- - Error: "new row violates row-level security policy"
--
-- Solution:
-- - Disable RLS on beta_feedback table
-- - Security already handled at application layer via get_current_user_id()
-- - FastAPI endpoint validates user authentication before insert
--
-- Security Notes:
-- 1. Application-level security is SUFFICIENT for beta_feedback:
--    - POST /api/feedback/submit requires valid JWT token
--    - user_id extracted from authenticated JWT via get_current_user_id()
--    - Users can only insert their own feedback (no privilege escalation)
-- 2. Table doesn't contain highly sensitive data (just feedback text)
-- 3. Users already authenticated at API layer before reaching database
--
-- This is the appropriate pattern when using custom auth instead of Supabase Auth

-- Drop existing RLS policies (not needed with application-level security)
DROP POLICY IF EXISTS "Users can view own feedback" ON beta_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON beta_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON beta_feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON beta_feedback;

-- Disable Row Level Security
ALTER TABLE beta_feedback DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
-- Expected: rls_enabled = false
-- SELECT tablename, rowsecurity as rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename = 'beta_feedback';

-- Note: Security is maintained at application layer
-- All endpoints in backend/api/feedback.py require authentication via get_current_user_id()
