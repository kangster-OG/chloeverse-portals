Chloeverse Main Landing – Background Rainbow v2_3

What it fixes
- Removes straight seams / angular “wedge” boundaries inside the small cursor reveal.
- Keeps everything curved by using ONLY layered radial gradients (no tiling, no linear/conic layers).
- Adds a 2px feathered mask edge (calc-based) to reduce jaggies around the circular reveal.

Apply (CMD)
1) Extract this folder into your repo root.
2) Run:
   apply_patch.cmd
3) Restart dev:
   rmdir /s /q .next 2>nul
   npm run dev -- --turbo
