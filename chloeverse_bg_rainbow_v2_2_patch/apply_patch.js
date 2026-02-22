const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const target = path.join(repoRoot, 'src', 'components', 'home', 'ChloeverseMainLanding.tsx');

if (!fs.existsSync(target)) {
  fail('PATCH_ABORT: Could not find ' + target);
}

let s = fs.readFileSync(target, 'utf8');

// 1) Patch backdropColorAt to be weighted (less hot pink)
const reBackdropFn = /function\s+backdropColorAt\(seed:\s*number,\s*offset:\s*number\):\s*string\s*\{[\s\S]*?\n\}/;
if (!reBackdropFn.test(s)) {
  fail('PATCH_ABORT: Could not locate backdropColorAt(seed, offset) function.');
}

const newBackdropFn =
"function backdropColorAt(seed: number, offset: number): string {\n" +
"  // Weighted selection to reduce hot pink dominance in the BACKDROP only.\n" +
"  const t = seeded(seed, offset);\n" +
"  // Keep hot pink rare.\n" +
"  if (t < 0.03) return '#FF2D95';\n" +
"  if (t < 0.15) return '#FF3D00';\n" +
"  if (t < 0.28) return '#FFB300';\n" +
"  if (t < 0.41) return '#FFF44F';\n" +
"  if (t < 0.58) return '#00E676';\n" +
"  if (t < 0.74) return '#00E5FF';\n" +
"  if (t < 0.86) return '#2979FF';\n" +
"  if (t < 0.95) return '#7C4DFF';\n" +
"  return '#E040FB';\n" +
"}";

s = s.replace(reBackdropFn, newBackdropFn);

// 2) Replace paintBackdropStyle block
const rePaint = /export function paintBackdropStyle\(seed: number\): CSSProperties\s*\{[\s\S]*?\n\}\n\nfunction setMaskPosition/;
if (!rePaint.test(s)) {
  fail('PATCH_ABORT: Could not locate paintBackdropStyle() block (expected it to be followed by "function setMaskPosition").');
}

const newPaintFn =
"export function paintBackdropStyle(seed: number): CSSProperties {\n" +
"  // Curved-only rainbow paint for the background spotlight reveal.\n" +
"  // Goals:\n" +
"  // - Less hot pink dominance\n" +
"  // - No straight seams/angles inside the cursor disk\n" +
"  // - Always colorful under the mask (no black peeking)\n\n" +
"  const baseLayers: string[] = [];\n" +
"  const baseSizes: string[] = [];\n" +
"  const basePositions: string[] = [];\n" +
"  const baseRepeats: string[] = [];\n\n" +
"  const midLayers: string[] = [];\n" +
"  const midSizes: string[] = [];\n" +
"  const midPositions: string[] = [];\n" +
"  const midRepeats: string[] = [];\n\n" +
"  const microLayers: string[] = [];\n" +
"  const microSizes: string[] = [];\n" +
"  const microPositions: string[] = [];\n" +
"  const microRepeats: string[] = [];\n\n" +
"  // FULL-SCREEN opaque radial fields (no-repeat) to avoid any tile seams.\n" +
"  // These guarantee the reveal disk is always fully colored with soft, curved transitions.\n" +
"  for (let i = 0; i < 4; i += 1) {\n" +
"    const a = backdropColorAt(seed, 9000 + i * 31);\n" +
"    const b = backdropColorAt(seed, 9050 + i * 37);\n" +
"    const c = backdropColorAt(seed, 9100 + i * 41);\n" +
"    const x = Math.floor(18 + seeded(seed, 9200 + i) * 64);\n" +
"    const y = Math.floor(18 + seeded(seed, 9300 + i) * 64);\n" +
"    baseLayers.push('radial-gradient(circle at ' + x + '% ' + y + '%, ' + a + ' 0%, ' + b + ' 46%, ' + c + ' 100%)');\n" +
"    baseSizes.push('100% 100%');\n" +
"    basePositions.push('center');\n" +
"    baseRepeats.push('no-repeat');\n" +
"  }\n\n" +
"  // Medium painterly blobs (repeat).\n" +
"  // Large tiles + soft alpha means seams are very hard to notice (and everything stays curved).\n" +
"  const midTileSizes = [320, 380, 460, 540];\n" +
"  for (let i = 0; i < 22; i += 1) {\n" +
"    const c1 = backdropColorAt(seed, 300 + i * 9);\n" +
"    const c2 = backdropColorAt(seed, 1300 + i * 11);\n" +
"    const x = Math.floor(6 + seeded(seed, 340 + i) * 88);\n" +
"    const y = Math.floor(6 + seeded(seed, 380 + i) * 88);\n" +
"    const radius = Math.floor(70 + seeded(seed, 420 + i) * 110);\n" +
"    const fade = radius + Math.floor(70 + seeded(seed, 460 + i) * 160);\n" +
"    const size = midTileSizes[i % midTileSizes.length];\n" +
"    const px = Math.floor(seeded(seed, 500 + i) * size);\n" +
"    const py = Math.floor(seeded(seed, 540 + i) * size);\n\n" +
"    midLayers.push(\n" +
"      'radial-gradient(circle at ' + x + '% ' + y + '%, ' +\n" +
"        hexToRgba(c1, 0.82) + ' 0px, ' +\n" +
"        hexToRgba(c2, 0.56) + ' ' + radius + 'px, ' +\n" +
"        'rgba(0,0,0,0) ' + fade + 'px)'\n" +
"    );\n" +
"    midSizes.push(size + 'px ' + size + 'px');\n" +
"    midPositions.push(px + 'px ' + py + 'px');\n" +
"    midRepeats.push('repeat');\n" +
"  }\n\n" +
"  // Micro splotches (repeat) for high-frequency multi-hue detail inside the cursor disk.\n" +
"  // Small tiles ensure multiple colors appear within a ~68px disk, while transparency keeps edges organic.\n" +
"  const microTileSizes = [84, 96, 112, 128];\n" +
"  for (let i = 0; i < 44; i += 1) {\n" +
"    const c = backdropColorAt(seed, 700 + i * 13);\n" +
"    const x = Math.floor(6 + seeded(seed, 760 + i) * 88);\n" +
"    const y = Math.floor(6 + seeded(seed, 820 + i) * 88);\n" +
"    const radius = Math.floor(10 + seeded(seed, 880 + i) * 18);\n" +
"    const fade = radius + Math.floor(8 + seeded(seed, 940 + i) * 16);\n" +
"    const size = microTileSizes[i % microTileSizes.length];\n" +
"    const px = Math.floor(seeded(seed, 1000 + i) * size);\n" +
"    const py = Math.floor(seeded(seed, 1060 + i) * size);\n\n" +
"    const isHotPink = c.toLowerCase() === '#ff2d95';\n" +
"    const a = isHotPink ? 0.72 : 0.98;\n\n" +
"    microLayers.push(\n" +
"      'radial-gradient(circle at ' + x + '% ' + y + '%, ' +\n" +
"        hexToRgba(c, a) + ' 0px, ' +\n" +
"        hexToRgba(c, a) + ' ' + radius + 'px, ' +\n" +
"        'rgba(0,0,0,0) ' + fade + 'px)'\n" +
"    );\n" +
"    microSizes.push(size + 'px ' + size + 'px');\n" +
"    microPositions.push(px + 'px ' + py + 'px');\n" +
"    microRepeats.push('repeat');\n" +
"  }\n\n" +
"  // First-listed layer paints on top.\n" +
"  const layers = [...microLayers, ...midLayers, ...baseLayers];\n" +
"  const sizes = [...microSizes, ...midSizes, ...baseSizes];\n" +
"  const positions = [...microPositions, ...midPositions, ...basePositions];\n" +
"  const repeats = [...microRepeats, ...midRepeats, ...baseRepeats];\n\n" +
"  return {\n" +
"    backgroundImage: layers.join(', '),\n" +
"    backgroundSize: sizes.join(', '),\n" +
"    backgroundPosition: positions.join(', '),\n" +
"    backgroundRepeat: repeats.join(', '),\n" +
"    // Keep hues distinct (avoid additive blends that can collapse into pink/purple).\n" +
"    backgroundBlendMode: new Array(layers.length).fill('normal').join(', '),\n" +
"    filter: 'saturate(1.45) contrast(1.14)',\n" +
"    opacity: 1,\n" +
"  };\n" +
"}";

s = s.replace(rePaint, () => newPaintFn + '\n\nfunction setMaskPosition');

fs.writeFileSync(target, s, 'utf8');
console.log('✅ Applied: reduced hot pink + removed seam/angle artifacts (curved-only radial base + softer repeats).');
