-- Migration 004: Replace Excel References with Production Fields
-- Created: 2025-11-14
-- Purpose: Replace migration artifacts with proper production fields

-- ============================================================================
-- REPLACE EXCEL COLUMNS WITH PRODUCTION FIELDS
-- ============================================================================

-- 1. Add new production-ready columns
ALTER TABLE movements ADD COLUMN IF NOT EXISTS movement_number INTEGER;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 2. Populate movement_number from difficulty_rank (if not already set)
UPDATE movements SET movement_number = difficulty_rank WHERE movement_number IS NULL;

-- 3. Populate code from name (kebab-case version)
UPDATE movements SET code = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '_', 'g')) WHERE code IS NULL;

-- 4. Make movement_number unique and not null
ALTER TABLE movements ALTER COLUMN movement_number SET NOT NULL;
ALTER TABLE movements ADD CONSTRAINT movements_movement_number_unique UNIQUE (movement_number);

-- 5. Make code unique
ALTER TABLE movements ADD CONSTRAINT movements_code_unique UNIQUE (code);

-- 6. Drop old Excel-specific columns and deprecated difficulty_rank
ALTER TABLE movements DROP COLUMN IF EXISTS excel_row_number;
ALTER TABLE movements DROP COLUMN IF EXISTS excel_id;
ALTER TABLE movements DROP COLUMN IF EXISTS created_from_excel;
ALTER TABLE movements DROP COLUMN IF EXISTS difficulty_rank;

-- 7. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_movements_movement_number ON movements(movement_number);
CREATE INDEX IF NOT EXISTS idx_movements_code ON movements(code);

-- 8. Update comments
COMMENT ON TABLE movements IS 'Core Pilates movement catalog (34 classical mat movements)';
COMMENT ON COLUMN movements.movement_number IS 'Sequential movement number (1-34) for classical Pilates order';
COMMENT ON COLUMN movements.code IS 'URL-friendly identifier (e.g., "the_hundred", "roll_up")';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration:

-- Check schema:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'movements'
-- ORDER BY ordinal_position;

-- Check data:
-- SELECT movement_number, code, name, difficulty_level
-- FROM movements
-- ORDER BY movement_number
-- LIMIT 10;
