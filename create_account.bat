@echo off
echo 🆕 Create New ClubOps Account
echo.
set /p firstName="Enter your first name: "
set /p lastName="Enter your last name: "
set /p clubName="Enter your club name: "
set /p subdomain="Enter subdomain (unique, no spaces): "
set /p email="Enter your email: "
set /p password="Enter your password: "
echo.
echo Creating account...
powershell -Command "try { $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' -Method POST -Body (@{firstName='%firstName%'; lastName='%lastName%'; clubName='%clubName%'; subdomain='%subdomain%'; email='%email%'; password='%password%'; confirmPassword='%password%'} | ConvertTo-Json) -Headers @{'Content-Type'='application/json'}; Write-Host '✅ ACCOUNT CREATED SUCCESSFULLY!' -ForegroundColor Green; Write-Host 'You can now login with:' -ForegroundColor Green; Write-Host 'Email: %email%' -ForegroundColor Yellow; Write-Host 'Password: %password%' -ForegroundColor Yellow } catch { Write-Host '❌ ACCOUNT CREATION FAILED!' -ForegroundColor Red; Write-Host 'Error:' $_.Exception.Message -ForegroundColor Red }"
echo.
pause