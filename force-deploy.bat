@echo off
echo 🚀 ClubOps-SaaS Force Deployment Script
echo ======================================
echo.
echo This will trigger a new Vercel deployment with the latest fixes...
echo.

cd /d "C:\Users\tonyt\ClubOps-SaaS"

echo 📝 Adding deployment trigger...
echo # Force deployment trigger > deployment-trigger.txt
echo Deployment triggered at %date% %time% >> deployment-trigger.txt

echo 📤 Committing changes...
git add .
git commit -m "FORCE DEPLOY: Trigger Vercel deployment with fixed environment variables"

echo 🌐 Pushing to GitHub (this will auto-deploy to Vercel)...
git push origin main

echo.
echo ✅ Deployment triggered!
echo.
echo 📊 Check deployment status:
echo Frontend: https://vercel.com/tony-telemacques-projects/frontend/deployments
echo Backend: https://vercel.com/tony-telemacques-projects/clubops-backend/deployments
echo.
echo ⏱️  Wait 2-3 minutes for deployment to complete, then run:
echo node verify-deployment-complete.js
echo.
pause
