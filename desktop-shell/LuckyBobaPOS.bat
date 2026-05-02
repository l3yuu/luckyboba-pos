@echo off
:: ──────────────────────────────────────────────────────────────────────────────
:: Lucky Boba POS - Chrome Launcher
:: Starts the Hardware ID service silently, then opens Chrome in App Mode.
:: The cashier sees a clean, native-looking window with full print preview.
:: ──────────────────────────────────────────────────────────────────────────────

:: Get the directory this script lives in
set "SCRIPT_DIR=%~dp0"

:: ── Step 1: Start Hardware Bridge Service (hidden, no console window) ────────
:: Check if it's already running to avoid duplicates
tasklist /FI "WINDOWTITLE eq LuckyBoba-HW-Bridge" 2>nul | find "node" >nul
if errorlevel 1 (
    start "LuckyBoba-HW-Bridge" /MIN cmd /c "node "%SCRIPT_DIR%hardware-service.js""
    :: Give the service a moment to boot
    timeout /t 1 /nobreak >nul
)

:: ── Step 2: Find Chrome ──────────────────────────────────────────────────────
set "CHROME="

:: Try standard 64-bit location
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
)

:: Try 32-bit location (ICHICO tablet)
if "%CHROME%"=="" (
    if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
        set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    )
)

:: Try user-level Chrome install
if "%CHROME%"=="" (
    if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
        set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    )
)

:: Fallback: try to find via registry
if "%CHROME%"=="" (
    for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do set "CHROME=%%B"
)

if "%CHROME%"=="" (
    echo [ERROR] Google Chrome is not installed on this computer.
    echo Please install Google Chrome first.
    pause
    exit /b 1
)

:: ── Step 3: Launch Chrome in App Mode ────────────────────────────────────────
:: --app= : Opens in a clean window (no tabs, no URL bar, no bookmarks)
:: --start-fullscreen : Opens fullscreen like the Electron shell did
:: --disable-infobars : Removes "Chrome is being controlled" banner
start "" "%CHROME%" --app=https://luckybobastores.com --start-fullscreen --disable-infobars

exit
