@echo off
echo Starting ClubOps Deployment Fix...
echo.
PowerShell -ExecutionPolicy Bypass -File "%~dp0Fix-Deployment.ps1"
pause
