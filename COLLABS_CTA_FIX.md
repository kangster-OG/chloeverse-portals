\# COLLABS\_CTA\_FIX — make CTA navigation reliable



Goal:

\- Clicking CTA on /collabs MUST always land on /collabs/reels.

\- Keep the cinematic transition feel.

\- Do not modify global fonts or src/app/layout.tsx or src/app/page.tsx.

\- Keep IG modal embed behavior unchanged.



Tasks:

1\) Find the CTA click handler used on /collabs.

2\) Change behavior so navigation happens immediately (do NOT wait for animation timer):

&nbsp;  - Prefer <Link href="/collabs/reels?\_\_action=cta"> or router.push() immediately.

&nbsp;  - Do not rely on setTimeout to perform navigation.

3\) Make the cinematic transition run based on route change inside the persistent Collabs shell:

&nbsp;  - when pathname changes from /collabs -> /collabs/reels, run the transition animation

&nbsp;  - only swap visual scene after transition completes

4\) Add a watchdog fallback:

&nbsp;  - If CTA click happens and after 1200ms pathname is still "/collabs", force:

&nbsp;    window.location.assign("/collabs/reels?\_\_action=cta")

5\) Add lightweight debugging (temporary but helpful):

&nbsp;  - In dev only, log:

&nbsp;    "CTA click", "router push fired", "pathname now ..."

&nbsp;  - Also set window.\_\_COLLABS\_LAST\_NAV = Date.now() on CTA click



After:

\- list files changed

\- give QA steps:

&nbsp; - open /collabs

&nbsp; - click CTA 5 times in a row, should ALWAYS navigate

&nbsp; - back button returns to /collabs and CTA works again

