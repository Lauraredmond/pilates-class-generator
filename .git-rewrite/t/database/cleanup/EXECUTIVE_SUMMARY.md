# Database Cleanup - Executive Summary

**Date:** December 9, 2025
**Analyst:** Claude Code
**Objective:** Streamline PII inventory by removing/excluding unused tables and fields

---

## Key Findings

### Current State
- **Total fields:** 2,808 across all schemas
- **System catalogs (untouchable):** 2,081 fields (74%)
- **Application reviewable:** 727 fields (26%)

### Proposed Cleanup
- **Fields to remove:** 144 (auth + storage + realtime schemas)
- **Fields after cleanup:** 583 reviewable fields
- **Reduction:** 20% fewer fields to review for PII inventory

---

## Recommended Approach

### Option 1: Drop Unused Tables (AGGRESSIVE)

**SQL Script:** `CLEANUP_UNUSED_TABLES.sql`

**Pros:**
- Permanently removes 144 unused fields
- Cleaner database schema
- Faster backups/restores
- Lower storage costs

**Cons:**
- Requires database backup first
- Must test in staging environment
- Risk of breaking Supabase internal services
- Irreversible without backup restoration

**Risk Level:** 🟡 MEDIUM RISK

**Recommendation:** Test in development environment first, then staging, before production.

---

### Option 2: Exclude from PII Inventory (CONSERVATIVE) ⭐ **RECOMMENDED**

**Approach:** Don't drop tables; instead exclude them from PII inventory scope.

**How:**
1. Document which schemas/tables to exclude from inventory
2. Focus PII review ONLY on these 6 public schema tables:
   - `user_profiles` (email, full_name, age_range, gender_identity, country)
   - `pii_tokens` (tokenized PII storage)
   - `ropa_audit_log` (user_id for GDPR tracking)
   - `ai_decision_log` (user_id for EU AI Act)
   - `class_history` (user_id for activity tracking)
   - `student_profiles` (check for PII fields)

**Pros:**
- Zero risk - no database changes
- Immediate impact - start focused inventory today
- Reversible - can always expand scope later
- Supabase services continue working normally

**Cons:**
- Tables still exist in database (but not queried by app)
- Slightly higher storage costs (negligible)

**Risk Level:** 🟢 ZERO RISK

**Recommendation:** ⭐ **START HERE** - Focus PII inventory on 6 tables, ignore the rest.

---

## PII Inventory Quick Start Guide

### Step 1: Exclude Non-PII Schemas (Immediate)

**Exclude entirely from PII inventory:**
- `pg_catalog` - PostgreSQL system (1,377 fields)
- `information_schema` - PostgreSQL metadata (696 fields)
- `extensions` - PostgreSQL extensions (51 fields)
- `vault` - Secrets management (17 fields, no PII)

**Why:** These are system catalogs with no user PII.

---

### Step 2: Exclude Auth Schema Non-PII Tables (Immediate)

**Exclude from inventory (Supabase-managed, no app PII):**
- `auth.audit_log_entries` - Supabase internal audit (5 fields)
- `auth.mfa_*` - MFA tables (not using)
- `auth.oauth_*` - OAuth server tables (not using)
- `auth.saml_*` - SAML SSO tables (not using)
- `auth.sso_*` - SSO tables (not using)
- `auth.flow_state` - OAuth flow (not using)
- `auth.instances` - Multi-tenancy (not using)

**Keep in inventory (potential PII):**
- `auth.users` - Core user authentication
- `auth.identities` - OAuth identity links
- `auth.sessions` - Active user sessions (user_id)
- `auth.refresh_tokens` - JWT tokens (user_id)
- `auth.one_time_tokens` - Password reset tokens (user_id, email)

**Why:** Unused auth tables have no application PII. Focus on tables with user_id/email.

---

### Step 3: Exclude Storage Schema (Immediate)

**Exclude from inventory (no PII):**
- `storage.buckets` - Bucket configuration (10 fields)
- `storage.objects` - File metadata (17 fields)
- `storage.*` - All other storage tables

**Why:** Storage tables contain file metadata (filenames, sizes, timestamps), not user PII. Voiceover files are movement-related, not user-specific.

---

### Step 4: Exclude Realtime Schema (Immediate)

**Exclude entirely:**
- `realtime.*` - All tables (17 fields)

**Why:** Not using Supabase Realtime. No application data in this schema.

---

### Step 5: Focus Public Schema PII Review (YOUR WORK HERE)

**6 tables with potential PII (only ~100 fields to review):**

1. **user_profiles** (13 fields)
   - ✅ PII: `email`, `full_name`, `age_range`, `gender_identity`, `country`
   - ❌ Not PII: `id`, `hashed_password`, `created_at`, `updated_at`, `last_login`, `pilates_experience`, `goals`, `is_admin`

2. **pii_tokens** (6 fields)
   - ✅ PII: `token` (encrypted), `decrypted_value` (when decrypted)
   - ❌ Not PII: `id`, `user_id`, `created_at`, `updated_at`

3. **ropa_audit_log** (18 fields)
   - ✅ PII: `user_id` (GDPR Article 30 processing record)
   - ❌ Not PII: All other fields are GDPR metadata

4. **ai_decision_log** (17 fields)
   - ✅ PII: `user_id` (EU AI Act transparency)
   - ❌ Not PII: All other fields are AI decision metadata

5. **class_history** (13 fields)
   - ✅ PII: `user_id` (activity tracking)
   - ❌ Not PII: All other fields are class metadata

6. **student_profiles** (17 fields)
   - ⚠️ REVIEW: Check for PII fields (name, age, contact info)

**Other public tables (NO PII):**
- `movements`, `music_*`, `class_*`, `sequence_*`, etc. - No user data, only application reference data

---

## Estimated Time Savings

### Before (Reviewing All Fields)
- Total reviewable fields: 727
- Estimated time: 14.5 hours @ 3 min/field
- Cost (if consultant): $2,900 @ $200/hr

### After (Focused PII Review)
- Fields to review: ~100 (6 tables only)
- Estimated time: 2 hours @ 3 min/field
- Cost (if consultant): $400 @ $200/hr

**Time Saved:** 12.5 hours (86% reduction)
**Cost Saved:** $2,500 (86% reduction)

---

## Execution Plan

### Week 1: Conservative Approach (RECOMMENDED) ⭐

**Day 1:**
1. Read this executive summary
2. Review `CLEANUP_ANALYSIS.md` for detailed table analysis
3. Create PII inventory spreadsheet with 6 tables only

**Day 2-3:**
1. Review `user_profiles` table (13 fields)
2. Review `pii_tokens` table (6 fields)
3. Review `ropa_audit_log` table (18 fields)
4. Review `ai_decision_log` table (17 fields)
5. Review `class_history` table (13 fields)
6. Review `student_profiles` table (17 fields)

**Day 4:**
1. Document PII findings
2. Create GDPR Article 30 ROPA (Record of Processing Activities)
3. Update privacy policy if needed

**Total time:** 4 days, zero risk, immediate focus

---

### Week 2+: Aggressive Approach (Optional)

**Only if you want to permanently remove unused tables:**

**Day 1:**
1. Backup production database
2. Create staging environment
3. Run `CLEANUP_UNUSED_TABLES.sql` in staging
4. Test all application flows in staging

**Day 2:**
1. Monitor staging for 24 hours
2. Check Supabase logs for errors
3. Verify voiceover playback works
4. Test auth flows thoroughly

**Day 3:**
1. If staging OK, schedule production maintenance window
2. Backup production database again
3. Run cleanup script in production
4. Monitor for 24 hours

**Day 4:**
1. Verify all user flows work
2. Check error logs
3. Document cleanup in CLAUDE.md
4. Update this summary with results

**Total time:** 4 days, medium risk, permanent cleanup

---

## Decision Matrix

| Criteria | Option 1: Drop Tables | Option 2: Exclude from Inventory |
|----------|----------------------|----------------------------------|
| **Time to start** | 4+ days (testing required) | Immediate (today) |
| **Risk level** | 🟡 Medium | 🟢 Zero |
| **Reversibility** | Requires backup restore | Fully reversible |
| **PII inventory impact** | 20% fewer fields | 86% fewer fields to review |
| **Database changes** | Permanent table drops | No changes |
| **Supabase compatibility** | Must verify in staging | 100% compatible |
| **Time investment** | 4+ days setup + testing | 2 hours focused review |
| **Cost savings** | Storage costs (negligible) | Consultant time (significant) |
| **Recommended for** | Production optimization (long-term) | PII inventory (immediate) |

---

## Final Recommendation

### For Immediate PII Inventory: ⭐ **Option 2** (Exclude from Inventory)

**Why:**
1. Zero risk - no database changes
2. Immediate start - begin today
3. 86% time reduction - review 100 fields instead of 727
4. Focus where it matters - 6 tables with actual user PII

**Action:** Start with Step 1-5 above (exclude schemas, focus on 6 tables).

---

### For Long-Term Database Optimization: **Option 1** (Drop Tables)

**Why:**
1. Cleaner schema - only used tables remain
2. Faster backups - less data to back up
3. Lower costs - less storage used (though minimal impact)

**Action:** After PII inventory complete, run cleanup in staging → production.

---

## Questions?

**Q: Is it safe to drop auth.mfa_* tables if we might add MFA later?**
A: Yes, Supabase will recreate these tables when you enable MFA in the dashboard.

**Q: Will dropping storage tables affect voiceover playback?**
A: No, we're keeping `storage.buckets` and `storage.objects` (actively used for voiceovers).

**Q: Can I restore dropped tables if needed?**
A: Only from database backup. Always backup before running cleanup script.

**Q: How do I exclude schemas from PII inventory in practice?**
A: Simply don't export/review them. Focus your CSV export or spreadsheet on the 6 public schema tables listed in Step 5.

---

## Next Steps

1. ✅ Read this executive summary
2. ✅ Review `CLEANUP_ANALYSIS.md` for full context
3. ✅ Choose approach (Option 1 or Option 2)
4. ✅ Start PII inventory focusing on 6 tables
5. ⏸️ Optionally run `CLEANUP_UNUSED_TABLES.sql` in staging later

**Start here:** Focus on `user_profiles` table first (13 fields, ~40 minutes). That's where most user PII lives.
