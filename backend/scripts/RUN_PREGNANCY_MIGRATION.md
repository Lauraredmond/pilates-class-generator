# How to Run Pregnancy Exclusion Migration

## Quick Start

### Option 1: Automated Script (Prints SQL for you)

```bash
cd backend
python3 scripts/run_pregnancy_exclusion_migration.py
```

The script will print the complete SQL - copy it and proceed to Step 2.

### Option 2: Direct SQL File

The migration SQL is also available at:
`/database/migrations/005_add_pregnancy_exclusions.sql`

---

## Step-by-Step Instructions

### 1. Get the SQL

Run the script to print the SQL:
```bash
python3 scripts/run_pregnancy_exclusion_migration.py
```

OR open the file directly:
```bash
cat ../database/migrations/005_add_pregnancy_exclusions.sql
```

### 2. Go to Supabase SQL Editor

Open: https://supabase.com/dashboard/project/lixvcebtwusmaipodcpc/sql/new

(Replace `lixvcebtwusmaipodcpc` with your actual project ID if different)

### 3. Paste and Run

1. Copy the entire SQL output from the script
2. Paste into the Supabase SQL Editor
3. Click the **"Run"** button (green play icon)
4. Wait for execution to complete
5. Check for any errors in the output panel

### 4. Verify Success

Look for these confirmations in the output:
- ✅ `ALTER TABLE` commands succeeded
- ✅ `CREATE TABLE` succeeded
- ✅ `CREATE FUNCTION` succeeded
- ✅ `CREATE TRIGGER` succeeded
- ✅ No error messages

### 5. Test Immediately

After migration succeeds:

1. Refresh your app: http://localhost:5174/
2. You should see the Medical Disclaimer screen
3. Test the pregnancy question
4. Verify access is denied if "Yes" selected

---

## What the Migration Adds

### New Database Objects:

**Tables:**
- `medical_exclusions_log` - Audit trail of exclusions

**Columns on `student_profiles`:**
- `is_pregnant` - Boolean flag
- `medical_contraindications` - Text array
- `last_medical_status_check` - Timestamp

**Columns on `users`:**
- `medical_disclaimer_accepted` - Boolean
- `medical_disclaimer_accepted_at` - Timestamp
- `medical_disclaimer_version` - VARCHAR(10)

**Functions:**
- `check_pregnancy_exclusion()` - Validates pregnancy status
- `log_pregnancy_detection()` - Trigger function

**Triggers:**
- `trigger_log_pregnancy_detection` - Auto-logs when pregnancy detected

---

## Troubleshooting

### Error: "column already exists"

If you see errors like:
```
ERROR: column "is_pregnant" of relation "student_profiles" already exists
```

This means the migration was already run (or partially run). This is OK! The important columns are there.

### Error: "table does not exist"

If `student_profiles` or `users` table doesn't exist:
1. Check you're connected to the correct project
2. Verify earlier migrations were run
3. Run migrations in order: 001, 002, 003, 004, then 005

### Connection Timeout

If the SQL Editor times out:
- Break the SQL into smaller chunks
- Run each section separately:
  1. ALTER TABLE statements
  2. CREATE TABLE statements
  3. CREATE FUNCTION statements
  4. CREATE TRIGGER statements
  5. COMMENT statements

---

## Verification Commands

After running the migration, verify with these SQL queries:

```sql
-- Check student_profiles columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_profiles'
AND column_name IN ('is_pregnant', 'medical_contraindications');

-- Check users columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE 'medical_disclaimer%';

-- Check medical_exclusions_log table
SELECT COUNT(*) FROM medical_exclusions_log;

-- Test pregnancy check function
SELECT * FROM check_pregnancy_exclusion(NULL, NULL);
```

Expected results:
- First query: 2 rows (is_pregnant: boolean, medical_contraindications: ARRAY)
- Second query: 3 rows (medical_disclaimer_accepted, _at, _version)
- Third query: 0 (no exclusions logged yet)
- Fourth query: 1 row with is_excluded=FALSE, severity='SAFE'

---

## Next Steps After Migration

1. ✅ Migration run successfully
2. ✅ Verified columns exist
3. ⏭️ Test disclaimer UI in browser
4. ⏭️ Test pregnancy flow (Yes → Access denied)
5. ⏭️ Test acceptance flow (No → Disclaimer → Accept → App loads)
6. ⏭️ Remove pregnancy research from `research_agent.py`

---

## Need Help?

If you encounter issues:
1. Check Supabase Dashboard logs
2. Verify you're using the correct project
3. Ensure previous migrations (001-004) completed successfully
4. Contact support with error messages
