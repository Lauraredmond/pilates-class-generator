#!/bin/bash

# ================================================================
# Movement Repertoire Coverage Helper Script
# Purpose: Simplify class history cleanup and monitoring
# Author: Claude Code
# Date: 2026-02-02
# ================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Movement Repertoire Coverage Tool${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to display menu
show_menu() {
    echo -e "${GREEN}Choose an action:${NC}"
    echo "1) Preview class history that will be deleted"
    echo "2) CREATE BACKUP of class history (recommended first!)"
    echo "3) CLEAR class history prior to today"
    echo "4) View current movement coverage statistics"
    echo "5) Show movements never used"
    echo "6) Show muscle group balance"
    echo "7) Show daily/weekly trends"
    echo "8) Run full coverage report"
    echo "9) Exit"
    echo ""
}

# Function to run SQL from file
run_sql_file() {
    local sql_file=$1
    local description=$2

    echo -e "${YELLOW}Running: ${description}${NC}"
    echo "----------------------------------------"

    # You'll need to add your Supabase connection here
    # Option 1: Use psql with connection string
    # psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f "$sql_file"

    # Option 2: Output SQL for manual execution
    echo -e "${BLUE}Copy and run this SQL in Supabase SQL Editor:${NC}"
    echo ""
    cat "$sql_file"
    echo ""
    echo "----------------------------------------"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (1-9): " choice

    case $choice in
        1)
            echo -e "${YELLOW}Previewing class history to be deleted...${NC}"
            cat <<EOF

-- Run this in Supabase SQL Editor:

SELECT
    'Preview: Classes to be deleted' as action,
    COUNT(*) as classes_to_delete,
    MIN(created_at) as earliest_class,
    MAX(created_at) as latest_class_to_delete
FROM class_history
WHERE created_at < CURRENT_DATE;

SELECT
    'Preview: Movement records to be deleted' as action,
    COUNT(DISTINCT cm.class_id) as affected_classes,
    COUNT(*) as total_movement_records
FROM class_movements cm
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at < CURRENT_DATE;
EOF
            ;;

        2)
            echo -e "${GREEN}Creating backup tables...${NC}"
            cat <<EOF

-- Run this in Supabase SQL Editor to create backups:

CREATE TABLE class_history_backup_$(date +%Y%m%d) AS
SELECT * FROM class_history WHERE created_at < CURRENT_DATE;

CREATE TABLE class_movements_backup_$(date +%Y%m%d) AS
SELECT cm.*
FROM class_movements cm
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at < CURRENT_DATE;

SELECT 'Backup created' as status,
       (SELECT COUNT(*) FROM class_history_backup_$(date +%Y%m%d)) as history_rows_backed_up,
       (SELECT COUNT(*) FROM class_movements_backup_$(date +%Y%m%d)) as movements_rows_backed_up;
EOF
            ;;

        3)
            echo -e "${RED}WARNING: This will permanently delete class history prior to today!${NC}"
            read -p "Are you sure you want to continue? (yes/no): " confirm

            if [ "$confirm" = "yes" ]; then
                echo -e "${YELLOW}Deleting class history...${NC}"
                cat <<EOF

-- Run this in Supabase SQL Editor:

-- Delete class movements first (child records)
DELETE FROM class_movements
WHERE class_id IN (
    SELECT id
    FROM class_history
    WHERE created_at < CURRENT_DATE
);

-- Delete class history records
DELETE FROM class_history
WHERE created_at < CURRENT_DATE;

-- Verify deletion
SELECT
    'Remaining classes' as status,
    COUNT(*) as total_classes,
    MIN(created_at) as earliest_class,
    MAX(created_at) as latest_class
FROM class_history;
EOF
            else
                echo -e "${GREEN}Deletion cancelled.${NC}"
            fi
            ;;

        4)
            echo -e "${BLUE}Movement Coverage Statistics${NC}"
            cat <<EOF

-- Run this in Supabase SQL Editor:

WITH movement_stats AS (
    SELECT
        m.id,
        m.name,
        m.difficulty_level,
        COUNT(DISTINCT cm.class_id) as times_used
    FROM movements m
    LEFT JOIN class_movements cm ON m.id = cm.movement_id
    LEFT JOIN class_history ch ON cm.class_id = ch.id AND ch.created_at >= CURRENT_DATE
    GROUP BY m.id, m.name, m.difficulty_level
)
SELECT
    'Movement Coverage Today' as report,
    COUNT(*) as total_movements,
    COUNT(CASE WHEN times_used > 0 THEN 1 END) as movements_used,
    COUNT(CASE WHEN times_used = 0 OR times_used IS NULL THEN 1 END) as movements_never_used,
    ROUND(COUNT(CASE WHEN times_used > 0 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 1) as coverage_percentage
FROM movement_stats;
EOF
            ;;

        5)
            echo -e "${RED}Movements Never Used${NC}"
            cat <<EOF

-- Run this in Supabase SQL Editor:

SELECT
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
EOF
            ;;

        6)
            echo -e "${BLUE}Muscle Group Balance${NC}"
            cat <<EOF

-- Run this in Supabase SQL Editor:

SELECT
    mg.name as muscle_group,
    COUNT(DISTINCT cm.class_id) as classes_targeting,
    ROUND(COUNT(DISTINCT cm.class_id)::numeric /
          NULLIF((SELECT COUNT(DISTINCT id) FROM class_history WHERE created_at >= CURRENT_DATE), 0)::numeric * 100, 1)
          as percentage_of_classes
FROM muscle_groups mg
JOIN movement_muscles mm ON mg.id = mm.muscle_group_id
JOIN class_movements cm ON mm.movement_id = cm.movement_id
JOIN class_history ch ON cm.class_id = ch.id
WHERE ch.created_at >= CURRENT_DATE
GROUP BY mg.id, mg.name
ORDER BY classes_targeting DESC;
EOF
            ;;

        7)
            echo -e "${BLUE}Daily/Weekly Trends${NC}"
            cat <<EOF

-- Run this in Supabase SQL Editor:

-- Daily tracking
SELECT
    DATE(ch.created_at) as class_date,
    COUNT(DISTINCT ch.id) as classes_generated,
    COUNT(DISTINCT cm.movement_id) as unique_movements_used,
    ROUND(COUNT(DISTINCT cm.movement_id)::numeric / 34.0 * 100, 1) as repertoire_coverage_pct
FROM class_history ch
LEFT JOIN class_movements cm ON ch.id = cm.class_id
WHERE ch.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(ch.created_at)
ORDER BY class_date DESC;

-- Weekly tracking
SELECT
    DATE_TRUNC('week', ch.created_at) as week_start,
    COUNT(DISTINCT ch.id) as classes_generated,
    COUNT(DISTINCT cm.movement_id) as unique_movements_used,
    ROUND(COUNT(DISTINCT cm.movement_id)::numeric / 34.0 * 100, 1) as repertoire_coverage_pct
FROM class_history ch
LEFT JOIN class_movements cm ON ch.id = cm.class_id
WHERE ch.created_at >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', ch.created_at)
ORDER BY week_start DESC;
EOF
            ;;

        8)
            echo -e "${GREEN}Running full coverage report...${NC}"
            echo -e "${BLUE}Copy the SQL from monitor_movement_coverage.sql and run in Supabase${NC}"
            echo "File location: database/scripts/monitor_movement_coverage.sql"
            ;;

        9)
            echo -e "${GREEN}Exiting...${NC}"
            exit 0
            ;;

        *)
            echo -e "${RED}Invalid choice. Please enter a number between 1 and 9.${NC}"
            ;;
    esac

    echo ""
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
    clear
done