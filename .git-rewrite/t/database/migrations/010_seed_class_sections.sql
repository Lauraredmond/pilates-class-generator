-- Migration 010: Seed Data for All 6 Class Sections
-- Session 11: Populate all 6 new tables with initial content

-- ============================================
-- PREPARATION SCRIPTS (Section 1)
-- ============================================
INSERT INTO preparation_scripts (
  script_name,
  script_type,
  narrative,
  key_principles,
  duration_seconds,
  breathing_pattern,
  breathing_focus,
  difficulty_level
) VALUES
(
  'Centering and Breath Awareness',
  'centering',
  'Welcome to your Pilates practice. Find a comfortable seated or lying position. Close your eyes and bring your awareness to your breath. Notice the natural rhythm of your inhale and exhale. Feel your ribcage expand in all directions as you breathe. This is your foundation.',
  ARRAY['Centering', 'Breath', 'Concentration'],
  240, -- 4 minutes
  'Inhale for 4 counts, exhale for 4 counts',
  'Lateral thoracic breathing - feel ribs expand sideways',
  'Beginner'
),
(
  'Pilates Principles Introduction',
  'principles',
  'As you settle into your practice, let''s review the core principles that guide every movement: Centering - finding your powerhouse, the area between your ribs and hips. Concentration - being fully present in each movement. Control - moving with precision. Precision - quality over quantity. Breath - fueling every motion. Flow - smooth, continuous movement.',
  ARRAY['Centering', 'Concentration', 'Control', 'Precision', 'Breath', 'Flow'],
  240,
  'Inhale through nose, exhale through mouth',
  'Deep lateral breathing to activate core',
  'Intermediate'
);

-- ============================================
-- WARMUP ROUTINES (Section 2)
-- ============================================
INSERT INTO warmup_routines (
  routine_name,
  focus_area,
  narrative,
  movements,
  duration_seconds,
  contraindications,
  modifications,
  difficulty_level
) VALUES
(
  'Full Body Gentle Mobilization',
  'full_body',
  'Begin lying on your mat. We''ll gently mobilize the spine, shoulders, and hips to prepare for our main work. Move slowly and mindfully, coordinating breath with movement.',
  jsonb_build_array(
    jsonb_build_object('name', 'Neck Rolls', 'duration', 30, 'description', 'Slow, controlled head circles'),
    jsonb_build_object('name', 'Shoulder Circles', 'duration', 30, 'description', 'Forward and backward arm circles'),
    jsonb_build_object('name', 'Spinal Articulation', 'duration', 60, 'description', 'Cat-Cow movements'),
    jsonb_build_object('name', 'Hip Circles', 'duration', 60, 'description', 'Gentle hip mobilization')
  ),
  180, -- 3 minutes
  ARRAY['Recent neck injury', 'Severe shoulder pain'],
  jsonb_build_object(
    'for_beginners', 'Smaller range of motion',
    'for_injuries', 'Skip any painful movements'
  ),
  'Beginner'
);

-- ============================================
-- COOLDOWN SEQUENCES (Section 4)
-- ============================================
INSERT INTO cooldown_sequences (
  sequence_name,
  intensity_level,
  narrative,
  stretches,
  duration_seconds,
  target_muscles,
  recovery_focus
) VALUES
(
  'Restorative Stretch Sequence',
  'moderate',
  'Now we transition to gentle stretching, allowing your body to integrate the work we''ve done. Move slowly, breathe deeply, and honor your body''s limits.',
  jsonb_build_array(
    jsonb_build_object('name', 'Child''s Pose', 'duration', 45, 'focus', 'Lower back and hips'),
    jsonb_build_object('name', 'Seated Forward Fold', 'duration', 45, 'focus', 'Hamstrings and spine'),
    jsonb_build_object('name', 'Supine Spinal Twist', 'duration', 60, 'focus', 'Spine and obliques'),
    jsonb_build_object('name', 'Legs Up the Wall', 'duration', 30, 'focus', 'Hip flexors and hamstrings')
  ),
  180, -- 3 minutes
  ARRAY['hamstrings', 'hip_flexors', 'spine', 'lower_back'],
  'Gentle lengthening and restoration'
);

-- ============================================
-- CLOSING MEDITATION SCRIPTS (Section 5)
-- ============================================
INSERT INTO closing_meditation_scripts (
  script_name,
  meditation_theme,
  script_text,
  breathing_guidance,
  duration_seconds,
  post_intensity
) VALUES
(
  'Body Scan Relaxation',
  'body_scan',
  'Lie comfortably on your back, arms by your sides, palms facing up. Close your eyes. Begin to scan your body from your toes to the crown of your head. Notice any areas of tension or tightness. Breathe into those areas, allowing them to soften and release. Your feet... relax. Your legs... release. Your hips... let go. Your spine... elongate. Your shoulders... drop away from your ears. Your jaw... soften. Your forehead... smooth. Feel your entire body supported by the earth beneath you. You are grounded, centered, and at peace.',
  'Natural, effortless breathing. No need to control it.',
  240, -- 4 minutes
  'moderate'
),
(
  'Gratitude and Reflection',
  'gratitude',
  'Take a moment to honor the work you''ve done today. Feel gratitude for your body and all it allows you to do. Appreciate your strength, your flexibility, your breath. As you prepare to return to your day, carry this sense of centeredness and balance with you. Know that you can return to this feeling anytime through your breath.',
  'Deep, calming breaths. Inhale peace, exhale tension.',
  240,
  'moderate'
);

-- ============================================
-- HOMECARE ADVICE (Section 6)
-- ============================================
INSERT INTO closing_homecare_advice (
  advice_name,
  focus_area,
  advice_text,
  actionable_tips,
  duration_seconds,
  related_to_class_focus
) VALUES
(
  'Daily Spinal Care',
  'spine_care',
  'Your spine is the central pillar of your body. Between Pilates sessions, support your spine health with these evidence-based practices from the American Society of Medicine and NIH guidelines.',
  ARRAY[
    'Maintain neutral spine when sitting - place a small cushion at your lower back',
    'Take standing breaks every 30 minutes if working at a desk',
    'Practice the exercises you learned today for 10 minutes each morning',
    'Stay hydrated - your spinal discs are 80% water',
    'Sleep on your side with a pillow between your knees for spinal alignment'
  ],
  60, -- 1 minute
  true
),
(
  'Core Strength Maintenance',
  'core_strength',
  'Your core is your powerhouse. Between classes, maintain the strength you''re building with these simple daily habits.',
  ARRAY[
    'Practice deep breathing 3 times daily - it activates your transverse abdominis',
    'Hold a 30-second plank while brushing your teeth',
    'Engage your core when lifting anything - think "navel to spine"',
    'Practice balance exercises - stand on one leg while cooking',
    'Review your favorite movements from today''s class - repetition builds strength'
  ],
  60,
  false
);

-- Verify data was inserted
DO $$
DECLARE
  prep_count INT;
  warmup_count INT;
  cooldown_count INT;
  meditation_count INT;
  homecare_count INT;
BEGIN
  SELECT COUNT(*) INTO prep_count FROM preparation_scripts;
  SELECT COUNT(*) INTO warmup_count FROM warmup_routines;
  SELECT COUNT(*) INTO cooldown_count FROM cooldown_sequences;
  SELECT COUNT(*) INTO meditation_count FROM closing_meditation_scripts;
  SELECT COUNT(*) INTO homecare_count FROM closing_homecare_advice;

  RAISE NOTICE 'Seed data inserted successfully:';
  RAISE NOTICE '  - Preparation scripts: %', prep_count;
  RAISE NOTICE '  - Warmup routines: %', warmup_count;
  RAISE NOTICE '  - Cooldown sequences: %', cooldown_count;
  RAISE NOTICE '  - Meditation scripts: %', meditation_count;
  RAISE NOTICE '  - HomeCare advice: %', homecare_count;
END $$;
