@echo off
REM CLUBOPS SAAS - EMERGENCY REPAIR DEPLOYMENT

echo 🚨 CLUBOPS EMERGENCY REPAIR DEPLOYMENT
echo =====================================

REM Step 1: Backup current configs
echo 📁 Backing up current configurations...
copy "backend\vercel.json" "backend\vercel-backup.json" >nul 2>&1
copy "frontend\vercel.json" "frontend\vercel-backup.json" >nul 2>&1

REM Step 2: Apply fixed configurations
echo 🔧 Applying emergency fixes...
copy "backend\vercel-fixed.json" "backend\vercel.json"
copy "frontend\vercel-fixed.json" "frontend\vercel.json"

REM Step 3: Ensure dependencies are installed
echo 📦 Installing dependencies...
cd backend
call npm install --production
cd ..\frontend
call npm install

REM Step 4: Build frontend
echo 🏗️ Building frontend...
call npm run build

REM Step 5: Deploy backend first
echo 🚀 Deploying backend...
cd ..\backend
call vercel --prod --confirm --yes
if errorlevel 1 (
    echo ❌ Backend deployment failed!
    exit /b 1
)

REM Step 6: Deploy frontend
echo 🚀 Deploying frontend...
cd ..\frontend
call vercel --prod --confirm --yes
if errorlevel 1 (
    echo ❌ Frontend deployment failed!
    exit /b 1
)

REM Step 7: Test deployment
echo 🧪 Testing deployment...
cd ..
node diagnostic-test.js

echo ✅ Emergency repair deployment complete!
echo 🔗 Check the diagnostic results above for status

pause