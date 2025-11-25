-- ROPA Audit Log - GDPR Article 30 Compliance
-- Records all PII processing activities

CREATE TABLE IF NOT EXISTS ropa_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID,

    transaction_type VARCHAR(50) NOT NULL,
    pii_fields TEXT[],
    purpose VARCHAR(100) NOT NULL,
    processing_system VARCHAR(100) NOT NULL,

    actor_id UUID,
    actor_type VARCHAR(20) DEFAULT 'user',

    ip_address TEXT,
    user_agent TEXT,
    request_endpoint VARCHAR(255),
    http_method VARCHAR(10),

    status VARCHAR(20) DEFAULT 'success',
    retention_period VARCHAR(50) DEFAULT '7 years',
    third_party_recipients TEXT[],
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ropa_user_id ON ropa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ropa_timestamp ON ropa_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ropa_transaction_type ON ropa_audit_log(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ropa_processing_system ON ropa_audit_log(processing_system);

-- Add comments
COMMENT ON TABLE ropa_audit_log IS 'GDPR Article 30 - Record of Processing Activities';

-- Enable RLS
ALTER TABLE ropa_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then recreate
DROP POLICY IF EXISTS "Users can view their own PII transactions" ON ropa_audit_log;

-- Create policy: Users can view their own records
CREATE POLICY "Users can view their own PII transactions"
    ON ropa_audit_log FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Verify
SELECT 'ropa_audit_log table created successfully' AS status;
SELECT COUNT(*) AS index_count
FROM pg_indexes
WHERE tablename = 'ropa_audit_log';
