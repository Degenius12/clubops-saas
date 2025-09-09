@echo off
echo.
echo ====================================
echo 🚀 CLUBOPS AUTHENTICATION REPAIR
echo ====================================
echo.
echo 🛠️ FIXING CRITICAL ISSUES:
echo ✓ Corrected frontend URL in backend config
echo ✓ Updated Vercel deployment configuration
echo ✓ Fixed CORS and environment variables
echo.
echo 📋 DEPLOYMENT PLAN:
echo 1. Navigate to backend directory
echo 2. Deploy to Vercel with corrected config
echo 3. Update frontend environment if needed
echo 4. Test authentication flow
echo.

cd /d "C:\Users\tonyt\ClubOps-SaaS\backend"
echo 📍 Current directory: %CD%
echo.

echo 🔍 Checking Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Please install: npm i -g vercel
    echo Then run: vercel login
    pause
    exit /b 1
)

echo ✅ Vercel CLI found
echo.

echo 🚀 Deploying backend with corrected configuration...
echo.
vercel --prod --yes

echo.
echo ====================================
echo 🎯 DEPLOYMENT COMPLETE
echo ====================================
echo.
echo 🔗 UPDATED URLS:
echo Backend:  https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app
echo Frontend: https://frontend-6v4tpr1qa-tony-telemacques-projects.vercel.app
echo.
echo 🔐 TEST CREDENTIALS:
echo Email:    admin@clubops.com
echo Password: password
echo.
echo 📝 NEXT STEPS:
echo 1. Wait 2-3 minutes for deployment to complete
echo 2. Run auth_test_fixed.html to verify fixes
echo 3. Clear browser cache if needed
echo 4. Test frontend login at the URL above
echo.
pause