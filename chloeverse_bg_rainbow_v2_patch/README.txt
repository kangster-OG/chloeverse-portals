Chloeverse Main Landing – Backdrop Rainbow v2 Patch

What this changes
- Reworks paintBackdropStyle() so the cursor reveal disk shows true multi-hue rainbow paint splotches (distinct hues) rather than a blended single-family tone.
- Removes additive 'screen' blending and avoids a single biased backgroundColor.
- Adds a fully-opaque tiled radial "wash" at the bottom so no black can peek through inside the revealed disk.

Apply (Command Prompt)
1) From repo root:
   cd /d %USERPROFILE%\Downloads\chloeverse-portals
2) Run:
   cd chloeverse_bg_rainbow_v2_patch
   apply_patch.cmd
3) Start dev:
   npm run dev -- --turbo
