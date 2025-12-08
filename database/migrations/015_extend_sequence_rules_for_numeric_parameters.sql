-- Migration 015: Extend sequence_rules for Numeric Parameters
-- Created: 2025-12-04
-- Purpose: Add numeric fields to sequence_rules so code can query values directly
--
-- PROBLEM:
-- - Rules 1-2 say "8-12 movements" but that's TEXT in description field
-- - Frontend hardcodes SECTION_DURATIONS = {PREPARATION: 240, WARMUP: 180, ...}
-- - Backend hardcodes MINUTES_PER_MOVEMENT = {Beginner: 4, Intermediate: 5, Advanced: 6}
-- - Backend hardcodes TRANSITION_TIME_MINUTES = 1
-- - Any changes require code deployment instead of simple database update
--
-- SOLUTION:
-- - Extend sequence_rules to support both qualitative (description) and quantitative (numeric) rules
-- - Add columns: parameter_key, value_numeric, value_unit, difficulty_level
-- - Code queries parameters from database instead of hardcoding
-- - Business stakeholders can adjust values without engineering changes

-- ============================================================================
-- ADD COLUMNS TO SEQUENCE_RULES
-- ============================================================================

-- Add parameter_key for code to reference specific rules
ALTER TABLE sequence_rules
    ADD COLUMN parameter_key VARCHAR(100),  -- e.g., 'preparation_duration', 'beginner_teaching_time'
    ADD COLUMN value_numeric INTEGER,       -- Numeric value (seconds or count)
    ADD COLUMN value_unit VARCHAR(20),      -- 'seconds', 'minutes', 'count'
    ADD COLUMN difficulty_level VARCHAR(20), -- NULL (all levels) or 'Beginner', 'Intermediate', 'Advanced'
    ADD COLUMN business_rationale TEXT,     -- WHY this value was chosen
    ADD COLUMN last_changed_by VARCHAR(100),-- User who last changed this value
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for fast parameter lookups
CREATE INDEX idx_sequence_rules_parameter_key ON sequence_rules(parameter_key) WHERE parameter_key IS NOT NULL;

-- ============================================================================
-- INSERT NUMERIC PLANNING PARAMETERS
-- ============================================================================

-- SECTION DURATIONS (from frontend/src/services/classAssembly.ts)
INSERT INTO sequence_rules
    (rule_number, description, rule_type, is_required, enforcement_level, parameter_key, value_numeric, value_unit, business_rationale)
VALUES
    (
        11,
        'Preparation section should be 4 minutes to allow students to center, breathe, and understand Pilates principles',
        'quality',
        true,
        'strict',
        'preparation_duration',
        240,
        'seconds',
        'Students need ~4 minutes to mentally transition into class and focus on breath before movement'
    ),
    (
        12,
        'Warmup section should be 3 minutes for safe joint mobilization and spinal preparation',
        'safety',
        true,
        'strict',
        'warmup_duration',
        180,
        'seconds',
        'Research shows 3 minutes sufficient for joint prep without fatiguing students'
    ),
    (
        13,
        'Cooldown section should be 3 minutes for post-class stretching and recovery',
        'safety',
        true,
        'strict',
        'cooldown_duration',
        180,
        'seconds',
        'Minimum 3 minutes needed to safely stretch all muscle groups worked during class'
    ),
    (
        14,
        'Meditation section should be 4 minutes for body scan, gratitude, or breath meditation',
        'quality',
        true,
        'recommended',
        'meditation_duration',
        240,
        'seconds',
        'Research shows 4 minutes is sweet spot for mental benefits without losing attention'
    ),
    (
        15,
        'HomeCare advice section should be 1 minute for actionable wellness tips',
        'quality',
        true,
        'recommended',
        'homecare_duration',
        60,
        'seconds',
        'Brief 1-minute advice keeps students engaged without overwhelming them'
    );

-- TEACHING TIME PER MOVEMENT (from backend/orchestrator/tools/sequence_tools.py)
INSERT INTO sequence_rules
    (rule_number, description, rule_type, is_required, enforcement_level, parameter_key, value_numeric, value_unit, difficulty_level, business_rationale)
VALUES
    (
        16,
        'Beginner students need 4 minutes per movement for explanation, demonstration, and practice',
        'progression',
        true,
        'strict',
        'teaching_time_per_movement',
        240,
        'seconds',
        'Beginner',
        'Beginners need time to understand setup, execution, breath pattern, and attempt movement safely'
    ),
    (
        17,
        'Intermediate students need 5 minutes per movement to refine form and alignment',
        'progression',
        true,
        'strict',
        'teaching_time_per_movement',
        300,
        'seconds',
        'Intermediate',
        'Intermediate students benefit from additional time refining alignment and breath coordination'
    ),
    (
        18,
        'Advanced students need 6 minutes per movement to perfect precision and control',
        'progression',
        true,
        'strict',
        'teaching_time_per_movement',
        360,
        'seconds',
        'Advanced',
        'Classical Pilates: advanced practice is about precision, not speed. More time = better execution.'
    );

-- TRANSITION TIME (from backend/orchestrator/tools/sequence_tools.py)
INSERT INTO sequence_rules
    (rule_number, description, rule_type, is_required, enforcement_level, parameter_key, value_numeric, value_unit, business_rationale)
VALUES
    (
        19,
        'Transitions between movements should allow 1 minute for safe position changes',
        'safety',
        true,
        'strict',
        'transition_time',
        60,
        'seconds',
        'Analysis of position transitions (e.g., Supine → Prone): 1 minute needed for controlled transitions'
    );

-- ============================================================================
-- UPDATE EXISTING RULES WITH NUMERIC VALUES
-- ============================================================================

-- Rule 1: "8-12 movements per hour" → Add numeric min/max
UPDATE sequence_rules
SET
    parameter_key = 'min_movements_per_hour',
    value_numeric = 8,
    value_unit = 'count',
    business_rationale = 'Fewer than 8 movements = insufficient variety and muscle balance'
WHERE rule_number = 1;

INSERT INTO sequence_rules
    (rule_number, description, rule_type, is_required, enforcement_level, parameter_key, value_numeric, value_unit, business_rationale)
VALUES
    (
        20,
        'Maximum 12 movements in a 60-minute class to allow proper teaching time',
        'quality',
        true,
        'strict',
        'max_movements_per_hour',
        12,
        'count',
        'More than 12 movements = rushing, insufficient teaching time. Safety risk and poor form.'
    );

-- Rule 2: "8 for beginner, 12 for advanced" → Split into two numeric rules
INSERT INTO sequence_rules
    (rule_number, description, rule_type, is_required, enforcement_level, parameter_key, value_numeric, value_unit, difficulty_level, business_rationale)
VALUES
    (
        21,
        'Beginner and Intermediate classes should target 8 movements in a 60-minute class',
        'progression',
        true,
        'strict',
        'target_movements_per_hour',
        8,
        'count',
        'Beginner',
        'With 4-5 minutes per movement + transitions, 8 movements fits in 60 minutes'
    ),
    (
        22,
        'Advanced classes should target 12 movements in a 60-minute class',
        'progression',
        true,
        'strict',
        'target_movements_per_hour',
        12,
        'count',
        'Advanced',
        'Advanced students can handle 12 movements with 6 minutes each + transitions'
    );

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN sequence_rules.parameter_key IS 'Unique key for code to query specific numeric parameters (NULL for qualitative rules)';
COMMENT ON COLUMN sequence_rules.value_numeric IS 'Numeric value (seconds for durations, count for movements)';
COMMENT ON COLUMN sequence_rules.value_unit IS 'Unit: seconds, minutes, or count';
COMMENT ON COLUMN sequence_rules.difficulty_level IS 'NULL (applies to all) or specific: Beginner, Intermediate, Advanced';
COMMENT ON COLUMN sequence_rules.business_rationale IS 'WHY this value was chosen (for stakeholder transparency)';
COMMENT ON COLUMN sequence_rules.last_changed_by IS 'Email of user who last modified this rule (audit trail)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all numeric parameters
-- SELECT
--     rule_number,
--     parameter_key,
--     value_numeric,
--     value_unit,
--     difficulty_level,
--     description
-- FROM sequence_rules
-- WHERE parameter_key IS NOT NULL
-- ORDER BY rule_number;

-- Check section durations
-- SELECT
--     parameter_key,
--     value_numeric / 60 AS minutes,
--     description
-- FROM sequence_rules
-- WHERE parameter_key LIKE '%_duration';

-- Check teaching times by difficulty
-- SELECT
--     difficulty_level,
--     value_numeric / 60 AS minutes_per_movement,
--     description
-- FROM sequence_rules
-- WHERE parameter_key = 'teaching_time_per_movement'
-- ORDER BY difficulty_level;

-- ============================================================================
-- EXAMPLE: How Code Should Query Parameters
-- ============================================================================

-- Example 1: Get preparation duration
-- SELECT value_numeric FROM sequence_rules WHERE parameter_key = 'preparation_duration';
-- Returns: 240 (seconds)

-- Example 2: Get teaching time for Beginner
-- SELECT value_numeric FROM sequence_rules WHERE parameter_key = 'teaching_time_per_movement' AND difficulty_level = 'Beginner';
-- Returns: 240 (seconds)

-- Example 3: Get ALL section durations
-- SELECT parameter_key, value_numeric, description
-- FROM sequence_rules
-- WHERE parameter_key LIKE '%_duration'
-- ORDER BY rule_number;
