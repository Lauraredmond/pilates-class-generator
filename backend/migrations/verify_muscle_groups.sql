-- ============================================================================
-- MUSCLE GROUP VERIFICATION QUERY
-- Run this to check the state of muscle groups in the database
-- ============================================================================

-- 1. Check for non-canonical muscle group names (should be 0 after migration)
SELECT '=== NON-CANONICAL MUSCLE GROUPS ===' as check_section;
SELECT
    mm.muscle_group_name as non_canonical_name,
    COUNT(*) as occurrences
FROM movement_muscles mm
WHERE mm.muscle_group_name NOT IN (SELECT name FROM muscle_groups)
GROUP BY mm.muscle_group_name
ORDER BY occurrences DESC;

-- 2. Check Swimming Box muscle groups
SELECT '=== SWIMMING BOX MUSCLE GROUPS ===' as check_section;
SELECT
    m.name as movement_name,
    COUNT(mm.muscle_group_name) as muscle_group_count,
    STRING_AGG(mm.muscle_group_name, ', ' ORDER BY mm.muscle_group_name) as muscle_groups
FROM movements m
LEFT JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE m.id = '4b13e7b5-d008-4341-aa08-5a0d17042f86'
GROUP BY m.id, m.name;

-- 3. Compare both Swimming movements
SELECT '=== SWIMMING MOVEMENTS COMPARISON ===' as check_section;
SELECT
    m.name as movement_name,
    COUNT(mm.muscle_group_name) as muscle_group_count
FROM movements m
LEFT JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE LOWER(m.name) LIKE '%swimming%'
GROUP BY m.id, m.name
ORDER BY m.name;

-- 4. Top muscle groups by usage
SELECT '=== TOP 10 MUSCLE GROUPS BY USAGE ===' as check_section;
SELECT
    mm.muscle_group_name,
    COUNT(*) as movement_count,
    CASE WHEN mg.name IS NOT NULL THEN 'CANONICAL' ELSE 'NON-CANONICAL' END as status
FROM movement_muscles mm
LEFT JOIN muscle_groups mg ON mm.muscle_group_name = mg.name
GROUP BY mm.muscle_group_name, mg.name
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 5. Count of canonical vs non-canonical
SELECT '=== CANONICAL STATUS SUMMARY ===' as check_section;
SELECT
    CASE WHEN mg.name IS NOT NULL THEN 'CANONICAL' ELSE 'NON-CANONICAL' END as status,
    COUNT(DISTINCT mm.muscle_group_name) as unique_names,
    COUNT(*) as total_usage
FROM movement_muscles mm
LEFT JOIN muscle_groups mg ON mm.muscle_group_name = mg.name
GROUP BY CASE WHEN mg.name IS NOT NULL THEN 'CANONICAL' ELSE 'NON-CANONICAL' END;

-- 6. All canonical muscle groups and their usage
SELECT '=== ALL CANONICAL MUSCLE GROUPS ===' as check_section;
SELECT
    mg.name as canonical_name,
    COALESCE(usage.count, 0) as usage_count
FROM muscle_groups mg
LEFT JOIN (
    SELECT muscle_group_name, COUNT(*) as count
    FROM movement_muscles
    GROUP BY muscle_group_name
) usage ON mg.name = usage.muscle_group_name
ORDER BY COALESCE(usage.count, 0) DESC, mg.name;