import { test, expect } from '@playwright/test';
import { getTestCredentials, validateTestEnvironment } from "./helpers/secure-credentials";

const BASE_URL = 'http://localhost:5173';

// Helper function to handle permissions and disclaimers
async function handlePermissionsAndDisclaimers(page: any) {
  // First check all medical disclaimer checkboxes if present
  const checkboxes = page.locator('input[type="checkbox"]:visible');
  const checkboxCount = await checkboxes.count().catch(() => 0);

  if (checkboxCount > 0) {
    console.log(`Found ${checkboxCount} checkboxes to check`);
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = checkboxes.nth(i);
      if (!await checkbox.isChecked()) {
        await checkbox.check();
        await page.waitForTimeout(200);
      }
    }
  }

  // Then handle any safety disclaimer buttons
  const disclaimerButtons = [
    'button:has-text("Accept - Continue to App")',
    'button:has-text("Accept")',
    'button:has-text("I understand")',
    'button:has-text("Continue")',
  ];

  for (const selector of disclaimerButtons) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for button to be enabled after checking checkboxes
      await button.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      const isEnabled = await button.isEnabled();
      if (isEnabled) {
        await button.click();
        await page.waitForTimeout(500);
      }
    }
  }
}

test.describe('Sequencing Report Rule 3 Fix', () => {
  // Setup hook to check for required environment variables
  test.beforeAll(() => {
    if (! || !) {
      throw new Error(
        'Missing required environment variables. Please set:\n' +
        '  PLAYWRIGHT_testCredentials.email\n' +
        '  PLAYWRIGHT_testCredentials.password\n' +
        'in your .env.test file or environment'
      );
    }
  });

  test('Historical muscle balance should show data instead of "No data available"', async ({ page }) => {
    test.setTimeout(60000); // 60 second timeout for this test
    // Test user credentials from environment variables (required)
    const testEmail = !;
    const testPassword = !;

    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Handle Medical Safety Disclaimer if it appears
    const noButton = page.locator('button:has-text("No")').first();
    if (await noButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await noButton.click();
      await page.waitForTimeout(1000);
    }

    // Handle any other disclaimers
    await handlePermissionsAndDisclaimers(page);

    // Login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL((url: URL) => !url.pathname.includes('login'), { timeout: 10000 });

    // Handle any post-login popups
    await handlePermissionsAndDisclaimers(page);

    // Navigate to class builder
    await page.goto(`${BASE_URL}/class-builder`);
    await page.waitForLoadState('networkidle');

    // Generate an advanced class to test repertoire coverage
    // Select difficulty level dropdown (second dropdown on the page)
    const difficultyDropdown = page.locator('select').nth(1);
    await difficultyDropdown.selectOption({ label: 'Advanced' });

    // Select duration dropdown (first dropdown on the page)
    const durationDropdown = page.locator('select').nth(0);
    await durationDropdown.selectOption({ label: '30 minutes - Quick practice' });

    // Scroll down to see the generate button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click generate button - look for various possible texts
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create Class"), button:has-text("Generate Class"), button:has-text("Create My Class")').first();
    await generateButton.click();

    // Wait for class generation (this triggers the sequencing report)
    await page.waitForSelector('.movements-grid', { timeout: 30000 });

    // Accept the class to ensure it's saved and triggers the report
    const acceptButton = page.locator('button:has-text("Accept")');
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(2000); // Wait for save
    }

    // Now navigate to analytics to view the report
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    // Look for the sequencing report section
    const reportContent = await page.textContent('body');

    // Verify the Historical Muscle Balance section has data
    expect(reportContent).not.toContain('No historical data available (this may be the first class)');

    // Verify the report shows actual data
    expect(reportContent).toMatch(/Total Classes Analyzed: \d+/);
    expect(reportContent).toMatch(/Your Journey: \d+ days since first class/);

    // Check that beginner movements are being considered
    // The report should show a mix of difficulty levels in the repertoire
    expect(reportContent).toMatch(/Movement Coverage Analysis/);

    console.log('✅ Historical muscle balance is now showing data correctly');
    console.log('✅ Repertoire coverage includes full movement range');
  });

  test('Advanced classes should include beginner movements for repertoire coverage', async ({ page }) => {
    test.setTimeout(60000); // 60 second timeout for this test
    // Test user credentials from environment variables (required)
    const testEmail = !;
    const testPassword = !;

    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Handle Medical Safety Disclaimer if it appears
    const noButton = page.locator('button:has-text("No")').first();
    if (await noButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await noButton.click();
      await page.waitForTimeout(1000);
    }

    // Handle any other disclaimers
    await handlePermissionsAndDisclaimers(page);

    // Login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL((url: URL) => !url.pathname.includes('login'), { timeout: 10000 });

    // Handle any post-login popups
    await handlePermissionsAndDisclaimers(page);

    // Navigate to class builder
    await page.goto(`${BASE_URL}/class-builder`);
    await page.waitForLoadState('networkidle');

    // Generate multiple advanced classes to check movement variety
    const classCount = 3;
    const allMovements = [];

    for (let i = 0; i < classCount; i++) {
      // Generate an advanced class
      const difficultyDropdown = page.locator('select').nth(1);
      await difficultyDropdown.selectOption({ label: 'Advanced' });

      const durationDropdown = page.locator('select').nth(0);
      await durationDropdown.selectOption({ label: '30 minutes - Quick practice' });

      // Scroll and click generate
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create Class"), button:has-text("Generate Class"), button:has-text("Create My Class")').first();
      await generateButton.click();

      await page.waitForSelector('.movements-grid', { timeout: 30000 });

      // Extract movements from the generated class
      const movements = await page.$$eval('.movement-card .movement-name',
        elements => elements.map(el => el.textContent?.trim())
      );

      allMovements.push(...movements);

      // Check for beginner-level movements like "The Hundred", "Roll Up", etc.
      const beginnerMovements = [
        'The Hundred', 'Roll Up', 'Single Leg Stretch',
        'Double Leg Stretch', 'Single Leg Circles'
      ];

      const hasBeginnerMovement = movements.some(m =>
        beginnerMovements.some(bm => m.toLowerCase().includes(bm.toLowerCase()))
      );

      if (hasBeginnerMovement) {
        console.log(`✅ Class ${i+1} includes beginner movements for repertoire coverage`);
      }

      // Small delay between generations
      if (i < classCount - 1) {
        await page.waitForTimeout(2000);
      }
    }

    // Check overall repertoire coverage
    const uniqueMovements = [...new Set(allMovements)];
    console.log(`Generated ${classCount} classes with ${uniqueMovements.length} unique movements`);

    // Verify we're getting variety including beginner movements
    expect(uniqueMovements.length).toBeGreaterThan(5);

    // Check that at least one beginner movement appears across the classes
    const beginnerMovementFound = uniqueMovements.some(m =>
      ['hundred', 'roll up', 'single leg stretch'].some(bm =>
        m.toLowerCase().includes(bm)
      )
    );

    expect(beginnerMovementFound).toBeTruthy();
    console.log('✅ Advanced classes are including movements from all difficulty levels for proper repertoire coverage');
  });
});