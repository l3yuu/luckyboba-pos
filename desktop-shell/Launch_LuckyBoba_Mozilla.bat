@echo off
title Lucky Boba POS - Mozilla Launcher
setlocal

:: Get the directory of this script
cd /d "%~dp0"

echo ------------------------------------------
echo    Lucky Boba POS - Startup (Mozilla)
echo ------------------------------------------
echo.

:: 1. Check if the bridge is already running
netstat -ano | findstr :9876 > nul
if %ERRORLEVEL% EQU 0 (
    echo [SKIP] Hardware Bridge is already running.
) else (
    echo [1/2] Starting Hardware Bridge in background...
    :: We use 'start /b' to run it in the same process tree but backgrounded
    start /b node hardware-service.js
    timeout /t 2 /nobreak > nul
)

:: 2. Launch Firefox
echo [2/2] Launching Mozilla Firefox...
set "SITE_URL=https://luckybobastores.com"
set "HANDSHAKE_URL=http://localhost:9876/handshake?return="

:: Launch Firefox with the handshake URL
start firefox.exe "%HANDSHAKE_URL%%SITE_URL%"

echo.
echo ------------------------------------------
echo    SUCCESS! POS is opening in Mozilla.
echo    Hardware ID: ACTIVE
echo ------------------------------------------
echo.

:: Briefly wait so the user sees the success message
timeout /t 3
exit
