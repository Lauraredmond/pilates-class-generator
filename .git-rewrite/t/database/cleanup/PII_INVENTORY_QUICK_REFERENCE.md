# PII Inventory Quick Reference Card

**Purpose:** Focus PII inventory on these core tables (ignoring 2,600+ system/unused fields)

---

## ✅ TABLES TO REVIEW (12 application tables + 2 auth tables = 14 tables, ~240 fields total)

### 1. auth.identities (9 fields)

**Location:** `auth.identities`

**Purpose:** OAuth/Social login identity mapping (Google, GitHub, etc.)

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **email** | ✅ YES | Article 4(1) - Personal Data | OAuth provider email |
| **identity_data** | ✅ YES | Article 4(1) - Personal Data | JSONB with OAuth data (name, avatar, etc.) |
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| provider_id | ❌ NO | - | Provider's user ID (pseudonym) |
| provider | ❌ NO | - | Provider name (google, github) |
| last_sign_in_at | ❌ NO | - | Timestamp (metadata) |
| created_at | ❌ NO | - | Timestamp (metadata) |
| updated_at | ❌ NO | - | Timestamp (metadata) |
| id | ❌ NO | - | UUID (not PII) |

**PII Count:** 2 direct PII fields + 1 indirect

**⚠️ CRITICAL:** `identity_data` JSONB field contains OAuth provider response with:
- Full name
- Email address
- Profile picture URL
- Provider-specific metadata (can vary by provider)

**Example identity_data content:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "sub": "1234567890",
  "email_verified": true
}
```

---

### 2. user_profiles (13 fields)

**Location:** `public.user_profiles`

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **email** | ✅ YES | Article 4(1) - Personal Data | Unique identifier |
| **full_name** | ✅ YES | Article 4(1) - Personal Data | User's name |
| **age_range** | ✅ YES | Article 9(1) - Special Category (Health) | Age-related health data |
| **gender_identity** | ✅ YES | Article 9(1) - Special Category (Personal Beliefs) | Sensitive data |
| **country** | ✅ YES | Article 4(1) - Personal Data | Location data |
| id | ❌ NO | - | UUID (not PII) |
| hashed_password | ❌ NO | - | One-way hash (not reversible PII) |
| created_at | ❌ NO | - | Timestamp (metadata) |
| updated_at | ❌ NO | - | Timestamp (metadata) |
| last_login | ❌ NO | - | Timestamp (metadata) |
| pilates_experience | ❌ NO | - | Skill level (not PII) |
| goals | ❌ NO | - | Fitness goals (not PII) |
| is_admin | ❌ NO | - | Boolean flag (not PII) |

**PII Count:** 5 fields with PII

---

### 3. users (12 fields)

**Location:** `public.users`

**Purpose:** Application-managed user accounts (uses PII tokenization)

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **email_token** | ✅ YES (when detokenized) | Article 4(1) - Personal Data | Tokenized email |
| **full_name_token** | ✅ YES (when detokenized) | Article 4(1) - Personal Data | Tokenized full name |
| id | ❌ NO | - | UUID (not PII) |
| role | ❌ NO | - | User role (instructor, etc.) |
| preferences | ❌ NO | - | User settings (JSONB) |
| is_active | ❌ NO | - | Account status boolean |
| created_at | ❌ NO | - | Timestamp (metadata) |
| updated_at | ❌ NO | - | Timestamp (metadata) |
| last_login_at | ❌ NO | - | Timestamp (metadata) |
| medical_disclaimer_accepted | ❌ NO | - | Boolean flag |
| medical_disclaimer_accepted_at | ❌ NO | - | Timestamp (metadata) |
| medical_disclaimer_version | ❌ NO | - | Version string |

**PII Count:** 2 fields with tokenized PII

**Note:** This table uses the PII tokenization system. Actual PII values are encrypted in `pii_tokens` table and referenced via tokens.

---

### 4. pii_tokens (6 fields)

**Location:** `public.pii_tokens`

**Purpose:** Tokenized PII storage for GDPR compliance

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **token** | ✅ YES (when decrypted) | Article 32 - Security | Encrypted PII |
| **decrypted_value** | ✅ YES (in memory only) | Article 32 - Security | PII when accessed |
| id | ❌ NO | - | UUID (not PII) |
| user_id | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| created_at | ❌ NO | - | Timestamp (metadata) |
| updated_at | ❌ NO | - | Timestamp (metadata) |

**PII Count:** 2 fields with PII (when decrypted)

**Note:** This table IS the PII protection mechanism. Actual PII is encrypted here, not in user_profiles.

---

### 5. ropa_audit_log (18 fields)

**Location:** `public.ropa_audit_log`

**Purpose:** GDPR Article 30 Record of Processing Activities

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| id | ❌ NO | - | UUID (not PII) |
| processing_activity | ❌ NO | - | Activity type (metadata) |
| legal_basis | ❌ NO | - | GDPR legal basis (metadata) |
| data_categories | ❌ NO | - | Category names (metadata) |
| processing_purpose | ❌ NO | - | Purpose description (metadata) |
| recipients | ❌ NO | - | Data processor names (metadata) |
| retention_period | ❌ NO | - | Time period (metadata) |
| created_at | ❌ NO | - | Timestamp (metadata) |
| ... | ❌ NO | - | All other fields are GDPR metadata |

**PII Count:** 1 field with indirect PII (user_id)

**Note:** This table tracks HOW we process PII, not the PII itself.

---

### 6. ai_decision_log (17 fields)

**Location:** `public.ai_decision_log`

**Purpose:** EU AI Act transparency and accountability

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| id | ❌ NO | - | UUID (not PII) |
| agent_name | ❌ NO | - | AI agent type (metadata) |
| input_parameters | ❌ NO | - | AI inputs (metadata) |
| output_data | ❌ NO | - | AI outputs (metadata) |
| reasoning | ❌ NO | - | AI explanation (metadata) |
| confidence_score | ❌ NO | - | 0-1 decimal (metadata) |
| model_version | ❌ NO | - | Version string (metadata) |
| created_at | ❌ NO | - | Timestamp (metadata) |
| ... | ❌ NO | - | All other fields are AI metadata |

**PII Count:** 1 field with indirect PII (user_id)

**Note:** This table tracks AI DECISIONS about users, not user PII itself.

---

### 7. class_history (13 fields)

**Location:** `public.class_history`

**Purpose:** Track user's class generation and playback activity

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| id | ❌ NO | - | UUID (not PII) |
| class_plan_id | ❌ NO | - | UUID (not PII) |
| action_type | ❌ NO | - | Enum (metadata) |
| created_at | ❌ NO | - | Timestamp (metadata) |
| duration_seconds | ❌ NO | - | Integer (metadata) |
| completion_percentage | ❌ NO | - | 0-100 integer (metadata) |
| ... | ❌ NO | - | All other fields are activity metadata |

**PII Count:** 1 field with indirect PII (user_id)

**Note:** This table tracks WHAT users do, not WHO they are.

---

### 8. student_profiles (17 fields)

**Location:** `public.student_profiles`

**Purpose:** [CHECK YOUR DATABASE - This table name suggests instructor/student management]

⚠️ **ACTION REQUIRED:** Check this table's columns. Likely contains:
- Student name (PII)
- Student email (PII)
- Student age (PII)
- Emergency contact info (PII)
- Medical conditions (Special Category PII - Article 9)

**PII Count:** UNKNOWN - Requires manual review

**Recommendation:** If not actively used, consider dropping this table. If used, it likely contains the most sensitive PII in the database.

---

### 9. user_preferences (21 fields)

**Location:** `public.user_preferences`

**Purpose:** User settings and preferences for class generation

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| **preferred_movements** | ⚠️ BEHAVIORAL | Article 4(1) - Personal Data | Movement preferences reveal health/physical state |
| **favorite_movements** | ⚠️ BEHAVIORAL | Article 4(1) - Personal Data | Favorites reveal health/physical patterns |
| id | ❌ NO | - | UUID (not PII) |
| strictness_level | ❌ NO | - | AI setting (metadata) |
| default_class_duration | ❌ NO | - | Integer (metadata) |
| music_preferences | ❌ NO | - | Genre preference (metadata) |
| email_notifications | ❌ NO | - | Boolean (metadata) |
| class_reminders | ❌ NO | - | Boolean (metadata) |
| analytics_enabled | ❌ NO | - | Boolean (metadata) |
| data_sharing_enabled | ❌ NO | - | Boolean (metadata) |
| ... | ❌ NO | - | All other fields are settings metadata |

**PII Count:** 1 direct indirect PII (user_id) + 2 behavioral data fields

**Note:** Behavioral preferences (movement choices) can reveal health status and should be treated as sensitive data under GDPR.

---

### 10. class_plans (22 fields)

**Location:** `public.class_plans`

**Purpose:** User-created and AI-generated class plans

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| id | ❌ NO | - | UUID (not PII) |
| title | ❌ NO | - | Class name (metadata) |
| description | ❌ NO | - | Text description (metadata) |
| difficulty_level | ❌ NO | - | Beginner/Intermediate/Advanced |
| duration_minutes | ❌ NO | - | Integer (metadata) |
| main_sequence | ❌ NO | - | Movement IDs (metadata) |
| warm_up_movements | ❌ NO | - | Movement IDs (metadata) |
| cool_down_movements | ❌ NO | - | Movement IDs (metadata) |
| generated_by_ai | ❌ NO | - | Boolean (metadata) |
| ai_agent_version | ❌ NO | - | Version string (metadata) |
| ... | ❌ NO | - | All other fields are class metadata |

**PII Count:** 1 field with indirect PII (user_id)

**Note:** Class plans themselves don't contain PII, but user_id links them to specific users.

---

### 11. movement_usage (8 fields)

**Location:** `public.movement_usage`

**Purpose:** Track which movements each user has performed

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| **movement_id** | ⚠️ BEHAVIORAL | Article 4(1) - Personal Data | Usage patterns reveal physical abilities |
| **usage_count** | ⚠️ BEHAVIORAL | Article 4(1) - Personal Data | Frequency reveals health/fitness level |
| **last_used_date** | ⚠️ BEHAVIORAL | Article 4(1) - Personal Data | Activity patterns are personal data |
| id | ❌ NO | - | UUID (not PII) |
| weeks_since_last_use | ❌ NO | - | Calculated field (metadata) |
| created_at | ❌ NO | - | Timestamp (metadata) |
| updated_at | ❌ NO | - | Timestamp (metadata) |

**PII Count:** 1 direct indirect PII (user_id) + 3 behavioral data fields

**Note:** Movement usage patterns reveal physical capabilities and health status - treat as sensitive under GDPR Article 9 (health data).

---

### 12. medical_exclusions_log (8 fields)

**Location:** `public.medical_exclusions_log`

**Purpose:** Log when movements are excluded due to medical conditions

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **user_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| **student_profile_id** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to student (if used) |
| **exclusion_type** | ✅ YES | Article 9(1) - Special Category (Health) | Medical condition type |
| **exclusion_reason** | ✅ YES | Article 9(1) - Special Category (Health) | Medical reasoning |
| id | ❌ NO | - | UUID (not PII) |
| action_taken | ❌ NO | - | What was done (metadata) |
| detected_at | ❌ NO | - | Timestamp (metadata) |
| created_at | ❌ NO | - | Timestamp (metadata) |

**PII Count:** 2 indirect PII fields + 2 fields with **Article 9 Special Category Health Data**

**⚠️ CRITICAL:** This table contains **health data** (medical exclusions) which requires explicit consent under GDPR Article 9. Highest risk table in database.

---

## ⚠️ ADDITIONAL AUTH SCHEMA TABLES (Review Separately)

These Supabase-managed auth tables contain PII but should be reviewed separately from the application-managed tables above:

### 13. auth.users (34 fields)

**Location:** `auth.users`

**Purpose:** Supabase Auth core user table (managed by Supabase)

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **email** | ✅ YES | Article 4(1) - Personal Data | Primary email address |
| **phone** | ✅ YES | Article 4(1) - Personal Data | Phone number (if used) |
| **raw_user_meta_data** | ✅ YES | Article 4(1) - Personal Data | JSONB with user profile data |
| **raw_app_meta_data** | ⚠️ MAYBE | Article 4(1) - Personal Data | JSONB with app metadata |
| user_id | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| encrypted_password | ❌ NO | - | One-way hash (not reversible) |
| confirmation_token | ❌ NO | - | Temporary token (not PII) |
| recovery_token | ❌ NO | - | Temporary token (not PII) |
| ... | ❌ NO | - | All other fields are auth metadata |

**PII Count:** 3-4 fields with direct PII

**⚠️ IMPORTANT:** This table is managed by Supabase Auth service. We use `user_profiles.email` as our application's source of truth, but `auth.users.email` still contains PII that must be included in GDPR compliance reviews.

---

### 14. auth.sessions (15 fields)

**Location:** `auth.sessions`

**Purpose:** Active user sessions (managed by Supabase)

| Field | PII? | GDPR Article | Notes |
|-------|------|--------------|-------|
| **ip** | ✅ YES | Article 4(1) - Personal Data | IP address (PII under GDPR) |
| **user_agent** | ⚠️ INDIRECT | Article 4(1) - Personal Data | Device/browser fingerprint |
| user_id | ⚠️ INDIRECT | Article 4(1) - Personal Data | Links to user |
| created_at | ❌ NO | - | Timestamp (metadata) |
| updated_at | ❌ NO | - | Timestamp (metadata) |
| ... | ❌ NO | - | All other fields are session metadata |

**PII Count:** 1 field with direct PII (ip), 1 field with indirect PII (user_agent)

**⚠️ IMPORTANT:** IP addresses are considered personal data under GDPR Article 4(1). Even though this table is Supabase-managed, IP address logging must be documented in your ROPA.

---

## ❌ TABLES TO IGNORE (2,690+ fields)

### System Catalogs (DO NOT REVIEW)
- `pg_catalog.*` - PostgreSQL internals (1,377 fields)
- `information_schema.*` - Database metadata (696 fields)
- `extensions.*` - PostgreSQL extensions (51 fields)

### Supabase Internal (DO NOT REVIEW)
- `auth.audit_log_entries` - Supabase audit (5 fields, managed by Supabase)
- `auth.mfa_*` - Multi-factor auth (not using)
- `auth.oauth_*` - OAuth server (not using)
- `auth.saml_*` - SAML SSO (not using)
- `auth.sso_*` - SSO (not using)
- `auth.flow_state` - OAuth flow (not using)
- `auth.instances` - Multi-tenancy (not using)
- `storage.*` - File storage (no user PII, only file metadata)
- `realtime.*` - Real-time sync (not using)
- `vault.*` - Secrets management (API keys, not user data)

### Application Reference Data (NO USER PII)
- `movements` - 34 classical Pilates movements (reference data)
- `music_*` - Music tracks and playlists (reference data)
- `preparation_scripts` - Class section content (reference data)
- `warmup_routines` - Class section content (reference data)
- `cooldown_sequences` - Class section content (reference data)
- `closing_meditation_scripts` - Class section content (reference data)
- `closing_homecare_advice` - Class section content (reference data)
- `sequence_rules` - Business rules (reference data)
- `movement_muscles` - Muscle group mappings (reference data)
- `muscle_groups` - Muscle reference data
- `teaching_cues` - Instructional text (reference data)
- `common_mistakes` - Instructional guidance (reference data)
- `transitions` - Movement transitions (reference data)
- `bias_monitoring` - AI bias metrics (no user data)
- `model_drift_log` - AI model monitoring (no user data)
- `llm_invocation_log` - LLM API call tracking (no user data)
- `beta_errors` - Error tracking (no user data)

---

## PII Inventory Checklist

### Step 1: Export 14 Tables Only (30 minutes)

```sql
-- Run this query in Supabase SQL Editor to get PII fields only

-- Table 1: auth.identities (OAuth identity data)
SELECT
  'auth.identities' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('email', 'identity_data') THEN 'YES'
    WHEN column_name = 'user_id' THEN 'INDIRECT'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'identities'

UNION ALL

-- Table 2: user_profiles (core user PII)
SELECT
  'user_profiles' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('email', 'full_name', 'age_range', 'gender_identity', 'country') THEN 'YES'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'

UNION ALL

-- Table 3: users (application-managed accounts with tokenization)
SELECT
  'users' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('email_token', 'full_name_token') THEN 'YES'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'

UNION ALL

-- Table 4: pii_tokens (tokenized PII storage)
SELECT
  'pii_tokens' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('token', 'decrypted_value') THEN 'YES'
    WHEN column_name = 'user_id' THEN 'INDIRECT'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pii_tokens'

UNION ALL

-- Tables 5-7: GDPR/EU AI Act compliance tables (indirect PII via user_id)
SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'user_id' THEN 'INDIRECT'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('ropa_audit_log', 'ai_decision_log', 'class_history')

UNION ALL

-- Table 8: student_profiles (requires manual review)
SELECT
  'student_profiles' as table_name,
  column_name,
  data_type,
  'REVIEW REQUIRED' as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_profiles'

UNION ALL

-- Table 9: user_preferences (user settings with behavioral data)
SELECT
  'user_preferences' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'user_id' THEN 'INDIRECT'
    WHEN column_name IN ('preferred_movements', 'favorite_movements') THEN 'BEHAVIORAL'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_preferences'

UNION ALL

-- Table 10: class_plans (user-created class plans)
SELECT
  'class_plans' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'user_id' THEN 'INDIRECT'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'class_plans'

UNION ALL

-- Table 11: movement_usage (behavioral usage patterns)
SELECT
  'movement_usage' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'user_id' THEN 'INDIRECT'
    WHEN column_name IN ('movement_id', 'usage_count', 'last_used_date') THEN 'BEHAVIORAL'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'movement_usage'

UNION ALL

-- Table 12: medical_exclusions_log (CRITICAL - Article 9 health data)
SELECT
  'medical_exclusions_log' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('user_id', 'student_profile_id') THEN 'INDIRECT'
    WHEN column_name IN ('exclusion_type', 'exclusion_reason') THEN 'YES - ARTICLE 9 HEALTH'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'medical_exclusions_log'

UNION ALL

-- Table 13: auth.users (Supabase-managed auth)
SELECT
  'auth.users' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('email', 'phone', 'raw_user_meta_data') THEN 'YES'
    WHEN column_name IN ('raw_app_meta_data', 'user_id') THEN 'INDIRECT'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'

UNION ALL

-- Table 14: auth.sessions (Supabase-managed sessions)
SELECT
  'auth.sessions' as table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'ip' THEN 'YES'
    WHEN column_name IN ('user_agent', 'user_id') THEN 'INDIRECT'
    ELSE 'NO'
  END as contains_pii
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'sessions'

ORDER BY table_name, column_name;
```

### Step 2: Review Each Field (3.5 hours)

For each field marked 'YES', 'REVIEW REQUIRED', 'BEHAVIORAL', or 'ARTICLE 9 HEALTH':
1. What data does it store? (e.g., "User's email address")
2. Why do we collect it? (e.g., "Account login and notifications")
3. Legal basis? (e.g., "Consent (GDPR Article 6(1)(a))")
4. Who has access? (e.g., "User, admin, backend API")
5. Retention period? (e.g., "Until account deletion + 30 days")
6. Where is it processed? (e.g., "Supabase EU, OpenAI API")
7. Is it encrypted? (e.g., "Yes, AES-256 via pii_tokens table")

### Step 3: Document in ROPA (1 hour)

Create GDPR Article 30 Record of Processing Activities:
- Processing activity: "User account management"
- Legal basis: Consent (Article 6(1)(a))
- Data categories: Name, email, age range, gender, country
- Purpose: Authentication, personalization, analytics
- Recipients: Supabase (EU), OpenAI (US - Standard Contractual Clauses)
- Retention: Active user + 30 days post-deletion
- Security: AES-256 encryption, tokenization, RLS

### Step 4: Update Privacy Policy (30 minutes)

Ensure privacy policy includes:
- What PII we collect (5 fields from user_profiles)
- Why we collect it (authentication + personalization)
- Legal basis (consent)
- How long we keep it (active + 30 days)
- User rights (access, delete, export, correct)
- Data processors (Supabase, OpenAI)
- Transfer mechanisms (SCCs for US processors)

---

## Total Time: 6 hours

- Export: 30 min
- Review: 3.5 hours (240 fields - includes CRITICAL health data review)
- ROPA: 1.5 hours (medical exclusions require Article 9 consent documentation)
- Privacy Policy: 45 min (must disclose health data processing)
- Buffer: 15 min

**vs. Reviewing all 2,808 fields:** 140+ hours

**Time saved:** 134 hours (96% reduction)

---

## Key Takeaways

1. **🚨 CRITICAL - Article 9 Health Data:** `medical_exclusions_log` contains SPECIAL CATEGORY health data (exclusion_type, exclusion_reason) requiring EXPLICIT CONSENT under GDPR Article 9. This is the highest-risk table in your database.

2. **Focus:** 14 tables total with direct PII in 5 core tables:
   - `user_profiles`: 5 PII fields (email, full_name, age_range, gender_identity, country)
   - `users`: 2 tokenized PII fields (email_token, full_name_token)
   - `auth.identities`: 2 PII fields (email, identity_data with OAuth provider data)
   - `auth.users`: 3-4 PII fields (email, phone, raw_user_meta_data)
   - `medical_exclusions_log`: 2 Article 9 health fields (exclusion_type, exclusion_reason)

3. **Behavioral Data = PII:** Movement usage patterns, preferred movements, and class history reveal health/fitness status and count as personal data under GDPR:
   - `movement_usage`: usage_count, last_used_date reveal physical capabilities
   - `user_preferences`: preferred_movements reveal health limitations

4. **Dual User Tables:** We have both `public.users` (tokenized) and `public.user_profiles` (plain) - understand which is source of truth for your app

5. **OAuth Risk:** `auth.identities.identity_data` JSONB contains OAuth provider data (name, email, profile picture) - often overlooked!

6. **IP Addresses:** `auth.sessions.ip` contains IP addresses which are PII under GDPR Article 4(1)

7. **Indirect PII Everywhere:** 12 of 14 tables contain `user_id` - ALL must be included in ROPA even if no direct PII

8. **Tokenization:** Actual PII is encrypted in `pii_tokens` table

9. **Compliance:** We have strong GDPR/EU AI Act infrastructure (ROPA, AI logs, bias monitoring)

---

## Questions?

**Q: What about auth.users.email?**
A: We use `user_profiles.email` as source of truth. `auth.users` is Supabase-managed and should be reviewed separately (not in this quick reference). However, `auth.identities` IS included above because it contains OAuth provider PII.

**Q: What's in auth.identities.identity_data?**
A: This JSONB field contains the OAuth provider's response (Google, GitHub, etc.) which typically includes:
- Full name
- Email address
- Profile picture URL
- OAuth provider ID (sub)
- Email verification status
The exact fields vary by provider, so you should query an actual row to see what's stored.

**Q: Should I review other auth schema tables?**
A: Yes, but separately. Also consider:
- `auth.users` (email, phone, raw_user_meta_data)
- `auth.sessions` (IP addresses if logged)

**Q: What if I find PII in other tables?**
A: Add them to this list! This quick reference focuses on known PII locations, but always verify.

**Q: How do I handle user_id (indirect PII)?**
A: `user_id` is a pseudonym under GDPR. It's considered personal data when it can be linked back to a user, but it's lower risk than direct PII like email or name.
