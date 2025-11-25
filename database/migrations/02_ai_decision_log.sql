-- AI Decision Log - EU AI Act Compliance
-- Records all AI decisions with reasoning and explainability

CREATE TABLE IF NOT EXISTS ai_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID,

    agent_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),

    input_parameters JSONB,
    output_result JSONB,
    reasoning TEXT,

    confidence_score FLOAT,
    safety_validated BOOLEAN DEFAULT true,

    user_overridden BOOLEAN DEFAULT false,
    override_reason TEXT,

    processing_time_ms INTEGER,
    tokens_used INTEGER,

    compliance_flags JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_user_id ON ai_decision_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_timestamp ON ai_decision_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_type ON ai_decision_log(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_name ON ai_decision_log(model_name);

-- Add comments
COMMENT ON TABLE ai_decision_log IS 'EU AI Act - All AI decisions with reasoning';

-- Enable RLS
ALTER TABLE ai_decision_log ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then recreate
DROP POLICY IF EXISTS "Users can view their own AI decisions" ON ai_decision_log;

-- Create policy: Users can view their own AI decisions
CREATE POLICY "Users can view their own AI decisions"
    ON ai_decision_log FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Verify
SELECT 'ai_decision_log table created successfully' AS status;
SELECT COUNT(*) AS index_count
FROM pg_indexes
WHERE tablename = 'ai_decision_log';
