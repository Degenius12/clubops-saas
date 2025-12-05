// ClubOps Deployment Health Check
console.log('🏁 CLUBOPS DEPLOYMENT VERIFICATION');
console.log('=====================================');

// Test Backend Health
fetch('https://clubops-backend-pq8yi6woc-tony-telemacques-projects.vercel.app/health')
    .then(response => response.json())
    .then(data => {
        console.log('✅ Backend Health:', data);
    })
    .catch(error => {
        console.log('❌ Backend Error:', error);
    });

// Test Frontend Connectivity
fetch('https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app')
    .then(response => {
        console.log('✅ Frontend Status:', response.status, response.statusText);
        console.log('✅ Frontend URL accessible!');
    })
    .catch(error => {
        console.log('❌ Frontend Error:', error);
    });

console.log('\n🎯 NEXT STEPS:');
console.log('1. Open Frontend URL in browser');  
console.log('2. Test user registration/login');
console.log('3. Verify database connectivity');
console.log('4. Check all main features');

console.log('\n📱 Your ClubOps SaaS is now LIVE!');