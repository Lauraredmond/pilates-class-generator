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
-- Migration 002: Class Planning & User Schema
-- Created: 2025-11-14
-- Purpose: Tables for class plans, users, and historical tracking

-- ============================================================================
-- USERS TABLE (with PII tokenization)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_token VARCHAR(255) UNIQUE NOT NULL, -- Tokenized email (PII)
    full_name_token VARCHAR(255), -- Tokenized name (PII)

    -- Non-PII user data
    role VARCHAR(50) DEFAULT 'instructor', -- instructor, admin, student
    preferences JSONB DEFAULT '{}'::jsonb,

    -- Account status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Updated timestamp trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PII TOKENS TABLE (Secure storage for tokenized PII)
-- ============================================================================
CREATE TABLE pii_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    encrypted_value TEXT NOT NULL, -- AES-256 encrypted PII
    pii_type VARCHAR(50) NOT NULL, -- email, name, phone, address
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pii_tokens_token ON pii_tokens(token);
CREATE INDEX idx_pii_tokens_type ON pii_tokens(pii_type);

-- ============================================================================
-- CLASS PLANS TABLE
-- ============================================================================
CREATE TABLE class_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Class details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(20), -- Beginner, Intermediate, Advanced, Mixed
    duration_minutes INTEGER DEFAULT 60,

    -- Planning metadata
    target_audience VARCHAR(100), -- General, Post-injury, Pregnancy, Athletes, etc.
    focus_areas JSONB DEFAULT '[]'::jsonb, -- ["core", "flexibility", "balance"]

    -- Class structure
    total_movements INTEGER,
    warm_up_movements JSONB DEFAULT '[]'::jsonb, -- Array of movement IDs
    main_sequence JSONB DEFAULT '[]'::jsonb, -- Array of movement IDs with order
    cool_down_movements JSONB DEFAULT '[]'::jsonb, -- Array of movement IDs

    -- AI/Agent metadata
    generated_by_ai BOOLEAN DEFAULT false,
    ai_agent_version VARCHAR(50),
    sequence_validation_passed BOOLEAN DEFAULT false,
    validation_notes TEXT,

    -- Class status
    status VARCHAR(50) DEFAULT 'draft', -- draft, ready, published, archived
    is_template BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    last_taught_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_class_plans_user ON class_plans(user_id);
CREATE INDEX idx_class_plans_difficulty ON class_plans(difficulty_level);
CREATE INDEX idx_class_plans_status ON class_plans(status);
CREATE INDEX idx_class_plans_is_template ON class_plans(is_template);

CREATE TRIGGER update_class_plans_updated_at
    BEFORE UPDATE ON class_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLASS MOVEMENTS (Junction table with sequence order)
-- ============================================================================
CREATE TABLE class_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_plan_id UUID NOT NULL REFERENCES class_plans(id) ON DELETE CASCADE,
    movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,

    -- Sequencing
    sequence_order INTEGER NOT NULL,
    section VARCHAR(50) NOT NULL, -- warmup, main, cooldown

    -- Movement customization for this class
    level_used VARCHAR(10), -- L1, L2, FV
    duration_override INTEGER, -- Override default duration
    special_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_plan_id, sequence_order, section)
);

CREATE INDEX idx_class_movements_class_plan ON class_movements(class_plan_id);
CREATE INDEX idx_class_movements_movement ON class_movements(movement_id);
CREATE INDEX idx_class_movements_sequence ON class_movements(class_plan_id, sequence_order);

-- ============================================================================
-- CLASS HISTORY (Tracking taught classes for analytics)
-- ============================================================================
CREATE TABLE class_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_plan_id UUID REFERENCES class_plans(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Class execution details
    taught_date DATE NOT NULL,
    actual_duration_minutes INTEGER,
    attendance_count INTEGER,

    -- Snapshot of movements used (in case class plan changes later)
    movements_snapshot JSONB NOT NULL,

    -- Feedback and notes
    instructor_notes TEXT,
    student_feedback JSONB DEFAULT '[]'::jsonb,
    difficulty_rating DECIMAL(3,2), -- 1.00 to 5.00

    -- Analytics data
    muscle_groups_targeted JSONB DEFAULT '[]'::jsonb,
    total_movements_taught INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_class_history_user ON class_history(user_id);
CREATE INDEX idx_class_history_date ON class_history(taught_date);
CREATE INDEX idx_class_history_class_plan ON class_history(class_plan_id);

-- ============================================================================
-- MOVEMENT USAGE TRACKING (for Rule #4: avoid overuse)
-- ============================================================================
CREATE TABLE movement_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,

    -- Usage tracking
    last_used_date DATE NOT NULL,
    usage_count INTEGER DEFAULT 1,
    weeks_since_last_use INTEGER, -- Calculated field

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, movement_id)
);

CREATE INDEX idx_movement_usage_user ON movement_usage(user_id);
CREATE INDEX idx_movement_usage_movement ON movement_usage(movement_id);
CREATE INDEX idx_movement_usage_last_used ON movement_usage(last_used_date);

CREATE TRIGGER update_movement_usage_updated_at
    BEFORE UPDATE ON movement_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STUDENT PROFILES (for injury tracking and customization)
-- ============================================================================
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Student info (tokenized)
    student_name_token VARCHAR(255) NOT NULL,
    student_email_token VARCHAR(255),

    -- Health and fitness data
    fitness_level VARCHAR(50), -- Beginner, Intermediate, Advanced
    injuries JSONB DEFAULT '[]'::jsonb, -- [{ area: "lower_back", severity: "mild", date: "2024-01-01" }]
    modifications_needed JSONB DEFAULT '[]'::jsonb,
    goals JSONB DEFAULT '[]'::jsonb,

    -- Preferences
    preferred_difficulty VARCHAR(20),
    avoid_movements JSONB DEFAULT '[]'::jsonb, -- Array of movement IDs to avoid
    favorite_movements JSONB DEFAULT '[]'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_student_profiles_instructor ON student_profiles(instructor_id);
CREATE INDEX idx_student_profiles_is_active ON student_profiles(is_active);

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with tokenized PII for GDPR compliance';
COMMENT ON TABLE pii_tokens IS 'Secure encrypted storage for PII (emails, names, etc.)';
COMMENT ON TABLE class_plans IS 'Saved class plans with AI-generated sequences';
COMMENT ON TABLE class_movements IS 'Junction table linking movements to class plans with order';
COMMENT ON TABLE class_history IS 'Historical record of taught classes for analytics';
COMMENT ON TABLE movement_usage IS 'Tracks movement usage to prevent overuse (Rule #4)';
COMMENT ON TABLE student_profiles IS 'Student information for customized class planning';

COMMENT ON COLUMN class_plans.generated_by_ai IS 'True if sequence was AI-generated, false if manual';
COMMENT ON COLUMN class_plans.sequence_validation_passed IS 'True if all safety rules validated';
COMMENT ON COLUMN class_movements.level_used IS 'L1, L2, or FV for this specific class';
COMMENT ON COLUMN movement_usage.weeks_since_last_use IS 'Auto-calculated for variety enforcement';
COMMENT ON COLUMN student_profiles.avoid_movements IS 'Movements to avoid due to injuries (Rule #10)';
-- Migration 003: Row Level Security (RLS) Policies
-- Created: 2025-11-14
-- Purpose: Implement GDPR-compliant access control

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ POLICIES (Reference Data)
-- ============================================================================

-- Anyone can read movements (public reference data)
CREATE POLICY "Movements are publicly readable"
    ON movements FOR SELECT
    USING (true);

-- Anyone can read muscle groups
CREATE POLICY "Muscle groups are publicly readable"
    ON muscle_groups FOR SELECT
    USING (true);

-- Anyone can read movement-muscle mappings
CREATE POLICY "Movement muscles are publicly readable"
    ON movement_muscles FOR SELECT
    USING (true);

-- Anyone can read sequence rules (safety-critical, should be public)
CREATE POLICY "Sequence rules are publicly readable"
    ON sequence_rules FOR SELECT
    USING (true);

-- Anyone can read transitions
CREATE POLICY "Transitions are publicly readable"
    ON transitions FOR SELECT
    USING (true);

-- Anyone can read teaching cues
CREATE POLICY "Teaching cues are publicly readable"
    ON teaching_cues FOR SELECT
    USING (true);

-- Anyone can read common mistakes
CREATE POLICY "Common mistakes are publicly readable"
    ON common_mistakes FOR SELECT
    USING (true);

-- ============================================================================
-- USER ACCESS POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- PII TOKEN POLICIES (Highly Restricted)
-- ============================================================================

-- Only service role can access PII tokens (backend only)
CREATE POLICY "PII tokens are service-role only"
    ON pii_tokens FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- CLASS PLAN POLICIES
-- ============================================================================

-- Users can view their own class plans
CREATE POLICY "Users can view own class plans"
    ON class_plans FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own class plans
CREATE POLICY "Users can create own class plans"
    ON class_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own class plans
CREATE POLICY "Users can update own class plans"
    ON class_plans FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own class plans
CREATE POLICY "Users can delete own class plans"
    ON class_plans FOR DELETE
    USING (auth.uid() = user_id);

-- Anyone can view published templates
CREATE POLICY "Templates are publicly readable"
    ON class_plans FOR SELECT
    USING (is_template = true AND status = 'published');

-- ============================================================================
-- CLASS MOVEMENTS POLICIES
-- ============================================================================

-- Users can view movements in their own class plans
CREATE POLICY "Users can view own class movements"
    ON class_movements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM class_plans
            WHERE class_plans.id = class_movements.class_plan_id
            AND class_plans.user_id = auth.uid()
        )
    );

-- Users can add movements to their own class plans
CREATE POLICY "Users can add movements to own class plans"
    ON class_movements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM class_plans
            WHERE class_plans.id = class_movements.class_plan_id
            AND class_plans.user_id = auth.uid()
        )
    );

-- Users can modify movements in their own class plans
CREATE POLICY "Users can update movements in own class plans"
    ON class_movements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM class_plans
            WHERE class_plans.id = class_movements.class_plan_id
            AND class_plans.user_id = auth.uid()
        )
    );

-- Users can remove movements from their own class plans
CREATE POLICY "Users can delete movements from own class plans"
    ON class_movements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM class_plans
            WHERE class_plans.id = class_movements.class_plan_id
            AND class_plans.user_id = auth.uid()
        )
    );

-- ============================================================================
-- CLASS HISTORY POLICIES
-- ============================================================================

-- Users can view their own class history
CREATE POLICY "Users can view own class history"
    ON class_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own class history
CREATE POLICY "Users can create own class history"
    ON class_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own class history (notes, feedback)
CREATE POLICY "Users can update own class history"
    ON class_history FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- MOVEMENT USAGE POLICIES
-- ============================================================================

-- Users can view their own movement usage
CREATE POLICY "Users can view own movement usage"
    ON movement_usage FOR SELECT
    USING (auth.uid() = user_id);

-- System can update movement usage (automated tracking)
CREATE POLICY "Movement usage can be tracked"
    ON movement_usage FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- STUDENT PROFILES POLICIES
-- ============================================================================

-- Instructors can view their own student profiles
CREATE POLICY "Instructors can view own students"
    ON student_profiles FOR SELECT
    USING (auth.uid() = instructor_id);

-- Instructors can create student profiles
CREATE POLICY "Instructors can create student profiles"
    ON student_profiles FOR INSERT
    WITH CHECK (auth.uid() = instructor_id);

-- Instructors can update their own student profiles
CREATE POLICY "Instructors can update own students"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = instructor_id);

-- Instructors can delete their own student profiles (GDPR right to erasure)
CREATE POLICY "Instructors can delete own students"
    ON student_profiles FOR DELETE
    USING (auth.uid() = instructor_id);

-- ============================================================================
-- ADMIN POLICIES (for reference data management)
-- ============================================================================

-- Admins can manage movements
CREATE POLICY "Admins can manage movements"
    ON movements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can manage muscle groups
CREATE POLICY "Admins can manage muscle groups"
    ON muscle_groups FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can manage teaching cues
CREATE POLICY "Admins can manage teaching cues"
    ON teaching_cues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Movements are publicly readable" ON movements IS
'Movements are reference data, safe to expose publicly';

COMMENT ON POLICY "PII tokens are service-role only" ON pii_tokens IS
'CRITICAL: PII tokens must only be accessed by backend service role, never by client';

COMMENT ON POLICY "Users can view own class plans" ON class_plans IS
'Users can only see their own class plans (privacy)';

COMMENT ON POLICY "Templates are publicly readable" ON class_plans IS
'Published templates are shareable community resources';

COMMENT ON POLICY "Instructors can delete own students" ON student_profiles IS
'Implements GDPR right to erasure - instructors can delete student data';
-- Migration 004: Replace Excel References with Production Fields
-- Created: 2025-11-14
-- Purpose: Replace migration artifacts with proper production fields

-- ============================================================================
-- REPLACE EXCEL COLUMNS WITH PRODUCTION FIELDS
-- ============================================================================

-- 1. Add new production-ready columns
ALTER TABLE movements ADD COLUMN IF NOT EXISTS movement_number INTEGER;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 2. Populate movement_number from difficulty_rank (if not already set)
UPDATE movements SET movement_number = difficulty_rank WHERE movement_number IS NULL;

-- 3. Populate code from name (kebab-case version)
UPDATE movements SET code = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '_', 'g')) WHERE code IS NULL;

-- 4. Make movement_number unique and not null
ALTER TABLE movements ALTER COLUMN movement_number SET NOT NULL;
ALTER TABLE movements ADD CONSTRAINT movements_movement_number_unique UNIQUE (movement_number);

-- 5. Make code unique
ALTER TABLE movements ADD CONSTRAINT movements_code_unique UNIQUE (code);

-- 6. Drop old Excel-specific columns and deprecated difficulty_rank
ALTER TABLE movements DROP COLUMN IF EXISTS excel_row_number;
ALTER TABLE movements DROP COLUMN IF EXISTS excel_id;
ALTER TABLE movements DROP COLUMN IF EXISTS created_from_excel;
ALTER TABLE movements DROP COLUMN IF EXISTS difficulty_rank;

-- 7. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_movements_movement_number ON movements(movement_number);
CREATE INDEX IF NOT EXISTS idx_movements_code ON movements(code);

-- 8. Update comments
COMMENT ON TABLE movements IS 'Core Pilates movement catalog (34 classical mat movements)';
COMMENT ON COLUMN movements.movement_number IS 'Sequential movement number (1-34) for classical Pilates order';
COMMENT ON COLUMN movements.code IS 'URL-friendly identifier (e.g., "the_hundred", "roll_up")';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration:

-- Check schema:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'movements'
-- ORDER BY ordinal_position;

-- Check data:
-- SELECT movement_number, code, name, difficulty_level
-- FROM movements
-- ORDER BY movement_number
-- LIMIT 10;
