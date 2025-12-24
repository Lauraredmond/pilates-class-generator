# Fix RLS Security Warnings

## Issue
Supabase Security Advisor flagged 2 tables without Row Level Security:
- `public.music_playlists_backup`
- `public.music_playlists_tracks_backup`

## Solution
Migration `023_enable_rls_on_backup_tables.sql` enables RLS and creates service-role-only policies.

## How to Apply

### Option 1: Via Supabase SQL Editor (Recommended)
1. Go to your Supabase project: https://supabase.com/dashboard/project/gntqrebxmpdjyuxztwww
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `023_enable_rls_on_backup_tables.sql`
5. Click **Run** (or press Cmd+Enter)
6. You should see: `NOTICE: RLS successfully enabled on both backup tables`

### Option 2: Via psql Command Line
```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.gntqrebxmpdjyuxztwww.supabase.co:5432/postgres" \
  -f database/migrations/023_enable_rls_on_backup_tables.sql
```

## Verification

After running the migration, verify RLS is enabled:

```sql
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%backup%';
```

Expected output:
```
         tablename               | rls_enabled
---------------------------------+-------------
 music_playlists_backup          | t
 music_playlists_tracks_backup   | t
```

## Security Impact

**Before:** Anyone with database access could read/write backup tables
**After:** Only service role (your backend API) can access backup tables

This is the correct security posture for backup tables - they should be internal-only.
