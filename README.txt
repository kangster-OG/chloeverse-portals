Pixel Rocket Contact — Fix v4 (matches cinematic diorama spec)

This patch fixes the issues seen in your recording:
- Removes the "random picture slideshow" look: no vertical jupiter panel backgrounds.
- Removes any possibility of the contact card appearing at time 0.
- Launch pad is now a true diorama (sky gradient + parallax clouds + Earth horizon + launch pad).
- Lift-off scene transitions to space (darken + stronger thruster + smoke trail).
- Planet montage is fully procedural with distinct planet ramps/details (1s per planet) + label pop.
- Pluto crash wobble + smoke + "uh oh." text.
- Explosion is a sparkly puff animation (ring + starbursts + falling glitter) + light shake.
- Contact card is a clean, premium "pixel UI" HTML card with the REAL email + links (no chloe@example.com).
- Sound toggle + skip/replay preserved.

Apply (CMD):
1) Extract into repo root
2) Run:
   .\apply_contact_pixel_rocket_fix_v4.cmd
3) Restart:
   taskkill /f /im node.exe
   rmdir /s /q .next
   npm run dev
