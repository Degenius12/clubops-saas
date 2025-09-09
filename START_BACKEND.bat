@echo off
echo 🚀 Starting ClubOps Backend...
cd /d "C:\Users\tonyt\ClubOps-SaaS\backend"
echo 📁 Current directory: %CD%
echo 🔍 Checking if backend files exist...
if exist "api\index.js" (
    echo ✅ Backend files found
    echo 🚀 Starting backend on port 3001...
    npm start
) else (
    echo ❌ Backend files not found in current directory
    echo 📁 Please check the backend directory path
    pause
)
pause