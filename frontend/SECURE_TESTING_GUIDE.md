# 🔒 Secure Testing Guide

## Overview

This guide ensures that **NO credentials are EVER hardcoded** in our test files or pushed to GitHub. All credentials are injected at runtime through environment variables.

## ⚠️ Security Rules

1. **NEVER hardcode credentials** - Not even as fallback values
2. **NEVER commit .env files** - They should always be gitignored
3. **ALWAYS use environment variables** - Credentials must come from runtime environment
4. **ALWAYS validate credentials exist** - Tests should fail fast if not configured

## 🚀 Quick Start

### 1. Create Your Local Credentials File

Create a `.env.test` file in the `frontend` directory:

```bash
# frontend/.env.test (NEVER commit this file!)
PLAYWRIGHT_TEST_USER_EMAIL=your-test-email@example.com
PLAYWRIGHT_TEST_USER_PASSWORD=your-secure-password

# Optional: Secondary account for multi-user tests
PLAYWRIGHT_TEST_USER2_EMAIL=second-test@example.com
PLAYWRIGHT_TEST_USER2_PASSWORD=another-secure-password

# Optional: Admin account for admin panel tests
PLAYWRIGHT_ADMIN_EMAIL=admin-test@example.com
PLAYWRIGHT_ADMIN_PASSWORD=admin-secure-password
```

### 2. Verify .gitignore

Ensure `.env.test` is in your `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.test
.env.*.local
```

### 3. Run Tests

```bash
# The playwright.config.ts automatically loads .env.test
npm run test:e2e
```

## 🔐 How It Works

### 1. Secure Credentials Helper

All test files use the `secure-credentials.ts` helper:

```typescript
import { getTestCredentials, validateTestEnvironment } from './helpers/secure-credentials';

test.beforeAll(() => {
  // This will throw an error if credentials are not configured
  validateTestEnvironment();
  const testCredentials = getTestCredentials();
});
```

### 2. No Fallback Values

Old (INSECURE) approach:
```typescript
// ❌ NEVER DO THIS
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || 'password123';
```

New (SECURE) approach:
```typescript
// ✅ ALWAYS DO THIS
const testCredentials = getTestCredentials(); // Throws if not configured
```

### 3. Runtime Validation

The helper validates credentials at runtime:
- Checks that environment variables exist
- Warns about weak passwords
- Provides clear error messages if not configured

## 🎭 Writing Secure Tests

### Example Test File

```typescript
import { test, expect } from '@playwright/test';
import { getTestCredentials, validateTestEnvironment } from './helpers/secure-credentials';

test.describe('My Feature Tests', () => {
  let testCredentials: { email: string; password: string };

  test.beforeAll(() => {
    // Validate environment and get credentials
    validateTestEnvironment();
    testCredentials = getTestCredentials();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    // Use credentials from secure source
    await page.fill('input[type="email"]', testCredentials.email);
    await page.fill('input[type="password"]', testCredentials.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

## 🚨 CI/CD Configuration

### GitHub Actions

Add secrets to your repository settings:

1. Go to Settings → Secrets → Actions
2. Add:
   - `PLAYWRIGHT_TEST_USER_EMAIL`
   - `PLAYWRIGHT_TEST_USER_PASSWORD`

Use in workflow:

```yaml
- name: Run E2E Tests
  env:
    PLAYWRIGHT_TEST_USER_EMAIL: ${{ secrets.PLAYWRIGHT_TEST_USER_EMAIL }}
    PLAYWRIGHT_TEST_USER_PASSWORD: ${{ secrets.PLAYWRIGHT_TEST_USER_PASSWORD }}
  run: npm run test:e2e
```

### Local Development

For local development without `.env.test` file:

```bash
# macOS/Linux
export PLAYWRIGHT_TEST_USER_EMAIL="your-test@example.com"
export PLAYWRIGHT_TEST_USER_PASSWORD="your-password"
npm run test:e2e

# Windows (PowerShell)
$env:PLAYWRIGHT_TEST_USER_EMAIL="your-test@example.com"
$env:PLAYWRIGHT_TEST_USER_PASSWORD="your-password"
npm run test:e2e
```

## 🔍 Security Audit

### Check for Hardcoded Credentials

Run this command to find any hardcoded credentials:

```bash
# Search for potential hardcoded credentials
grep -r "process.env.*||" e2e/*.spec.ts | grep -E "EMAIL|PASSWORD"

# Search for email patterns
grep -r "@" e2e/*.spec.ts | grep -v "example.com"

# Search for password assignments
grep -r "password.*=" e2e/*.spec.ts | grep -v "process.env"
```

### Update Non-Compliant Tests

Run the update script to fix any non-compliant test files:

```bash
chmod +x update-test-security.sh
./update-test-security.sh
```

## 📋 Checklist

Before committing test files:

- [ ] No hardcoded emails or passwords
- [ ] No fallback values in environment variable checks
- [ ] All tests use `secure-credentials.ts` helper
- [ ] `.env.test` is gitignored
- [ ] Tests fail clearly if credentials not provided
- [ ] CI/CD secrets are configured

## 🆘 Troubleshooting

### Error: "Missing required environment variables"

**Solution:** Create `.env.test` file with your test credentials or set environment variables.

### Tests work locally but fail in CI

**Solution:** Ensure GitHub secrets are properly configured in repository settings.

### Need multiple test accounts

**Solution:** Use `getSecondaryTestCredentials()` or `getAdminTestCredentials()` helpers.

## 📚 Additional Resources

- [Playwright Environment Variables](https://playwright.dev/docs/test-parameterize#passing-environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

Remember: **Security is not optional**. Every test must use secure credential management!