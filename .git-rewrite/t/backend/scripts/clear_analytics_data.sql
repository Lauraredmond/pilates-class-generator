-- Clear Analytics Data for Testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- This will delete ALL records from analytics tables so you can test
-- that they get populated correctly when you generate classes

BEGIN;

-- Clear class_history table
DELETE FROM class_history;

-- Clear movement_usage table
DELETE FROM movement_usage;

-- Display confirmation
SELECT 'Analytics tables cleared!' as message;

-- Show current counts (should be 0)
SELECT
    (SELECT COUNT(*) FROM class_history) as class_history_count,
    (SELECT COUNT(*) FROM movement_usage) as movement_usage_count;

COMMIT;

-- Note: class_plans table was NOT cleared (contains manually created classes)
