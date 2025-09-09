@echo off
echo 🚀 ClubOps Authentication Fix Verification
echo ==========================================

cd /d "C:\Users\tonyt\ClubOps-SaaS"

echo.
echo 📁 Checking Environment Files...
if exist "frontend\.env" (
    echo ✅ frontend\.env exists
    findstr "VITE_API_URL" "frontend\.env"
) else (
    echo ❌ frontend\.env not found
)

if exist "frontend\.env.production" (
    echo ✅ frontend\.env.production exists  
    findstr "VITE_API_URL" "frontend\.env.production"
) else (
    echo ❌ frontend\.env.production not found
)

echo.
echo 🔧 Checking API Configuration...
if exist "frontend\src\config\api.ts" (
    echo ✅ api.ts exists
    findstr /C:"http://localhost:3001" "frontend\src\config\api.ts" >nul
    if %errorlevel%==0 (
        echo ✅ Fixed baseURL configuration found
    ) else (
        echo ❌ Old baseURL configuration still present
    )
) else (
    echo ❌ api.ts not found
)

echo.
echo 🔑 Test Credentials Available:
echo   Email: admin@clubops.com
echo   Password: password
echo   ---
echo   Email: manager@clubops.com  
echo   Password: password

echo.
echo 📋 Next Steps:
echo 1. Open debug_auth_fixed.html in browser
echo 2. Test backend URL connectivity
echo 3. Try login with test credentials
echo 4. Check browser console for detailed logs

echo.
echo 🎯 Files Modified:
echo   ✅ frontend/src/config/api.ts - Fixed API configuration
echo   ✅ frontend/.env - Updated backend URL
echo   ✅ frontend/.env.production - Updated backend URL
echo   ✅ debug_auth_fixed.html - Created debug tool

pause