-- Migration 012: Add Reasoner Mode Support + Warm-up/Cool-down Content
-- Session: Validation Reasoning & Questionnaires Feature
-- Date: December 3, 2025
-- Purpose: Support Default vs Reasoner mode with comprehensive content

-- ============================================
-- 1. ADD REASONER MODE FLAG TO USER PREFERENCES
-- ============================================

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS use_reasoner_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reasoner_enabled_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN user_preferences.use_reasoner_mode IS 'Enable AI reasoning for personalized class generation (Reasoner Mode)';
COMMENT ON COLUMN user_preferences.reasoner_enabled_date IS 'Timestamp when user enabled reasoner mode';

-- ============================================
-- 2. ADD REQUIRED ELEMENTS VALIDATION TO EXISTING TABLES
-- ============================================

-- Add required_elements field to all 6 section tables
ALTER TABLE preparation_scripts
ADD COLUMN IF NOT EXISTS required_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allow_ai_generation BOOLEAN DEFAULT false;

ALTER TABLE warmup_routines
ADD COLUMN IF NOT EXISTS required_muscle_groups TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allow_ai_generation BOOLEAN DEFAULT false;

ALTER TABLE cooldown_sequences
ADD COLUMN IF NOT EXISTS required_muscle_groups TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allow_ai_generation BOOLEAN DEFAULT false;

ALTER TABLE closing_meditation_scripts
ADD COLUMN IF NOT EXISTS required_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allow_ai_variation BOOLEAN DEFAULT false;

ALTER TABLE closing_homecare_advice
ADD COLUMN IF NOT EXISTS required_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allow_ai_generation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_preference VARCHAR(255) DEFAULT 'American School of Medicine';

COMMENT ON COLUMN preparation_scripts.required_elements IS 'Non-negotiable elements (4 core principles)';
COMMENT ON COLUMN preparation_scripts.allow_ai_generation IS 'Can AI generate new scripts in reasoner mode?';
COMMENT ON COLUMN warmup_routines.required_muscle_groups IS 'Muscle groups that must be warmed up';
COMMENT ON COLUMN cooldown_sequences.required_muscle_groups IS 'Muscle groups that must be cooled down';
COMMENT ON COLUMN closing_meditation_scripts.allow_ai_variation IS 'Can AI vary narrative in reasoner mode?';
COMMENT ON COLUMN closing_homecare_advice.source_preference IS 'Preferred research source for AI generation';

-- ============================================
-- 3. UPDATE EXISTING PREPARATION SCRIPTS WITH REQUIRED ELEMENTS
-- ============================================

UPDATE preparation_scripts
SET
    required_elements = '[
        "Wake up the core muscles",
        "Posture explanation (feet, knees, hips, shoulders, head alignment)",
        "Core activation (belt tightening or 100% to 30% tension visual)",
        "Lateral thoracic breathing (fingers on rib cage cue)"
    ]'::jsonb,
    allow_ai_generation = true
WHERE id IN (SELECT id FROM preparation_scripts LIMIT 2);

-- ============================================
-- 4. INSERT WARM-UP ROUTINES FOR ALL MAJOR MUSCLE GROUPS
-- ============================================

-- Hip Flexors Warm-up
INSERT INTO warmup_routines (
    routine_name,
    focus_area,
    narrative,
    movements,
    duration_seconds,
    contraindications,
    modifications,
    difficulty_level,
    required_muscle_groups,
    allow_ai_generation
) VALUES (
    'Hip Flexor Mobilization',
    'hip_flexors',
    'We''ll begin by gently mobilizing your hip flexors, which often become tight from prolonged sitting. These movements will prepare your hips for the work ahead.',
    jsonb_build_array(
        jsonb_build_object('name', 'Hip Circles', 'reps', 8, 'direction', 'each way', 'description', 'Lying on back, lift one leg toward ceiling, draw gentle circles in the air'),
        jsonb_build_object('name', 'Leg Swings', 'reps', 10, 'direction', 'front to back', 'description', 'Standing beside wall for support, swing leg gently forward and back'),
        jsonb_build_object('name', 'Knee to Chest', 'reps', 5, 'direction', 'each leg', 'description', 'Lying on back, draw knee to chest, hold, release')
    ),
    180,
    ARRAY['Recent hip surgery', 'Acute hip pain'],
    jsonb_build_object(
        'easier', 'Reduce range of motion, perform lying down',
        'harder', 'Add holds at end range'
    ),
    'Beginner',
    ARRAY['Hip Flexor Strengthening', 'Hip Mobility and/or Strengthening'],
    true
),

-- Glutes Warm-up
(
    'Glute Activation Sequence',
    'glutes',
    'Let''s wake up the glute muscles, your powerhouse for stability and strength. These activations ensure proper engagement during your main movements.',
    jsonb_build_array(
        jsonb_build_object('name', 'Bridge Prep', 'reps', 10, 'description', 'Lying on back, feet flat, lift hips while squeezing glutes'),
        jsonb_build_object('name', 'Clamshells', 'reps', 12, 'direction', 'each side', 'description', 'Side-lying, knees bent, lift top knee while keeping feet together'),
        jsonb_build_object('name', 'Glute Squeeze', 'duration', 30, 'description', 'Standing tall, squeeze glutes for 5 seconds, release, repeat')
    ),
    180,
    ARRAY['Acute lower back pain', 'Recent glute injury'],
    jsonb_build_object(
        'easier', 'Smaller range of motion',
        'harder', 'Add resistance band'
    ),
    'Beginner',
    ARRAY['Glute Strength', 'Posterior Chain Strength'],
    true
),

-- Back (Spine) Warm-up
(
    'Spinal Mobilization Sequence',
    'spine',
    'We''ll gently mobilize your spine through its full range of motion, preparing it for flexion, extension, and rotation work. Move slowly and mindfully.',
    jsonb_build_array(
        jsonb_build_object('name', 'Cat-Cow', 'reps', 10, 'description', 'On all fours, alternate between spinal flexion (cat) and extension (cow)'),
        jsonb_build_object('name', 'Seated Spinal Twist', 'reps', 5, 'direction', 'each side', 'description', 'Seated tall, rotate torso gently to each side'),
        jsonb_build_object('name', 'Thread the Needle', 'reps', 5, 'direction', 'each side', 'description', 'On all fours, reach one arm under body, gentle spinal rotation')
    ),
    180,
    ARRAY['Acute spinal injury', 'Recent spinal surgery', 'Severe osteoporosis'],
    jsonb_build_object(
        'easier', 'Reduce range of motion, skip rotation if painful',
        'harder', 'Add breath holds at end range'
    ),
    'Beginner',
    ARRAY['Spinal Stability', 'Spinal Mobility'],
    true
),

-- Shoulders Warm-up
(
    'Shoulder Mobility and Stability',
    'shoulders',
    'Let''s prepare your shoulder girdle with gentle mobilization and scapular stability work. This ensures safe, effective upper body movements.',
    jsonb_build_array(
        jsonb_build_object('name', 'Shoulder Circles', 'reps', 8, 'direction', 'forward and back', 'description', 'Standing or seated, draw large circles with your arms'),
        jsonb_build_object('name', 'Scapular Retraction', 'reps', 12, 'description', 'Draw shoulder blades together, hold, release'),
        jsonb_build_object('name', 'Arm Reaches', 'reps', 10, 'description', 'Reach arms overhead, feel shoulder blades glide on ribcage')
    ),
    180,
    ARRAY['Recent shoulder surgery', 'Acute shoulder pain', 'Frozen shoulder'],
    jsonb_build_object(
        'easier', 'Smaller circles, arms lower',
        'harder', 'Add light weights'
    ),
    'Beginner',
    ARRAY['Scapular Stability', 'Scapular Strengthening', 'Shoulder Mobility'],
    true
),

-- Hamstrings Warm-up
(
    'Hamstring Mobilization',
    'hamstrings',
    'We''ll gently lengthen and activate your hamstrings, preparing them for the work ahead. These muscles are often tight, so move gently.',
    jsonb_build_array(
        jsonb_build_object('name', 'Standing Forward Hinge', 'reps', 8, 'description', 'Standing, hinge at hips, reach toward toes, maintain long spine'),
        jsonb_build_object('name', 'Single Leg Hamstring Curl', 'reps', 10, 'direction', 'each leg', 'description', 'Standing, bend knee, bring heel toward glute'),
        jsonb_build_object('name', 'Seated Forward Reach', 'duration', 30, 'description', 'Seated, legs extended, reach forward with long spine')
    ),
    180,
    ARRAY['Acute hamstring strain', 'Recent hamstring injury'],
    jsonb_build_object(
        'easier', 'Bend knees slightly, reduce range',
        'harder', 'Increase depth of stretch'
    ),
    'Beginner',
    ARRAY['Hamstring Strength', 'Hamstring Stretch'],
    true
),

-- Chest Warm-up
(
    'Chest Opening Sequence',
    'chest',
    'Let''s open the chest and counteract forward posture. These movements prepare your chest muscles for extension and opening work.',
    jsonb_build_array(
        jsonb_build_object('name', 'Chest Expansion', 'reps', 10, 'description', 'Standing, interlace fingers behind back, lift arms, open chest'),
        jsonb_build_object('name', 'Doorway Stretch', 'duration', 30, 'direction', 'each side', 'description', 'Place forearm on wall, rotate body away gently'),
        jsonb_build_object('name', 'Arm Opener', 'reps', 8, 'description', 'Arms out to side, pulse back gently, opening chest')
    ),
    180,
    ARRAY['Recent chest surgery', 'Acute shoulder pain'],
    jsonb_build_object(
        'easier', 'Smaller range of motion',
        'harder', 'Increase stretch intensity'
    ),
    'Beginner',
    ARRAY['Chest Stretch', 'Upper Body Strength'],
    true
),

-- Full Body Comprehensive Warm-up (covers all muscle groups)
(
    'Comprehensive Full Body Warm-up',
    'full_body',
    'This complete warm-up sequence touches all major muscle groups, preparing your entire body for your Pilates practice. Move slowly and breathe deeply.',
    jsonb_build_array(
        jsonb_build_object('name', 'Neck Rolls', 'reps', 5, 'direction', 'each way', 'description', 'Gentle head circles to mobilize cervical spine'),
        jsonb_build_object('name', 'Shoulder Circles', 'reps', 8, 'direction', 'forward and back', 'description', 'Large arm circles'),
        jsonb_build_object('name', 'Cat-Cow', 'reps', 10, 'description', 'Spinal flexion and extension'),
        jsonb_build_object('name', 'Hip Circles', 'reps', 8, 'direction', 'each leg', 'description', 'Lying on back, leg circles in air'),
        jsonb_build_object('name', 'Glute Bridge', 'reps', 10, 'description', 'Activate glutes and hamstrings'),
        jsonb_build_object('name', 'Chest Expansion', 'reps', 8, 'description', 'Open chest, hands clasped behind back')
    ),
    300,
    ARRAY['Acute injury in any area'],
    jsonb_build_object(
        'easier', 'Skip any painful movements',
        'harder', 'Add breath holds, increase reps'
    ),
    'Beginner',
    ARRAY['Hip Flexor Strengthening', 'Glute Strength', 'Spinal Mobility', 'Scapular Stability', 'Hamstring Strength', 'Chest Stretch'],
    true
);

-- ============================================
-- 5. INSERT COOL-DOWN SEQUENCES FOR ALL MAJOR MUSCLE GROUPS
-- ============================================

-- Hip Flexors Cool-down
INSERT INTO cooldown_sequences (
    sequence_name,
    intensity_level,
    narrative,
    stretches,
    duration_seconds,
    target_muscles,
    recovery_focus,
    required_muscle_groups,
    allow_ai_generation
) VALUES (
    'Hip Flexor Release',
    'gentle',
    'Now we''ll release any tension in your hip flexors with gentle, sustained stretches. Breathe deeply and allow your muscles to lengthen.',
    jsonb_build_array(
        jsonb_build_object('name', 'Low Lunge', 'duration', 45, 'side', 'each', 'focus', 'Hip flexor lengthening', 'breathing', 'Deep diaphragmatic'),
        jsonb_build_object('name', 'Figure-4 Hip Stretch', 'duration', 45, 'side', 'each', 'focus', 'Hip external rotation', 'breathing', 'Natural'),
        jsonb_build_object('name', 'Supine Hip Flexor Stretch', 'duration', 30, 'side', 'each', 'focus', 'Deep hip flexor release', 'breathing', 'Slow exhales')
    ),
    180,
    ARRAY['hip_flexors', 'Hip Flexor Strengthening', 'Hip Mobility and/or Strengthening'],
    'Hip flexor lengthening and mobility restoration',
    ARRAY['Hip Flexor Strengthening', 'Hip Mobility and/or Strengthening'],
    true
),

-- Glutes Cool-down
(
    'Glute Recovery Sequence',
    'moderate',
    'Let''s give your hard-working glutes the recovery they deserve. These stretches will release tension and restore mobility.',
    jsonb_build_array(
        jsonb_build_object('name', 'Pigeon Pose', 'duration', 60, 'side', 'each', 'focus', 'Deep glute stretch', 'breathing', 'Relaxed, deep breaths'),
        jsonb_build_object('name', 'Supine Figure-4', 'duration', 45, 'side', 'each', 'focus', 'Glute and hip release', 'breathing', 'Natural'),
        jsonb_build_object('name', 'Seated Glute Stretch', 'duration', 45, 'side', 'each', 'focus', 'Gentle glute lengthening', 'breathing', 'Deep inhales')
    ),
    180,
    ARRAY['glutes', 'Glute Strength', 'Posterior Chain Strength'],
    'Glute muscle recovery and hip mobility',
    ARRAY['Glute Strength'],
    true
),

-- Back (Spine) Cool-down
(
    'Spinal Decompression and Release',
    'gentle',
    'Your spine has worked hard today. Let''s decompress and restore space between the vertebrae with these gentle stretches.',
    jsonb_build_array(
        jsonb_build_object('name', 'Child''s Pose', 'duration', 60, 'focus', 'Spinal lengthening, lower back release', 'breathing', 'Deep diaphragmatic'),
        jsonb_build_object('name', 'Supine Spinal Twist', 'duration', 45, 'side', 'each', 'focus', 'Spinal rotation and release', 'breathing', 'Natural'),
        jsonb_build_object('name', 'Cat Stretch', 'duration', 30, 'focus', 'Gentle spinal flexion', 'breathing', 'Exhale into stretch'),
        jsonb_build_object('name', 'Cobra Stretch', 'duration', 30, 'focus', 'Gentle spinal extension', 'breathing', 'Inhale as you lift')
    ),
    180,
    ARRAY['spine', 'back', 'Spinal Stability', 'Spinal Mobility', 'Lower Back Stretch', 'Erector Spinae Stretch'],
    'Spinal decompression and mobility restoration',
    ARRAY['Spinal Stability', 'Spinal Mobility'],
    true
),

-- Shoulders Cool-down
(
    'Shoulder Release and Mobility',
    'gentle',
    'Let''s release your shoulders and restore their natural range of motion. These stretches counteract any tension from your upper body work.',
    jsonb_build_array(
        jsonb_build_object('name', 'Thread the Needle', 'duration', 45, 'side', 'each', 'focus', 'Shoulder and upper back release', 'breathing', 'Deep, slow'),
        jsonb_build_object('name', 'Cross-Body Shoulder Stretch', 'duration', 30, 'side', 'each', 'focus', 'Posterior shoulder', 'breathing', 'Natural'),
        jsonb_build_object('name', 'Overhead Tricep Stretch', 'duration', 30, 'side', 'each', 'focus', 'Shoulder mobility', 'breathing', 'Relaxed'),
        jsonb_build_object('name', 'Chest Opener on Back', 'duration', 45, 'focus', 'Open chest and shoulders', 'breathing', 'Deep lateral breathing')
    ),
    180,
    ARRAY['shoulders', 'Scapular Stability', 'Scapular Strengthening', 'Shoulder Mobility', 'Upper Body Strength'],
    'Shoulder tension release and mobility restoration',
    ARRAY['Scapular Stability', 'Shoulder Mobility'],
    true
),

-- Hamstrings Cool-down
(
    'Hamstring Lengthening Sequence',
    'moderate',
    'Your hamstrings have worked hard today. Let''s give them the lengthening and recovery they need with these sustained stretches.',
    jsonb_build_array(
        jsonb_build_object('name', 'Seated Forward Fold', 'duration', 60, 'focus', 'Hamstring and spine lengthening', 'breathing', 'Exhale deeper into stretch'),
        jsonb_build_object('name', 'Supine Hamstring Stretch', 'duration', 45, 'side', 'each', 'focus', 'Isolated hamstring stretch', 'breathing', 'Deep, slow'),
        jsonb_build_object('name', 'Standing Forward Fold', 'duration', 45, 'focus', 'Hamstrings and lower back', 'breathing', 'Let gravity assist')
    ),
    180,
    ARRAY['hamstrings', 'Hamstring Strength', 'Hamstring Stretch'],
    'Hamstring lengthening and recovery',
    ARRAY['Hamstring Strength', 'Hamstring Stretch'],
    true
),

-- Chest Cool-down
(
    'Chest Opening and Release',
    'gentle',
    'Let''s open your chest and counteract any forward posture from the day. These stretches restore length to your chest muscles.',
    jsonb_build_array(
        jsonb_build_object('name', 'Chest Opener on Back', 'duration', 60, 'focus', 'Deep chest stretch', 'breathing', 'Full lateral breathing'),
        jsonb_build_object('name', 'Doorway Stretch', 'duration', 45, 'side', 'each', 'focus', 'Pectoral stretch', 'breathing', 'Natural'),
        jsonb_build_object('name', 'Cow Face Arms', 'duration', 30, 'side', 'each', 'focus', 'Shoulder and chest', 'breathing', 'Relaxed')
    ),
    180,
    ARRAY['chest', 'Chest Stretch'],
    'Chest opening and posture restoration',
    ARRAY['Chest Stretch'],
    true
),

-- Full Body Comprehensive Cool-down
(
    'Full Body Recovery and Integration',
    'gentle',
    'This complete cool-down sequence addresses all muscle groups worked today. Move slowly, breathe deeply, and allow your body to integrate the work.',
    jsonb_build_array(
        jsonb_build_object('name', 'Child''s Pose', 'duration', 45, 'focus', 'Spine and hips', 'breathing', 'Deep diaphragmatic'),
        jsonb_build_object('name', 'Supine Spinal Twist', 'duration', 45, 'side', 'each', 'focus', 'Spine and obliques', 'breathing', 'Natural'),
        jsonb_build_object('name', 'Figure-4 Hip Stretch', 'duration', 30, 'side', 'each', 'focus', 'Hips and glutes', 'breathing', 'Slow'),
        jsonb_build_object('name', 'Seated Forward Fold', 'duration', 45, 'focus', 'Hamstrings and spine', 'breathing', 'Deep exhales'),
        jsonb_build_object('name', 'Thread the Needle', 'duration', 30, 'side', 'each', 'focus', 'Shoulders and upper back', 'breathing', 'Relaxed'),
        jsonb_build_object('name', 'Chest Opener Supine', 'duration', 45, 'focus', 'Chest and shoulders', 'breathing', 'Full lateral breathing'),
        jsonb_build_object('name', 'Legs Up the Wall', 'duration', 60, 'focus', 'Total body recovery', 'breathing', 'Natural, effortless')
    ),
    360,
    ARRAY['hip_flexors', 'glutes', 'back', 'spine', 'shoulders', 'hamstrings', 'chest'],
    'Complete body recovery and integration',
    ARRAY['Hip Flexor Strengthening', 'Glute Strength', 'Spinal Mobility', 'Scapular Stability', 'Hamstring Strength', 'Chest Stretch'],
    true
);

-- ============================================
-- 6. UPDATE EXISTING MEDITATION SCRIPTS
-- ============================================

UPDATE closing_meditation_scripts
SET
    required_elements = '[
        "Short narrative (students should have time to enjoy music)",
        "Breathing direction (lateral thoracic breathing no longer applicable)"
    ]'::jsonb,
    allow_ai_variation = true;

-- ============================================
-- 7. UPDATE EXISTING HOMECARE ADVICE
-- ============================================

UPDATE closing_homecare_advice
SET
    required_elements = '[
        "Source information and disclaimer: This is guidance only, consult physician if any concerns"
    ]'::jsonb,
    allow_ai_generation = true,
    source_preference = 'American School of Medicine';

-- ============================================
-- 8. CREATE VALIDATION FUNCTION FOR REQUIRED ELEMENTS
-- ============================================

CREATE OR REPLACE FUNCTION validate_required_elements(
    section_type VARCHAR,
    content_text TEXT,
    required_elements_json JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    missing_elements TEXT[],
    validation_message TEXT
) AS $$
DECLARE
    element TEXT;
    missing TEXT[] := '{}';
    element_found BOOLEAN;
BEGIN
    -- Check each required element
    FOR element IN SELECT jsonb_array_elements_text(required_elements_json)
    LOOP
        -- Simple text search (can be enhanced with NLP)
        element_found := position(lower(element) IN lower(content_text)) > 0;

        IF NOT element_found THEN
            missing := array_append(missing, element);
        END IF;
    END LOOP;

    -- Return validation result
    IF array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0 THEN
        RETURN QUERY SELECT
            true,
            '{}'::TEXT[],
            'All required elements present'::TEXT;
    ELSE
        RETURN QUERY SELECT
            false,
            missing,
            format('Missing required elements: %s', array_to_string(missing, ', '))::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_required_elements IS 'Validates that AI-generated content contains all required elements for the section type';

-- ============================================
-- 9. CREATE FUNCTION TO SELECT CONTENT BY MODE
-- ============================================

CREATE OR REPLACE FUNCTION select_warmup_by_muscle_groups(
    target_muscles TEXT[],
    user_mode VARCHAR DEFAULT 'default'
)
RETURNS TABLE(
    routine_id UUID,
    routine_name VARCHAR,
    narrative TEXT,
    movements JSONB,
    duration_seconds INTEGER
) AS $$
BEGIN
    -- If reasoner mode, return routines that allow AI generation
    IF user_mode = 'reasoner' THEN
        RETURN QUERY
        SELECT
            id,
            warmup_routines.routine_name,
            warmup_routines.narrative,
            warmup_routines.movements,
            warmup_routines.duration_seconds
        FROM warmup_routines
        WHERE
            required_muscle_groups && target_muscles
            AND allow_ai_generation = true
        ORDER BY
            (SELECT count(*) FROM unnest(required_muscle_groups) WHERE unnest = ANY(target_muscles)) DESC
        LIMIT 1;
    ELSE
        -- Default mode: return best matching routine
        RETURN QUERY
        SELECT
            id,
            warmup_routines.routine_name,
            warmup_routines.narrative,
            warmup_routines.movements,
            warmup_routines.duration_seconds
        FROM warmup_routines
        WHERE required_muscle_groups && target_muscles
        ORDER BY
            (SELECT count(*) FROM unnest(required_muscle_groups) WHERE unnest = ANY(target_muscles)) DESC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION select_warmup_by_muscle_groups IS 'Selects appropriate warm-up routine based on muscle groups and user mode (default vs reasoner)';

-- Similar function for cool-down
CREATE OR REPLACE FUNCTION select_cooldown_by_muscle_groups(
    target_muscles TEXT[],
    user_mode VARCHAR DEFAULT 'default'
)
RETURNS TABLE(
    sequence_id UUID,
    sequence_name VARCHAR,
    narrative TEXT,
    stretches JSONB,
    duration_seconds INTEGER
) AS $$
BEGIN
    IF user_mode = 'reasoner' THEN
        RETURN QUERY
        SELECT
            id,
            cooldown_sequences.sequence_name,
            cooldown_sequences.narrative,
            cooldown_sequences.stretches,
            cooldown_sequences.duration_seconds
        FROM cooldown_sequences
        WHERE
            required_muscle_groups && target_muscles
            AND allow_ai_generation = true
        ORDER BY
            (SELECT count(*) FROM unnest(required_muscle_groups) WHERE unnest = ANY(target_muscles)) DESC
        LIMIT 1;
    ELSE
        RETURN QUERY
        SELECT
            id,
            cooldown_sequences.sequence_name,
            cooldown_sequences.narrative,
            cooldown_sequences.stretches,
            cooldown_sequences.duration_seconds
        FROM cooldown_sequences
        WHERE required_muscle_groups && target_muscles
        ORDER BY
            (SELECT count(*) FROM unnest(required_muscle_groups) WHERE unnest = ANY(target_muscles)) DESC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION select_cooldown_by_muscle_groups IS 'Selects appropriate cool-down sequence based on muscle groups and user mode (default vs reasoner)';

-- ============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_warmup_routines_required_muscles ON warmup_routines USING GIN (required_muscle_groups);
CREATE INDEX IF NOT EXISTS idx_cooldown_sequences_required_muscles ON cooldown_sequences USING GIN (required_muscle_groups);
CREATE INDEX IF NOT EXISTS idx_warmup_routines_allow_ai ON warmup_routines(allow_ai_generation);
CREATE INDEX IF NOT EXISTS idx_cooldown_sequences_allow_ai ON cooldown_sequences(allow_ai_generation);
CREATE INDEX IF NOT EXISTS idx_user_preferences_reasoner_mode ON user_preferences(use_reasoner_mode);

-- ============================================
-- 11. VERIFICATION AND SUCCESS MESSAGE
-- ============================================

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

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration 012 Complete: Reasoner Mode Support Added!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current Content Inventory:';
    RAISE NOTICE '  - Preparation scripts: % (with required elements)', prep_count;
    RAISE NOTICE '  - Warmup routines: % (targeting all major muscle groups)', warmup_count;
    RAISE NOTICE '  - Cooldown sequences: % (targeting all major muscle groups)', cooldown_count;
    RAISE NOTICE '  - Meditation scripts: % (with AI variation enabled)', meditation_count;
    RAISE NOTICE '  - HomeCare advice: % (with source preferences)', homecare_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Features Added:';
    RAISE NOTICE '  • use_reasoner_mode flag in user_preferences';
    RAISE NOTICE '  • required_elements validation for all 6 sections';
    RAISE NOTICE '  • 7 warm-up routines (hip flexors, glutes, back, shoulders, hamstrings, chest, full body)';
    RAISE NOTICE '  • 7 cool-down sequences (matching warm-up muscle groups)';
    RAISE NOTICE '  • validate_required_elements() function for AI content validation';
    RAISE NOTICE '  • select_warmup_by_muscle_groups() function for smart selection';
    RAISE NOTICE '  • select_cooldown_by_muscle_groups() function for smart selection';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '  1. Update backend agents to check use_reasoner_mode flag';
    RAISE NOTICE '  2. Implement Default mode (direct selection from database)';
    RAISE NOTICE '  3. Fix ReWOO issues (transcript truncation, tool discovery)';
    RAISE NOTICE '  4. Implement Reasoner mode (AI generation with validation)';
    RAISE NOTICE '';
END $$;
