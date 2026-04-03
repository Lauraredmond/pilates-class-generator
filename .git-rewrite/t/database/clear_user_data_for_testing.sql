-- ============================================
-- Clear User Data for Testing (Beginner Mode)
-- Session 13: Movement Variety Testing
-- ============================================
-- Purpose: Clear all analytics data to test beginner detection and "The Hundred" boosting

-- STEP 1: Identify your user_id
-- Run this first to get your UUID
SELECT
    id,
    email,
    full_name,
    created_at
FROM user_profiles
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
LIMIT 1;

-- ============================================
-- STEP 2: Verify what data exists for your user
-- ============================================
-- Copy the 'id' from above and use it below

-- Check class_history (should show 22 classes currently)
SELECT COUNT(*) as class_count, user_id
FROM class_history
WHERE user_id = 'YOUR_USER_ID_HERE'  -- Replace with UUID from STEP 1
GROUP BY user_id;

-- Check movement_usage (should show "One Leg Stretch" as most used)
SELECT m.name, mu.usage_count
FROM movement_usage mu
JOIN movements m ON mu.movement_id = m.id
WHERE mu.user_id = 'YOUR_USER_ID_HERE'
ORDER BY mu.usage_count DESC
LIMIT 5;

-- Check user preferences (should show experience level and classes_completed)
SELECT
    experience_level,
    classes_completed,
    first_class_date
FROM user_preferences
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- STEP 3: DELETE all analytics data for testing
-- ============================================
-- Replace YOUR_USER_ID_HERE with your actual UUID from STEP 1

-- Delete class history (removes all past classes)
DELETE FROM class_history
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Delete movement usage (removes favorite movement tracking)
DELETE FROM movement_usage
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Delete class plans (removes saved plans)
DELETE FROM class_plans
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- STEP 4: Reset user to BEGINNER status
-- ============================================
-- This ensures "The Hundred" boosting logic activates

UPDATE user_preferences
SET
    experience_level = 'beginner',
    classes_completed = 0,
    first_class_date = NULL
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- STEP 5: Verify data is cleared
-- ============================================

-- Should return 0 classes
SELECT COUNT(*) as class_count
FROM class_history
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Should return 0 movement usage records
SELECT COUNT(*) as movement_usage_count
FROM movement_usage
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Should show beginner with 0 classes
SELECT
    experience_level,
    classes_completed,
    first_class_date
FROM user_preferences
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- EXPECTED RESULTS AFTER CLEARING
-- ============================================
-- Analytics page should show:
-- - 0 classes
-- - 0h 0m practice time
-- - 0 days streak
-- - "The Hundred" as default favorite (no usage data)
-- - Empty charts (no history)

-- When you generate a new class:
-- - Backend should detect is_beginner = True
-- - "The Hundred" should get 3x weight boost
-- - Logs should show: "✨ Beginner detected: Boosted 'The Hundred' weight from X to Y"
