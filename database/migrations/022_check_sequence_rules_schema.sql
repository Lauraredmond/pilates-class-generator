-- Diagnostic: Check if sequence_rules table exists and its structure
-- Run this first to see what columns the table actually has

-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'sequence_rules';

-- If table exists, show its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sequence_rules'
ORDER BY ordinal_position;
