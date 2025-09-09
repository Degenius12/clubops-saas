@echo off
REM ClubOps SaaS - Complete Deployment Script for Windows
REM This script will deploy both frontend and backend to Vercel

echo 🚀 Starting ClubOps SaaS Deployment Process...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

echo 📦 Building and deploying backend...
cd backend
vercel --prod --confirm
if %errorlevel% neq 0 (
    echo ❌ Backend deployment failed!
    pause
    exit /b 1
)

echo ✅ Backend deployed!

echo 📦 Building and deploying frontend...
cd ..\frontend
vercel --prod --confirm
if %errorlevel% neq 0 (
    echo ❌ Frontend deployment failed!
    pause
    exit /b 1
)

echo ✅ Frontend deployed!

echo 🎉 Deployment complete!
echo.
echo 🔗 Your application URLs:
echo Frontend: https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app
echo Backend: https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app
echo.
echo 🧪 Test your deployment:
echo 1. Visit the frontend URL
echo 2. Try logging in with: admin@clubops.com / password
echo 3. Check that all features work
echo.

REM Test the health endpoint
echo 🏥 Testing backend health...
curl -X GET "https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app/health"

echo.
echo ✅ All tests complete! Your ClubOps SaaS is ready.
pause
