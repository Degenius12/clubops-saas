@echo off
echo 🔧 ClubOps SaaS - Frontend Update with New Backend URL
echo ========================================================
echo.
echo 📋 Configuration Update:
echo    - New Backend URL: https://clubops-backend-8lwkyt45q-tony-telemacques-projects.vercel.app
echo    - Frontend will be updated to connect to new backend
echo.

cd C:\Users\tonyt\ClubOps-SaaS\frontend

echo 🔄 Redeploying Frontend with Updated Backend URL...
echo.

vercel --prod --yes

echo.
echo 🎯 Frontend deployment complete!
echo.
echo 📝 URLs:
echo    Frontend: https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app
echo    Backend:  https://clubops-backend-8lwkyt45q-tony-telemacques-projects.vercel.app
echo.

pause
