-- Migration 026: Fix Duplicate Insecure Function Versions
-- Date: December 10, 2025
-- Purpose: Remove OLD insecure versions of 4 functions that still exist alongside secure versions
--
-- Problem: Migration 024 created secure versions of functions, but old insecure versions
--          with different signatures still exist. Linter detects both versions.
--
-- Root Cause: PostgreSQL function overloading allows multiple functions with same name
--             but different parameter types. We only dropped specific signatures in 024.
--
-- Solution: Drop ALL versions of these 4 functions (all signatures), then recreate
--           only the correct secure versions.

-- =============================================================================
-- STEP 1: Drop ALL versions of the 4 flagged functions
-- =============================================================================
-- Using DO block to drop all overloaded versions regardless of signature

DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Drop all versions of calculate_movement_novelty_score
  FOR func_record IN
    SELECT proname, oidvectortypes(proargtypes) as argtypes
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'calculate_movement_novelty_score'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      func_record.proname, func_record.argtypes);
  END LOOP;

  -- Drop all versions of check_consecutive_muscle_overuse
  FOR func_record IN
    SELECT proname, oidvectortypes(proargtypes) as argtypes
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'check_consecutive_muscle_overuse'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      func_record.proname, func_record.argtypes);
  END LOOP;

  -- Drop all versions of get_user_movement_history
  FOR func_record IN
    SELECT proname, oidvectortypes(proargtypes) as argtypes
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'get_user_movement_history'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      func_record.proname, func_record.argtypes);
  END LOOP;

  -- Drop all versions of validate_required_elements
  FOR func_record IN
    SELECT proname, oidvectortypes(proargtypes) as argtypes
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'validate_required_elements'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      func_record.proname, func_record.argtypes);
  END LOOP;
END $$;

-- =============================================================================
-- STEP 2: Recreate ONLY the secure versions
-- =============================================================================

-- Function 1: calculate_movement_novelty_score
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

-- Function 2: check_consecutive_muscle_overuse
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

-- Function 3: get_user_movement_history
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

-- Function 4: validate_required_elements
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

-- =============================================================================
-- VERIFICATION QUERY (Run after migration to verify)
-- =============================================================================

-- Verify only ONE version of each function exists with security fixes:
-- SELECT
--   proname as function_name,
--   oidvectortypes(proargtypes) as parameter_types,
--   prosecdef as is_security_definer,
--   proconfig as search_path_config
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND proname IN (
--     'calculate_movement_novelty_score',
--     'check_consecutive_muscle_overuse',
--     'get_user_movement_history',
--     'validate_required_elements'
--   )
-- ORDER BY proname;
--
-- Expected: 4 rows total (one per function), all with is_security_definer=true

-- =============================================================================
-- SUCCESS CRITERIA
-- =============================================================================
--
-- After running this migration:
-- 1. Each function should appear only ONCE in pg_proc
-- 2. All 4 functions have is_security_definer = true
-- 3. All 4 functions have search_path_config = {"search_path=\"\""}
-- 4. Supabase linter should show 0 warnings for these 4 functions
-- 5. Only remaining warning should be "Leaked Password Protection" (free tier limitation)
