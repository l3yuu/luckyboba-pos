@echo off
setlocal
cd /d "%~dp0"

echo ----------------------------------------------------
echo    Lucky Boba POS - LOCALHOST TEST MODE
echo    Target: http://localhost:5173
echo ----------------------------------------------------
echo.

:: 1. Start Hardware Bridge Service
:: Use local node.exe if available
set "NODE_CMD=node"
if exist "C:\LuckyBobaPOS\node.exe" (
    set "NODE_CMD="C:\LuckyBobaPOS\node.exe""
) else if exist "%~dp0node.exe" (
    set "NODE_CMD="%~dp0node.exe""
)

echo [1/2] Checking Hardware Bridge...
:: Check if port 9876 is already in use
netstat -ano | findstr :9876 >nul
if errorlevel 1 (
    echo Starting new Hardware Bridge...
    start "LuckyBoba-HW-Bridge-Dev" /MIN cmd /c %NODE_CMD% "hardware-service.js"
    
    :: Wait and verify it started
    echo Waiting for bridge to initialize...
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr :9876 >nul
    if errorlevel 1 (
        echo [ERROR] Failed to start Hardware Bridge! 
        echo Please try running 'Debug_Bridge.bat' to see why.
        pause
        exit /b 1
    )
) else (
    echo [OK] Hardware Bridge is already running.
)

:: 2. Find Firefox
set "FIREFOX="
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files\Mozilla Firefox\firefox.exe"
if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files (x86)\Mozilla Firefox\firefox.exe"

echo [2/2] Launching Firefox at 127.0.0.1:5173...
if "%FIREFOX%"=="" (
    start http://127.0.0.1:9876/handshake?return=http://localhost:5173
) else (
    start "" "%FIREFOX%" "http://127.0.0.1:9876/handshake?return=http://localhost:5173"
)

echo.
echo ----------------------------------------------------
echo    SUCCESS! Firefox is opening localhost.
echo    Make sure your Vite server (npm run dev) is running!
echo ----------------------------------------------------
timeout /t 5
exit
