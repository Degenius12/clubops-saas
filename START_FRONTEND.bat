@echo off
echo 🚀 Starting ClubOps Frontend...
cd /d "C:\Users\tonyt\ClubOps-SaaS\frontend"
echo 📁 Current directory: %CD%
echo 🔍 Checking if frontend files exist...
if exist "package.json" (
    echo ✅ Frontend files found
    echo 🚀 Starting frontend on port 3000...
    npm run dev
) else (
    echo ❌ Frontend files not found in current directory
    echo 📁 Please check the frontend directory path
    pause
)
pause