# Database Migration Scripts

This directory contains scripts for populating and managing the Pilates movement database.

## Quick Start

### Populate Movement Durations (COMPLETED ✅)

```bash
cd backend
python3 scripts/update_movement_data.py
```

This script:
- Populates `duration_seconds` for all 34 classical Pilates movements
- Validates all movements have complete data
- Provides detailed logging and error reporting

**Status:** ✅ All 34 movements have durations (60-120 seconds)

### Add Movement Patterns (MANUAL STEP REQUIRED)

The `movement_pattern` column categorizes movements by biomechanical pattern (flexion, extension, rotation, lateral, balance).

**To add movement_pattern column:**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `add_movement_pattern.sql`
4. Click "Run"

This will:
- Add the `movement_pattern` column to the `movements` table
- Populate all 34 movements with their patterns
- Show verification query results

## Files in This Directory

### Migration Scripts

| File | Purpose | Status |
|------|---------|--------|
| `populate_movement_data.sql` | Complete SQL migration (duration + pattern) | ✅ Ready |
| `add_movement_pattern.sql` | Just the movement_pattern column/data | ✅ Ready |
| `update_movement_data.py` | Python automation for durations | ✅ Executed |
| `MIGRATION_RESULTS.md` | Detailed results and documentation | ✅ Complete |

### Legacy Scripts

| File | Purpose | Notes |
|------|---------|-------|
| `automated_migration.py` | Initial schema migration | Used in earlier sessions |
| `data_extraction.py` | Excel data extraction | For Excel → JSON conversion |
| `migrate_to_database.py` | Excel → Database import | Initial data load |
| `run_full_migration.py` | Complete migration pipeline | Schema + initial data |
| `run_migration.py` | Simple migration runner | Wrapper script |
| `validate_migration.py` | Migration validation | Post-migration checks |

## Movement Data Details

### Duration Guidelines

Based on classical Pilates standards:

- **The Hundred:** 100 seconds (100 breaths)
- **Roll movements:** 60-90 seconds
- **Leg circles:** 60-120 seconds
- **Stretches:** 90-180 seconds
- **Advanced moves:** 60-120 seconds

### Movement Patterns

Movements are categorized by biomechanical pattern:

| Pattern | Count | Description | Examples |
|---------|-------|-------------|----------|
| **Flexion** | 15 | Forward bending, core engagement | The Hundred, Roll Up, Scissors |
| **Extension** | 9 | Back bending, spinal extension | Swan Dive, Swimming, Push Up |
| **Rotation** | 4 | Twisting, spiral movements | The Saw, Spine Twist, Corkscrew |
| **Lateral** | 3 | Side bending, side work | Side Kick series, Side Bend |
| **Balance** | 3 | Control, stability | Teaser, Boomerang, Control Balance |

**Total:** 34 classical Pilates mat movements

## Verification

To verify your database has complete data:

```bash
cd backend
python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

result = supabase.table('movements').select('name, duration_seconds, movement_pattern').order('movement_number').execute()

for m in result.data[:5]:
    print(f'{m[\"name\"]}: {m[\"duration_seconds\"]}s, {m.get(\"movement_pattern\", \"N/A\")}')
"
```

Expected output:
```
The Hundred: 100s, flexion
The Roll Up: 90s, flexion
The Roll Over: 75s, flexion
One leg circle: 120s, flexion
Rolling back: 60s, flexion
```

## Troubleshooting

### Connection Errors

If you get connection errors, check:
1. `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`
2. Supabase project is running (not paused)
3. API key has correct permissions (use service_role key)

### Missing Movements

If movements are not found:
1. Check exact movement names in database
2. Names are case-sensitive
3. Run: `SELECT name FROM movements ORDER BY movement_number;`

### Column Doesn't Exist

If you get "column does not exist" errors:
1. The column needs to be added via SQL Editor
2. Use the `add_movement_pattern.sql` script
3. Supabase Python client cannot execute DDL statements

## Next Steps

After populating movement data:

1. **Test sequence generation:**
   ```bash
   python agents/sequence_agent.py
   ```

2. **Start backend API:**
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```

3. **Check movements endpoint:**
   ```bash
   curl http://localhost:8000/api/movements | jq
   ```

4. **Verify stats:**
   ```bash
   curl http://localhost:8000/api/movements/stats/summary | jq
   ```

## Support

For issues or questions:
- Check `MIGRATION_RESULTS.md` for detailed results
- Review Supabase dashboard for database state
- Check backend logs for API errors
- Verify `.env` configuration

---

**Last Updated:** 2025-11-17
**Session:** Backend Developer #1 - Database Data Specialist
**Status:** ✅ duration_seconds complete, ⚠️ movement_pattern pending manual SQL
