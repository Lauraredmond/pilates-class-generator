#!/bin/bash

# Script to update all test files to use secure credentials
# This ensures NO credentials are ever hardcoded in the codebase

echo "🔒 Updating all test files to use secure credentials..."

# Find all test files with credential fallbacks
TEST_FILES=$(grep -r "process.env.*||" e2e/*.spec.ts 2>/dev/null | grep -E "EMAIL|PASSWORD" | cut -d: -f1 | sort -u)

# Counter for tracking progress
UPDATED=0
TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')

echo "Found $TOTAL test files to update"

for file in $TEST_FILES; do
    echo "Updating: $file"

    # Check if file already imports secure-credentials
    if ! grep -q "secure-credentials" "$file"; then
        # Add import at the beginning of the file after other imports
        sed -i '' '/^import.*playwright/a\
import { getTestCredentials, validateTestEnvironment } from "./helpers/secure-credentials";
' "$file"
    fi

    # Replace all credential fallback patterns
    # Pattern 1: const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || 'anything';
    sed -i '' 's/const TEST_EMAIL = process.env\.\w* || .*/\/\/ Credentials loaded securely in test.beforeAll()/' "$file"
    sed -i '' 's/const TEST_PASSWORD = process.env\.\w* || .*/\/\/ See testCredentials object/' "$file"

    # Pattern 2: const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'anything';
    sed -i '' 's/const TEST_USER_EMAIL = process.env\.\w* || .*/\/\/ Credentials loaded securely in test.beforeAll()/' "$file"
    sed -i '' 's/const TEST_USER_PASSWORD = process.env\.\w* || .*/\/\/ See testCredentials object/' "$file"

    # Add beforeAll hook if not present
    if ! grep -q "test.beforeAll" "$file"; then
        # Add after test.describe
        sed -i '' '/test.describe.*{/a\
\
  let testCredentials: { email: string; password: string };\
\
  test.beforeAll(() => {\
    validateTestEnvironment();\
    testCredentials = getTestCredentials();\
  });
' "$file"
    fi

    # Replace inline usage of TEST_EMAIL/TEST_PASSWORD
    sed -i '' 's/TEST_EMAIL/testCredentials.email/g' "$file"
    sed -i '' 's/TEST_PASSWORD/testCredentials.password/g' "$file"
    sed -i '' 's/TEST_USER_EMAIL/testCredentials.email/g' "$file"
    sed -i '' 's/TEST_USER_PASSWORD/testCredentials.password/g' "$file"

    UPDATED=$((UPDATED + 1))
    echo "  ✓ Updated $file ($UPDATED/$TOTAL)"
done

echo ""
echo "✅ Successfully updated $UPDATED test files"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff e2e/"
echo "2. Run tests to ensure they work: npm run test:e2e"
echo "3. Commit the changes: git add -A && git commit -m 'feat(security): enforce runtime credential injection for all tests'"
echo ""
echo "Remember to set these environment variables before running tests:"
echo "  export PLAYWRIGHT_TEST_USER_EMAIL=your-test-email@example.com"
echo "  export PLAYWRIGHT_TEST_USER_PASSWORD=your-secure-password"
echo ""
echo "Or create a .env.test file with these variables (gitignored)"