-- Beta Error Tracking System
-- Captures non-critical errors that are bypassed in beta/MVP
-- Provides transparency into technical debt and data quality issues

-- ============================================================================
-- Beta Errors Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS beta_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Error classification
    error_type VARCHAR(100) NOT NULL,  -- 'KEYERROR_BYPASS', 'DATA_VALIDATION', etc.
    severity VARCHAR(20) NOT NULL,     -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE', 'INVESTIGATING', 'FIXED'

    -- Error details
    endpoint VARCHAR(255) NOT NULL,    -- API endpoint where error occurred
    error_message TEXT NOT NULL,       -- The actual error message
    stack_trace TEXT,                  -- Full stack trace for debugging

    -- Context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_data JSONB,                -- Request that caused the error
    response_data JSONB,               -- Response that was returned (despite error)

    -- Bypass information
    was_bypassed BOOLEAN DEFAULT false,  -- Did we return success despite error?
    bypass_reason TEXT,                  -- Why we bypassed this error

    -- User impact
    user_affected BOOLEAN DEFAULT false,  -- Did user see this error?
    user_notified BOOLEAN DEFAULT false,  -- Did we show beta notification?

    -- Metadata
    environment VARCHAR(50) DEFAULT 'production',  -- 'development', 'staging', 'production'
    version VARCHAR(50),               -- App version when error occurred

    -- Tracking
    first_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,

    -- Fix tracking
    fixed_in_version VARCHAR(50),
    fixed_at TIMESTAMP WITH TIME ZONE,
    fix_commit_hash VARCHAR(40),
    fix_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_beta_errors_status ON beta_errors(status);
CREATE INDEX idx_beta_errors_type ON beta_errors(error_type);
CREATE INDEX idx_beta_errors_severity ON beta_errors(severity);
CREATE INDEX idx_beta_errors_user ON beta_errors(user_id);
CREATE INDEX idx_beta_errors_occurred ON beta_errors(last_occurred_at DESC);
CREATE INDEX idx_beta_errors_endpoint ON beta_errors(endpoint);

-- ============================================================================
-- Beta Error Stats View (for admin dashboard)
-- ============================================================================
CREATE OR REPLACE VIEW beta_error_stats AS
SELECT
    error_type,
    severity,
    status,
    COUNT(*) as total_occurrences,
    SUM(occurrence_count) as total_hits,
    COUNT(DISTINCT user_id) as users_affected,
    MIN(first_occurred_at) as first_seen,
    MAX(last_occurred_at) as last_seen,
    AVG(CASE WHEN was_bypassed THEN 1 ELSE 0 END) * 100 as bypass_rate_pct,
    COUNT(CASE WHEN user_notified THEN 1 END) as users_notified
FROM beta_errors
GROUP BY error_type, severity, status
ORDER BY total_hits DESC;

-- ============================================================================
-- Function to log beta error (upsert pattern)
-- ============================================================================
CREATE OR REPLACE FUNCTION log_beta_error(
    p_error_type VARCHAR,
    p_severity VARCHAR,
    p_endpoint VARCHAR,
    p_error_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_request_data JSONB DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL,
    p_was_bypassed BOOLEAN DEFAULT false,
    p_bypass_reason TEXT DEFAULT NULL,
    p_user_notified BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
    v_existing_id UUID;
BEGIN
    -- Check if similar error exists (same type, endpoint, error message, active status)
    SELECT id INTO v_existing_id
    FROM beta_errors
    WHERE error_type = p_error_type
      AND endpoint = p_endpoint
      AND error_message = p_error_message
      AND status = 'ACTIVE'
    ORDER BY last_occurred_at DESC
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing error (increment count, update timestamp)
        UPDATE beta_errors
        SET
            occurrence_count = occurrence_count + 1,
            last_occurred_at = NOW(),
            updated_at = NOW(),
            -- Update these if provided
            stack_trace = COALESCE(p_stack_trace, stack_trace),
            request_data = COALESCE(p_request_data, request_data),
            response_data = COALESCE(p_response_data, response_data)
        WHERE id = v_existing_id;

        v_error_id := v_existing_id;
    ELSE
        -- Insert new error
        INSERT INTO beta_errors (
            error_type,
            severity,
            endpoint,
            error_message,
            stack_trace,
            user_id,
            request_data,
            response_data,
            was_bypassed,
            bypass_reason,
            user_notified
        ) VALUES (
            p_error_type,
            p_severity,
            p_endpoint,
            p_error_message,
            p_stack_trace,
            p_user_id,
            p_request_data,
            p_response_data,
            p_was_bypassed,
            p_bypass_reason,
            p_user_notified
        )
        RETURNING id INTO v_error_id;
    END IF;

    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE beta_errors ENABLE ROW LEVEL SECURITY;

-- Admins can see all beta errors
CREATE POLICY "Admins can view all beta errors"
    ON beta_errors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins can insert/update beta errors
CREATE POLICY "Admins can manage beta errors"
    ON beta_errors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Service role can insert (backend logging)
-- (Relies on service role key, no RLS needed)

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE beta_errors IS
'Tracks non-critical errors that occur in beta/MVP. These errors are bypassed
to maintain app functionality, but logged for transparency and future fixing.';

COMMENT ON COLUMN beta_errors.was_bypassed IS
'True if the error was caught and a successful response returned anyway.
Indicates technical debt that should be fixed before production.';

COMMENT ON COLUMN beta_errors.user_notified IS
'True if user saw a beta notification about this error. Provides transparency
to beta testers about known issues.';

COMMENT ON FUNCTION log_beta_error IS
'Logs a beta error with upsert logic. If same error exists and is ACTIVE,
increments occurrence count. Otherwise creates new error record.';

-- ============================================================================
-- Example usage:
-- ============================================================================

-- From backend:
-- SELECT log_beta_error(
--     'KEYERROR_BYPASS',
--     'MEDIUM',
--     '/api/agents/generate-sequence',
--     'KeyError: ''message''',
--     'Traceback...',
--     user_id,
--     '{"difficulty": "Intermediate"}'::jsonb,
--     '{"success": true, "data": {...}}'::jsonb,
--     true,  -- was_bypassed
--     'Sequence generation succeeded but response serialization failed',
--     true   -- user_notified
-- );
