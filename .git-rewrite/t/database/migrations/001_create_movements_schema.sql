-- Migration 001: Core Movements Schema
-- Created: 2025-11-14
-- Purpose: Create foundational tables for Pilates movements from Excel data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MOVEMENTS TABLE (Core movement catalog)
-- ============================================================================
CREATE TABLE movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Excel traceability
    excel_row_number INTEGER,
    excel_id VARCHAR(50) UNIQUE, -- e.g., "hundred_1"

    -- Basic attributes
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'Mat-based', -- Mat-based, Equipment, Hybrid

    -- Difficulty (extracted from Excel)
    difficulty_level VARCHAR(20) NOT NULL, -- Beginner, Intermediate, Advanced
    difficulty_rank INTEGER, -- 1-34 for ordering

    -- Teaching content
    narrative TEXT, -- Teaching story/approach
    visual_cues TEXT, -- Imagery for cueing (e.g., "spine like string of pearls")
    watch_out_points TEXT, -- Safety warnings

    -- Setup and execution
    setup_position VARCHAR(50) NOT NULL, -- Supine, Prone, Kneeling, Seated, Side-lying
    duration_seconds INTEGER, -- Typical duration

    -- Levels (progression system from Excel)
    level_1_description TEXT, -- L1: Beginner modification
    level_2_description TEXT, -- L2: Intermediate
    full_version_description TEXT, -- FV: Classical execution

    -- Breathing (if detailed)
    breathing_pattern JSONB, -- { inhale_count: 5, exhale_count: 5, cycles: 10 }

    -- Equipment
    equipment_required JSONB DEFAULT '[]'::jsonb, -- ["mat", "pillow", "band"]

    -- Metadata
    created_from_excel BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_movements_difficulty ON movements(difficulty_level);
CREATE INDEX idx_movements_setup_position ON movements(setup_position);
CREATE INDEX idx_movements_category ON movements(category);
CREATE INDEX idx_movements_name ON movements(name);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_movements_updated_at
    BEFORE UPDATE ON movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MUSCLE GROUPS TABLE
-- ============================================================================
CREATE TABLE muscle_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50), -- Stability, Strengthening, Flexibility, Control
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert muscle groups from Excel
INSERT INTO muscle_groups (name, category) VALUES
    ('Scapular Stability', 'Stability'),
    ('Pelvic Stability', 'Stability'),
    ('Spinal Stability', 'Stability'),
    ('Core Strength', 'Strengthening'),
    ('Scapular Strengthening', 'Strengthening'),
    ('Pelvic Strengthening', 'Strengthening'),
    ('Hip Flexor Strengthening', 'Strengthening'),
    ('Hip Mobility and/or Strengthening', 'Flexibility'),
    ('Thoracic Mobility &/or Strength', 'Flexibility'),
    ('Posterior Chain Strength', 'Strengthening'),
    ('Upper Body Strength', 'Strengthening'),
    ('Glute Strength', 'Strengthening'),
    ('Hamstring Strength', 'Strengthening'),
    ('Shoulder Mobility', 'Flexibility'),
    ('Spinal Mobility', 'Flexibility'),
    ('Chest Stretch', 'Flexibility'),
    ('Lower Back Stretch', 'Flexibility'),
    ('Hamstring Stretch', 'Flexibility'),
    ('Erector Spinae Stretch', 'Flexibility'),
    ('Thigh Stretch', 'Flexibility'),
    ('Sequential Control', 'Control'),
    ('Balance', 'Control'),
    ('Coordination', 'Control');

-- ============================================================================
-- MOVEMENT MUSCLES (Many-to-Many Junction Table)
-- ============================================================================
CREATE TABLE movement_muscles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
    muscle_group_id UUID NOT NULL REFERENCES muscle_groups(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT true, -- Primary vs. secondary muscle involvement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movement_id, muscle_group_id)
);

CREATE INDEX idx_movement_muscles_movement ON movement_muscles(movement_id);
CREATE INDEX idx_movement_muscles_muscle_group ON movement_muscles(muscle_group_id);

-- ============================================================================
-- SEQUENCE RULES TABLE (Safety-Critical)
-- ============================================================================
CREATE TABLE sequence_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_number INTEGER NOT NULL UNIQUE,
    description TEXT NOT NULL,
    rule_type VARCHAR(50) DEFAULT 'safety', -- safety, quality, progression, recommendation
    is_required BOOLEAN DEFAULT true,
    enforcement_level VARCHAR(20) DEFAULT 'strict', -- strict, recommended, optional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert rules from Excel
INSERT INTO sequence_rules (rule_number, description, rule_type, is_required, enforcement_level) VALUES
    (1, 'Class plans should comprise between 8 and 12 movements for an hour long class', 'quality', true, 'strict'),
    (2, '8 movements for beginner to intermediate, 12 for advanced', 'progression', true, 'strict'),
    (3, 'Beginners should do mostly L1 and L2 in the movements and the Pilates app daily session narratives categorise beginner and advanced movements very well', 'progression', true, 'strict'),
    (4, 'Class movements should be fresh and Pilates instructors should review prior classes to avoid overuse of certain movements', 'quality', true, 'recommended'),
    (5, 'Movements within a class should avoid consecutive overuse of muscles so lookbacks should be done to safeguard against this', 'safety', true, 'strict'),
    (6, 'Transitions should avoid discomfort between movements', 'safety', true, 'strict'),
    (7, 'Warm ups and cool downs should relate to movement muscle groups used during the class stage', 'safety', true, 'strict'),
    (8, 'All class structures should follow the structure highlighted in the categories and subcategories columns in sheet "CH Class history - detail"', 'progression', true, 'recommended'),
    (9, 'Scrape the Internet for home care advice. Best sources are american school of medicine as well as other medically accredited institutions. Advice should be accessible though', 'quality', false, 'optional'),
    (10, 'Movements should be avoided if the student is injured and movement relates to an injured part of student''s body', 'safety', true, 'strict');

-- ============================================================================
-- TRANSITIONS TABLE (Position-based transition narratives)
-- ============================================================================
CREATE TABLE transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_position VARCHAR(50) NOT NULL,
    to_position VARCHAR(50) NOT NULL,
    narrative TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_position, to_position)
);

-- Insert transitions from Excel
INSERT INTO transitions (from_position, to_position, narrative) VALUES
    ('Kneeling', 'Kneeling', '"Stay tall through the spine, reset your shoulders over your hips, and prepare for the next movement."'),
    ('Kneeling', 'Supine', '"Bring your hands to the mat, lower onto one hip, and gently roll down onto your back with control."'),
    ('Kneeling', 'Prone', '"Walk your hands forward and lower your torso to the mat, coming all the way down onto your front."'),
    ('Kneeling', 'Seated', '"Shift your weight back, bring the legs forward with control, and lengthen up into a tall seated position."'),
    ('Supine', 'Kneeling', '"Roll to your side, press up with your hands, and come through all-fours into a stable kneeling position."'),
    ('Supine', 'Supine', '"Reset your position, draw your shoulders away from your ears, and prepare for the next movement."'),
    ('Supine', 'Prone', '"Roll onto your side, then continue rolling all the way onto your front with control."'),
    ('Supine', 'Seated', '"Engage your core and smoothly roll up to a tall seated position, stacking the spine vertebra by vertebra."'),
    ('Supine', 'Side-lying', '"Roll onto your side with control, stack your shoulders and hips, and prepare for side work."'),
    ('Prone', 'Supine', '"Press through your hands, roll onto your side, then continue onto your back with control."'),
    ('Prone', 'Kneeling', '"Press into your hands, lift through your torso, and come back through all-fours to kneeling."'),
    ('Prone', 'Seated', '"Walk your hands back towards your body, press up, and shift back into a seated position."'),
    ('Prone', 'Prone', '"Lower back down with control, reset your hand position, and prepare for the next movement."'),
    ('Seated', 'Supine', '"Engage your core and slowly roll down to your back with control, articulating through each vertebra."'),
    ('Seated', 'Kneeling', '"Shift your weight forward, bring your legs underneath you, and transition to a tall kneeling position."'),
    ('Seated', 'Prone', '"Walk your hands forward, lower your torso to the mat, and come all the way down onto your front."'),
    ('Seated', 'Seated', '"Reset your sit bones, lengthen through your spine, and prepare for the next movement."'),
    ('Side-lying', 'Supine', '"Roll onto your back with control, maintaining engagement through your core."'),
    ('Side-lying', 'Side-lying (other)', '"Roll through your back with control to the other side, stacking shoulders and hips."'),
    ('Side-lying', 'Seated', '"Press up through your hand, bring your legs forward, and come to a tall seated position."');

-- ============================================================================
-- TEACHING CUES TABLE
-- ============================================================================
CREATE TABLE teaching_cues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
    cue_type VARCHAR(50) NOT NULL, -- verbal, visual, tactile, imagery
    cue_text TEXT NOT NULL,
    cue_order INTEGER, -- For sequencing multiple cues
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teaching_cues_movement ON teaching_cues(movement_id);
CREATE INDEX idx_teaching_cues_type ON teaching_cues(cue_type);

-- ============================================================================
-- COMMON MISTAKES TABLE (extracted from "Watch Out Points")
-- ============================================================================
CREATE TABLE common_mistakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
    mistake_description TEXT NOT NULL,
    correction TEXT,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_common_mistakes_movement ON common_mistakes(movement_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE movements IS 'Core Pilates movement catalog extracted from Excel tracker';
COMMENT ON TABLE muscle_groups IS 'Muscle groups and movement goals from Excel';
COMMENT ON TABLE movement_muscles IS 'Many-to-many relationship: movements to muscle groups';
COMMENT ON TABLE sequence_rules IS 'Class planning rules for safe, effective sequencing (CRITICAL)';
COMMENT ON TABLE transitions IS 'Position-based transition narratives for smooth class flow';
COMMENT ON TABLE teaching_cues IS 'Cueing strategies and imagery for each movement';
COMMENT ON TABLE common_mistakes IS 'Common errors and corrections extracted from "Watch Out Points"';

COMMENT ON COLUMN movements.excel_row_number IS 'Original Excel row for traceability';
COMMENT ON COLUMN movements.difficulty_level IS 'Beginner, Intermediate, or Advanced';
COMMENT ON COLUMN movements.setup_position IS 'Starting position: Supine, Prone, Kneeling, Seated, Side-lying';
COMMENT ON COLUMN sequence_rules.enforcement_level IS 'strict=must enforce, recommended=warn, optional=suggest';
