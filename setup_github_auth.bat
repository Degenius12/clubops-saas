@echo off
echo =====================================
echo GitHub CLI Authentication Setup
echo =====================================
echo.
echo This will authenticate GitHub CLI with your GitHub account.
echo You will be prompted to log in via your browser.
echo.

"C:\Program Files\GitHub CLI\gh.exe" auth login --web

echo.
echo After authentication, checking status...
"C:\Program Files\GitHub CLI\gh.exe" auth status

echo.
echo Verifying repository access...
"C:\Program Files\GitHub CLI\gh.exe" repo view Degenius12/clubops-saas --json name,visibility

pause