# Multi-Role Registration Test Setup

## Setting Up Test Credentials

If the Playwright tests fail due to login issues, you need to provide me with test credentials. Here's how:

### Option 1: Update the test file directly
Edit `multi-role-registration.spec.ts` and update this section:

```javascript
// Existing user for login test
const EXISTING_USER = {
  email: 'your-test-email@example.com',  // UPDATE THIS
  password: 'YourTestPassword123!',       // UPDATE THIS
};
```

### Option 2: Use environment variables
Create a `.env.test` file in the frontend directory:

```bash
TEST_USER_EMAIL=your-test-email@example.com
TEST_USER_PASSWORD=YourTestPassword123!
```

Then update the test to use these:

```javascript
const EXISTING_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};
```

## Running the Tests

### Local testing:
```bash
cd frontend

# Install Playwright if not already installed
npm install @playwright/test

# Run the multi-role registration tests
npx playwright test e2e/multi-role-registration.spec.ts --headed

# Or run in headless mode
npx playwright test e2e/multi-role-registration.spec.ts

# With specific environment
TEST_ENV=production npx playwright test e2e/multi-role-registration.spec.ts
```

### Debug mode:
```bash
# Run with UI mode for debugging
npx playwright test e2e/multi-role-registration.spec.ts --ui

# Run with debug console
npx playwright test e2e/multi-role-registration.spec.ts --debug
```

## Test Coverage

The test suite covers:

1. **Multi-role registration flow**:
   - Registering with multiple roles (practitioner, parent, coach)
   - Accepting all safety and legal agreements
   - Handling permission/disclaimer screens

2. **Adding roles to existing account**:
   - Logging in with existing credentials
   - Navigating to profile settings
   - Adding a new role to the account

3. **Multi-role capability verification**:
   - Checking that all role-based features are accessible
   - Verifying practitioner, parent, and coach capabilities

## Troubleshooting

### Common Issues:

1. **Login fails**: Update the `EXISTING_USER` credentials with a real test account

2. **Selectors not found**: The UI might have changed. Check browser DevTools for current selectors

3. **Timeout errors**: Increase timeout in test configuration:
   ```javascript
   test.describe.configure({
     timeout: 120000,  // 2 minutes
   });
   ```

4. **Permission popups blocking tests**: The test automatically handles these, but if new ones appear, add them to `handlePermissionsAndDisclaimers()` function

## Creating a Test Account

If you need a dedicated test account:

1. Go to the registration page
2. Use email format: `test.playwright.TIMESTAMP@example.com`
3. Select all roles during registration
4. Complete email verification
5. Use these credentials in the test file