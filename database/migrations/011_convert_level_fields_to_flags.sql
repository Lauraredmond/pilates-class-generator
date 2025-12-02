-- ============================================================================
-- MIGRATION 011: Convert Level Description Fields to Y/N Flags
-- ============================================================================
-- Date: December 2, 2025
-- Purpose: Repurpose level description fields as existence flags
-- Context: All level narratives now stored in main narrative field
--          These fields now indicate which levels exist (Y/N)
-- ============================================================================

-- Step 1: Add level_3_description column (missing from original schema)
ALTER TABLE movements
ADD COLUMN IF NOT EXISTS level_3_description VARCHAR(1) DEFAULT 'N';

-- Step 2: Convert existing level fields from TEXT to VARCHAR(1)
-- (PostgreSQL requires creating new columns, copying data, dropping old, renaming)

-- For level_1_description
ALTER TABLE movements ADD COLUMN level_1_flag VARCHAR(1) DEFAULT 'N';
ALTER TABLE movements DROP COLUMN IF EXISTS level_1_description;
ALTER TABLE movements RENAME COLUMN level_1_flag TO level_1_description;

-- For level_2_description
ALTER TABLE movements ADD COLUMN level_2_flag VARCHAR(1) DEFAULT 'N';
ALTER TABLE movements DROP COLUMN IF EXISTS level_2_description;
ALTER TABLE movements RENAME COLUMN level_2_flag TO level_2_description;

-- For full_version_description
ALTER TABLE movements ADD COLUMN full_version_flag VARCHAR(1) DEFAULT 'N';
ALTER TABLE movements DROP COLUMN IF EXISTS full_version_description;
ALTER TABLE movements RENAME COLUMN full_version_flag TO full_version_description;

-- Step 3: Add constraints to ensure only 'Y' or 'N' values
ALTER TABLE movements ADD CONSTRAINT level_1_description_check CHECK (level_1_description IN ('Y', 'N'));
ALTER TABLE movements ADD CONSTRAINT level_2_description_check CHECK (level_2_description IN ('Y', 'N'));
ALTER TABLE movements ADD CONSTRAINT level_3_description_check CHECK (level_3_description IN ('Y', 'N'));
ALTER TABLE movements ADD CONSTRAINT full_version_description_check CHECK (full_version_description IN ('Y', 'N'));

-- Step 4: Update comments to reflect new purpose
COMMENT ON COLUMN movements.level_1_description IS 'Flag: Does this movement have Level 1? (Y/N)';
COMMENT ON COLUMN movements.level_2_description IS 'Flag: Does this movement have Level 2? (Y/N)';
COMMENT ON COLUMN movements.level_3_description IS 'Flag: Does this movement have Level 3? (Y/N)';
COMMENT ON COLUMN movements.full_version_description IS 'Flag: Does this movement have Full Version? (Y/N)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 011 Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes:';
    RAISE NOTICE '  • Added level_3_description column';
    RAISE NOTICE '  • Converted level_1_description from TEXT to VARCHAR(1)';
    RAISE NOTICE '  • Converted level_2_description from TEXT to VARCHAR(1)';
    RAISE NOTICE '  • Converted level_3_description to VARCHAR(1)';
    RAISE NOTICE '  • Converted full_version_description from TEXT to VARCHAR(1)';
    RAISE NOTICE '  • All fields now hold Y or N flags';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run update_movement_level_flags.sql to populate Y/N values';
END $$;
