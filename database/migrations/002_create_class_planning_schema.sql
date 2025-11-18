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
