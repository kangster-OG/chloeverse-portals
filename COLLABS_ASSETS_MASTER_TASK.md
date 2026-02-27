\# COLLABS\_ASSETS\_MASTER\_TASK — Blender asset pipeline + integration



You are the master agent. Implement an agent-assisted Blender pipeline and integrate exported GLBs into the Collabs WebGL scenes.



\## Hard constraints

\- Windows CMD only. Do NOT add PowerShell scripts.

\- Blender must be invoked via repo wrapper: .\\BLENDER.cmd

\- Do NOT modify src/app/layout.tsx or src/app/page.tsx (fonts/landing must never change).

\- Collabs changes must be scoped to src/app/collabs/\*\* and src/components/collabs/\*\* and tools/\*\*.

\- Must NOT change IG embed look/behavior when opened.



\## Desired outcome

\- Replace placeholder geometry with real Blender-authored GLBs:

&nbsp; - public/assets/models/collabs/home.glb

&nbsp; - public/assets/models/collabs/gallery.glb

\- Museum art direction: inspired by unseen.co vibe (calm premium interactive museum + water), but NOT copied:

&nbsp; - do NOT recreate their exact room layout, camera angles, or signature props

&nbsp; - choose a distinct floorplan, water shape, and lighting story



\## Tasks (execute in order)



\### A) Write asset contract

Create: src/components/collabs/ASSET\_CONTRACT.md

Include required node names and meanings:

\- WATER\_PLANE (mesh; code will apply water material)

\- ANCHOR\_FRAME\_01..05 (empties or nodes for 5 posters/frames)

\- Optional: PATH\_HOME\_TO\_GALLERY curve exported to JSON for transition camera

\- Coordinate conventions, scale (meters), forward axis, etc.



Update Collabs scenes to rely on these names consistently.



\### B) Create Blender scripts + docs

Add:

\- art/blender/collabs.blend (initial file can be generated or created by script)

\- tools/blender/README.md (exact CMD commands)

\- tools/blender/generate\_home\_blockout.py

\- tools/blender/generate\_gallery\_blockout.py

\- tools/blender/export\_collabs.py

\- tools/blender/export\_path\_json.py (optional)



Rules:

\- Scripts must be runnable headless:

&nbsp; .\\BLENDER.cmd --background --python tools\\blender\\<script>.py -- <args>

\- Use collections named HOME\_EXPORT and GALLERY\_EXPORT

\- Ensure nodes required by ASSET\_CONTRACT.md exist and are correctly named

\- Keep geometry blockout-simple but premium: beveled edges, clean normals, readable composition



\### C) Add a CMD build script

Add: tools\\build-collabs-assets.cmd

It should:

1\) Generate/update the .blend (if needed)

2\) Export GLBs to public/assets/models/collabs/home.glb and gallery.glb

3\) (Optional for now) Print instructions for optimization later



Also add package.json script:

\- "assets:collabs" -> calls tools\\build-collabs-assets.cmd



\### D) Integrate GLBs into Collabs scenes

\- In the Collabs home scene, load home.glb and find WATER\_PLANE to apply existing water material/shader.

\- In the corridor/gallery scene, load gallery.glb and place interactive posters/frames at ANCHOR\_FRAME\_01..05.

\- Keep existing scroll + transition logic; only swap placeholder geometry with GLBs.



\### E) Verification

\- Run npm run build

\- Run npm run dev and manually confirm:

&nbsp; - /collabs shows the museum lobby

&nbsp; - CTA transitions to /collabs/reels

&nbsp; - corridor scroll works

&nbsp; - clicking a frame still opens the IG modal embed unchanged



\## Output

\- List files changed

\- Provide exact CMD commands to run:

&nbsp; - npm run assets:collabs

&nbsp; - npm run build

&nbsp; - npm run dev

