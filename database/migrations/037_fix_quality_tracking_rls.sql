-- ============================================================================
-- Migration 037: Fix RLS Policies for Backend Service Role Inserts
-- ============================================================================
-- Purpose: Allow backend service role to insert quality tracking data
-- Issue: Backend uses service role key (auth.uid() = NULL), but RLS policies
--        check auth.uid() = user_id, blocking all inserts
-- Created: December 24, 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- Fix class_movements RLS Policy
-- ============================================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can create own class movements" ON class_movements;

-- Create new policy allowing service role inserts
CREATE POLICY "Allow backend service role inserts" ON class_movements
    FOR INSERT
    WITH CHECK (
        -- Allow if authenticated user matches user_id (app inserts)
        auth.uid() = user_id
        OR
        -- Allow if using service role (backend inserts)
        auth.jwt() ->> 'role' = 'service_role'
    );

COMMENT ON POLICY "Allow backend service role inserts" ON class_movements IS
'Allows both user inserts (auth.uid() = user_id) and backend service role inserts for quality tracking';

-- ============================================================================
-- Fix class_quality_log RLS Policy
-- ============================================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can create own quality logs" ON class_quality_log;

-- Create new policy allowing service role inserts
CREATE POLICY "Allow backend service role inserts" ON class_quality_log
    FOR INSERT
    WITH CHECK (
        -- Allow if authenticated user matches user_id (app inserts)
        auth.uid() = user_id
        OR
        -- Allow if using service role (backend inserts)
        auth.jwt() ->> 'role' = 'service_role'
    );

COMMENT ON POLICY "Allow backend service role inserts" ON class_quality_log IS
'Allows both user inserts (auth.uid() = user_id) and backend service role inserts for quality tracking';

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
/*
-- Check policies are updated
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('class_movements', 'class_quality_log')
ORDER BY tablename, policyname;
*/
