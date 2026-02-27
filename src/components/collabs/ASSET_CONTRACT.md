# Collabs Asset Contract

This contract defines the exported node names and transforms expected by the Collabs WebGL code.

## Required Nodes

- `WATER_PLANE`
  - Type: mesh
  - Used in `/collabs` home museum scene.
  - Geometry should be a flat plane facing +Z local normal (Blender plane with +Z normal), near floor height.
  - Runtime applies the existing reflective water shader/material in code.

- `ANCHOR_FRAME_01`
- `ANCHOR_FRAME_02`
- `ANCHOR_FRAME_03`
- `ANCHOR_FRAME_04`
- `ANCHOR_FRAME_05`
  - Type: empty or mesh node
  - Used in `/collabs/reels` gallery scene as named anchor references for the 5 interactive reel frames.
  - Anchors should be arranged in gallery progression order from entry to deeper corridor.

## Optional Node

- `PATH_HOME_TO_GALLERY`
  - Type: curve
  - Optional camera transition path. Can be exported to JSON via `tools/blender/export_path_json.py`.

## Collections and Exports

- `HOME_EXPORT` collection exports to `public/assets/models/collabs/home.glb`.
- `GALLERY_EXPORT` collection exports to `public/assets/models/collabs/gallery.glb`.

Only intended export objects should live inside these collections.

## Coordinates and Scale

- Units: meters (`Unit Scale = 1.0`).
- Blender +Z is up.
- GLB import assumptions in runtime:
  - world scale 1.0 = 1 meter
  - forward composition in Blender should face -Y for corridor-style depth
  - avoid unapplied non-uniform transforms where possible
- Apply transforms (`Ctrl+A`) before final export for predictable runtime placement.

## Art Direction Constraints

- Mood: calm premium digital museum with water influence.
- Distinct from unseen.co:
  - do not copy room layout
  - do not copy camera angles
  - do not copy signature hero props
- Keep blockout simple but polished:
  - beveled edges
  - clean normals
  - readable silhouette hierarchy