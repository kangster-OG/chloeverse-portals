# Collabs Blender Pipeline (CMD)

Use CMD commands from the repo root. Blender must be invoked through `BLENDER.cmd`.

## Generate/Update Blockouts

```cmd
.\BLENDER.cmd --background --python tools\blender\generate_home_blockout.py -- --blend art\blender\collabs.blend
.\BLENDER.cmd --background --python tools\blender\generate_gallery_blockout.py -- --blend art\blender\collabs.blend
```

## Export GLBs

```cmd
.\BLENDER.cmd --background --python tools\blender\export_collabs.py -- --blend art\blender\collabs.blend --home public\assets\models\collabs\home.glb --gallery public\assets\models\collabs\gallery.glb
```

## Optional Path Export

```cmd
.\BLENDER.cmd --background --python tools\blender\export_path_json.py -- --blend art\blender\collabs.blend --out public\assets\models\collabs\path_home_to_gallery.json
```

## One-shot Build

```cmd
tools\build-collabs-assets.cmd
```