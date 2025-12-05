@echo off
echo 🔧 ClubOps SaaS - CORS Fix Deployment
echo =====================================

echo.
echo 📋 ISSUE IDENTIFIED:
echo    - Backend vercel.json had outdated frontend URL
echo    - CORS was blocking requests due to URL mismatch
echo    - Environment variables were misaligned
echo.

echo 🔄 STEP 1: Deploying Backend with Fixed Environment...
cd backend
call vercel --prod --yes
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend deployment failed!
    pause
    exit /b 1
)
echo ✅ Backend deployed successfully!

echo.
echo 🔄 STEP 2: Deploying Frontend...
cd ..\frontend
call vercel --prod --yes
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend deployment failed!
    pause
    exit /b 1
)
echo ✅ Frontend deployed successfully!

echo.
echo 🧪 STEP 3: Testing API Connection...
cd ..
node -e "
const https = require('https');
const backendUrl = 'https://clubops-backend-pgynfiz9g-tony-telemacques-projects.vercel.app/health';
const frontendUrl = 'https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app';

console.log('🔍 Testing backend health...');
https.get(backendUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const health = JSON.parse(data);
    console.log('✅ Backend Status:', health.status);
    console.log('🌐 Frontend URL in backend config:', health.frontend_url);
    
    if (health.frontend_url && health.frontend_url.includes('frontend-1ech7j3jl')) {
      console.log('✅ CORS Fix Applied Successfully!');
      console.log('✅ Frontend URL matches current deployment');
    } else {
      console.log('⚠️  Frontend URL mismatch detected');
    }
  });
}).on('error', (err) => {
  console.log('❌ Backend health check failed:', err.message);
});
"

echo.
echo 🎯 STEP 4: Final Verification
echo    Backend:  https://clubops-backend-pgynfiz9g-tony-telemacques-projects.vercel.app
echo    Frontend: https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app
echo.
echo 🧪 Test the application:
echo    1. Open the frontend URL in your browser
echo    2. Try to login with: admin@clubops.com / password
echo    3. Check browser console for CORS errors (should be gone)
echo.

pause
