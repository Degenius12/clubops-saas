/**
 * Push Notifications Test Script
 * Test all aspects of the push notification system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Push Notifications Test Suite');
console.log('='.repeat(50));

// Test configuration
const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
const testUser = {
  email: 'test@clubflow.com',
  password: 'testpassword123'
};

let authToken = null;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Request failed for ${url}:`, error.message);
    throw error;
  }
}

async function testBackendConnection() {
  console.log('\n📡 Testing Backend Connection...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running:', response);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    
    if (response.token) {
      authToken = response.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.error('❌ No token received in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

async function testVapidKey() {
  console.log('\n🔑 Testing VAPID Key Retrieval...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/vapid-public-key`);
    
    if (response.publicKey) {
      console.log('✅ VAPID public key retrieved:', response.publicKey.substring(0, 20) + '...');
      return response.publicKey;
    } else {
      console.error('❌ No VAPID public key in response');
      return null;
    }
  } catch (error) {
    console.error('❌ VAPID key retrieval failed:', error.message);
    return null;
  }
}

async function testNotificationSubscription() {
  console.log('\n📱 Testing Notification Subscription...');
  try {
    const subscriptionData = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-' + Date.now(),
      keys: {
        p256dh: 'BTestP256dhKeyForTesting' + Math.random().toString(36).substring(7),
        auth: 'TestAuthKeyForTesting' + Math.random().toString(36).substring(7)
      },
      preferences: {
        shiftUpdates: true,
        swapRequests: true,
        emergencyAlerts: true,
        generalUpdates: false
      },
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        deviceType: 'desktop',
        browserName: 'Test',
        browserVersion: '1.0'
      }
    };

    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/subscribe`, {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });

    console.log('✅ Subscription successful:', response.message);
    return response.subscription;
  } catch (error) {
    console.error('❌ Subscription failed:', error.message);
    return null;
  }
}

async function testGetSubscriptions() {
  console.log('\n📋 Testing Get Subscriptions...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/subscriptions`);
    
    if (Array.isArray(response)) {
      console.log(`✅ Retrieved ${response.length} subscription(s)`);
      response.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.deviceType} - ${sub.browserName} (${sub.enabled ? 'enabled' : 'disabled'})`);
      });
      return response;
    } else {
      console.error('❌ Invalid subscriptions response format');
      return [];
    }
  } catch (error) {
    console.error('❌ Get subscriptions failed:', error.message);
    return [];
  }
}

async function testUpdatePreferences() {
  console.log('\n⚙️ Testing Update Preferences...');
  try {
    const newPreferences = {
      shiftUpdates: false,
      swapRequests: true,
      emergencyAlerts: true,
      generalUpdates: true
    };

    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/preferences`, {
      method: 'PUT',
      body: JSON.stringify({ preferences: newPreferences })
    });

    console.log('✅ Preferences updated:', response.message);
    return true;
  } catch (error) {
    console.error('❌ Update preferences failed:', error.message);
    return false;
  }
}

async function testSendCustomNotification() {
  console.log('\n📢 Testing Send Custom Notification...');
  try {
    const notificationData = {
      title: '🧪 Test Notification',
      body: 'This is a test notification from the ClubFlow test suite',
      url: '/dashboard',
      recipients: 'all',
      requireInteraction: false,
      actions: [
        { action: 'view_dashboard', title: 'View Dashboard' }
      ]
    };

    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/send`, {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });

    console.log('✅ Custom notification sent:', response);
    return true;
  } catch (error) {
    console.error('❌ Send custom notification failed:', error.message);
    return false;
  }
}

async function testEmergencyAlert() {
  console.log('\n🚨 Testing Emergency Alert...');
  try {
    const alertData = {
      message: 'This is a test emergency alert - please ignore',
      url: '/dashboard'
    };

    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/emergency`, {
      method: 'POST',
      body: JSON.stringify(alertData)
    });

    console.log('✅ Emergency alert sent:', response);
    return true;
  } catch (error) {
    console.error('❌ Send emergency alert failed:', error.message);
    return false;
  }
}

async function testNotificationHistory() {
  console.log('\n📊 Testing Notification History...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/history?limit=5`);

    if (response.notifications && Array.isArray(response.notifications)) {
      console.log(`✅ Retrieved ${response.notifications.length} notification history entries`);
      console.log(`   Total notifications: ${response.pagination.total}`);
      return true;
    } else {
      console.error('❌ Invalid history response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Get notification history failed:', error.message);
    return false;
  }
}

async function testNotificationAnalytics() {
  console.log('\n📈 Testing Notification Analytics...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/analytics?days=7`);

    if (response.stats || response.dailyBreakdown || response.subscriptionStats) {
      console.log('✅ Analytics data retrieved:');
      console.log('   Stats:', Object.keys(response.stats || {}).length, 'entries');
      console.log('   Daily breakdown:', Object.keys(response.dailyBreakdown || {}).length, 'days');
      console.log('   Subscription stats:', Object.keys(response.subscriptionStats || {}).length, 'entries');
      return true;
    } else {
      console.error('❌ Invalid analytics response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Get notification analytics failed:', error.message);
    return false;
  }
}

async function testUnsubscribe() {
  console.log('\n🔕 Testing Unsubscribe...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/push-notifications/unsubscribe`, {
      method: 'DELETE',
      body: JSON.stringify({})
    });

    console.log('✅ Unsubscribe successful:', response.message);
    return true;
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error.message);
    return false;
  }
}

async function checkServiceWorker() {
  console.log('\n🔧 Testing Service Worker Files...');
  
  const swPath = path.join(__dirname, 'frontend/public/sw.js');
  const manifestPath = path.join(__dirname, 'frontend/public/manifest.json');
  
  let success = true;
  
  if (fs.existsSync(swPath)) {
    console.log('✅ Service Worker file exists');
    const swContent = fs.readFileSync(swPath, 'utf8');
    if (swContent.includes('push') && swContent.includes('notification')) {
      console.log('✅ Service Worker contains push notification code');
    } else {
      console.log('⚠️ Service Worker may be missing push notification handlers');
      success = false;
    }
  } else {
    console.log('❌ Service Worker file not found');
    success = false;
  }
  
  if (fs.existsSync(manifestPath)) {
    console.log('✅ Web App Manifest exists');
  } else {
    console.log('❌ Web App Manifest not found');
    success = false;
  }
  
  return success;
}

async function runTests() {
  console.log('Starting comprehensive push notification tests...\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Backend Connection', fn: testBackendConnection },
    { name: 'Service Worker Files', fn: checkServiceWorker },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'VAPID Key Retrieval', fn: testVapidKey },
    { name: 'Notification Subscription', fn: testNotificationSubscription },
    { name: 'Get Subscriptions', fn: testGetSubscriptions },
    { name: 'Update Preferences', fn: testUpdatePreferences },
    { name: 'Send Custom Notification', fn: testSendCustomNotification },
    { name: 'Emergency Alert', fn: testEmergencyAlert },
    { name: 'Notification History', fn: testNotificationHistory },
    { name: 'Notification Analytics', fn: testNotificationAnalytics },
    { name: 'Unsubscribe', fn: testUnsubscribe }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      results.failed++;
    }
    
    // Wait between tests to avoid overwhelming the server
    await wait(500);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🧪 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.total}`);
  console.log(`🎯 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Push notifications are ready for production.');
  } else {
    console.log(`\n⚠️ ${results.failed} test(s) failed. Please review the errors above.`);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testBackendConnection,
  testAuthentication,
  testVapidKey,
  testNotificationSubscription,
  testGetSubscriptions,
  testUpdatePreferences,
  testSendCustomNotification,
  testEmergencyAlert,
  testNotificationHistory,
  testNotificationAnalytics,
  testUnsubscribe,
  checkServiceWorker
};