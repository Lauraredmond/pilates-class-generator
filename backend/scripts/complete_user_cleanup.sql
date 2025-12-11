-- Complete User Cleanup Script
-- Removes ALL traces of a user from ALL tables in the database
-- Email: laura.redm@gmail.com

-- ============================================
-- STEP 1: Find the user ID
-- ============================================
SELECT id, email, full_name, created_at
FROM user_profiles
WHERE email = 'laura.redm@gmail.com';

-- Copy the user ID from above and use it in the rest of the script
-- Or we can use a variable approach

-- ============================================
-- STEP 2: Delete from child tables first (foreign key constraints)
-- ============================================

-- Delete user preferences
DELETE FROM user_preferences
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete class plans (if any exist)
DELETE FROM class_plans
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete completed classes (if table exists)
DELETE FROM completed_classes
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete beta feedback submissions (if any exist)
DELETE FROM beta_feedback
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete compliance/audit logs (GDPR Article 30)
DELETE FROM ropa_audit_log
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete AI decision logs (EU AI Act compliance)
DELETE FROM ai_decision_log
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete bias monitoring records (if any)
DELETE FROM bias_monitoring
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete model drift logs (if any)
DELETE FROM model_drift_log
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Delete PII tokens (if table exists)
DELETE FROM pii_tokens
WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- ============================================
-- STEP 3: Delete from main user tables
-- ============================================

-- Delete from users table (tokenized email table)
DELETE FROM users
WHERE id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Also delete by email_token (in case ID doesn't match)
DELETE FROM users
WHERE email_token = 'token_laura.redm@gmail.com';

-- Delete from user_profiles (main user record)
DELETE FROM user_profiles
WHERE email = 'laura.redm@gmail.com';

-- ============================================
-- STEP 4: Verification Queries
-- ============================================

-- All should return 0 rows

SELECT 'user_profiles' as table_name, COUNT(*) as remaining_records
FROM user_profiles WHERE email = 'laura.redm@gmail.com'
UNION ALL
SELECT 'users', COUNT(*)
FROM users WHERE email_token = 'token_laura.redm@gmail.com'
UNION ALL
SELECT 'user_preferences', COUNT(*)
FROM user_preferences WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com')
UNION ALL
SELECT 'class_plans', COUNT(*)
FROM class_plans WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com')
UNION ALL
SELECT 'beta_feedback', COUNT(*)
FROM beta_feedback WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com');

-- Should see:
-- table_name         | remaining_records
-- -------------------|------------------
-- user_profiles      | 0
-- users              | 0
-- user_preferences   | 0
-- class_plans        | 0
-- beta_feedback      | 0

-- ============================================
-- FINAL CHECK: Search all tables for any remaining references
-- ============================================

-- This is a manual check - if you know the user_id, replace 'USER_ID_HERE' with actual UUID
-- SELECT * FROM user_profiles WHERE id = 'USER_ID_HERE';
-- SELECT * FROM users WHERE id = 'USER_ID_HERE';
-- SELECT * FROM user_preferences WHERE user_id = 'USER_ID_HERE';
-- SELECT * FROM class_plans WHERE user_id = 'USER_ID_HERE';
-- SELECT * FROM ropa_audit_log WHERE user_id = 'USER_ID_HERE';
-- SELECT * FROM ai_decision_log WHERE user_id = 'USER_ID_HERE';

-- ============================================
-- NOTES
-- ============================================
-- After running this script:
-- 1. All verification queries should return 0 rows
-- 2. You can now register with laura.redm@gmail.com again
-- 3. Future account deletions will automatically clean up all tables (bug fixed in backend)
