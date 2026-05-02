@echo off
title Lucky Boba - Bridge Debugger
cd /d "%~dp0"

echo ------------------------------------------
echo    Lucky Boba - Hardware Bridge Debug
echo ------------------------------------------
echo.

:: Check for node.exe
set "NODE_EXE=node"
if exist "%~dp0node.exe" (
    echo [OK] Found portable node.exe
    set "NODE_EXE=%~dp0node.exe"
) else (
    echo [INFO] Portable node.exe not found, trying system node...
)

echo.
echo Attempting to start bridge...
echo Command: "%NODE_EXE%" hardware-service.js
echo.

"%NODE_EXE%" hardware-service.js

echo.
echo ------------------------------------------
echo    Bridge has stopped. Read the errors above.
echo ------------------------------------------
pause
