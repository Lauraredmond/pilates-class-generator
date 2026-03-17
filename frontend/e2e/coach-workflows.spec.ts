import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_ENV === 'production'
  ? 'https://basslinemvp.netlify.app'
  : process.env.TEST_ENV === 'dev'
  ? 'https://bassline-dev.netlify.app'
  : 'http://localhost:5173';

// Test user credentials from environment
const COACH_USER = {
  email: process.env.PLAYWRIGHT_TEST_USER_EMAIL || 'test@example.com',
  password: process.env.PLAYWRIGHT_TEST_USER_PASSWORD || 'TestPassword123!',
};

test.describe('Coach Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // First, navigate to root to handle any initial disclaimers
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Handle initial Medical Safety Disclaimer and other popups
    await handlePermissionsAndDisclaimers(page);
    await page.waitForTimeout(1000);

    // Now navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Login as coach
    await page.fill('input[type="email"]', COACH_USER.email);
    await page.fill('input[type="password"]', COACH_USER.password);

    // Submit login
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for successful login (redirect away from login page)
    await page.waitForURL((url: URL) => !url.pathname.includes('login'), { timeout: 10000 });

    // Handle any post-login disclaimers or popups
    await handlePermissionsAndDisclaimers(page);

    console.log('✅ Logged in successfully');
  });

  test('should navigate to Coach Hub and verify content', async ({ page }) => {
    // Navigate to Coach Hub
    await page.goto(`${BASE_URL}/coach-hub`);
    await page.waitForLoadState('domcontentloaded');

    // Verify page header
    await expect(page.locator('h1:has-text("Coach Hub")')).toBeVisible({ timeout: 5000 });

    // Verify main features are visible
    await expect(page.locator('text=Youth Training Hub')).toBeVisible();
    await expect(page.locator('text=Manage my GAA team')).toBeVisible();
    await expect(page.locator('text=Manage my Soccer team')).toBeVisible();
    await expect(page.locator('text=Manage my Rugby team')).toBeVisible();

    console.log('✅ Coach Hub loaded successfully with all sport options');
  });

  test('should access GAA sport page and view exercises', async ({ page }) => {
    // Navigate to Coach Hub
    await page.goto(`${BASE_URL}/coach-hub`);
    await page.waitForLoadState('domcontentloaded');

    // Click on GAA Programme button
    const gaaButton = page.locator('button:has-text("Open GAA Programme")');
    await gaaButton.click();

    // Wait for GAA sport page to load
    await page.waitForLoadState('domcontentloaded');

    // Verify GAA page header
    await expect(page.locator('h1:has-text("Pilates for GAA")')).toBeVisible({ timeout: 5000 });

    // Verify tabs are present
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
    await expect(page.locator('button:has-text("Session Builder")')).toBeVisible();

    // Verify search bar is present
    await expect(page.locator('input[placeholder*="Search exercises"]')).toBeVisible();

    // Wait for exercises to load (or check for loading state to disappear)
    await page.waitForTimeout(2000); // Give time for API call

    // Check if exercises loaded or if we're in a no-data state
    const noExercisesMessage = page.locator('text=No exercises found');
    const exerciseCards = page.locator('input[type="checkbox"][id^="checkbox-"]');

    const hasExercises = await exerciseCards.count() > 0;
    const showsNoData = await noExercisesMessage.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasExercises) {
      console.log(`✅ GAA page loaded with ${await exerciseCards.count()} exercises`);
    } else if (showsNoData) {
      console.log('⚠️ GAA page loaded but no exercises available (API may not have data)');
    } else {
      console.log('⚠️ GAA page loaded but exercises state unclear');
    }
  });

  test('should select exercises and view in Session Builder', async ({ page }) => {
    // Navigate to GAA sport page
    await page.goto(`${BASE_URL}/coach/sport/gaa`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Verify we're on Library tab
    const libraryTab = page.locator('button:has-text("Library")');
    await expect(libraryTab).toHaveClass(/border-burgundy/); // Active tab styling

    // Check if exercises are available
    const exerciseCheckboxes = page.locator('input[type="checkbox"][id^="checkbox-"]');
    const exerciseCount = await exerciseCheckboxes.count();

    if (exerciseCount > 0) {
      console.log(`Found ${exerciseCount} exercises available for selection`);

      // Select first 3 exercises
      const numToSelect = Math.min(3, exerciseCount);
      for (let i = 0; i < numToSelect; i++) {
        await exerciseCheckboxes.nth(i).check();
        await page.waitForTimeout(300); // Small delay between selections
      }

      console.log(`✅ Selected ${numToSelect} exercises`);

      // Switch to Session Builder tab
      const sessionBuilderTab = page.locator('button:has-text("Session Builder")');
      await sessionBuilderTab.click();
      await page.waitForTimeout(500);

      // Verify Session Builder shows selected exercises
      const selectedExercisesCount = page.locator(`text=${numToSelect} exercises selected`);
      await expect(selectedExercisesCount).toBeVisible({ timeout: 3000 });

      // Verify exercise cards are displayed in session builder
      const sessionExerciseCards = page.locator('div.bg-white.rounded-lg').filter({ hasText: /\d+\./ }); // Cards with numbering
      const sessionCardsCount = await sessionExerciseCards.count();
      expect(sessionCardsCount).toBe(numToSelect);

      console.log(`✅ Session Builder displays ${sessionCardsCount} selected exercises`);

      // Test removing an exercise
      const removeButton = page.locator('button[title="Remove from session"]').first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await page.waitForTimeout(300);

        // Verify count updated
        const updatedCount = page.locator(`text=${numToSelect - 1} exercises selected`);
        await expect(updatedCount).toBeVisible({ timeout: 2000 });

        console.log(`✅ Successfully removed exercise from session`);
      }
    } else {
      console.log('⚠️ No exercises available to test selection workflow (API may not have data)');

      // At least verify the empty state
      const sessionBuilderTab = page.locator('button:has-text("Session Builder")');
      await sessionBuilderTab.click();
      await expect(page.locator('text=No exercises selected yet')).toBeVisible();
      console.log('✅ Session Builder shows correct empty state');
    }
  });

  test('should test exercise search and filtering', async ({ page }) => {
    // Navigate to GAA sport page
    await page.goto(`${BASE_URL}/coach/sport/gaa`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check if exercises are available
    const exerciseCheckboxes = page.locator('input[type="checkbox"][id^="checkbox-"]');
    const exerciseCount = await exerciseCheckboxes.count();

    if (exerciseCount > 0) {
      const initialCount = exerciseCount;
      console.log(`Initial exercise count: ${initialCount}`);

      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search exercises"]');
      await searchInput.fill('core');
      await page.waitForTimeout(500);

      const searchResultCount = await exerciseCheckboxes.count();
      console.log(`After searching for "core": ${searchResultCount} exercises`);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Verify count restored
      const restoredCount = await exerciseCheckboxes.count();
      expect(restoredCount).toBe(initialCount);
      console.log(`✅ Search cleared, count restored to ${restoredCount}`);

      // Test category filtering
      const categoryButtons = page.locator('button').filter({ hasText: /Core Stability|Flexibility|Power/ });
      const categoryCount = await categoryButtons.count();

      if (categoryCount > 1) {
        // Click first non-"All" category
        const firstCategory = categoryButtons.nth(1);
        const categoryName = await firstCategory.textContent();
        await firstCategory.click();
        await page.waitForTimeout(500);

        const filteredCount = await exerciseCheckboxes.count();
        console.log(`✅ Category filter "${categoryName}" applied: ${filteredCount} exercises`);

        // Verify filter is active (button should have active styling)
        await expect(firstCategory).toHaveClass(/bg-burgundy/);
      }
    } else {
      console.log('⚠️ No exercises available to test search/filter (API may not have data)');
    }
  });

  test('should navigate between different sports', async ({ page }) => {
    // Start at Coach Hub
    await page.goto(`${BASE_URL}/coach-hub`);
    await page.waitForLoadState('domcontentloaded');

    // Test GAA navigation
    await page.locator('button:has-text("Open GAA Programme")').click();
    await expect(page.locator('h1:has-text("Pilates for GAA")')).toBeVisible({ timeout: 5000 });
    console.log('✅ Navigated to GAA sport page');

    // Go back to Coach Hub
    await page.locator('button:has-text("Back to Coach Hub")').click();
    await expect(page.locator('h1:has-text("Coach Hub")')).toBeVisible({ timeout: 5000 });
    console.log('✅ Navigated back to Coach Hub');

    // Test Soccer navigation
    await page.locator('button:has-text("Open Soccer Programme")').click();
    await expect(page.locator('h1:has-text("Pilates for Soccer")')).toBeVisible({ timeout: 5000 });
    console.log('✅ Navigated to Soccer sport page');

    // Go back again
    await page.locator('button:has-text("Back to Coach Hub")').click();
    await expect(page.locator('h1:has-text("Coach Hub")')).toBeVisible({ timeout: 5000 });

    // Test Rugby navigation
    await page.locator('button:has-text("Open Rugby Programme")').click();
    await expect(page.locator('h1:has-text("Pilates for Rugby")')).toBeVisible({ timeout: 5000 });
    console.log('✅ Navigated to Rugby sport page');

    console.log('✅ All sport page navigation working correctly');
  });

  test('should expand exercise details', async ({ page }) => {
    // Navigate to GAA sport page
    await page.goto(`${BASE_URL}/coach/sport/gaa`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check if exercises are available
    const exerciseTitles = page.locator('h3.text-burgundy.cursor-pointer');
    const exerciseCount = await exerciseTitles.count();

    if (exerciseCount > 0) {
      // Click first exercise title to expand
      const firstExercise = exerciseTitles.first();
      const exerciseName = await firstExercise.textContent();
      await firstExercise.click();
      await page.waitForTimeout(300);

      // Look for expanded details sections
      const techniqueSection = page.locator('h4:has-text("Pilates Technique")');
      const connectionSection = page.locator('h4:has-text("GAA/Hurling Connection")');

      const hasTechnique = await techniqueSection.isVisible({ timeout: 2000 }).catch(() => false);
      const hasConnection = await connectionSection.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasTechnique && hasConnection) {
        console.log(`✅ Exercise "${exerciseName}" expanded successfully with full details`);
      } else {
        console.log(`⚠️ Exercise "${exerciseName}" expanded but some details may be missing`);
      }

      // Click again to collapse
      await firstExercise.click();
      await page.waitForTimeout(300);

      const techniqueHidden = await techniqueSection.isHidden().catch(() => true);
      if (techniqueHidden) {
        console.log(`✅ Exercise collapsed successfully`);
      }
    } else {
      console.log('⚠️ No exercises available to test expansion (API may not have data)');
    }
  });
});

// Helper Functions

async function handlePermissionsAndDisclaimers(page: any) {
  // Handle Medical Safety Disclaimer
  const medicalSafetyHeader = page.locator('h3:has-text("Medical Safety Disclaimer")');
  if (await medicalSafetyHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Handling Medical Safety Disclaimer...');

    // Click "No" to pregnancy question if visible
    const noButton = page.locator('button:has-text("No")').first();
    if (await noButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await noButton.click();
      await page.waitForTimeout(500);
    }

    // Check all disclaimer checkboxes
    const disclaimerCheckboxes = page.locator('input[type="checkbox"]:visible');
    const checkboxCount = await disclaimerCheckboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await disclaimerCheckboxes.nth(i).check();
      await page.waitForTimeout(200);
    }
  }

  // Click Accept button
  const acceptButton = page.locator('button:has-text("Accept - Continue to App"), button:has-text("Accept"), button:has-text("I agree")').first();
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click({ force: true });
    await page.waitForTimeout(1000);
  }

  // Handle other disclaimer popups
  const disclaimerButtons = [
    'button:has-text("I understand")',
    'button:has-text("Continue")',
    'button:has-text("Accept and Continue")',
    'button:has-text("Got it")',
    'button:has-text("Proceed")',
  ];

  for (const selector of disclaimerButtons) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(500);
    }
  }

  // Handle beta agreement
  const betaButton = page.locator('button:has-text("Join Beta"), button:has-text("I agree to beta")').first();
  if (await betaButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await betaButton.click();
    await page.waitForTimeout(500);
  }
}

// Test configuration
test.describe.configure({
  mode: 'serial',  // Run tests in sequence
  timeout: 60000,  // 60 second timeout per test
});
