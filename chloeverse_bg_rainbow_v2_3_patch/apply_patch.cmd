@echo off
setlocal
cd /d "%~dp0"

echo [Chloeverse] Background rainbow: curved-only + mask anti-alias (v2_3)
node apply_patch.js
if errorlevel 1 (
  echo.
  echo PATCH FAILED.
  exit /b 1
)

echo.
echo ✅ Patch applied.
echo Now restart dev (recommended):
 echo   rmdir /s /q .next ^>nul 2^>nul
 echo   npm run dev -- --turbo

echo.
pause
