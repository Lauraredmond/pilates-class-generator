-- Migration 020: Add Service Role Policies for GDPR Compliance
-- Created: 2025-12-09
-- Purpose: Allow service role (supabase_admin) to access class data for GDPR Article 15 compliance

-- ============================================================================
-- PROBLEM:
-- ============================================================================
-- The compliance endpoint uses supabase_admin (service role) to fetch user data
-- for GDPR Article 15 "Right to Access" data exports. However, RLS policies
-- on class_plans and class_history only allow access when auth.uid() = user_id.
--
-- When using the service role, auth.uid() is NULL, so queries return 0 results
-- even though the service role should bypass RLS.
--
-- SOLUTION:
-- Add explicit policies that allow service role to access all data, similar to
-- the existing policy for pii_tokens.
--
-- ============================================================================

-- ============================================================================
-- CLASS PLANS: Allow service role access for compliance
-- ============================================================================

CREATE POLICY "Service role can access all class plans"
    ON class_plans FOR ALL
    USING (
        (CURRENT_SETTING('request.jwt.claims', true)::json->>'role')::text = 'service_role'
    );

COMMENT ON POLICY "Service role can access all class plans" ON class_plans IS
'Allows backend service role to access all class plans for GDPR compliance operations (Article 15: Right to Access)';

-- ============================================================================
-- CLASS HISTORY: Allow service role access for compliance
-- ============================================================================

CREATE POLICY "Service role can access all class history"
    ON class_history FOR ALL
    USING (
        (CURRENT_SETTING('request.jwt.claims', true)::json->>'role')::text = 'service_role'
    );

COMMENT ON POLICY "Service role can access all class history" ON class_history IS
'Allows backend service role to access all class history for GDPR compliance operations (Article 15: Right to Access)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running this migration, verify that policies exist:
--
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('class_plans', 'class_history')
-- ORDER BY tablename, policyname;
--
-- Expected to see:
-- - "Service role can access all class plans" on class_plans
-- - "Service role can access all class history" on class_history
-- ============================================================================
