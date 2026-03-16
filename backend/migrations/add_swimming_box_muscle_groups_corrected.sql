-- ============================================================================
-- Add muscle groups for Swimming Box movement (CORRECTED)
-- Date: March 16, 2026
-- Uses only established muscle group names from the database
-- ============================================================================

-- Movement ID: 4b13e7b5-d008-4341-aa08-5a0d17042f86 (Swimming - Box)

-- IMPORTANT: Using only established muscle group names that already exist
-- in the movement_muscles table to maintain data consistency

INSERT INTO movement_muscles (movement_id, muscle_group_name) VALUES
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Posterior chain strength (glutes & spinal extensors)'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Core strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Hip mobility and/ or strengthening'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Glute strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Hamstring strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Scapular Stability'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Shoulder mobility'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Coordination'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Thoracic mobility &/ or strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Pelvic Stability');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- After running the inserts, verify with:
/*
SELECT
    m.name as movement_name,
    mm.muscle_group_name
FROM movements m
JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE m.id = '4b13e7b5-d008-4341-aa08-5a0d17042f86'
ORDER BY mm.muscle_group_name;
*/

-- Expected result: 10 muscle groups for Swimming - Box

-- ============================================================================
-- COMPARISON WITH SWIMMING PRONE
-- ============================================================================
/*
-- Compare with Swimming - Prone to ensure consistency:
SELECT
    m.name,
    mm.muscle_group_name
FROM movements m
JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE LOWER(m.name) LIKE '%swimming%'
ORDER BY m.name, mm.muscle_group_name;
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
/*
DELETE FROM movement_muscles
WHERE movement_id = '4b13e7b5-d008-4341-aa08-5a0d17042f86';
*/

-- ============================================================================
-- ESTABLISHED MUSCLE GROUPS USED
-- ============================================================================
-- All muscle group names in this migration are from the established list:
-- 1. Posterior chain strength (glutes & spinal extensors) - for back extension
-- 2. Core strength
-- 3. Hip mobility and/ or strengthening
-- 4. Glute strength
-- 5. Hamstring strength
-- 6. Scapular Stability
-- 7. Shoulder mobility
-- 8. Coordination
-- 9. Thoracic mobility &/ or strength
-- 10. Pelvic Stability