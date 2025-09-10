@echo off
echo 🧹 ClubOps-SaaS Directory Cleanup
echo Removing emergency repair files...

REM Remove emergency repair files
del AUTHENTICATION_*.* /Q 2>nul
del DEPLOYMENT_*.* /Q 2>nul
del EMERGENCY_*.* /Q 2>nul
del FINAL_*.* /Q 2>nul
del HANDOFF*.* /Q 2>nul
del *_FIX*.* /Q 2>nul
del *_REPAIR*.* /Q 2>nul
del *_STATUS*.* /Q 2>nul
del debug_*.* /Q 2>nul
del test_*.* /Q 2>nul
del fix_*.* /Q 2>nul
del clear_*.* /Q 2>nul
del check_*.* /Q 2>nul
del *_test.html /Q 2>nul
del *_debug.html /Q 2>nul
del deploy-*.* /Q 2>nul
del force-*.* /Q 2>nul
del quick-*.* /Q 2>nul
del sync_*.* /Q 2>nul
del verify_*.* /Q 2>nul

echo ✅ Cleanup complete!
echo 📁 Project structure now clean and maintainable
pause