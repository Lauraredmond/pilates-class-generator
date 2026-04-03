import { test, expect } from '@playwright/test';
import { getTestCredentials, validateTestEnvironment } from './helpers/secure-credentials';

test.describe('Force Fresh Load Test', () => {
  test('bypass all caches and check Cast logs', async ({ page, context }) => {
    // Clear all cookies and storage
    await context.clearCookies();
    await page.goto('about:blank');

    // Disable cache completely for this test
    await page.route('**/*', route => {
      const headers = route.request().headers();
      delete headers['if-none-match'];
      delete headers['if-modified-since'];
      route.continue({ headers });
    });

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('Cast') || text.includes('🔍') || text.includes('🎯') || text.includes('ITERATION')) {
        console.log(`📋 ${text}`);
      }
    });

    // Force completely fresh load with timestamp
    const timestamp = Date.now();
    await page.goto(`https://bassline-dev.netlify.app/?cachebust=${timestamp}&force=true&v=${timestamp}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Navigate to class playback to trigger CastButton mount
    await page.click('[data-testid="browse-classes-button"], a[href="/classes"], button:has-text("Classes")', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(3000);

    console.log('\n=== CHECKING ALL CONSOLE LOGS ===');

    // Look for ANY Cast-related logs
    const castLogs = consoleLogs.filter(log =>
      log.includes('Cast') ||
      log.includes('🔍') ||
      log.includes('🎯') ||
      log.includes('ITERATION')
    );

    if (castLogs.length === 0) {
      console.log('❌ NO Cast logs found at all!');
      console.log('\nAll logs:', consoleLogs.slice(0, 20));
    } else {
      console.log(`Found ${castLogs.length} Cast-related logs:`);
      castLogs.forEach(log => console.log(`  - ${log}`));
    }

    // Check what JavaScript file is loaded
    const scripts = await page.locator('script[src*="index-"]').all();
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      console.log(`\n📦 JavaScript loaded: ${src}`);
    }

    // Try to directly check window.cast
    const castExists = await page.evaluate(() => {
      return !!(window as any).cast;
    });
    console.log(`\n🌐 window.cast exists: ${castExists}`);

    // Check for Cast button in DOM
    const castButtonCount = await page.locator('button[aria-label*="Cast"], button[title*="Cast"], svg.lucide-cast').count();
    console.log(`🎯 Cast button elements found: ${castButtonCount}`);

    if (castButtonCount > 0) {
      const button = page.locator('button[aria-label*="Cast"], button[title*="Cast"]').first();
      const isDisabled = await button.isDisabled();
      console.log(`  Button disabled: ${isDisabled}`);
    }

    console.log('\n=== END FORCE FRESH TEST ===');
  });
});