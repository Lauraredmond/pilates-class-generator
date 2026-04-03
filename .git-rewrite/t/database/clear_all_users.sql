-- ============================================
-- CLEAR ALL USER DATA FROM SUPABASE
-- ============================================
-- WARNING: This will delete ALL users and their data
-- Only run in development/testing environments
-- ============================================

-- 1. Delete from compliance tables first (foreign key dependencies)
DELETE FROM ropa_audit_log;
DELETE FROM ai_decision_log;
DELETE FROM bias_monitoring;
DELETE FROM model_drift_log;

-- 2. Delete user preferences
DELETE FROM user_preferences;

-- 3. Delete user profiles
DELETE FROM user_profiles;

-- 4. Delete from Supabase Auth (this is the critical one)
-- This removes the authentication records
DELETE FROM auth.users;

-- Verify everything is cleared
SELECT 'user_profiles count:' as table_name, COUNT(*) as remaining FROM user_profiles
UNION ALL
SELECT 'user_preferences count:', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'auth.users count:', COUNT(*) FROM auth.users
UNION ALL
SELECT 'compliance tables count:',
  (SELECT COUNT(*) FROM ropa_audit_log) +
  (SELECT COUNT(*) FROM ai_decision_log) +
  (SELECT COUNT(*) FROM bias_monitoring) +
  (SELECT COUNT(*) FROM model_drift_log);
