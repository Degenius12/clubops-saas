@echo off
echo 🚀 ClubOps Backend Deployment Script
echo ===================================
echo.

echo 📋 FIXES APPLIED:
echo ✅ Updated vercel.json with correct frontend URL
echo ✅ Fixed CORS configuration to include clubops-saas-platform.vercel.app
echo ✅ Fixed login endpoint status code (400 → 401)
echo.

echo 🔍 Current directory:
cd
echo.

echo 📁 Checking backend directory...
if exist "backend" (
    echo ✅ Backend directory found
    cd backend
) else (
    echo ❌ Backend directory not found - run from project root
    pause
    exit /b 1
)

echo.
echo 📦 Backend files status:
echo ✅ vercel.json - Updated with correct frontend URL
echo ✅ api/index.js - Fixed CORS and login status code

echo.
echo 🚀 DEPLOYING TO VERCEL...
echo.

echo Step 1: Installing Vercel CLI (if needed)...
npm list -g vercel >nul 2>&1
if errorlevel 1 (
    echo Installing Vercel CLI...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI already installed
)

echo.
echo Step 2: Deploying backend...
vercel --prod

echo.
echo 🧪 Testing deployment...
echo Testing health endpoint...
curl -s https://clubops-backend-vercel-kmhv.vercel.app/health

echo.
echo.
echo Testing login endpoint...
curl -X POST https://clubops-backend-vercel-kmhv.vercel.app/api/auth/login ^
     -H "Content-Type: application/json" ^
     -H "Accept: application/json" ^
     -H "Origin: https://clubops-saas-platform.vercel.app" ^
     -d "{\"email\":\"admin@clubops.com\",\"password\":\"password\"}" ^
     -w "\nStatus: %%{http_code}\n"

echo.
echo.
echo ✅ DEPLOYMENT COMPLETE!
echo.
echo 📋 NEXT STEPS:
echo 1. Test login at your frontend: https://clubops-saas-platform.vercel.app
echo 2. Use credentials: admin@clubops.com / password
echo 3. Check browser console for any remaining errors
echo.

echo 🔧 If login still fails, check:
echo - Frontend environment variables (.env)
echo - Browser network tab for CORS errors
echo - Use test_backend_auth_issue.html for detailed testing
echo.

pause