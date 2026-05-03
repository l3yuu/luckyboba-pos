@echo off
set "SITE_URL=https://luckybobastores.com"
set "HANDSHAKE_URL=http://localhost:9876/handshake?return="

echo ------------------------------------------
echo    Lucky Boba POS - Mozilla Shortcut
echo ------------------------------------------
echo.

:: Dynamically find Desktop path
for /f "usebackq delims=" %%I in (`powershell "[Environment]::GetFolderPath('Desktop')"`) do set "desktopFolder=%%I"
set "shortcutPath=%desktopFolder%\Lucky Boba (Mozilla).lnk"

echo [1/1] Creating Desktop Shortcut...
echo Path: %shortcutPath%

:: Create the shortcut using PowerShell
:: We target firefox.exe directly and pass the handshake URL as an argument
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%shortcutPath%');$s.TargetPath='firefox.exe';$s.Arguments='%HANDSHAKE_URL%%SITE_URL%';$s.Save()"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ------------------------------------------
    echo    SUCCESS! 
    echo    "Lucky Boba (Mozilla)" is now on your Desktop.
    echo ------------------------------------------
) else (
    echo [ERROR] Failed to create shortcut.
)

pause
