@echo off
echo 🚀 ClubOps Emergency Local Development Setup
echo =============================================

echo.
echo 📋 This script will set up ClubOps to run locally
echo ⚠️  Use this if Vercel deployments are not accessible
echo.

pause

echo 🔧 Step 1: Setting up Frontend for Local Development
cd /d "C:\Users\tonyt\ClubOps-SaaS\frontend"

echo Creating local environment file...
echo VITE_API_URL=http://localhost:3001 > .env.local
echo VITE_APP_NAME=ClubOps >> .env.local
echo VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here >> .env.local

echo Installing frontend dependencies...
call npm install

echo.
echo 🔧 Step 2: Setting up Backend for Local Development  
cd /d "C:\Users\tonyt\ClubOps-SaaS\backend"

echo Creating local environment file...
echo PORT=3001 > .env.local
echo NODE_ENV=development >> .env.local
echo CLIENT_URL=http://localhost:5173 >> .env.local
echo FRONTEND_URL=http://localhost:5173 >> .env.local
echo JWT_SECRET=clubops-super-secure-jwt-key-2024-make-this-very-long-and-random-please >> .env.local
echo DATABASE_URL=postgresql://neondb_owner:npg_a2IrCUykWc0p@ep-rough-star-adk34eay-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require >> .env.local

echo Installing backend dependencies...
call npm install

echo.
echo ✅ LOCAL SETUP COMPLETE!
echo.
echo 🚀 TO START THE APPLICATION:
echo.
echo 1. Open TWO command prompt windows
echo.
echo 2. In FIRST window, run:
echo    cd "C:\Users\tonyt\ClubOps-SaaS\backend"
echo    npm run dev
echo.
echo 3. In SECOND window, run:
echo    cd "C:\Users\tonyt\ClubOps-SaaS\frontend" 
echo    npm run dev
echo.
echo 4. Open browser to: http://localhost:5173
echo.
echo 🔑 Test Login: admin@eliteclub.com / admin123
echo.

pause