@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ----------------------------------------------------
echo    Lucky Boba POS - LOCALHOST TEST MODE
echo    Target: http://localhost:5173
echo ----------------------------------------------------
echo.

:: 1. Start Hardware Bridge Service
set "NODE_CMD=node"

:: Check for local node.exe
if exist "%~dp0node.exe" (
    set "NODE_CMD="%~dp0node.exe""
    echo [OK] Using portable node.exe
) else if exist "C:\LuckyBobaPOS\node.exe" (
    set "NODE_CMD="C:\LuckyBobaPOS\node.exe""
    echo [OK] Using C:\LuckyBobaPOS\node.exe
) else (
    where node >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] Node.js is not installed or not in PATH.
        echo Please install Node.js to use the Hardware Bridge.
        pause
        exit /b 1
    )
    echo [OK] Using system node
)

echo [1/2] Checking Hardware Bridge...
:: Check if port 9876 is already in use
netstat -ano | findstr :9876 >nul
if errorlevel 1 (
    echo Starting new Hardware Bridge...
    :: Use absolute path for the script to ensure it's found
    start "LuckyBoba-HW-Bridge-Dev" /MIN cmd /c %NODE_CMD% "%~dp0hardware-service.js"
    
    :: Wait for bridge to initialize (up to 5 seconds)
    echo Waiting for bridge to initialize...
    for /L %%i in (1,1,5) do (
        timeout /t 1 /nobreak >nul
        netstat -ano | findstr :9876 >nul
        if not errorlevel 1 goto :bridge_ready
        echo   ...still waiting (%%i/5)
    )
    
    echo [ERROR] Failed to start Hardware Bridge after 5 seconds! 
    echo Please try running 'Debug_Bridge.bat' to see the errors.
    pause
    exit /b 1
) else (
    echo [OK] Hardware Bridge is already running.
)

:bridge_ready
echo [OK] Hardware Bridge is active.

:: 2. Find Firefox
set "FIREFOX="

:: Try standard locations
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files\Mozilla Firefox\firefox.exe"
if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files (x86)\Mozilla Firefox\firefox.exe"

:: Try registry fallback
if "!FIREFOX!"=="" (
    for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe" /ve 2^>nul') do set "FIREFOX=%%B"
)

echo [2/2] Launching browser...
if "!FIREFOX!"=="" (
    echo [INFO] Firefox not found in standard paths, using default browser.
    start http://127.0.0.1:9876/handshake?return=http://localhost:5173
) else (
    echo [OK] Opening Firefox...
    start "" "!FIREFOX!" "http://127.0.0.1:9876/handshake?return=http://localhost:5173"
)

echo.
echo ----------------------------------------------------
echo    SUCCESS! Browser is opening localhost.
echo    Make sure your Vite server (npm run dev) is running!
echo ----------------------------------------------------
timeout /t 5
exit
