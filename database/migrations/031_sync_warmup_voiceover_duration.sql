-- Migration 031: Sync warmup voiceover duration with 6:40 minute recording + 20s pause
-- Date: December 12, 2025
-- Purpose: Set voiceover_duration to match actual audio file length, add 20s pause after

UPDATE warmup_routines
SET
  duration_seconds = 420,        -- 7:00 minutes (400s voiceover + 20s pause)
  voiceover_duration = 400,      -- 6:40 minutes (actual voiceover audio length)
  voiceover_enabled = true,      -- Enable voiceover playback
  updated_at = NOW()
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- Verify the update
SELECT
  routine_name,
  duration_seconds,
  duration_seconds / 60.0 AS duration_minutes,
  voiceover_duration,
  voiceover_duration / 60.0 AS voiceover_minutes,
  (duration_seconds - voiceover_duration) AS pause_after_seconds,
  voiceover_enabled,
  voiceover_duration / 60.0 AS scroll_time_minutes
FROM warmup_routines
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- Expected output:
-- duration_seconds: 420 (7:00 total)
-- duration_minutes: 7.0
-- voiceover_duration: 400 (6:40 voiceover)
-- voiceover_minutes: 6.67
-- pause_after_seconds: 20 (silent pause after voiceover)
-- voiceover_enabled: true
-- scroll_time_minutes: 6.67 (scroll syncs with voiceover, no slowdown)
