@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo    ClubOps Deployment Fix Script
echo    Fixes Frontend-Backend URL Synchronization
echo ============================================================
echo.

:: Configuration
set "PROJECT_DIR=C:\Users\tonyt\ClubOps-SaaS"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"
set "BACKEND_URL=https://clubops-backend.vercel.app"

:: Colors for output (Windows 10+)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RESET=[0m"

echo %CYAN%Step 1: Checking prerequisites...%RESET%
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%ERROR: Node.js is not installed or not in PATH%RESET%
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Node.js found

:: Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% Vercel CLI not found. Installing...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo %RED%ERROR: Failed to install Vercel CLI%RESET%
        pause
        exit /b 1
    )
)
echo %GREEN%[OK]%RESET% Vercel CLI found

echo.
echo %CYAN%Step 2: Updating local environment files...%RESET%
echo.

:: Update frontend .env files
cd /d "%FRONTEND_DIR%"

:: Create/update .env.production
echo VITE_API_URL=%BACKEND_URL%> .env.production
echo VITE_APP_NAME=ClubOps>> .env.production
echo VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here>> .env.production
echo VITE_FORCE_REBUILD=true>> .env.production

echo %GREEN%[OK]%RESET% Updated .env.production

:: Also update .env.local for consistency
echo VITE_API_URL=%BACKEND_URL%> .env.local
echo VITE_APP_NAME=ClubOps>> .env.local

echo %GREEN%[OK]%RESET% Updated .env.local

echo.
echo %CYAN%Step 3: Verifying backend is accessible...%RESET%
echo.

:: Test backend health endpoint
curl -s -o nul -w "%%{http_code}" %BACKEND_URL%/health > temp_status.txt
set /p HTTP_STATUS=<temp_status.txt
del temp_status.txt

if "%HTTP_STATUS%"=="200" (
    echo %GREEN%[OK]%RESET% Backend is accessible at %BACKEND_URL%
) else (
    echo %RED%[ERROR]%RESET% Backend returned status: %HTTP_STATUS%
    echo Please check if the backend is deployed correctly.
    pause
    exit /b 1
)

echo.
echo %CYAN%Step 4: Building frontend with correct configuration...%RESET%
echo.

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Build the frontend
echo Building frontend...
call npm run build

if %errorlevel% neq 0 (
    echo %RED%ERROR: Build failed%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Frontend built successfully

echo.
echo %CYAN%Step 5: Deploying to Vercel...%RESET%
echo.

:: Check if user is logged in to Vercel
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo %YELLOW%You need to log in to Vercel first.%RESET%
    echo.
    vercel login
)

:: Deploy to production
echo Deploying to production...
vercel --prod --yes

if %errorlevel% neq 0 (
    echo %RED%ERROR: Deployment failed%RESET%
    echo.
    echo %YELLOW%Alternative: Try deploying via GitHub%RESET%
    echo 1. Commit and push changes to GitHub
    echo 2. Vercel will auto-deploy from the repository
    echo.
    goto :github_fallback
)

echo.
echo %GREEN%============================================================%RESET%
echo %GREEN%   DEPLOYMENT SUCCESSFUL!%RESET%
echo %GREEN%============================================================%RESET%
echo.
echo Your frontend should now be connected to: %BACKEND_URL%
echo.
echo %CYAN%Next Steps:%RESET%
echo 1. Wait 1-2 minutes for deployment to propagate
echo 2. Clear your browser cache (Ctrl+Shift+Delete)
echo 3. Visit the frontend URL and test login
echo.
echo %CYAN%Test Credentials:%RESET%
echo   Email: admin@clubops.com
echo   Password: password
echo.
goto :end

:github_fallback
echo.
echo %CYAN%Step 5b: Pushing to GitHub for auto-deployment...%RESET%
echo.

cd /d "%PROJECT_DIR%"

:: Add all changes
git add -A

:: Commit with descriptive message
git commit -m "fix: sync frontend API URL to %BACKEND_URL%"

:: Push to main branch
git push origin main

if %errorlevel% neq 0 (
    echo %YELLOW%Trying to push to master branch instead...%RESET%
    git push origin master
)

echo.
echo %GREEN%============================================================%RESET%
echo %GREEN%   CHANGES PUSHED TO GITHUB%RESET%
echo %GREEN%============================================================%RESET%
echo.
echo Vercel should auto-deploy within 1-2 minutes.
echo Check your Vercel dashboard for deployment status.
echo.

:end
echo %CYAN%Script completed. Press any key to exit...%RESET%
pause >nul
