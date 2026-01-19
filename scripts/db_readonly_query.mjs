#!/usr/bin/env node

/**
 * Read-Only Database Query Runner
 *
 * Purpose: Allow Claude Code to inspect database schema safely
 * Security: SELECT-only, connection string never logged
 * Usage: node scripts/db_readonly_query.mjs "SELECT * FROM movements LIMIT 5"
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

// Load .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
dotenv.config({ path: join(projectRoot, '.env.local') });

// Security: Dangerous SQL keywords that indicate write operations
const DANGEROUS_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'COPY',
  'IMPORT', 'EXPORT', 'BACKUP', 'RESTORE'
];

// Maximum rows to return (safety limit)
const MAX_ROWS = 1000;

/**
 * Validate SQL query for read-only safety
 */
function validateQuery(sql) {
  const upperSQL = sql.toUpperCase();

  // Check for dangerous keywords
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (upperSQL.includes(keyword)) {
      throw new Error(`❌ BLOCKED: Query contains write operation: ${keyword}`);
    }
  }

  // Must contain SELECT or WITH
  if (!upperSQL.includes('SELECT') && !upperSQL.includes('WITH')) {
    throw new Error('❌ BLOCKED: Query must contain SELECT or WITH');
  }

  // Block multiple statements (semicolons)
  const semicolonCount = (sql.match(/;/g) || []).length;
  if (semicolonCount > 1 || (semicolonCount === 1 && !sql.trim().endsWith(';'))) {
    throw new Error('❌ BLOCKED: Multiple statements not allowed');
  }

  return true;
}

/**
 * Format query results as table
 */
function formatResults(rows, fields) {
  if (rows.length === 0) {
    return '(0 rows)';
  }

  // Get column names
  const columns = fields.map(f => f.name);

  // Calculate column widths
  const widths = columns.map((col, i) => {
    const values = rows.map(row => String(row[col] ?? ''));
    return Math.max(col.length, ...values.map(v => v.length), 3);
  });

  // Build header
  const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
  const separator = widths.map(w => '-'.repeat(w)).join('-+-');

  // Build rows
  const dataRows = rows.map(row =>
    columns.map((col, i) => String(row[col] ?? '').padEnd(widths[i])).join(' | ')
  );

  return [header, separator, ...dataRows, `(${rows.length} row${rows.length === 1 ? '' : 's'})`].join('\n');
}

/**
 * Execute read-only query
 */
async function executeQuery(sql, dbType = 'dev') {
  // Validate connection string
  const envVar = dbType === 'prod' ? 'DB_PROD_READONLY_URL' : 'DB_DEV_READONLY_URL';
  const connectionString = process.env[envVar];
  if (!connectionString) {
    console.error(`❌ ERROR: ${envVar} not found in .env.local`);
    console.error('Please ensure .env.local exists with:');
    console.error('DB_DEV_READONLY_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres');
    console.error('DB_PROD_READONLY_URL=postgresql://claude_readonly:PASSWORD@db.xxxxx.supabase.co:5432/postgres');
    process.exit(1);
  }

  console.error(`🔗 Connecting to: ${dbType.toUpperCase()} database\n`);

  // Validate query safety
  try {
    validateQuery(sql);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  // Create connection pool
  // Remove sslmode from connection string if present (we'll configure SSL explicitly)
  const cleanConnectionString = connectionString.replace(/[?&]sslmode=\w+/, '');

  const pool = new Pool({
    connectionString: cleanConnectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false  // Accept Supabase's SSL certificate
    }
  });

  try {
    console.error('🔍 Executing query...\n');

    // Execute query
    const result = await pool.query(sql);

    // Check row limit
    if (result.rows.length > MAX_ROWS) {
      console.error(`⚠️  WARNING: Result truncated to ${MAX_ROWS} rows (query returned ${result.rows.length})`);
      result.rows = result.rows.slice(0, MAX_ROWS);
    }

    // Output results
    console.log(formatResults(result.rows, result.fields));

  } catch (err) {
    console.error('❌ Query failed:');
    console.error(`   ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main
const args = process.argv.slice(2);
let dbType = 'dev'; // default to dev
let sql = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--prod') {
    dbType = 'prod';
  } else if (args[i] === '--dev') {
    dbType = 'dev';
  } else {
    sql = args[i];
  }
}

if (!sql) {
  console.error('Usage: node scripts/db_readonly_query.mjs [--dev|--prod] "SELECT ..."');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/db_readonly_query.mjs "SELECT * FROM movements LIMIT 5"  # queries DEV by default');
  console.error('  node scripts/db_readonly_query.mjs --dev "SELECT COUNT(*) FROM class_history"');
  console.error('  node scripts/db_readonly_query.mjs --prod "SELECT * FROM warmup_routines LIMIT 5"');
  process.exit(1);
}

executeQuery(sql, dbType);
