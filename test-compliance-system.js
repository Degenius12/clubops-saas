// Comprehensive Test Suite for Contract & Compliance System
// Tests all backend endpoints and data flow

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiN2RiZDQ5OWYtYTg4MC00YWMyLTk1ZDAtYzU1NGRiYmY5ZWI3IiwiY2x1YklkIjoiMWM3Y2MzOGYtOWQ0ZS00OTViLTlmZTEtOWE3YjBjNjNmMDNkIiwicm9sZSI6Ik1BTkFHRVIifSwiaWF0IjoxNzY2NzI5MjI2LCJleHAiOjE3NjY4MTU2MjZ9.uWV5s0IdtVoE3dgRUFjFOFIdTu6kDEVE14tpmqZjgkg';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);

  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('CONTRACT & COMPLIANCE SYSTEM TEST SUITE');
  console.log('========================================\n');

  // Test 1: Get State Requirements
  console.log('--- Test 1: Get State Requirements ---');
  const reqResult = await testAPI('/api/onboarding/requirements');
  if (reqResult.ok && reqResult.data.success) {
    logTest(
      'GET /api/onboarding/requirements',
      true,
      `State: ${reqResult.data.state}, Min Age: ${reqResult.data.requirements.minimumAge}`
    );
  } else {
    logTest('GET /api/onboarding/requirements', false, reqResult.error || 'Failed to fetch');
  }

  // Test 2: Age Validation
  console.log('\n--- Test 2: Age Validation ---');
  const ageValidResult = await testAPI('/api/onboarding/validate-age', {
    method: 'POST',
    body: JSON.stringify({
      dateOfBirth: '2000-01-01'
    })
  });
  if (ageValidResult.ok && ageValidResult.data.success) {
    logTest(
      'POST /api/onboarding/validate-age (Valid Age)',
      ageValidResult.data.validation.isValid,
      `Age: ${ageValidResult.data.validation.actualAge}, Valid: ${ageValidResult.data.validation.isValid}`
    );
  } else {
    logTest('POST /api/onboarding/validate-age', false, ageValidResult.error || 'Failed');
  }

  // Test 3: Age Validation (Under 18)
  const ageInvalidResult = await testAPI('/api/onboarding/validate-age', {
    method: 'POST',
    body: JSON.stringify({
      dateOfBirth: '2010-01-01'
    })
  });
  if (ageInvalidResult.ok && ageInvalidResult.data.success) {
    logTest(
      'POST /api/onboarding/validate-age (Under Age)',
      !ageInvalidResult.data.validation.isValid,
      `Age: ${ageInvalidResult.data.validation.actualAge}, Valid: ${ageInvalidResult.data.validation.isValid}`
    );
  } else {
    logTest('POST /api/onboarding/validate-age (Under Age)', false);
  }

  // Test 4: Get Expiring Documents (should work even if empty)
  console.log('\n--- Test 3: Get Expiring Documents ---');
  const expiringResult = await testAPI('/api/compliance/documents-expiring');
  if (expiringResult.ok) {
    logTest(
      'GET /api/compliance/documents-expiring',
      true,
      `Found ${expiringResult.data.documents?.length || 0} expiring documents`
    );
  } else {
    logTest('GET /api/compliance/documents-expiring', false, expiringResult.error);
  }

  // Test 5: Contract Template Validation
  console.log('\n--- Test 4: Contract Creation (No Entertainer ID - Expected to Fail) ---');
  const contractFailResult = await testAPI('/api/contracts/create', {
    method: 'POST',
    body: JSON.stringify({
      contractType: 'INDEPENDENT_CONTRACTOR_1099',
      effectiveDate: new Date().toISOString()
    })
  });
  logTest(
    'POST /api/contracts/create (Missing entertainerId)',
    !contractFailResult.ok && contractFailResult.status === 400,
    'Correctly rejects missing entertainerId'
  );

  // Test 6: Invalid Contract Type
  console.log('\n--- Test 5: Invalid Contract Type ---');
  const invalidTypeResult = await testAPI('/api/contracts/create', {
    method: 'POST',
    body: JSON.stringify({
      entertainerId: 'test-id',
      contractType: 'INVALID_TYPE',
      effectiveDate: new Date().toISOString()
    })
  });
  logTest(
    'POST /api/contracts/create (Invalid Type)',
    !invalidTypeResult.ok && invalidTypeResult.status === 400,
    'Correctly rejects invalid contract type'
  );

  // Test 7: Onboarding Start (No Entertainer - Expected to Fail)
  console.log('\n--- Test 6: Onboarding Start Validation ---');
  const onboardingFailResult = await testAPI('/api/onboarding/start', {
    method: 'POST',
    body: JSON.stringify({})
  });
  logTest(
    'POST /api/onboarding/start (Missing entertainerId)',
    !onboardingFailResult.ok && onboardingFailResult.status === 400,
    'Correctly validates required fields'
  );

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  console.log('\n========================================');

  return testResults.failed === 0;
}

// Run tests
runTests()
  .then(success => {
    if (success) {
      console.log('\n🎉 All backend endpoint tests passed!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Review output above.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  });
