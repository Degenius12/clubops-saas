@echo off
cd /d C:\Users\tonyt\ClubOps-SaaS

echo CRITICAL FIX: Updating frontend environment for authentication...

echo Staging frontend environment changes...
git add frontend/.env
git add frontend/.env.production  
git add frontend/src/config/build.ts

echo Committing authentication fix...
git commit -m "CRITICAL FIX: Force frontend rebuild with correct backend URL for authentication"

echo Pushing to trigger Vercel rebuild...
git push origin main

echo.
echo ✅ Authentication fix deployed!
echo ⏳ Vercel will rebuild the frontend in 2-3 minutes.
echo 🔗 Frontend URL: https://frontend-6v4tpr1qa-tony-telemacques-projects.vercel.app
echo.
echo TEST CREDENTIALS:
echo Email: admin@clubops.com
echo Password: password
