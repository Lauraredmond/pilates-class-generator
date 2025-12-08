-- Migration 016: Add voiceover columns to all class section tables
-- Date: December 8, 2025
-- Purpose: Enable voiceover playback for preparation, warmup, cooldown, meditation, and homecare sections

-- ============================================================================
-- 1. preparation_scripts
-- ============================================================================
ALTER TABLE preparation_scripts
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN preparation_scripts.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN preparation_scripts.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';
COMMENT ON COLUMN preparation_scripts.voiceover_enabled IS 'Whether to play voiceover during class playback';

-- ============================================================================
-- 2. warmup_routines
-- ============================================================================
ALTER TABLE warmup_routines
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN warmup_routines.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN warmup_routines.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';
COMMENT ON COLUMN warmup_routines.voiceover_enabled IS 'Whether to play voiceover during class playback';

-- ============================================================================
-- 3. cooldown_sequences
-- ============================================================================
ALTER TABLE cooldown_sequences
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN cooldown_sequences.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN cooldown_sequences.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';
COMMENT ON COLUMN cooldown_sequences.voiceover_enabled IS 'Whether to play voiceover during class playback';

-- ============================================================================
-- 4. closing_meditation_scripts
-- ============================================================================
ALTER TABLE closing_meditation_scripts
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN closing_meditation_scripts.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN closing_meditation_scripts.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';
COMMENT ON COLUMN closing_meditation_scripts.voiceover_enabled IS 'Whether to play voiceover during class playback';

-- ============================================================================
-- 5. closing_homecare_advice
-- ============================================================================
ALTER TABLE closing_homecare_advice
  ADD COLUMN voiceover_url TEXT,
  ADD COLUMN voiceover_duration INTEGER,
  ADD COLUMN voiceover_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN closing_homecare_advice.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';
COMMENT ON COLUMN closing_homecare_advice.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';
COMMENT ON COLUMN closing_homecare_advice.voiceover_enabled IS 'Whether to play voiceover during class playback';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check all tables have the new columns
DO $$
DECLARE
  tbl_name TEXT;
  missing_columns TEXT[];
BEGIN
  FOR tbl_name IN
    SELECT unnest(ARRAY[
      'preparation_scripts',
      'warmup_routines',
      'cooldown_sequences',
      'closing_meditation_scripts',
      'closing_homecare_advice'
    ])
  LOOP
    -- Check for voiceover columns
    SELECT array_agg(col)
    INTO missing_columns
    FROM unnest(ARRAY['voiceover_url', 'voiceover_duration', 'voiceover_enabled']) AS col
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND information_schema.columns.table_name = tbl_name
        AND column_name = col
    );

    IF array_length(missing_columns, 1) > 0 THEN
      RAISE EXCEPTION 'Table % is missing columns: %', tbl_name, missing_columns;
    ELSE
      RAISE NOTICE 'Table % - voiceover columns added successfully ✓', tbl_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'Migration 016 completed successfully!';
END $$;
