-- ============================================================================
-- Migration 039: Fix RLS Policies for Service Role Inserts (COMPREHENSIVE)
-- ============================================================================
-- Purpose: Allow backend service role to insert into ALL tables
-- Root Cause: Service role policies have empty WITH CHECK clauses
--             INSERT operations ONLY check WITH CHECK, not QUAL
--             So service role policy doesn't apply to INSERTs
-- Fix: Add WITH CHECK clause to service role policies for INSERTs
-- Created: December 24, 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- Fix class_plans RLS Policy
-- ============================================================================

-- Drop old service role policy (has empty WITH CHECK)
DROP POLICY IF EXISTS "Service role can access all class plans" ON class_plans;

-- Create new policy with WITH CHECK for INSERTs
CREATE POLICY "Service role can access all class plans" ON class_plans
    FOR ALL
    USING (
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    )
    WITH CHECK (
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

COMMENT ON POLICY "Service role can access all class plans" ON class_plans IS
'Allows service role full access to class_plans (SELECT, INSERT, UPDATE, DELETE). WITH CHECK clause ensures INSERTs work.';

-- ============================================================================
-- Fix class_movements RLS Policy
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Allow backend service role inserts" ON class_movements;

-- Create new policy (same pattern as class_plans)
CREATE POLICY "Service role can access all class movements" ON class_movements
    FOR ALL
    USING (
        auth.uid() = user_id
        OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id
        OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

COMMENT ON POLICY "Service role can access all class movements" ON class_movements IS
'Allows user access (auth.uid() = user_id) OR service role access for quality tracking';

-- ============================================================================
-- Fix class_quality_log RLS Policy
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Allow backend service role inserts" ON class_quality_log;

-- Create new policy (same pattern as class_movements)
CREATE POLICY "Service role can access all quality logs" ON class_quality_log
    FOR ALL
    USING (
        auth.uid() = user_id
        OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id
        OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

COMMENT ON POLICY "Service role can access all quality logs" ON class_quality_log IS
'Allows user access (auth.uid() = user_id) OR service role access for quality tracking';

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
/*
-- Check all policies have WITH CHECK clauses
SELECT tablename, policyname, cmd,
       CASE WHEN with_check IS NOT NULL THEN 'HAS WITH_CHECK' ELSE 'MISSING WITH_CHECK' END as status
FROM pg_policies
WHERE tablename IN ('class_plans', 'class_movements', 'class_quality_log')
  AND policyname LIKE '%service%'
ORDER BY tablename, policyname;
*/
