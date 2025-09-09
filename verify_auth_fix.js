#!/usr/bin/env node
// ClubOps Authentication Test Script - Comprehensive Verification

const fs = require('fs');
const path = require('path');

console.log('🚀 ClubOps Authentication Verification Script');
console.log('=' * 50);

// Check environment files
function checkEnvironmentFiles() {
    console.log('\n📁 Checking Environment Files...');
    
    const envFiles = [
        'frontend/.env',
        'frontend/.env.local', 
        'frontend/.env.production'
    ];

    envFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const apiUrl = content.match(/VITE_API_URL=(.+)/)?.[1];
            console.log(`✅ ${file}: ${apiUrl}`);
        } catch (error) {
            console.log(`❌ ${file}: Not found or error reading`);
        }
    });
}

// Check API configuration
function checkApiConfig() {
    console.log('\n🔧 Checking API Configuration...');
    
    try {
        const apiConfig = fs.readFileSync('frontend/src/config/api.ts', 'utf8');
        
        // Check for the fix we applied
        if (apiConfig.includes("import.meta.env.VITE_API_URL || 'http://localhost:3001'")) {
            console.log('✅ API base URL configuration fixed');
        } else {
            console.log('❌ API base URL still has old configuration');
        }

        if (apiConfig.includes('console.log')) {
            console.log('✅ Debug logging enabled');
        } else {
            console.log('⚠️  Debug logging not found');
        }

        if (apiConfig.includes('timeout: 10000')) {
            console.log('✅ Request timeout configured');
        } else {
            console.log('⚠️  Request timeout not configured');
        }
    } catch (error) {
        console.log('❌ Error reading api.ts:', error.message);
    }
}

// Check auth slice configuration  
function checkAuthSlice() {
    console.log('\n🔑 Checking Auth Slice...');
    
    try {
        const authSlice = fs.readFileSync('frontend/src/store/slices/authSlice.ts', 'utf8');
        
        // Check that endpoints are correct
        if (authSlice.includes("'/api/auth/login'")) {
            console.log('✅ Login endpoint path correct');
        } else {
            console.log('❌ Login endpoint path incorrect');
        }

        if (authSlice.includes("'/api/auth/register'")) {
            console.log('✅ Register endpoint path correct');
        } else {
            console.log('❌ Register endpoint path incorrect');
        }
    } catch (error) {
        console.log('❌ Error reading authSlice.ts:', error.message);
    }
}

// Backend test credentials
function showTestCredentials() {
    console.log('\n🔐 Available Test Credentials:');
    console.log('Email: admin@clubops.com');
    console.log('Password: password');
    console.log('Role: owner');
    console.log('');
    console.log('Email: manager@clubops.com'); 
    console.log('Password: password');
    console.log('Role: manager');
}

// Generate test instructions
function generateTestInstructions() {
    console.log('\n📋 Testing Instructions:');
    console.log('1. Open the debug tool: debug_auth_fixed.html');
    console.log('2. Click "Test All Backend URLs" to find active backend');
    console.log('3. Use test credentials to login');
    console.log('4. Check browser console for detailed logs');
    console.log('5. Verify token is saved to localStorage');
}

// Summary
function showSummary() {
    console.log('\n📊 Authentication Fix Summary:');
    console.log('🔧 Fixed API base URL configuration');
    console.log('🔧 Added better error handling and logging'); 
    console.log('🔧 Updated environment variables consistently');
    console.log('🔧 Created comprehensive debug tools');
    console.log('');
    console.log('⚠️  Next Steps:');
    console.log('1. Test with debug_auth_fixed.html');
    console.log('2. Start frontend development server');
    console.log('3. Try logging in with test credentials');
    console.log('4. Check browser console for any remaining errors');
}

// Run all checks
function runAllChecks() {
    checkEnvironmentFiles();
    checkApiConfig();
    checkAuthSlice();
    showTestCredentials();
    generateTestInstructions();
    showSummary();
}

// Main execution
if (require.main === module) {
    runAllChecks();
}

module.exports = {
    checkEnvironmentFiles,
    checkApiConfig,
    checkAuthSlice,
    showTestCredentials,
    generateTestInstructions,
    showSummary,
    runAllChecks
};