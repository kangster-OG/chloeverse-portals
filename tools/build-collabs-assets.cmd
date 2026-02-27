@echo off
setlocal

if not exist public\assets\models\collabs mkdir public\assets\models\collabs
if not exist art\blender mkdir art\blender

call .\BLENDER.cmd --background --python tools\blender\generate_home_blockout.py -- --blend art\blender\collabs.blend
if errorlevel 1 exit /b %errorlevel%
if not exist art\blender\collabs.blend (
  echo ERROR: art\blender\collabs.blend was not generated.
  exit /b 1
)

call .\BLENDER.cmd --background --python tools\blender\generate_gallery_blockout.py -- --blend art\blender\collabs.blend
if errorlevel 1 exit /b %errorlevel%

call .\BLENDER.cmd --background --python tools\blender\export_collabs.py -- --blend art\blender\collabs.blend --home public\assets\models\collabs\home.glb --gallery public\assets\models\collabs\gallery.glb
if errorlevel 1 exit /b %errorlevel%
if not exist public\assets\models\collabs\home.glb (
  echo ERROR: public\assets\models\collabs\home.glb was not generated.
  exit /b 1
)
if not exist public\assets\models\collabs\gallery.glb (
  echo ERROR: public\assets\models\collabs\gallery.glb was not generated.
  exit /b 1
)

call .\BLENDER.cmd --background --python tools\blender\export_path_json.py -- --blend art\blender\collabs.blend --out public\assets\models\collabs\path_home_to_gallery.json
if errorlevel 1 exit /b %errorlevel%

echo.
echo Collabs assets exported.
echo Optional next step later: run glTF optimization (meshopt/draco/texture compression) after look-lock.

exit /b 0
