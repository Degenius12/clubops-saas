@echo off
echo 🔐 Testing ClubOps Login...
echo.
echo Testing with working credentials:
echo Email: tonytele@gmail.com
echo Password: Admin123!
echo.
powershell -Command "try { $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -Body (@{email='tonytele@gmail.com'; password='Admin123!'} | ConvertTo-Json) -Headers @{'Content-Type'='application/json'}; Write-Host '✅ LOGIN SUCCESS!' -ForegroundColor Green; Write-Host 'Token received:' $result.token.Substring(0,50)+'...' -ForegroundColor Green } catch { Write-Host '❌ LOGIN FAILED!' -ForegroundColor Red; Write-Host 'Error:' $_.Exception.Message -ForegroundColor Red }"
echo.
echo Testing backend health:
powershell -Command "try { $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -Method GET; Write-Host '✅ BACKEND HEALTHY!' -ForegroundColor Green; Write-Host $result } catch { Write-Host '❌ BACKEND NOT RESPONDING!' -ForegroundColor Red; Write-Host 'Error:' $_.Exception.Message -ForegroundColor Red }"
echo.
pause