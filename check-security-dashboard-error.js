/**
 * Check Security Dashboard - Capture full error details
 */

const puppeteer = require('puppeteer');

async function checkError() {
  console.log('🔍 Checking SecurityDashboard error...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Capture ALL console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      console.log(`[${msg.type()}]`, text);
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('❌ PAGE ERROR:', error.message);
      console.error('Stack:', error.stack);
    });

    // Login
    console.log('1️⃣  Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input#email');
    await page.type('input#email', 'owner@demo.clubflow.com');
    await page.type('input#password', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   ✅ Logged in\n');

    // Navigate to security
    console.log('2️⃣  Navigating to /security...');
    await page.goto('http://localhost:3000/security', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Print all console messages
    console.log('\n' + '='.repeat(60));
    console.log('BROWSER CONSOLE MESSAGES');
    console.log('='.repeat(60));
    consoleMessages.filter(m => m.type === 'error' || m.text.includes('Error') || m.text.includes('error'))
      .forEach(m => {
        console.log(`\n[${m.type.toUpperCase()}]`, m.text);
      });
    console.log('='.repeat(60));

    // Keep browser open
    console.log('\n👀 Browser open. Press Ctrl+C to close.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

checkError();
