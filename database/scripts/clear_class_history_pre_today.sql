-- ================================================================
-- Clear Class History Prior to Today
-- Purpose: Clean slate for monitoring movement repertoire coverage
-- Author: Claude Code
-- Date: 2026-02-02
-- ================================================================

-- SAFETY CHECK: First, let's see what we're about to delete
-- Run this SELECT first to verify the data you want to remove

-- Step 1: Preview what will be deleted
SELECT
    'Preview: Classes to be deleted' as action,
    COUNT(*) as classes_to_delete,
    MIN(created_at) as earliest_class,
    MAX(created_at) as latest_class_to_delete
FROM class_history
WHERE created_at < CURRENT_DATE;

-- Step 2: Preview movements that will be deleted
SELECT
    'Preview: Movement records to be deleted' as action,
    COUNT(DISTINCT cm.class_id) as affected_classes,
    COUNT(*) as total_movement_records
FROM class_movements cm
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at < CURRENT_DATE;

-- ================================================================
-- DELETION SCRIPTS - RUN THESE AFTER REVIEWING PREVIEW
-- ================================================================

-- Step 3: Delete class movements (child records first)
DELETE FROM class_movements
WHERE class_id IN (
    SELECT id
    FROM class_history
    WHERE created_at < CURRENT_DATE
);

-- Step 4: Delete class history records
DELETE FROM class_history
WHERE created_at < CURRENT_DATE;

-- Step 5: Reset movement usage tracking (if exists and you want fresh stats)
-- Only run if you have a movement_usage table
-- DELETE FROM movement_usage
-- WHERE last_used < CURRENT_DATE;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Step 6: Verify deletion was successful
SELECT
    'Remaining classes' as status,
    COUNT(*) as total_classes,
    MIN(created_at) as earliest_class,
    MAX(created_at) as latest_class
FROM class_history;

-- Step 7: Check movement distribution in remaining classes
SELECT
    m.name as movement_name,
    m.difficulty_level,
    COUNT(DISTINCT cm.class_id) as times_used_today,
    ROUND(COUNT(DISTINCT cm.class_id)::numeric /
          (SELECT COUNT(DISTINCT id) FROM class_history WHERE created_at >= CURRENT_DATE)::numeric * 100, 1)
          as percentage_of_todays_classes
FROM movements m
LEFT JOIN class_movements cm ON m.id = cm.movement_id
LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE
GROUP BY m.id, m.name, m.difficulty_level
ORDER BY times_used_today DESC, m.name;

-- ================================================================
-- OPTIONAL: Create a backup before deletion (recommended)
-- ================================================================

-- To create a backup table first (run before deletion):
/*
CREATE TABLE class_history_backup_20260202 AS
SELECT * FROM class_history WHERE created_at < CURRENT_DATE;

CREATE TABLE class_movements_backup_20260202 AS
SELECT cm.*
FROM class_movements cm
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at < CURRENT_DATE;
*/

-- To restore from backup if needed:
/*
INSERT INTO class_history
SELECT * FROM class_history_backup_20260202;

INSERT INTO class_movements
SELECT * FROM class_movements_backup_20260202;
*/