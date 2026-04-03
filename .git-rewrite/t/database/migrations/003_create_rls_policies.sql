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
