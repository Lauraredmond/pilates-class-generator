import { chromium } from 'playwright';

async function testVideoFadeOut() {
  console.log('🎭 Starting simplified fade out test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Collect console messages with fade-related info
  const fadeMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('fade') || text.includes('opacity') || text.includes('ended') ||
        text.includes('fullscreen') || text.includes('Forced video opacity')) {
      console.log(`📝 Console: ${text}`);
      fadeMessages.push(text);
    }
  });

  try {
    console.log('1️⃣ Going directly to class builder...');
    await page.goto('https://bassline-dev.netlify.app/class-builder', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Try different selectors for the AI Generation tab
    console.log('2️⃣ Looking for AI Generation tab...');
    const aiTab = await page.$('text="AI Generation"') ||
                  await page.$('button:has-text("AI Generation")') ||
                  await page.$('div:has-text("AI Generation")');

    if (aiTab) {
      await aiTab.click();
      console.log('✅ Clicked AI Generation tab');
    } else {
      console.log('⚠️ Could not find AI Generation tab, continuing anyway...');
    }

    await page.waitForTimeout(1000);

    // Look for duration selector
    console.log('3️⃣ Setting class duration...');
    const durationSelector = await page.$('select[name="duration"]') ||
                            await page.$('select#duration');
    if (durationSelector) {
      await durationSelector.selectOption('12');
      console.log('✅ Selected 12-minute duration');
    }

    // Look for difficulty selector
    const difficultySelector = await page.$('select[name="difficulty"]') ||
                               await page.$('select#difficulty');
    if (difficultySelector) {
      await difficultySelector.selectOption('Beginner');
      console.log('✅ Selected Beginner difficulty');
    }

    // Find and click generate button
    console.log('4️⃣ Generating class...');
    const generateBtn = await page.$('button:has-text("Generate Class")') ||
                       await page.$('button:has-text("Generate")');
    if (generateBtn) {
      await generateBtn.click();
      console.log('⏳ Waiting for class generation (up to 90 seconds)...');

      // Wait for class to generate
      await page.waitForSelector('text="Generated Class"', { timeout: 90000 }).catch(() => {
        console.log('⚠️ Generated Class text not found, looking for Start Class button...');
      });
    }

    // Look for Start Class button
    const startBtn = await page.$('button:has-text("Start Class")') ||
                    await page.$('button:has-text("Start")');
    if (startBtn) {
      console.log('5️⃣ Starting class playback...');
      await startBtn.click();
      await page.waitForTimeout(3000);

      // Now monitor for fade out behavior
      console.log('6️⃣ Monitoring video elements for 60 seconds...\n');

      let fadeDetected = false;
      const startTime = Date.now();

      while (Date.now() - startTime < 60000) { // Monitor for 60 seconds
        // Check all video elements
        const videoInfo = await page.evaluate(() => {
          const videos = document.querySelectorAll('video');
          return Array.from(videos).map(video => ({
            src: video.src?.substring(video.src.lastIndexOf('/') + 1, video.src.lastIndexOf('/') + 30),
            opacity: window.getComputedStyle(video).opacity,
            transition: window.getComputedStyle(video).transition,
            ended: video.ended,
            currentTime: Math.round(video.currentTime),
            duration: Math.round(video.duration),
            display: window.getComputedStyle(video).display
          }));
        });

        for (const video of videoInfo) {
          if (video.src && !video.src.includes('blob')) {
            console.log(`📹 Video: ${video.src}...`);
            console.log(`   Opacity: ${video.opacity}, Time: ${video.currentTime}/${video.duration}s`);
            console.log(`   Ended: ${video.ended}, Transition: ${video.transition}`);

            // Check if fade out is happening
            if (video.opacity !== '1' && video.opacity !== '0') {
              fadeDetected = true;
              console.log('✨ FADE DETECTED! Opacity is transitioning!');
            }

            if (video.ended && video.opacity === '0') {
              fadeDetected = true;
              console.log('✨ FADE COMPLETE! Video ended with opacity 0');
            }
          }
        }

        await page.waitForTimeout(3000); // Check every 3 seconds
      }

      console.log('\n7️⃣ Test Summary:');
      console.log(`Fade detected: ${fadeDetected ? '✅ YES' : '❌ NO'}`);
      console.log(`\nFade-related console messages (${fadeMessages.length} found):`);
      fadeMessages.forEach(msg => console.log(`  - ${msg}`));

      // Check MovementDisplay component
      console.log('\n8️⃣ Checking MovementDisplay component code...');
      const hasHandleVideoEnded = await page.evaluate(() => {
        // Check if handleVideoEnded function exists in the page context
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.some(script =>
          script.textContent?.includes('handleVideoEnded') ||
          script.textContent?.includes('setVideoEnded')
        );
      });
      console.log(`handleVideoEnded in page: ${hasHandleVideoEnded ? 'Found' : 'Not directly visible'}`);

    } else {
      console.log('❌ Could not find Start Class button');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    console.log('\n🎭 Keeping browser open for manual inspection...');
    await page.waitForTimeout(30000); // Keep open for 30 seconds
    await browser.close();
  }
}

testVideoFadeOut().catch(console.error);