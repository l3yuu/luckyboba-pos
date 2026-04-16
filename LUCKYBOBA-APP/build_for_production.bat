@echo off
echo Starting production build for Lucky Boba...
flutter build apk --release --dart-define=APP_ENV=production
pause
