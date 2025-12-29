-- ============================================================================
-- Migration 037: Early Skip Analytics
-- ============================================================================
-- Purpose: Track section-level playback events to identify early skips
-- Created: December 29, 2025
-- Context: Admin-only analytics to understand user engagement patterns
-- ============================================================================
--
-- Early Skip Definition:
--   - User leaves a section before completing minimum engagement time
--   - Threshold: 60 seconds for most sections, 20 seconds for transitions
--   - Does NOT count as early skip if section naturally completes (timer runs out)
--
-- Use Cases:
--   - Identify movements that users skip frequently (content quality issue)
--   - Detect sections that are too long or not engaging
--   - Understand which preparation/warmup/cooldown content resonates
--   - Prioritize content improvement based on skip rates
--
-- Performance:
--   - Low frequency: Only 2 events per section (start + end)
--   - Small payloads: ~200 bytes per request
--   - Indexed for fast querying by user, session, movement, section type
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table: playback_section_events
-- ============================================================================
-- Purpose: Track individual section playback events (prep, warmup, each movement, cooldown, etc.)
-- Scope: All section types EXCEPT transitions (as they're only 20s long and auto-advance)
-- Granularity: One row per section per play session
-- ----------------------------------------------------------------------------

CREATE TABLE playback_section_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    play_session_id UUID NOT NULL,  -- FK to class_play_sessions (session-level tracking)
    class_plan_id UUID,  -- Nullable: class may be deleted or ad-hoc playback

    -- ========================================================================
    -- Section Identification
    -- ========================================================================
    section_type VARCHAR(50) NOT NULL CHECK (section_type IN (
        'preparation',  -- Pilates principles, breathing, centering
        'warmup',       -- Gentle movements to prepare body
        'movement',     -- Individual Pilates movements (tracked separately)
        'transition',   -- Position changes between movements (NOT tracked per requirements)
        'cooldown',     -- Post-workout stretches
        'meditation',   -- Closing meditation/breathing
        'homecare'      -- Home care advice
    )),
    section_index INTEGER NOT NULL CHECK (section_index >= 0),  -- 0-based position in playback sequence

    -- Movement-specific fields (only populated when section_type = 'movement')
    movement_id UUID,  -- FK to movements table
    movement_name VARCHAR(255),  -- Denormalized for performance (avoid joins)

    -- ========================================================================
    -- Timing Data
    -- ========================================================================
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When section playback began
    ended_at TIMESTAMPTZ,  -- When section ended (NULL = still playing)
    duration_seconds INTEGER,  -- Computed: EXTRACT(EPOCH FROM (ended_at - started_at))
    planned_duration_seconds INTEGER NOT NULL,  -- From PlaybackItem.duration_seconds

    -- ========================================================================
    -- Exit Reason & Early Skip Detection
    -- ========================================================================
    ended_reason VARCHAR(50) CHECK (ended_reason IN (
        'completed',         -- Timer ran out naturally (NOT an early skip)
        'skipped_next',      -- User pressed Next button
        'skipped_previous',  -- User pressed Previous button
        'exited',            -- User exited playback mid-section
        'jumped'             -- User jumped to different section (future: seek bar)
    )),

    -- Computed server-side in section-end endpoint
    -- Early skip = duration < threshold AND ended_reason != 'completed'
    -- Threshold: 60s for most sections, 20s for transitions
    is_early_skip BOOLEAN,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,

    -- ========================================================================
    -- Foreign Keys
    -- ========================================================================
    CONSTRAINT fk_play_session FOREIGN KEY (play_session_id)
        REFERENCES class_play_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_plan FOREIGN KEY (class_plan_id)
        REFERENCES class_plans(id) ON DELETE SET NULL,
    CONSTRAINT fk_movement FOREIGN KEY (movement_id)
        REFERENCES movements(id) ON DELETE SET NULL
);

-- ============================================================================
-- Indexes for Fast Querying
-- ============================================================================
-- Purpose: Enable sub-second queries for analytics dashboards
-- Strategy: Cover most common query patterns (user history, movement analysis, skip detection)
-- ----------------------------------------------------------------------------

-- User history queries (e.g., "Show me my playback history")
CREATE INDEX idx_section_events_user_time ON playback_section_events(user_id, created_at DESC);

-- Session detail queries (e.g., "What sections did user play in this session?")
CREATE INDEX idx_section_events_session ON playback_section_events(play_session_id);

-- Movement analysis (e.g., "Which movements get skipped most?")
-- Partial index: Only index movement rows (saves 50% space)
CREATE INDEX idx_section_events_movement ON playback_section_events(movement_id, is_early_skip)
    WHERE movement_id IS NOT NULL;

-- Skip rate by section type (e.g., "Do users skip warmups more than cooldowns?")
CREATE INDEX idx_section_events_type_skip ON playback_section_events(section_type, is_early_skip)
    WHERE is_early_skip IS NOT NULL;  -- Only completed sections

-- Early skip detection queries (e.g., "Show all early skips in last 7 days")
-- Partial index: Only index early skip = TRUE (saves 80%+ space)
CREATE INDEX idx_section_events_early_skip ON playback_section_events(is_early_skip, created_at DESC)
    WHERE is_early_skip = TRUE;

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
-- Purpose: Users can only see their own playback data
-- Note: Admin access granted via separate policy (is_admin field in user_profiles)
-- ----------------------------------------------------------------------------

ALTER TABLE playback_section_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own section events
CREATE POLICY "Users can view own section events" ON playback_section_events
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own section events
CREATE POLICY "Users can insert own section events" ON playback_section_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own section events (for ending incomplete sections)
CREATE POLICY "Users can update own section events" ON playback_section_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin users can view all section events (for platform-wide analytics)
-- Note: Requires is_admin field in user_profiles table
CREATE POLICY "Admins can view all section events" ON playback_section_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================================================
-- View: early_skip_statistics
-- ============================================================================
-- Purpose: Aggregated skip rates by section type and movement
-- Use Case: Admin dashboard charts and reports
-- Performance: Pre-aggregated for fast queries (no need to count rows on every page load)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW early_skip_statistics AS
SELECT
    section_type,
    movement_id,
    movement_name,

    -- Play counts
    COUNT(*) as total_plays,
    COUNT(*) FILTER (WHERE is_early_skip = TRUE) as early_skips,
    COUNT(*) FILTER (WHERE is_early_skip = FALSE) as completed_plays,

    -- Skip rate
    ROUND(
        (COUNT(*) FILTER (WHERE is_early_skip = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC,
        1
    ) as early_skip_rate_pct,

    -- Duration statistics
    ROUND(AVG(duration_seconds)::NUMERIC, 1) as avg_duration_seconds,
    ROUND(AVG(planned_duration_seconds)::NUMERIC, 1) as avg_planned_duration,
    ROUND(MIN(duration_seconds)::NUMERIC, 1) as min_duration_seconds,
    ROUND(MAX(duration_seconds)::NUMERIC, 1) as max_duration_seconds,

    -- Engagement rate (% of planned duration completed on average)
    ROUND(
        (AVG(duration_seconds) / AVG(planned_duration_seconds) * 100)::NUMERIC,
        1
    ) as avg_completion_pct,

    -- Temporal data
    MIN(started_at) as first_play,
    MAX(started_at) as last_play,
    COUNT(DISTINCT play_session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users

FROM playback_section_events
WHERE ended_at IS NOT NULL  -- Only include completed sections (ignore in-progress)

GROUP BY section_type, movement_id, movement_name
HAVING COUNT(*) >= 1  -- At least 1 play to show (avoids zero-play noise)

ORDER BY early_skip_rate_pct DESC, total_plays DESC;

-- ============================================================================
-- View: movement_skip_leaderboard
-- ============================================================================
-- Purpose: Top 20 most-skipped movements (min 10 plays for statistical significance)
-- Use Case: Content prioritization - which movements need improvement?
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW movement_skip_leaderboard AS
SELECT
    movement_id,
    movement_name,
    COUNT(*) as total_plays,
    COUNT(*) FILTER (WHERE is_early_skip = TRUE) as early_skips,
    ROUND(
        (COUNT(*) FILTER (WHERE is_early_skip = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC,
        1
    ) as early_skip_rate_pct,
    ROUND(AVG(duration_seconds)::NUMERIC, 1) as avg_duration_seconds,
    ROUND(AVG(planned_duration_seconds)::NUMERIC, 1) as avg_planned_duration

FROM playback_section_events
WHERE section_type = 'movement'
    AND ended_at IS NOT NULL
    AND movement_id IS NOT NULL

GROUP BY movement_id, movement_name
HAVING COUNT(*) >= 10  -- Min 10 plays for statistical significance

ORDER BY early_skip_rate_pct DESC, total_plays DESC
LIMIT 20;

-- ============================================================================
-- View: section_type_skip_summary
-- ============================================================================
-- Purpose: Skip rates by section type (prep, warmup, movement, cooldown, meditation, homecare)
-- Use Case: Admin dashboard summary cards
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW section_type_skip_summary AS
SELECT
    section_type,
    COUNT(*) as total_plays,
    COUNT(*) FILTER (WHERE is_early_skip = TRUE) as early_skips,
    ROUND(
        (COUNT(*) FILTER (WHERE is_early_skip = TRUE)::FLOAT / COUNT(*) * 100)::NUMERIC,
        1
    ) as early_skip_rate_pct,
    ROUND(AVG(duration_seconds)::NUMERIC, 1) as avg_duration_seconds,
    COUNT(DISTINCT user_id) as unique_users

FROM playback_section_events
WHERE ended_at IS NOT NULL

GROUP BY section_type
ORDER BY early_skip_rate_pct DESC;

-- ============================================================================
-- Comments (Database Documentation)
-- ============================================================================

COMMENT ON TABLE playback_section_events IS 'Tracks individual section playback events to identify early skips. Used for admin analytics to improve content quality. Excludes transitions per requirements.';

COMMENT ON COLUMN playback_section_events.is_early_skip IS 'TRUE if user left section before 60s elapsed (20s for transitions) AND did not naturally complete. Computed server-side in section-end endpoint.';

COMMENT ON COLUMN playback_section_events.ended_reason IS 'Why did section end? completed = timer ran out naturally, skipped_next/previous = user navigation, exited = user left playback, jumped = seek bar (future)';

COMMENT ON VIEW early_skip_statistics IS 'Aggregated skip rates by section type and movement. Includes duration statistics and engagement rates. Used for admin analytics dashboards.';

COMMENT ON VIEW movement_skip_leaderboard IS 'Top 20 most-skipped movements (min 10 plays). Prioritizes content improvement efforts.';

COMMENT ON VIEW section_type_skip_summary IS 'Skip rates by section type. Quick summary for admin dashboard overview.';

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Purpose: Confirm migration succeeded and data structures are correct
-- Usage: Run these after applying migration to verify success
-- ----------------------------------------------------------------------------

/*
-- 1. Check table created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'playback_section_events';

-- 2. Check columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'playback_section_events'
ORDER BY ordinal_position;

-- 3. Check indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'playback_section_events'
ORDER BY indexname;

-- 4. Check RLS policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'playback_section_events'
ORDER BY policyname;

-- 5. Check views created
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name IN ('early_skip_statistics', 'movement_skip_leaderboard', 'section_type_skip_summary');

-- 6. Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'playback_section_events';
*/

-- ============================================================================
-- Rollback Script (if migration needs to be reverted)
-- ============================================================================
-- Save this separately as: 037_early_skip_analytics_ROLLBACK.sql
-- ----------------------------------------------------------------------------

/*
BEGIN;

-- Drop views (must drop before table)
DROP VIEW IF EXISTS section_type_skip_summary;
DROP VIEW IF EXISTS movement_skip_leaderboard;
DROP VIEW IF EXISTS early_skip_statistics;

-- Drop table (CASCADE removes foreign keys)
DROP TABLE IF EXISTS playback_section_events CASCADE;

COMMIT;
*/

-- ============================================================================
-- Test Data Insertion (for development testing)
-- ============================================================================
-- Usage: Run this AFTER migration to populate sample data for UI testing
-- ----------------------------------------------------------------------------

/*
-- Insert sample session
INSERT INTO class_play_sessions (id, user_id, duration_seconds, is_qualified_play, was_completed, playback_source)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    auth.uid(),
    1800,
    TRUE,
    FALSE,
    'library'
);

-- Insert sample section events (mix of completed and skipped)
INSERT INTO playback_section_events (
    user_id, play_session_id, section_type, section_index,
    planned_duration_seconds, started_at, ended_at,
    duration_seconds, ended_reason, is_early_skip
) VALUES
    -- Preparation: Completed naturally
    (auth.uid(), '00000000-0000-0000-0000-000000000001', 'preparation', 0, 240, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '26 minutes', 240, 'completed', FALSE),

    -- Warmup: Skipped after 30 seconds (early skip)
    (auth.uid(), '00000000-0000-0000-0000-000000000001', 'warmup', 1, 180, NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '25.5 minutes', 30, 'skipped_next', TRUE),

    -- Movement 1 (The Hundred): Completed naturally
    (auth.uid(), '00000000-0000-0000-0000-000000000001', 'movement', 2, 120, NOW() - INTERVAL '25.5 minutes', NOW() - INTERVAL '23.5 minutes', 120, 'completed', FALSE),

    -- Movement 2 (Roll Up): Skipped after 45 seconds (early skip)
    (auth.uid(), '00000000-0000-0000-0000-000000000001', 'movement', 3, 90, NOW() - INTERVAL '23.5 minutes', NOW() - INTERVAL '22.75 minutes', 45, 'skipped_next', TRUE);
*/
