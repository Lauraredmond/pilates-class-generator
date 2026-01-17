import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

/**
 * Playwright E2E Testing Configuration
 * Supports both dev and production environments
 *
 * Credentials:
 *   Test credentials loaded from .env.test file (gitignored)
 *   Dev account: [credentials in .env.test]
 *
 * Usage:
 *   npm run test:e2e              # Test production
 *   npm run test:e2e:dev          # Test dev environment
 *   npm run test:e2e:both         # Test both environments
 *   npm run test:e2e:cast         # Chromecast-only test (fast)
 *
 * See https://playwright.dev/docs/test-configuration
 */

// Load test credentials from .env.test (if exists)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env.test') });

// Determine which environment to test based on env var
const TEST_ENV = process.env.TEST_ENV || 'production';

const LOCAL_BASE_URL = 'http://localhost:5173';
const DEV_BASE_URL = 'https://bassline-dev.netlify.app';
const PROD_BASE_URL = 'https://basslinemvp.netlify.app';

export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: 'html',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL determined by TEST_ENV */
    baseURL: TEST_ENV === 'dev' ? DEV_BASE_URL : PROD_BASE_URL,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for environment + browser combinations */
  projects: [
    // Local Development Environment Tests
    {
      name: 'local-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: LOCAL_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/, // All test files
    },

    // Production Environment Tests
    {
      name: 'prod-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: PROD_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/, // All test files
      testIgnore: /.*-dev\.spec\.ts$/, // Skip dev-specific tests
    },
    {
      name: 'prod-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        baseURL: PROD_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*-dev\.spec\.ts$/,
    },
    {
      name: 'prod-mobile-safari',
      use: {
        ...devices['iPhone 12'],
        baseURL: PROD_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*-dev\.spec\.ts$/,
    },

    // Dev Environment Tests
    {
      name: 'dev-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: DEV_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/, // All test files
    },
    {
      name: 'dev-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        baseURL: DEV_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/,
    },
    {
      name: 'dev-mobile-safari',
      use: {
        ...devices['iPhone 12'],
        baseURL: DEV_BASE_URL,
      },
      testMatch: /.*\.spec\.ts$/,
    },
  ],

  /* Run local dev server before starting tests (optional) */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
