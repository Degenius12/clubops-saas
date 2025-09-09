# PowerShell script to test ClubOps backend
Write-Host "🔍 Testing ClubOps Backend Status" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

$backendUrl = "https://clubops-backend-vercel-kmhv.vercel.app"
$frontendUrl = "https://clubops-saas-platform.vercel.app"

Write-Host "📡 Testing Backend Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/health" -Method GET -ContentType "application/json"
    Write-Host "✅ Health Check Success:" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health Check Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "🔐 Testing Login Endpoint..." -ForegroundColor Yellow

$loginData = @{
    email = "admin@clubops.com"
    password = "password"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
    "Origin" = $frontendUrl
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginData -Headers $headers
    Write-Host "✅ Login Success:" -ForegroundColor Green
    Write-Host ($loginResponse | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login Failed:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "" -ForegroundColor Red
        Write-Host "🚨 DIAGNOSIS: 401 Unauthorized suggests:" -ForegroundColor Red
        Write-Host "1. Backend auth middleware is protecting login endpoint" -ForegroundColor Red
        Write-Host "2. CORS issue with Origin header" -ForegroundColor Red
        Write-Host "3. Backend deployment has wrong version" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "✅ SOLUTION: Deploy backend fixes by running:" -ForegroundColor Yellow
        Write-Host ".\deploy_backend_fix.bat" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "🧪 Testing CORS Preflight..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
        "Origin" = $frontendUrl
    }
    
    $corsResponse = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method OPTIONS -Headers $corsHeaders
    Write-Host "✅ CORS Preflight Success - Status: $($corsResponse.StatusCode)" -ForegroundColor Green
    
    $corsAllowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    if ($corsAllowOrigin) {
        Write-Host "✅ CORS Allow-Origin: $corsAllowOrigin" -ForegroundColor Green
    } else {
        Write-Host "❌ No CORS Allow-Origin header" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ CORS Preflight Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 SUMMARY:" -ForegroundColor Green
Write-Host "==========" -ForegroundColor Green
Write-Host "If login failed with 401 error, run: .\deploy_backend_fix.bat" -ForegroundColor Yellow
Write-Host "Then test again with: .\test_backend.ps1" -ForegroundColor Yellow
Write-Host ""