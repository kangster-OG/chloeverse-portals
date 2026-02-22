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

const re = /export function paintBackdropStyle\(seed: number\): CSSProperties\s*\{[\s\S]*?\n\}\n\nfunction setMaskPosition/;

if (!re.test(s)) {
  fail('PATCH_ABORT: Could not locate paintBackdropStyle() block (expected it to be followed by "function setMaskPosition").');
}

// IMPORTANT: this string must not contain unescaped backticks or ${...} sequences, because it lives
// inside a JS template literal. So the TS code below avoids template literals entirely.
const newFn = `export function paintBackdropStyle(seed: number): CSSProperties {
  // Backdrop is revealed only through a cursor-driven mask.
  // Goal: inside a small (~cursor) circle, show MULTIPLE distinct rainbow paint blobs at once,
  // with no banding and no black peeking through.

  const washLayers: string[] = [];
  const washSizes: string[] = [];
  const washPositions: string[] = [];

  const midLayers: string[] = [];
  const midSizes: string[] = [];
  const midPositions: string[] = [];

  const microLayers: string[] = [];
  const microSizes: string[] = [];
  const microPositions: string[] = [];

  // Fully-opaque tiled radial washes (NO transparency) so the mask always reveals color.
  // Using radial (not conic) avoids wedge banding.
  const washTileSizes = [180, 220, 260, 300];
  for (let i = 0; i < 4; i += 1) {
    // Force hue separation by sampling spaced offsets.
    const a = backdropColorAt(seed, 9000 + i * 17);
    const b = backdropColorAt(seed, 9050 + i * 19);
    const c = backdropColorAt(seed, 9100 + i * 23);
    const x = Math.floor(16 + seeded(seed, 9200 + i) * 68);
    const y = Math.floor(16 + seeded(seed, 9300 + i) * 68);
    const size = washTileSizes[i % washTileSizes.length];
    const px = Math.floor(seeded(seed, 9400 + i) * size);
    const py = Math.floor(seeded(seed, 9500 + i) * size);

    washLayers.push(
      'radial-gradient(circle at ' + x + '% ' + y + '%, ' + a + ' 0%, ' + b + ' 54%, ' + c + ' 100%)'
    );
    washSizes.push(size + 'px ' + size + 'px');
    washPositions.push(px + 'px ' + py + 'px');
  }

  // Medium painterly blobs (transparent edges) to create "paint" shapes and layering.
  const midTileSizes = [140, 170, 200, 230];
  for (let i = 0; i < 18; i += 1) {
    const c1 = backdropColorAt(seed, 300 + i * 7);
    const c2 = backdropColorAt(seed, 1300 + i * 11);
    const x = Math.floor(6 + seeded(seed, 340 + i) * 88);
    const y = Math.floor(6 + seeded(seed, 380 + i) * 88);
    const radius = Math.floor(44 + seeded(seed, 420 + i) * 78);
    const fade = radius + Math.floor(36 + seeded(seed, 460 + i) * 86);
    const size = midTileSizes[i % midTileSizes.length];
    const px = Math.floor(seeded(seed, 500 + i) * size);
    const py = Math.floor(seeded(seed, 540 + i) * size);

    midLayers.push(
      'radial-gradient(circle at ' + x + '% ' + y + '%, '
        + hexToRgba(c1, 0.92) + ' 0px, '
        + hexToRgba(c2, 0.72) + ' ' + radius + 'px, '
        + 'rgba(0,0,0,0) ' + fade + 'px)'
    );
    midSizes.push(size + 'px ' + size + 'px');
    midPositions.push(px + 'px ' + py + 'px');
  }

  // High-frequency micro splotches on top so the small cursor disk shows multiple distinct hues.
  const microTileSizes = [72, 88, 104, 120];
  for (let i = 0; i < 34; i += 1) {
    const c = backdropColorAt(seed, 700 + i * 13);
    const x = Math.floor(6 + seeded(seed, 760 + i) * 88);
    const y = Math.floor(6 + seeded(seed, 820 + i) * 88);
    const radius = Math.floor(12 + seeded(seed, 880 + i) * 18);
    const fade = radius + Math.floor(10 + seeded(seed, 940 + i) * 18);
    const size = microTileSizes[i % microTileSizes.length];
    const px = Math.floor(seeded(seed, 1000 + i) * size);
    const py = Math.floor(seeded(seed, 1060 + i) * size);

    microLayers.push(
      'radial-gradient(circle at ' + x + '% ' + y + '%, '
        + hexToRgba(c, 1) + ' 0px, '
        + hexToRgba(c, 1) + ' ' + radius + 'px, '
        + 'rgba(0,0,0,0) ' + fade + 'px)'
    );
    microSizes.push(size + 'px ' + size + 'px');
    microPositions.push(px + 'px ' + py + 'px');
  }

  // First-listed layer paints on top.
  const layers = [...microLayers, ...midLayers, ...washLayers];
  const sizes = [...microSizes, ...midSizes, ...washSizes];
  const positions = [...microPositions, ...midPositions, ...washPositions];

  return {
    backgroundImage: layers.join(', '),
    backgroundSize: sizes.join(', '),
    backgroundPosition: positions.join(', '),
    backgroundRepeat: 'repeat',
    // Keep hues distinct (avoid screen/additive blend that collapses palettes).
    backgroundBlendMode: new Array(layers.length).fill('normal').join(', '),
    filter: 'saturate(1.55) contrast(1.18)',
    opacity: 1,
  };
}`;

s = s.replace(re, () => newFn + '\n\nfunction setMaskPosition');
fs.writeFileSync(target, s, 'utf8');
console.log('✅ Applied: backdrop rainbow now uses opaque tiled radial washes + micro splotches (stronger color separation, no banding).');
