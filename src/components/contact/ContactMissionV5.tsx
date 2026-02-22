"use client";

import { useEffect, useRef } from "react";

const CONTACT_CONFIG = {
  email: "chloe@ugcbychloekang.com",
  instagram: "https://instagram.com/imchloekang",
  tiktok: "https://www.tiktok.com/@imchloekang",
  linkedin: "https://www.linkedin.com/in/chloekang",
  x: "https://x.com/imchloekang",
  candyCastleUrl: "https://imchloekang.com",
} as const;

const INTERNAL_WIDTH = 400;
const INTERNAL_HEIGHT = 225;

const COUNTDOWN_DURATION = 2.4;
const LIFTOFF_DURATION = 1.8;
const PLANET_DURATION = 1.0;
const PLANET_CROSSFADE = 0.12;
const CRASH_DURATION = 0.9;
const EXPLOSION_DURATION = 0.9;

const SOUND_RECT = { x: 322, y: 8, w: 70, h: 14 };

type Phase =
  | "countdown"
  | "liftoff"
  | "montage"
  | "crash"
  | "explosion"
  | "card";

type TextureKind =
  | "craters"
  | "venus-haze"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

interface PlanetDefinition {
  name: string;
  texture: TextureKind;
  skyTop: string;
  skyBottom: string;
  base: string;
  shade: string;
  highlight: string;
  fgMain: string;
  fgAlt: string;
}

interface PlanetBuffers {
  mid: HTMLCanvasElement;
  fg: HTMLCanvasElement;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
  color: string;
  kind: "smoke" | "spark";
}

interface Hitbox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  action: () => void | Promise<void>;
}

interface TimelineState {
  phase: Phase;
  local: number;
}

const PLANETS: PlanetDefinition[] = [
  {
    name: "MERCURY",
    texture: "craters",
    skyTop: "#201a1f",
    skyBottom: "#120f13",
    base: "#a78f74",
    shade: "#7a664f",
    highlight: "#cfb79d",
    fgMain: "#4c4036",
    fgAlt: "#655241",
  },
  {
    name: "VENUS",
    texture: "venus-haze",
    skyTop: "#311f22",
    skyBottom: "#1f1316",
    base: "#c8a26c",
    shade: "#8f6b3d",
    highlight: "#e0bd84",
    fgMain: "#5b3f2d",
    fgAlt: "#7a5337",
  },
  {
    name: "EARTH",
    texture: "earth",
    skyTop: "#13203d",
    skyBottom: "#0f1528",
    base: "#2e72ad",
    shade: "#194f7d",
    highlight: "#50b4d6",
    fgMain: "#2c4736",
    fgAlt: "#486952",
  },
  {
    name: "MARS",
    texture: "mars",
    skyTop: "#301819",
    skyBottom: "#1f1011",
    base: "#b35f43",
    shade: "#7c3e2f",
    highlight: "#d88965",
    fgMain: "#5f2f25",
    fgAlt: "#7b3f30",
  },
  {
    name: "JUPITER",
    texture: "jupiter",
    skyTop: "#2a2220",
    skyBottom: "#191211",
    base: "#cfa578",
    shade: "#9c7452",
    highlight: "#e9c092",
    fgMain: "#4f3a2e",
    fgAlt: "#6e4f3d",
  },
  {
    name: "SATURN",
    texture: "saturn",
    skyTop: "#23211c",
    skyBottom: "#16140f",
    base: "#d3b67b",
    shade: "#9f8355",
    highlight: "#f0d29b",
    fgMain: "#4e4535",
    fgAlt: "#6a5f49",
  },
  {
    name: "URANUS",
    texture: "uranus",
    skyTop: "#18262a",
    skyBottom: "#10191c",
    base: "#84c6c9",
    shade: "#4e9095",
    highlight: "#b4ecec",
    fgMain: "#2f4e52",
    fgAlt: "#42676c",
  },
  {
    name: "NEPTUNE",
    texture: "neptune",
    skyTop: "#121f3c",
    skyBottom: "#0b1225",
    base: "#507fc9",
    shade: "#2f4e88",
    highlight: "#75a7e8",
    fgMain: "#2a365d",
    fgAlt: "#384575",
  },
  {
    name: "PLUTO",
    texture: "pluto",
    skyTop: "#1f2533",
    skyBottom: "#111522",
    base: "#c2c8da",
    shade: "#8a93a8",
    highlight: "#e6ebf8",
    fgMain: "#4e5772",
    fgAlt: "#6a7392",
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  const v = clamp(t, 0, 1);
  return 1 - (1 - v) ** 3;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createPixelCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = INTERNAL_WIDTH;
  canvas.height = INTERNAL_HEIGHT;
  return canvas;
}

function containsPoint(
  px: number,
  py: number,
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  return px >= rect.x && py >= rect.y && px <= rect.x + rect.w && py <= rect.y + rect.h;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixHex(a: string, b: string, t: number): string {
  const ta = clamp(t, 0, 1);
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * ta);
  const g = Math.round(ag + (bg - ag) * ta);
  const bl = Math.round(ab + (bb - ab) * ta);
  return `rgb(${r}, ${g}, ${bl})`;
}

function drawFilledCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y += 1) {
    const span = Math.floor(Math.sqrt(radius * radius - y * y));
    ctx.fillRect(cx - span, cy + y, span * 2 + 1, 1);
  }
}

function drawCircleOutline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 360; i += 1) {
    const angle = (i * Math.PI) / 180;
    const x = Math.round(cx + Math.cos(angle) * radius);
    const y = Math.round(cy + Math.sin(angle) * radius);
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawDitherBand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  a: string,
  b: string,
): void {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      ctx.fillStyle = (xx + yy) % 2 === 0 ? a : b;
      ctx.fillRect(xx, yy, 1, 1);
    }
  }
}

function drawWrappedLayer(
  ctx: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  shift: number,
): void {
  const normalized = ((shift % INTERNAL_WIDTH) + INTERNAL_WIDTH) % INTERNAL_WIDTH;
  ctx.drawImage(layer, -normalized, 0);
  ctx.drawImage(layer, INTERNAL_WIDTH - normalized, 0);
}

function buildPlanetMidLayer(
  ctx: CanvasRenderingContext2D,
  planet: PlanetDefinition,
  index: number,
): void {
  const rng = makeRng(9011 + index * 131);

  for (let y = 0; y < 170; y += 1) {
    ctx.fillStyle = mixHex(planet.skyTop, planet.skyBottom, y / 170);
    ctx.fillRect(0, y, INTERNAL_WIDTH, 1);
  }

  const horizonY = 150;
  for (let x = 0; x < INTERNAL_WIDTH; x += 8) {
    const h = 6 + Math.floor(rng() * 8);
    ctx.fillStyle = index % 2 === 0 ? "#1a1e2b" : "#171922";
    ctx.fillRect(x, horizonY - h, 8, h);
  }

  for (let i = 0; i < 22; i += 1) {
    const sx = Math.floor(rng() * INTERNAL_WIDTH);
    const sy = Math.floor(rng() * 88);
    ctx.fillStyle = i % 3 === 0 ? "#f8f6d2" : "#b9c6ea";
    ctx.fillRect(sx, sy, rng() > 0.8 ? 2 : 1, 1);
  }

  const cx = 284 + (index % 2 === 0 ? -4 : 5);
  const cy = 102 + ((index * 3) % 7);
  const radius = 44 + (index % 3);
  drawFilledCircle(ctx, cx, cy, radius, planet.base);

  switch (planet.texture) {
    case "craters": {
      for (let i = 0; i < 12; i += 1) {
        const a = rng() * Math.PI * 2;
        const r = Math.floor(rng() * (radius - 6));
        const px = Math.round(cx + Math.cos(a) * r);
        const py = Math.round(cy + Math.sin(a) * r);
        const craterR = 2 + Math.floor(rng() * 3);
        drawFilledCircle(ctx, px, py, craterR, planet.shade);
        drawCircleOutline(ctx, px, py, craterR, "#5d4d3f");
      }
      break;
    }
    case "venus-haze": {
      for (let y = -radius; y <= radius; y += 4) {
        const span = Math.floor(Math.sqrt(radius * radius - y * y));
        ctx.fillStyle = (y / 4) % 2 === 0 ? planet.shade : planet.highlight;
        ctx.fillRect(cx - span, cy + y, span * 2 + 1, 2);
      }
      for (let i = 0; i < 7; i += 1) {
        const px = cx - radius + 5 + i * 12;
        const py = cy + Math.sin(i) * 8;
        ctx.fillStyle = "#d7b17a";
        ctx.fillRect(px, py, 9, 2);
      }
      break;
    }
    case "earth": {
      for (let i = 0; i < 7; i += 1) {
        const px = cx - 18 + i * 6;
        const py = cy - 10 + Math.floor(Math.sin(i) * 7);
        ctx.fillStyle = "#49a05f";
        ctx.fillRect(px, py, 8, 5);
      }
      for (let i = 0; i < 10; i += 1) {
        const px = cx - 26 + Math.floor(rng() * 54);
        const py = cy - 26 + Math.floor(rng() * 50);
        ctx.fillStyle = "#dceeff";
        ctx.fillRect(px, py, 4, 2);
      }
      break;
    }
    case "mars": {
      drawDitherBand(ctx, cx - 30, cy - 20, 60, 40, planet.base, planet.shade);
      ctx.fillStyle = "#e0a173";
      ctx.fillRect(cx - 18, cy + 8, 34, 4);
      for (let i = 0; i < 7; i += 1) {
        drawFilledCircle(
          ctx,
          cx - 20 + Math.floor(rng() * 40),
          cy - 18 + Math.floor(rng() * 36),
          2,
          "#8e4a34",
        );
      }
      break;
    }
    case "jupiter": {
      for (let y = -radius; y <= radius; y += 5) {
        const span = Math.floor(Math.sqrt(radius * radius - y * y));
        const shade = y % 10 === 0 ? planet.highlight : planet.shade;
        ctx.fillStyle = shade;
        ctx.fillRect(cx - span, cy + y, span * 2 + 1, 3);
      }
      drawFilledCircle(ctx, cx + 10, cy + 8, 7, "#b95f4a");
      drawCircleOutline(ctx, cx + 10, cy + 8, 7, "#8a4134");
      break;
    }
    case "saturn": {
      for (let y = -radius; y <= radius; y += 6) {
        const span = Math.floor(Math.sqrt(radius * radius - y * y));
        ctx.fillStyle = y % 12 === 0 ? planet.highlight : planet.shade;
        ctx.fillRect(cx - span, cy + y, span * 2 + 1, 3);
      }
      ctx.fillStyle = "#8f7c5c";
      for (let i = -58; i <= 58; i += 1) {
        const ringY = Math.round(cy + i * 0.2);
        ctx.fillRect(cx + i, ringY, 1, 1);
        if (i % 2 === 0) {
          ctx.fillRect(cx + i, ringY + 1, 1, 1);
        }
      }
      break;
    }
    case "uranus": {
      for (let x = -radius; x <= radius; x += 5) {
        const span = Math.floor(Math.sqrt(radius * radius - x * x));
        ctx.fillStyle = x % 10 === 0 ? planet.highlight : planet.shade;
        ctx.fillRect(cx + x, cy - span, 2, span * 2 + 1);
      }
      ctx.fillStyle = "#d8f6f5";
      ctx.fillRect(cx - 26, cy - 6, 52, 3);
      break;
    }
    case "neptune": {
      for (let i = 0; i < 12; i += 1) {
        const y = cy - 24 + i * 4;
        ctx.fillStyle = i % 2 === 0 ? planet.highlight : planet.shade;
        ctx.fillRect(cx - 34, y, 68, 2);
      }
      drawFilledCircle(ctx, cx - 8, cy + 4, 7, "#27427d");
      drawFilledCircle(ctx, cx + 18, cy - 14, 5, "#35599b");
      break;
    }
    case "pluto": {
      drawDitherBand(ctx, cx - 30, cy - 28, 60, 56, planet.base, planet.shade);
      for (let i = 0; i < 9; i += 1) {
        const px = cx - 24 + Math.floor(rng() * 48);
        const py = cy - 22 + Math.floor(rng() * 44);
        ctx.fillStyle = planet.highlight;
        ctx.fillRect(px, py, 5, 3);
      }
      break;
    }
  }

  drawCircleOutline(ctx, cx, cy, radius, "#101015");
}

function buildPlanetForeground(
  ctx: CanvasRenderingContext2D,
  planet: PlanetDefinition,
): void {
  ctx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

  switch (planet.name) {
    case "MERCURY": {
      for (let x = 0; x < INTERNAL_WIDTH; x += 16) {
        const h = 26 + (x % 32 === 0 ? 8 : 0);
        ctx.fillStyle = planet.fgMain;
        ctx.fillRect(x, INTERNAL_HEIGHT - h, 16, h);
      }
      ctx.fillStyle = planet.fgAlt;
      ctx.fillRect(44, 154, 94, 9);
      ctx.fillStyle = "#ccd6dc";
      ctx.fillRect(86, 142, 2, 12);
      ctx.fillRect(78, 150, 18, 2);
      break;
    }
    case "VENUS": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 168, INTERNAL_WIDTH, 57);
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? planet.fgAlt : "#8f5f3d";
        ctx.fillRect(10 + i * 45, 152 + (i % 3), 30, 8);
      }
      ctx.fillStyle = "#f5c57d";
      ctx.fillRect(104, 150, 3, 15);
      ctx.fillRect(96, 146, 18, 4);
      break;
    }
    case "EARTH": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 170, INTERNAL_WIDTH, 55);
      ctx.fillStyle = "#3f7345";
      for (let x = 0; x < INTERNAL_WIDTH; x += 10) {
        ctx.fillRect(x, 165 + (x % 20 === 0 ? 0 : 1), 10, 6);
      }
      ctx.fillStyle = "#d8e8f6";
      ctx.fillRect(86, 145, 2, 20);
      ctx.fillRect(78, 145, 18, 2);
      ctx.fillRect(82, 153, 10, 2);
      break;
    }
    case "MARS": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 169, INTERNAL_WIDTH, 56);
      for (let i = 0; i < 13; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? planet.fgAlt : "#8b4334";
        ctx.fillRect(i * 34, 156 + (i % 4), 22, 10);
      }
      ctx.fillStyle = "#c9c6bc";
      ctx.fillRect(100, 155, 20, 6);
      ctx.fillRect(108, 149, 4, 6);
      ctx.fillRect(96, 161, 4, 2);
      ctx.fillRect(118, 161, 4, 2);
      break;
    }
    case "JUPITER": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 171, INTERNAL_WIDTH, 54);
      ctx.fillStyle = planet.fgAlt;
      ctx.fillRect(56, 154, 120, 12);
      for (let i = 0; i < 7; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? "#7f5e47" : "#966e52";
        ctx.fillRect(60 + i * 16, 156, 10, 8);
      }
      ctx.fillStyle = "#dde4ef";
      ctx.fillRect(198, 146, 2, 18);
      ctx.fillRect(194, 144, 10, 2);
      break;
    }
    case "SATURN": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 171, INTERNAL_WIDTH, 54);
      ctx.fillStyle = planet.fgAlt;
      ctx.fillRect(44, 160, 142, 8);
      ctx.fillRect(52, 152, 8, 8);
      ctx.fillRect(170, 152, 8, 8);
      ctx.fillStyle = "#f9d484";
      ctx.fillRect(112, 143, 2, 17);
      ctx.fillRect(108, 145, 10, 2);
      break;
    }
    case "URANUS": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 168, INTERNAL_WIDTH, 57);
      for (let i = 0; i < 14; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? planet.fgAlt : "#5f8c91";
        ctx.fillRect(i * 30, 158 + (i % 3), 16, 10);
      }
      ctx.fillStyle = "#cff8f8";
      ctx.fillRect(98, 148, 3, 14);
      ctx.fillRect(93, 154, 5, 5);
      ctx.fillRect(101, 151, 5, 5);
      break;
    }
    case "NEPTUNE": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 170, INTERNAL_WIDTH, 55);
      for (let i = 0; i < 10; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? planet.fgAlt : "#3f4f84";
        ctx.fillRect(i * 42, 158 + (i % 2), 28, 9);
      }
      ctx.fillStyle = "#b8d5ff";
      ctx.fillRect(216, 147, 2, 16);
      ctx.fillRect(212, 150, 10, 2);
      break;
    }
    case "PLUTO": {
      ctx.fillStyle = planet.fgMain;
      ctx.fillRect(0, 166, INTERNAL_WIDTH, 59);
      for (let i = 0; i < 14; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? planet.fgAlt : "#8f98b8";
        ctx.fillRect(i * 30, 156 + (i % 4), 20, 10);
      }
      ctx.fillStyle = "#d4dcff";
      ctx.fillRect(255, 134, 2, 26);
      ctx.fillRect(255, 134, 14, 2);
      ctx.fillStyle = "#ff6e8f";
      ctx.fillRect(257, 136, 10, 6);
      break;
    }
  }
}

function buildPlanetBuffers(): PlanetBuffers[] {
  return PLANETS.map((planet, index) => {
    const mid = createPixelCanvas();
    const fg = createPixelCanvas();

    const midCtx = mid.getContext("2d");
    const fgCtx = fg.getContext("2d");
    if (!midCtx || !fgCtx) {
      throw new Error("Failed to create planet scene contexts.");
    }

    midCtx.imageSmoothingEnabled = false;
    fgCtx.imageSmoothingEnabled = false;

    buildPlanetMidLayer(midCtx, planet, index);
    buildPlanetForeground(fgCtx, planet);

    return { mid, fg };
  });
}

function buildStars(seed: number, count: number): Star[] {
  const rng = makeRng(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.floor(rng() * INTERNAL_WIDTH),
      y: Math.floor(rng() * 145),
      size: rng() > 0.86 ? 2 : 1,
      twinkle: rng() * Math.PI * 2,
    });
  }
  return stars;
}

function resolveTimeline(elapsed: number, forceCard: boolean): TimelineState {
  if (forceCard) {
    return { phase: "card", local: 0 };
  }

  let t = elapsed;
  if (t < COUNTDOWN_DURATION) {
    return { phase: "countdown", local: t };
  }
  t -= COUNTDOWN_DURATION;

  if (t < LIFTOFF_DURATION) {
    return { phase: "liftoff", local: t };
  }
  t -= LIFTOFF_DURATION;

  const montageDuration = PLANETS.length * PLANET_DURATION;
  if (t < montageDuration) {
    return { phase: "montage", local: t };
  }
  t -= montageDuration;

  if (t < CRASH_DURATION) {
    return { phase: "crash", local: t };
  }
  t -= CRASH_DURATION;

  if (t < EXPLOSION_DURATION) {
    return { phase: "explosion", local: t };
  }

  return { phase: "card", local: 0 };
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  thrusterFrame: 0 | 1,
  tilt: number,
): void {
  const points = [
    { x: 0, y: 4, w: 2, h: 8, color: "#d55252" },
    { x: 2, y: 2, w: 7, h: 12, color: "#f0f1f5" },
    { x: 4, y: 0, w: 3, h: 2, color: "#f8cb63" },
    { x: 3, y: 6, w: 5, h: 4, color: "#7da6f1" },
    { x: 9, y: 4, w: 2, h: 8, color: "#d55252" },
    { x: 4, y: 14, w: 3, h: 3, color: thrusterFrame === 0 ? "#ffb347" : "#ffd887" },
    { x: 5, y: 17, w: 1, h: thrusterFrame === 0 ? 4 : 6, color: "#ff7f4d" },
  ];

  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  if (tilt !== 0) {
    ctx.translate(6, 9);
    ctx.rotate(tilt);
    ctx.translate(-6, -9);
  }

  for (const p of points) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  ctx.fillStyle = "#171a24";
  ctx.fillRect(2, 2, 7, 1);
  ctx.fillRect(2, 13, 7, 1);
  ctx.fillRect(2, 2, 1, 12);
  ctx.fillRect(8, 2, 1, 12);
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  nowSec: number,
  alpha: number,
): void {
  const visible = clamp(alpha, 0, 1);
  ctx.globalAlpha = visible;
  for (const star of stars) {
    const twinkle = 0.65 + Math.sin(nowSec * 2.2 + star.twinkle) * 0.35;
    ctx.fillStyle = twinkle > 0.8 ? "#fffbe0" : "#a8b6dd";
    ctx.fillRect(star.x, star.y, star.size, 1);
  }
  ctx.globalAlpha = 1;
}

function drawSoundToggle(
  ctx: CanvasRenderingContext2D,
  soundOn: boolean,
  hovered: boolean,
): void {
  ctx.fillStyle = hovered ? "#3a455f" : "#263147";
  ctx.fillRect(SOUND_RECT.x, SOUND_RECT.y, SOUND_RECT.w, SOUND_RECT.h);
  ctx.fillStyle = "#0c1019";
  ctx.fillRect(SOUND_RECT.x + 1, SOUND_RECT.y + 1, SOUND_RECT.w - 2, SOUND_RECT.h - 2);
  ctx.fillStyle = hovered ? "#9ec8ff" : "#c8dcff";
  ctx.font = "bold 8px monospace";
  ctx.fillText(soundOn ? "SOUND ON" : "SOUND OFF", SOUND_RECT.x + 7, SOUND_RECT.y + 10);
}

function drawStamp(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#0c0f19";
  ctx.fillRect(6, INTERNAL_HEIGHT - 16, 132, 10);
  ctx.fillStyle = "#85a4d8";
  ctx.font = "bold 8px monospace";
  ctx.fillText("CONTACT MISSION v5", 10, INTERNAL_HEIGHT - 8);
}

export default function ContactMissionV5() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startMsRef = useRef(0);
  const lastMsRef = useRef(0);
  const currentPhaseRef = useRef<Phase>("countdown");
  const prevPhaseRef = useRef<Phase | null>(null);
  const forceCardRef = useRef(false);
  const sceneBuffersRef = useRef<PlanetBuffers[]>([]);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const smokeAccumulatorRef = useRef(0);
  const hitboxesRef = useRef<Hitbox[]>([]);
  const hoverIdRef = useRef<string | null>(null);
  const copyToastUntilRef = useRef(0);
  const countdownTickRef = useRef(3);
  const crashBonkPlayedRef = useRef(false);
  const crashSparkedRef = useRef(false);
  const explosionSpawnedRef = useRef(false);
  const soundEnabledRef = useRef(false);
  const userInteractedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.imageSmoothingEnabled = false;
    sceneBuffersRef.current = buildPlanetBuffers();
    starsRef.current = buildStars(8127, 84);

    const ensureAudioContext = (): AudioContext | null => {
      if (!soundEnabledRef.current) {
        return null;
      }

      const AudioCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      }

      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    };

    const playTone = (
      frequency: number,
      duration: number,
      type: OscillatorType,
      gain: number,
      endFrequency?: number,
    ): void => {
      if (!userInteractedRef.current) {
        return;
      }

      const audio = ensureAudioContext();
      if (!audio) {
        return;
      }

      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      amp.gain.value = gain;
      if (endFrequency !== undefined) {
        osc.frequency.linearRampToValueAtTime(
          endFrequency,
          audio.currentTime + duration,
        );
      }
      amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + duration);
    };

    const playUiClick = (): void => {
      playTone(680, 0.09, "square", 0.03, 760);
    };

    const playCountdownBeep = (): void => {
      playTone(430, 0.12, "triangle", 0.03, 510);
    };

    const playBonk = (): void => {
      playTone(220, 0.19, "square", 0.05, 120);
    };

    const playExplosion = (): void => {
      playTone(520, 0.12, "sawtooth", 0.06, 240);
      playTone(260, 0.28, "triangle", 0.045, 90);
    };

    const createCardHitboxes = (): Hitbox[] => {
      const openInTab = (url: string): void => {
        window.open(url, "_blank", "noopener,noreferrer");
      };

      return [
        {
          id: "open-email",
          label: "OPEN EMAIL",
          x: 68,
          y: 98,
          w: 102,
          h: 18,
          action: () => {
            playUiClick();
            window.location.href = `mailto:${CONTACT_CONFIG.email}`;
          },
        },
        {
          id: "copy-email",
          label: "COPY EMAIL",
          x: 178,
          y: 98,
          w: 102,
          h: 18,
          action: async () => {
            playUiClick();
            try {
              await navigator.clipboard.writeText(CONTACT_CONFIG.email);
            } catch {
              // No-op fallback; toast still confirms interaction.
            }
            copyToastUntilRef.current = performance.now() + 1200;
          },
        },
        {
          id: "social-ig",
          label: "IG",
          x: 68,
          y: 122,
          w: 44,
          h: 16,
          action: () => {
            playUiClick();
            openInTab(CONTACT_CONFIG.instagram);
          },
        },
        {
          id: "social-tt",
          label: "TT",
          x: 118,
          y: 122,
          w: 44,
          h: 16,
          action: () => {
            playUiClick();
            openInTab(CONTACT_CONFIG.tiktok);
          },
        },
        {
          id: "social-in",
          label: "IN",
          x: 168,
          y: 122,
          w: 44,
          h: 16,
          action: () => {
            playUiClick();
            openInTab(CONTACT_CONFIG.linkedin);
          },
        },
        {
          id: "social-x",
          label: "X",
          x: 218,
          y: 122,
          w: 44,
          h: 16,
          action: () => {
            playUiClick();
            openInTab(CONTACT_CONFIG.x);
          },
        },
        {
          id: "back-portals",
          label: "BACK TO PORTALS",
          x: 68,
          y: 144,
          w: 124,
          h: 18,
          action: () => {
            playUiClick();
            window.location.href = "/";
          },
        },
        {
          id: "candy-castle",
          label: "RETURN TO CANDY CASTLE",
          x: 198,
          y: 144,
          w: 134,
          h: 18,
          action: () => {
            playUiClick();
            openInTab(CONTACT_CONFIG.candyCastleUrl);
          },
        },
      ];
    };

    const cardHitboxes = createCardHitboxes();

    const toInternalPoint = (event: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * INTERNAL_WIDTH;
      const y = ((event.clientY - rect.top) / rect.height) * INTERNAL_HEIGHT;
      return { x, y };
    };

    const setCursor = (id: string | null): void => {
      if (hoverIdRef.current === id) {
        return;
      }
      hoverIdRef.current = id;
      canvas.style.cursor = id ? "pointer" : "default";
    };

    const spawnSmoke = (x: number, y: number, count: number): void => {
      for (let i = 0; i < count; i += 1) {
        const vx = (Math.random() - 0.5) * 18;
        const vy = -18 - Math.random() * 24;
        particlesRef.current.push({
          x,
          y,
          vx,
          vy,
          size: 2 + Math.floor(Math.random() * 2),
          life: 0.7 + Math.random() * 0.35,
          maxLife: 0.95,
          gravity: -8,
          color: Math.random() > 0.5 ? "#bbc3d2" : "#7f889e",
          kind: "smoke",
        });
      }
    };

    const spawnCrashSparks = (x: number, y: number): void => {
      for (let i = 0; i < 12; i += 1) {
        const ang = (Math.PI * 2 * i) / 12;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * (30 + Math.random() * 16),
          vy: Math.sin(ang) * (18 + Math.random() * 8),
          size: 1 + (i % 2),
          life: 0.45 + Math.random() * 0.2,
          maxLife: 0.6,
          gravity: 28,
          color: i % 3 === 0 ? "#ffd364" : "#ff9f5a",
          kind: "spark",
        });
      }
    };

    const spawnExplosion = (x: number, y: number): void => {
      for (let i = 0; i < 54; i += 1) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 24 + Math.random() * 58;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          size: Math.random() > 0.7 ? 2 : 1,
          life: 0.65 + Math.random() * 0.45,
          maxLife: 1.1,
          gravity: 20,
          color:
            Math.random() > 0.65
              ? "#fff3a8"
              : Math.random() > 0.4
                ? "#ffc674"
                : "#ff8cb3",
          kind: "spark",
        });
      }
    };

    const resizeCanvas = (): void => {
      const scale = Math.max(
        1,
        Math.floor(
          Math.min(
            window.innerWidth / INTERNAL_WIDTH,
            window.innerHeight / INTERNAL_HEIGHT,
          ),
        ),
      );
      canvas.width = INTERNAL_WIDTH;
      canvas.height = INTERNAL_HEIGHT;
      canvas.style.width = `${INTERNAL_WIDTH * scale}px`;
      canvas.style.height = `${INTERNAL_HEIGHT * scale}px`;
      canvas.style.imageRendering = "pixelated";
      canvas.style.background = "#000000";
      canvas.style.touchAction = "none";
      ctx.imageSmoothingEnabled = false;
    };

    const drawSpaceBase = (nowSec: number): void => {
      for (let y = 0; y < INTERNAL_HEIGHT; y += 1) {
        const shade = Math.round(14 + (y / INTERNAL_HEIGHT) * 18);
        ctx.fillStyle = `rgb(${shade - 4}, ${shade - 2}, ${shade + 8})`;
        ctx.fillRect(0, y, INTERNAL_WIDTH, 1);
      }
      drawStars(ctx, starsRef.current, nowSec, 1);
    };

    const drawLaunchScene = (
      local: number,
      phase: "countdown" | "liftoff",
      nowSec: number,
    ): void => {
      const liftoffT = phase === "liftoff" ? clamp(local / LIFTOFF_DURATION, 0, 1) : 0;
      const darken = liftoffT * 0.84;
      ctx.fillStyle = "#65abff";
      ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      ctx.globalAlpha = darken;
      ctx.fillStyle = "#0b1221";
      ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      ctx.globalAlpha = 1;

      drawStars(ctx, starsRef.current, nowSec, liftoffT);

      const cloudDrop = Math.floor(liftoffT * 92);
      for (let layer = 0; layer < 3; layer += 1) {
        const baseY = 34 + layer * 24 + cloudDrop * (0.65 + layer * 0.15);
        ctx.fillStyle = layer === 0 ? "#dbe8ff" : layer === 1 ? "#bfd2f4" : "#a2bbde";
        for (let i = 0; i < 14; i += 1) {
          const x = i * 32 + (layer % 2) * 10 - 6;
          const bob = Math.sin(nowSec * 0.8 + i + layer) * 2;
          ctx.fillRect(x, Math.floor(baseY + bob), 24, 10);
        }
      }

      ctx.fillStyle = "#27324b";
      ctx.fillRect(0, 170, INTERNAL_WIDTH, 55);
      ctx.fillStyle = "#37435f";
      for (let i = 0; i < INTERNAL_WIDTH; i += 20) {
        ctx.fillRect(i, 164 + (i % 40 === 0 ? 0 : 2), 16, 8);
      }

      ctx.fillStyle = "#5b687f";
      ctx.fillRect(95, 164, 150, 28);
      ctx.fillStyle = "#0f131b";
      ctx.fillRect(95, 190, 150, 2);

      for (let x = 98; x <= 238; x += 14) {
        ctx.fillStyle =
          (Math.floor((x - 98) / 14) + Math.floor(nowSec * 5)) % 2 === 0
            ? "#f4c34e"
            : "#2d2d33";
        ctx.fillRect(x, 166, 12, 4);
      }

      ctx.fillStyle = "#121620";
      for (let i = 0; i < 9; i += 1) {
        ctx.fillRect(104 + i * 16, 178, 2, 2);
      }

      const consoleBlink = Math.sin(nowSec * 6) > 0 ? "#7ce090" : "#3c6f4b";
      ctx.fillStyle = "#212938";
      ctx.fillRect(250, 158, 26, 18);
      ctx.fillStyle = consoleBlink;
      ctx.fillRect(255, 164, 6, 4);
      ctx.fillStyle = "#d98f53";
      ctx.fillRect(264, 164, 6, 4);

      const liftProgress = easeOutCubic(liftoffT);
      const rocketX = 164;
      const rocketY = 145 - Math.floor(liftProgress * 120);
      const tilt = phase === "liftoff" ? Math.sin(nowSec * 12) * 0.03 : 0;
      const flicker: 0 | 1 = Math.floor(nowSec * 16) % 2 === 0 ? 0 : 1;
      drawRocket(ctx, rocketX, rocketY, flicker, tilt);

      if (phase === "countdown") {
        const tickSize = COUNTDOWN_DURATION / 3;
        const tickValue = clamp(3 - Math.floor(local / tickSize), 1, 3);
        if (tickValue !== countdownTickRef.current) {
          countdownTickRef.current = tickValue;
          playCountdownBeep();
        }
        ctx.fillStyle = "#111827";
        ctx.fillRect(164, 35, 72, 34);
        ctx.fillStyle = "#e7efff";
        ctx.fillRect(165, 36, 70, 32);
        ctx.fillStyle = "#18203a";
        ctx.fillRect(169, 40, 62, 24);
        ctx.fillStyle = "#f4cf6b";
        ctx.font = "bold 20px monospace";
        ctx.fillText(String(tickValue), 191, 59);
      }

      smokeAccumulatorRef.current += phase === "liftoff" ? 0.07 : 0.04;
      while (smokeAccumulatorRef.current > 0.1) {
        smokeAccumulatorRef.current -= 0.1;
        const spread = phase === "liftoff" ? 8 : 3;
        spawnSmoke(
          169 + (Math.random() - 0.5) * spread,
          rocketY + 19,
          phase === "liftoff" ? 3 : 2,
        );
      }
    };

    const drawPlanetLabel = (name: string, local: number): void => {
      const appear = clamp(local / 0.2, 0, 1);
      const leave = clamp((1 - local) / 0.18, 0, 1);
      const alpha = Math.min(appear, leave);
      if (alpha <= 0) {
        return;
      }
      const width = 52 + name.length * 4;
      const x = Math.floor((INTERNAL_WIDTH - width) / 2);
      const y = 16;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#111a2a";
      ctx.fillRect(x, y, width, 14);
      ctx.fillStyle = "#b8cff6";
      ctx.fillRect(x + 1, y + 1, width - 2, 12);
      ctx.fillStyle = "#192740";
      ctx.fillRect(x + 3, y + 3, width - 6, 8);
      ctx.fillStyle = "#e3ecff";
      ctx.font = "bold 8px monospace";
      ctx.fillText(name, x + 8, y + 10);
      ctx.globalAlpha = 1;
    };

    const drawMontageScene = (timelineLocal: number, nowSec: number): void => {
      drawSpaceBase(nowSec);

      const index = Math.min(
        PLANETS.length - 1,
        Math.floor(timelineLocal / PLANET_DURATION),
      );
      const within = timelineLocal - index * PLANET_DURATION;
      const scene = sceneBuffersRef.current[index];
      if (!scene) {
        return;
      }

      const currentMidShift = Math.round(
        within * 16 + Math.sin(nowSec * 1.2 + index) * 2,
      );
      const currentFgShift = Math.round(
        within * 26 + Math.sin(nowSec * 1.8 + index) * 3,
      );
      drawWrappedLayer(ctx, scene.mid, currentMidShift);
      drawWrappedLayer(ctx, scene.fg, currentFgShift);

      if (within > 1 - PLANET_CROSSFADE && index < PLANETS.length - 1) {
        const nextScene = sceneBuffersRef.current[index + 1];
        if (nextScene) {
          const blend = clamp(
            (within - (1 - PLANET_CROSSFADE)) / PLANET_CROSSFADE,
            0,
            1,
          );
          ctx.globalAlpha = blend;
          drawWrappedLayer(
            ctx,
            nextScene.mid,
            Math.round(Math.sin(nowSec * 1.1 + index + 1) * 2),
          );
          drawWrappedLayer(
            ctx,
            nextScene.fg,
            Math.round(Math.sin(nowSec * 1.7 + index + 1) * 3),
          );
          ctx.globalAlpha = 1;
        }
      }

      const flicker: 0 | 1 = Math.floor(nowSec * 20) % 2 === 0 ? 0 : 1;
      drawRocket(
        ctx,
        108 + Math.sin(nowSec * 2.2) * 2,
        104 + Math.cos(nowSec * 2.5) * 2,
        flicker,
        Math.sin(nowSec * 2.4) * 0.025,
      );
      drawPlanetLabel(PLANETS[index].name, within);
    };

    const drawCrashScene = (local: number, nowSec: number): void => {
      drawSpaceBase(nowSec);
      const pluto = sceneBuffersRef.current[PLANETS.length - 1];
      if (pluto) {
        const shiftMid = Math.round(6 + Math.sin(nowSec * 0.8) * 2);
        const shiftFg = Math.round(9 + Math.sin(nowSec * 1.1) * 3);
        drawWrappedLayer(ctx, pluto.mid, shiftMid);
        drawWrappedLayer(ctx, pluto.fg, shiftFg);
      }

      const p = clamp(local / CRASH_DURATION, 0, 1);
      const approach = p < 0.55 ? easeOutCubic(p / 0.55) : 1;
      const wobble =
        p > 0.55
          ? Math.sin((p - 0.55) * 42) * 3.8 * (1 - (p - 0.55) / 0.45)
          : 0;
      const rocketX = 108 + approach * 92 + wobble;
      const rocketY = 104 + (p > 0.55 ? Math.sin((p - 0.55) * 48) * 2 : 0);
      const tilt = p < 0.55 ? p * 0.08 : Math.sin((p - 0.55) * 44) * 0.16;
      drawRocket(ctx, rocketX, rocketY, 1, tilt);

      if (p >= 0.55 && !crashBonkPlayedRef.current) {
        crashBonkPlayedRef.current = true;
        playBonk();
      }
      if (p >= 0.58 && !crashSparkedRef.current) {
        crashSparkedRef.current = true;
        spawnCrashSparks(204, 112);
      }
      if (p >= 0.56 && p <= 0.8) {
        ctx.fillStyle = "#f6cc70";
        ctx.font = "bold 11px monospace";
        ctx.fillText("BONK!", 212, 96);
      }
    };

    const drawExplosionScene = (local: number, nowSec: number): void => {
      drawSpaceBase(nowSec);
      const pluto = sceneBuffersRef.current[PLANETS.length - 1];
      if (pluto) {
        drawWrappedLayer(ctx, pluto.mid, 8);
        drawWrappedLayer(ctx, pluto.fg, 10);
      }

      const p = clamp(local / EXPLOSION_DURATION, 0, 1);
      const cx = 205;
      const cy = 110;

      const ringRadius = 6 + p * 58;
      drawCircleOutline(
        ctx,
        cx,
        cy,
        Math.round(ringRadius),
        p > 0.7 ? "#ffe2a8" : "#ffc978",
      );
      drawCircleOutline(ctx, cx, cy, Math.round(ringRadius + 3), "#ffd4e8");

      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + p * 0.5;
        const dist = 10 + p * 42;
        const sx = Math.round(cx + Math.cos(angle) * dist);
        const sy = Math.round(cy + Math.sin(angle) * dist);
        ctx.fillStyle = i % 2 === 0 ? "#fff2aa" : "#ff9dcc";
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
      }
    };

    const drawParticles = (dt: number): void => {
      if (particlesRef.current.length === 0) {
        return;
      }

      const alive: Particle[] = [];
      for (const particle of particlesRef.current) {
        particle.life -= dt;
        if (particle.life <= 0) {
          continue;
        }
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += particle.gravity * dt;
        alive.push(particle);
      }
      particlesRef.current = alive;

      for (const particle of particlesRef.current) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.globalAlpha = particle.kind === "smoke" ? alpha * 0.65 : alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          Math.round(particle.x),
          Math.round(particle.y),
          particle.size,
          particle.size,
        );
      }
      ctx.globalAlpha = 1;
    };

    const drawButton = (hitbox: Hitbox, hovered: boolean): void => {
      ctx.fillStyle = hovered ? "#4269a8" : "#2c4d82";
      ctx.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
      ctx.fillStyle = "#0c1324";
      ctx.fillRect(hitbox.x + 1, hitbox.y + 1, hitbox.w - 2, hitbox.h - 2);
      ctx.fillStyle = hovered ? "#d8ebff" : "#b8d0f6";
      ctx.fillRect(hitbox.x + 2, hitbox.y + 2, hitbox.w - 4, 4);
      ctx.fillStyle = "#ebf3ff";
      ctx.font = "bold 8px monospace";
      const textWidth = ctx.measureText(hitbox.label).width;
      ctx.fillText(
        hitbox.label,
        hitbox.x + Math.floor((hitbox.w - textWidth) / 2),
        hitbox.y + 12,
      );
    };

    const drawCard = (nowSec: number, nowMs: number): void => {
      drawSpaceBase(nowSec);

      const cardX = 52;
      const cardY = 32;
      const cardW = 296;
      const cardH = 166;

      ctx.fillStyle = "#070b15";
      ctx.fillRect(cardX + 4, cardY + 4, cardW, cardH);
      ctx.fillStyle = "#5b78ae";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.fillStyle = "#182742";
      ctx.fillRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4);
      ctx.fillStyle = "#98b5ea";
      ctx.fillRect(cardX + 4, cardY + 4, cardW - 8, 18);
      ctx.fillStyle = "#111a31";
      ctx.fillRect(cardX + 6, cardY + 6, cardW - 12, 14);

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#f0f6ff";
      ctx.fillText("CONTACT MISSION // CHANNEL OPEN", cardX + 12, cardY + 17);

      ctx.fillStyle = "#b9caec";
      ctx.font = "bold 8px monospace";
      ctx.fillText("CAPTAIN CHLOE, YOUR SIGNAL IS LOCKED.", cardX + 12, cardY + 34);
      ctx.fillText(CONTACT_CONFIG.email, cardX + 12, cardY + 47);

      hitboxesRef.current = cardHitboxes;
      for (const hitbox of cardHitboxes) {
        drawButton(hitbox, hoverIdRef.current === hitbox.id);
      }

      if (nowMs < copyToastUntilRef.current) {
        ctx.fillStyle = "#f7e8a4";
        ctx.fillRect(286, 90, 64, 14);
        ctx.fillStyle = "#26313e";
        ctx.fillRect(287, 91, 62, 12);
        ctx.fillStyle = "#f8f2d3";
        ctx.font = "bold 8px monospace";
        ctx.fillText("COPIED!", 301, 100);
      }
    };

    const handleHoverAt = (x: number, y: number): void => {
      if (containsPoint(x, y, SOUND_RECT)) {
        setCursor("sound");
        return;
      }
      if (currentPhaseRef.current !== "card") {
        setCursor(null);
        return;
      }
      for (const hitbox of hitboxesRef.current) {
        if (containsPoint(x, y, hitbox)) {
          setCursor(hitbox.id);
          return;
        }
      }
      setCursor(null);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const point = toInternalPoint(event);
      handleHoverAt(point.x, point.y);
    };

    const onPointerLeave = (): void => {
      setCursor(null);
    };

    const onPointerDown = (event: PointerEvent): void => {
      userInteractedRef.current = true;
      const point = toInternalPoint(event);

      if (containsPoint(point.x, point.y, SOUND_RECT)) {
        soundEnabledRef.current = !soundEnabledRef.current;
        if (soundEnabledRef.current) {
          playTone(640, 0.08, "square", 0.03, 760);
        }
        handleHoverAt(point.x, point.y);
        return;
      }

      if (currentPhaseRef.current !== "card") {
        forceCardRef.current = true;
        currentPhaseRef.current = "card";
        playUiClick();
        return;
      }

      for (const hitbox of hitboxesRef.current) {
        if (containsPoint(point.x, point.y, hitbox)) {
          void hitbox.action();
          return;
        }
      }
    };

    const render = (nowMs: number): void => {
      if (startMsRef.current === 0) {
        startMsRef.current = nowMs;
        lastMsRef.current = nowMs;
      }
      const elapsedSec = (nowMs - startMsRef.current) / 1000;
      const nowSec = nowMs / 1000;
      const dt = clamp((nowMs - lastMsRef.current) / 1000, 0, 0.05);
      lastMsRef.current = nowMs;

      const timeline = resolveTimeline(elapsedSec, forceCardRef.current);
      currentPhaseRef.current = timeline.phase;
      const phaseChanged = timeline.phase !== prevPhaseRef.current;
      if (phaseChanged) {
        if (timeline.phase === "countdown") {
          countdownTickRef.current = 3;
        }
        if (timeline.phase === "crash") {
          crashBonkPlayedRef.current = false;
          crashSparkedRef.current = false;
        }
        if (timeline.phase === "explosion") {
          explosionSpawnedRef.current = false;
        }
        if (timeline.phase !== "card") {
          hitboxesRef.current = [];
        }
        prevPhaseRef.current = timeline.phase;
      }

      if (timeline.phase === "explosion" && !explosionSpawnedRef.current) {
        explosionSpawnedRef.current = true;
        spawnExplosion(205, 110);
        playExplosion();
      }

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

      switch (timeline.phase) {
        case "countdown":
          drawLaunchScene(timeline.local, "countdown", nowSec);
          break;
        case "liftoff":
          drawLaunchScene(timeline.local, "liftoff", nowSec);
          break;
        case "montage":
          drawMontageScene(timeline.local, nowSec);
          break;
        case "crash":
          drawCrashScene(timeline.local, nowSec);
          break;
        case "explosion":
          drawExplosionScene(timeline.local, nowSec);
          break;
        case "card":
          drawCard(nowSec, nowMs);
          break;
      }

      drawParticles(dt);
      drawSoundToggle(ctx, soundEnabledRef.current, hoverIdRef.current === "sound");
      drawStamp(ctx);

      rafRef.current = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    rafRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <canvas
        aria-label="Contact Mission v5"
        ref={canvasRef}
        className="block"
        width={INTERNAL_WIDTH}
        height={INTERNAL_HEIGHT}
      />
    </div>
  );
}
