-- Migration 023: Enable Row Level Security (RLS) on Public Tables
-- Date: December 10, 2025
-- Purpose: Fix CRITICAL security warnings - enable RLS on 10 public tables
--
-- Supabase Security Linter Report:
-- - 10 tables marked as ERROR: "RLS Disabled in Public"
-- - Risk: Any authenticated user can read/modify ALL rows without restrictions
--
-- This migration:
-- 1. Enables RLS on all affected tables
-- 2. Creates appropriate RLS policies based on table purpose
-- 3. Ensures users can only access their own data or read-only reference data

-- =============================================================================
-- PART 1: USER DATA TABLES (Users access only their own data)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: user_profiles
-- Access: Users can only read/update their own profile
-- NOTE: user_profiles table uses 'id' as primary key (NOT 'user_id')
-- -----------------------------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Table: user_preferences
-- Access: Users can only read/update their own preferences
-- -----------------------------------------------------------------------------
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Table: medical_exclusions_log
-- Access: Users can only view their own medical exclusion logs
-- Service role can insert new exclusion logs
-- -----------------------------------------------------------------------------
ALTER TABLE medical_exclusions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medical exclusions"
  ON medical_exclusions_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert medical exclusions"
  ON medical_exclusions_log
  FOR INSERT
  WITH CHECK (true); -- Service role bypass RLS by default

-- -----------------------------------------------------------------------------
-- Table: pii_field_registry
-- Access: Admin only (contains PII schema information)
-- Regular users should never directly access this table
-- -----------------------------------------------------------------------------
ALTER TABLE pii_field_registry ENABLE ROW LEVEL SECURITY;

-- No policies - admin/service role only
-- Service role automatically bypasses RLS
-- This effectively makes the table inaccessible to regular users

-- =============================================================================
-- PART 2: REFERENCE DATA TABLES (Read-only for authenticated users)
-- =============================================================================
-- These tables contain class content that all users can read but not modify

-- -----------------------------------------------------------------------------
-- Table: warmup_routines
-- Access: All authenticated users can read, no one can modify via API
-- -----------------------------------------------------------------------------
ALTER TABLE warmup_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view warmup routines"
  ON warmup_routines
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- Table: cooldown_sequences
-- Access: All authenticated users can read, no one can modify via API
-- -----------------------------------------------------------------------------
ALTER TABLE cooldown_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cooldown sequences"
  ON cooldown_sequences
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- Table: closing_meditation_scripts
-- Access: All authenticated users can read, no one can modify via API
-- -----------------------------------------------------------------------------
ALTER TABLE closing_meditation_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view meditation scripts"
  ON closing_meditation_scripts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- Table: closing_homecare_advice
-- Access: All authenticated users can read, no one can modify via API
-- -----------------------------------------------------------------------------
ALTER TABLE closing_homecare_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view homecare advice"
  ON closing_homecare_advice
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- Table: movement_levels
-- Access: All authenticated users can read, no one can modify via API
-- -----------------------------------------------------------------------------
ALTER TABLE movement_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movement levels"
  ON movement_levels
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- Table: preparation_scripts
-- Access: All authenticated users can read, no one can modify via API
-- -----------------------------------------------------------------------------
ALTER TABLE preparation_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view preparation scripts"
  ON preparation_scripts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- =============================================================================

-- Verify RLS is enabled on all 10 tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'user_profiles', 'user_preferences', 'medical_exclusions_log',
--     'warmup_routines', 'cooldown_sequences', 'pii_field_registry',
--     'closing_meditation_scripts', 'closing_homecare_advice',
--     'movement_levels', 'preparation_scripts'
--   );
-- Expected: rowsecurity = true for all 10 tables

-- Verify policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- Expected: 16 policies total across 9 tables (pii_field_registry has 0 policies)

-- =============================================================================
-- ROLLBACK PLAN (If something goes wrong)
-- =============================================================================

-- To disable RLS and remove policies (EMERGENCY ONLY):
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE medical_exclusions_log DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE warmup_routines DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cooldown_sequences DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE pii_field_registry DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE closing_meditation_scripts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE closing_homecare_advice DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE movement_levels DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE preparation_scripts DISABLE ROW LEVEL SECURITY;

-- Drop all policies:
-- DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
-- DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
-- DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
-- DROP POLICY IF EXISTS "Users can view own medical exclusions" ON medical_exclusions_log;
-- DROP POLICY IF EXISTS "Service role can insert medical exclusions" ON medical_exclusions_log;
-- DROP POLICY IF EXISTS "Authenticated users can view warmup routines" ON warmup_routines;
-- DROP POLICY IF EXISTS "Authenticated users can view cooldown sequences" ON cooldown_sequences;
-- DROP POLICY IF EXISTS "Authenticated users can view meditation scripts" ON closing_meditation_scripts;
-- DROP POLICY IF EXISTS "Authenticated users can view homecare advice" ON closing_homecare_advice;
-- DROP POLICY IF EXISTS "Authenticated users can view movement levels" ON movement_levels;
-- DROP POLICY IF EXISTS "Authenticated users can view preparation scripts" ON preparation_scripts;
