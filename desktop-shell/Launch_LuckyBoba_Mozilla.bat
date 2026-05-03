@echo off
setlocal
cd /d "%~dp0"

echo ------------------------------------------
echo    Lucky Boba POS - Launcher and Setup
echo ------------------------------------------
echo.

:: 0. Auto-Setup Desktop Shortcut
for /f "usebackq delims=" %%I in (`powershell "[Environment]::GetFolderPath('Desktop')"`) do set "desktopFolder=%%I"
set "mozShortcut=%desktopFolder%\Lucky Boba POS.lnk"

:: Force create/update shortcut every time to be sure
echo [0/2] Ensuring Desktop Shortcut is ready...
echo $s = (New-Object -COM WScript.Shell).CreateShortcut('%mozShortcut%') > "%temp%\lb_shortcut.ps1"
echo $s.TargetPath = '%~f0' >> "%temp%\lb_shortcut.ps1"
echo $s.WorkingDirectory = '%~dp0' >> "%temp%\lb_shortcut.ps1"
echo if (Test-Path '%~dp0lucky.ico') { $s.IconLocation = '%~dp0lucky.ico' } elseif (Test-Path '%~dp0lucky') { $s.IconLocation = '%~dp0lucky' } >> "%temp%\lb_shortcut.ps1"
echo $s.Save() >> "%temp%\lb_shortcut.ps1"
powershell -ExecutionPolicy Bypass -File "%temp%\lb_shortcut.ps1" > nul 2>&1
del "%temp%\lb_shortcut.ps1"

:: 1. Start the Bridge (Silent)
echo [1/2] Starting Bridge...
wscript.exe "run-bridge-hidden.vbs"

:: Wait a moment
timeout /t 2

:: Launch Firefox
start firefox "http://localhost:9876/handshake?return=https://luckybobastores.com"

exit
