-- Migration 020: Add music genre tracking to class_history
-- Purpose: Enable analytics for music genre and class duration distribution

-- Add music_genre column to class_history table
ALTER TABLE class_history
ADD COLUMN IF NOT EXISTS music_genre VARCHAR(100);

-- Add comment explaining the field
COMMENT ON COLUMN class_history.music_genre IS 'Musical stylistic period selected for class: Baroque, Classical, Romantic, Impressionist, Modern, Contemporary/Postmodern, Celtic Traditional, Jazz';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_class_history_music_genre ON class_history(music_genre);
