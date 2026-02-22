@echo off
setlocal
cd /d "%~dp0"
node "%~dp0apply_patch.js"
if errorlevel 1 (
  echo.
  echo Patch failed.
  pause
  exit /b 1
)
echo.
echo ✅ Patch applied.
echo Now run: npm run dev -- --turbo
pause
