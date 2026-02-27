# Collabs Master Audit + Fix

You are the Master Agent for this repo.

## Goal (must be true)
1) /collabs renders the museum landing experience (WebGL).
2) Clicking CTA on /collabs triggers a transition and lands on /collabs/reels.
3) /collabs/reels shows the gallery scroll experience (Z/scroll corridor).
4) Clicking a frame opens the existing IG embed modal. The embed appearance when opened must remain unchanged.
5) Canvas/shell must NOT remount between /collabs and /collabs/reels (persistent shell).
6) Reduced motion mode works (skip cinematic camera moves; simple fade).
7) No old collabs section content leaks into /collabs or /collabs/reels besides the reels modal playback.

## What you must do (loop until done)
A) Audit the codebase:
- Identify which files implement the shell, home scene, gallery scene, and transition.
- Summarize current behavior and where it might diverge from the goals.

B) Add automated verification:
- Add an npm script: "collabs:verify"
- "collabs:verify" must run:
  - lint (if script exists)
  - typecheck/build (if script exists)
  - and a smoke test that verifies:
    - /collabs returns HTML containing expected UI markers
    - /collabs/reels returns HTML containing expected UI markers
    - clicking CTA navigates from /collabs to /collabs/reels
    - clicking a frame opens a modal element
    - shell mount count stays 1 across navigation (instrument it if needed with window.__COLLABS_SHELL_MOUNTS)

Use Playwright if available; if not, implement a lightweight smoke test that can run headless reliably.

C) Run verification:
- run npm run collabs:verify
- if it fails, fix issues and rerun
- repeat until it passes

D) Output:
- A short report in COLLABS_STATUS.md listing what works and what remains.
- List all files changed.
- Provide manual QA steps only for the parts that truly require human eyes (visual polish).