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

echo [1/2] Starting Hardware Bridge...
:: Check if it's already running to avoid duplicates
tasklist /FI "WINDOWTITLE eq LuckyBoba-HW-Bridge-Dev" 2>nul | find "node" >nul
if errorlevel 1 (
    start "LuckyBoba-HW-Bridge-Dev" /MIN cmd /c %NODE_CMD% "hardware-service.js"
    timeout /t 1 /nobreak >nul
)

:: 2. Find Firefox
set "FIREFOX="
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files\Mozilla Firefox\firefox.exe"
if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files (x86)\Mozilla Firefox\firefox.exe"

echo [2/2] Launching Firefox at localhost:5173...
if "%FIREFOX%"=="" (
    start http://localhost:9876/handshake?return=http://localhost:5173
) else (
    start "" "%FIREFOX%" "http://localhost:9876/handshake?return=http://localhost:5173"
)

echo.
echo ----------------------------------------------------
echo    SUCCESS! Firefox is opening localhost.
echo    Make sure your Vite server (npm run dev) is running!
echo ----------------------------------------------------
timeout /t 5
exit
