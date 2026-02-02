-- ================================================================
-- Movement Repertoire Coverage Monitoring
-- Purpose: Track how well the AI covers all 34 Pilates movements
-- Author: Claude Code
-- Date: 2026-02-02
-- ================================================================

-- ================================================================
-- 1. OVERALL MOVEMENT COVERAGE STATISTICS
-- ================================================================

-- How many unique movements have been used across all classes?
WITH movement_stats AS (
    SELECT
        m.id,
        m.name,
        m.difficulty_level,
        COUNT(DISTINCT cm.class_id) as times_used,
        MAX(ch.created_at) as last_used
    FROM movements m
    LEFT JOIN class_movements cm ON m.id = cm.movement_id
    LEFT JOIN class_history ch ON cm.class_id = ch.id
    WHERE ch.created_at >= CURRENT_DATE OR ch.created_at IS NULL
    GROUP BY m.id, m.name, m.difficulty_level
)
SELECT
    'Movement Coverage Summary' as report_type,
    COUNT(*) as total_movements_in_db,
    COUNT(CASE WHEN times_used > 0 THEN 1 END) as movements_used_today,
    COUNT(CASE WHEN times_used = 0 OR times_used IS NULL THEN 1 END) as movements_never_used,
    ROUND(COUNT(CASE WHEN times_used > 0 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 1) as coverage_percentage
FROM movement_stats;

-- ================================================================
-- 2. MOVEMENTS NEVER USED (RED FLAGS FOR REPERTOIRE GAPS)
-- ================================================================

SELECT
    'Never Used Movements' as category,
    m.name,
    m.difficulty_level,
    m.primary_movement_pattern,
    m.primary_muscle_groups
FROM movements m
WHERE NOT EXISTS (
    SELECT 1
    FROM class_movements cm
    JOIN class_history ch ON cm.class_id = ch.id
    WHERE cm.movement_id = m.id
    AND ch.created_at >= CURRENT_DATE
)
ORDER BY m.difficulty_level, m.name;

-- ================================================================
-- 3. MOVEMENT USAGE FREQUENCY DISTRIBUTION
-- ================================================================

WITH usage_counts AS (
    SELECT
        m.name,
        m.difficulty_level,
        COUNT(DISTINCT cm.class_id) as usage_count
    FROM movements m
    LEFT JOIN class_movements cm ON m.id = cm.movement_id
    LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE
    GROUP BY m.id, m.name, m.difficulty_level
)
SELECT
    difficulty_level,
    usage_count,
    COUNT(*) as movements_with_this_usage,
    STRING_AGG(name, ', ' ORDER BY name) as movement_names
FROM usage_counts
GROUP BY difficulty_level, usage_count
ORDER BY difficulty_level, usage_count DESC;

-- ================================================================
-- 4. MUSCLE GROUP BALANCE ACROSS GENERATED CLASSES
-- ================================================================

SELECT
    mg.name as muscle_group,
    COUNT(DISTINCT cm.class_id) as classes_targeting_this_muscle,
    ROUND(COUNT(DISTINCT cm.class_id)::numeric /
          (SELECT COUNT(DISTINCT id) FROM class_history WHERE created_at >= CURRENT_DATE)::numeric * 100, 1)
          as percentage_of_classes
FROM muscle_groups mg
JOIN movement_muscles mm ON mg.id = mm.muscle_group_id
JOIN class_movements cm ON mm.movement_id = cm.movement_id
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at >= CURRENT_DATE
GROUP BY mg.id, mg.name
ORDER BY classes_targeting_this_muscle DESC;

-- ================================================================
-- 5. MOVEMENT PATTERN DIVERSITY
-- ================================================================

SELECT
    m.primary_movement_pattern,
    COUNT(DISTINCT m.id) as unique_movements_used,
    COUNT(DISTINCT cm.class_id) as times_used_in_classes,
    ROUND(COUNT(DISTINCT cm.class_id)::numeric /
          (SELECT COUNT(*) FROM class_movements cm2
           JOIN class_history ch2 ON cm2.class_id = ch2.id
           WHERE ch2.created_at >= CURRENT_DATE)::numeric * 100, 1)
          as percentage_of_all_movements
FROM movements m
JOIN class_movements cm ON m.id = cm.movement_id
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at >= CURRENT_DATE
GROUP BY m.primary_movement_pattern
ORDER BY times_used_in_classes DESC;

-- ================================================================
-- 6. DIFFICULTY LEVEL DISTRIBUTION
-- ================================================================

SELECT
    m.difficulty_level,
    COUNT(DISTINCT m.id) as unique_movements_available,
    COUNT(DISTINCT CASE WHEN cm.id IS NOT NULL THEN m.id END) as unique_movements_used,
    ROUND(COUNT(DISTINCT CASE WHEN cm.id IS NOT NULL THEN m.id END)::numeric /
          COUNT(DISTINCT m.id)::numeric * 100, 1) as coverage_percentage,
    COUNT(cm.id) as total_usage_count
FROM movements m
LEFT JOIN class_movements cm ON m.id = cm.movement_id
LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE
GROUP BY m.difficulty_level
ORDER BY m.difficulty_level;

-- ================================================================
-- 7. TOP 10 MOST USED vs LEAST USED MOVEMENTS
-- ================================================================

-- Most Used
WITH usage_stats AS (
    SELECT
        m.name,
        m.difficulty_level,
        COUNT(DISTINCT cm.class_id) as times_used
    FROM movements m
    LEFT JOIN class_movements cm ON m.id = cm.movement_id
    LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE
    GROUP BY m.id, m.name, m.difficulty_level
)
SELECT
    'TOP 10 MOST USED' as category,
    name,
    difficulty_level,
    times_used
FROM usage_stats
WHERE times_used > 0
ORDER BY times_used DESC
LIMIT 10;

-- Least Used (excluding never used)
WITH usage_stats AS (
    SELECT
        m.name,
        m.difficulty_level,
        COUNT(DISTINCT cm.class_id) as times_used
    FROM movements m
    LEFT JOIN class_movements cm ON m.id = cm.movement_id
    LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE
    GROUP BY m.id, m.name, m.difficulty_level
)
SELECT
    'BOTTOM 10 LEAST USED' as category,
    name,
    difficulty_level,
    times_used
FROM usage_stats
WHERE times_used > 0
ORDER BY times_used ASC
LIMIT 10;

-- ================================================================
-- 8. DAILY TRACKING - RUN THIS EACH DAY
-- ================================================================

SELECT
    DATE(ch.created_at) as class_date,
    COUNT(DISTINCT ch.id) as classes_generated,
    COUNT(DISTINCT cm.movement_id) as unique_movements_used,
    ROUND(COUNT(DISTINCT cm.movement_id)::numeric / 34.0 * 100, 1) as daily_repertoire_coverage_pct
FROM class_history ch
LEFT JOIN class_movements cm ON ch.id = cm.class_id
WHERE ch.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(ch.created_at)
ORDER BY class_date DESC;

-- ================================================================
-- 9. WEEKLY COVERAGE TREND
-- ================================================================

SELECT
    DATE_TRUNC('week', ch.created_at) as week_start,
    COUNT(DISTINCT ch.id) as classes_generated,
    COUNT(DISTINCT cm.movement_id) as unique_movements_used,
    ROUND(COUNT(DISTINCT cm.movement_id)::numeric / 34.0 * 100, 1) as weekly_repertoire_coverage_pct
FROM class_history ch
LEFT JOIN class_movements cm ON ch.id = cm.class_id
WHERE ch.created_at >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', ch.created_at)
ORDER BY week_start DESC;