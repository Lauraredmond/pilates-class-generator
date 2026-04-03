-- Migration 018: Remove unused columns from preparation_scripts
-- Date: December 8, 2025
-- Purpose: Clean up irrelevant fields (breathing_pattern, breathing_focus, difficulty_level)

-- ============================================================================
-- Step 1: Drop the columns
-- ============================================================================

ALTER TABLE preparation_scripts
  DROP COLUMN IF EXISTS breathing_pattern,
  DROP COLUMN IF EXISTS breathing_focus,
  DROP COLUMN IF EXISTS difficulty_level;

-- ============================================================================
-- Step 2: Drop the difficulty index (no longer needed)
-- ============================================================================

DROP INDEX IF EXISTS idx_preparation_scripts_difficulty;

-- ============================================================================
-- Step 3: Verify the changes
-- ============================================================================

-- Show remaining columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'preparation_scripts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- Expected Remaining Columns:
-- ============================================================================
-- id                    | uuid                     | NO
-- script_name           | character varying        | NO
-- script_type           | character varying        | NO
-- narrative             | text                     | NO
-- key_principles        | ARRAY                    | YES
-- duration_seconds      | integer                  | NO
-- created_at            | timestamp with time zone | YES
-- updated_at            | timestamp with time zone | YES
-- voiceover_url         | text                     | YES
-- voiceover_duration    | integer                  | YES
-- voiceover_enabled     | boolean                  | YES
