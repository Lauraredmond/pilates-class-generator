-- Add AI agent toggle to user_preferences table
-- Session 10: Jentic Integration - LLM Cost Control
-- Date: November 28, 2025

-- Add use_ai_agent column
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS use_ai_agent BOOLEAN DEFAULT false;

-- Update existing rows to have default value (false = free direct API)
UPDATE user_preferences
SET use_ai_agent = COALESCE(use_ai_agent, false)
WHERE use_ai_agent IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.use_ai_agent IS
'Whether to use AI agent for class generation (costly but intelligent using GPT-4) or direct API calls (fast but basic). Default: false (free tier)';
