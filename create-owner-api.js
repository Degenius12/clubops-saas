// Create test owner via API
const axios = require('axios');

async function createOwner() {
  try {
    // First try to register the owner
    console.log('Creating owner account via API...');
    
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'owner@test.com',
      password: 'password123',
      name: 'Test Owner',
      role: 'OWNER',
      clubName: 'Test Club'
    });
    
    console.log('✅ Owner account created successfully');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('Owner account already exists');
    } else {
      console.error('Error:', error.response?.data || error.message);
    }
  }
}

createOwner();