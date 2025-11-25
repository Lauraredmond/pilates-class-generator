-- Bias Monitoring - EU AI Act Compliance
-- Tracks algorithmic bias across demographics

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS bias_monitoring CASCADE;

CREATE TABLE bias_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metric_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,

    demographic_group VARCHAR(100),
    metric_value FLOAT NOT NULL,

    baseline_value FLOAT,
    deviation_percentage FLOAT,

    alert_threshold_exceeded BOOLEAN DEFAULT false,
    sample_size INTEGER,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bias_timestamp ON bias_monitoring(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bias_model ON bias_monitoring(model_name);
CREATE INDEX IF NOT EXISTS idx_bias_metric ON bias_monitoring(metric_name);

-- Add comments
COMMENT ON TABLE bias_monitoring IS 'EU AI Act - Detect and prevent algorithmic bias';

-- Enable RLS (admin-only access)
ALTER TABLE bias_monitoring ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'bias_monitoring table created successfully' AS status;
SELECT COUNT(*) AS index_count
FROM pg_indexes
WHERE tablename = 'bias_monitoring';
