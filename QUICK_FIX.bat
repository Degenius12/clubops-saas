@echo off
:: QUICK FIX - Just rebuild and deploy frontend
:: Use this if the full script is taking too long

echo ============================================
echo   ClubOps QUICK Deployment Fix
echo ============================================
echo.

cd /d C:\Users\tonyt\ClubOps-SaaS\frontend

echo [1/3] Setting correct backend URL...
echo VITE_API_URL=https://clubops-backend.vercel.app> .env
echo VITE_APP_NAME=ClubOps>> .env

echo [2/3] Building frontend...
call npm run build

echo [3/3] Deploying to Vercel...
vercel --prod --yes

echo.
echo ============================================
echo   Done! Test login in 1-2 minutes.
echo   Email: admin@clubops.com
echo   Password: password
echo ============================================

pause
