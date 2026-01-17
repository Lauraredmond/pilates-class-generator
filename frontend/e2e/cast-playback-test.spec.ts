import { test, expect } from '@playwright/test';

test.describe('Cast Button in Class Playback', () => {
  test('navigate to class playback and check Cast button', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('Cast') || text.includes('🔍') || text.includes('🎯') || text.includes('ITERATION')) {
        console.log(`🔍 Console: ${text}`);
      }
    });

    console.log('1️⃣ Navigating to homepage...');
    const timestamp = Date.now();
    await page.goto(`https://bassline-dev.netlify.app/?v=${timestamp}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('2️⃣ Going to Classes page...');
    // Try different selectors for Classes link
    await page.click('a[href="/classes"], button:has-text("Classes"), nav >> text=Classes').catch(async () => {
      // If direct click fails, navigate directly
      await page.goto(`https://bassline-dev.netlify.app/classes?v=${timestamp}`);
    });

    await page.waitForTimeout(2000);

    console.log('3️⃣ Starting a class playback...');
    // Click on first available class or "Play" button
    const playButton = page.locator('button:has-text("Play"), button:has-text("Start"), button:has-text("Begin"), [data-testid*="play"]').first();
    const hasPlayButton = await playButton.count() > 0;

    if (hasPlayButton) {
      await playButton.click();
      console.log('   ✅ Clicked play button');
    } else {
      // Try clicking first class card
      const classCard = page.locator('[data-testid*="class"], .class-card, div:has-text("minute")').first();
      if (await classCard.count() > 0) {
        await classCard.click();
        console.log('   ✅ Clicked class card');
      } else {
        console.log('   ❌ No play button or class card found');
      }
    }

    await page.waitForTimeout(3000);

    console.log('\n4️⃣ CHECKING FOR CAST BUTTON IN PLAYBACK VIEW...\n');

    // Check for Cast-related logs
    const castLogs = consoleLogs.filter(log =>
      log.includes('Cast') ||
      log.includes('🔍') ||
      log.includes('🎯') ||
      log.includes('ITERATION')
    );

    if (castLogs.length > 0) {
      console.log(`✅ Found ${castLogs.length} Cast logs:`);
      castLogs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('❌ No Cast logs found');
    }

    // Check for ITERATION markers
    const hasIteration10 = consoleLogs.some(log => log.includes('ITERATION 10'));
    const hasIteration7 = consoleLogs.some(log => log.includes('ITERATION 7'));

    if (hasIteration10) {
      console.log('\n🎉 ITERATION 10 FOUND! Code is deployed!');
    } else if (hasIteration7) {
      console.log('\n⚠️ Still showing ITERATION 7 (old code)');
    } else {
      console.log('\n❌ No iteration markers found');
    }

    // Check for initialization logs
    const hasInit = consoleLogs.some(log => log.includes('🎯🎯🎯') && log.includes('Attempting'));
    if (hasInit) {
      console.log('✅ Initialization attempted!');
    }

    // Look for Cast button in DOM
    const castButton = await page.locator('button[aria-label*="Cast"], button[title*="Cast"], button:has(svg.lucide-cast)').count();
    console.log(`\n📱 Cast button in DOM: ${castButton > 0 ? '✅ YES' : '❌ NO'}`);

    if (castButton > 0) {
      const button = page.locator('button[aria-label*="Cast"], button[title*="Cast"]').first();
      const isDisabled = await button.isDisabled();
      const title = await button.getAttribute('title');
      console.log(`   - Disabled: ${isDisabled ? 'YES (grey)' : 'NO (active)'}`);
      console.log(`   - Title: "${title}"`);
    }

    // Check current URL to confirm we're in playback
    const currentUrl = page.url();
    console.log(`\n📍 Current page: ${currentUrl}`);
    const inPlayback = currentUrl.includes('playback') || currentUrl.includes('play') || currentUrl.includes('class');
    console.log(`   In class area: ${inPlayback ? 'YES' : 'NO'}`);

    console.log('\n=== END PLAYBACK TEST ===');
  });
});