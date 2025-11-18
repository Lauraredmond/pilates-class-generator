-- Add movement_pattern column and populate it
-- Run this in Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE movements ADD COLUMN IF NOT EXISTS movement_pattern VARCHAR(50);

-- Step 2: Update all movements with their patterns

-- Flexion movements (forward bending, core engagement)
UPDATE movements SET movement_pattern = 'flexion'
WHERE name IN (
    'The Hundred',
    'The Roll Up',
    'The Roll Over',
    'One leg circle',
    'Rolling back',
    'One leg stretch',
    'Double leg stretch',
    'Spine stretch',
    'Rocker with Open legs',
    'Neck pull',
    'Scissors',
    'Bicycle (& Scissors)',
    'Jack knife',
    'The Seal',
    'The Crab'
);

-- Extension movements (back bending, spinal extension)
UPDATE movements SET movement_pattern = 'extension'
WHERE name IN (
    'The Swan Dive',
    'One leg kick',
    'Double leg kick',
    'Shoulder Bridge',
    'Swimming',
    'Leg pull prone',
    'Leg pull supine',
    'Rocking',
    'Push up'
);

-- Rotation movements (twisting, spiral movements)
UPDATE movements SET movement_pattern = 'rotation'
WHERE name IN (
    'The Corkscrew',
    'The Saw',
    'Spine twist',
    'Hip twist'
);

-- Lateral movements (side bending, side work)
UPDATE movements SET movement_pattern = 'lateral'
WHERE name IN (
    'Side kick',
    'Side kick kneeling',
    'Side bend'
);

-- Balance movements (control, stability)
UPDATE movements SET movement_pattern = 'balance'
WHERE name IN (
    'Teaser',
    'Boomerang',
    'Control balance'
);

-- Verify the updates
SELECT
    movement_number,
    name,
    duration_seconds,
    movement_pattern,
    difficulty_level
FROM movements
ORDER BY movement_number;
