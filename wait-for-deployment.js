// Wait for Vercel deployment to complete by checking the JS bundle hash
const { chromium } = require('playwright');

const OLD_BUNDLE = 'index-DW1OuuAf.js'; // Old bundle from error message
const CHECK_INTERVAL = 15000; // Check every 15 seconds
const MAX_ATTEMPTS = 20; // Give up after 5 minutes

(async () => {
  console.log('⏳ Waiting for Vercel deployment to complete...\n');
  console.log(`🔍 Looking for new bundle (not ${OLD_BUNDLE})`);
  console.log(`⏱️  Checking every ${CHECK_INTERVAL/1000} seconds\n`);

  const browser = await chromium.launch({ headless: true });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log(`[Attempt ${attempt}/${MAX_ATTEMPTS}] Checking deployment...`);

      await page.goto('https://clubops-saas-frontend.vercel.app/login', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Get the HTML to check for bundle name
      const html = await page.content();

      // Extract bundle name from script tags
      const bundleMatch = html.match(/\/assets\/index-([a-zA-Z0-9]+)\.js/);
      const currentBundle = bundleMatch ? `index-${bundleMatch[1]}.js` : 'unknown';

      console.log(`  📦 Current bundle: ${currentBundle}`);

      if (currentBundle !== OLD_BUNDLE && currentBundle !== 'unknown') {
        console.log('\n✅ NEW DEPLOYMENT DETECTED!');
        console.log(`✨ Bundle changed from ${OLD_BUNDLE} to ${currentBundle}`);
        console.log('\n🎉 Vercel deployment is complete and live!\n');
        await browser.close();
        process.exit(0);
      }

      if (attempt < MAX_ATTEMPTS) {
        console.log(`  ⏳ Still old bundle, waiting ${CHECK_INTERVAL/1000}s...\n`);
      }

    } catch (error) {
      console.log(`  ⚠️  Check failed: ${error.message}`);
    } finally {
      await context.close();
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  console.log('\n⚠️  Deployment check timed out after 5 minutes');
  console.log('The deployment might still be in progress or there was an issue.');
  console.log('You can check manually at: https://vercel.com/dashboard\n');

  await browser.close();
  process.exit(1);
})();
