-- ============================================================================
-- Supabase Database Cleanup Script
-- ============================================================================
-- Purpose: Remove unused tables and fields to streamline PII inventory
-- Date: December 9, 2025
-- Impact: Removes 144 unused fields (20% reduction in reviewable fields)
--
-- IMPORTANT:
-- 1. BACKUP DATABASE FIRST!
-- 2. Test in staging/development environment first
-- 3. Review CLEANUP_ANALYSIS.md for full context
-- 4. Run each phase separately and verify results before proceeding
-- ============================================================================

-- ============================================================================
-- PRE-FLIGHT CHECKS
-- ============================================================================

-- Verify you're in the correct database
SELECT current_database();

-- Count tables before cleanup (for comparison later)
SELECT
  table_schema,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('auth', 'storage', 'realtime')
GROUP BY table_schema
ORDER BY table_schema;

-- ============================================================================
-- PHASE 1: DROP REALTIME SCHEMA TABLES (100% unused)
-- ============================================================================
-- Impact: Removes 17 fields
-- Risk: LOW - Application does not use Supabase Realtime
-- ============================================================================

BEGIN;

-- Drop realtime.messages table
DROP TABLE IF EXISTS realtime.messages CASCADE;

-- Drop realtime.subscription table
DROP TABLE IF EXISTS realtime.subscription CASCADE;

-- Drop realtime schema migrations
DROP TABLE IF EXISTS realtime.schema_migrations CASCADE;

-- Verify realtime tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'realtime';
-- Expected: 0 rows

COMMIT;

-- ============================================================================
-- PHASE 2: DROP UNUSED STORAGE SCHEMA TABLES (62% unused)
-- ============================================================================
-- Impact: Removes 45 fields
-- Risk: LOW - Keeping only buckets and objects (used for voiceovers)
-- Note: DO NOT drop storage.buckets or storage.objects (ACTIVELY USED)
-- ============================================================================

BEGIN;

-- Drop vector search tables (not using)
DROP TABLE IF EXISTS storage.vector_indexes CASCADE;
DROP TABLE IF EXISTS storage.buckets_vectors CASCADE;

-- Drop analytics tables (not using)
DROP TABLE IF EXISTS storage.buckets_analytics CASCADE;

-- Drop multipart upload tables (not using large file uploads)
DROP TABLE IF EXISTS storage.s3_multipart_uploads_parts CASCADE;
DROP TABLE IF EXISTS storage.s3_multipart_uploads CASCADE;

-- Drop prefix/folder structure table (not using)
DROP TABLE IF EXISTS storage.prefixes CASCADE;

-- Note: Keeping storage.migrations for Supabase versioning
-- Note: Keeping storage.buckets (defines movement-voiceovers bucket)
-- Note: Keeping storage.objects (stores voiceover MP3 files)

-- Verify only buckets, objects, and migrations remain
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'storage'
ORDER BY table_name;
-- Expected: buckets, migrations, objects

COMMIT;

-- ============================================================================
-- PHASE 3: DROP UNUSED AUTH SCHEMA TABLES - MFA (Multi-Factor Auth)
-- ============================================================================
-- Impact: Removes 24 fields
-- Risk: LOW - Application does not use MFA
-- ============================================================================

BEGIN;

-- Drop MFA challenges table
DROP TABLE IF EXISTS auth.mfa_challenges CASCADE;

-- Drop MFA factors table (TOTP, SMS, WebAuthn)
DROP TABLE IF EXISTS auth.mfa_factors CASCADE;

-- Drop MFA AMR claims table (Authentication Method Reference)
DROP TABLE IF EXISTS auth.mfa_amr_claims CASCADE;

-- Verify MFA tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
  AND table_name LIKE 'mfa_%';
-- Expected: 0 rows

COMMIT;

-- ============================================================================
-- PHASE 4: DROP UNUSED AUTH SCHEMA TABLES - OAuth Server
-- ============================================================================
-- Impact: Removes 32 fields
-- Risk: LOW - Application does not act as OAuth server
-- Note: We use Supabase Auth for our own login, not providing OAuth to others
-- ============================================================================

BEGIN;

-- Drop OAuth authorization table
DROP TABLE IF EXISTS auth.oauth_authorizations CASCADE;

-- Drop OAuth client registration table
DROP TABLE IF EXISTS auth.oauth_clients CASCADE;

-- Drop OAuth user consent table
DROP TABLE IF EXISTS auth.oauth_consents CASCADE;

-- Verify OAuth tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
  AND table_name LIKE 'oauth_%';
-- Expected: 0 rows

COMMIT;

-- ============================================================================
-- PHASE 5: DROP UNUSED AUTH SCHEMA TABLES - SAML SSO
-- ============================================================================
-- Impact: Removes 8 fields
-- Risk: LOW - Application does not use SAML SSO
-- ============================================================================

BEGIN;

-- Drop SAML provider table
DROP TABLE IF EXISTS auth.saml_providers CASCADE;

-- Drop SAML relay state table (SAML flow tracking)
DROP TABLE IF EXISTS auth.saml_relay_states CASCADE;

-- Verify SAML tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
  AND table_name LIKE 'saml_%';
-- Expected: 0 rows

COMMIT;

-- ============================================================================
-- PHASE 6: DROP UNUSED AUTH SCHEMA TABLES - SSO
-- ============================================================================
-- Impact: Removes 2 fields
-- Risk: LOW - Application does not use SSO domains/providers
-- ============================================================================

BEGIN;

-- Drop SSO domains table
DROP TABLE IF EXISTS auth.sso_domains CASCADE;

-- Drop SSO providers table
DROP TABLE IF EXISTS auth.sso_providers CASCADE;

-- Verify SSO tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
  AND table_name LIKE 'sso_%';
-- Expected: 0 rows

COMMIT;

-- ============================================================================
-- PHASE 7: DROP UNUSED AUTH SCHEMA TABLES - Advanced Features
-- ============================================================================
-- Impact: Removes 16 fields
-- Risk: MEDIUM - Verify these aren't used by Supabase internally
-- Note: flow_state may be used by Supabase OAuth flow even if we don't use OAuth
-- Note: instances may be used by Supabase for multi-project management
-- ============================================================================

-- ⚠️ CAUTION: Uncomment these ONLY after verifying in staging environment

-- BEGIN;

-- -- Drop OAuth flow state table
-- -- Note: Supabase may use this internally for social login flow
-- -- DROP TABLE IF EXISTS auth.flow_state CASCADE;

-- -- Drop instances table (multi-tenancy/multi-project)
-- -- Note: Supabase may use this for project isolation
-- -- DROP TABLE IF EXISTS auth.instances CASCADE;

-- COMMIT;

-- ============================================================================
-- POST-CLEANUP VERIFICATION
-- ============================================================================

-- Count tables after cleanup
SELECT
  table_schema,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('auth', 'storage', 'realtime')
GROUP BY table_schema
ORDER BY table_schema;

-- List remaining auth tables (should be 9-11 tables)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
ORDER BY table_name;
-- Expected tables:
--   audit_log_entries
--   identities
--   refresh_tokens
--   schema_migrations
--   sessions
--   users
--   one_time_tokens
-- Optional (if not dropped in Phase 7):
--   flow_state
--   instances

-- List remaining storage tables (should be 3 tables)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'storage'
ORDER BY table_name;
-- Expected tables:
--   buckets
--   migrations
--   objects

-- List remaining realtime tables (should be 0 tables)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'realtime';
-- Expected: 0 rows

-- Count total columns remaining in auth + storage + realtime
SELECT
  table_schema,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema IN ('auth', 'storage', 'realtime')
GROUP BY table_schema
ORDER BY table_schema;

-- ============================================================================
-- CLEANUP ORPHANED RLS POLICIES (if any)
-- ============================================================================

-- Check for policies on dropped tables
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname IN ('auth', 'storage', 'realtime')
  AND tablename IN (
    'mfa_challenges', 'mfa_factors', 'mfa_amr_claims',
    'oauth_authorizations', 'oauth_clients', 'oauth_consents',
    'saml_providers', 'saml_relay_states',
    'sso_domains', 'sso_providers',
    'flow_state', 'instances',
    'vector_indexes', 'buckets_vectors', 'buckets_analytics',
    's3_multipart_uploads', 's3_multipart_uploads_parts', 'prefixes',
    'messages', 'subscription'
  );
-- Expected: 0 rows (policies auto-dropped with CASCADE)

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
If you need to rollback this cleanup:

1. DO NOT manually recreate tables - Supabase manages these schemas
2. Instead, use Supabase CLI or Dashboard to reset auth/storage/realtime:

   supabase db reset --linked

3. Alternatively, restore from pre-cleanup database backup:

   pg_restore -d postgres -U postgres backup.dump

4. After rollback, verify application functionality:
   - Login/register/logout
   - Voiceover playback
   - All user flows
*/

-- ============================================================================
-- FINAL NOTES
-- ============================================================================

/*
WHAT WAS REMOVED:
- 17 fields from realtime schema (100% - not using realtime at all)
- 45 fields from storage schema (62% - keeping only buckets + objects)
- 82 fields from auth schema (44% - removing MFA, OAuth, SAML, SSO)

TOTAL REMOVED: 144 fields

WHAT WAS KEPT:
- All 393 fields in public schema (our application data)
- 103 fields in auth schema (core authentication)
- 27 fields in storage schema (voiceover file storage)
- 17 fields in vault schema (secrets management)

TOTAL KEPT: 540 fields (down from 684 fields)

PII INVENTORY IMPACT:
- Before: 727 reviewable fields (excluding system catalogs)
- After: 583 reviewable fields
- Reduction: 20%

NEXT STEPS:
1. Test all auth flows (login, register, password reset, logout)
2. Test voiceover playback (verify storage.buckets + storage.objects work)
3. Monitor Supabase logs for any errors referencing dropped tables
4. Review GDPR PII inventory focusing on 6 PII-bearing tables in public schema
5. Document cleanup in CLAUDE.md
*/
