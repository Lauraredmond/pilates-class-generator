-- ============================================================================
-- Migration 036: Create Class Tracking & Quality Log Tables
-- ============================================================================
-- Purpose: Enable historical repertoire tracking and rule compliance monitoring
-- Created: December 24, 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table 1: class_movements
-- ============================================================================
-- Purpose: Track which movements were used in which classes (historical usage)
-- Enables: "Ensure full movement repertoire coverage over time" (Rule 3)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS class_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    class_plan_id UUID,  -- Nullable in case class was deleted
    movement_id UUID NOT NULL,
    movement_name VARCHAR(255) NOT NULL,  -- Denormalized for performance

    -- Class context
    class_generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    difficulty_level VARCHAR(50),

    -- Movement position in class
    position_in_sequence INTEGER,  -- 1, 2, 3, etc.

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_user_id FOREIGN KEY (user_id)
        REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_plan_id FOREIGN KEY (class_plan_id)
        REFERENCES class_plans(id) ON DELETE SET NULL,
    CONSTRAINT fk_movement_id FOREIGN KEY (movement_id)
        REFERENCES movements(id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX idx_class_movements_user ON class_movements(user_id, class_generated_at DESC);
CREATE INDEX idx_class_movements_movement ON class_movements(movement_id);
CREATE INDEX idx_class_movements_date ON class_movements(DATE(class_generated_at));

-- Enable RLS
ALTER TABLE class_movements ENABLE ROW LEVEL SECURITY;

-- Users can only see their own movement history
CREATE POLICY "Users can view own class movements" ON class_movements
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own movement history
CREATE POLICY "Users can create own class movements" ON class_movements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE class_movements IS 'Tracks which movements appeared in which classes for historical repertoire coverage analysis. Enables Rule 3: "Ensure full movement repertoire coverage over time"';

-- ============================================================================
-- Table 2: class_quality_log
-- ============================================================================
-- Purpose: Log rule compliance for each generated class
-- Enables: Quality tracking, continuous improvement, rule enforcement monitoring
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS class_quality_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    class_plan_id UUID,  -- Nullable in case class was deleted

    -- Class metadata
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    difficulty_level VARCHAR(50),
    target_duration_minutes INTEGER,
    movement_count INTEGER,

    -- RULE 1: Don't repeat muscle usage (consecutive overlap)
    rule1_muscle_repetition_pass BOOLEAN NOT NULL,
    rule1_max_consecutive_overlap_pct FLOAT,  -- Highest consecutive muscle overlap %
    rule1_failed_pairs JSON,  -- [{from: "Movement A", to: "Movement B", overlap_pct: 75}]

    -- RULE 2: Don't overuse movement families
    rule2_family_balance_pass BOOLEAN NOT NULL,
    rule2_max_family_pct FLOAT,  -- Highest family % (should be <40%)
    rule2_overrepresented_families JSON,  -- [{"family": "Roll & Spine Articulation", "pct": 50}]

    -- RULE 3: Historical repertoire coverage
    rule3_repertoire_coverage_pass BOOLEAN NOT NULL,
    rule3_unique_movements_count INTEGER,  -- How many unique movements across all history
    rule3_underutilized_muscles JSON,  -- [{"muscle": "Hip Flexors", "pct_of_classes": 15}]
    rule3_stalest_movement_days INTEGER,  -- Days since stalest movement was last used

    -- Overall quality score
    overall_pass BOOLEAN NOT NULL,  -- TRUE only if all 3 rules pass
    quality_score FLOAT,  -- 0.0 to 1.0 composite score

    -- Additional metrics
    muscle_balance JSON,  -- Full muscle balance map
    family_distribution JSON,  -- Full family distribution

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_user_id FOREIGN KEY (user_id)
        REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_plan_id FOREIGN KEY (class_plan_id)
        REFERENCES class_plans(id) ON DELETE SET NULL
);

-- Indexes for analytics
CREATE INDEX idx_quality_log_user ON class_quality_log(user_id, generated_at DESC);
CREATE INDEX idx_quality_log_overall_pass ON class_quality_log(overall_pass);
CREATE INDEX idx_quality_log_date ON class_quality_log(DATE(generated_at));

-- Enable RLS
ALTER TABLE class_quality_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own quality logs
CREATE POLICY "Users can view own quality logs" ON class_quality_log
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own quality logs
CREATE POLICY "Users can create own quality logs" ON class_quality_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all quality logs (for platform analytics)
CREATE POLICY "Admins can view all quality logs" ON class_quality_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

COMMENT ON TABLE class_quality_log IS 'Quality assurance log tracking rule compliance for each generated class. Monitors: Rule 1 (muscle repetition), Rule 2 (family balance), Rule 3 (repertoire coverage).';

-- ============================================================================
-- Create summary views for analytics
-- ============================================================================

-- View 1: User quality statistics
CREATE OR REPLACE VIEW user_quality_statistics AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(*) as total_classes_generated,
    COUNT(*) FILTER (WHERE overall_pass = TRUE) as classes_passed,
    COUNT(*) FILTER (WHERE overall_pass = FALSE) as classes_failed,
    ROUND((COUNT(*) FILTER (WHERE overall_pass = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC, 1) as pass_rate_pct,

    -- Rule-specific pass rates
    ROUND((COUNT(*) FILTER (WHERE rule1_muscle_repetition_pass = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC, 1) as rule1_pass_rate,
    ROUND((COUNT(*) FILTER (WHERE rule2_family_balance_pass = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC, 1) as rule2_pass_rate,
    ROUND((COUNT(*) FILTER (WHERE rule3_repertoire_coverage_pass = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC, 1) as rule3_pass_rate,

    -- Average scores
    ROUND(AVG(quality_score)::NUMERIC, 3) as avg_quality_score,
    ROUND(AVG(rule1_max_consecutive_overlap_pct)::NUMERIC, 1) as avg_consecutive_overlap,
    ROUND(AVG(rule2_max_family_pct)::NUMERIC, 1) as avg_max_family_pct,

    -- Movement repertoire
    ROUND(AVG(rule3_unique_movements_count)::NUMERIC, 0) as avg_unique_movements,
    MIN(generated_at) as first_class_date,
    MAX(generated_at) as most_recent_class_date
FROM user_profiles u
LEFT JOIN class_quality_log cql ON u.id = cql.user_id
GROUP BY u.id, u.email;

COMMENT ON VIEW user_quality_statistics IS 'Aggregated quality statistics per user showing rule compliance rates and quality trends';

-- View 2: Platform-wide quality metrics (admin-only via RLS)
CREATE OR REPLACE VIEW platform_quality_metrics AS
SELECT
    DATE(generated_at) as date,
    COUNT(*) as classes_generated,
    COUNT(*) FILTER (WHERE overall_pass = TRUE) as classes_passed,
    ROUND((COUNT(*) FILTER (WHERE overall_pass = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC, 1) as pass_rate_pct,

    -- Rule failures
    COUNT(*) FILTER (WHERE NOT rule1_muscle_repetition_pass) as rule1_failures,
    COUNT(*) FILTER (WHERE NOT rule2_family_balance_pass) as rule2_failures,
    COUNT(*) FILTER (WHERE NOT rule3_repertoire_coverage_pass) as rule3_failures,

    -- Average quality
    ROUND(AVG(quality_score)::NUMERIC, 3) as avg_quality_score
FROM class_quality_log
GROUP BY DATE(generated_at)
ORDER BY DATE(generated_at) DESC;

COMMENT ON VIEW platform_quality_metrics IS 'Daily platform-wide quality metrics for continuous improvement monitoring';

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
/*
-- Check tables created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('class_movements', 'class_quality_log')
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('class_movements', 'class_quality_log')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('class_movements', 'class_quality_log')
ORDER BY tablename, policyname;

-- Check views created
SELECT table_name, table_type
FROM information_schema.views
WHERE table_name IN ('user_quality_statistics', 'platform_quality_metrics');
*/

-- ============================================================================
-- Rollback script (save separately)
-- ============================================================================
/*
BEGIN;

DROP VIEW IF EXISTS platform_quality_metrics;
DROP VIEW IF EXISTS user_quality_statistics;
DROP TABLE IF EXISTS class_quality_log;
DROP TABLE IF EXISTS class_movements;

COMMIT;
*/
