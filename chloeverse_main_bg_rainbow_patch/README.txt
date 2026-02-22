Chloeverse Main Landing – Rainbow Backdrop Patch (no Codex required)

What this fixes
- The background cursor reveal shows TRUE rainbow paint-splotches (multiple distinct hues) instead of flat bands.
- Removes conic/linear banding for the backdrop; uses layered radial paint blobs + micro-splotches.
- Keeps your existing mask/cursor logic intact.

How to apply (CMD only)
1) Extract this folder into your repo root:
   ...\chloeverse-portals\chloeverse_main_bg_rainbow_patch\

2) Run:
   chloeverse_main_bg_rainbow_patch\apply_patch.cmd

3) Start dev:
   npm run dev -- --turbo
