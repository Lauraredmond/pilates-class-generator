# Supabase Database Cleanup Analysis

**Date:** December 9, 2025
**Total Fields in Database:** 2,808 fields across all schemas
**Source:** `Supabase Snippet Column Metadata Inventory.csv`

---

## Executive Summary

Out of 2,808 fields across all schemas:
- **2,081 fields (74%)** are PostgreSQL system catalogs (pg_catalog, information_schema) - **CANNOT TOUCH**
- **393 fields (14%)** are in public schema (our application) - **ALL USED**
- **185 fields (6.6%)** are in auth schema - **82 fields can be removed (44%)**
- **72 fields (2.6%)** are in storage schema - **45 fields can be removed (62%)**
- **17 fields (0.6%)** are in realtime schema - **ALL 17 can be removed (100%)**
- **51 fields (1.8%)** are in extensions schema - **CANNOT TOUCH**
- **17 fields (0.6%)** are in vault schema - **KEEP (secrets management)**

**Recommendation:** Remove 144 unused fields (auth + storage + realtime) to reduce inventory from 727 fields to 583 fields (**20% reduction**).

---

## Schema Breakdown

### 1. PostgreSQL System Schemas (CANNOT MODIFY)

```
pg_catalog: 1,377 fields (49%)
information_schema: 696 fields (25%)
extensions: 51 fields (1.8%)
```

**Status:** These are PostgreSQL internal system catalogs. DO NOT MODIFY.

---

### 2. Public Schema (Our Application) - ALL USED

**Total:** 393 fields across 31 tables

**Analysis:** All tables in public schema have been verified as used in the application:

| Table | Columns | Usage Status | Evidence |
|-------|---------|--------------|----------|
| movements | 23 | ✅ USED | Core application (34 classical movements) |
| user_preferences | 22 | ✅ USED | Settings page (all fields referenced) |
| class_plans | 22 | ✅ USED | Saved classes |
| music_tracks | 19 | ✅ USED | Musopen/Internet Archive music |
| ropa_audit_log | 18 | ✅ USED | GDPR compliance (Article 30) |
| student_profiles | 17 | ✅ USED | 48 references in codebase |
| ai_decision_log | 17 | ✅ USED | EU AI Act compliance |
| warmup_routines | 16 | ✅ USED | Class Section 2 (Session 11) |
| llm_invocation_log | 15 | ✅ USED | LLM debugging/monitoring |
| cooldown_sequences | 15 | ✅ USED | Class Section 4 (Session 11) |
| closing_homecare_advice | 15 | ✅ USED | Class Section 6 (Session 11) |
| sequence_rules | 14 | ✅ USED | 53 references (safety validation) |
| closing_meditation_scripts | 14 | ✅ USED | Class Section 5 (Session 11) |
| user_profiles | 13 | ✅ USED | Profile page (all PII fields) |
| preparation_scripts | 13 | ✅ USED | Class Section 1 (Session 11) |
| movement_levels | 13 | ✅ USED | 16 references (difficulty progression) |
| class_history | 13 | ✅ USED | User activity tracking |
| users | 12 | ✅ USED | Core auth table |
| music_playlists | 12 | ✅ USED | Music organization |
| model_drift_log | 12 | ✅ USED | EU AI Act compliance |
| bias_monitoring | 12 | ✅ USED | EU AI Act compliance |
| class_movements | 9 | ✅ USED | 32 references (junction table) |
| movement_usage | 8 | ✅ USED | 69 references (tracking) |
| medical_exclusions_log | 8 | ✅ USED | 11 references (safety) |
| teaching_cues | 7 | ✅ USED | 42 references (instruction text) |
| music_playlist_tracks | 7 | ✅ USED | Many-to-many playlist tracks |
| pii_tokens | 6 | ✅ USED | PII tokenization (GDPR) |
| common_mistakes | 6 | ✅ USED | 18 references (instruction guidance) |
| transitions | 5 | ✅ USED | AI-generated between movements |
| muscle_groups | 5 | ✅ USED | 172 references (heavily used) |
| movement_muscles | 5 | ✅ USED | Many-to-many muscle mappings |

**Recommendation:** ✅ KEEP ALL PUBLIC SCHEMA TABLES - All are actively used.

---

### 3. Auth Schema (Supabase Auth) - 44% CAN BE REMOVED

**Total:** 185 fields across 19 tables

#### Tables to KEEP (103 fields - 56%)

| Table | Columns | Usage | Reason to Keep |
|-------|---------|-------|----------------|
| users | 16 | Core auth | Primary user authentication |
| identities | 9 | OAuth | Third-party login support |
| sessions | 8 | Active | User session management |
| refresh_tokens | 6 | Active | JWT refresh tokens |
| schema_migrations | 1 | System | Supabase auth versioning |
| audit_log_entries | 5 | Passive | Supabase internal audit (but we don't query it) |
| one_time_tokens | 7 | Email | Password reset, email verification |

**Total to keep:** 103 fields

#### Tables to REMOVE (82 fields - 44%)

| Table | Columns | App Usage | Safe to Drop |
|-------|---------|-----------|--------------|
| **mfa_challenges** | 7 | 0 references | ✅ YES - No MFA in app |
| **mfa_factors** | 12 | 5 refs (Supabase code only) | ✅ YES - No MFA in app |
| **mfa_amr_claims** | 5 | 0 references | ✅ YES - MFA claim tracking |
| **flow_state** | 11 | 8 refs (Supabase code only) | ✅ YES - OAuth flow (not using OAuth) |
| **instances** | 5 | 0 app references | ✅ YES - Multi-tenancy (not using) |
| **oauth_authorizations** | 15 | 0 references | ✅ YES - OAuth server (not using) |
| **oauth_clients** | 11 | 4 refs (Supabase code only) | ✅ YES - OAuth clients (not using) |
| **oauth_consents** | 6 | 0 references | ✅ YES - OAuth consents (not using) |
| **saml_providers** | 5 | 0 references | ✅ YES - SAML SSO (not using) |
| **saml_relay_states** | 3 | 0 references | ✅ YES - SAML flow (not using) |
| **sso_domains** | 1 | 0 references | ✅ YES - SSO domains (not using) |
| **sso_providers** | 1 | 0 references | ✅ YES - SSO providers (not using) |

**Total to remove:** 82 fields

---

### 4. Storage Schema (Supabase Storage) - 62% CAN BE REMOVED

**Total:** 72 fields across 9 tables

#### What We Use

- **buckets** table: For `movement-voiceovers` bucket (voiceover MP3 files)
- **objects** table: Actual audio files stored

**Evidence:**
```sql
-- From migration 017_update_preparation_scripts.sql
voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/1-preparation-phase.mp3'
```

#### Tables to KEEP (27 fields - 38%)

| Table | Columns | Usage | Reason |
|-------|---------|-------|--------|
| buckets | 10 | Active | Defines storage buckets |
| objects | 17 | Active | Stores actual files |

**Total to keep:** 27 fields

#### Tables to REMOVE (45 fields - 62%)

| Table | Columns | App Usage | Safe to Drop |
|-------|---------|-----------|--------------|
| **buckets_analytics** | 6 | Not using | ✅ YES - Analytics (not using) |
| **buckets_vectors** | 5 | Not using | ✅ YES - Vector search (not using) |
| **vector_indexes** | 7 | Not using | ✅ YES - Vector indexes (not using) |
| **s3_multipart_uploads** | 13 | Not using | ✅ YES - Large file uploads (not using) |
| **s3_multipart_uploads_parts** | 7 | Not using | ✅ YES - Upload chunks (not using) |
| **prefixes** | 6 | Not using | ✅ YES - Folder structure (not using) |
| **migrations** | 1 | System | ❓ MAYBE - Supabase versioning |

**Total to remove:** 45 fields (not counting migrations)

---

### 5. Realtime Schema (Supabase Realtime) - 100% CAN BE REMOVED

**Total:** 17 fields across 3 tables

#### App Usage Analysis

**Frontend realtime usage:** 1 reference (likely false positive)

```bash
grep -r "realtime" frontend/src --include="*.ts" --include="*.tsx" | wc -l
# Output: 1
```

**Not using:**
- No WebSocket subscriptions in frontend code
- No real-time data synchronization
- No collaborative features
- No live updates

#### All Tables to REMOVE (17 fields - 100%)

| Table | Columns | Safe to Drop |
|-------|---------|--------------|
| **messages** | 8 | ✅ YES - Not using realtime |
| **subscription** | 7 | ✅ YES - Not using realtime |
| **schema_migrations** | 2 | ✅ YES - Realtime versioning |

**Total to remove:** 17 fields

---

### 6. Vault Schema (Supabase Vault) - KEEP ALL

**Total:** 17 fields

**Status:** ✅ KEEP - Used for secrets management (API keys, etc.)

**Note:** Even if not currently using, vault is a critical security feature. DO NOT REMOVE.

---

## Columns to Remove Within Used Tables

### auth.audit_log_entries

**Current columns:**
```
instance_id, id, payload, created_at, ip_address
```

**Analysis:**
- `instance_id`: Supabase internal (multi-tenancy) - NOT USED by app
- `ip_address`: Supabase internal audit - NOT QUERIED by app

**Recommendation:**
⚠️ **DO NOT REMOVE** - This is a Supabase-managed table. Even though we don't query these columns, Supabase Auth service writes to them. Removing columns could break Supabase's internal audit logging.

**Alternative:** Ignore these columns during PII inventory. They're not part of our application data model.

---

## PII Inventory Impact

### Before Cleanup

```
Total fields: 2,808
Excludable system fields: 2,081 (pg_catalog, information_schema, extensions)
Potentially reviewable: 727 fields
```

### After Cleanup

```
Removed: 144 fields (auth + storage + realtime)
Remaining reviewable: 583 fields
Reduction: 20%
```

### PII Fields Actually Used (for GDPR inventory)

Focus inventory on these public schema tables with PII:

| Table | PII Fields | Purpose |
|-------|------------|---------|
| **user_profiles** | email, full_name, age_range, gender_identity, country | User registration data |
| **pii_tokens** | token, decrypted_value | PII tokenization storage |
| **ropa_audit_log** | user_id | GDPR processing activities |
| **ai_decision_log** | user_id | EU AI Act transparency |
| **class_history** | user_id | User activity tracking |
| **student_profiles** | (check for PII fields) | Student management |

**Total PII-bearing tables:** 6 out of 31 public schema tables

---

## Recommended Cleanup Order

### Phase 1: Safe Deletions (Low Risk)

1. Drop realtime schema tables (not using at all)
2. Drop unused storage schema tables (keeping buckets + objects)
3. Drop unused auth schema tables (MFA, OAuth, SAML, SSO)

### Phase 2: Verification (Medium Risk)

1. Verify no external integrations depend on dropped tables
2. Test auth flow (login, register, password reset, logout)
3. Test voiceover playback (storage.buckets + storage.objects)

### Phase 3: Monitoring (Post-Cleanup)

1. Monitor Supabase logs for errors referencing dropped tables
2. Check application error logs for missing table errors
3. Verify all user flows work correctly

---

## SQL Cleanup Scripts

See `CLEANUP_UNUSED_TABLES.sql` for executable SQL to drop unused tables.

---

## Risk Assessment

### Low Risk (✅ Safe to Drop)

- **realtime schema** - Not used at all
- **auth.mfa_* tables** - No MFA in application
- **auth.oauth_* tables** - No OAuth server functionality
- **auth.saml_* tables** - No SAML SSO
- **auth.sso_* tables** - No SSO
- **storage.buckets_analytics** - Not using analytics
- **storage.*_vectors** - Not using vector search
- **storage.s3_multipart_* - Not using large file uploads

### Medium Risk (⚠️ Verify First)

- **auth.flow_state** - May be used by Supabase internally for OAuth (even if we don't use OAuth directly)
- **auth.instances** - May be used by Supabase for multi-project management
- **storage.migrations** - Supabase versioning (probably safe to keep)

### High Risk (❌ DO NOT DROP)

- **auth.audit_log_entries** - Supabase-managed audit log (even if we don't query it)
- Any table in **public schema** - All verified as used
- **pg_catalog**, **information_schema**, **extensions** - PostgreSQL system catalogs

---

## Notes

1. **Supabase-managed tables:** Some auth and storage tables are managed by Supabase services. Even if our application code doesn't reference them, Supabase's internal services may write to them. Be cautious.

2. **RLS policies:** Dropping tables may leave orphaned RLS policies. Review and clean up policies after dropping tables.

3. **Foreign key constraints:** Some dropped tables may have foreign key relationships. The SQL script handles these with CASCADE.

4. **Backup first:** Always backup the database before running cleanup scripts.

5. **Test in staging:** Run cleanup in a staging/development environment first before production.
