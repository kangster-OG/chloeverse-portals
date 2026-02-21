@echo off
setlocal

REM Apply Enchanted Post Office contact page (v2)
REM Run this from the repo root (folder that contains package.json)

if not exist package.json (
  echo ERROR: package.json not found. Run this from the chloeverse-portals repo root.
  exit /b 1
)

echo.
echo Copying files into place...
mkdir src\app\contact 2>nul
mkdir src\components\contact 2>nul

copy /y "patch_files\src\app\contact\page.tsx" "src\app\contact\page.tsx" >nul
if errorlevel 1 (echo ERROR copying page.tsx & exit /b 1)

copy /y "patch_files\src\components\contact\EnchantedPostOfficeContactExperience.tsx" "src\components\contact\EnchantedPostOfficeContactExperience.tsx" >nul
if errorlevel 1 (echo ERROR copying EnchantedPostOfficeContactExperience.tsx & exit /b 1)

copy /y "patch_files\src\components\contact\PolaroidContactHero.tsx" "src\components\contact\PolaroidContactHero.tsx" >nul
if errorlevel 1 (echo ERROR copying PolaroidContactHero.tsx & exit /b 1)

echo.
echo Done applying patch.
echo.
echo NEXT (Turbopack):
echo   rmdir /s /q .next
echo   npm run dev
echo.
exit /b 0
