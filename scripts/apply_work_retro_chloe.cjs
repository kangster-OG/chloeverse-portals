// scripts/apply_work_retro_chloe.cjs
const fs = require("fs");
const path = require("path");
const os = require("os");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}
function isRetroRepo(dir) {
  return (
    exists(path.join(dir, "package.json")) &&
    exists(path.join(dir, "vite.config.ts")) &&
    exists(path.join(dir, "index.html"))
  );
}
function resolveRetroDir() {
  const repoRoot = path.resolve(__dirname, "..");
  const candidates = [];
  if (process.env.RETRO_WORK_SRC) candidates.push(process.env.RETRO_WORK_SRC);
  candidates.push(path.resolve(repoRoot, "..", "retro-computer-website"));
  candidates.push(path.join(os.homedir(), "Downloads", "retro-computer-website"));
  candidates.push(path.join(os.homedir(), "Documents", "retro-computer-website"));

  for (const c of candidates) {
    const dir = path.resolve(c);
    if (isRetroRepo(dir)) return dir;
  }
  throw new Error(
    `PATCH_FAILED: Could not locate retro-computer-website.\nTried:\n- ${candidates
      .map((c) => path.resolve(c))
      .join("\n- ")}`
  );
}
function rmDirContents(dir) {
  if (!exists(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
    else fs.rmSync(p, { force: true });
  }
}
function writeFileEnsured(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}
function warn(msg) {
  console.log(`[work:retro:apply-chloe] WARN: ${msg}`);
}
function fail(msg) {
  throw new Error(`PATCH_FAILED: ${msg}`);
}

const CHLOE_THEME = (process.env.CHL_OE_THEME || "dark").toLowerCase();

function main() {
  const retroDir = resolveRetroDir();
  const prefix = "[work:retro:apply-chloe]";
  console.log(`${prefix} Using retro repo: ${retroDir}`);

  // 1) terminal title (multi-line; fixes missing words)
  const titleMd = `!(/images/ed-title.png?aspect=2&noflow=true&width=1.33)

## Hi,
# *I'm Chloe*
##  Creator
##  Founder
##  Creative strategist
##  Growth Marketer

### Welcome to CHLO-Linux 1.0 LTS
###  Scroll or type "help" to get started
`;
  writeFileEnsured(
    path.join(retroDir, "src", "file-system", "home", "user", "title", "title.md"),
    titleMd
  );

  // 2) terminal about
  const aboutMd = `# Hi there
Here's what I've been up to the past few years!
`;
  writeFileEnsured(
    path.join(retroDir, "src", "file-system", "home", "user", "about", "about.md"),
    aboutMd
  );

  // 3) terminal projects folder: delete everything else + recreate only these
  const projectsDir = path.join(retroDir, "src", "file-system", "home", "user", "projects");
  fs.mkdirSync(projectsDir, { recursive: true });
  rmDirContents(projectsDir);

  const projects = {
    "00-ai-search-adobe.md": `## *AI Search  Adobe*
## Jan 2026 - Present
###  Los Angeles Metropolitan Area  Remote
###  Contract
Search optimization for LLM training & retrieval. Not via an organization on campus.
`,
    "01-creator-instagram.md": `## *Creator  Instagram*
## Jul 2025 - Present
###  Los Angeles, California, United States  Hybrid
###  Self-employed
300K+ followers
250M views
Grew IG from 0 to 140k+ in 3 months
Viral series accumulated 200M views & attention from major news outlets
Worked with Adidas, Adobe, Estée Lauder, OpenAI, Hera, etc.
`,
    "02-product-marketing-outsmart.md": `## *Product Marketing  Outsmart*
## Sep 2025 - Dec 2025
###  Los Angeles, California, United States  Hybrid
###  Contract
Product and growth directly under ex-CMO @ Duolingo, $38M raised, backed by DST Global, Lightspeed, Khosla Ventures, execs from OpenAI & Quora.
`,
    "03-head-of-growth-stealth-ai-startup.md": `## *Head of Growth  Stealth AI Startup*
## Jun 2025 - Sep 2025
###  San Francisco, California, United States  On-site
###  Full-time
Product and growth for B2C fashion tech, backed by execs from Shopify and Pinterest.
`,
    "04-product-marketing-intern-soluna.md": `## *Product Marketing Intern  Soluna*
## Oct 2024 - Jun 2025
###  Los Angeles, California, United States  Remote
###  Internship
Streamlined Solunas GTM, drove 179% increase in revenue in US market.
`,
    "05-digital-marketing-intern-headspace.md": `## *Digital Marketing Intern  Headspace*
## May 2022 - Sep 2023
###  Los Angeles, California, United States  Remote
###  Internship
Tripled Headspaces social media presence in one year, youngest employee to earn an extended contract.
`,
    "06-ceo-single-origin-studio.md": `## *CEO  Single Origin Studio*
## Jun 2023 - Jan 2026
###  Los Angeles, California, United States  Remote
###  Self-employed
Marketing consulting | Previous experience with YC backed startups | Full in house marketing with UGC team management | Scaled brands from 0 to 50k+ users in 2 months | Generated 6 figures of revenue | Worked with pre-seed and early stage
`,
  };

  for (const [name, content] of Object.entries(projects)) {
    writeFileEnsured(path.join(projectsDir, name), content);
  }

  // 4) Patch the SCROLL content inside retro repo index.html (HTML)
  const indexPath = path.join(retroDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  // Theme toggle on the root html element (default dark).
  html = html.replace(/<html\b([^>]*)>/i, (_match, attrs) => {
    let nextAttrs = attrs.replace(/\sdata-chloe-theme=(["']).*?\1/i, "");
    const themeValue = CHLOE_THEME === "dark" ? "dark" : "light";
    return `<html${nextAttrs} data-chloe-theme="${themeValue}">`;
  });

  // Replace old Ed meta descriptions in <head>.
  html = html.replace(
    /(<meta\b[^>]*\bcontent=")([^"]*My name is Ed Hinrichsen[^"]*)(")/gi,
    `$1Chloe  Creator, Founder, Creative strategist, Growth Marketer.$3`
  );
  html = html.replace(
    /(<meta\b[^>]*\bcontent=")([^"]*My name is Ed[^"]*)(")/gi,
    `$1Chloe  Creator, Founder, Creative strategist, Growth Marketer.$3`
  );

  // Remove/neutralize remaining Ed-specific footer/url references that trip sync guards.
  html = html.replace(/<footer\b[\s\S]*?<\/footer>/i, "");
  html = html.replace(/https:\/\/bsky\.app\/profile\/edh\.dev\/?/gi, "#");
  html = html.replace(/https:\/\/edh\.dev\/icon\/og-img1\.png/gi, "/work-retro/icon/og-img1.png");
  html = html.replace(/https:\/\/edh\.dev\/?/gi, "/work-retro/");
  html = html.replace(/edh\.dev/gi, "chloeverse.local");

  if (CHLOE_THEME === "dark") {
    html = html.replace(
      /(<meta\b[^>]*name=["']theme-color["'][^>]*content=["'])([^"']*)(["'][^>]*>)/i,
      `$1#0F1115$3`
    );
  }

  // Normalize project label widths across all injected job titles and restore large date style.
  const chloeOverridesCss = `    <style id="chloe-overrides">
      .chloe-job-label {
        display: block;
        width: 640px;
        max-width: calc(100% - 32px);
        margin-left: auto;
        margin-right: auto;
        box-sizing: border-box;
      }
      .chloe-date { font-size: 32px; line-height: 1.1; margin: 0; padding: 0; }

      :root[data-chloe-theme="dark"] {
        --chloe-bg: #0F1115;
        --chloe-fg: #E8E3DA;
        --chloe-rule: rgba(232,227,218,0.25);
        --chloe-box-bg: #E8E3DA;
        --chloe-box-fg: #15181E;
      }

      :root[data-chloe-theme="dark"] html,
      :root[data-chloe-theme="dark"] body {
        background: var(--chloe-bg) !important;
      }

      :root[data-chloe-theme="dark"] body,
      :root[data-chloe-theme="dark"] main {
        color: var(--chloe-fg) !important;
      }

      /* Invert boxed pixel labels (Hi!/Projects + job title bars) */
      :root[data-chloe-theme="dark"] main h1,
      :root[data-chloe-theme="dark"] main h2 {
        background: var(--chloe-box-bg) !important;
        color: var(--chloe-box-fg) !important;
      }

      /* Meta/description text */
      :root[data-chloe-theme="dark"] .chloe-meta,
      :root[data-chloe-theme="dark"] .chloe-meta div {
        color: var(--chloe-fg) !important;
      }

      /* Dividers */
      :root[data-chloe-theme="dark"] main hr {
        border: 0 !important;
        border-top: 2px solid var(--chloe-rule) !important;
        opacity: 1 !important;
      }

      :root[data-chloe-theme="dark"]{
        --chloe-bg:#0F1115;
        --chloe-fg:#E8E3DA;
        --chloe-rule:rgba(232,227,218,0.22);
        --chloe-box-bg:#DDD6CC;
        --chloe-box-fg:#1A1E24;
      }

      @keyframes chloeMuddyFade {
        0%   { opacity: 0.28; filter: saturate(0.15) brightness(0.85); }
        55%  { opacity: 0.20; filter: saturate(0.10) brightness(0.78); }
        100% { opacity: 0.06; filter: saturate(0) brightness(0.70); }
      }

      /* Force ALL ancestors/wrappers to true charcoal */
      :root[data-chloe-theme="dark"] body,
      :root[data-chloe-theme="dark"] #root,
      :root[data-chloe-theme="dark"] main {
        background: var(--chloe-bg) !important;
      }

      /* Disable/dim the big hero background image overlay behind text (causes brown/mud) */
      :root[data-chloe-theme="dark"] main img,
      :root[data-chloe-theme="dark"] main picture,
      :root[data-chloe-theme="dark"] main video {
        opacity: 1;
      }

      /* Target the background hero image specifically (most pages use an <img> with bg / "bg-" in src or a large absolute image) */
      :root[data-chloe-theme="dark"] img[src*="bg"],
      :root[data-chloe-theme="dark"] img[alt*="bg"],
      :root[data-chloe-theme="dark"] img[src*="background"]{
        opacity: 0.06 !important;
        filter: saturate(0) brightness(0.7) !important;
        animation: chloeMuddyFade 900ms ease-out 1;
      }

      /* Also catch common "background image" containers by id/class if present */
      :root[data-chloe-theme="dark"] [class*="bg"],
      :root[data-chloe-theme="dark"] [id*="bg"]{
        animation: chloeMuddyFade 900ms ease-out 1;
      }

      @media (prefers-reduced-motion: reduce) {
        :root[data-chloe-theme="dark"] img[src*="bg"],
        :root[data-chloe-theme="dark"] img[src*="background"],
        :root[data-chloe-theme="dark"] img[alt*="bg"]{
          animation: none !important;
          opacity: 0.06 !important;
          filter: saturate(0) brightness(0.70) !important;
        }
      }

      /* Label bars + headings */
      :root[data-chloe-theme="dark"] main h1,
      :root[data-chloe-theme="dark"] main h2 {
        background: var(--chloe-box-bg) !important;
        color: var(--chloe-box-fg) !important;
      }

      /* Ensure meta/description stay warm off-white */
      :root[data-chloe-theme="dark"] .chloe-meta,
      :root[data-chloe-theme="dark"] .chloe-meta div {
        color: var(--chloe-fg) !important;
      }

      /* Divider lines */
      :root[data-chloe-theme="dark"] main hr {
        border-top: 2px solid var(--chloe-rule) !important;
      }
    </style>
`;
  if (/<style\b[^>]*id=["']chloe-overrides["'][^>]*>[\s\S]*?<\/style>/i.test(html)) {
    html = html.replace(
      /<style\b[^>]*id=["']chloe-overrides["'][^>]*>[\s\S]*?<\/style>/i,
      chloeOverridesCss.trimEnd()
    );
  } else if (html.includes(".chloe-job-label")) {
    html = html.replace(
      /<style>\s*\.chloe-job-label[\s\S]*?<\/style>/i,
      chloeOverridesCss.trimEnd()
    );
  } else {
    const headPatched = html.replace(/<\/head>/i, `${chloeOverridesCss}  </head>`);
    if (headPatched === html) fail("HEAD_CLOSE_NOT_FOUND");
    html = headPatched;
  }

  const mainOpenRe = /<main\b[^>]*>/i;
  const mOpen = mainOpenRe.exec(html);
  if (!mOpen) fail("MAIN_TAG_NOT_FOUND");
  const mainOpenIdx = mOpen.index;
  const mainBodyStart = mainOpenIdx + mOpen[0].length;
  const mainCloseIdx = html.toLowerCase().indexOf("</main>", mainBodyStart);
  if (mainCloseIdx === -1) fail("MAIN_CLOSE_NOT_FOUND");

  let mainBody = html.slice(mainBodyStart, mainCloseIdx);

  // Change the first boxed "Hi there" heading in <main> to "Hi!" while preserving wrapper markup/classes.
  let hiHeadingPatched = false;
  mainBody = mainBody.replace(
    /<(h1|div|span)\b([^>]*)>(\s*)Hi there(\s*)<\/\1>/i,
    (_match, tag, attrs, leadingWs, trailingWs) => {
      hiHeadingPatched = true;
      return `<${tag}${attrs}>${leadingWs}Hi!${trailingWs}</${tag}>`;
    }
  );
  if (!hiHeadingPatched && !/<(h1|div|span)\b[^>]*>\s*Hi!\s*<\/\1>/i.test(mainBody)) {
    fail("HI_HEADING_NOT_FOUND_IN_MAIN");
  }

  // Replace the bio block between the first Hi heading and the next Projects heading.
  const hiHeadingRe = /<(h1|div|span)\b[^>]*>\s*Hi(?: there|!)\s*<\/\1>/i;
  const hiMatch = hiHeadingRe.exec(mainBody);
  if (!hiMatch) fail("HI_HEADING_NOT_FOUND_IN_MAIN_AFTER_PATCH");
  const hiHeadingEnd = hiMatch.index + hiMatch[0].length;
  const projectsH1Re = /<h1\b[^>]*>\s*projects\s*<\/h1>/i;
  const projectsAfterHiMatch = projectsH1Re.exec(mainBody.slice(hiHeadingEnd));
  if (!projectsAfterHiMatch) fail("PROJECTS_H1_NOT_FOUND_AFTER_HI_IN_MAIN");

  const projectsH1Idx = hiHeadingEnd + projectsAfterHiMatch.index;
  mainBody =
    mainBody.slice(0, hiHeadingEnd) +
    `\n<p>Heres what Ive been up to the past few years!</p>\n<hr />\n` +
    mainBody.slice(projectsH1Idx);

  // Find the Contact heading INSIDE main (if present) so we can replace only the projects area.
  const contactHeadingRe = /<h[1-6][^>]*>\s*contact\s*<\/h[1-6]>/i;
  const cMatch = contactHeadingRe.exec(mainBody);
  const projectsRelEnd = cMatch ? cMatch.index : mainBody.length;

  // Try to find a Projects heading INSIDE main (start replacement there if we can)
  const projectsHeadingRe = /<h[1-6][^>]*>\s*projects\s*<\/h[1-6]>/i;
  const pMatch = projectsHeadingRe.exec(mainBody);
  let projectsRelStart = 0;
  if (pMatch) projectsRelStart = pMatch.index;
  else {
    // fallback: start at first year header (your file has <h3>2023-24</h3>)
    const yearIdx = mainBody.indexOf("<h3>2023-24</h3>");
    if (yearIdx !== -1) projectsRelStart = yearIdx;
    else warn("Projects heading and year marker not found; replacing from start of <main>.");
  }

  const META = 'style="margin:0 auto;width:640px;max-width:calc(100% - 32px);text-align:left;"';

  const newProjectsHtml = `
<h1>Projects</h1>

<hr />

<h2 class="chloe-job-label">Stealth Startup - Founder</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Feb 2026 - Present</div>
  <div>Remote</div>
  <div>More news soon.</div>
</div>

<hr />

<h2 class="chloe-job-label">Adobe - AI Search</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Jan 2026 - Present</div>
  <div>Los Angeles Metropolitan Area  Remote</div>
  <div>Contract</div>
  <div>Search optimization for LLM training &amp; retrieval. Not via an organization on campus.</div>
</div>

<hr />

<h2 class="chloe-job-label">Instagram - Creator</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Jul 2025 - Present</div>
  <div>Los Angeles, California, United States  Hybrid</div>
  <div>Self-employed</div>
  <div>
300K+ followers<br/>
250M views<br/>
Grew IG from 0 to 140k+ in 3 months<br/>
Viral series accumulated 200M views &amp; attention from major news outlets<br/>
Worked with Adidas, Adobe, Est??e Lauder, OpenAI, Hera, etc.
</div>
</div>

<hr />

<h2 class="chloe-job-label">Single Origin Studio - CEO</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Jun 2023 - Jan 2026</div>
  <div>Los Angeles, California, United States  Remote</div>
  <div>Self-employed</div>
  <div>Marketing consulting | Previous experience with YC backed startups | Full in house marketing with UGC team management | Scaled brands from 0 to 50k+ users in 2 months | Generated 6 figures of revenue | Worked with pre-seed and early stage</div>
</div>

<hr />

<h2 class="chloe-job-label">Outsmart - Product Marketing</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Sep 2025 - Dec 2025</div>
  <div>Los Angeles, California, United States  Hybrid</div>
  <div>Contract</div>
  <div>Product and growth directly under ex-CMO @ Duolingo, $38M raised, backed by DST Global, Lightspeed, Khosla Ventures, execs from OpenAI &amp; Quora.</div>
</div>

<hr />

<h2 class="chloe-job-label">Stealth AI Startup - Head of Growth</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Jun 2025 - Sep 2025</div>
  <div>San Francisco, California, United States  On-site</div>
  <div>Full-time</div>
  <div>Product and growth for B2C fashion tech, backed by execs from Shopify and Pinterest.</div>
</div>

<hr />

<h2 class="chloe-job-label">Soluna - Product Marketing Intern</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">Oct 2024 - Jun 2025</div>
  <div>Los Angeles, California, United States  Remote</div>
  <div>Internship</div>
  <div>Streamlined Solunas GTM, drove 179% increase in revenue in US market.</div>
</div>

<hr />

<h2 class="chloe-job-label">Headspace - Digital Marketing Intern</h2>
<div class="chloe-meta" ${META}>
  <div class="chloe-date">May 2022 - Sep 2023</div>
  <div>Los Angeles, California, United States  Remote</div>
  <div>Internship</div>
  <div>Tripled Headspaces social media presence in one year, youngest employee to earn an extended contract.</div>
</div>

<hr />
`;

  let patchedMain =
    mainBody.slice(0, projectsRelStart) +
    newProjectsHtml +
    mainBody.slice(projectsRelEnd);

  // Remove the Contact section entirely (and an immediate preceding divider if present).
  patchedMain = patchedMain.replace(
    /\s*<hr\s*\/?>\s*<h1\b[^>]*>\s*contact\s*<\/h1>[\s\S]*$/i,
    ""
  );
  patchedMain = patchedMain.replace(
    /\s*<h1\b[^>]*>\s*contact\s*<\/h1>[\s\S]*$/i,
    ""
  );

  html = html.slice(0, mainBodyStart) + patchedMain + html.slice(mainCloseIdx);

  // Verification: old project titles should be gone, new one must exist
  if (html.includes("My name is Ed")) fail("OLD_ED_BIO_STILL_PRESENT");
  if (html.includes("Page Buddy")) fail("OLD_PROJECTS_STILL_PRESENT (Page Buddy found)");
  if (!html.includes("Hi!")) fail("HI_BANG_MISSING");
  if (!html.includes("Stealth Startup - Founder")) fail("TOP_STEALTH_FOUNDER_MISSING");
  if (!html.includes("Adobe - AI Search")) fail("ADOBE_PROJECT_MISSING");
  if (!html.includes("Instagram - Creator")) fail("INSTAGRAM_PROJECT_MISSING");
  if (!html.includes("Outsmart - Product Marketing")) fail("OUTSMART_PROJECT_MISSING");
  if (!html.includes('class="chloe-date"')) fail("CHLOE_DATE_CLASS_MISSING");
  const instagramIdx = html.indexOf("Instagram - Creator");
  const singleOriginIdx = html.indexOf("Single Origin Studio - CEO");
  const outsmartIdx = html.indexOf("Outsmart - Product Marketing");
  if (instagramIdx === -1 || singleOriginIdx === -1 || outsmartIdx === -1) {
    fail("PROJECT_ORDER_MARKERS_MISSING");
  }
  if (!(instagramIdx < singleOriginIdx && singleOriginIdx < outsmartIdx)) {
    fail("SINGLE_ORIGIN_ORDER_INCORRECT");
  }
  if (/<h1\b[^>]*>\s*contact\s*<\/h1>/i.test(html)) fail("CONTACT_SECTION_STILL_PRESENT");
  if (CHLOE_THEME === "dark") {
    if (!html.includes('data-chloe-theme="dark"')) fail("DARK_THEME_ATTR_MISSING");
    if (!html.includes("--chloe-bg: #0F1115")) fail("DARK_THEME_CSS_MISSING");
    if (!html.includes("--chloe-box-bg:#DDD6CC")) fail("DARK_THEME_BOX_BG_MISSING");
    if (!html.includes('img[src*="bg"]')) fail("DARK_THEME_BG_IMG_SELECTOR_MISSING");
  }

  fs.writeFileSync(indexPath, html, "utf8");
  console.log(`${prefix} DONE (scroll Projects replaced).`);
}

try {
  main();
} catch (e) {
  console.error(`[work:retro:apply-chloe] ERROR: ${e.message}`);
  process.exit(1);
}
