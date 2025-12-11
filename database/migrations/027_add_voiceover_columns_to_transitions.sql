-- Migration 027: Add Voiceover Columns to Transitions Table
-- Created: 2025-12-11
-- Purpose: Enable voiceover support for transition narratives
-- Session: Voiceover Implementation for Transitions

-- Add voiceover columns to transitions table
ALTER TABLE transitions
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN transitions.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN transitions.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync and music ducking)';
COMMENT ON COLUMN transitions.voiceover_enabled IS 'Whether to play voiceover during this transition (default: false)';

-- Note: This migration follows the same pattern as:
-- - 016_add_voiceover_columns_to_class_sections.sql (preparation, warmup, cooldown, meditation, homecare)
-- - Movement voiceovers (already in movements table)
--
-- Transitions are short (typically 60 seconds) but voiceover can enhance:
-- - Position cue clarity ("Roll onto your side with control...")
-- - Safety reminders during transitions
-- - Breathing guidance between movements

-- Verification query (run after migration):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'transitions'
-- AND column_name LIKE 'voiceover%'
-- ORDER BY ordinal_position;
