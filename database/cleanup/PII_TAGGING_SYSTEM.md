# Database PII Tagging System

**Purpose:** Automate PII field detection for DPIA reports and ROPA transaction logging

**Created:** December 9, 2025

---

## Problem Statement

Current DPIA and ROPA systems don't automatically know which fields/transactions contain PII. Manual tracking is error-prone and incomplete.

**What We Need:**
- Automatic PII detection when generating DPIA reports
- Automatic PII transaction logging for ROPA
- Single source of truth for PII field classification
- Support for different PII types (direct, indirect, behavioral, Article 9 health)

---

## Proposed Solution: PII Field Registry Table

### Option 1: Dedicated Registry Table (RECOMMENDED) ⭐

Create a `pii_field_registry` table that maps every table.column to its PII classification:

```sql
CREATE TABLE public.pii_field_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_schema VARCHAR(255) NOT NULL,        -- 'public', 'auth', etc.
    table_name VARCHAR(255) NOT NULL,          -- 'user_profiles', 'movements', etc.
    column_name VARCHAR(255) NOT NULL,         -- 'email', 'user_id', etc.

    -- PII Classification
    pii_category VARCHAR(50) NOT NULL,         -- 'DIRECT', 'INDIRECT', 'BEHAVIORAL', 'HEALTH', 'NONE'
    gdpr_article VARCHAR(50),                  -- 'Article 4(1)', 'Article 9(1)', null
    data_type_label VARCHAR(100),              -- 'Email Address', 'User Pseudonym', 'Medical Condition'

    -- Sensitivity
    is_sensitive BOOLEAN DEFAULT false,        -- True for Article 9 health data
    requires_explicit_consent BOOLEAN DEFAULT false,  -- True for Article 9

    -- Metadata
    purpose TEXT,                              -- Why we collect this field
    legal_basis VARCHAR(100),                  -- 'Consent (6(1)(a))', 'Contract (6(1)(b))', etc.
    retention_period VARCHAR(100),             -- 'Active user + 30 days', 'Until deletion', etc.
    encryption_method VARCHAR(50),             -- 'AES-256', 'Tokenized', 'None', 'Hashed'

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(table_schema, table_name, column_name)
);

-- Index for fast lookups
CREATE INDEX idx_pii_registry_lookup ON pii_field_registry(table_schema, table_name, column_name);
CREATE INDEX idx_pii_category ON pii_field_registry(pii_category);
CREATE INDEX idx_sensitive_data ON pii_field_registry(is_sensitive) WHERE is_sensitive = true;
```

### Seed Data (Populate from PII Inventory)

```sql
-- DIRECT PII EXAMPLES
INSERT INTO pii_field_registry (table_schema, table_name, column_name, pii_category, gdpr_article, data_type_label, is_sensitive, requires_explicit_consent, purpose, legal_basis, retention_period, encryption_method) VALUES

-- user_profiles (direct PII)
('public', 'user_profiles', 'email', 'DIRECT', 'Article 4(1)', 'Email Address', false, false, 'Account login and notifications', 'Consent (6(1)(a))', 'Active user + 30 days', 'None'),
('public', 'user_profiles', 'full_name', 'DIRECT', 'Article 4(1)', 'Full Name', false, false, 'User identification', 'Consent (6(1)(a))', 'Active user + 30 days', 'None'),
('public', 'user_profiles', 'age_range', 'DIRECT', 'Article 9(1)', 'Age-Related Health Data', true, true, 'Personalized class difficulty', 'Explicit consent (9(2)(a))', 'Active user + 30 days', 'None'),
('public', 'user_profiles', 'gender_identity', 'DIRECT', 'Article 9(1)', 'Gender Identity (Personal Beliefs)', true, true, 'Personalized instruction language', 'Explicit consent (9(2)(a))', 'Active user + 30 days', 'None'),
('public', 'user_profiles', 'country', 'DIRECT', 'Article 4(1)', 'Location Data', false, false, 'Timezone and regional preferences', 'Consent (6(1)(a))', 'Active user + 30 days', 'None'),

-- users (tokenized PII)
('public', 'users', 'email_token', 'DIRECT', 'Article 4(1)', 'Email Address (Tokenized)', false, false, 'Account lookup via token', 'Consent (6(1)(a))', 'Active user + 30 days', 'Tokenized'),
('public', 'users', 'full_name_token', 'DIRECT', 'Article 4(1)', 'Full Name (Tokenized)', false, false, 'User identification via token', 'Consent (6(1)(a))', 'Active user + 30 days', 'Tokenized'),

-- auth.identities (OAuth PII)
('auth', 'identities', 'email', 'DIRECT', 'Article 4(1)', 'OAuth Provider Email', false, false, 'Third-party login', 'Consent (6(1)(a))', 'Until OAuth disconnect', 'None'),
('auth', 'identities', 'identity_data', 'DIRECT', 'Article 4(1)', 'OAuth Provider Data (JSONB)', false, false, 'OAuth profile data (name, picture)', 'Consent (6(1)(a))', 'Until OAuth disconnect', 'None'),

-- INDIRECT PII (user_id in all tables)
('public', 'user_profiles', 'id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Link records to user', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'users', 'id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Link records to user', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'ropa_audit_log', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Track processing activities', 'Legal obligation (6(1)(c))', 'Active user + 30 days', 'None'),
('public', 'ai_decision_log', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'EU AI Act transparency', 'Legal obligation (6(1)(c))', 'Active user + 30 days', 'None'),
('public', 'class_history', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Activity tracking', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'class_plans', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Associate classes with user', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'user_preferences', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Link preferences to user', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'movement_usage', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Track movement usage', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'medical_exclusions_log', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Link medical exclusions to user', 'Explicit consent (9(2)(a))', 'Active user + 30 days', 'None'),

-- BEHAVIORAL PII
('public', 'user_preferences', 'preferred_movements', 'BEHAVIORAL', 'Article 4(1)', 'Movement Preferences (Health Indicator)', false, false, 'Personalize class generation', 'Consent (6(1)(a))', 'Active user + 30 days', 'None'),
('public', 'user_preferences', 'favorite_movements', 'BEHAVIORAL', 'Article 4(1)', 'Favorite Movements (Health Indicator)', false, false, 'Personalize class generation', 'Consent (6(1)(a))', 'Active user + 30 days', 'None'),
('public', 'movement_usage', 'movement_id', 'BEHAVIORAL', 'Article 4(1)', 'Movement Usage Pattern', false, false, 'Track physical capabilities', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'movement_usage', 'usage_count', 'BEHAVIORAL', 'Article 4(1)', 'Usage Frequency (Health Indicator)', false, false, 'Track fitness progression', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),
('public', 'movement_usage', 'last_used_date', 'BEHAVIORAL', 'Article 4(1)', 'Activity Pattern', false, false, 'Track engagement', 'Necessary for service (6(1)(b))', 'Active user + 30 days', 'None'),

-- ARTICLE 9 HEALTH DATA (CRITICAL)
('public', 'medical_exclusions_log', 'exclusion_type', 'HEALTH', 'Article 9(1)', 'Medical Condition Type', true, true, 'Safety - prevent injury', 'Explicit consent (9(2)(a))', 'Active user + 30 days', 'None'),
('public', 'medical_exclusions_log', 'exclusion_reason', 'HEALTH', 'Article 9(1)', 'Medical Reasoning', true, true, 'Safety - explain exclusion', 'Explicit consent (9(2)(a))', 'Active user + 30 days', 'None'),
('public', 'medical_exclusions_log', 'student_profile_id', 'INDIRECT', 'Article 4(1)', 'Student Pseudonym', false, false, 'Link to student profile', 'Explicit consent (9(2)(a))', 'Active user + 30 days', 'None'),

-- AUTH SCHEMA (Supabase-managed)
('auth', 'users', 'email', 'DIRECT', 'Article 4(1)', 'Email Address', false, false, 'Supabase Auth login', 'Consent (6(1)(a))', 'Until account deletion', 'None'),
('auth', 'users', 'phone', 'DIRECT', 'Article 4(1)', 'Phone Number', false, false, 'Supabase Auth (if used)', 'Consent (6(1)(a))', 'Until account deletion', 'None'),
('auth', 'users', 'raw_user_meta_data', 'DIRECT', 'Article 4(1)', 'User Metadata (JSONB)', false, false, 'Supabase Auth profile data', 'Consent (6(1)(a))', 'Until account deletion', 'None'),
('auth', 'sessions', 'ip', 'DIRECT', 'Article 4(1)', 'IP Address', false, false, 'Supabase Auth session tracking', 'Necessary for service (6(1)(b))', 'Session duration + 30 days', 'None'),
('auth', 'sessions', 'user_agent', 'INDIRECT', 'Article 4(1)', 'Device/Browser Fingerprint', false, false, 'Supabase Auth device tracking', 'Necessary for service (6(1)(b))', 'Session duration + 30 days', 'None'),
('auth', 'sessions', 'user_id', 'INDIRECT', 'Article 4(1)', 'User Pseudonym', false, false, 'Link session to user', 'Necessary for service (6(1)(b))', 'Session duration + 30 days', 'None');
```

---

## Integration with DPIA Reports

### Update Settings.tsx DPIA Generation

Modify `frontend/src/pages/Settings.tsx` to query `pii_field_registry` table:

```typescript
// BEFORE (hardcoded list)
const piiFields = [
  { field: 'Email', purpose: 'Account login', legal_basis: 'Consent' },
  { field: 'Full Name', purpose: 'User identification', legal_basis: 'Consent' },
  // ... manual list
];

// AFTER (dynamic from database)
const fetchPIIFields = async () => {
  const { data, error } = await supabase
    .from('pii_field_registry')
    .select('*')
    .order('is_sensitive', { ascending: false })  // Health data first
    .order('pii_category', { ascending: true });

  if (error) throw error;
  return data;
};

// Generate DPIA report sections dynamically
const generateDPIA = (piiFields: PIIFieldRegistry[]) => {
  const directPII = piiFields.filter(f => f.pii_category === 'DIRECT');
  const healthData = piiFields.filter(f => f.pii_category === 'HEALTH');
  const behavioralData = piiFields.filter(f => f.pii_category === 'BEHAVIORAL');

  return {
    dataCategories: {
      direct: directPII.map(f => f.data_type_label),
      health: healthData.map(f => f.data_type_label),  // Article 9
      behavioral: behavioralData.map(f => f.data_type_label)
    },
    legalBases: {
      consent: piiFields.filter(f => f.legal_basis.includes('6(1)(a)')).length,
      explicitConsent: piiFields.filter(f => f.legal_basis.includes('9(2)(a)')).length,
      contract: piiFields.filter(f => f.legal_basis.includes('6(1)(b)')).length,
      legalObligation: piiFields.filter(f => f.legal_basis.includes('6(1)(c)')).length
    },
    sensitiveDataWarning: healthData.length > 0,  // Show Article 9 warning
    retention: [...new Set(piiFields.map(f => f.retention_period))]
  };
};
```

---

## Integration with ROPA Transaction Logging

### Update Backend PII Logger Middleware

Modify `backend/utils/pii_logger.py` to use registry:

```python
# BEFORE (manual field checks)
def is_pii_field(table: str, field: str) -> bool:
    """Check if field contains PII (hardcoded)"""
    pii_fields = {
        'user_profiles': ['email', 'full_name', 'age_range', 'gender_identity', 'country'],
        'users': ['email_token', 'full_name_token'],
        # ... manual mapping
    }
    return field in pii_fields.get(table, [])

# AFTER (database-driven)
async def get_pii_classification(table_schema: str, table_name: str, column_name: str) -> dict:
    """Get PII classification from registry"""
    result = await db.execute(
        """
        SELECT pii_category, gdpr_article, is_sensitive, requires_explicit_consent, purpose, legal_basis
        FROM pii_field_registry
        WHERE table_schema = :schema AND table_name = :table AND column_name = :column
        """,
        {"schema": table_schema, "table": table_name, "column": column_name}
    )
    return result.fetchone() if result else None

async def log_pii_transaction(user_id: str, operation: str, data: dict):
    """Log PII transaction with automatic field detection"""
    pii_fields_affected = []

    for table, fields in data.items():
        for field, value in fields.items():
            classification = await get_pii_classification('public', table, field)

            if classification and classification['pii_category'] != 'NONE':
                pii_fields_affected.append({
                    'table': table,
                    'field': field,
                    'pii_category': classification['pii_category'],
                    'is_sensitive': classification['is_sensitive'],
                    'legal_basis': classification['legal_basis']
                })

    # Log to ROPA
    await db.insert('ropa_audit_log').values(
        user_id=user_id,
        processing_activity=operation,
        data_categories=[f['pii_category'] for f in pii_fields_affected],
        legal_basis=pii_fields_affected[0]['legal_basis'] if pii_fields_affected else None,
        # ... other ROPA fields
    )
```

---

## Benefits of This Approach

1. **Single Source of Truth:** All PII classifications in one table
2. **Automatic DPIA Generation:** Reports pull from registry, always up-to-date
3. **Automatic ROPA Logging:** Middleware detects PII without manual coding
4. **Easy Updates:** Add/modify PII fields in database, no code changes needed
5. **Audit Trail:** Tracks changes to PII classifications (created_at, updated_at)
6. **GDPR Compliant:** Explicitly tags Article 9 health data
7. **Performance:** Indexed lookups are fast
8. **Maintainability:** Non-developers can update PII classifications

---

## Alternative: PostgreSQL Column Comments

Less powerful but simpler:

```sql
-- Tag PII using column comments
COMMENT ON COLUMN user_profiles.email IS 'PII:DIRECT|GDPR:4(1)|PURPOSE:Login|BASIS:Consent';
COMMENT ON COLUMN medical_exclusions_log.exclusion_type IS 'PII:HEALTH|GDPR:9(1)|PURPOSE:Safety|BASIS:Explicit';

-- Query comments
SELECT
    table_name,
    column_name,
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as pii_tag
FROM information_schema.columns
WHERE col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) IS NOT NULL;
```

**Pros:** No new table needed, uses native PostgreSQL feature
**Cons:** Less structured, harder to query, no foreign key validation

---

## Recommendation

**Use Option 1 (PII Field Registry Table)** for these reasons:

1. ✅ Structured data (easy to query, join, export)
2. ✅ Can add new metadata fields without schema changes
3. ✅ Supports complex queries (e.g., "all Article 9 fields requiring explicit consent")
4. ✅ Can be extended with data lineage, processing purposes, etc.
5. ✅ Enables automatic DPIA/ROPA generation
6. ✅ Non-developers can manage via admin UI

---

## Next Steps

1. Create `pii_field_registry` table in Supabase
2. Populate with seed data from PII inventory (14 tables)
3. Update Settings.tsx to query registry for DPIA generation
4. Update backend PII logger to use registry
5. Create admin UI for managing PII classifications
6. Add to CLAUDE.md as authoritative PII source

---

## Questions?

**Q: What about new tables/fields added in future?**
A: Add row to `pii_field_registry` immediately when creating new tables. Consider database trigger to alert if new column created without registry entry.

**Q: How do we ensure registry stays in sync with actual schema?**
A: Create migration script that validates registry against `information_schema.columns`. Run as CI/CD check.

**Q: Can we use this for data lineage tracking?**
A: Yes! Add `source_table`, `destination_table`, `transformation_function` columns to track where PII flows.

**Q: What about third-party processors (OpenAI, Supabase)?**
A: Add `third_party_processors` JSONB column to track which external services process each PII field.
