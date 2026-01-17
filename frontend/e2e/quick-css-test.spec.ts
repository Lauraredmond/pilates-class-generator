import { test, expect } from '@playwright/test';

test.describe('Quick CSS Check', () => {
  test('Check if responsive classes are applied', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to dev site
    await page.goto('https://bassline-dev.netlify.app');
    await page.waitForLoadState('networkidle');

    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('**/classes', { timeout: 10000 });

    // Navigate to a class playback
    const classCards = page.locator('.cursor-pointer');
    const count = await classCards.count();
    if (count > 0) {
      await classCards.first().click();
      await page.waitForSelector('[data-testid="movement-display"]', { timeout: 10000 });
      
      // Check video container if it exists
      const videoContainer = page.locator('.relative.w-full.mt-4.z-10').first();
      if (await videoContainer.count() > 0) {
        const computedStyle = await videoContainer.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            position: style.position,
            width: style.width,
            marginTop: style.marginTop,
            zIndex: style.zIndex,
            classes: el.className
          };
        });
        console.log('Mobile viewport CSS:', computedStyle);
      }
    }
  });
});
