/**
 * Secure Test Credentials Helper
 *
 * This module ensures that test credentials are NEVER hardcoded in the codebase.
 * All credentials must be provided via environment variables at runtime.
 *
 * Setup:
 * 1. Create a .env.test file (gitignored) with your credentials
 * 2. Set PLAYWRIGHT_TEST_USER_EMAIL and PLAYWRIGHT_TEST_USER_PASSWORD
 * 3. Run tests with: npm run test:e2e
 */

export interface TestCredentials {
  email: string;
  password: string;
}

/**
 * Gets test credentials from environment variables.
 * Throws an error if credentials are not properly configured.
 *
 * @throws {Error} If required environment variables are not set
 */
export function getTestCredentials(): TestCredentials {
  const email = process.env.PLAYWRIGHT_TEST_USER_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_USER_PASSWORD;

  // Validate that both credentials are provided
  if (!email || !password) {
    const missingVars = [];
    if (!email) missingVars.push('PLAYWRIGHT_TEST_USER_EMAIL');
    if (!password) missingVars.push('PLAYWRIGHT_TEST_USER_PASSWORD');

    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      '\n' +
      '❌ SECURITY REQUIREMENT: Test credentials must NEVER be hardcoded.\n' +
      '\n' +
      'To run tests, you must provide credentials via environment variables:\n' +
      '\n' +
      '1. Create a .env.test file in the frontend directory:\n' +
      '   PLAYWRIGHT_TEST_USER_EMAIL=your-test-email@example.com\n' +
      '   PLAYWRIGHT_TEST_USER_PASSWORD=your-secure-password\n' +
      '\n' +
      '2. Or set environment variables directly:\n' +
      '   export PLAYWRIGHT_TEST_USER_EMAIL=your-test-email@example.com\n' +
      '   export PLAYWRIGHT_TEST_USER_PASSWORD=your-secure-password\n' +
      '\n' +
      '3. Never commit .env.test to version control (it should be gitignored)\n'
    );
  }

  // Additional validation to prevent accidental exposure
  const invalidValues = ['test', 'password', 'example', 'placeholder', '123', 'admin'];
  const emailLower = email.toLowerCase();
  const passwordLower = password.toLowerCase();

  if (invalidValues.some(invalid => passwordLower === invalid)) {
    console.warn(
      '⚠️  WARNING: Test password appears to be a weak placeholder.\n' +
      'Consider using a stronger test password for better security simulation.'
    );
  }

  if (emailLower.includes('example.com') && !emailLower.startsWith('test')) {
    console.warn(
      '⚠️  WARNING: Test email appears to be a generic placeholder.\n' +
      'Consider using a real test account for more realistic testing.'
    );
  }

  return { email, password };
}

/**
 * Alternative credential getter for secondary test accounts
 * (e.g., for multi-user testing scenarios)
 */
export function getSecondaryTestCredentials(): TestCredentials {
  const email = process.env.PLAYWRIGHT_TEST_USER2_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_USER2_PASSWORD;

  if (!email || !password) {
    // Fall back to primary credentials if secondary not provided
    console.log('Secondary test credentials not found, using primary credentials');
    return getTestCredentials();
  }

  return { email, password };
}

/**
 * Gets admin test credentials (for admin panel testing)
 */
export function getAdminTestCredentials(): TestCredentials {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Admin test credentials not configured.\n' +
      'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD environment variables.'
    );
  }

  return { email, password };
}

/**
 * Validates that the test environment is properly configured
 * Call this in test.beforeAll() hooks
 */
export function validateTestEnvironment(): void {
  try {
    const creds = getTestCredentials();
    console.log(`✅ Test environment configured for: ${creds.email.replace(/(.{3}).*(@.*)/, '$1***$2')}`);
  } catch (error) {
    console.error('❌ Test environment validation failed');
    throw error;
  }
}

/**
 * Helper to safely log credentials for debugging (masks sensitive parts)
 */
export function logMaskedCredentials(creds: TestCredentials): void {
  const maskedEmail = creds.email.replace(/(.{3}).*(@.*)/, '$1***$2');
  const maskedPassword = '*'.repeat(creds.password.length);
  console.log(`Using test account: ${maskedEmail} (password: ${maskedPassword})`);
}