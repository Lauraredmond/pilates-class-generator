# Database Migrations

## Session 8: Add Preference Fields

**File:** `add_preference_fields.sql`

**Purpose:** Adds notification and privacy preference fields to the `user_preferences` table.

### Fields Added:
- `email_notifications` (BOOLEAN, default: true)
- `class_reminders` (BOOLEAN, default: true)
- `weekly_summary` (BOOLEAN, default: false)
- `analytics_enabled` (BOOLEAN, default: true)
- `data_sharing_enabled` (BOOLEAN, default: false)

### How to Apply This Migration:

#### Option 1: Supabase Dashboard (Recommended for Production)
1. Log in to https://supabase.com/dashboard
2. Select your Bassline project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `add_preference_fields.sql`
6. Click **Run** to execute the migration
7. Verify the columns were added: Go to **Table Editor** → `user_preferences` table

#### Option 2: Supabase CLI (Local Development)
```bash
# Navigate to database directory
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2/database

# Apply migration using psql
psql "postgresql://user:password@host:port/database" -f migrations/add_preference_fields.sql
```

#### Option 3: Using psql directly
```bash
# Connect to your Supabase database
psql "your-supabase-connection-string"

# Run the migration
\i /Users/lauraredmond/Documents/Bassline/Projects/MVP2/database/migrations/add_preference_fields.sql
```

### Verification:
After running the migration, verify it succeeded:
```sql
-- Check that all columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
AND column_name IN ('email_notifications', 'class_reminders', 'weekly_summary', 'analytics_enabled', 'data_sharing_enabled');

-- Check that existing rows have default values
SELECT user_id, email_notifications, class_reminders, weekly_summary, analytics_enabled, data_sharing_enabled
FROM user_preferences
LIMIT 5;
```

### Rollback (if needed):
```sql
-- Remove the added columns
ALTER TABLE user_preferences
DROP COLUMN IF EXISTS email_notifications,
DROP COLUMN IF EXISTS class_reminders,
DROP COLUMN IF EXISTS weekly_summary,
DROP COLUMN IF EXISTS analytics_enabled,
DROP COLUMN IF EXISTS data_sharing_enabled;
```

---

## Notes:
- This migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing user_preferences rows will be updated with default values
- New users created after backend deployment will have these fields populated automatically
- No data loss occurs when applying this migration
