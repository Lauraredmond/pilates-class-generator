import { test, expect } from '@playwright/test';

test.describe('🚨 ITERATION 10 - FINAL ATTEMPT - Chromecast Fix', () => {
  test('should initialize Cast SDK with all logger calls replaced', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture ALL console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      // Log important messages
      if (text.includes('Cast') || text.includes('🔍') || text.includes('✅') ||
          text.includes('🎯') || text.includes('📡') || text.includes('❌')) {
        console.log(`📋 Console: [${msg.type()}] ${text}`);
      }
    });

    console.log('\n=== ITERATION 10 FINAL TEST STARTING ===');
    console.log('This is attempt 10 of 10 - final chance to fix Chromecast\n');

    // Navigate with aggressive cache buster
    const timestamp = Date.now();
    await page.goto(`https://bassline-dev.netlify.app/?cachebust=${timestamp}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for potential SDK loading
    await page.waitForTimeout(5000);

    console.log('\n📊 CHECKING CRITICAL MARKERS:');

    // 1. Check for ITERATION 10 marker
    const hasIteration10 = consoleLogs.some(log =>
      log.includes('ITERATION 10')
    );
    console.log(`1. ITERATION 10 marker: ${hasIteration10 ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 2. Check for initialization attempt
    const hasInitAttempt = consoleLogs.some(log =>
      log.includes('🎯🎯🎯') && log.includes('Attempting to initialize')
    );
    console.log(`2. Init attempt (🎯🎯🎯): ${hasInitAttempt ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 3. Check for SDK fully loaded message
    const hasSdkLoaded = consoleLogs.some(log =>
      log.includes('✅✅✅') && log.includes('calling initializeCastApi() NOW')
    );
    console.log(`3. SDK loaded (✅✅✅): ${hasSdkLoaded ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 4. Check for context creation
    const hasContextCreated = consoleLogs.some(log =>
      log.includes('🎯') && log.includes('Cast context created successfully')
    );
    console.log(`4. Context created: ${hasContextCreated ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 5. Check for initial state log
    const hasInitialState = consoleLogs.some(log =>
      log.includes('🎯') && log.includes('Initial Cast state:')
    );
    console.log(`5. Initial state logged: ${hasInitialState ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 6. Check for device availability logs
    const hasDeviceStatus = consoleLogs.some(log =>
      log.includes('📡 Chromecast device(s) available') ||
      log.includes('❌ No Chromecast devices found')
    );
    console.log(`6. Device status: ${hasDeviceStatus ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 7. Check callback fired
    const hasCallback = consoleLogs.some(log =>
      log.includes('__onGCastApiAvailable callback fired')
    );
    console.log(`7. Callback fired: ${hasCallback ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 8. Check polling
    const hasPolling = consoleLogs.some(log =>
      log.includes('Polling attempt')
    );
    console.log(`8. Polling attempts: ${hasPolling ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // Check button state
    const castButton = await page.locator('button[aria-label*="Cast"]');
    const exists = await castButton.count() > 0;

    if (exists) {
      const isDisabled = await castButton.isDisabled();
      const buttonTitle = await castButton.getAttribute('title');

      console.log(`\n🎯 CAST BUTTON STATE:`);
      console.log(`  - Exists: ✅`);
      console.log(`  - Disabled: ${isDisabled ? '❌ YES (grey)' : '✅ NO (active)'}`);
      console.log(`  - Title: "${buttonTitle}"`);

      // Visual check
      const buttonClasses = await castButton.getAttribute('class');
      const isGrey = buttonClasses?.includes('cursor-not-allowed');
      console.log(`  - Visual state: ${isGrey ? '❌ GREY (not clickable)' : '✅ ACTIVE (clickable)'}`);
    } else {
      console.log('\n❌ CAST BUTTON NOT FOUND!');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('ITERATION 10 FINAL RESULTS:');
    console.log('='.repeat(60));

    const criticalChecks = [
      hasIteration10,
      hasInitAttempt || hasSdkLoaded,
      hasContextCreated,
      hasDeviceStatus
    ];

    const passedCount = criticalChecks.filter(Boolean).length;

    if (passedCount === 4) {
      console.log('🎉🎉🎉 SUCCESS: All critical checks passed!');
      console.log('Cast SDK initialization is working correctly.');
      console.log('If button is still grey, it may be a network/device discovery issue.');
    } else if (passedCount >= 2) {
      console.log('⚠️ PARTIAL SUCCESS: Some initialization occurred');
      console.log(`${passedCount}/4 critical checks passed`);
      console.log('Check device discovery or network issues');
    } else {
      console.log('❌ FAILURE: Initialization still not working');
      console.log('The fix may not be deployed yet or there is a deeper issue');
    }

    console.log('\n💡 NEXT STEPS:');
    if (!hasIteration10) {
      console.log('- Wait for deployment (code not updated yet)');
    } else if (!hasInitAttempt) {
      console.log('- Initialization function still not executing');
      console.log('- May need to check if Cast SDK script is actually loading');
    } else if (!hasDeviceStatus) {
      console.log('- SDK initializes but no device discovery');
      console.log('- Check network, firewall, or mDNS issues');
    } else {
      console.log('- Check if Chromecast is on same network');
      console.log('- Verify no firewall blocking mDNS (port 5353)');
    }

    console.log('\n=== END OF ITERATION 10 (FINAL) ===\n');
  });
});