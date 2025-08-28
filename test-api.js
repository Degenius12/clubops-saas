// ClubOps API Testing Script
const API_BASE = 'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app/api';

async function testAPI() {
    console.log('🧪 Testing ClubOps API Endpoints...\n');
    
    // Test 1: Health Check
    try {
        const healthResponse = await fetch(`${API_BASE}/health`);
        console.log('✅ Health Check:', healthResponse.status === 200 ? 'PASS' : 'FAIL');
    } catch (error) {
        console.log('❌ Health Check: FAIL -', error.message);
    }
    
    // Test 2: Registration Endpoint
    try {
        const regResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clubName: 'Test Club',
                ownerName: 'Test Owner',
                email: 'test@example.com',
                password: 'test123'
            })
        });
        console.log('✅ Registration:', regResponse.status ? 'ENDPOINT ACTIVE' : 'FAIL');
    } catch (error) {
        console.log('❌ Registration: FAIL -', error.message);
    }
    
    // Test 3: Login Endpoint
    try {
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123'
            })
        });
        console.log('✅ Login:', loginResponse.status ? 'ENDPOINT ACTIVE' : 'FAIL');
    } catch (error) {
        console.log('❌ Login: FAIL -', error.message);
    }
    
    console.log('\n🚀 Frontend URL: https://frontend-ou5uzl26l-tony-telemacques-projects.vercel.app');
    console.log('🔧 Backend URL: https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app');
}

// Run tests
testAPI();
