-- LLM Invocation Logging for Admin Analytics
-- Session 10: Jentic Integration - Admin Observability
-- Date: November 28, 2025

-- Create llm_invocation_log table
CREATE TABLE IF NOT EXISTS llm_invocation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Who triggered this
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- What method was used
    method_used VARCHAR(20) NOT NULL CHECK (method_used IN ('ai_agent', 'direct_api')),

    -- LLM-specific fields (only populated when method_used = 'ai_agent')
    llm_called BOOLEAN NOT NULL DEFAULT false,
    llm_model VARCHAR(50),  -- e.g., 'gpt-4-turbo'
    llm_prompt TEXT,  -- The goal/prompt sent to the LLM
    llm_response TEXT,  -- The final answer from LLM
    llm_iterations INTEGER,  -- Number of reasoning iterations

    -- Request details
    request_data JSONB,  -- Full request: {duration_minutes, difficulty, etc.}

    -- Performance metrics
    processing_time_ms FLOAT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,

    -- Cost tracking
    cost_estimate VARCHAR(20),  -- e.g., '$0.12-0.15' or '$0.00'

    -- Result summary
    result_summary JSONB  -- Brief summary of generated class
);

-- Add indexes for efficient querying
CREATE INDEX idx_llm_invocation_log_created_at ON llm_invocation_log(created_at DESC);
CREATE INDEX idx_llm_invocation_log_user_id ON llm_invocation_log(user_id);
CREATE INDEX idx_llm_invocation_log_method ON llm_invocation_log(method_used);
CREATE INDEX idx_llm_invocation_log_llm_called ON llm_invocation_log(llm_called);

-- Add is_admin flag to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN user_profiles.is_admin IS 'Admin users can view LLM invocation logs and analytics';

-- Add comment on table
COMMENT ON TABLE llm_invocation_log IS 'Log of all class generation attempts, showing when LLM reasoning is used vs direct API';

-- Add Row-Level Security (RLS) policies

-- Enable RLS
ALTER TABLE llm_invocation_log ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own logs
CREATE POLICY "Users can view own invocation logs"
ON llm_invocation_log
FOR SELECT
USING (auth.uid()::uuid = user_id);

-- Policy 2: Admins can view all logs
CREATE POLICY "Admins can view all invocation logs"
ON llm_invocation_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()::uuid
        AND is_admin = true
    )
);

-- Policy 3: System can insert logs (service role)
CREATE POLICY "Service can insert invocation logs"
ON llm_invocation_log
FOR INSERT
WITH CHECK (true);

-- Make first user an admin (for testing - OPTIONAL)
-- UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';
