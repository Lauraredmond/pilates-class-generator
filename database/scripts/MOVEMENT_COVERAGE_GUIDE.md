# Movement Repertoire Coverage Monitoring Guide

## Purpose
Monitor how effectively your AI class generation covers all 34 classical Pilates movements to ensure comprehensive training over time.

## Quick Start

### Step 1: Clear Historical Data (One-Time)
This gives you a clean slate to start monitoring from today forward.

```sql
-- First, create a backup (recommended!)
CREATE TABLE class_history_backup_20260202 AS
SELECT * FROM class_history WHERE created_at < CURRENT_DATE;

-- Then delete old data
DELETE FROM class_movements
WHERE class_id IN (
    SELECT id FROM class_history
    WHERE created_at < CURRENT_DATE
);

DELETE FROM class_history
WHERE created_at < CURRENT_DATE;
```

### Step 2: Generate Classes Normally
Use the app as you normally would, generating classes for your workouts.

### Step 3: Monitor Coverage Daily/Weekly

Run these key queries in Supabase SQL Editor:

#### Check Overall Coverage
```sql
-- How many of the 34 movements have been used?
SELECT
    COUNT(DISTINCT m.id) as total_movements,
    COUNT(DISTINCT cm.movement_id) as movements_used_today,
    ROUND(COUNT(DISTINCT cm.movement_id)::numeric / 34.0 * 100, 1) as coverage_percentage
FROM movements m
LEFT JOIN class_movements cm ON m.id = cm.movement_id
LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE;
```

#### Find Neglected Movements
```sql
-- Which movements haven't been used?
SELECT name, difficulty_level
FROM movements
WHERE id NOT IN (
    SELECT DISTINCT movement_id
    FROM class_movements cm
    JOIN class_history ch ON cm.class_id = ch.id
    WHERE ch.created_at >= CURRENT_DATE
)
ORDER BY difficulty_level, name;
```

## What to Look For

### Good Coverage Indicators
- **Daily:** 8-12 unique movements per class (25-35% of repertoire)
- **Weekly:** 20-25 unique movements used (60-75% coverage)
- **Monthly:** 30-34 unique movements used (90-100% coverage)

### Red Flags
- Same 5-6 movements appearing in every class
- Entire difficulty levels being ignored (e.g., no Advanced movements)
- Muscle groups consistently underrepresented
- Movement patterns missing (e.g., no lateral flexion or rotation)

## Files Created

1. **`clear_class_history_pre_today.sql`**
   - Safely removes old class history
   - Includes preview queries before deletion
   - Has backup/restore commands

2. **`monitor_movement_coverage.sql`**
   - Comprehensive monitoring queries
   - 9 different analysis reports
   - Daily and weekly tracking

3. **`repertoire_coverage_helper.sh`**
   - Interactive bash script
   - Menu-driven interface
   - Guides you through common tasks

## Usage Tips

### Daily Monitoring Routine (2 minutes)
1. After generating a class, run the "Overall Coverage" query
2. Check if any movements hit 0 uses for more than a week
3. Note any muscle groups falling below 20% representation

### Weekly Review (5 minutes)
1. Run the full `monitor_movement_coverage.sql` suite
2. Review the "Never Used Movements" list
3. Check muscle group balance
4. Look at difficulty level distribution

### Monthly Analysis (10 minutes)
1. Export coverage data to spreadsheet
2. Graph trends over time
3. Identify patterns in AI selection bias
4. Adjust class generation parameters if needed

## Interpreting Results

### Coverage Percentage
- **0-25%**: Very narrow repertoire - AI may be stuck in patterns
- **26-50%**: Limited variety - check difficulty settings
- **51-75%**: Good variety for short-term
- **76-100%**: Excellent comprehensive coverage

### Movement Frequency Distribution
- **Ideal**: Bell curve with most movements used 2-4 times
- **Problem**: Heavy skew with few movements used 10+ times, many at 0

### Muscle Group Balance
- **Target**: Each major group appears in 40-60% of classes
- **Concern**: Any group below 20% or above 80%

## Troubleshooting Low Coverage

If coverage stays below 50% after a week:

1. **Vary your class parameters:**
   - Alternate difficulty levels (Beginner → Intermediate → Advanced)
   - Change focus areas (core → flexibility → strength)
   - Vary class durations (30 min → 45 min → 60 min)

2. **Check AI prompts:**
   - Review if prompts are too restrictive
   - Ensure "variety" is emphasized in generation

3. **Manual intervention:**
   - Use manual mode occasionally to select underused movements
   - This can help "train" the AI through usage patterns

## Advanced Analysis

### Sequence Pattern Analysis
```sql
-- How often do certain movements appear together?
SELECT
    m1.name as movement_1,
    m2.name as movement_2,
    COUNT(*) as times_paired
FROM class_movements cm1
JOIN class_movements cm2 ON cm1.class_id = cm2.class_id
JOIN movements m1 ON cm1.movement_id = m1.id
JOIN movements m2 ON cm2.movement_id = m2.id
WHERE cm1.movement_id < cm2.movement_id
  AND cm1.class_id IN (
    SELECT id FROM class_history
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  )
GROUP BY m1.name, m2.name
HAVING COUNT(*) > 1
ORDER BY times_paired DESC
LIMIT 20;
```

### AI Bias Detection
```sql
-- Compare AI vs expected distribution
WITH expected AS (
    SELECT
        difficulty_level,
        COUNT(*) as movement_count,
        COUNT(*)::numeric / 34.0 as expected_ratio
    FROM movements
    GROUP BY difficulty_level
),
actual AS (
    SELECT
        m.difficulty_level,
        COUNT(DISTINCT cm.movement_id) as movements_used,
        COUNT(*)::numeric / NULLIF((
            SELECT COUNT(*)
            FROM class_movements cm2
            JOIN class_history ch2 ON cm2.class_id = ch2.id
            WHERE ch2.created_at >= CURRENT_DATE
        ), 0) as actual_ratio
    FROM movements m
    JOIN class_movements cm ON m.id = cm.movement_id
    JOIN class_history ch ON cm.class_id = ch.id
    WHERE ch.created_at >= CURRENT_DATE
    GROUP BY m.difficulty_level
)
SELECT
    e.difficulty_level,
    e.movement_count as available_movements,
    COALESCE(a.movements_used, 0) as movements_used,
    ROUND(e.expected_ratio * 100, 1) as expected_pct,
    ROUND(COALESCE(a.actual_ratio, 0) * 100, 1) as actual_pct,
    ROUND((COALESCE(a.actual_ratio, 0) - e.expected_ratio) * 100, 1) as bias_pct
FROM expected e
LEFT JOIN actual a ON e.difficulty_level = a.difficulty_level
ORDER BY e.difficulty_level;
```

## Success Metrics

After 30 days of monitoring, you should see:
- ✅ 90%+ of movements used at least once
- ✅ No movement unused for more than 14 days
- ✅ Muscle group balance within 40-60% range
- ✅ All difficulty levels represented proportionally
- ✅ Movement patterns evenly distributed

This monitoring will help ensure your AI-generated classes provide comprehensive Pilates training that covers the full classical repertoire!