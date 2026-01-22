-- Migration 020: Fix SECURITY DEFINER Warnings (Simple Version)
-- This migration changes functions from SECURITY DEFINER to SECURITY INVOKER
-- to address Supabase Security Advisor warnings

-- NOTE: This only changes the security setting, not the function logic
-- NOTE: Views are fine as-is and don't need changes

-- ============================================
-- CHANGE FUNCTIONS TO SECURITY INVOKER
-- ============================================

-- These functions don't need elevated privileges

ALTER FUNCTION calculate_movement_novelty_score(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION check_consecutive_muscle_overuse(uuid, varchar, integer) SECURITY INVOKER;
ALTER FUNCTION check_pregnancy_exclusion(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION get_user_movement_history(uuid, integer) SECURITY INVOKER;
ALTER FUNCTION select_cooldown_by_muscle_groups(text[], varchar) SECURITY INVOKER;
ALTER FUNCTION select_warmup_by_muscle_groups(text[], varchar) SECURITY INVOKER;
ALTER FUNCTION validate_required_elements(jsonb) SECURITY INVOKER;

-- ============================================
-- FUNCTIONS THAT STAY AS SECURITY DEFINER
-- ============================================
-- These trigger/logging functions need elevated privileges (no changes)
-- - log_pregnancy_detection
-- - update_beta_feedback_updated_at
-- - update_music_playlists_updated_at
-- - update_music_tracks_updated_at
-- - update_updated_at_column

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify changes:
--
-- SELECT
--     proname as function_name,
--     CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- ORDER BY prosecdef DESC, proname;

COMMENT ON SCHEMA public IS 'Migration 020 applied: Fixed SECURITY DEFINER warnings';