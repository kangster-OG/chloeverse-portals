const fs = require('fs');
const path = require('path');

function fail(msg){
  console.error(msg);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const target = path.join(repoRoot, 'src', 'components', 'home', 'ChloeverseMainLanding.tsx');

if(!fs.existsSync(target)){
  fail('PATCH_ABORT: Could not find ' + target);
}

let s = fs.readFileSync(target, 'utf8');

const startNeedle = 'export function paintBackdropStyle(seed: number): CSSProperties {';
if(!s.includes(startNeedle)){
  fail('PATCH_ABORT: paintBackdropStyle() signature not found.');
}

const replacementFn = `export function paintBackdropStyle(seed: number): CSSProperties {
  // Backdrop is revealed only through a cursor-driven mask.
  // Goal: inside a small (~cursor) circle, show multiple distinct rainbow "paint" blobs at once.
  // Avoid additive blending that collapses hues into one family.

  const microLayers: string[] = [];
  const microSizes: string[] = [];
  const microPositions: string[] = [];

  const baseLayers: string[] = [];
  const baseSizes: string[] = [];
  const basePositions: string[] = [];

  const fillLayers: string[] = [];
  const fillSizes: string[] = [];
  const fillPositions: string[] = [];

  // Bottom-most fully opaque wash (tiled) so *no black* can ever peek through inside the mask.
  // Keep it radial (not conic) to avoid banding.
  const washA = backdropColorAt(seed, 1901);
  const washB = backdropColorAt(seed, 1902);
  const washC = backdropColorAt(seed, 1903);
  const washX = Math.floor(18 + seeded(seed, 1904) * 64);
  const washY = Math.floor(18 + seeded(seed, 1905) * 64);
  const washLayer = `radial-gradient(circle at ${washX}% ${washY}%, ${washA} 0%, ${washB} 46%, ${washC} 100%)`;
  const washSize = 260;
  const washPx = Math.floor(seeded(seed, 1906) * washSize);
  const washPy = Math.floor(seeded(seed, 1907) * washSize);

  // Smaller tiling for micro-splotches so a ~68px disk samples multiple hues.
  const microTileSizes = [72, 88, 104, 120];
  const baseTileSizes = [140, 180, 220, 260];
  const fillTileSizes = [200, 240, 280];

  // Medium fill blobs (under base, above wash) to guarantee strong coverage without looking stripey.
  for (let i = 0; i < 12; i += 1) {
    const c = backdropColorAt(seed, 2000 + i * 11);
    const x = Math.floor(10 + seeded(seed, 2040 + i) * 80);
    const y = Math.floor(10 + seeded(seed, 2080 + i) * 80);
    const radius = Math.floor(70 + seeded(seed, 2120 + i) * 70);
    const fade = radius + Math.floor(70 + seeded(seed, 2160 + i) * 90);
    const size = fillTileSizes[i % fillTileSizes.length];
    const px = Math.floor(seeded(seed, 2200 + i) * size);
    const py = Math.floor(seeded(seed, 2240 + i) * size);

    fillLayers.push(
      `radial-gradient(circle at ${x}% ${y}%, ${hexToRgba(c, 0.62)} 0px, ${hexToRgba(c, 0.42)} ${radius}px, rgba(0,0,0,0) ${fade}px)`
    );
    fillSizes.push(`${size}px ${size}px`);
    fillPositions.push(`${px}px ${py}px`);
  }

  // Larger two-tone blobs (distinct inner/outer colors) for painterly variation.
  for (let i = 0; i < 14; i += 1) {
    const c1 = backdropColorAt(seed, 300 + i * 3);
    // Force separation by sampling from a different offset.
    const c2 = backdropColorAt(seed, 900 + i * 7);
    const x = Math.floor(8 + seeded(seed, 340 + i) * 84);
    const y = Math.floor(8 + seeded(seed, 380 + i) * 84);
    const radius = Math.floor(48 + seeded(seed, 420 + i) * 78);
    const fade = radius + Math.floor(50 + seeded(seed, 460 + i) * 90);
    const size = baseTileSizes[i % baseTileSizes.length];
    const px = Math.floor(seeded(seed, 500 + i) * size);
    const py = Math.floor(seeded(seed, 540 + i) * size);

    baseLayers.push(
      `radial-gradient(circle at ${x}% ${y}%, ${hexToRgba(c1, 0.82)} 0px, ${hexToRgba(c2, 0.55)} ${radius}px, rgba(0,0,0,0) ${fade}px)`
    );
    baseSizes.push(`${size}px ${size}px`);
    basePositions.push(`${px}px ${py}px`);
  }

  // High-frequency micro splotches on top (no additive blending; keep hues distinct).
  for (let i = 0; i < 54; i += 1) {
    const c1 = backdropColorAt(seed, 700 + i * 7);
    const c2 = backdropColorAt(seed, 777 + i * 9);
    const x = Math.floor(6 + seeded(seed, 760 + i) * 88);
    const y = Math.floor(6 + seeded(seed, 820 + i) * 88);
    const radius = Math.floor(12 + seeded(seed, 880 + i) * 18);
    const fade = radius + Math.floor(10 + seeded(seed, 940 + i) * 16);
    const size = microTileSizes[i % microTileSizes.length];
    const px = Math.floor(seeded(seed, 1000 + i) * size);
    const py = Math.floor(seeded(seed, 1060 + i) * size);

    microLayers.push(
      `radial-gradient(circle at ${x}% ${y}%, ${hexToRgba(c1, 0.98)} 0px, ${hexToRgba(c2, 0.86)} ${radius}px, rgba(0,0,0,0) ${fade}px)`
    );
    microSizes.push(`${size}px ${size}px`);
    microPositions.push(`${px}px ${py}px`);
  }

  // IMPORTANT: first-listed layer paints on top.
  const layers = [...microLayers, ...baseLayers, ...fillLayers, washLayer];
  const sizes = [...microSizes, ...baseSizes, ...fillSizes, `${washSize}px ${washSize}px`];
  const positions = [...microPositions, ...basePositions, ...fillPositions, `${washPx}px ${washPy}px`];

  return {
    backgroundImage: layers.join(', '),
    backgroundSize: sizes.join(', '),
    backgroundPosition: positions.join(', '),
    backgroundRepeat: 'repeat',
    // Keep it vibrant but avoid crushing everything into one hue family.
    filter: 'saturate(1.45) contrast(1.12)',
    opacity: 1,
  };
}`;

const re = /export function paintBackdropStyle\(seed: number\): CSSProperties \{[\s\S]*?\n\}\n\nfunction setMaskPosition\(/m;
if(!re.test(s)){
  fail('PATCH_ABORT: Could not locate paintBackdropStyle block for replacement.');
}

s = s.replace(re, replacementFn + '\n\nfunction setMaskPosition(');
fs.writeFileSync(target, s);
console.log('✅ Applied: Backdrop rainbow v2 (distinct hues, no additive blending, opaque wash to prevent black peeking).');
