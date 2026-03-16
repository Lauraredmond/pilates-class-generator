-- ============================================================================
-- Migration: Drop movement_usage table
-- Date: March 16, 2026
-- Phase: 3 - Final cleanup of deprecated table
-- ============================================================================

-- PREREQUISITES:
-- 1. Phase 1 completed: No more writes to movement_usage (✅ DONE)
-- 2. Phase 2 completed: All reads migrated to class_movements (✅ DONE)
-- 3. Data archived: 80 records backed up before deletion (⚠️ MANUAL BACKUP REQUIRED)

-- ============================================================================
-- MANUAL BACKUP COMMAND (Run this first in Supabase SQL editor):
-- ============================================================================
/*
-- Create backup table
CREATE TABLE IF NOT EXISTS movement_usage_archive AS
SELECT * FROM movement_usage;

-- Add archive metadata
ALTER TABLE movement_usage_archive
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS archive_reason TEXT DEFAULT 'Table deprecated in favor of class_movements';

-- Verify backup
SELECT COUNT(*) FROM movement_usage_archive;
-- Expected: 80 records
*/

-- ============================================================================
-- DROP TABLE (Run after backup is verified)
-- ============================================================================

-- Drop the deprecated movement_usage table
DROP TABLE IF EXISTS movement_usage CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify:
-- 1. movement_usage table no longer exists
-- 2. movement_usage_archive contains the backed-up data (if created)
-- 3. Application still functions normally (all code has been migrated)

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================
/*
-- To rollback, recreate the table from the archive:
CREATE TABLE movement_usage AS
SELECT
    id,
    user_id,
    movement_id,
    usage_count,
    last_used_date,
    created_at,
    updated_at
FROM movement_usage_archive;

-- Recreate any indexes or constraints as needed
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- This completes the 3-phase migration:
-- Phase 1: Stopped writes to movement_usage table
-- Phase 2: Migrated all reads to class_movements table
-- Phase 3: Dropped the deprecated table
--
-- The movement_usage table had 80 records from earlier testing.
-- All movement tracking is now done through class_movements which has
-- better data consistency and full historical tracking.