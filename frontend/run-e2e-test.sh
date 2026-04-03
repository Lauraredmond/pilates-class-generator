#!/bin/bash
# E2E Test Runner - Reads credentials from existing .env files at runtime
# No credentials are stored in test files - they're loaded dynamically

set -e

# Load credentials from existing .env.local (database scripts config)
if [ -f ../.env.local ]; then
  echo "✅ Loading credentials from .env.local"
  export $(grep -v '^#' ../.env.local | grep -E 'TEST_EMAIL|TEST_PASSWORD' | xargs)
else
  echo "❌ .env.local not found"
  exit 1
fi

# Map to Playwright environment variable names
export PLAYWRIGHT_TEST_USER_EMAIL="${TEST_EMAIL}"
export PLAYWRIGHT_TEST_USER_PASSWORD="${TEST_PASSWORD}"
export PLAYWRIGHT_ADMIN_EMAIL="${TEST_EMAIL}"
export PLAYWRIGHT_ADMIN_PASSWORD="${TEST_PASSWORD}"

# Verify credentials were loaded
if [ -z "$PLAYWRIGHT_TEST_USER_EMAIL" ] || [ -z "$PLAYWRIGHT_TEST_USER_PASSWORD" ]; then
  echo "❌ Failed to load test credentials from .env.local"
  echo "Expected: TEST_EMAIL and TEST_PASSWORD"
  exit 1
fi

echo "✅ Test credentials loaded successfully"
echo "   Email: ${PLAYWRIGHT_TEST_USER_EMAIL}"
echo "   Running comprehensive E2E test..."
echo ""

# Run the comprehensive test
npm run test:e2e:comprehensive:dev
