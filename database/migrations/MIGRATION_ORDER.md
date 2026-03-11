# Database Migrations

## Migration Files Location
All database migration scripts are now organized in this folder.

## Execution Order
Run these migrations in numerical order:

1. `001_add_coach_functionality.sql` - Adds user_type field and coach tables
2. `002_populate_gaa_exercises.sql` - Populates GAA/Hurling exercises (41 exercises)
3. `003_populate_soccer_exercises.sql` - Populates Soccer exercises (34 exercises)
4. `004_populate_rugby_exercises.sql` - Populates Rugby exercises (34 exercises)

## How to Run
Execute these scripts directly in your Supabase SQL Editor:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste each script in order
4. Execute

## Status Tracking
- [ ] 001_add_coach_functionality.sql
- [ ] 002_populate_gaa_exercises.sql
- [ ] 003_populate_soccer_exercises.sql
- [ ] 004_populate_rugby_exercises.sql

## Notes
- Always backup your database before running migrations
- These migrations are idempotent (safe to run multiple times)
- Check for errors after each migration