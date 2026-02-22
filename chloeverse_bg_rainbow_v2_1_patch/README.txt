Chloeverse main landing: BACKDROP rainbow micro-splotches v2.1

What this patch does:
- Replaces paintBackdropStyle() in src/components/home/ChloeverseMainLanding.tsx
- Uses fully-opaque tiled radial wash layers (no transparency) to guarantee no black peeks through inside the masked cursor disk.
- Adds medium painterly blobs + high-frequency micro splotches with a strong rainbow palette.
- Avoids additive blend modes (screen) that can collapse hues.

How to apply (Windows CMD):
1) Extract zip into your repo root (so this folder sits inside chloeverse-portals).
2) cd into this folder and run apply_patch.cmd

Then start dev:
  npm run dev -- --turbo
