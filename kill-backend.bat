@echo off
echo Stopping backend server on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo Done.
timeout /t 2
