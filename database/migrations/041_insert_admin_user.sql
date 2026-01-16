-- Migration 041: Insert admin user profile (run AFTER migration 040)
-- Created: 2025-12-29
-- Purpose: Manually create user_profiles record for existing auth user
--
-- IMPORTANT: Only run this if you have an existing Supabase Auth user
-- that doesn't have a corresponding user_profiles record.
--
-- To check if you need this:
-- 1. Log in to dev frontend → get JWT token → inspect user_id
-- 2. Check if user_profiles record exists:
--    SELECT * FROM user_profiles WHERE id = 'your-user-id-here';
-- 3. If 0 rows → run this migration

-- ============================================================================
-- INSERT ADMIN USER PROFILE
-- ============================================================================

-- REPLACE ALL VALUES BELOW WITH YOUR ACTUAL DATA:

INSERT INTO user_profiles (
    id,
    email,
    full_name,
    hashed_password,
    created_at,
    updated_at,
    last_login,
    is_admin,
    age_range,
    gender_identity,
    country,
    pilates_experience,
    goals
) VALUES (
    'c6db6029-5e98-4d4d-89b9-d6e9de65acb3',  -- ← REPLACE with your user_id
    'your-email@example.com',                  -- ← REPLACE with your email
    'Your Full Name',                          -- ← REPLACE with your name
    '$2b$12$placeholder',                      -- ← Placeholder (password already in Supabase Auth)
    NOW(),
    NOW(),
    NOW(),
    TRUE,                                       -- is_admin = true (you're the admin!)
    '25-34',                                    -- ← REPLACE with your age range
    NULL,                                       -- gender_identity (optional)
    'Ireland',                                  -- ← REPLACE with your country
    'Advanced',                                 -- ← REPLACE with your experience level
    '["Improve flexibility", "Build strength"]'::jsonb  -- ← REPLACE with your goals
)
ON CONFLICT (id) DO UPDATE SET
    is_admin = TRUE,  -- Ensure admin flag is set
    updated_at = NOW();

-- ============================================================================
-- INSERT DEFAULT PREFERENCES
-- ============================================================================

INSERT INTO user_preferences (
    user_id,
    strictness_level,
    default_class_duration,
    favorite_movements,
    music_preferences,
    research_sources,
    enable_mcp_research,
    use_ai_agent,
    email_notifications,
    class_reminders,
    weekly_summary,
    analytics_enabled,
    data_sharing_enabled
) VALUES (
    'c6db6029-5e98-4d4d-89b9-d6e9de65acb3',  -- ← REPLACE with your user_id
    'guided',
    60,
    '[]'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb,
    TRUE,
    FALSE,  -- AI agent OFF by default (use free tier)
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    FALSE
)
ON CONFLICT (user_id) DO NOTHING;  -- Don't overwrite existing preferences

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check your profile was created:
-- SELECT id, email, full_name, is_admin FROM user_profiles WHERE id = 'c6db6029-5e98-4d4d-89b9-d6e9de65acb3';

-- Check your preferences were created:
-- SELECT user_id, use_ai_agent FROM user_preferences WHERE user_id = 'c6db6029-5e98-4d4d-89b9-d6e9de65acb3';

-- Verify admin access works:
-- SELECT id, email, is_admin FROM user_profiles WHERE is_admin = TRUE;
