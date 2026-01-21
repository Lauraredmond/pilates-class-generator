import { chromium } from 'playwright';

async function testVideoFadeOut() {
  console.log('🎭 Starting Playwright test for video fade out functionality...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for visual verification
    slowMo: 100 // Slow down actions to observe behavior
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Collect console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('fade') || text.includes('opacity') || text.includes('fullscreen') || text.includes('DEBUG')) {
      console.log(`📝 Console: ${text}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to dev site...');
    await page.goto('https://bassline-dev.netlify.app', { waitUntil: 'networkidle' });

    console.log('2️⃣ Navigating to Class Builder...');
    await page.click('a[href="/class-builder"]');
    await page.waitForSelector('text="AI Generation"', { timeout: 10000 });

    console.log('3️⃣ Configuring class settings...');
    // Click AI Generation tab
    await page.click('text="AI Generation"');
    await page.waitForTimeout(500);

    // Select 12-minute duration for faster testing
    await page.selectOption('select[name="duration"]', '12');

    // Select beginner difficulty
    await page.selectOption('select[name="difficulty"]', 'Beginner');

    console.log('4️⃣ Generating class (this may take 30-60 seconds)...');
    await page.click('button:has-text("Generate Class")');

    // Wait for generation to complete
    await page.waitForSelector('text="Generated Class"', { timeout: 90000 });
    console.log('✅ Class generated successfully!\n');

    console.log('5️⃣ Starting class playback...');
    await page.click('button:has-text("Start Class")');

    // Wait for playback to start
    await page.waitForSelector('.text-6xl', { timeout: 10000 });
    console.log('✅ Playback started!\n');

    console.log('6️⃣ Monitoring video elements for fade out behavior...\n');

    // Function to check video opacity
    async function checkVideoState() {
      const videos = await page.$$('video');
      for (let i = 0; i < videos.length; i++) {
        const videoInfo = await videos[i].evaluate(video => {
          return {
            src: video.src,
            opacity: window.getComputedStyle(video).opacity,
            display: window.getComputedStyle(video).display,
            ended: video.ended,
            currentTime: video.currentTime,
            duration: video.duration,
            paused: video.paused,
            isFullscreen: !!(document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.mozFullScreenElement ||
                            document.msFullscreenElement)
          };
        });

        if (videoInfo.src && !videoInfo.src.includes('blob:')) {
          const filename = videoInfo.src.split('/').pop().substring(0, 30);
          console.log(`📹 Video ${i + 1}: ${filename}...`);
          console.log(`   Opacity: ${videoInfo.opacity}, Time: ${videoInfo.currentTime.toFixed(1)}/${videoInfo.duration.toFixed(1)}s`);
          console.log(`   Ended: ${videoInfo.ended}, Paused: ${videoInfo.paused}, Fullscreen: ${videoInfo.isFullscreen}`);
        }
      }
    }

    // Monitor for 2 minutes, checking every 5 seconds
    const startTime = Date.now();
    const testDuration = 120000; // 2 minutes
    let lastSectionText = '';

    console.log('⏰ Monitoring for 2 minutes...\n');

    while (Date.now() - startTime < testDuration) {
      // Check current section
      const sectionText = await page.$eval('.text-6xl', el => el.textContent).catch(() => 'No section');

      if (sectionText !== lastSectionText) {
        console.log(`\n🔄 SECTION CHANGED: ${sectionText}\n`);
        lastSectionText = sectionText;
      }

      await checkVideoState();

      // Check for fade-out related console logs
      const fadeRelatedLogs = consoleLogs.filter(log =>
        log.includes('fade') ||
        log.includes('opacity') ||
        log.includes('ended') ||
        log.includes('DEBUG: Video')
      );

      if (fadeRelatedLogs.length > 0) {
        console.log('\n🔍 Recent fade-related logs:');
        fadeRelatedLogs.slice(-5).forEach(log => console.log(`   ${log}`));
        consoleLogs.length = 0; // Clear after displaying
      }

      await page.waitForTimeout(5000); // Wait 5 seconds before next check
    }

    console.log('\n7️⃣ Test Summary:\n');
    console.log('📊 Fade out behavior analysis:');

    // Final check for video states
    await checkVideoState();

    // Check if fade-out CSS is present
    const fadeOutCSSPresent = await page.evaluate(() => {
      const videos = document.querySelectorAll('video');
      let hasFadeTransition = false;
      videos.forEach(video => {
        const styles = window.getComputedStyle(video);
        if (styles.transition.includes('opacity')) {
          hasFadeTransition = true;
        }
      });
      return hasFadeTransition;
    });

    console.log(`\n✅ Fade transition CSS present: ${fadeOutCSSPresent}`);

    // Look for specific fade-out code in the page
    const hasVideoEndedHandler = await page.evaluate(() => {
      return window.hasOwnProperty('handleVideoEnded') ||
             document.querySelector('[onended]') !== null;
    });

    console.log(`✅ Video ended handler present: ${hasVideoEndedHandler || 'Check via onEnded attribute'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🎭 Test complete. Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testVideoFadeOut().catch(console.error);