@echo off
echo ========================================
echo ClubFlow - Start Backend and Run Tests
echo ========================================
echo.

echo Starting backend server...
cd backend
start "ClubFlow Backend" cmd /k "npm start"

echo.
echo Waiting 10 seconds for server to start...
timeout /t 10 /nobreak

echo.
echo Backend should be running at http://localhost:5000
echo.

cd ..

echo Running test suite...
node test-features-26-47.js

echo.
echo ========================================
echo Tests Complete
echo ========================================
echo.
echo Press any key to exit...
pause
