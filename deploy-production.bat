@echo off
echo 🚀 ClubOps Production Deployment Script
echo =====================================

echo.
echo 📦 Deploying Backend...
cd backend
call vercel --prod --env NODE_ENV=production

echo.
echo 🎨 Deploying Frontend...
cd ../frontend
call vercel --prod --env NODE_ENV=production

echo.
echo ✅ Deployment Complete!
echo.
echo 🧪 Test URLs:
echo Frontend: https://frontend-6v4tpr1qa-tony-telemacques-projects.vercel.app
echo Backend:  https://clubops-backend-p0ioqtrzp-tony-telemacques-projects.vercel.app
echo.
echo 🔗 Test login at: https://frontend-6v4tpr1qa-tony-telemacques-projects.vercel.app/login
echo Username: admin@clubops.com
echo Password: password
echo.
pause