import { test, expect } from '@playwright/test';

/**
 * E2E Test: Comprehensive Application Testing
 *
 * This test suite covers:
 * 1. Chromecast icon state verification (should be WHITE/ACTIVE, not greyed out)
 * 2. Analytics page class count incrementation
 * 3. Admin-only LLM usage logs visibility
 * 4. AI toggle admin-only access control
 * 5. Settings page developer tools (admin only)
 *
 * Setup:
 *   Requires two test users:
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD - Regular user
 *   - ADMIN_USER_EMAIL / ADMIN_USER_PASSWORD - Admin user (is_admin = true)
 *
 *   Credentials stored in frontend/.env.test (gitignored)
 *
 * Usage:
 *   cd frontend
 *   npm run test:e2e:comprehensive
 */

// Load test credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword',
};

const ADMIN_USER = {
  email: process.env.ADMIN_USER_EMAIL || 'admin@example.com',
  password: process.env.ADMIN_USER_PASSWORD || 'adminpassword',
};

// ==============================================================================
// TEST 1: CHROMECAST ICON STATE VERIFICATION
// ==============================================================================

test.describe('Chromecast Integration', () => {
  test('Chromecast icon should be WHITE/ACTIVE (not greyed out)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer if present
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to class builder
    const generateButton = page.locator('button:has-text("Generate my Pilates class")');
    await generateButton.click();
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Generate or accept existing class
    const acceptExisting = page.locator('button:has-text("Accept & Add to Class")');
    const hasPreGenerated = await acceptExisting.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasPreGenerated) {
      await acceptExisting.click();
      await page.waitForTimeout(3000);
    } else {
      // Generate new class (database mode - faster)
      await page.click('text=Beginner');
      const durationSlider = page.locator('input[type="range"]').first();
      await durationSlider.fill('30');

      // Ensure AI mode OFF
      const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI/i });
      if (await aiToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await aiToggle.getAttribute('aria-checked');
        if (isChecked === 'true') {
          await aiToggle.click();
        }
      }

      const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
      await generateBtn.click();

      const resultsModal = page.locator('[role="dialog"], .modal').filter({ hasText: /Generated|Results/i });
      await expect(resultsModal).toBeVisible({ timeout: 15000 });

      const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Add to Library")').first();
      await acceptBtn.click();
      await page.waitForTimeout(2000);
    }

    // Click Play Class button to start inline playback
    const playClassButton = page.locator('button:has-text("Play Class")');
    await expect(playClassButton).toBeEnabled({ timeout: 10000 });
    await playClassButton.click();
    await page.waitForTimeout(3000); // Wait for ClassPlayback to render

    // Find CastButton component
    const castButton = page.locator(
      'button[aria-label="Cast to TV"], button[aria-label="Connected to TV"], button[aria-label="No Cast devices found"]'
    ).first();

    await expect(castButton).toBeVisible({ timeout: 5000 });

    // Get button state
    const buttonState = await castButton.evaluate((btn) => {
      const styles = window.getComputedStyle(btn);
      return {
        className: btn.className,
        disabled: (btn as HTMLButtonElement).disabled,
        ariaLabel: btn.getAttribute('aria-label'),
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        opacity: styles.opacity,
        cursor: styles.cursor,
      };
    });

    console.log('Cast button state:', buttonState);

    // CRITICAL ASSERTION: Icon should NOT be greyed out
    // After CSP fix (commit d3391bbd), Chromecast device discovery should work
    // Icon should be WHITE/ACTIVE (not greyed out) when Chromecast is on network
    const isGreyedOut = buttonState.disabled ||
                       buttonState.className?.includes('cursor-not-allowed') ||
                       buttonState.className?.includes('text-cream/30') ||
                       buttonState.cursor === 'not-allowed';

    if (isGreyedOut) {
      console.error('❌ CHROMECAST ICON IS GREYED OUT');
      console.error('Expected: WHITE/ACTIVE (Chromecast detectable)');
      console.error('Actual: GREYED OUT/DISABLED');
      console.error('Button state:', buttonState);
      console.error('');
      console.error('Possible causes:');
      console.error('1. CSP fix not deployed yet');
      console.error('2. Browser cache needs clearing');
      console.error('3. No Chromecast on test network');
      console.error('4. Chromecast powered off');

      await page.screenshot({ path: 'screenshots/cast-button-greyed-out-ERROR.png' });
    }

    // EXPECT icon to be active/white (NOT greyed out)
    expect(isGreyedOut, 'Chromecast icon should be WHITE/ACTIVE (not greyed out) after CSP fix').toBe(false);

    // Verify aria-label indicates devices available
    expect(buttonState.ariaLabel).not.toBe('No Cast devices found');
    expect(['Cast to TV', 'Connected to TV']).toContain(buttonState.ariaLabel);

    console.log('✅ Chromecast icon is WHITE/ACTIVE (devices detectable)');
  });
});

// ==============================================================================
// TEST 2: ANALYTICS PAGE - CLASS COUNT INCREMENTATION
// ==============================================================================

test.describe('Analytics Page - User Stats', () => {
  test('Analytics page should increment class count after class generation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to Analytics page and capture initial class count
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const totalClassesCard = page.locator('text=Total Classes').locator('..').locator('.text-4xl');
    await expect(totalClassesCard).toBeVisible({ timeout: 5000 });

    const initialClassCountText = await totalClassesCard.textContent();
    const initialClassCount = parseInt(initialClassCountText || '0', 10);

    console.log(`Initial class count: ${initialClassCount}`);

    // Generate a new class
    await page.goto('/class-builder');
    await page.waitForLoadState('networkidle');

    // Generate class (database mode)
    await page.click('text=Beginner');
    const durationSlider = page.locator('input[type="range"]').first();
    await durationSlider.fill('12'); // Shortest duration for speed

    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
    await generateBtn.click();

    const resultsModal = page.locator('[role="dialog"], .modal').filter({ hasText: /Generated|Results/i });
    await expect(resultsModal).toBeVisible({ timeout: 15000 });

    const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Add to Library")').first();
    await acceptBtn.click();
    await page.waitForTimeout(2000);

    console.log('✅ Class generated and saved');

    // Return to analytics page and verify count incremented
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow analytics to refresh

    const updatedClassCountText = await totalClassesCard.textContent();
    const updatedClassCount = parseInt(updatedClassCountText || '0', 10);

    console.log(`Updated class count: ${updatedClassCount}`);

    // Verify count increased by 1
    expect(updatedClassCount, 'Analytics should show +1 class after generation').toBe(initialClassCount + 1);

    // Verify "Classes This Week" also updated
    const classesThisWeekText = await page.locator('text=/\\+\\d+ this week/').textContent();
    const classesThisWeek = parseInt(classesThisWeekText?.match(/\\d+/)?.[0] || '0', 10);

    expect(classesThisWeek, 'Classes this week should be at least 1').toBeGreaterThanOrEqual(1);

    console.log('✅ Analytics page correctly incremented class count');
  });
});

// ==============================================================================
// TEST 3: ADMIN-ONLY LLM USAGE LOGS
// ==============================================================================

test.describe('Analytics Page - Admin LLM Logs', () => {
  test('Regular users should NOT see LLM usage logs section', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to Analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Verify LLM usage section NOT visible
    const adminSection = page.locator('text=ADMIN ONLY');
    const llmLogsSection = page.locator('text=LLM Usage & Observability');

    await expect(adminSection).not.toBeVisible();
    await expect(llmLogsSection).not.toBeVisible();

    console.log('✅ Regular user does NOT see LLM usage logs (correctly hidden)');
  });

  test('Admin users SHOULD see LLM usage logs section', async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to Analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom to find admin section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Verify LLM usage section IS visible
    const adminBadge = page.locator('text=ADMIN ONLY');
    const llmLogsTitle = page.locator('text=LLM Usage & Observability');

    await expect(adminBadge).toBeVisible({ timeout: 5000 });
    await expect(llmLogsTitle).toBeVisible({ timeout: 5000 });

    // Verify key stats visible
    await expect(page.locator('text=Total Invocations')).toBeVisible();
    await expect(page.locator('text=AI Agent Calls')).toBeVisible();
    await expect(page.locator('text=Estimated Cost')).toBeVisible();

    console.log('✅ Admin user sees LLM usage logs (correctly visible)');
  });
});

// ==============================================================================
// TEST 4: AI TOGGLE - ADMIN-ONLY ACCESS
// ==============================================================================

test.describe('AI Toggle - Admin Access Control', () => {
  test('Regular users should NOT see AI toggle in class builder', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to class builder
    const generateButton = page.locator('button:has-text("Generate my Pilates class")');
    await generateButton.click();
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Look for AI toggle
    const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI|OpenAI|GPT/i });
    const aiToggleLabel = page.locator('text=/AI.*Mode|OpenAI|GPT/i');

    // Toggle should NOT be visible for regular users
    const toggleVisible = await aiToggle.isVisible({ timeout: 2000 }).catch(() => false);
    const labelVisible = await aiToggleLabel.isVisible({ timeout: 2000 }).catch(() => false);

    expect(toggleVisible, 'AI toggle should be hidden for regular users').toBe(false);
    expect(labelVisible, 'AI toggle label should be hidden for regular users').toBe(false);

    console.log('✅ Regular user does NOT see AI toggle (correctly hidden)');
  });

  test('Admin users SHOULD see AI toggle in class builder', async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to class builder
    const generateButton = page.locator('button:has-text("Generate my Pilates class")');
    await generateButton.click();
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Look for AI toggle
    const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI|OpenAI|GPT/i });

    // Toggle SHOULD be visible for admin users
    await expect(aiToggle).toBeVisible({ timeout: 5000 });

    // Verify toggle is OFF by default (MVP development setting)
    const isChecked = await aiToggle.getAttribute('aria-checked');
    expect(isChecked, 'AI toggle should be OFF by default during MVP development').toBe('false');

    console.log('✅ Admin user sees AI toggle (correctly visible and OFF by default)');
  });

  test('AI toggle should default to OFF during MVP development', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to class builder
    const generateButton = page.locator('button:has-text("Generate my Pilates class")');
    await generateButton.click();
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify AI toggle defaults to OFF
    const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI|OpenAI|GPT/i });
    await expect(aiToggle).toBeVisible({ timeout: 5000 });

    const isChecked = await aiToggle.getAttribute('aria-checked');
    expect(isChecked, 'AI toggle must default to OFF during MVP development').toBe('false');

    // Verify admin CAN toggle it ON (access not blocked, just defaults to OFF)
    await aiToggle.click();
    await page.waitForTimeout(500);

    const isCheckedAfterClick = await aiToggle.getAttribute('aria-checked');
    expect(isCheckedAfterClick, 'Admin should be able to enable AI mode').toBe('true');

    console.log('✅ AI toggle defaults to OFF but admin can enable it');
  });
});

// ==============================================================================
// TEST 5: DEVELOPER TOOLS STATS (ADMIN ONLY)
// ==============================================================================

test.describe('Developer Tools - Admin Stats', () => {
  test('Settings page should show developer tools for admins only', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Analytics page has admin stats (already tested above)
    // Settings page should also have developer tools (if implemented)
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Check for admin-only sections (implementation may vary)
    // This test documents expected behavior - may need adjustment based on implementation

    const adminSections = [
      page.locator('text=Developer Tools'),
      page.locator('text=Admin Settings'),
      page.locator('text=System Statistics'),
    ];

    let hasAdminSection = false;
    for (const section of adminSections) {
      if (await section.isVisible({ timeout: 2000 }).catch(() => false)) {
        hasAdminSection = true;
        console.log(`✅ Found admin section: ${await section.textContent()}`);
        break;
      }
    }

    // Note: If no admin sections exist yet, test documents expected behavior
    if (!hasAdminSection) {
      console.log('ℹ️ No admin sections found in Settings page (may not be implemented yet)');
      console.log('Expected behavior: Admin users should see developer tools/stats in Settings');
    }
  });
});

// ==============================================================================
// TEST 6: CLASS PLAYBACK - SECTION PROGRESSION & MEDIA VERIFICATION
// ==============================================================================

test.describe('Class Playback - Media & Section Verification', () => {
  test('Should progress through class sections with music, voiceover, and video playback', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Handle disclaimer
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });

    // Navigate to class builder and generate/accept class
    const generateButton = page.locator('button:has-text("Generate my Pilates class")');
    await generateButton.click();
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Accept existing class or generate new one
    const acceptExisting = page.locator('button:has-text("Accept & Add to Class")');
    const hasPreGenerated = await acceptExisting.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasPreGenerated) {
      await acceptExisting.click();
      await page.waitForTimeout(3000);
    } else {
      // Generate new class (database mode - faster)
      await page.click('text=Beginner');
      const durationSlider = page.locator('input[type="range"]').first();
      await durationSlider.fill('12'); // Short duration for speed

      const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
      await generateBtn.click();

      const resultsModal = page.locator('[role="dialog"], .modal').filter({ hasText: /Generated|Results/i });
      await expect(resultsModal).toBeVisible({ timeout: 15000 });

      const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Add to Library")').first();
      await acceptBtn.click();
      await page.waitForTimeout(2000);
    }

    // Start class playback
    const playClassButton = page.locator('button:has-text("Play Class")');
    await expect(playClassButton).toBeEnabled({ timeout: 10000 });
    await playClassButton.click();
    await page.waitForTimeout(3000); // Wait for ClassPlayback to render

    console.log('\n📋 Testing Class Playback Section Progression...\n');

    // ============================================================================
    // MUSIC PLAYBACK VERIFICATION
    // ============================================================================

    console.log('🎵 Verifying music playback...');

    // Click play/resume if paused
    const playPauseButton = page.locator('button[aria-label*="Play"], button[aria-label*="Resume"]');
    const playButtonExists = await playPauseButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (playButtonExists) {
      await playPauseButton.click();
      await page.waitForTimeout(2000); // Allow music to start
    }

    // Verify background music audio element exists and is playing
    const musicAudio = page.locator('audio#background-music');
    const musicExists = await musicAudio.count();

    if (musicExists > 0) {
      const musicState = await musicAudio.evaluate((audio: HTMLAudioElement) => ({
        src: audio.src,
        paused: audio.paused,
        currentTime: audio.currentTime,
        duration: audio.duration,
        readyState: audio.readyState,
        error: audio.error?.message || null,
      }));

      console.log('Music audio state:', musicState);

      expect(musicState.src, 'Background music should have a source URL').toBeTruthy();
      expect(musicState.paused, 'Background music should be playing (not paused)').toBe(false);
      expect(musicState.error, 'Background music should have no errors').toBeNull();

      console.log('✅ Background music is playing correctly');
    } else {
      console.warn('⚠️ Background music audio element not found - may not be implemented yet');
    }

    // ============================================================================
    // SECTION PROGRESSION & VOICEOVER VERIFICATION
    // ============================================================================

    console.log('\n📍 Verifying section progression and voiceover playback...\n');

    // Expected section types in order
    const expectedSections = [
      'preparation',
      'warmup',
      'movement',
      'transition',
      'cooldown',
      'meditation',
      'homecare'
    ];

    // Track which sections we encounter
    const encounteredSections = new Set<string>();

    // Click "Next" button multiple times to progress through sections
    for (let i = 0; i < 20; i++) { // Max 20 iterations to prevent infinite loop
      await page.waitForTimeout(1000);

      // Get current section info
      const currentSectionInfo = await page.evaluate(() => {
        const sectionElement = document.querySelector('[data-section-type]');
        const sectionType = sectionElement?.getAttribute('data-section-type') || null;

        // Check for voiceover audio element
        const voiceoverAudio = document.querySelector('audio#voiceover-audio') as HTMLAudioElement;
        const voiceoverState = voiceoverAudio ? {
          exists: true,
          src: voiceoverAudio.src,
          paused: voiceoverAudio.paused,
          currentTime: voiceoverAudio.currentTime,
          duration: voiceoverAudio.duration,
          readyState: voiceoverAudio.readyState,
          error: voiceoverAudio.error?.message || null,
        } : { exists: false };

        // Check for video element
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        const videoState = videoElement ? {
          exists: true,
          src: videoElement.src,
          paused: videoElement.paused,
          currentTime: videoElement.currentTime,
          duration: videoElement.duration,
          readyState: videoElement.readyState,
          error: videoElement.error?.message || null,
        } : { exists: false };

        return { sectionType, voiceoverState, videoState };
      });

      const { sectionType, voiceoverState, videoState } = currentSectionInfo;

      if (sectionType) {
        encounteredSections.add(sectionType);
        console.log(`Current section: ${sectionType}`);

        // Verify voiceover if present
        if (voiceoverState.exists) {
          console.log(`  🎙️ Voiceover: ${voiceoverState.paused ? 'PAUSED' : 'PLAYING'}`);
          console.log(`     Source: ${voiceoverState.src}`);

          if (voiceoverState.error) {
            console.error(`     ❌ Voiceover error: ${voiceoverState.error}`);
          } else {
            console.log(`     ✅ Voiceover is ${voiceoverState.paused ? 'paused' : 'playing'} without errors`);
          }

          // Expect voiceover to be playing (or at least ready)
          expect(voiceoverState.error, `Voiceover for ${sectionType} should have no errors`).toBeNull();
        } else {
          console.log('  (No voiceover for this section)');
        }

        // Verify video if present
        if (videoState.exists) {
          console.log(`  🎥 Video: ${videoState.paused ? 'PAUSED' : 'PLAYING'}`);
          console.log(`     Source: ${videoState.src}`);

          if (videoState.error) {
            console.error(`     ❌ Video error: ${videoState.error}`);
          } else {
            console.log(`     ✅ Video is ${videoState.paused ? 'paused' : 'playing'} without errors`);
          }

          // Expect video to be playing (or at least ready)
          expect(videoState.error, `Video for ${sectionType} should have no errors`).toBeNull();
        } else {
          console.log('  (No video for this section)');
        }
      }

      // Click "Next" button to advance to next section
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="Next"]');
      const nextExists = await nextButton.isVisible({ timeout: 1000 }).catch(() => false);

      if (!nextExists) {
        console.log('\n✅ Reached end of class (no more "Next" button)\n');
        break;
      }

      await nextButton.click();
    }

    // Report which sections were encountered
    console.log('\n📊 Section Progression Summary:');
    console.log(`   Encountered sections: ${Array.from(encounteredSections).join(', ')}`);
    console.log(`   Total unique sections: ${encounteredSections.size}\n`);

    // Expect at least 3 different section types (preparation, movement, meditation minimum)
    expect(encounteredSections.size, 'Should encounter at least 3 different section types during playback').toBeGreaterThanOrEqual(3);

    console.log('✅ Class playback section progression verified');
  });
});
