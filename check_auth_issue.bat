@echo off
echo 🔍 ClubOps Backend Authentication Issue Checker
echo ============================================
echo.

echo 📋 Current Configuration Status:
echo.

echo ✅ Frontend .env file:
type "frontend\.env"
echo.

echo ✅ Frontend vite.config.ts proxy:
findstr /n "target" "frontend\vite.config.ts"
echo.

echo ✅ Frontend API config:
findstr /n "API_BASE_URL" "frontend\src\config\api.ts"
echo.

echo 🚨 ISSUE ANALYSIS:
echo ==================
echo.
echo The error "Invalid credentials" on login suggests:
echo 1. Backend auth middleware is incorrectly protecting /auth/login
echo 2. Or backend deployment has wrong version of code
echo.

echo 📡 Testing backend directly...
echo.

curl -X POST https://clubops-backend-vercel-kmhv.vercel.app/api/auth/login ^
     -H "Content-Type: application/json" ^
     -H "Accept: application/json" ^
     -d "{\"email\":\"admin@clubops.com\",\"password\":\"password\"}" ^
     -v

echo.
echo.
echo 🛠️ NEXT STEPS:
echo ==============
echo 1. Check if backend deployment is using correct code
echo 2. Verify auth middleware configuration in backend
echo 3. Redeploy backend if necessary
echo.
echo Open test_backend_auth_issue.html in browser for detailed testing
echo.

pause