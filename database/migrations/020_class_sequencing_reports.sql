-- Migration 020: Class Sequencing Reports Table
-- Purpose: Store auto-generated sequencing validation reports for all classes
-- Addresses: Performance-optimized report storage without filesystem dependencies

-- Create table for storing sequencing reports
CREATE TABLE IF NOT EXISTS class_sequencing_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_plan_id UUID NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    report_content TEXT NOT NULL,
    pass_status BOOLEAN NOT NULL,
    total_movements INTEGER NOT NULL,
    fail_count INTEGER DEFAULT 0,
    generated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(class_plan_id),  -- One report per class

    -- Indexes for performance
    CREATE INDEX idx_class_sequencing_reports_user ON class_sequencing_reports(user_id);
    CREATE INDEX idx_class_sequencing_reports_date ON class_sequencing_reports(generated_at DESC);
    CREATE INDEX idx_class_sequencing_reports_status ON class_sequencing_reports(pass_status);
);

-- Enable Row Level Security
ALTER TABLE class_sequencing_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
    ON class_sequencing_reports
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
    ON class_sequencing_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- RLS Policy: System can insert reports (service role)
CREATE POLICY "Service role can insert reports"
    ON class_sequencing_reports
    FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE class_sequencing_reports IS 'Stores auto-generated sequencing validation reports for all classes. Reports are generated asynchronously after class creation to avoid performance impact.';
COMMENT ON COLUMN class_sequencing_reports.class_plan_id IS 'UUID of the class from class_history table';
COMMENT ON COLUMN class_sequencing_reports.report_content IS 'Markdown-formatted sequencing validation report content';
COMMENT ON COLUMN class_sequencing_reports.pass_status IS 'True if all muscle overlap checks passed (fail_count = 0)';
COMMENT ON COLUMN class_sequencing_reports.total_movements IS 'Number of movements analyzed in the sequence';
COMMENT ON COLUMN class_sequencing_reports.fail_count IS 'Number of movement pairs that failed the 50% overlap threshold';
