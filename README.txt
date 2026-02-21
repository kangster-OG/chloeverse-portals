Pixel Rocket Contact Page (Cinematic Diorama) Patch v3

What this patch does (matches the spec you pasted):
- Full pixel diorama animation at internal 320x180 scaled up with nearest-neighbor.
- Scene flow:
  0) Launch pad with Earth horizon + countdown + smoke + rocket bob
  1) Lift-off + atmosphere darken
  2) Flyby montage: 1s per planet (Mercury->Pluto), distinct planet ramps + details + labels
  3) Pluto crash wobble/bonk + smoke trail
  4) Sparkly puff explosion (ring + starbursts + glitter) + subtle shake
  5) Contact card pop + interactive pixel UI (your card image), hover highlights, Open/Copy + socials
- Premium polish: subtle vignette via canvas + clean HUD.
- Sound pack: whoosh/beeps/boom + hover/click; toggle in HUD.

Assets included:
public/contact/pixelrocket/
- launch_clean3.png
- flyby_clean.png
- explosion_clean.png
- explosion_clean2.png
- explosion_clean3.png
- card_clean2.png

Apply (CMD):
1) Extract this zip into your repo root (same folder as package.json)
2) Run:
   .\apply_contact_pixel_rocket_cinematic_v3.cmd
3) Restart:
   taskkill /f /im node.exe
   rmdir /s /q .next
   npm run dev
