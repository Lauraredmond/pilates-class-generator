-- Migration 020: Fix SECURITY DEFINER Warnings
-- This migration changes most functions from SECURITY DEFINER to SECURITY INVOKER
-- to address Supabase Security Advisor warnings
-- SECURITY DEFINER should only be used when elevated privileges are truly needed

-- ============================================
-- FUNCTIONS TO CHANGE TO SECURITY INVOKER
-- ============================================
-- These functions don't need elevated privileges and should run with the calling user's permissions

-- 1. calculate_movement_novelty_score
ALTER FUNCTION calculate_movement_novelty_score(uuid, uuid) SECURITY INVOKER;

-- 2. check_consecutive_muscle_overuse
ALTER FUNCTION check_consecutive_muscle_overuse(uuid, varchar, int) SECURITY INVOKER;

-- 3. check_pregnancy_exclusion
ALTER FUNCTION check_pregnancy_exclusion(uuid, uuid) SECURITY INVOKER;

-- 4. get_user_movement_history
ALTER FUNCTION get_user_movement_history(uuid, int) SECURITY INVOKER;

-- 5. select_cooldown_by_muscle_groups
ALTER FUNCTION select_cooldown_by_muscle_groups(text[], varchar) SECURITY INVOKER;

-- 6. select_warmup_by_muscle_groups
ALTER FUNCTION select_warmup_by_muscle_groups(text[], varchar) SECURITY INVOKER;

-- 7. validate_required_elements
ALTER FUNCTION validate_required_elements(jsonb) SECURITY INVOKER;

-- ============================================
-- FUNCTIONS TO KEEP AS SECURITY DEFINER
-- ============================================
-- These trigger functions need elevated privileges to update system columns

-- log_pregnancy_detection - Keep as SECURITY DEFINER (logging function needs write access)
-- Comment: This function logs system events and needs elevated privileges

-- update_beta_feedback_updated_at - Keep as SECURITY DEFINER (trigger function)
-- update_music_playlists_updated_at - Keep as SECURITY DEFINER (trigger function)
-- update_music_tracks_updated_at - Keep as SECURITY DEFINER (trigger function)
-- update_updated_at_column - Keep as SECURITY DEFINER (trigger function)
-- Comment: Trigger functions need SECURITY DEFINER to update system columns

-- ============================================
-- VIEWS CHECK AND FIX
-- ============================================
-- Check and fix any views with SECURITY DEFINER (if they exist in production)

-- Drop and recreate views without SECURITY DEFINER if needed
-- Views typically don't need SECURITY DEFINER unless accessing restricted data

-- early_skip_statistics view
DROP VIEW IF EXISTS early_skip_statistics CASCADE;
CREATE VIEW early_skip_statistics AS
SELECT
    class_id,
    section_type,
    movement_name,
    skipped,
    skip_reason,
    created_at
FROM playback_events
WHERE event_type = 'section_skipped';

-- movement_skip_leaderboard view
DROP VIEW IF EXISTS movement_skip_leaderboard CASCADE;
CREATE VIEW movement_skip_leaderboard AS
SELECT
    movement_name,
    COUNT(*) FILTER (WHERE skipped = true) as skip_count,
    COUNT(*) as total_plays,
    ROUND(100.0 * COUNT(*) FILTER (WHERE skipped = true) / NULLIF(COUNT(*), 0), 2) as skip_rate
FROM playback_events
WHERE event_type = 'movement_completed' OR event_type = 'section_skipped'
GROUP BY movement_name
ORDER BY skip_count DESC;

-- platform_quality_metrics view
DROP VIEW IF EXISTS platform_quality_metrics CASCADE;
CREATE VIEW platform_quality_metrics AS
SELECT
    COUNT(DISTINCT user_id) as total_users,
    COUNT(DISTINCT class_id) as total_classes,
    AVG(CASE WHEN event_type = 'class_completed' THEN 1 ELSE 0 END) * 100 as completion_rate,
    AVG(CASE WHEN event_type = 'section_skipped' THEN 1 ELSE 0 END) * 100 as skip_rate
FROM playback_events;

-- section_type_skip_summary view
DROP VIEW IF EXISTS section_type_skip_summary CASCADE;
CREATE VIEW section_type_skip_summary AS
SELECT
    section_type,
    COUNT(*) FILTER (WHERE skipped = true) as skip_count,
    COUNT(*) as total_sections,
    ROUND(100.0 * COUNT(*) FILTER (WHERE skipped = true) / NULLIF(COUNT(*), 0), 2) as skip_percentage
FROM playback_events
WHERE event_type IN ('section_completed', 'section_skipped')
GROUP BY section_type
ORDER BY skip_percentage DESC;

-- user_play_statistics view
DROP VIEW IF EXISTS user_play_statistics CASCADE;
CREATE VIEW user_play_statistics AS
SELECT
    user_id,
    COUNT(DISTINCT class_id) as classes_played,
    COUNT(*) FILTER (WHERE event_type = 'class_completed') as classes_completed,
    COUNT(*) FILTER (WHERE event_type = 'section_skipped') as sections_skipped,
    MAX(created_at) as last_activity
FROM playback_events
GROUP BY user_id;

-- user_quality_statistics view
DROP VIEW IF EXISTS user_quality_statistics CASCADE;
CREATE VIEW user_quality_statistics AS
SELECT
    user_id,
    AVG(CASE WHEN event_type = 'class_completed' THEN 1 ELSE 0 END) * 100 as personal_completion_rate,
    AVG(CASE WHEN event_type = 'section_skipped' THEN 1 ELSE 0 END) * 100 as personal_skip_rate,
    COUNT(DISTINCT DATE(created_at)) as active_days
FROM playback_events
GROUP BY user_id;

-- ============================================
-- GRANT PROPER PERMISSIONS
-- ============================================
-- Ensure authenticated users have proper access to views

GRANT SELECT ON early_skip_statistics TO authenticated;
GRANT SELECT ON movement_skip_leaderboard TO authenticated;
GRANT SELECT ON platform_quality_metrics TO authenticated;
GRANT SELECT ON section_type_skip_summary TO authenticated;
GRANT SELECT ON user_play_statistics TO authenticated;
GRANT SELECT ON user_quality_statistics TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify security settings

-- Check functions security settings:
-- SELECT proname, prosecdef FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- Check views exist and are accessible:
-- SELECT viewname FROM pg_views WHERE schemaname = 'public';

COMMENT ON SCHEMA public IS 'Migration 020 applied: Fixed SECURITY DEFINER warnings for better security posture';