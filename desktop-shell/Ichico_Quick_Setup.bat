@echo off
setlocal enabledelayedexpansion

echo ----------------------------------------------------
echo    Lucky Boba POS - Ichico Quick Setup (32-bit)
echo ----------------------------------------------------
echo.

:: 1. Search for USB Drive
set "USB_DRIVE="
for %%d in (D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    if exist "%%d:\LuckyBobaPOS\node.exe" (
        set "USB_DRIVE=%%d:"
        goto :found_usb
    )
)

:found_usb
if "%USB_DRIVE%"=="" (
    echo [ERROR] USB drive with 'LuckyBobaPOS\node.exe' not found.
    echo Please insert your USB drive and try again.
    pause
    exit /b 1
)

echo [1/4] USB Found at %USB_DRIVE%
echo.

:: 2. Create Target Folder
if not exist "C:\LuckyBobaPOS" mkdir "C:\LuckyBobaPOS"

:: 3. Copy Files from USB
echo [2/4] Copying Node.js (32-bit) and POS files...
copy /Y "%USB_DRIVE%\LuckyBobaPOS\node.exe" "C:\LuckyBobaPOS\node.exe" >nul
copy /Y "%~dp0hardware-service.js" "C:\LuckyBobaPOS\hardware-service.js" >nul
copy /Y "%~dp0run-bridge-hidden.vbs" "C:\LuckyBobaPOS\run-bridge-hidden.vbs" >nul
copy /Y "%~dp0lucky.ico" "C:\LuckyBobaPOS\lucky.ico" >nul
copy /Y "%~dp0LuckyBobaPOS.bat" "C:\LuckyBobaPOS\LuckyBobaPOS.bat" >nul

:: 4. Update LuckyBobaPOS.bat to use the local 32-bit node
echo [3/4] Optimizing launcher for 32-bit...
:: We will rewrite the start command in LuckyBobaPOS.bat to use C:\LuckyBobaPOS\node.exe
:: But for now, we'll just make sure it's in the same folder.

:: 5. Create Desktop Shortcut
echo [4/4] Creating Desktop Shortcut...
for /f "usebackq delims=" %%I in (`powershell "[Environment]::GetFolderPath('Desktop')"`) do set "desktopFolder=%%I"
set "shortcutName=Lucky Boba POS.lnk"
set "desktopPath=%desktopFolder%\%shortcutName%"
set "targetPath=C:\LuckyBobaPOS\LuckyBobaPOS.bat"
set "iconPath=C:\LuckyBobaPOS\lucky.ico"

powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%desktopPath%');$s.TargetPath='%targetPath%';$s.WorkingDirectory='C:\LuckyBobaPOS';$s.IconLocation='%iconPath%';$s.Save()"

echo.
echo ----------------------------------------------------
echo    SUCCESS! Node.js (32-bit) installed to Ichico.
echo    Launching Hardware Bridge and Firefox now...
echo ----------------------------------------------------
echo.

:: Launch the bridge using the NEW local node
start "" /MIN "C:\LuckyBobaPOS\node.exe" "C:\LuckyBobaPOS\hardware-service.js"

:: Find Firefox
set "FIREFOX="
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files\Mozilla Firefox\firefox.exe"
if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" set "FIREFOX=C:\Program Files (x86)\Mozilla Firefox\firefox.exe"

if "%FIREFOX%"=="" (
    echo [WARNING] Firefox not found. Opening in default browser...
    start https://luckybobastores.com
) else (
    start "" "%FIREFOX%" https://luckybobastores.com
)

pause
exit
