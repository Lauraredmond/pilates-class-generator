-- ============================================================================
-- Migration 035: Add Standing Position Transitions
-- ============================================================================
-- Purpose: Add missing transitions to/from Standing position
-- Created: December 24, 2025
-- ============================================================================

BEGIN;

-- Insert Standing transitions (11 new transitions)
-- Note: Using ON CONFLICT DO UPDATE in case some already exist

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Standing to Standing (reset/preparation)
    ('Standing', 'Standing', 'Reset your stance, stack the spine tall over the hips, and prepare for the next movement with your shoulders relaxed.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Standing to Supine (standing to lying on back)
    ('Standing', 'Supine', 'Bend your knees with control, lower yourself down through a seated position, then roll down onto your back vertebra by vertebra.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Standing to Side-lying
    ('Standing', 'Side-lying', 'Lower yourself down with control, coming through a seated position, then carefully roll onto your side, stacking shoulders and hips.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Standing to Seated
    ('Standing', 'Seated', 'Lower down with control, bringing yourself smoothly into a tall seated position with the spine stacked and shoulders relaxed.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Standing to Prone (standing to lying on stomach)
    ('Standing', 'Prone', 'Fold forward with control, lower yourself down through the hands and knees, then extend fully onto your front with the spine long.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Standing to Kneeling
    ('Standing', 'Kneeling', 'Lower one knee at a time to the mat with control, stack the spine tall over the hips, and settle into a stable kneeling position.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Supine to Standing (lying on back to standing)
    ('Supine', 'Standing', 'Roll onto your side, press up through your hands, come through kneeling or seated, and carefully rise to standing with control.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Side-lying to Standing
    ('Side-lying', 'Standing', 'Roll onto your back or front with control, press up through the hands, come through seated or kneeling, and rise to standing.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Seated to Standing
    ('Seated', 'Standing', 'Shift your weight forward, bring your feet underneath you, and press through the legs to rise smoothly to standing with the spine tall.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Prone to Standing (lying on stomach to standing)
    ('Prone', 'Standing', 'Press up through your hands, come through kneeling, and carefully rise to standing one leg at a time with control and stability.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

INSERT INTO transitions (from_position, to_position, narrative) VALUES
    -- Kneeling to Standing
    ('Kneeling', 'Standing', 'Step one foot forward, press through the legs, and rise to standing with control, stacking the spine tall and shoulders relaxed.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Verify insertions
SELECT
    from_position,
    to_position,
    LEFT(narrative, 60) || '...' as narrative_preview
FROM transitions
WHERE from_position = 'Standing' OR to_position = 'Standing'
ORDER BY from_position, to_position;

COMMIT;

-- ============================================================================
-- Rollback script (save separately if needed)
-- ============================================================================
/*
BEGIN;

DELETE FROM transitions WHERE from_position = 'Standing' OR to_position = 'Standing';

COMMIT;
*/
