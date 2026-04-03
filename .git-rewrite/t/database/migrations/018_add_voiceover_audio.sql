-- Migration 018: Add voiceover audio support to movements table
-- Created: 2025-12-07
-- Purpose: Enable pre-recorded voiceover narration for each movement

-- Add voiceover columns to movements table
ALTER TABLE movements
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration_seconds INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN movements.voiceover_url IS 'Supabase Storage URL for pre-recorded voiceover audio (e.g., https://[project].supabase.co/storage/v1/object/public/movement-voiceovers/hundred.mp3)';
COMMENT ON COLUMN movements.voiceover_duration_seconds IS 'Duration of voiceover audio in seconds (used for music ducking timing)';
COMMENT ON COLUMN movements.voiceover_enabled IS 'Whether to play voiceover audio during this movement (default: false)';

-- Example: Update "The Hundred" with test voiceover (run after uploading to Supabase Storage)
-- UPDATE movements
-- SET
--   voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/hundred.mp3',
--   voiceover_duration_seconds = 120,
--   voiceover_enabled = true
-- WHERE name = 'The Hundred';
