@echo off
setlocal
cd /d "%~dp0"
if not exist "..\package.json" (
  echo PATCH_ABORT: Please extract this folder into your repo root, so package.json is one level up.
  echo Example: C:\Users\%USERNAME%\Downloads\chloeverse-portals\chloeverse_main_bg_rainbow_patch
  pause
  exit /b 1
)
pushd ".."
node "%~dp0apply_patch.js"
if errorlevel 1 (
  echo.
  echo ❌ Patch failed.
  pause
  popd
  exit /b 1
)
echo.
echo ✅ Patch applied.
echo Now run: npm run dev -- --turbo
echo (or just: npm run dev)
pause
popd
