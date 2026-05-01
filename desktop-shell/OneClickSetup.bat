@echo off
set "folderName=LuckyBobaPOS-win32-x64"
set "exeName=LuckyBobaPOS.exe"

:: Get the full path to the EXE
set "fullPath=%~dp0%folderName%\%exeName%"
set "desktopPath=%userprofile%\Desktop\Lucky Boba POS.lnk"
set "startupPath=%appdata%\Microsoft\Windows\Start Menu\Programs\Startup\Lucky Boba POS.lnk"

echo ------------------------------------------
echo    Lucky Boba POS - One Click Setup
echo ------------------------------------------
echo.

if not exist "%fullPath%" (
    echo [ERROR] Could not find %exeName% in %folderName%
    echo Please make sure this script is NEXT to the %folderName% folder.
    pause
    exit
)

echo [1/2] Creating Desktop Shortcut...
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%desktopPath%');$s.TargetPath='%fullPath%';$s.Save()"

echo [2/2] Setting up Auto-Start on Boot...
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%startupPath%');$s.TargetPath='%fullPath%';$s.Save()"

echo.
echo ------------------------------------------
echo    SUCCESS! POS is now ready on Desktop.
echo    It will also open automatically on boot.
echo ------------------------------------------
echo.
pause
