-- Missing transitions from transitions table
-- Add these 5 transitions to complete the transition coverage

INSERT INTO transitions (
  id,
  from_position,
  to_position,
  narrative,
  duration_seconds,
  voiceover_url,
  voiceover_duration,
  created_at
) VALUES
  -- 1. Kneeling to Side-lying
  (
    gen_random_uuid(),
    'Kneeling',
    'Side-lying',
    'Reach down to support your weight one one side, lower down with control, lying on the shoulders and hips.',
    15,
    NULL,
    NULL,
    NOW()
  ),

  -- 2. Prone to Side-lying
  (
    gen_random_uuid(),
    'Prone',
    'Side-lying',
    'Roll onto your side with control, lengthening through the body and stacking the shoulders and hips for side work.',
    12,
    NULL,
    NULL,
    NOW()
  ),

  -- 3. Seated to Side-lying
  (
    gen_random_uuid(),
    'Seated',
    'Side-lying',
    'Lie down onto one hip with control, bringing the body onto your side and stacking shoulders and hips.',
    12,
    NULL,
    NULL,
    NOW()
  ),

  -- 4. Side-lying to Prone
  (
    gen_random_uuid(),
    'Side-lying',
    'Prone',
    'Roll onto your front with control, lengthening through the body as you come all the way onto your stomach.',
    12,
    NULL,
    NULL,
    NOW()
  ),

  -- 5. Side-lying to Kneeling
  (
    gen_random_uuid(),
    'Side-lying',
    'Kneeling',
    'Roll onto your front with control, lengthening through the body as you come all the way onto your stomach. Press into your hands, draw the legs underneath you, and come up through all-fours into a stable kneeling position.',
    20,
    NULL,
    NULL,
    NOW()
  );

-- Verify the inserts
SELECT from_position, to_position, duration_seconds, narrative
FROM transitions
WHERE from_position IN ('Kneeling', 'Prone', 'Seated', 'Side-lying')
  AND to_position IN ('Side-lying', 'Prone', 'Kneeling')
ORDER BY from_position, to_position;
