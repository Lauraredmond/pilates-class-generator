-- Cleanup Orphaned Data for Failed User Deletion
-- User: laura.bassline@proton.me (f41b50c4-0dd3-4a54-bd2e-09629ca514f3)
-- Purpose: Remove orphaned records that are preventing user deletion

-- First, check what orphaned data exists for this user
SELECT 'Checking orphaned data for user f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- Check class_sequencing_reports (the main blocker)
SELECT COUNT(*) as orphaned_reports
FROM class_sequencing_reports
WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- Check other potential orphaned records
SELECT 'beta_feedback', COUNT(*) FROM beta_feedback WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'llm_invocation_log', COUNT(*) FROM llm_invocation_log WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'play_sessions', COUNT(*) FROM play_sessions WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'class_history', COUNT(*) FROM class_history WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'class_plans', COUNT(*) FROM class_plans WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'medical_exclusions_log', COUNT(*) FROM medical_exclusions_log WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'movement_usage', COUNT(*) FROM movement_usage WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'student_profiles', COUNT(*) FROM student_profiles WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3'
UNION ALL
SELECT 'generated_sequences', COUNT(*) FROM generated_sequences WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- BEGIN TRANSACTION for safe deletion
BEGIN;

-- Delete orphaned records in correct order (respecting foreign keys)

-- 1. Delete from tables that reference user_profiles
DELETE FROM class_sequencing_reports WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM beta_feedback WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM llm_invocation_log WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM play_sessions WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM user_preferences WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- 2. Delete from tables that reference users (auth.users)
DELETE FROM class_history WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM class_plans WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM medical_exclusions_log WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM movement_usage WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM student_profiles WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
DELETE FROM student_profiles WHERE instructor_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- 3. Delete from generated_sequences
DELETE FROM generated_sequences WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- 4. Finally, delete the user profile
DELETE FROM user_profiles WHERE id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- Check if user still exists in auth.users
SELECT COUNT(*) as auth_user_exists FROM auth.users WHERE id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';

-- COMMIT or ROLLBACK based on verification
-- Uncomment the line you want to use:
-- COMMIT;  -- Use this to apply the deletion
-- ROLLBACK;  -- Use this to cancel if something looks wrong

-- Verification: Check that all data is deleted
SELECT 'Verification - All tables should show 0 records:';
SELECT 'user_profiles', COUNT(*) FROM user_profiles WHERE id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';
SELECT 'class_sequencing_reports', COUNT(*) FROM class_sequencing_reports WHERE user_id = 'f41b50c4-0dd3-4a54-bd2e-09629ca514f3';