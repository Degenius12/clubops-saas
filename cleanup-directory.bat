@echo off
REM ClubOps-SaaS Directory Cleanup Script
REM Moves emergency repair files to archive folder

echo Starting ClubOps-SaaS directory cleanup...

REM Create archive subdirectories
mkdir "archive\emergency-fixes" 2>nul
mkdir "archive\deployment-scripts" 2>nul  
mkdir "archive\documentation" 2>nul
mkdir "archive\test-files" 2>nul

REM Move emergency repair files
echo Moving emergency files...
move "AUTHENTICATION_*.md" "archive\emergency-fixes\" 2>nul
move "EMERGENCY_*.md" "archive\emergency-fixes\" 2>nul
move "CRITICAL_*.md" "archive\emergency-fixes\" 2>nul
move "URGENT_*.md" "archive\emergency-fixes\" 2>nul
move "*auth_test*.html" "archive\test-files\" 2>nul
move "*debug*.html" "archive\test-files\" 2>nul
move "*test*.html" "archive\test-files\" 2>nul
move "clear_*.js" "archive\emergency-fixes\" 2>nul
move "fix_*.bat" "archive\emergency-fixes\" 2>nul
move "emergency-repair.*" "archive\emergency-fixes\" 2>nul

REM Move deployment scripts  
echo Moving deployment scripts...
move "*deploy*.bat" "archive\deployment-scripts\" 2>nul
move "*deploy*.sh" "archive\deployment-scripts\" 2>nul
move "*deploy*.ps1" "archive\deployment-scripts\" 2>nul
move "verify_*.bat" "archive\deployment-scripts\" 2>nul
move "verify_*.js" "archive\deployment-scripts\" 2>nul

REM Move redundant documentation
echo Moving documentation...
move "HANDOFF*.md" "archive\documentation\" 2>nul
move "*HANDOFF*.md" "archive\documentation\" 2>nul
move "FINAL_*.md" "archive\documentation\" 2>nul
move "COMPLETE_*.md" "archive\documentation\" 2>nul
move "CORRECTED_*.md" "archive\documentation\" 2>nul
move "DEPLOYMENT_*_STATUS.md" "archive\documentation\" 2>nul
move "CONNECTIVITY_*.md" "archive\documentation\" 2>nul

REM Move test scripts
echo Moving test scripts...
move "test_*.js" "archive\test-files\" 2>nul
move "test_*.bat" "archive\test-files\" 2>nul
move "diagnostic-*.js" "archive\test-files\" 2>nul

echo.
echo ✅ Directory cleanup complete!
echo.
echo 📁 Files organized in archive folder:
echo    - archive\emergency-fixes\
echo    - archive\deployment-scripts\ 
echo    - archive\documentation\
echo    - archive\test-files\
echo.
echo 🚀 Project directory is now clean and production-ready!
pause
