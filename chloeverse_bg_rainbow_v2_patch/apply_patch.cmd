@echo off
setlocal
cd /d %~dp0
node apply_patch.js
if errorlevel 1 exit /b 1
echo.
echo ✅ Patch applied.
echo Now run: npm run dev -- --turbo
pause
