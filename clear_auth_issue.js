// Quick fix script to clear authentication issues
console.log('🧹 Clearing ClubOps authentication issues...');

// Clear localStorage token
localStorage.removeItem('token');
console.log('✅ Cleared stored token');

// Clear any session storage
sessionStorage.clear();
console.log('✅ Cleared session storage');

// Check current storage state
console.log('📊 Current localStorage token:', localStorage.getItem('token'));

// Test the interceptor logic
const authEndpoints = ['/api/auth/login', '/api/auth/signup', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];
const testURL = '/api/auth/login';
const isAuthEndpoint = authEndpoints.some(endpoint => testURL.includes(endpoint));
const token = localStorage.getItem('token');

console.log('🔍 Interceptor Test:');
console.log('  - URL:', testURL);
console.log('  - Is auth endpoint:', isAuthEndpoint);
console.log('  - Has token:', !!token);
console.log('  - Will add auth header:', !isAuthEndpoint && !!token);

alert('✅ Authentication cleared! Try logging in again.');
