#!/usr/bin/env node

/**
 * Purge Vercel Cache
 *
 * This script makes a request with cache-busting headers to force Vercel
 * to bypass its edge cache and get fresh responses from the backend.
 *
 * Run this after deploying backend fixes to ensure the cache is cleared.
 */

const https = require('https');

const BACKEND_URL = 'clubops-backend.vercel.app';
const PATHS_TO_PURGE = [
  '/api/auth/login',
  '/api/auth/register',
  '/health'
];

console.log('🧹 Purging Vercel Cache...\n');

function purgeCache(path) {
  return new Promise((resolve, reject) => {
    console.log(`  Purging: ${path}`);

    // Make OPTIONS request with cache-busting headers
    const options = {
      hostname: BACKEND_URL,
      path: path,
      method: 'OPTIONS',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Vercel-No-Cache': '1',
        'Origin': 'https://www.clubflowapp.com'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`    ✓ Status: ${res.statusCode}`);

      res.on('data', () => {}); // Consume response data
      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          console.log(`    ✓ Cache purged successfully\n`);
          resolve();
        } else {
          console.log(`    ⚠ Unexpected status: ${res.statusCode}\n`);
          resolve(); // Don't fail, just warn
        }
      });
    });

    req.on('error', (error) => {
      console.log(`    ✗ Error: ${error.message}\n`);
      reject(error);
    });

    req.end();
  });
}

async function purgeAll() {
  for (const path of PATHS_TO_PURGE) {
    try {
      await purgeCache(path);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between requests
    } catch (error) {
      console.error(`Failed to purge ${path}:`, error.message);
    }
  }

  console.log('✅ Cache purge complete!\n');
  console.log('💡 Wait 10-30 seconds for changes to propagate globally.');
  console.log('💡 Then try logging in again at https://www.clubflowapp.com/login\n');
}

purgeAll().catch(console.error);
