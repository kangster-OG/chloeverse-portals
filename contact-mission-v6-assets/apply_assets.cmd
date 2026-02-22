\
@echo off
setlocal enabledelayedexpansion

echo.
echo [Contact Mission v6] Installing assets...
echo.

set SRC=%~dp0payload
if not exist "%SRC%\public\contact\mission_v6" (
  echo ERROR: payload\public\contact\mission_v6 not found.
  echo Make sure you extracted the zip and are running this .cmd from its folder.
  exit /b 1
)

if not exist "public\contact" mkdir "public\contact" >nul 2>&1
if not exist "public\contact\mission_v6" mkdir "public\contact\mission_v6" >nul 2>&1

xcopy /E /I /Y "%SRC%\public\contact\mission_v6" "public\contact\mission_v6" >nul

echo OK: Installed to public\contact\mission_v6
echo.
echo Next: run the single Codex prompt to implement ContactMissionV6.
echo.
exit /b 0
