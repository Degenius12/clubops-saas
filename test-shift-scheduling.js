const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

// Test JWT token (Manager role)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiZTIwN2E0N2UtNmI4ZS00OTI3LWJiNGYtNGFhNzBlZGRiZjIwIiwib3duZXJfaWQiOiJlMjA3YTQ3ZS02YjhlLTQ5MjctYmI0Zi00YWE3MGVkZGJmMjAiLCJjbHViSWQiOiI1NDE5YTU4OS0wY2YwLTQ3OTktYWI4ZC0xNmY3NjM2YzIzZDkiLCJyb2xlIjoiTUFOQUdFUiJ9LCJpYXQiOjE3MzU3NzQ0ODIsImV4cCI6MTczNTg2MDg4Mn0.1Zg8WFBs9T7lktqPNDl4D2WFT8wBGGFXylfO5lDJSVs';

async function testShiftAPI() {
  console.log('🧪 Testing Shift Management API Endpoints\n');

  try {
    // Test 1: Get scheduled shifts (should return empty array initially)
    console.log('1. Testing GET /api/scheduled-shifts');
    const getResponse = await fetch(`${API_BASE}/api/scheduled-shifts`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (getResponse.ok) {
      const shifts = await getResponse.json();
      console.log('   ✅ GET scheduled shifts successful');
      console.log(`   📊 Found ${shifts.length} existing shifts`);
    } else {
      console.log('   ❌ GET scheduled shifts failed:', getResponse.status);
      const error = await getResponse.text();
      console.log('   Error:', error);
    }

    // Test 2: Get week view
    console.log('\n2. Testing GET /api/scheduled-shifts/week');
    const weekResponse = await fetch(`${API_BASE}/api/scheduled-shifts/week`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (weekResponse.ok) {
      const weekData = await weekResponse.json();
      console.log('   ✅ GET week view successful');
      console.log(`   📊 Total shifts this week: ${weekData.totalShifts}`);
    } else {
      console.log('   ❌ GET week view failed:', weekResponse.status);
    }

    // Test 3: Get swap requests
    console.log('\n3. Testing GET /api/scheduled-shifts/swaps');
    const swapsResponse = await fetch(`${API_BASE}/api/scheduled-shifts/swaps`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (swapsResponse.ok) {
      const swaps = await swapsResponse.json();
      console.log('   ✅ GET swap requests successful');
      console.log(`   📊 Found ${swaps.length} swap requests`);
    } else {
      console.log('   ❌ GET swap requests failed:', swapsResponse.status);
    }

    // Test 4: Get shift notifications
    console.log('\n4. Testing GET /api/scheduled-shifts/notifications');
    const notificationsResponse = await fetch(`${API_BASE}/api/scheduled-shifts/notifications`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (notificationsResponse.ok) {
      const notifications = await notificationsResponse.json();
      console.log('   ✅ GET notifications successful');
      console.log(`   📊 Found ${notifications.length} notifications`);
    } else {
      console.log('   ❌ GET notifications failed:', notificationsResponse.status);
    }

    // Test 5: Create a new shift (requires entertainer ID)
    console.log('\n5. Testing POST /api/scheduled-shifts (create shift)');
    
    // First get list of entertainers
    const entertainersResponse = await fetch(`${API_BASE}/api/dancers`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (entertainersResponse.ok) {
      const entertainers = await entertainersResponse.json();
      
      if (entertainers.length > 0) {
        const testShift = {
          entertainerId: entertainers[0].id,
          shiftDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
          startTime: '19:00',
          endTime: '02:00',
          position: 'Main Stage',
          notes: 'Test shift created by API test',
          sendNotification: true
        };

        const createResponse = await fetch(`${API_BASE}/api/scheduled-shifts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_TOKEN}`
          },
          body: JSON.stringify(testShift)
        });

        if (createResponse.ok) {
          const result = await createResponse.json();
          console.log('   ✅ CREATE shift successful');
          console.log(`   📊 Created shift for ${result.shift.entertainer.stageName}`);
          console.log(`   📧 Notification sent: ${result.notificationSent}`);
          
          // Store shift ID for potential cleanup
          console.log(`   🆔 Shift ID: ${result.shift.id}`);
        } else {
          console.log('   ❌ CREATE shift failed:', createResponse.status);
          const error = await createResponse.json();
          console.log('   Error:', error.error);
        }
      } else {
        console.log('   ⚠️  No entertainers found to create test shift');
      }
    } else {
      console.log('   ❌ Failed to get entertainers list');
    }

  } catch (error) {
    console.error('🚨 Test failed with error:', error.message);
  }

  console.log('\n🏁 Shift Management API test completed');
}

// Run the tests
testShiftAPI().catch(console.error);