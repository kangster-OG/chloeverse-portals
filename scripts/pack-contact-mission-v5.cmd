@echo off
setlocal

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "PATCH_DIR=%ROOT%\patch_contact_mission_v5"
set "ZIP_PATH=%ROOT%\contact-mission-v5.zip"

if exist "%PATCH_DIR%" rmdir /s /q "%PATCH_DIR%"
mkdir "%PATCH_DIR%\src\app\contact" >nul
mkdir "%PATCH_DIR%\src\components\contact" >nul
mkdir "%PATCH_DIR%\scripts" >nul

copy /y "%ROOT%\src\app\contact\page.tsx" "%PATCH_DIR%\src\app\contact\page.tsx" >nul
copy /y "%ROOT%\src\components\contact\ContactMissionV5.tsx" "%PATCH_DIR%\src\components\contact\ContactMissionV5.tsx" >nul
copy /y "%ROOT%\scripts\pack-contact-mission-v5.cmd" "%PATCH_DIR%\scripts\pack-contact-mission-v5.cmd" >nul

if exist "%ZIP_PATH%" del /f /q "%ZIP_PATH%"

pushd "%PATCH_DIR%"
tar -a -c -f "%ZIP_PATH%" ^
src\app\contact\page.tsx ^
src\components\contact\ContactMissionV5.tsx ^
scripts\pack-contact-mission-v5.cmd
if errorlevel 1 (
  popd
  echo Failed to create zip archive.
  exit /b 1
)
popd

echo Created %ZIP_PATH%
exit /b 0
