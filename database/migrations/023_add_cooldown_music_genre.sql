-- Migration 023: Add cooldown music genre tracking
-- December 22, 2025
--
-- ISSUE: music_genre field only captures movement music, not cooldown music
-- Classes use TWO different music styles:
--   - Movement music (sections 1-3: preparation, warmup, movements)
--   - Cooldown music (sections 4-6: cooldown, meditation, homecare)
--
-- SOLUTION: Add separate cooldown_music_genre column

-- Add cooldown_music_genre column to class_history table
ALTER TABLE class_history
ADD COLUMN IF NOT EXISTS cooldown_music_genre VARCHAR(100);

-- Add comment explaining the field
COMMENT ON COLUMN class_history.cooldown_music_genre IS 'Musical stylistic period used for cooldown sections (cooldown, meditation, homecare): Baroque, Classical, Romantic, Impressionist, Modern, Contemporary/Postmodern, Celtic Traditional, Jazz';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_class_history_cooldown_music_genre ON class_history(cooldown_music_genre);

-- Update the comment on music_genre to clarify it's for movement sections
COMMENT ON COLUMN class_history.music_genre IS 'Musical stylistic period used for movement sections (preparation, warmup, movements): Baroque, Classical, Romantic, Impressionist, Modern, Contemporary/Postmodern, Celtic Traditional, Jazz';
