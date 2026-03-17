# Playwright Test Setup

## Quick Start

### 1. Create Test Credentials File

```bash
# From the frontend directory
cp .env.test.example .env.test
```

### 2. Add Your Test Credentials

Edit `.env.test` and replace with your actual test account credentials:

```bash
# .env.test
PLAYWRIGHT_TEST_USER_EMAIL=your-actual-test@example.com
PLAYWRIGHT_TEST_USER_PASSWORD=YourActualPassword123!
```

**Security Note**: `.env.test` is already in `.gitignore` and will never be committed to the repository.

### 3. Run Tests

```bash
# Test local development environment
npx playwright test e2e/multi-role-registration.spec.ts --project=local-chromium --headed

# Test dev environment
TEST_ENV=dev npx playwright test e2e/multi-role-registration.spec.ts --project=dev-chromium

# Test production environment
TEST_ENV=production npx playwright test e2e/multi-role-registration.spec.ts --project=prod-chromium
```

## Test Account Requirements

The test account should:
- Be a valid registered user in the system
- Have confirmed their email address
- Have a known password for testing

You can create a test account by:
1. Registering through the app
2. Confirming the email
3. Using those credentials in `.env.test`

## Environment Variables

The following environment variables are read from `.env.test`:

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAYWRIGHT_TEST_USER_EMAIL` | Test account email | `test@example.com` |
| `PLAYWRIGHT_TEST_USER_PASSWORD` | Test account password | `TestPassword123!` |
| `TEST_ENV` | Environment to test (optional) | `dev`, `production`, `local` |

## Running All Tests

```bash
# Run all tests in all environments
npx playwright test

# Run specific test file
npx playwright test e2e/multi-role-registration.spec.ts

# Run with UI mode (interactive debugging)
npx playwright test --ui

# View test report
npx playwright show-report
```

## Troubleshooting

### "Login failed" or "Invalid credentials"
- Verify your credentials in `.env.test` are correct
- Ensure the test account exists and email is confirmed
- Check that you're testing the right environment (dev vs production)

### ".env.test not found"
- Make sure you copied `.env.test.example` to `.env.test`
- Verify you're in the `frontend` directory

### Tests timeout or hang
- Check that the frontend is running if testing locally
- Verify the environment URL is accessible
- Increase timeout in playwright.config.ts if needed
