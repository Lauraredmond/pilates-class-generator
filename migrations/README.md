# Database Migrations for Coach Functionality

## Overview
These migrations add coach functionality to Bassline Pilates, including user types (practitioner, coach, admin) and sport-specific exercise tables.

## Files
- `000_check_current_state.sql` - Diagnostic queries to check database state BEFORE migration
- `001_add_coach_functionality.sql` - Main migration to add coach features
- `001_rollback_coach_functionality.sql` - Rollback script if needed
- `remove_is_admin_field.sql` - Legacy file (incorporated into main migration)

## How to Run the Migration

### Step 1: Check Current State
Run diagnostic queries to understand your database state:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `000_check_current_state.sql`
4. Review the results to ensure:
   - `user_profiles` table exists
   - Note if `is_admin` column exists
   - Note if `user_type` column already exists
   - Check total user count

### Step 2: Run the Migration
1. In Supabase SQL Editor, copy and run the entire contents of `001_add_coach_functionality.sql`
2. This migration will:
   - Add `user_type` column to `user_profiles`
   - **Set ALL existing users to 'standard' (practitioner) type**
   - Migrate admin users (if `is_admin = true`) to 'admin' type
   - Remove the old `is_admin` column
   - Create `sport_exercises` and `coach_sport_sessions` tables
   - Set up Row Level Security policies

### Step 3: Verify the Migration
After running the migration, verify success by running these queries:

```sql
-- Check user type distribution
SELECT user_type, COUNT(*) as count
FROM user_profiles
GROUP BY user_type;

-- Verify new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sport_exercises', 'coach_sport_sessions');

-- Check that is_admin column is removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'is_admin';  -- Should return 0 rows
```

### Step 4: Test Registration
After migration, test that:
1. New users can register as 'Practitioner' (standard) or 'Coach'
2. Existing users can still log in (they'll be 'standard' type)
3. Admin users retain admin access

## Rollback (if needed)
If something goes wrong, you can rollback:

⚠️ **WARNING**: Rollback will DELETE all coach-specific data!

1. Run the entire contents of `001_rollback_coach_functionality.sql`
2. This will:
   - Drop the coach tables
   - Restore the `is_admin` column
   - Remove the `user_type` column

## Important Notes

### For Existing Users
- **ALL existing users will become 'standard' (practitioner) type**
- Admin users (where `is_admin = true`) will become 'admin' type
- Users will need to contact support if they want to be upgraded to 'coach' type

### For New Users
- Can register as either 'Practitioner' or 'Coach'
- Admin type can only be set manually in the database

### Security
- Only coaches can see their own sport sessions
- Only admins can modify the sport exercises catalog
- All authenticated users can read sport exercises

## Troubleshooting

### Error: "column user_type already exists"
The migration has already been partially run. Check current state and manually adjust.

### Error: "violates check constraint"
Make sure all user_type values are one of: 'standard', 'coach', 'admin'

### Error: "null value in column user_type"
Run this before adding NOT NULL constraint:
```sql
UPDATE user_profiles
SET user_type = 'standard'
WHERE user_type IS NULL;
```

## Support
For issues or questions, check the current database state using `000_check_current_state.sql` queries.