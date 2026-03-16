-- ============================================================================
-- Add muscle groups for Swimming Box movement
-- Date: March 16, 2026
-- ============================================================================

-- Movement ID: 4b13e7b5-d008-4341-aa08-5a0d17042f86 (Swimming - Box)

-- Based on research, Swimming Box targets:
-- 1. Back extensors (erector spinae, multifidus)
-- 2. Glutes for hip extension and stability
-- 3. Hamstrings for hip extension
-- 4. Core stabilizers for trunk control
-- 5. Posterior deltoids (shoulders)
-- 6. Scapular stabilizers
-- 7. Coordination through cross-pattern movement

-- Insert muscle groups for Swimming Box
INSERT INTO movement_muscles (movement_id, muscle_group_name) VALUES
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Back extension'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Core strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Hip mobility and/ or strengthening'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Glute strengthening'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Hamstring strengthening'),
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
-- ROLLBACK (if needed)
-- ============================================================================
/*
DELETE FROM movement_muscles
WHERE movement_id = '4b13e7b5-d008-4341-aa08-5a0d17042f86';
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- Swimming Box is a prone back extension exercise similar to Swimming Prone
-- but with a more structured "box" pattern of movement.
--
-- The exercise targets the entire posterior chain with emphasis on:
-- - Spinal extensors for back strengthGlutes and hamstrings for hip extension
-- - Core stability for trunk control
-- - Shoulder and scapular muscles for upper body control
-- - Cross-pattern coordination (opposite arm/leg movement)
--
-- This is consistent with Swimming Prone but adds specific emphasis on
-- glute and hamstring strengthening due to the controlled box pattern.