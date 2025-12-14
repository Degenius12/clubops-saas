# ClubOps Deployment Fix Script (PowerShell)
# Fixes Frontend-Backend URL Synchronization with Vercel Environment Variables

param(
    [switch]$SkipVercelEnv,
    [switch]$LocalOnly,
    [string]$BackendUrl = "https://clubops-backend.vercel.app"
)

$ErrorActionPreference = "Stop"

# Configuration
$ProjectDir = "C:\Users\tonyt\ClubOps-SaaS"
$FrontendDir = "$ProjectDir\frontend"
$BackendDir = "$ProjectDir\backend"

# Colors
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Step { param($num, $msg) Write-Host "`nStep $num`: $msg" -ForegroundColor Cyan; Write-Host ("=" * 50) }

Clear-Host
Write-Host @"
============================================================
   ClubOps Deployment Fix Script (PowerShell)
   Fixes Frontend-Backend URL Synchronization
============================================================
"@ -ForegroundColor Cyan

Write-Host "`nTarget Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# Step 1: Prerequisites Check
Write-Step 1 "Checking prerequisites"

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed"
    exit 1
}
Write-Success "Node.js found: $(node --version)"

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed"
    exit 1
}
Write-Success "npm found: $(npm --version)"

# Check/Install Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Warning "Vercel CLI not found. Installing..."
    npm install -g vercel
}
Write-Success "Vercel CLI found"

# Step 2: Verify Backend
Write-Step 2 "Verifying backend is accessible"

try {
    $healthCheck = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -TimeoutSec 10
    Write-Success "Backend is healthy: $($healthCheck.message)"
    Write-Host "  Version: $($healthCheck.version)" -ForegroundColor Gray
    Write-Host "  Database: $($healthCheck.database_connected)" -ForegroundColor Gray
} catch {
    Write-Error "Backend is not accessible at $BackendUrl"
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Update Local Environment Files
Write-Step 3 "Updating local environment files"

Set-Location $FrontendDir

# Update .env.production
$envProduction = @"
VITE_API_URL=$BackendUrl
VITE_APP_NAME=ClubOps
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_FORCE_REBUILD=true
"@
$envProduction | Out-File -FilePath ".env.production" -Encoding UTF8 -NoNewline
Write-Success "Updated .env.production"

# Update .env.local
$envLocal = @"
VITE_API_URL=$BackendUrl
VITE_APP_NAME=ClubOps
"@
$envLocal | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline
Write-Success "Updated .env.local"

# Update .env (main)
$envMain = @"
VITE_API_URL=$BackendUrl
VITE_APP_NAME=ClubOps
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
"@
$envMain | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
Write-Success "Updated .env"

if ($LocalOnly) {
    Write-Host "`nLocal files updated. Skipping deployment." -ForegroundColor Yellow
    exit 0
}

# Step 4: Update Vercel Environment Variables
if (-not $SkipVercelEnv) {
    Write-Step 4 "Updating Vercel environment variables"
    
    Write-Info "Checking Vercel authentication..."
    $vercelUser = vercel whoami 2>$null
    if (-not $vercelUser) {
        Write-Warning "Not logged in to Vercel. Please log in:"
        vercel login
    } else {
        Write-Success "Logged in as: $vercelUser"
    }
    
    Write-Info "Linking to Vercel project (if not already linked)..."
    if (-not (Test-Path ".vercel")) {
        vercel link --yes
    }
    
    Write-Info "Removing old VITE_API_URL from Vercel..."
    # Remove existing env var (ignore errors if it doesn't exist)
    vercel env rm VITE_API_URL production --yes 2>$null
    vercel env rm VITE_API_URL preview --yes 2>$null
    vercel env rm VITE_API_URL development --yes 2>$null
    
    Write-Info "Adding new VITE_API_URL to Vercel..."
    # Add new env var using echo to pipe the value
    echo $BackendUrl | vercel env add VITE_API_URL production
    echo $BackendUrl | vercel env add VITE_API_URL preview
    echo $BackendUrl | vercel env add VITE_API_URL development
    
    Write-Success "Vercel environment variables updated"
}

# Step 5: Build Frontend
Write-Step 5 "Building frontend"

Write-Info "Installing dependencies..."
npm install --silent

Write-Info "Building production bundle..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}
Write-Success "Frontend built successfully"

# Step 6: Deploy to Vercel
Write-Step 6 "Deploying to Vercel Production"

Write-Info "Deploying..."
$deployOutput = vercel --prod --yes 2>&1

if ($LASTEXITCODE -eq 0) {
    # Extract deployment URL from output
    $deployUrl = $deployOutput | Select-String -Pattern "https://.*\.vercel\.app" | Select-Object -First 1
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend URL: $deployUrl" -ForegroundColor Cyan
    Write-Host "Backend URL:  $BackendUrl" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Warning "Vercel deployment had issues. Trying GitHub push..."
    
    Set-Location $ProjectDir
    git add -A
    git commit -m "fix: sync frontend API URL to $BackendUrl"
    git push origin main 2>$null
    if ($LASTEXITCODE -ne 0) {
        git push origin master
    }
    
    Write-Success "Changes pushed to GitHub. Vercel will auto-deploy."
}

# Step 7: Post-Deployment Verification
Write-Step 7 "Post-deployment instructions"

Write-Host @"

NEXT STEPS:
-----------
1. Wait 1-2 minutes for deployment to propagate
2. Clear your browser cache (Ctrl+Shift+Delete)
3. Visit the frontend URL and test login

TEST CREDENTIALS:
-----------------
Email:    admin@clubops.com
Password: password

VERIFICATION COMMANDS:
----------------------
# Test backend health:
curl $BackendUrl/health

# Test login API:
curl -X POST $BackendUrl/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@clubops.com","password":"password"}'

"@ -ForegroundColor Gray

Write-Host "Script completed!" -ForegroundColor Green
