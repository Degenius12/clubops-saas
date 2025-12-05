@echo off
echo 🔧 ClubOps SaaS - Updating URLs and Fixing CORS
echo =====================================
echo.
echo 📋 NEW DEPLOYMENT URLS:
echo    Backend:  https://clubops-backend-1pkgn4g14-tony-telemacques-projects.vercel.app
echo    Frontend: https://frontend-bzl3aqg1j-tony-telemacques-projects.vercel.app
echo.

echo 🔄 Updating backend configuration...
echo Updating backend/vercel.json with new frontend URL...
powershell -Command "(Get-Content backend\vercel.json) -replace 'https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app', 'https://frontend-bzl3aqg1j-tony-telemacques-projects.vercel.app' | Set-Content backend\vercel.json"

echo 🔄 Updating frontend configuration...  
echo Updating frontend/.env.production with new backend URL...
powershell -Command "(Get-Content frontend\.env.production) -replace 'https://clubops-backend-pgynfiz9g-tony-telemacques-projects.vercel.app', 'https://clubops-backend-1pkgn4g14-tony-telemacques-projects.vercel.app' | Set-Content frontend\.env.production"

echo.
echo ✅ Configuration files updated!
echo.

echo 🚀 Redeploying with correct URLs...
echo.

echo 🔄 STEP 1: Deploying Backend with new Frontend URL...
cd backend
call vercel --prod --yes
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend deployment failed!
    pause
    exit /b 1
)
echo ✅ Backend deployed successfully!

echo.
echo 🔄 STEP 2: Deploying Frontend with new Backend URL...
cd ..\frontend
call vercel --prod --yes
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend deployment failed!
    pause
    exit /b 1
)
echo ✅ Frontend deployed successfully!

echo.
echo 🎯 Deployment Complete!
echo    Backend:  https://clubops-backend-1pkgn4g14-tony-telemacques-projects.vercel.app
echo    Frontend: https://frontend-bzl3aqg1j-tony-telemacques-projects.vercel.app
echo.
echo 🧪 Test the application:
echo    1. Open the frontend URL in your browser
echo    2. Try to login with: admin@clubops.com / password
echo    3. Check browser console for CORS errors (should be gone)
echo.

pause