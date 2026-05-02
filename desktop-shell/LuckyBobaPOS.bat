@echo off
:: ──────────────────────────────────────────────────────────────────────────────
:: Lucky Boba POS - Firefox Launcher
:: Starts the Hardware ID service silently, then opens Firefox.
:: ──────────────────────────────────────────────────────────────────────────────

:: Get the directory this script lives in
set "SCRIPT_DIR=%~dp0"

:: ── Step 1: Start Hardware Bridge Service (hidden, no console window) ────────
:: Use local node.exe (32-bit) if available, otherwise fallback to global node
set "NODE_CMD=node"
if exist "%SCRIPT_DIR%node.exe" (
    set "NODE_CMD="%SCRIPT_DIR%node.exe""
)

:: Check if it's already running to avoid duplicates
tasklist /FI "WINDOWTITLE eq LuckyBoba-HW-Bridge" 2>nul | find "node" >nul
if errorlevel 1 (
    start "LuckyBoba-HW-Bridge" /MIN cmd /c %NODE_CMD% "%SCRIPT_DIR%hardware-service.js"
    :: Give the service a moment to boot
    timeout /t 1 /nobreak >nul
)

:: ── Step 2: Find Firefox ─────────────────────────────────────────────────────
set "FIREFOX="

:: Try standard 64-bit location
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    set "FIREFOX=C:\Program Files\Mozilla Firefox\firefox.exe"
)

:: Try 32-bit location (ICHICO tablet)
if "%FIREFOX%"=="" (
    if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" (
        set "FIREFOX=C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
    )
)

:: Fallback: try to find via registry
if "%FIREFOX%"=="" (
    for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe" /ve 2^>nul') do set "FIREFOX=%%B"
)

if "%FIREFOX%"=="" (
    echo [ERROR] Mozilla Firefox is not installed on this computer.
    echo Please install Firefox first.
    pause
    exit /b 1
)

:: ── Step 3: Launch Firefox (Windowed mode) ───────────────────────────────────
:: Removed --kiosk so it opens in a regular window
start "" "%FIREFOX%" https://luckybobastores.com

exit
