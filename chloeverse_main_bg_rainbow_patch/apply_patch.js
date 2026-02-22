const fs = require("fs");
const path = require("path");

const TARGET = path.join("src", "components", "home", "ChloeverseMainLanding.tsx");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function main() {
  if (!fs.existsSync("package.json")) {
    fail("PATCH_ABORT: run apply_patch.cmd from the repo root (folder with package.json).");
  }
  if (!fs.existsSync(TARGET)) {
    fail("PATCH_ABORT: expected file not found: " + TARGET);
  }

  let s = fs.readFileSync(TARGET, "utf8");

  // 1) Insert BACKDROP_COLORS + backdropColorAt if missing
  if (!s.includes("const BACKDROP_COLORS")) {
    const anchor = "function hexToRgba";
    const at = s.indexOf(anchor);
    if (at < 0) fail("PATCH_ABORT: could not find anchor 'function hexToRgba' to insert backdrop palette.");
    const insertPos = at;
    s = s.slice(0, insertPos) + `const BACKDROP_COLORS = [
  "#FF2D95", // hot pink
  "#FF3D00", // neon red-orange
  "#FFB300", // vivid amber
  "#FFF44F", // electric yellow
  "#00E676", // neon green
  "#00E5FF", // neon cyan
  "#2979FF", // bright blue
  "#7C4DFF", // electric violet
  "#E040FB", // punchy purple
] as const;

function backdropColorAt(seed: number, offset: number): string {
  const index = Math.floor(seeded(seed, offset) * BACKDROP_COLORS.length) % BACKDROP_COLORS.length;
  return BACKDROP_COLORS[index];
}
\n\n` + s.slice(insertPos);
  }

  // 2) Replace paintBackdropStyle
  const fnName = "function paintBackdropStyle";
  const start = s.indexOf(fnName);
  if (start < 0) fail("PATCH_ABORT: could not find " + fnName);
  const braceStart = s.indexOf("{", start);
  if (braceStart < 0) fail("PATCH_ABORT: could not find opening brace for paintBackdropStyle");
  const end = findMatchingBrace(s, braceStart);
  if (end < 0) fail("PATCH_ABORT: could not match braces for paintBackdropStyle");

  const NEW_FN = [
    "function paintBackdropStyle(seed: number): CSSProperties {",
    "  // Backdrop is revealed only through a cursor-driven mask. This style must look",
    "  // like multi-color paint splotches inside a small (~cursor) circle\u2014no banding.",
    "  const baseLayers: string[] = [];",
    "  const baseSizes: string[] = [];",
    "  const basePositions: string[] = [];",
    "  const microLayers: string[] = [];",
    "  const microSizes: string[] = [];",
    "  const microPositions: string[] = [];",
    "",
    "  const baseTileSizes = [160, 200, 240, 280];",
    "  const microTileSizes = [120, 150, 180];",
    "",
    "  // Mid/large overlapping blobs that guarantee color coverage without straight bands.",
    "  for (let i = 0; i < 16; i += 1) {",
    "    const c1 = backdropColorAt(seed, 300 + i * 3);",
    "    const c2 = backdropColorAt(seed, 301 + i * 3);",
    "    const x = Math.floor(8 + seeded(seed, 340 + i) * 84);",
    "    const y = Math.floor(8 + seeded(seed, 380 + i) * 84);",
    "    const radius = Math.floor(42 + seeded(seed, 420 + i) * 70);",
    "    const fade = radius + Math.floor(26 + seeded(seed, 460 + i) * 70);",
    "    const size = baseTileSizes[i % baseTileSizes.length];",
    "    const px = Math.floor(seeded(seed, 500 + i) * size);",
    "    const py = Math.floor(seeded(seed, 540 + i) * size);",
    "",
    "    // Two-color blob (inner -> outer) for stronger rainbow separation inside a small disk.",
    "    baseLayers.push(",
    "      `radial-gradient(circle at ${x}% ${y}%, ${hexToRgba(c1, 0.72)} 0px, ${hexToRgba(c2, 0.60)} ${radius}px, rgba(0,0,0,0) ${fade}px)`",
    "    );",
    "    baseSizes.push(`${size}px ${size}px`);",
    "    basePositions.push(`${px}px ${py}px`);",
    "  }",
    "",
    "  // Micro splotches on top for the \u201cpaint\u201d feel (high frequency).",
    "  for (let i = 0; i < 30; i += 1) {",
    "    const color = backdropColorAt(seed, 700 + i * 7);",
    "    const x = Math.floor(6 + seeded(seed, 760 + i) * 88);",
    "    const y = Math.floor(6 + seeded(seed, 820 + i) * 88);",
    "    const radius = Math.floor(12 + seeded(seed, 880 + i) * 18);",
    "    const fade = radius + Math.floor(8 + seeded(seed, 940 + i) * 16);",
    "    const size = microTileSizes[i % microTileSizes.length];",
    "    const px = Math.floor(seeded(seed, 1000 + i) * size);",
    "    const py = Math.floor(seeded(seed, 1060 + i) * size);",
    "",
    "    microLayers.push(",
    "      `radial-gradient(circle at ${x}% ${y}%, ${hexToRgba(color, 0.98)} 0px, ${hexToRgba(color, 0.98)} ${radius}px, rgba(0,0,0,0) ${fade}px)`",
    "    );",
    "    microSizes.push(`${size}px ${size}px`);",
    "    microPositions.push(`${px}px ${py}px`);",
    "  }",
    "",
    "  // IMPORTANT: first-listed layer paints on top. Keep micro layers topmost.",
    "  const layers = [...microLayers, ...baseLayers];",
    "  const sizes = [...microSizes, ...baseSizes];",
    "  const positions = [...microPositions, ...basePositions];",
    "",
    "  const microBlend = new Array(microLayers.length).fill(\"screen\");",
    "  const baseBlend = new Array(baseLayers.length).fill(\"normal\");",
    "",
    "  return {",
    "    // Avoid any black peeking through if a tile edge lands between blobs.",
    "    backgroundColor: hexToRgba(backdropColorAt(seed, 1337), 0.55),",
    "    backgroundImage: layers.join(\", \"),",
    "    backgroundSize: sizes.join(\", \"),",
    "    backgroundPosition: positions.join(\", \"),",
    "    backgroundRepeat: \"repeat\",",
    "    backgroundBlendMode: [...microBlend, ...baseBlend].join(\", \"),",
    "    filter: \"saturate(1.55) contrast(1.22)\",",
    "    opacity: 1,",
    "  };",
    "}",
  ].join("\n");

  s = s.slice(0, start) + NEW_FN + s.slice(end);

  fs.writeFileSync(TARGET, s);
  console.log("✅ Applied: stronger rainbow micro-splotch backdrop (no banding).");
}

main();
