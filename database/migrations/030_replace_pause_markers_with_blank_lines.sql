-- Migration 030: Replace [Pause: 20s] markers with blank lines
-- Date: December 12, 2025
-- Purpose: Create natural pauses using whitespace instead of JavaScript detection

UPDATE warmup_routines
SET narrative = REPLACE(
  REPLACE(
    REPLACE(narrative, '[Pause: 20s]', E'\n\n\n\n\n\n'),  -- 6 blank lines ≈ 20 seconds
    '[Pause here while student repeats motion]', E'\n\n\n\n\n\n'  -- Same duration
  ),
  E'\n\n\n\n',  -- Reduce excessive existing whitespace
  E'\n\n'  -- To just 2 blank lines
),
updated_at = NOW()
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- Verify no pause markers remain
SELECT
  routine_name,
  CASE
    WHEN narrative LIKE '%[Pause%' THEN 'Still has [Pause markers - PROBLEM'
    ELSE 'All pause markers replaced with blank lines - OK'
  END AS status,
  LENGTH(narrative) AS narrative_length
FROM warmup_routines
WHERE routine_name = 'Comprehensive Full Body Warm-up';
