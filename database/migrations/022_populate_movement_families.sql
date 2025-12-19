-- Populate movement_family values based on movement classification
-- Date: 2025-12-19
-- Source: User-provided movement family mappings

-- ROLLING: Movements where rolling/articulation through the spine is the defining feature
UPDATE movements SET movement_family = 'rolling' WHERE code IN (
    'rolling_back',
    'roll_up',
    'roll_over',
    'the_seal',
    'rocker_with_open_legs',
    'the_crab',
    'boomerang'
);

-- SUPINE_ABDOMINAL: Supine, core-led movements where abdominal control is dominant
UPDATE movements SET movement_family = 'supine_abdominal' WHERE code IN (
    'the_hundred',
    'one_leg_stretch',
    'double_leg_stretch',
    'bicycle',
    'scissors',
    'one_leg_circle',
    'neck_pull',
    'the_corkscrew',
    'teaser'
);

-- INVERSION: Pelvis lifted above shoulders or significant spinal inversion
UPDATE movements SET movement_family = 'inversion' WHERE code IN (
    'control_balance',
    'jack_knife',
    'roll_over'  -- Note: roll_over could be 'rolling' or 'inversion'; user said inversion is dominant once overhead
);

-- BACK_EXTENSION: Prone or extension-dominant spinal work
UPDATE movements SET movement_family = 'back_extension' WHERE code IN (
    'the_swan_dive',
    'swimming_prone',
    'swimming_box',
    'rocking',
    'double_leg_kick',
    'one_leg_kick'
);

-- HIP_EXTENSOR: Posterior-chain-dominant, hips driving the movement
UPDATE movements SET movement_family = 'hip_extensor' WHERE code IN (
    'shoulder_bridge',
    'leg_pull_prone',
    'leg_pull_supine'
);

-- SIDE_LYING: Side-oriented work emphasising lateral stability or hip mechanics
UPDATE movements SET movement_family = 'side_lying' WHERE code IN (
    'side_kick',
    'side_kick_kneeling',
    'side_bend'
);

-- OTHER: Rotational, seated, transitional, or mixed patterns
UPDATE movements SET movement_family = 'other' WHERE code IN (
    'push_up',
    'the_saw',
    'spine_stretch',
    'spine_twist',
    'hip_twist'
);

-- Verification: Show distribution of movement families
SELECT
    movement_family,
    COUNT(*) as movement_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM movements WHERE movement_family IS NOT NULL)), 1) as percentage,
    string_agg(name, ', ' ORDER BY name) as movements
FROM movements
WHERE movement_family IS NOT NULL
GROUP BY movement_family
ORDER BY movement_count DESC;

-- Check for any movements without a family assigned
SELECT
    code,
    name,
    difficulty_level
FROM movements
WHERE movement_family IS NULL
ORDER BY name;
