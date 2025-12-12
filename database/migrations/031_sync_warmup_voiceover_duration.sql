-- Migration 031: Sync warmup voiceover duration with 6:40 minute recording
-- Date: December 12, 2025
-- Purpose: Set voiceover_duration to match actual audio file length

UPDATE warmup_routines
SET
  duration_seconds = 440,        -- 7.33 minutes (section duration in class timeline)
  voiceover_duration = 400,      -- 6.67 minutes (actual voiceover audio length)
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
  voiceover_enabled,
  (voiceover_duration * 1.190) / 60.0 AS actual_scroll_minutes
FROM warmup_routines
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- Expected output:
-- duration_seconds: 440
-- duration_minutes: 7.33
-- voiceover_duration: 400
-- voiceover_minutes: 6.67
-- voiceover_enabled: true
-- actual_scroll_minutes: 7.93 (19% slower for readability)
