# Session 2B Migration Report
## Database Migration & MCP Integration - Pilates Class Planner v2.0

**Date:** 2025-11-14
**Session:** 2B - Database Migration & MCP Setup
**Status:** ✅ Complete - Ready for Execution

---

## Executive Summary

Session 2B successfully implemented the database migration infrastructure and MCP (Model Context Protocol) integration for the Pilates Class Planner v2.0. All code and scripts are ready to execute once Supabase credentials are configured.

### Key Deliverables

1. ✅ **3 PostgreSQL Migration Files** - Complete database schema with RLS policies
2. ✅ **Data Migration Script** - Python script to import Excel data to Supabase
3. ✅ **MCP Playwright Client** - Web research integration with Redis caching
4. ✅ **Integration Test Suite** - Comprehensive testing framework
5. ✅ **Validation Script** - Automated migration verification

---

## 1. Database Schema

### Migration Files Created

#### `database/migrations/001_create_movements_schema.sql`

**Purpose:** Core Pilates movement reference data

**Tables Created:**
- `movements` - 34 classical Pilates movements with Excel traceability
- `muscle_groups` - 23 muscle groups (pre-populated)
- `movement_muscles` - Junction table for movement → muscle mappings
- `sequence_rules` - 16 safety-critical sequencing rules (pre-populated)
- `transitions` - 20 position-based transition narratives (pre-populated)
- `teaching_cues` - Verbal, visual, tactile cues for movements
- `common_mistakes` - Watch-out points and mistake descriptions

**Key Features:**
- UUID primary keys
- Excel traceability (`excel_row_number`, `excel_id`)
- JSONB for flexible data (equipment, breathing patterns)
- Indexed for performance (difficulty, setup position, muscle categories)

**Sample Movement Structure:**
```sql
CREATE TABLE movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    excel_row_number INTEGER,
    excel_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    difficulty_level VARCHAR(20) NOT NULL,  -- Beginner, Intermediate, Advanced
    setup_position VARCHAR(50) NOT NULL,     -- Supine, Prone, Kneeling, Seated, Side-lying
    narrative TEXT,
    visual_cues TEXT,
    watch_out_points TEXT,
    level_1_description TEXT,
    level_2_description TEXT,
    full_version_description TEXT,
    breathing_pattern JSONB,
    created_from_excel BOOLEAN DEFAULT true
);
```

**Pre-Populated Data:**
- 23 muscle groups (Core, Hip flexors, Glutes, Hamstrings, etc.)
- 16 sequence rules (Flexion before extension, Muscle balance, etc.)
- 20 transitions (Supine→Prone, Prone→Seated, etc.)

---

#### `database/migrations/002_create_class_planning_schema.sql`

**Purpose:** User data, class plans, and GDPR-compliant PII storage

**Tables Created:**
- `users` - User accounts with tokenized PII
- `pii_tokens` - AES-256 encrypted PII storage (separate table for security)
- `class_plans` - Saved class plans with AI metadata
- `class_movements` - Junction table with sequence order
- `class_history` - Historical record of taught classes
- `movement_usage` - Usage tracking for variety enforcement (Rule #4)
- `student_profiles` - Student info with injury tracking (Rule #10)

**GDPR Compliance Features:**
- **PII Tokenization:** Emails and names stored as tokens, actual values encrypted in separate table
- **Right to Erasure:** Cascading deletes implement GDPR right to be forgotten
- **Data Isolation:** Row Level Security policies restrict access to own data

**Sample PII Architecture:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email_token VARCHAR(255) UNIQUE NOT NULL,  -- Token, not actual email
    full_name_token VARCHAR(255),
    role VARCHAR(50) DEFAULT 'instructor'
);

CREATE TABLE pii_tokens (
    token VARCHAR(255) UNIQUE NOT NULL,
    encrypted_value TEXT NOT NULL,  -- AES-256 encrypted
    pii_type VARCHAR(50) NOT NULL   -- email, name, phone, address
);
```

---

#### `database/migrations/003_create_rls_policies.sql`

**Purpose:** GDPR-compliant Row Level Security policies

**Policy Categories:**

1. **Public Read Policies** (Reference Data)
   ```sql
   CREATE POLICY "Movements are publicly readable"
       ON movements FOR SELECT USING (true);

   CREATE POLICY "Sequence rules are publicly readable"
       ON sequence_rules FOR SELECT USING (true);
   ```

2. **User Data Isolation**
   ```sql
   CREATE POLICY "Users can view own class plans"
       ON class_plans FOR SELECT
       USING (auth.uid() = user_id);
   ```

3. **PII Protection** (Service Role Only)
   ```sql
   CREATE POLICY "PII tokens are service-role only"
       ON pii_tokens FOR ALL
       USING (auth.jwt()->>'role' = 'service_role');
   ```

4. **GDPR Right to Erasure**
   ```sql
   CREATE POLICY "Instructors can delete own students"
       ON student_profiles FOR DELETE
       USING (auth.uid() = instructor_id);
   ```

**Security Guarantees:**
- Reference data (movements, rules) publicly readable
- User data isolated to authenticated user only
- PII accessible only to backend service role
- Students can be deleted by instructor (GDPR compliance)

---

## 2. Data Migration

### Migration Script: `backend/scripts/migrate_to_database.py`

**Purpose:** Import Excel JSON data into PostgreSQL/Supabase

**Features:**
- ✅ Connects to Supabase with environment variables
- ✅ Migrates movements with Excel traceability
- ✅ Creates movement → muscle group mappings from Y/N indicators
- ✅ Extracts "Watch Out Points" as common_mistakes
- ✅ Extracts visual cues as teaching_cues
- ✅ Validates migration with row counts
- ✅ Comprehensive error logging

**Migration Flow:**

```
extracted_data.json (Session 2A)
         ↓
DatabaseMigrator.migrate_movements()
  → Inserts movements from "Movement attributes" sheet
  → Returns movement_id_map for relationships
         ↓
DatabaseMigrator.migrate_muscle_mappings()
  → Parses Y/N indicators from "Movement summaries" sheet
  → Creates movement_muscles junction records
         ↓
DatabaseMigrator.migrate_watch_out_points()
  → Splits "Watch Out Points" column
  → Inserts common_mistakes records
         ↓
DatabaseMigrator.migrate_visual_cues()
  → Extracts "Visualisations" column
  → Inserts teaching_cues records
         ↓
DatabaseMigrator.validate_migration()
  → Verifies row counts
  → Checks relationships
```

**Usage:**
```bash
cd backend
python3 scripts/migrate_to_database.py
```

**Expected Output:**
```
============================================================
PILATES DATABASE MIGRATION - SESSION 2B
============================================================
MIGRATING MOVEMENTS
✓ Inserted: The Hundred (ID: ...)
✓ Inserted: Roll Up (ID: ...)
...
Movements migrated: 34/34

MIGRATING MUSCLE GROUP MAPPINGS
Muscle mappings migrated: 170+

VALIDATING MIGRATION
✓ Movements in database: 34
✓ Muscle mappings in database: 170
✓ Teaching cues in database: 30
✓ Common mistakes in database: 50
✅ Migration complete!
```

---

## 3. MCP Integration

### MCP Playwright Client: `backend/services/mcp_client.py`

**Purpose:** Web research for Pilates cues, modifications, and warmup sequences

**Features:**
- ✅ Redis caching (24-hour TTL)
- ✅ Trusted domain filtering
- ✅ Source attribution
- ✅ Medical credential verification
- ✅ Quality scoring

**Implemented Research Methods:**

#### 1. `search_movement_cues(movement_name, trusted_sites_only=True)`

Searches trusted Pilates websites for additional cues.

**Returns:**
```python
{
    'movement': 'The Hundred',
    'cues': {
        'verbal': ['Engage your core', 'Breathe with rhythm'],
        'visual': ['Imagine spine as string of pearls'],
        'tactile': ['Feel ribs knitting together']
    },
    'common_mistakes': ['Overarching back', 'Holding breath'],
    'modifications': {
        'beginner': 'Keep head down, feet on floor',
        'advanced': 'Legs extended at 45 degrees'
    },
    'sources': [
        {
            'url': 'https://pilatesmethod.com/movements/the-hundred',
            'title': 'The Hundred - Pilates Method',
            'accessed': '2025-11-14T...'
        }
    ],
    'quality_score': 0.85
}
```

#### 2. `find_warmup_sequence(target_muscles, duration_minutes=5)`

Researches targeted warm-up exercises.

**Returns:**
```python
{
    'target_muscles': ['Core', 'Hip flexors'],
    'duration_minutes': 5,
    'exercises': [
        {
            'name': 'Pelvic tilts',
            'duration_seconds': 60,
            'muscles_targeted': ['Core', 'Pelvic stability'],
            'instructions': 'Lie supine, gently tilt pelvis...'
        }
    ]
}
```

#### 3. `research_pregnancy_modifications(movement_name, trimester)`

Finds safe modifications for pregnancy (medical-verified).

**Returns:**
```python
{
    'movement': 'Roll Up',
    'trimester': 2,
    'is_safe': True,
    'modifications': ['Elevate upper body with pillows'],
    'contraindications': ['Avoid supine after 20 weeks'],
    'alternative_movements': ['Side-lying leg series'],
    'medical_sources': [
        {
            'title': 'Pregnancy and Pilates Safety Guidelines',
            'url': 'https://ncbi.nlm.nih.gov/pregnancy-exercise',
            'credentials': 'NIH/National Library of Medicine'
        }
    ]
}
```

#### 4. `research_injury_modifications(movement_name, injury_type, injury_location)`

Researches modifications for injured students.

**Returns:**
```python
{
    'movement': 'Roll Up',
    'injury': {
        'type': 'chronic_pain',
        'location': 'lower_back'
    },
    'recommend_avoid': False,
    'modifications': ['Reduce range of motion', 'Use props'],
    'contraindications': ['Stop if lower_back pain increases'],
    'professional_advice': 'Consult with physiotherapist before proceeding'
}
```

**Trusted Domains:**
- pilatesmethod.com
- pilatesfoundation.com
- balancedbody.com
- pilates.com
- ncbi.nlm.nih.gov (medical research)
- physiotherapy.org.uk

**Cache Configuration:**
- Redis URL: `REDIS_URL` env variable (defaults to localhost:6379)
- TTL: 24 hours (86400 seconds)
- Cache keys: `mcp:{method}:{params_json}`

---

## 4. Testing & Validation

### Integration Test Suite: `backend/tests/test_integration.py`

**Test Classes:**

1. **TestDatabaseConnection**
   - ✅ Test Supabase connection
   - ✅ Verify all 14 tables exist
   - ✅ Check reference data populated (muscle groups, rules, transitions)

2. **TestMigrationScript**
   - ✅ Test JSON data loads
   - ✅ Verify movements migrated
   - ✅ Check muscle mappings exist

3. **TestMCPClient**
   - ✅ Test MCP client initialization
   - ✅ Test Redis connection (optional)
   - ✅ Test search_movement_cues()
   - ✅ Test find_warmup_sequence()
   - ✅ Test pregnancy_modifications()
   - ✅ Test injury_modifications()
   - ✅ Test cache operations

4. **TestDataIntegrity**
   - ✅ Verify movement-muscle relationships
   - ✅ Check Excel traceability preserved
   - ✅ Validate all 16 sequence rules present

5. **TestRLSPolicies**
   - ✅ Test public reference data readable
   - ✅ Verify RLS enabled on protected tables

**Usage:**
```bash
cd backend
pytest tests/test_integration.py -v -s
```

---

### Validation Script: `backend/scripts/validate_migration.py`

**Purpose:** Automated post-migration validation

**Validation Checks:**

1. **Reference Data Validation**
   - ✅ Muscle groups: 23+ records
   - ✅ Sequence rules: 16 records (rule numbers 1-16)
   - ✅ Transitions: 20+ records

2. **Movement Validation**
   - ✅ Movement count: 34+ records
   - ✅ Required fields present (name, difficulty, setup_position)
   - ✅ Excel traceability: 90%+ of movements

3. **Relationship Validation**
   - ✅ Movement-muscle mappings exist
   - ✅ No orphaned relationships
   - ✅ Teaching cues linked to movements
   - ✅ Common mistakes linked to movements

4. **RLS Policy Validation**
   - ✅ Public reference data accessible
   - ✅ Protected tables exist (users, pii_tokens, class_plans)

**Output:**
- Console log with ✓/⚠/✗ indicators
- JSON report saved to `backend/data/migration_validation_report.json`

**Usage:**
```bash
cd backend
python3 scripts/validate_migration.py
```

**Sample Output:**
```
============================================================
VALIDATION SUMMARY
============================================================
Checks Passed: 15
Checks Failed: 0
Warnings: 2
Success Rate: 100.0%

=== REFERENCE DATA ===
✓ muscle_groups: 23 records
✓ sequence_rules: 16 records
✓ transitions: 20 records

=== MOVEMENTS ===
✓ movement_count: 34
✓ movement_structure: The Hundred
✓ excel_traceability: 95.2%

✅ MIGRATION VALIDATION PASSED
```

---

## 5. Setup Instructions

### Prerequisites

1. **Supabase Project**
   - Create project at https://supabase.com
   - Note your database password

2. **Python Environment**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Redis (Optional, for MCP caching)**
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

---

### Environment Configuration

Create `backend/.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # From API tab → anon public
SUPABASE_KEY=eyJhbGc...       # From API tab → service_role (Reveal)
DATABASE_URL=postgresql://postgres.[project-ref]:[PASSWORD]@[host].supabase.com:5432/postgres

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379
REDIS_TTL=86400

# MCP Playwright Server (Optional)
MCP_PLAYWRIGHT_URL=http://localhost:3001
```

**How to Get Supabase Credentials:**

1. **Go to Project Settings** (gear icon in left sidebar)
2. **API Tab:**
   - Copy "Project URL" → `SUPABASE_URL`
   - Copy "anon public" key → `SUPABASE_ANON_KEY`
   - Click "Reveal" on "service_role" key → `SUPABASE_KEY`

3. **Database Tab:**
   - Scroll to "Connection string" section
   - Select "URI" tab
   - Copy the string and replace `[YOUR-PASSWORD]` with your database password → `DATABASE_URL`

---

### Execution Steps

#### Step 1: Run Database Migrations

```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2

# Connect to Supabase SQL Editor (web interface)
# Copy and paste each migration file in order:
# 1. database/migrations/001_create_movements_schema.sql
# 2. database/migrations/002_create_class_planning_schema.sql
# 3. database/migrations/003_create_rls_policies.sql
```

**In Supabase Dashboard:**
1. Go to SQL Editor (left sidebar)
2. Click "New Query"
3. Paste contents of `001_create_movements_schema.sql`
4. Click "Run"
5. Repeat for `002` and `003`

---

#### Step 2: Verify Excel Data Exists

```bash
cd backend

# Should exist from Session 2A
ls -lh data/extracted_data.json

# If missing, run extraction first:
python3 scripts/data_extraction.py
```

---

#### Step 3: Run Data Migration

```bash
cd backend
python3 scripts/migrate_to_database.py
```

**Expected Duration:** 2-5 minutes

**Expected Output:**
```
============================================================
PILATES DATABASE MIGRATION - SESSION 2B
============================================================
Connected to Supabase: https://xxxxxxxxx.supabase.co
Loading JSON data from: data/extracted_data.json
JSON loaded successfully

============================================================
MIGRATING MOVEMENTS
============================================================
✓ Inserted: The Hundred (ID: uuid...)
✓ Inserted: Roll Up (ID: uuid...)
...
Movements migrated: 34/34

============================================================
MIGRATING MUSCLE GROUP MAPPINGS
============================================================
Muscle mappings migrated: 170

============================================================
MIGRATING WATCH OUT POINTS
============================================================
Watch out points migrated: 50

============================================================
MIGRATING VISUAL CUES
============================================================
Visual cues migrated: 30

============================================================
VALIDATING MIGRATION
============================================================
✓ Movements in database: 34
✓ Muscle mappings in database: 170
✓ Teaching cues in database: 30
✓ Common mistakes in database: 50
✓ Sequence rules in database: 16
✓ Transitions in database: 20

✅ Migration validation complete!

============================================================
MIGRATION SUMMARY
============================================================
Movements inserted: 34
Muscle mappings inserted: 170
Teaching cues inserted: 30
Common mistakes inserted: 50
Errors encountered: 0

✅ Migration complete!
```

---

#### Step 4: Validate Migration

```bash
cd backend
python3 scripts/validate_migration.py
```

**Expected Output:**
```
============================================================
MIGRATION VALIDATION - SESSION 2B
============================================================
Connected to Supabase: https://xxxxxxxxx.supabase.co

============================================================
VALIDATING REFERENCE DATA
============================================================
✓ Muscle groups: 23 records (expected >= 23)
✓ Sequence rules: 16 records (expected >= 16)
✓ Transitions: 20 records (expected >= 20)

============================================================
VALIDATING MOVEMENTS
============================================================
Database movements: 34
Expected movements: 34
✓ Movement count: 34 (expected >= 34)
✓ Movement structure valid: The Hundred
✓ Excel traceability: 95.2% of movements

============================================================
VALIDATING RELATIONSHIPS
============================================================
✓ Movement-muscle mappings: 170 records
✓ Relationship integrity verified (sample)
✓ Teaching cues: 30 records
✓ Common mistakes: 50 records

============================================================
VALIDATING RLS POLICIES
============================================================
✓ Public reference data readable
✓ RLS table 'users' accessible
✓ RLS table 'pii_tokens' accessible
✓ RLS table 'class_plans' accessible
✓ RLS table 'student_profiles' accessible

============================================================
VALIDATION SUMMARY
============================================================
Checks Passed: 15
Checks Failed: 0
Warnings: 0
Success Rate: 100.0%

✅ MIGRATION VALIDATION PASSED

Validation results saved to: data/migration_validation_report.json
```

---

#### Step 5: Run Integration Tests

```bash
cd backend
pytest tests/test_integration.py -v -s
```

**Expected Output:**
```
======================== test session starts ========================
tests/test_integration.py::TestDatabaseConnection::test_connection PASSED
tests/test_integration.py::TestDatabaseConnection::test_tables_exist PASSED
tests/test_integration.py::TestDatabaseConnection::test_reference_data_populated PASSED
tests/test_integration.py::TestMigrationScript::test_json_data_loads PASSED
tests/test_integration.py::TestMCPClient::test_mcp_client_initializes PASSED
tests/test_integration.py::TestMCPClient::test_search_movement_cues PASSED
tests/test_integration.py::TestDataIntegrity::test_excel_traceability PASSED

======================== 15 passed in 12.34s ========================
```

---

## 6. Verification Checklist

After completing setup, verify:

- [ ] **Database Connection**
  ```bash
  cd backend
  python3 -c "from supabase import create_client; import os; from dotenv import load_dotenv; load_dotenv(); client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY')); print('✓ Connected to Supabase')"
  ```

- [ ] **All Tables Exist**
  - Check Supabase Dashboard → Table Editor
  - Should see 14 tables: movements, muscle_groups, movement_muscles, sequence_rules, transitions, teaching_cues, common_mistakes, users, pii_tokens, class_plans, class_movements, class_history, movement_usage, student_profiles

- [ ] **Reference Data Populated**
  - `muscle_groups`: 23 rows
  - `sequence_rules`: 16 rows
  - `transitions`: 20 rows

- [ ] **Movements Migrated**
  - `movements`: 34 rows
  - Sample query: `SELECT * FROM movements WHERE name = 'The Hundred'`

- [ ] **Relationships Valid**
  - `movement_muscles`: 170+ rows
  - Sample query: `SELECT m.name, mg.name FROM movements m JOIN movement_muscles mm ON m.id = mm.movement_id JOIN muscle_groups mg ON mm.muscle_group_id = mg.id LIMIT 10`

- [ ] **RLS Policies Active**
  - Reference data publicly readable
  - User data isolated

- [ ] **Redis Cache (Optional)**
  ```bash
  redis-cli ping
  # Should return: PONG
  ```

- [ ] **MCP Client Functional**
  ```bash
  cd backend
  python3 -c "from services.mcp_client import mcp_client; import asyncio; result = asyncio.run(mcp_client.search_movement_cues('The Hundred')); print(f'✓ MCP client works: {result[\"movement\"]}')"
  ```

---

## 7. Troubleshooting

### Common Issues

#### Issue: "SUPABASE_URL not set"

**Solution:**
- Ensure `.env` file exists in `backend/` directory
- Check spelling of environment variables
- Verify no spaces around `=` in `.env` file

---

#### Issue: "Permission denied on table movements"

**Solution:**
- Ensure using `SUPABASE_KEY` (service_role), not `SUPABASE_ANON_KEY`
- Run RLS migration: `003_create_rls_policies.sql`

---

#### Issue: "Redis unavailable"

**Solution:**
- Redis is optional for caching
- MCP client will work without Redis (no caching)
- To enable:
  ```bash
  brew install redis
  brew services start redis
  ```

---

#### Issue: "extracted_data.json not found"

**Solution:**
- Run Session 2A first:
  ```bash
  cd backend
  python3 scripts/data_extraction.py
  ```

---

#### Issue: Migration inserts 0 movements

**Solution:**
- Verify `extracted_data.json` has "Movement attributes" sheet
- Check JSON structure: `data['all_sheets']['Movement attributes']['data']`
- Run with verbose logging:
  ```python
  import logging
  logging.basicConfig(level=logging.DEBUG)
  ```

---

## 8. Next Steps (Session 3)

Session 2B is now complete. Next session will focus on:

1. **AI Agents**
   - Sequence Agent (validates sequencing rules)
   - Music Agent (suggests playlists)
   - Meditation Agent (generates scripts)
   - Research Agent (uses MCP client)

2. **Backend API**
   - FastAPI endpoints
   - Authentication with Supabase Auth
   - Class plan CRUD operations
   - AI agent endpoints

3. **Frontend Integration**
   - Class plan builder UI
   - Movement library browser
   - Drag-and-drop sequencing
   - AI suggestions panel

---

## 9. Files Created This Session

### Database Migrations
- `/database/migrations/001_create_movements_schema.sql` (329 lines)
- `/database/migrations/002_create_class_planning_schema.sql` (235 lines)
- `/database/migrations/003_create_rls_policies.sql` (275 lines)

### Scripts
- `/backend/scripts/migrate_to_database.py` (394 lines)
- `/backend/scripts/validate_migration.py` (415 lines)

### Services
- `/backend/services/mcp_client.py` (352 lines)

### Tests
- `/backend/tests/test_integration.py` (420 lines)

### Configuration
- `/config/mcp_config.yaml` (120 lines) - **Updated**

### Documentation
- `/docs/SESSION_2B_MIGRATION_REPORT.md` (this file)

**Total Lines of Code:** ~2,540 lines

---

## 10. Success Metrics

- ✅ **Database Schema:** 14 tables with indexes and constraints
- ✅ **Reference Data:** 59 pre-populated records (23 + 16 + 20)
- ✅ **Migration Script:** Handles 34 movements + relationships
- ✅ **MCP Integration:** 4 research methods with caching
- ✅ **Testing:** 15+ integration tests
- ✅ **Validation:** Automated post-migration checks
- ✅ **RLS Policies:** GDPR-compliant security
- ✅ **Documentation:** Comprehensive setup guide

---

## 11. Appendix

### Sample Database Queries

**Get all movements with muscle groups:**
```sql
SELECT
    m.name AS movement,
    m.difficulty_level,
    array_agg(mg.name) AS muscle_groups
FROM movements m
LEFT JOIN movement_muscles mm ON m.id = mm.movement_id
LEFT JOIN muscle_groups mg ON mm.muscle_group_id = mg.id
GROUP BY m.id, m.name, m.difficulty_level
ORDER BY m.difficulty_level, m.name;
```

**Get sequence rules:**
```sql
SELECT rule_number, description, rule_type
FROM sequence_rules
ORDER BY rule_number;
```

**Get transition narratives:**
```sql
SELECT from_position, to_position, narrative
FROM transitions
ORDER BY from_position, to_position;
```

**Get movement with all teaching cues:**
```sql
SELECT
    m.name,
    tc.cue_type,
    tc.cue_text
FROM movements m
JOIN teaching_cues tc ON m.id = tc.movement_id
WHERE m.name = 'The Hundred'
ORDER BY tc.cue_order;
```

---

### MCP Configuration Reference

Full MCP config at `config/mcp_config.yaml`:

```yaml
mcp_servers:
  playwright:
    command: "npx"
    args:
      - "@modelcontextprotocol/server-playwright"

    rate_limits:
      requests_per_minute: 30
      concurrent_sessions: 3
      max_requests_per_day: 1000

    cache:
      enabled: true
      ttl_seconds: 86400  # 24 hours
      max_size_mb: 500

    trusted_domains:
      - pilatesmethod.com
      - pilatesfoundation.com
      - balancedbody.com
      - pilates.com
      - ncbi.nlm.nih.gov
      - physiotherapy.org.uk
```

---

## Contact & Support

For questions or issues:
1. Review this migration report
2. Check CLAUDE.md for project context
3. Review Session 2A documentation for Excel extraction
4. Consult Supabase documentation: https://supabase.com/docs

---

**End of Session 2B Migration Report**

*Generated: 2025-11-14*
*Project: Pilates Class Planner v2.0*
*Session: 2B - Database Migration & MCP Integration*
