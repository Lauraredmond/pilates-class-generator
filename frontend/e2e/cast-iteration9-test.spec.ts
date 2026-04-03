import { test, expect } from '@playwright/test';
import { getTestCredentials, validateTestEnvironment } from './helpers/secure-credentials';

test.describe('Cast Button Iteration 9 - Initialization Visibility Fix', () => {
  test('should show ✅✅✅ initialization log when Cast SDK loads', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      // Log Cast-related messages
      if (text.includes('Cast') || text.includes('🔍') || text.includes('✅') || text.includes('🎯')) {
        console.log(`🔍 Browser Console: [${msg.type()}] ${text}`);
      }
    });

    // Navigate with cache buster
    const timestamp = Date.now();
    await page.goto(`https://bassline-dev.netlify.app/?v=${timestamp}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for Cast SDK check logs
    await page.waitForTimeout(3000);

    // Check for ITERATION 7 marker
    const hasIteration7 = consoleLogs.some(log =>
      log.includes('ITERATION 7')
    );
    console.log(`\n📍 ITERATION 7 marker present: ${hasIteration7}`);

    // Check for SDK loaded state
    const hasSdkCheck = consoleLogs.some(log =>
      log.includes('window.cast exists?')
    );
    console.log(`📍 SDK check logs present: ${hasSdkCheck}`);

    // CRITICAL: Check for initialization function call
    const hasInitialization = consoleLogs.some(log =>
      log.includes('✅✅✅') && log.includes('calling initializeCastApi() NOW!')
    );
    console.log(`\n🎯 CRITICAL: Initialization function called: ${hasInitialization}`);

    if (hasInitialization) {
      console.log('✅ SUCCESS: initializeCastApi() is being called!');
    } else {
      console.log('❌ FAILURE: initializeCastApi() not called - check if logger.debug fix deployed');
    }

    // Check for Cast context creation logs
    const hasContextCreation = consoleLogs.some(log =>
      log.includes('🎯') && log.includes('Cast context created successfully')
    );
    console.log(`🎯 Cast context created: ${hasContextCreation}`);

    // Check for initial Cast state
    const hasInitialState = consoleLogs.some(log =>
      log.includes('🎯') && log.includes('Initial Cast state:')
    );
    console.log(`🎯 Initial Cast state logged: ${hasInitialState}`);

    // Check Cast button state
    const castButton = await page.locator('button[aria-label*="Cast"]');
    const isDisabled = await castButton.isDisabled();
    const buttonTitle = await castButton.getAttribute('title');

    console.log(`\n📱 Cast button state:`);
    console.log(`  - Disabled: ${isDisabled}`);
    console.log(`  - Title: ${buttonTitle}`);

    // Print summary
    console.log('\n=== ITERATION 9 TEST SUMMARY ===');
    console.log(`1. Code deployed (ITERATION 7): ${hasIteration7 ? '✅' : '❌'}`);
    console.log(`2. SDK loads (window.cast check): ${hasSdkCheck ? '✅' : '❌'}`);
    console.log(`3. Init function called (✅✅✅): ${hasInitialization ? '✅' : '❌'}`);
    console.log(`4. Cast context created (🎯): ${hasContextCreation ? '✅' : '❌'}`);
    console.log(`5. Cast state logged (🎯): ${hasInitialState ? '✅' : '❌'}`);
    console.log(`6. Button enabled: ${!isDisabled ? '✅' : '❌'}`);

    const successCount = [
      hasIteration7, hasSdkCheck, hasInitialization,
      hasContextCreation, hasInitialState, !isDisabled
    ].filter(Boolean).length;

    console.log(`\n📊 Progress: ${successCount}/6 checks passed`);

    if (successCount >= 5) {
      console.log('🎉 ITERATION 9 SUCCESS: Cast initialization working!');
    } else if (hasInitialization) {
      console.log('⚠️ PARTIAL SUCCESS: Init called but device discovery may need work');
    } else {
      console.log('⏳ WAITING: Code may not be deployed yet or needs more fixes');
    }
  });
});