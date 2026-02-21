@echo off
setlocal

REM Apply Pixel Rocket (sprite-art) contact page patch v1
REM Run this from the repo root (folder that contains package.json)

if not exist package.json (
  echo ERROR: package.json not found. Run this from the chloeverse-portals repo root.
  exit /b 1
)

echo.
echo Copying files into place...
mkdir src\app\contact 2>nul
mkdir src\components\contact 2>nul
mkdir public\contact\pixelrocket 2>nul

copy /y "patch_files\src\app\contact\page.tsx" "src\app\contact\page.tsx" >nul
if errorlevel 1 (echo ERROR copying page.tsx & exit /b 1)

copy /y "patch_files\src\components\contact\PixelRocketContactExperience.tsx" "src\components\contact\PixelRocketContactExperience.tsx" >nul
if errorlevel 1 (echo ERROR copying PixelRocketContactExperience.tsx & exit /b 1)

copy /y "patch_files\src\components\contact\PolaroidContactHero.tsx" "src\components\contact\PolaroidContactHero.tsx" >nul
if errorlevel 1 (echo ERROR copying PolaroidContactHero.tsx & exit /b 1)

xcopy /y /i /e "patch_files\public\contact\pixelrocket" "public\contact\pixelrocket" >nul

echo.
echo Done applying patch.
echo NEXT:
echo   taskkill /f /im node.exe
echo   rmdir /s /q .next
echo   npm run dev
echo.
exit /b 0
