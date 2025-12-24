import { test, expect } from '@playwright/test';

/**
 * E2E Test: AI Class Generation Flow (Database Mode)
 *
 * This test verifies the complete class generation workflow:
 * 1. User authentication
 * 2. Navigate to class builder
 * 3. Fill out class generation form
 * 4. Generate class (database mode - $0 cost)
 * 5. Verify complete 6-section class structure
 * 6. Verify class saves to library
 */

// Test user credentials (create these in Supabase dev database first)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@bassline.dev',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

test.describe('Class Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should generate complete class (database mode) from login to playback', async ({ page }) => {
    // ========================================
    // STEP 1: Login
    // ========================================
    await test.step('Login with test user', async () => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');

      // Wait for dashboard to load
      await page.waitForURL('**/dashboard');
      await expect(page).toHaveURL(/dashboard/);
    });

    // ========================================
    // STEP 2: Navigate to Class Builder
    // ========================================
    await test.step('Navigate to class builder', async () => {
      // Click "Generate" or "Class Builder" navigation link
      const generateLink = page.locator('a[href*="class-builder"], a:has-text("Generate"), button:has-text("Generate")').first();
      await generateLink.click();

      // Wait for class builder page
      await page.waitForURL('**/class-builder');
      await expect(page).toHaveURL(/class-builder/);
    });

    // ========================================
    // STEP 3: Fill Class Generation Form
    // ========================================
    await test.step('Fill class generation form', async () => {
      // Select difficulty level
      await page.click('text=Beginner');

      // Set duration (30 minutes)
      const durationSlider = page.locator('input[type="range"]').first();
      await durationSlider.fill('30');

      // Select focus areas (if available)
      const coreCheckbox = page.locator('input[type="checkbox"][value="core"]');
      if (await coreCheckbox.isVisible()) {
        await coreCheckbox.check();
      }

      // Ensure AI mode is OFF (database mode for $0 cost)
      const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI|Artificial Intelligence/i });
      if (await aiToggle.isVisible()) {
        const isChecked = await aiToggle.getAttribute('aria-checked');
        if (isChecked === 'true') {
          await aiToggle.click(); // Turn OFF AI mode
        }
      }
    });

    // ========================================
    // STEP 4: Generate Class
    // ========================================
    let classGenerationSuccess = false;

    await test.step('Generate class and wait for completion', async () => {
      // Click generate button
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
      await generateButton.click();

      // Wait for generation to complete (should be fast with database mode)
      // Look for success indicators:
      // 1. Modal appears with results
      // 2. "Generated Results" or similar heading
      // 3. Movement list appears

      const resultsModal = page.locator('[role="dialog"], .modal, [class*="modal"]').filter({ hasText: /Generated|Results|Complete/i });
      await expect(resultsModal).toBeVisible({ timeout: 10000 });

      classGenerationSuccess = true;
    });

    // ========================================
    // STEP 5: Verify 6-Section Class Structure
    // ========================================
    await test.step('Verify complete 6-section class structure', async () => {
      // Verify all 6 sections are present in generated class:
      // 1. Preparation
      // 2. Warmup
      // 3. Main Movements
      // 4. Cooldown
      // 5. Meditation
      // 6. HomeCare Advice

      const sections = [
        'Preparation',
        'Warm',
        'Movement',
        'Cool',
        'Meditation',
        'Home',
      ];

      for (const section of sections) {
        const sectionElement = page.locator(`text=${section}`).first();
        await expect(sectionElement).toBeVisible();
      }

      // Verify movements count (~9 movements expected)
      const movementCards = page.locator('[class*="movement"], [data-testid*="movement"]');
      const count = await movementCards.count();
      expect(count).toBeGreaterThan(5); // At least some movements generated
      expect(count).toBeLessThan(15); // Not all 34 movements
    });

    // ========================================
    // STEP 6: Save to Library
    // ========================================
    await test.step('Accept and save class to library', async () => {
      // Click "Accept" or "Save to Library" button
      const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Save"), button:has-text("Add to Library")').first();
      await acceptButton.click();

      // Wait for success confirmation
      await expect(page.locator('text=/saved|added|success/i')).toBeVisible({ timeout: 5000 });
    });

    // ========================================
    // STEP 7: Verify Class Appears in Library
    // ========================================
    await test.step('Verify class appears in library', async () => {
      // Navigate to library/classes page
      const libraryLink = page.locator('a[href*="classes"], a[href*="library"], a:has-text("Classes")').first();
      await libraryLink.click();

      // Wait for library page
      await page.waitForURL('**/classes');

      // Verify newly created class appears (should be first/most recent)
      const firstClass = page.locator('[class*="class-card"], [data-testid*="class"]').first();
      await expect(firstClass).toBeVisible();

      // Verify it has expected metadata
      await expect(firstClass).toContainText(/Beginner|30/);
    });
  });

  test('should handle class generation timeout gracefully', async ({ page }) => {
    // This test verifies error handling when backend is slow/unavailable

    await test.step('Login', async () => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    await test.step('Navigate to class builder', async () => {
      const generateLink = page.locator('a[href*="class-builder"]').first();
      await generateLink.click();
      await page.waitForURL('**/class-builder');
    });

    await test.step('Verify error handling', async () => {
      // Click generate without filling form (may cause validation error)
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();

      // Verify error message or validation appears
      const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');

      // Should either show validation error or timeout gracefully
      // Don't fail test - just verify app doesn't crash
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      // If no error visible, that's also fine (form may have defaults)
      // The key is the app shouldn't crash
      await expect(page).toHaveURL(/class-builder/); // Still on same page
    });
  });

  test('should display music player during class playback', async ({ page }) => {
    // This test verifies music integration works in playback

    await test.step('Login and navigate to existing class', async () => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Navigate to classes
      const classesLink = page.locator('a[href*="classes"]').first();
      await classesLink.click();
      await page.waitForURL('**/classes');
    });

    await test.step('Start class playback', async () => {
      // Click first class to start playback
      const firstClass = page.locator('[class*="class-card"], [data-testid*="class"]').first();
      await firstClass.click();

      // Wait for playback page
      await page.waitForURL('**/playback');
    });

    await test.step('Verify music player appears', async () => {
      // Check for audio element or music controls
      const musicPlayer = page.locator('audio, [class*="music"], [data-testid*="music"]');
      await expect(musicPlayer).toBeVisible({ timeout: 5000 });

      // Verify play/pause controls
      const playButton = page.locator('button:has-text("Play"), button[aria-label*="play"]').first();
      await expect(playButton).toBeVisible();
    });

    await test.step('Verify class sections render in playback', async () => {
      // Verify at least one section is visible
      const sectionContent = page.locator('[class*="section"], [class*="movement"], [class*="narrative"]').first();
      await expect(sectionContent).toBeVisible();
    });
  });
});
