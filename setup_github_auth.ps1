Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "GitHub CLI Authentication Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if gh is in PATH or use full path
$ghPath = "C:\Program Files\GitHub CLI\gh.exe"
if (!(Test-Path $ghPath)) {
    $ghPath = "gh"
}

Write-Host "Step 1: Authenticating with GitHub..." -ForegroundColor Yellow
Write-Host "You will be redirected to your browser to complete authentication."
Write-Host ""

# Authenticate with GitHub
& $ghPath auth login --web --git-protocol https

Write-Host ""
Write-Host "Step 2: Checking authentication status..." -ForegroundColor Yellow
& $ghPath auth status

Write-Host ""
Write-Host "Step 3: Verifying repository access..." -ForegroundColor Yellow
& $ghPath repo view Degenius12/clubops-saas --json name,visibility,owner

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "You can now run: claude install-github-app" -ForegroundColor Cyan