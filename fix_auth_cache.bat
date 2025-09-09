#!/bin/bash
# ClubOps SaaS - Auth Fix Script
# This script clears all cached authentication data and restarts the frontend

echo "🔧 ClubOps SaaS Authentication Fix"
echo "=================================="

# 1. Stop any running frontend processes
echo "🛑 Stopping frontend processes..."
# Kill any processes using port 3000
netstat -ano | findstr :3000 > nul 2>&1
if %errorlevel% == 0 (
    echo "Stopping processes on port 3000..."
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3000') do taskkill /PID %%i /F > nul 2>&1
)

# 2. Clear browser storage (if needed)
echo "🧹 Browser storage should be cleared manually:"
echo "   1. Open browser DevTools (F12)"
echo "   2. Go to Application > Storage"
echo "   3. Click 'Clear site data'"

# 3. Navigate to frontend directory and clear cache
echo "📁 Navigating to frontend directory..."
cd /d "C:\Users\tonyt\ClubOps-SaaS\frontend"

# 4. Clear node modules cache and reinstall if needed
echo "🔄 Clearing npm cache..."
npm cache clean --force

# 5. Clear any build cache
echo "🗑️ Clearing build cache..."
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "dist" rmdir /s /q "dist"

# 6. Start fresh frontend server
echo "🚀 Starting fresh frontend development server..."
echo "⏳ This will start the server with cleared cache..."
start cmd /k "npm run dev"

echo ""
echo "✅ AUTH FIX STEPS COMPLETED!"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Wait for development server to start"
echo "2. Open browser in incognito/private mode"  
echo "3. Go to http://localhost:3000"
echo "4. Try logging in again"
echo ""
echo "📝 If still having issues:"
echo "   - Check browser DevTools Network tab"
echo "   - Look for Authorization headers in login requests"
echo "   - Verify no old tokens in localStorage"
echo ""
