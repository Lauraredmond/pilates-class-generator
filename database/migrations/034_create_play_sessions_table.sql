-- ============================================================================
-- Migration 034: Create Class Play Sessions Table
-- ============================================================================
-- Purpose: Track when users actually play classes (not just create them)
--          Only count as "played" if duration > 120 seconds
--
-- Created: December 24, 2025
-- ============================================================================

BEGIN;

-- Create the class_play_sessions table
CREATE TABLE IF NOT EXISTS class_play_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    class_plan_id UUID,  -- Nullable in case class was deleted

    -- Timing information
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,

    -- Play quality metrics
    was_completed BOOLEAN DEFAULT FALSE,  -- Did they finish the entire class?
    is_qualified_play BOOLEAN DEFAULT FALSE,  -- TRUE if duration > 120 seconds

    -- User interaction metrics
    pause_count INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,  -- How many times they skipped forward
    rewind_count INTEGER DEFAULT 0,  -- How many times they went back

    -- Session context
    current_section_index INTEGER,  -- Which section they reached
    max_section_reached INTEGER,  -- Furthest section they reached
    playback_source VARCHAR(50),  -- 'library', 'generated', 'shared', 'preview'

    -- Device and browser information
    device_info JSONB,  -- {browser, os, screen_width, screen_height, is_mobile}

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_user_id FOREIGN KEY (user_id)
        REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_plan_id FOREIGN KEY (class_plan_id)
        REFERENCES class_plans(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_play_sessions_user ON class_play_sessions(user_id, started_at DESC);
CREATE INDEX idx_play_sessions_qualified ON class_play_sessions(is_qualified_play, started_at DESC)
    WHERE is_qualified_play = TRUE;
CREATE INDEX idx_play_sessions_class ON class_play_sessions(class_plan_id, started_at DESC);
CREATE INDEX idx_play_sessions_date ON class_play_sessions(DATE(started_at));

-- Add comment for documentation
COMMENT ON TABLE class_play_sessions IS 'Tracks actual play sessions of Pilates classes. A session is considered a "qualified play" only if duration_seconds > 120, helping distinguish engaged users from those who briefly preview classes.';

COMMENT ON COLUMN class_play_sessions.is_qualified_play IS 'TRUE if user played for more than 120 seconds, indicating meaningful engagement';
COMMENT ON COLUMN class_play_sessions.was_completed IS 'TRUE if user reached the end of the class (not just 120 seconds)';
COMMENT ON COLUMN class_play_sessions.playback_source IS 'Where the user started playback from: library (saved classes), generated (just created), shared (from another user), preview (demo mode)';
COMMENT ON COLUMN class_play_sessions.device_info IS 'JSON object containing browser, OS, screen dimensions, and mobile detection';

-- ============================================================================
-- Create summary view for analytics
-- ============================================================================
CREATE OR REPLACE VIEW user_play_statistics AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(DISTINCT ps.id) as total_sessions,
    COUNT(DISTINCT ps.id) FILTER (WHERE ps.is_qualified_play = TRUE) as qualified_plays,
    COUNT(DISTINCT ps.id) FILTER (WHERE ps.was_completed = TRUE) as completed_classes,
    COUNT(DISTINCT ps.class_plan_id) as unique_classes_played,
    COALESCE(SUM(ps.duration_seconds), 0) as total_play_seconds,
    COALESCE(AVG(ps.duration_seconds), 0) as avg_play_seconds,
    COALESCE(MAX(ps.duration_seconds), 0) as longest_session_seconds,
    MIN(ps.started_at) as first_play_date,
    MAX(ps.started_at) as last_play_date,
    COALESCE(AVG(ps.pause_count), 0) as avg_pauses_per_session,
    CASE
        WHEN COUNT(ps.id) FILTER (WHERE ps.is_qualified_play = TRUE) > 0
        THEN (COUNT(ps.id) FILTER (WHERE ps.was_completed = TRUE)::FLOAT /
              COUNT(ps.id) FILTER (WHERE ps.is_qualified_play = TRUE)::FLOAT * 100)
        ELSE 0
    END as completion_rate_percentage
FROM user_profiles u
LEFT JOIN class_play_sessions ps ON u.id = ps.user_id
GROUP BY u.id, u.email;

COMMENT ON VIEW user_play_statistics IS 'Aggregated play statistics per user for analytics dashboard';

-- ============================================================================
-- Create function to auto-update is_qualified_play flag
-- ============================================================================
CREATE OR REPLACE FUNCTION update_qualified_play_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set is_qualified_play based on duration
    IF NEW.duration_seconds > 120 THEN
        NEW.is_qualified_play := TRUE;
    ELSE
        NEW.is_qualified_play := FALSE;
    END IF;

    -- Update the updated_at timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update the flag
CREATE TRIGGER trigger_update_qualified_play
    BEFORE INSERT OR UPDATE ON class_play_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_qualified_play_flag();

-- ============================================================================
-- Sample query to get engagement metrics
-- ============================================================================
/*
-- Daily active users (played > 120 seconds)
SELECT
    DATE(started_at) as play_date,
    COUNT(DISTINCT user_id) as daily_active_users,
    COUNT(*) as total_qualified_plays,
    AVG(duration_seconds)::INT as avg_duration_seconds
FROM class_play_sessions
WHERE is_qualified_play = TRUE
AND started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY play_date DESC;

-- User engagement funnel
SELECT
    'Started Playing' as stage,
    COUNT(DISTINCT user_id) as users
FROM class_play_sessions
UNION ALL
SELECT
    'Played > 120 seconds' as stage,
    COUNT(DISTINCT user_id) as users
FROM class_play_sessions
WHERE is_qualified_play = TRUE
UNION ALL
SELECT
    'Completed Class' as stage,
    COUNT(DISTINCT user_id) as users
FROM class_play_sessions
WHERE was_completed = TRUE;
*/

-- ============================================================================
-- Grant permissions
-- ============================================================================
-- Note: Adjust these based on your Supabase RLS policies
ALTER TABLE class_play_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own play sessions
CREATE POLICY "Users can view own play sessions" ON class_play_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own play sessions
CREATE POLICY "Users can create own play sessions" ON class_play_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own play sessions
CREATE POLICY "Users can update own play sessions" ON class_play_sessions
    FOR UPDATE USING (auth.uid() = user_id);

COMMIT;

-- ============================================================================
-- Rollback script (save separately)
-- ============================================================================
/*
DROP TRIGGER IF EXISTS trigger_update_qualified_play ON class_play_sessions;
DROP FUNCTION IF EXISTS update_qualified_play_flag();
DROP VIEW IF EXISTS user_play_statistics;
DROP TABLE IF EXISTS class_play_sessions;
*/