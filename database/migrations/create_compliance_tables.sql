-- Compliance Tables for GDPR and EU AI Act
-- Date: November 25, 2025
-- Purpose: Full regulatory compliance with audit trails

-- Run each section separately in Supabase SQL Editor
-- DO NOT run the entire file at once - execute section by section

-- ============================================================================
-- SECTION 1: ROPA AUDIT LOG (GDPR Article 30 - Record of Processing Activities)
-- ============================================================================

-- Drop existing table if you need to recreate
-- DROP TABLE IF EXISTS ropa_audit_log CASCADE;

CREATE TABLE IF NOT EXISTS ropa_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    transaction_type VARCHAR(50) NOT NULL,
    -- Types: 'read', 'create', 'update', 'delete', 'export', 'anonymize'
    CHECK (transaction_type IN ('read', 'create', 'update', 'delete', 'export', 'anonymize')),

    pii_fields TEXT[] NOT NULL,
    -- Array of PII field names accessed: ['email', 'full_name', 'country']

    purpose VARCHAR(100) NOT NULL,
    -- Legal basis: 'consent', 'contract', 'legal_obligation', 'legitimate_interest'
    CHECK (purpose IN ('consent', 'contract', 'legal_obligation', 'legitimate_interest', 'vital_interest', 'public_task')),

    data_subject_type VARCHAR(50) DEFAULT 'user',
    -- 'user', 'instructor', 'admin'

    processing_system VARCHAR(100) NOT NULL,
    -- 'authentication', 'profile_management', 'class_generation', 'analytics'

    actor_id UUID,
    -- Who performed the action (user_id if self-service, admin_id if support)

    actor_type VARCHAR(20) DEFAULT 'user',
    -- 'user', 'admin', 'system', 'api'
    CHECK (actor_type IN ('user', 'admin', 'system', 'api')),

    ip_address INET,
    user_agent TEXT,

    request_endpoint VARCHAR(255),
    -- API endpoint that triggered PII access

    http_method VARCHAR(10),
    -- GET, POST, PUT, DELETE
    CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),

    status VARCHAR(20) DEFAULT 'success',
    -- 'success', 'failed', 'partial'
    CHECK (status IN ('success', 'failed', 'partial')),

    retention_period VARCHAR(50) DEFAULT '7 years',
    -- How long this data is retained

    third_party_recipients TEXT[],
    -- If PII shared with third parties: ['AWS', 'Supabase', 'Netlify']

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient GDPR audit queries
CREATE INDEX IF NOT EXISTS idx_ropa_user_id ON ropa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ropa_timestamp ON ropa_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ropa_transaction_type ON ropa_audit_log(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ropa_processing_system ON ropa_audit_log(processing_system);
CREATE INDEX IF NOT EXISTS idx_ropa_actor ON ropa_audit_log(actor_id, actor_type);

COMMENT ON TABLE ropa_audit_log IS 'GDPR Article 30 - Record of Processing Activities for all PII transactions. Immutable audit trail.';
COMMENT ON COLUMN ropa_audit_log.transaction_type IS 'Type of PII transaction: read, create, update, delete, export, anonymize';
COMMENT ON COLUMN ropa_audit_log.pii_fields IS 'Array of PII field names that were accessed in this transaction';
COMMENT ON COLUMN ropa_audit_log.purpose IS 'Legal basis for processing under GDPR Article 6';
COMMENT ON COLUMN ropa_audit_log.retention_period IS 'How long this data is retained per retention policy';


-- ============================================================================
-- 2. AI DECISION LOG (EU AI Act - Transparency & Explainability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    agent_type VARCHAR(50) NOT NULL,
    -- 'sequence_agent', 'music_agent', 'meditation_agent', 'research_agent'
    CHECK (agent_type IN ('sequence_agent', 'music_agent', 'meditation_agent', 'research_agent')),

    model_name VARCHAR(100) NOT NULL,
    -- 'gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet', etc.

    model_version VARCHAR(50),

    input_parameters JSONB NOT NULL,
    -- Complete input to the AI model

    output_result JSONB NOT NULL,
    -- AI model's output

    reasoning TEXT,
    -- Explanation of why this decision was made (EU AI Act requirement)

    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),

    safety_validated BOOLEAN DEFAULT true,
    -- Did the output pass safety validation?

    user_overridden BOOLEAN DEFAULT false,
    -- Did user reject/modify AI's suggestion?

    override_reason TEXT,

    processing_time_ms INTEGER,
    -- How long the AI took to respond

    tokens_used INTEGER,
    -- For cost tracking and rate limiting

    compliance_flags JSONB DEFAULT '{"bias_detected": false, "safety_concern": false}'::jsonb,
    -- Any compliance issues flagged

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for AI decision queries
CREATE INDEX IF NOT EXISTS idx_ai_user_id ON ai_decision_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_timestamp ON ai_decision_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_type ON ai_decision_log(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_name ON ai_decision_log(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_user_overridden ON ai_decision_log(user_overridden) WHERE user_overridden = true;

COMMENT ON TABLE ai_decision_log IS 'EU AI Act compliance - All AI decisions with reasoning and explainability';
COMMENT ON COLUMN ai_decision_log.reasoning IS 'Human-readable explanation of why the AI made this decision (EU AI Act requirement)';
COMMENT ON COLUMN ai_decision_log.user_overridden IS 'Track when users reject AI suggestions to detect systematic issues';


-- ============================================================================
-- 3. BIAS MONITORING (EU AI Act - Prevent Algorithmic Bias)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bias_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metric_name VARCHAR(100) NOT NULL,
    -- 'recommendation_diversity', 'difficulty_distribution', 'music_genre_balance'

    model_name VARCHAR(100) NOT NULL,

    demographic_group VARCHAR(100),
    -- 'age_18-24', 'age_65+', 'beginner', 'advanced', etc.

    metric_value FLOAT NOT NULL,

    baseline_value FLOAT,
    -- Expected value for unbiased system

    deviation_percentage FLOAT,
    -- How far from baseline

    alert_threshold_exceeded BOOLEAN DEFAULT false,

    sample_size INTEGER,
    -- How many data points used for this metric

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bias monitoring queries
CREATE INDEX IF NOT EXISTS idx_bias_timestamp ON bias_monitoring(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bias_model ON bias_monitoring(model_name);
CREATE INDEX IF NOT EXISTS idx_bias_alert ON bias_monitoring(alert_threshold_exceeded) WHERE alert_threshold_exceeded = true;
CREATE INDEX IF NOT EXISTS idx_bias_metric ON bias_monitoring(metric_name);

COMMENT ON TABLE bias_monitoring IS 'EU AI Act - Detect and prevent algorithmic bias across demographics';
COMMENT ON COLUMN bias_monitoring.deviation_percentage IS 'Percentage deviation from baseline - alerts trigger at >15%';


-- ============================================================================
-- 4. MODEL DRIFT DETECTION (EU AI Act - Monitor Model Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_drift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),

    drift_metric VARCHAR(100) NOT NULL,
    -- 'output_distribution', 'confidence_scores', 'processing_time', 'error_rate'

    current_value FLOAT NOT NULL,
    baseline_value FLOAT NOT NULL,

    drift_score FLOAT CHECK (drift_score BETWEEN 0 AND 1),
    -- How much the model has drifted (0 = no drift, 1 = complete drift)

    drift_detected BOOLEAN DEFAULT false,

    action_taken VARCHAR(50),
    -- 'alert_sent', 'model_retrained', 'rollback', 'manual_review'

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for drift detection queries
CREATE INDEX IF NOT EXISTS idx_drift_timestamp ON model_drift_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_drift_model ON model_drift_log(model_name);
CREATE INDEX IF NOT EXISTS idx_drift_detected ON model_drift_log(drift_detected) WHERE drift_detected = true;

COMMENT ON TABLE model_drift_log IS 'EU AI Act - Monitor model performance over time to detect drift';
COMMENT ON COLUMN model_drift_log.drift_score IS 'Drift score between 0 (no change) and 1 (complete drift)';


-- ============================================================================
-- 5. COMPLIANCE SUMMARY VIEW (Convenience for Reporting)
-- ============================================================================

CREATE OR REPLACE VIEW compliance_summary AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(DISTINCT r.id) as total_pii_transactions,
    COUNT(DISTINCT a.id) as total_ai_decisions,
    MAX(r.timestamp) as last_pii_access,
    MAX(a.timestamp) as last_ai_decision,
    COUNT(DISTINCT r.id) FILTER (WHERE r.transaction_type = 'export') as data_exports_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.user_overridden = true) as ai_overrides_count
FROM users u
LEFT JOIN ropa_audit_log r ON r.user_id = u.id
LEFT JOIN ai_decision_log a ON a.user_id = u.id
GROUP BY u.id, u.email;

COMMENT ON VIEW compliance_summary IS 'Convenient summary of compliance metrics per user';


-- ============================================================================
-- Grant permissions (adjust based on your RLS policies)
-- ============================================================================

-- Allow authenticated users to read their own compliance data
-- (Adjust these based on your Supabase RLS policies)

ALTER TABLE ropa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_drift_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own ROPA audit log
CREATE POLICY "Users can view their own PII transactions"
    ON ropa_audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only read their own AI decisions
CREATE POLICY "Users can view their own AI decisions"
    ON ai_decision_log FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Only admins can view bias monitoring (contains aggregate data)
CREATE POLICY "Only admins can view bias monitoring"
    ON bias_monitoring FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can view model drift logs
CREATE POLICY "Only admins can view model drift logs"
    ON model_drift_log FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Run these after migration to verify:

-- 1. Check that all tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('ropa_audit_log', 'ai_decision_log', 'bias_monitoring', 'model_drift_log');

-- 2. Check indexes
-- SELECT tablename, indexname FROM pg_indexes
-- WHERE tablename IN ('ropa_audit_log', 'ai_decision_log', 'bias_monitoring', 'model_drift_log');

-- 3. Check RLS policies
-- SELECT tablename, policyname FROM pg_policies
-- WHERE tablename IN ('ropa_audit_log', 'ai_decision_log', 'bias_monitoring', 'model_drift_log');
