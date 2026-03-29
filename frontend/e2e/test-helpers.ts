import { Page } from '@playwright/test';

/**
 * Shared E2E Test Helpers
 * Reusable functions for common test operations
 */

/**
 * Handle Medical Safety Disclaimer Modal (3-step flow)
 *
 * This modal appears before login and requires:
 * 1. Answer pregnancy/postnatal question (click "No")
 * 2. Check both required checkboxes
 * 3. Click "Accept - Continue to App"
 *
 * Usage:
 *   await handleMedicalDisclaimer(page);
 *
 * @param page - Playwright Page object
 */
export async function handleMedicalDisclaimer(page: Page): Promise<void> {
  const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
  const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);

  if (modalVisible) {
    console.log('Medical disclaimer modal detected, handling multi-step flow...');

    // Step 1: Answer pregnancy/postnatal question
    const pregnancyQuestion = page.locator('button:has-text("No")');
    if (await pregnancyQuestion.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pregnancyQuestion.click();
      await page.waitForTimeout(500);
      console.log('  ✓ Pregnancy question answered');
    }

    // Step 2: Check required checkboxes
    const checkbox1 = page.locator('input[type="checkbox"]').first();
    const checkbox2 = page.locator('input[type="checkbox"]').nth(1);

    if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox1.check();
      await checkbox2.check();
      await page.waitForTimeout(300);
      console.log('  ✓ Checkboxes completed');
    }

    // Step 3: Click "Accept - Continue to App" button
    const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
      console.log('  ✓ Disclaimer accepted');
    }
  } else {
    console.log('No medical disclaimer modal detected - proceeding to login');
  }
}

/**
 * Login with test credentials
 *
 * Handles both medical disclaimer (if present) and standard login flow.
 *
 * Usage:
 *   await loginWithTestUser(page, email, password);
 *
 * @param page - Playwright Page object
 * @param email - User email
 * @param password - User password
 */
export async function loginWithTestUser(page: Page, email: string, password: string): Promise<void> {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Handle medical disclaimer if present
  await handleMedicalDisclaimer(page);

  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for successful login (redirects to home page or dashboard)
  await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  console.log('✅ Login successful');
}
