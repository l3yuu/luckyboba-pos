@echo off
:: Detect Architecture
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "folderName=LuckyBobaPOS-win32-x64"
) else if "%PROCESSOR_ARCHITEW6432%"=="AMD64" (
    set "folderName=LuckyBobaPOS-win32-x64"
) else (
    set "folderName=LuckyBobaPOS-win32-ia32"
)
set "exeName=LuckyBobaPOS.exe"

:: Get the full path to the EXE
set "fullPath=%~dp0%folderName%\%exeName%"

:: Dynamically find Desktop and Startup paths (Works even with OneDrive)
for /f "usebackq delims=" %%I in (`powershell "[Environment]::GetFolderPath('Desktop')"`) do set "desktopFolder=%%I"
for /f "usebackq delims=" %%I in (`powershell "[Environment]::GetFolderPath('Startup')"`) do set "startupFolder=%%I"

set "desktopPath=%desktopFolder%\Lucky Boba POS.lnk"
set "startupPath=%startupFolder%\Lucky Boba POS.lnk"

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
echo Target: %desktopPath%
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%desktopPath%');$s.TargetPath='%fullPath%';$s.IconLocation='%fullPath%';$s.Save()"

echo [2/3] Setting up Auto-Start on Boot...
echo Target: %startupPath%
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%startupPath%');$s.TargetPath='%fullPath%';$s.Save()"

echo [3/3] Creating Mozilla Firefox One-Click Shortcut...
set "mozShortcut=%desktopFolder%\Lucky Boba POS.lnk"
set "launcherPath=%~dp0Launch_LuckyBoba_Mozilla.bat"
:: Create shortcut to the BAT file, but run it minimized/cleanly
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%mozShortcut%');$s.TargetPath='%launcherPath%';$s.WorkingDirectory='%~dp0';$s.Save()"

echo.
echo ------------------------------------------
echo    SUCCESS! POS is now ready on Desktop.
echo    It will also open automatically on boot.
echo ------------------------------------------
echo.

echo [3/3] Launching App now...
start "" "%fullPath%"

pause


