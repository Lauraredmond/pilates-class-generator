-- Migration 025: Split Swimming into Swimming - Prone and Swimming - Box
-- Created: 2025-12-13
-- Purpose: Break Swimming into two separate sub-movements for better class variety

-- ============================================================================
-- STEP 1: Rename existing Swimming to Swimming - Prone
-- ============================================================================

UPDATE movements
SET name = 'Swimming - Prone'
WHERE name = 'Swimming';

-- ============================================================================
-- STEP 2: Insert new Swimming - Box movement
-- ============================================================================

-- First, get the ID of Swimming - Prone for reference
DO $$
DECLARE
    swimming_prone_id UUID;
    new_swimming_box_id UUID;
BEGIN
    -- Get Swimming - Prone ID
    SELECT id INTO swimming_prone_id
    FROM movements
    WHERE name = 'Swimming - Prone';

    -- Insert Swimming - Box with same attributes as Swimming - Prone
    -- Note: Only using columns that exist in current schema
    -- Level fields (level_1_description, etc.) are Y/N flags now, copied from Swimming - Prone
    -- movement_number set to 35 (next sequential number after 34 existing movements)
    -- code set to 'swimming_box' (URL-friendly identifier)
    INSERT INTO movements (
        movement_number,            -- Required: NOT NULL constraint
        code,                       -- Required: UNIQUE constraint
        name,
        category,
        difficulty_level,
        setup_position,
        duration_seconds,
        equipment_required,
        narrative,
        visual_cues,
        watch_out_points,
        level_1_description,        -- Y/N flag
        level_2_description,        -- Y/N flag
        level_3_description,        -- Y/N flag
        full_version_description,   -- Y/N flag
        breathing_pattern,
        voiceover_url,
        voiceover_duration_seconds,
        voiceover_enabled
    )
    SELECT
        35 as movement_number,                  -- Next sequential number (Swimming is 24, highest is 34)
        'swimming_box' as code,                 -- URL-friendly identifier
        'Swimming - Box' as name,
        category,
        difficulty_level,
        setup_position,
        duration_seconds,
        equipment_required,
        narrative,
        visual_cues,
        watch_out_points,
        level_1_description,        -- Copy Y/N flag
        level_2_description,        -- Copy Y/N flag
        level_3_description,        -- Copy Y/N flag
        full_version_description,   -- Copy Y/N flag
        breathing_pattern,
        NULL as voiceover_url,                  -- Different movement = different voiceover
        NULL as voiceover_duration_seconds,     -- Different movement = different voiceover
        false as voiceover_enabled              -- Will enable after uploading voiceover
    FROM movements
    WHERE name = 'Swimming - Prone'
    RETURNING id INTO new_swimming_box_id;

    -- ============================================================================
    -- STEP 3: Copy muscle mappings from Swimming - Prone to Swimming - Box
    -- ============================================================================

    -- Check if movement_muscles table exists and has data before copying
    -- This handles cases where muscle mapping may not be set up yet
    BEGIN
        -- Try to copy muscle mappings (will fail silently if table structure doesn't match)
        INSERT INTO movement_muscles (movement_id, muscle_group_id, is_primary)
        SELECT
            new_swimming_box_id,
            muscle_group_id,
            is_primary
        FROM movement_muscles
        WHERE movement_id = swimming_prone_id;

        RAISE NOTICE '✅ Muscle mappings copied successfully';
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE '⚠️  Muscle mappings NOT copied - movement_muscles table structure differs';
            RAISE NOTICE '    You can add muscle mappings manually later if needed';
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️  Muscle mappings NOT copied - movement_muscles table does not exist';
            RAISE NOTICE '    You can add muscle mappings manually later if needed';
    END;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Successfully split Swimming into Swimming - Prone (%) and Swimming - Box (%)',
        swimming_prone_id, new_swimming_box_id;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================================

-- Check both movements exist
-- SELECT name, difficulty_level, setup_position FROM movements WHERE name LIKE 'Swimming%' ORDER BY name;

-- Check muscle mappings copied correctly
-- SELECT m.name, mg.name as muscle_group, mm.is_primary
-- FROM movements m
-- JOIN movement_muscles mm ON m.id = mm.movement_id
-- JOIN muscle_groups mg ON mm.muscle_group_id = mg.id
-- WHERE m.name LIKE 'Swimming%'
-- ORDER BY m.name, mg.name;

-- ============================================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================================

-- To undo this migration:
-- DELETE FROM movements WHERE name = 'Swimming - Box';
-- UPDATE movements SET name = 'Swimming' WHERE name = 'Swimming - Prone';
