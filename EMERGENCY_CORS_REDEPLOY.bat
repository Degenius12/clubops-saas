@echo off
echo 🔧 ClubOps SaaS - Emergency CORS Fix Redeployment
echo =====================================================
echo.
echo 📋 ISSUE FIXED:
echo    - Backend vercel.json had wrong frontend URL (1cwhcnllo instead of 1ech7j3jl)
echo    - CORS configuration has been corrected
echo    - Ready for redeployment
echo.

cd C:\Users\tonyt\ClubOps-SaaS\backend

echo 🔄 Redeploying Backend with Correct CORS Configuration...
echo Frontend URL: https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app
echo.

vercel --prod --yes

echo.
echo 🎯 Deployment complete!
echo.
echo 📝 Next Steps:
echo    1. Check https://clubops-backend-pgynfiz9g-tony-telemacques-projects.vercel.app/health
echo    2. Test login at https://frontend-1ech7j3jl-tony-telemacques-projects.vercel.app
echo.

pause
