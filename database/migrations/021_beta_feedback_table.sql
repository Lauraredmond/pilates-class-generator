-- Migration 021: Beta Tester Feedback Table
-- Created: December 9, 2025
-- Purpose: Store beta tester feedback, bug reports, and queries

-- Create beta_feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    feedback_type VARCHAR(50) NOT NULL,  -- general, bug, feature, usability, performance, question, other
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',  -- new, reviewed, resolved, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback(status);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_type ON beta_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
    ON beta_feedback FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
    ON beta_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admin users can view all feedback
CREATE POLICY "Admins can view all feedback"
    ON beta_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- RLS Policy: Admin users can update all feedback
CREATE POLICY "Admins can update all feedback"
    ON beta_feedback FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_beta_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_beta_feedback_updated_at_trigger
    BEFORE UPDATE ON beta_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_feedback_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON beta_feedback TO authenticated;
GRANT ALL ON beta_feedback TO service_role;

-- Add comment
COMMENT ON TABLE beta_feedback IS 'Stores beta tester feedback, bug reports, and support queries';
