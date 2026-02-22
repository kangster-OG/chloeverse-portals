const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const tsxPath = path.join(repoRoot, 'src', 'components', 'home', 'ChloeverseMainLanding.tsx');
const cssPath = path.join(repoRoot, 'src', 'app', 'globals.css');

if (!fs.existsSync(tsxPath)) fail('PATCH_ABORT: Could not find ' + tsxPath);
if (!fs.existsSync(cssPath)) fail('PATCH_ABORT: Could not find ' + cssPath);

let tsx = fs.readFileSync(tsxPath, 'utf8');

// Replace paintBackdropStyle with a non-tiling, all-radial “paint blob” field
// to remove straight seams/angles inside the small reveal disk.
const rePaint = /export function paintBackdropStyle\(seed: number\): CSSProperties\s*\{[\s\S]*?\n\}\n\nfunction setMaskPosition/;
if (!rePaint.test(tsx)) {
  fail('PATCH_ABORT: Could not locate paintBackdropStyle() block (expected it to be followed by "function setMaskPosition").');
}

const newPaint =
"export function paintBackdropStyle(seed: number): CSSProperties {\n" +
"  // v2_3: Curved-only rainbow paint for the background spotlight reveal.\n" +
"  // Fixes: visible straight seams/angles + jaggy-looking boundaries in the reveal disk.\n" +
"  // Strategy: NO tiling (no background-size/repeat), only layered radial gradients.\n" +
"  // Many small solid blobs ensure the disk always contains multiple curved color regions.\n\n" +
"  const layers: string[] = [];\n\n" +
"  // 1) Soft full-coverage color field (no black peeking) — still curved-only.\n" +
"  // Keep edge alpha > 0 so every pixel has some color under the mask.\n" +
"  for (let i = 0; i < 6; i += 1) {\n" +
"    const a = backdropColorAt(seed, 12000 + i * 31);\n" +
"    const b = backdropColorAt(seed, 12100 + i * 37);\n" +
"    const c = backdropColorAt(seed, 12200 + i * 41);\n" +
"    const x = Math.floor(14 + seeded(seed, 12300 + i) * 72);\n" +
"    const y = Math.floor(14 + seeded(seed, 12400 + i) * 72);\n" +
"    // Wide radii, but keep them subtle so they don't create banding/flat wedges in the small disk.\n" +
"    layers.push(\n" +
"      'radial-gradient(circle at ' + x + '% ' + y + '%, ' +\n" +
"        hexToRgba(a, 0.62) + ' 0px, ' +\n" +
"        hexToRgba(b, 0.52) + ' 320px, ' +\n" +
"        hexToRgba(c, 0.44) + ' 920px)'\n" +
"    );\n" +
"  }\n\n" +
"  // 2) Medium paint blobs (solid-ish centers with feathered edges).\n" +
"  // These create obviously CURVED boundaries inside the reveal disk.\n" +
"  for (let i = 0; i < 34; i += 1) {\n" +
"    const c1 = backdropColorAt(seed, 2000 + i * 11);\n" +
"    const c2 = backdropColorAt(seed, 2400 + i * 13);\n" +
"    const x = Math.floor(4 + seeded(seed, 2800 + i) * 92);\n" +
"    const y = Math.floor(4 + seeded(seed, 3000 + i) * 92);\n" +
"    const r = Math.floor(48 + seeded(seed, 3200 + i) * 120);\n" +
"    const f = Math.floor(70 + seeded(seed, 3400 + i) * 180);\n" +
"    layers.push(\n" +
"      'radial-gradient(circle at ' + x + '% ' + y + '%, ' +\n" +
"        hexToRgba(c1, 0.82) + ' 0px, ' +\n" +
"        hexToRgba(c1, 0.82) + ' ' + r + 'px, ' +\n" +
"        hexToRgba(c2, 0.55) + ' ' + (r + Math.floor(f * 0.45)) + 'px, ' +\n" +
"        'rgba(0,0,0,0) ' + (r + f) + 'px)'\n" +
"    );\n" +
"  }\n\n" +
"  // 3) Micro splotches — lots of small blobs so the ~68px disk always shows multiple hues.\n" +
"  for (let i = 0; i < 96; i += 1) {\n" +
"    const c = backdropColorAt(seed, 5000 + i * 7);\n" +
"    const x = Math.floor(2 + seeded(seed, 5200 + i) * 96);\n" +
"    const y = Math.floor(2 + seeded(seed, 5400 + i) * 96);\n" +
"    const r = Math.floor(10 + seeded(seed, 5600 + i) * 26);\n" +
"    const f = Math.floor(10 + seeded(seed, 5800 + i) * 26);\n" +
"    const isHotPink = c.toLowerCase() === '#ff2d95';\n" +
"    const a = isHotPink ? 0.70 : 0.98;\n" +
"    layers.push(\n" +
"      'radial-gradient(circle at ' + x + '% ' + y + '%, ' +\n" +
"        hexToRgba(c, a) + ' 0px, ' +\n" +
"        hexToRgba(c, a) + ' ' + r + 'px, ' +\n" +
"        'rgba(0,0,0,0) ' + (r + f) + 'px)'\n" +
"    );\n" +
"  }\n\n" +
"  return {\n" +
"    backgroundImage: layers.join(', '),\n" +
"    backgroundBlendMode: new Array(layers.length).fill('normal').join(', '),\n" +
"    // Keep it vivid without turning into neon fog.\n" +
"    filter: 'saturate(1.35) contrast(1.12)',\n" +
"    opacity: 1,\n" +
"  };\n" +
"}";

tsx = tsx.replace(rePaint, newPaint + "\n\nfunction setMaskPosition");

fs.writeFileSync(tsxPath, tsx, 'utf8');

// Append a stronger anti-alias mask override at EOF (last rule wins).
let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* chv-home spotlight mask override v2_3 */';
if (!css.includes(marker)) {
  css +=
"\n\n" + marker + "\n" +
".home-spotlight-mask-bg {\n" +
"  --bgx: 50vw;\n" +
"  --bgy: 50vh;\n" +
"  --bgr: 0px;\n" +
"  /* 2px feather to reduce jaggies, but keep interior fully solid (no black peeking). */\n" +
"  -webkit-mask-image: radial-gradient(circle at var(--bgx) var(--bgy),\n" +
"    rgba(0,0,0,1) 0px,\n" +
"    rgba(0,0,0,1) max(0px, calc(var(--bgr) - 2px)),\n" +
"    rgba(0,0,0,0) var(--bgr));\n" +
"  mask-image: radial-gradient(circle at var(--bgx) var(--bgy),\n" +
"    rgba(0,0,0,1) 0px,\n" +
"    rgba(0,0,0,1) max(0px, calc(var(--bgr) - 2px)),\n" +
"    rgba(0,0,0,0) var(--bgr));\n" +
"  -webkit-mask-repeat: no-repeat;\n" +
"  mask-repeat: no-repeat;\n" +
"}\n";

  fs.writeFileSync(cssPath, css, 'utf8');
}

console.log('✅ Applied: v2_3 curved-only (no tiling seams) backdrop + anti-aliased spotlight mask.');
