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
    INSERT INTO movements (
        name,
        category,
        difficulty_level,
        difficulty_rank,
        setup_position,
        duration_seconds,
        equipment_required,
        created_from_excel,
        -- Copy these fields from Swimming - Prone if you want identical base attributes:
        narrative,
        visual_cues,
        watch_out_points,
        level_1_description,
        level_2_description,
        level_3_description,
        full_version_description,
        breathing_pattern,
        voiceover_url,
        voiceover_duration_seconds
    )
    SELECT
        'Swimming - Box' as name,
        category,
        difficulty_level,
        difficulty_rank,
        setup_position,
        duration_seconds,
        equipment_required,
        false as created_from_excel, -- This is manually added, not from Excel
        narrative,
        visual_cues,
        watch_out_points,
        level_1_description,
        level_2_description,
        level_3_description,
        full_version_description,
        breathing_pattern,
        NULL as voiceover_url, -- Will need separate voiceover if different
        NULL as voiceover_duration_seconds
    FROM movements
    WHERE name = 'Swimming - Prone'
    RETURNING id INTO new_swimming_box_id;

    -- ============================================================================
    -- STEP 3: Copy muscle mappings from Swimming - Prone to Swimming - Box
    -- ============================================================================

    INSERT INTO movement_muscles (movement_id, muscle_group_id, is_primary)
    SELECT
        new_swimming_box_id,
        muscle_group_id,
        is_primary
    FROM movement_muscles
    WHERE movement_id = swimming_prone_id;

    RAISE NOTICE 'Successfully split Swimming into Swimming - Prone (%) and Swimming - Box (%)',
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
