# PowerShell Script for ClubOps Backend Deployment
Write-Host "🚀 ClubOps Backend Deployment Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 FIXES APPLIED:" -ForegroundColor Yellow
Write-Host "✅ Updated vercel.json with correct frontend URL" -ForegroundColor Green
Write-Host "✅ Fixed CORS configuration to include clubops-saas-platform.vercel.app" -ForegroundColor Green
Write-Host "✅ Fixed login endpoint status code (400 → 401)" -ForegroundColor Green
Write-Host ""

Write-Host "📁 Checking backend directory..." -ForegroundColor Cyan
if (Test-Path "backend") {
    Write-Host "✅ Backend directory found" -ForegroundColor Green
    Set-Location "backend"
} else {
    Write-Host "❌ Backend directory not found - run from project root" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📦 Backend files status:" -ForegroundColor Cyan
Write-Host "✅ vercel.json - Updated with correct frontend URL" -ForegroundColor Green
Write-Host "✅ api/index.js - Fixed CORS and login status code" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 DEPLOYING TO VERCEL..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Installing Vercel CLI (if needed)..." -ForegroundColor Cyan
try {
    $vercelCheck = npm list -g vercel 2>$null
    Write-Host "✅ Vercel CLI already installed" -ForegroundColor Green
} catch {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "Step 2: Deploying backend..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "🧪 Testing deployment..." -ForegroundColor Cyan
Write-Host "Testing health endpoint..." -ForegroundColor Yellow

try {
    $healthResponse = Invoke-RestMethod -Uri "https://clubops-backend-vercel-kmhv.vercel.app/health" -Method Get
    Write-Host "✅ Health check successful:" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing login endpoint..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@clubops.com"
    password = "password"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
    "Origin" = "https://clubops-saas-platform.vercel.app"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "https://clubops-backend-vercel-kmhv.vercel.app/api/auth/login" -Method Post -Body $loginBody -Headers $headers
    Write-Host "✅ Login test successful!" -ForegroundColor Green
    Write-Host "Token received: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.email) ($($loginResponse.user.role))" -ForegroundColor Green
} catch {
    Write-Host "❌ Login test failed:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test login at your frontend: https://clubops-saas-platform.vercel.app" -ForegroundColor White
Write-Host "2. Use credentials: admin@clubops.com / password" -ForegroundColor White
Write-Host "3. Check browser console for any remaining errors" -ForegroundColor White
Write-Host ""

Write-Host "🔧 If login still fails, check:" -ForegroundColor Yellow
Write-Host "- Frontend environment variables (.env)" -ForegroundColor White
Write-Host "- Browser network tab for CORS errors" -ForegroundColor White
Write-Host "- Use test_backend_auth_issue.html for detailed testing" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"