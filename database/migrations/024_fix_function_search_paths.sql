-- Migration 024: Fix Function Search Path Security
-- Date: December 10, 2025
-- Purpose: Fix HIGH security warnings - add search_path to 15 database functions
--
-- Supabase Security Linter Report:
-- - 15 functions marked as WARN: "Function Search Path Mutable"
-- - Risk: Potential SQL injection via schema hijacking attacks
--
-- This migration:
-- 1. Recreates all 15 functions with SECURITY DEFINER
-- 2. Sets search_path to empty string (most secure)
-- 3. Uses fully qualified names (schema.table) in function bodies
--
-- Why this matters:
-- Without a fixed search_path, an attacker could create malicious objects
-- in a schema that appears earlier in the search path, causing the function
-- to execute malicious code instead of legitimate database objects.

-- =============================================================================
-- STEP 1: DROP EXISTING FUNCTIONS (Required to change parameter names)
-- =============================================================================
-- PostgreSQL won't let us change parameter names with CREATE OR REPLACE
-- We must DROP the function first, then CREATE with new secure version
--
-- NOTE: Trigger functions must use CASCADE to drop dependent triggers
-- We'll recreate the triggers after recreating the functions

DROP FUNCTION IF EXISTS calculate_playlist_duration(uuid);
DROP FUNCTION IF EXISTS get_playlist_with_tracks(uuid);
DROP FUNCTION IF EXISTS select_warmup_by_muscle_groups(text[], varchar);
DROP FUNCTION IF EXISTS select_cooldown_by_muscle_groups(text[], varchar);
DROP FUNCTION IF EXISTS validate_required_elements(jsonb);
DROP FUNCTION IF EXISTS check_pregnancy_exclusion(uuid, uuid);
DROP FUNCTION IF EXISTS check_consecutive_muscle_overuse(uuid, varchar, integer);
DROP FUNCTION IF EXISTS get_user_movement_history(uuid, integer);
DROP FUNCTION IF EXISTS calculate_movement_novelty_score(uuid, uuid);

-- Trigger functions - must use CASCADE to drop dependent triggers
DROP FUNCTION IF EXISTS update_music_tracks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_music_playlists_updated_at() CASCADE;
DROP FUNCTION IF EXISTS log_pregnancy_detection() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_beta_feedback_updated_at() CASCADE;

-- =============================================================================
-- STEP 2: RECREATE FUNCTIONS WITH SECURITY FIXES
-- =============================================================================

-- =============================================================================
-- PART 1: MUSIC SYSTEM FUNCTIONS
-- =============================================================================

-- Function 1: calculate_playlist_duration
CREATE OR REPLACE FUNCTION calculate_playlist_duration(playlist_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_duration INTEGER;
BEGIN
  SELECT COALESCE(SUM(mt.duration_seconds), 0)
  INTO total_duration
  FROM public.music_playlist_tracks mpt
  JOIN public.music_tracks mt ON mpt.track_id = mt.id
  WHERE mpt.playlist_id = playlist_id_param;

  RETURN total_duration;
END;
$$;

-- Function 2: update_music_tracks_updated_at
CREATE OR REPLACE FUNCTION update_music_tracks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 3: update_music_playlists_updated_at
CREATE OR REPLACE FUNCTION update_music_playlists_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 4: get_playlist_with_tracks
CREATE OR REPLACE FUNCTION get_playlist_with_tracks(playlist_id_param UUID)
RETURNS TABLE (
  playlist_id UUID,
  playlist_name VARCHAR,
  playlist_description TEXT,
  track_id UUID,
  track_title VARCHAR,
  composer VARCHAR,
  duration_seconds INTEGER,
  sequence_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id,
    mp.name,
    mp.description,
    mt.id,
    mt.title,
    mt.composer,
    mt.duration_seconds,
    mpt.sequence_order
  FROM public.music_playlists mp
  JOIN public.music_playlist_tracks mpt ON mp.id = mpt.playlist_id
  JOIN public.music_tracks mt ON mpt.track_id = mt.id
  WHERE mp.id = playlist_id_param
  ORDER BY mpt.sequence_order;
END;
$$;

-- =============================================================================
-- PART 2: CLASS SECTION SELECTION FUNCTIONS
-- =============================================================================

-- Function 5: select_warmup_by_muscle_groups
CREATE OR REPLACE FUNCTION select_warmup_by_muscle_groups(
  muscle_groups_param TEXT[],
  difficulty_param VARCHAR DEFAULT 'Beginner'
)
RETURNS TABLE (
  id UUID,
  routine_name VARCHAR,
  focus_area VARCHAR,
  narrative TEXT,
  movements JSONB,
  duration_seconds INTEGER,
  difficulty_level VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.id,
    wr.routine_name,
    wr.focus_area,
    wr.narrative,
    wr.movements,
    wr.duration_seconds,
    wr.difficulty_level
  FROM public.warmup_routines wr
  WHERE wr.difficulty_level = difficulty_param
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;

-- Function 6: select_cooldown_by_muscle_groups
CREATE OR REPLACE FUNCTION select_cooldown_by_muscle_groups(
  muscle_groups_param TEXT[],
  intensity_param VARCHAR DEFAULT 'moderate'
)
RETURNS TABLE (
  id UUID,
  sequence_name VARCHAR,
  intensity_level VARCHAR,
  narrative TEXT,
  stretches JSONB,
  duration_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.sequence_name,
    cs.intensity_level,
    cs.narrative,
    cs.stretches,
    cs.duration_seconds
  FROM public.cooldown_sequences cs
  WHERE cs.intensity_level = intensity_param
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;

-- =============================================================================
-- PART 3: VALIDATION FUNCTIONS
-- =============================================================================

-- Function 7: validate_required_elements
CREATE OR REPLACE FUNCTION validate_required_elements(class_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check that all required sections exist
  IF NOT (
    class_data ? 'preparation' AND
    class_data ? 'warmup' AND
    class_data ? 'movements' AND
    class_data ? 'cooldown' AND
    class_data ? 'meditation'
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function 8: check_pregnancy_exclusion
CREATE OR REPLACE FUNCTION check_pregnancy_exclusion(
  user_id_param UUID,
  movement_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_pregnant BOOLEAN;
  has_exclusion BOOLEAN;
BEGIN
  -- Check if user is pregnant
  SELECT pregnancy_status INTO is_pregnant
  FROM public.user_profiles
  WHERE user_id = user_id_param;

  IF NOT is_pregnant THEN
    RETURN FALSE; -- Not pregnant, no exclusion needed
  END IF;

  -- Check if movement has pregnancy exclusion
  SELECT pregnancy_exclusion INTO has_exclusion
  FROM public.movements
  WHERE id = movement_id_param;

  RETURN COALESCE(has_exclusion, FALSE);
END;
$$;

-- Function 9: log_pregnancy_detection
CREATE OR REPLACE FUNCTION log_pregnancy_detection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log when pregnancy status changes to true
  IF NEW.pregnancy_status = TRUE AND (OLD.pregnancy_status IS NULL OR OLD.pregnancy_status = FALSE) THEN
    INSERT INTO public.medical_exclusions_log (user_id, exclusion_type, detected_at)
    VALUES (NEW.user_id, 'pregnancy', NOW());
  END IF;

  RETURN NEW;
END;
$$;

-- Function 10: check_consecutive_muscle_overuse
CREATE OR REPLACE FUNCTION check_consecutive_muscle_overuse(
  user_id_param UUID,
  muscle_group_param VARCHAR,
  lookback_days INTEGER DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  overuse_count INTEGER;
BEGIN
  -- Count how many times this muscle group was targeted in recent classes
  SELECT COUNT(*)
  INTO overuse_count
  FROM public.class_plans cp
  WHERE cp.user_id = user_id_param
    AND cp.created_at > NOW() - (lookback_days || ' days')::INTERVAL
    AND cp.muscle_balance @> jsonb_build_object(muscle_group_param, 'high');

  -- Return true if muscle group used more than 2 times in lookback period
  RETURN overuse_count > 2;
END;
$$;

-- =============================================================================
-- PART 4: USER HISTORY FUNCTIONS
-- =============================================================================

-- Function 11: get_user_movement_history
CREATE OR REPLACE FUNCTION get_user_movement_history(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  movement_id UUID,
  movement_name VARCHAR,
  last_performed TIMESTAMP,
  times_performed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    MAX(cp.created_at) as last_performed,
    COUNT(*)::INTEGER as times_performed
  FROM public.class_plans cp
  CROSS JOIN LATERAL jsonb_array_elements(cp.movements) AS movement_data
  JOIN public.movements m ON m.id = (movement_data->>'movement_id')::UUID
  WHERE cp.user_id = user_id_param
  GROUP BY m.id, m.name
  ORDER BY last_performed DESC
  LIMIT limit_param;
END;
$$;

-- Function 12: calculate_movement_novelty_score
CREATE OR REPLACE FUNCTION calculate_movement_novelty_score(
  user_id_param UUID,
  movement_id_param UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  times_performed INTEGER;
  days_since_last INTEGER;
  novelty_score INTEGER;
BEGIN
  -- Count how many times user has performed this movement
  SELECT COUNT(*)
  INTO times_performed
  FROM public.class_plans cp
  CROSS JOIN LATERAL jsonb_array_elements(cp.movements) AS movement_data
  WHERE cp.user_id = user_id_param
    AND (movement_data->>'movement_id')::UUID = movement_id_param;

  IF times_performed = 0 THEN
    RETURN 100; -- Brand new movement, highest novelty
  END IF;

  -- Calculate days since last performance
  SELECT EXTRACT(DAY FROM NOW() - MAX(cp.created_at))::INTEGER
  INTO days_since_last
  FROM public.class_plans cp
  CROSS JOIN LATERAL jsonb_array_elements(cp.movements) AS movement_data
  WHERE cp.user_id = user_id_param
    AND (movement_data->>'movement_id')::UUID = movement_id_param;

  -- Calculate novelty score (0-100)
  novelty_score := LEAST(100, (days_since_last * 2) - (times_performed * 5));

  RETURN GREATEST(0, novelty_score);
END;
$$;

-- =============================================================================
-- PART 5: UTILITY FUNCTIONS
-- =============================================================================

-- Function 13: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 14: update_beta_feedback_updated_at
CREATE OR REPLACE FUNCTION update_beta_feedback_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- STEP 3: RECREATE TRIGGERS (Dropped by CASCADE in Step 1)
-- =============================================================================
-- These triggers were automatically dropped when we used CASCADE above
-- We must recreate them now that the functions have been recreated

-- Trigger for music_tracks table
CREATE TRIGGER music_tracks_updated_at
    BEFORE UPDATE ON music_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_music_tracks_updated_at();

-- Trigger for music_playlists table
CREATE TRIGGER music_playlists_updated_at
    BEFORE UPDATE ON music_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_music_playlists_updated_at();

-- Trigger for student_profiles table (pregnancy detection)
CREATE TRIGGER trigger_log_pregnancy_detection
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_pregnancy_detection();

-- Trigger for beta_feedback table
CREATE TRIGGER update_beta_feedback_updated_at_trigger
    BEFORE UPDATE ON beta_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_feedback_updated_at();

-- Triggers using update_updated_at_column() function
-- (These were dropped by CASCADE and must be recreated)

CREATE TRIGGER update_movements_updated_at
    BEFORE UPDATE ON movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_plans_updated_at
    BEFORE UPDATE ON class_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movement_usage_updated_at
    BEFORE UPDATE ON movement_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- =============================================================================

-- Verify all 14 functions have search_path set:
-- SELECT
--   proname as function_name,
--   prosecdef as is_security_definer,
--   proconfig as search_path_config
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND proname IN (
--     'calculate_movement_novelty_score',
--     'calculate_playlist_duration',
--     'update_music_tracks_updated_at',
--     'update_music_playlists_updated_at',
--     'check_pregnancy_exclusion',
--     'log_pregnancy_detection',
--     'update_beta_feedback_updated_at',
--     'get_playlist_with_tracks',
--     'validate_required_elements',
--     'select_warmup_by_muscle_groups',
--     'select_cooldown_by_muscle_groups',
--     'update_updated_at_column',
--     'get_user_movement_history',
--     'check_consecutive_muscle_overuse'
--   );
-- Expected: is_security_definer = true, search_path_config = {search_path=''} for all

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- Note: Function #15 from the security report is not included because the CSV
-- was truncated at line 16. Please run the Supabase linter again to identify
-- the 15th function and add it to this migration if needed.
--
-- All functions now use:
-- - SECURITY DEFINER: Function runs with creator's privileges
-- - SET search_path = '': Empty search path prevents schema hijacking
-- - Fully qualified names: All table references use schema.table format
