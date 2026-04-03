-- Migration 029: Fix incorrect pause marker format
-- Date: December 12, 2025
-- Purpose: Change "[Pause here while student repeats motion]" to "[Pause: 20s]"

UPDATE warmup_routines
SET narrative = REPLACE(
  narrative,
  '[Pause here while student repeats motion]',
  '[Pause: 20s]'
),
updated_at = NOW()
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- Verify all pause markers are now in correct format
SELECT
  routine_name,
  (LENGTH(narrative) - LENGTH(REPLACE(narrative, '[Pause: 20s]', ''))) / LENGTH('[Pause: 20s]') AS correct_pause_count,
  CASE
    WHEN narrative LIKE '%[Pause here%' THEN 'STILL HAS INCORRECT FORMAT'
    ELSE 'All pause markers correct'
  END AS validation_status
FROM warmup_routines
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- Expected: correct_pause_count should be 7 (was 6, now 7)
