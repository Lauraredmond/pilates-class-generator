-- Session 11: Data Model Expansion - Phase 2
-- Add movement levels + all 6 Pilates class sections
-- Date: November 29, 2025

-- ============================================
-- 1. MOVEMENT LEVELS TABLE
-- ============================================
-- Stores progressive difficulty levels for each movement (L1 → L2 → L3 → Full)
-- Not all movements have all 4 levels - store only what exists

CREATE TABLE IF NOT EXISTS movement_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 4),
    level_name VARCHAR(50) NOT NULL,  -- "Level 1", "Level 2", "Level 3", "Full"

    -- Level-specific content
    narrative TEXT,
    setup_position VARCHAR(255),
    watch_out_points TEXT[],
    teaching_cues JSONB,
    visual_cues TEXT[],
    muscle_groups JSONB,
    duration_seconds INTEGER,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: each movement can have each level only once
    UNIQUE(movement_id, level_number)
);

CREATE INDEX idx_movement_levels_movement_id ON movement_levels(movement_id);
CREATE INDEX idx_movement_levels_level_number ON movement_levels(level_number);

COMMENT ON TABLE movement_levels IS 'Progressive difficulty levels for Pilates movements (L1→L2→L3→Full)';
COMMENT ON COLUMN movement_levels.level_number IS '1=Level 1 (easiest), 2=Level 2, 3=Level 3, 4=Full (hardest)';

-- ============================================
-- 2. PREPARATION SCRIPTS TABLE
-- ============================================
-- Opening section: Pilates principles, centering, breathing exercises

CREATE TABLE IF NOT EXISTS preparation_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_name VARCHAR(255) NOT NULL,
    script_type VARCHAR(50) NOT NULL,  -- 'centering', 'breathing', 'principles'
    narrative TEXT NOT NULL,
    key_principles TEXT[],  -- Pilates principles covered: control, precision, flow, etc.
    duration_seconds INTEGER NOT NULL DEFAULT 120,  -- Typical: 2-3 minutes
    breathing_pattern VARCHAR(100),  -- E.g., "Inhale 4 counts, exhale 6 counts"
    breathing_focus VARCHAR(255),  -- E.g., "Diaphragmatic breathing", "Lateral breathing"
    difficulty_level VARCHAR(50) DEFAULT 'Beginner',  -- Beginner, Intermediate, Advanced

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_preparation_scripts_type ON preparation_scripts(script_type);
CREATE INDEX idx_preparation_scripts_difficulty ON preparation_scripts(difficulty_level);

COMMENT ON TABLE preparation_scripts IS 'Opening preparation scripts for class (Pilates principles, breathing, centering)';

-- ============================================
-- 3. WARMUP ROUTINES TABLE
-- ============================================
-- Gentle movements to prepare body for main workout

CREATE TABLE IF NOT EXISTS warmup_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_name VARCHAR(255) NOT NULL,
    focus_area VARCHAR(100) NOT NULL,  -- 'spine', 'hips', 'shoulders', 'full_body'
    narrative TEXT NOT NULL,
    movements JSONB NOT NULL,  -- Simple movements: neck rolls, shoulder circles, cat-cow
    duration_seconds INTEGER NOT NULL DEFAULT 300,  -- Typical: 5 minutes
    contraindications TEXT[],  -- When to avoid: pregnancy, recent surgery, etc.
    modifications JSONB,  -- Easier/harder variations
    difficulty_level VARCHAR(50) DEFAULT 'Beginner',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_warmup_routines_focus ON warmup_routines(focus_area);
CREATE INDEX idx_warmup_routines_difficulty ON warmup_routines(difficulty_level);

COMMENT ON TABLE warmup_routines IS 'Warm-up routines to prepare body for main movements';
COMMENT ON COLUMN warmup_routines.movements IS 'JSONB array of simple movements: [{"name": "Neck Rolls", "reps": 5, "direction": "clockwise"}, ...]';

-- ============================================
-- 4. COOLDOWN SEQUENCES TABLE
-- ============================================
-- Post-workout stretches and recovery movements

CREATE TABLE IF NOT EXISTS cooldown_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_name VARCHAR(255) NOT NULL,
    intensity_level VARCHAR(50) NOT NULL,  -- 'gentle', 'moderate', 'deep'
    narrative TEXT NOT NULL,
    stretches JSONB NOT NULL,  -- Stretches to perform
    duration_seconds INTEGER NOT NULL DEFAULT 300,  -- Typical: 5 minutes
    target_muscles TEXT[],  -- Which muscle groups to target
    recovery_focus VARCHAR(255),  -- E.g., "Spinal decompression", "Hip flexor release"

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cooldown_sequences_intensity ON cooldown_sequences(intensity_level);

COMMENT ON TABLE cooldown_sequences IS 'Cool-down stretches and recovery movements';
COMMENT ON COLUMN cooldown_sequences.stretches IS 'JSONB array of stretches: [{"name": "Child''s Pose", "duration": 30, "focus": "spine"}, ...]';

-- ============================================
-- 5. CLOSING MEDITATION SCRIPTS TABLE
-- ============================================
-- Final meditation/breathing to end class

CREATE TABLE IF NOT EXISTS closing_meditation_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_name VARCHAR(255) NOT NULL,
    meditation_theme VARCHAR(100) NOT NULL,  -- 'body_scan', 'gratitude', 'breath', 'mindfulness'
    script_text TEXT NOT NULL,  -- Full narration script
    breathing_guidance TEXT,  -- Breathing instructions during meditation
    duration_seconds INTEGER NOT NULL DEFAULT 180,  -- Typical: 2-3 minutes
    post_intensity VARCHAR(50),  -- What came before: 'high', 'moderate', 'low'

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_closing_meditation_theme ON closing_meditation_scripts(meditation_theme);
CREATE INDEX idx_closing_meditation_intensity ON closing_meditation_scripts(post_intensity);

COMMENT ON TABLE closing_meditation_scripts IS 'Closing meditation scripts to end class mindfully';
COMMENT ON COLUMN closing_meditation_scripts.post_intensity IS 'Intensity of class that preceded this meditation (affects tone/pace)';

-- ============================================
-- 6. CLOSING HOMECARE ADVICE TABLE
-- ============================================
-- Practical advice for students to take home

CREATE TABLE IF NOT EXISTS closing_homecare_advice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advice_name VARCHAR(255) NOT NULL,
    focus_area VARCHAR(100) NOT NULL,  -- 'spine_care', 'injury_prevention', 'recovery', 'daily_practice'
    advice_text TEXT NOT NULL,  -- Main advice narrative
    actionable_tips TEXT[] NOT NULL,  -- Specific tips students can implement
    duration_seconds INTEGER DEFAULT 60,  -- Typical: 1 minute
    related_to_class_focus BOOLEAN DEFAULT false,  -- Was this advice tailored to today's class focus?

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_closing_homecare_focus ON closing_homecare_advice(focus_area);

COMMENT ON TABLE closing_homecare_advice IS 'Practical home care advice to close the class';
COMMENT ON COLUMN closing_homecare_advice.actionable_tips IS 'Array of specific, actionable tips: ["Practice breathing daily", "Stretch hip flexors", ...]';

-- ============================================
-- 7. EXTEND USER_PREFERENCES TABLE
-- ============================================
-- Add new preferences for movement levels and delivery format

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS preferred_movement_level VARCHAR(50) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS show_full_progression BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_preferences.preferred_movement_level IS 'User''s preferred difficulty: beginner, intermediate, advanced';
COMMENT ON COLUMN user_preferences.show_full_progression IS 'Show L1→L2→L3→Full progression in class narrative (for instructors)';

-- ============================================
-- 8. SAMPLE DATA (for testing)
-- ============================================

-- Sample Preparation Script
INSERT INTO preparation_scripts (script_name, script_type, narrative, key_principles, duration_seconds, breathing_pattern, breathing_focus, difficulty_level)
VALUES (
    'Classical Centering & Breathing',
    'centering',
    'Welcome. Find a comfortable seated position. Close your eyes if comfortable. Place your hands on your ribcage. Begin to notice your breath. As you inhale, feel your ribs expand laterally. As you exhale, feel them gently draw together. Let''s take 5 deep breaths together, focusing on the Pilates principle of control.',
    ARRAY['Control', 'Concentration', 'Centering', 'Breathing'],
    120,
    'Inhale 4 counts, exhale 6 counts',
    'Lateral rib expansion',
    'Beginner'
);

-- Sample Warmup Routine
INSERT INTO warmup_routines (routine_name, focus_area, narrative, movements, duration_seconds, contraindications, modifications, difficulty_level)
VALUES (
    'Spinal Mobilization Warmup',
    'spine',
    'We''ll begin by gently mobilizing the spine through its full range of motion. Start seated with a tall spine.',
    '[
        {"name": "Neck Rolls", "reps": 5, "direction": "each way", "focus": "cervical spine"},
        {"name": "Shoulder Circles", "reps": 8, "direction": "forward and back", "focus": "shoulder girdle"},
        {"name": "Seated Cat-Cow", "reps": 10, "direction": "alternating", "focus": "spinal flexion/extension"},
        {"name": "Seated Spinal Twist", "reps": 5, "direction": "each side", "focus": "spinal rotation"}
    ]'::jsonb,
    300,
    ARRAY['Acute neck pain', 'Recent spinal surgery', 'Severe osteoporosis'],
    '{"easier": "Reduce range of motion", "harder": "Add breath holds"}'::jsonb,
    'Beginner'
);

-- Sample Cooldown Sequence
INSERT INTO cooldown_sequences (sequence_name, intensity_level, narrative, stretches, duration_seconds, target_muscles, recovery_focus)
VALUES (
    'Full Body Recovery',
    'gentle',
    'Let''s bring the body into recovery. We''ll focus on gentle stretches to release any tension from our work.',
    '[
        {"name": "Child''s Pose", "duration": 45, "focus": "spine decompression", "breathing": "deep diaphragmatic"},
        {"name": "Supine Spinal Twist", "duration": 30, "focus": "spinal rotation", "breathing": "natural"},
        {"name": "Figure-4 Hip Stretch", "duration": 30, "focus": "hip flexors", "side": "each"},
        {"name": "Supported Bridge Pose", "duration": 60, "focus": "passive back bend", "breathing": "relaxed"}
    ]'::jsonb,
    300,
    ARRAY['Spine', 'Hips', 'Lower back', 'Shoulders'],
    'Spinal decompression and hip release'
);

-- Sample Closing Meditation
INSERT INTO closing_meditation_scripts (script_name, meditation_theme, script_text, breathing_guidance, duration_seconds, post_intensity)
VALUES (
    'Body Scan & Gratitude',
    'body_scan',
    'Close your eyes. Bring awareness to your body. Starting at the crown of your head, scan down through your body. Notice the work you''ve done today. Thank your body for its strength and flexibility. Take three deep breaths. When you''re ready, gently open your eyes. Thank you for your practice today.',
    'Deep, slow diaphragmatic breathing. Inhale for 4 counts, exhale for 6 counts.',
    180,
    'moderate'
);

-- Sample Home Care Advice
INSERT INTO closing_homecare_advice (advice_name, focus_area, advice_text, actionable_tips, duration_seconds, related_to_class_focus)
VALUES (
    'Daily Spinal Care',
    'spine_care',
    'To maintain the spinal health we''ve cultivated today, I encourage you to practice these simple techniques at home.',
    ARRAY[
        'Practice lateral breathing for 2 minutes each morning',
        'Perform gentle cat-cow stretches if your back feels tight',
        'Notice your posture throughout the day - tall spine, shoulders relaxed',
        'Take movement breaks every hour if you sit for work'
    ],
    60,
    true
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Session 11 Migration Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  • movement_levels (movement progression L1→L2→L3→Full)';
    RAISE NOTICE '  • preparation_scripts (opening principles & breathing)';
    RAISE NOTICE '  • warmup_routines (gentle pre-workout movements)';
    RAISE NOTICE '  • cooldown_sequences (post-workout stretches)';
    RAISE NOTICE '  • closing_meditation_scripts (mindful closing)';
    RAISE NOTICE '  • closing_homecare_advice (practical takeaways)';
    RAISE NOTICE '';
    RAISE NOTICE 'Extended tables:';
    RAISE NOTICE '  • user_preferences (added preferred_movement_level, show_full_progression)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample data inserted for testing.';
END $$;
