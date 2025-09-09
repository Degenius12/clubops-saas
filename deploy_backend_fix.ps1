# PowerShell Deployment Script for ClubOps Backend Fix
# Run these commands in PowerShell to deploy the backend fixes

Write-Host "🚀 ClubOps Backend Deployment (PowerShell)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 FIXES APPLIED:" -ForegroundColor Yellow
Write-Host "✅ Updated vercel.json with correct frontend URL" -ForegroundColor Green
Write-Host "✅ Fixed CORS configuration" -ForegroundColor Green  
Write-Host "✅ Fixed login endpoint status code (400 → 401)" -ForegroundColor Green
Write-Host ""

Write-Host "📁 Navigating to backend directory..." -ForegroundColor Cyan
Set-Location -Path "backend"

Write-Host ""
Write-Host "🔍 Current directory:" -ForegroundColor Cyan
Get-Location

Write-Host ""
Write-Host "📦 Checking Vercel CLI..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>$null
    if ($vercelVersion) {
        Write-Host "✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "🚀 DEPLOYING TO VERCEL..." -ForegroundColor Magenta
Write-Host ""

# Deploy to Vercel
vercel --prod

Write-Host ""
Write-Host "🧪 Testing deployment..." -ForegroundColor Cyan

Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "https://clubops-backend-vercel-kmhv.vercel.app/health" -Method Get
    Write-Host "✅ Health check: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing login endpoint..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@clubops.com"
        password = "password"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
        "Origin" = "https://clubops-saas-platform.vercel.app"
    }

    $loginResponse = Invoke-RestMethod -Uri "https://clubops-backend-vercel-kmhv.vercel.app/api/auth/login" -Method Post -Body $loginBody -Headers $headers
    
    if ($loginResponse.token) {
        Write-Host "✅ Login successful! Token received." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Login response received but no token found." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Login test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test login at: https://clubops-saas-platform.vercel.app" -ForegroundColor White
Write-Host "2. Use credentials: admin@clubops.com / password" -ForegroundColor White
Write-Host "3. Check browser console for any remaining errors" -ForegroundColor White
Write-Host ""

Write-Host "🔧 If login still fails, check:" -ForegroundColor Yellow
Write-Host "- Frontend environment variables (.env)" -ForegroundColor White
Write-Host "- Browser network tab for CORS errors" -ForegroundColor White
Write-Host "- Use test_backend_auth_issue.html for detailed testing" -ForegroundColor White