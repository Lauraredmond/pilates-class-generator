-- Model Drift Detection - EU AI Act Compliance
-- Monitors AI model performance over time

CREATE TABLE IF NOT EXISTS model_drift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),

    drift_metric VARCHAR(100) NOT NULL,
    current_value FLOAT NOT NULL,
    baseline_value FLOAT NOT NULL,

    drift_score FLOAT,
    drift_detected BOOLEAN DEFAULT false,

    action_taken VARCHAR(50),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_drift_timestamp ON model_drift_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_drift_model ON model_drift_log(model_name);

-- Add comments
COMMENT ON TABLE model_drift_log IS 'EU AI Act - Monitor model performance over time';

-- Enable RLS (admin-only access)
ALTER TABLE model_drift_log ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'model_drift_log table created successfully' AS status;
SELECT COUNT(*) AS index_count
FROM pg_indexes
WHERE tablename = 'model_drift_log';
