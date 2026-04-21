@echo off
echo Starting production build for Lucky Boba...
echo.
echo === Building APK (for direct install) ===
flutter build apk --release --dart-define=APP_ENV=production
echo.
echo === Building AAB (for Google Play Store) ===
flutter build appbundle --release --dart-define=APP_ENV=production
echo.
echo Done! Files located at:
echo   APK: build\app\outputs\flutter-apk\app-release.apk
echo   AAB: build\app\outputs\bundle\release\app-release.aab
pause
