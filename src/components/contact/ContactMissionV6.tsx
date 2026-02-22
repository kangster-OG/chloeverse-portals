"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const W = 400;
const H = 225;
const LW = 200;
const LH = 113;
const DEV = process.env.NODE_ENV !== "production";
const MANIFEST_PATH = "/contact/mission_v6/manifest.json";
const STAMP = "CONTACT MISSION v6.3.1 (TRAVEL+CRISP)";
const SOUND_RECT = { x: 312, y: 8, w: 80, h: 16 };

const CONTACT = {
  email: "chloe@ugcbychloekang.com",
  instagram: "https://instagram.com/imchloekang",
  tiktok: "https://www.tiktok.com/@imchloekang",
  linkedin: "https://www.linkedin.com/in/chloekang",
  x: "https://x.com/imchloekang",
  portals: "/",
  candy: "https://imchloekang.com",
} as const;

const PLANETS = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
type Planet = (typeof PLANETS)[number];
type Phase = "loading" | "countdown" | "liftoff" | "montage" | "crash" | "explosion" | "card";
type HoverId = "soundToggle" | "openEmail" | "copyEmail" | "social1" | "social2" | "social3" | "social4" | "backToPortals" | "candyCastle" | null;
type ActionId = Exclude<HoverId, "soundToggle" | null>;
type SceneKey = "launch_pad" | "liftoff" | "atmosphere" | "deep_space" | Planet | "explosion_bg" | "card_bg";

interface Rect { x: number; y: number; w: number; h: number; }
interface ManifestRaw {
  sceneAtlas: { path: string; frameW: number; frameH: number; cols: number; rows: number; order: string[] };
  fxAtlas: { path: string; tile: number; cols: number; rows: number; tiles: Record<string, number> };
  scenes?: Record<string, number>;
  timingsMs?: Partial<{ countdownTotal: number; liftoffToSpace: number; planetHold: number; planetXFade: number; crash: number; explosion: number }>;
  card?: { hitboxes?: Partial<Record<ActionId, Rect>> };
}
interface ManifestResolved {
  raw: ManifestRaw;
  sceneName: Record<SceneKey, string>;
  sceneIndex: Record<string, number>;
  times: { countdownTotal: number; liftoffToSpace: number; planetHold: number; planetXFade: number; crash: number; explosion: number };
  hitboxes: Record<ActionId, Rect>;
}
interface Assets { manifest: ManifestResolved; scenes: HTMLImageElement; fx: HTMLImageElement; }
interface Particle { kind: "trail" | "smoke" | "dust" | "spark"; x: number; y: number; vx: number; vy: number; g: number; size: number; life: number; max: number; alpha: number; rot: number; spin: number; front: boolean; tile?: string; color?: string; }
interface RocketPose { x: number; y: number; rot: number; size: number; exhaust: number; thrust: boolean; visible: boolean; }
interface Timeline { phase: Phase; elapsed: number; local: number; planetIndex: number; planetLocal: number; }
interface MontageVignetteInfo { x: number; y: number; w: number; h: number; centerX: number; centerY: number; approach: number; hold: number; exit: number; alpha: number; radius: number; }

const DEFAULT_HITBOXES: Record<ActionId, Rect> = {
  openEmail: { x: 40, y: 80, w: 150, h: 28 }, copyEmail: { x: 210, y: 80, w: 150, h: 28 },
  social1: { x: 70, y: 118, w: 34, h: 34 }, social2: { x: 130, y: 118, w: 34, h: 34 },
  social3: { x: 190, y: 118, w: 34, h: 34 }, social4: { x: 250, y: 118, w: 34, h: 34 },
  backToPortals: { x: 40, y: 160, w: 140, h: 34 }, candyCastle: { x: 200, y: 160, w: 160, h: 34 },
};

const FONT: Record<string, number[]> = {
  " ":[0,0,0,0,0,0,0],"!":[4,4,4,4,4,0,4],".":[0,0,0,0,0,4,0],":":[0,4,0,0,4,0,0],"/":[1,2,4,8,16,0,0],"-":[0,0,0,31,0,0,0],"+":[0,4,4,31,4,4,0],"(":[2,4,8,8,8,4,2],")":[8,4,2,2,2,4,8],"@":[14,17,23,21,23,16,14],"_":[0,0,0,0,0,0,31],"?":[14,17,1,2,4,0,4],
  "0":[14,17,19,21,25,17,14],"1":[4,12,4,4,4,4,14],"2":[14,17,1,2,4,8,31],"3":[30,1,1,14,1,1,30],"4":[2,6,10,18,31,2,2],"5":[31,16,16,30,1,1,30],"6":[14,16,16,30,17,17,14],"7":[31,1,2,4,8,8,8],"8":[14,17,17,14,17,17,14],"9":[14,17,17,15,1,2,28],
  A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,14],H:[17,17,17,31,17,17,17],I:[14,4,4,4,4,4,14],J:[7,2,2,2,2,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,17,25,21,19,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31]
};

const SCENE_ALIAS: Record<SceneKey, string[]> = {
  launch_pad:["launch_pad","launchpad","launch","pad"], liftoff:["liftoff","blastoff"], atmosphere:["atmosphere","atmo"], deep_space:["deep_space","deepspace","space"],
  mercury:["mercury"], venus:["venus"], earth:["earth"], mars:["mars"], jupiter:["jupiter"], saturn:["saturn"], uranus:["uranus"], neptune:["neptune"], pluto:["pluto"],
  explosion_bg:["explosion_bg","explosion"], card_bg:["card_bg","card","contact"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
const easeOut = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 3;
const easeInOut = (t: number) => { const x = clamp(t, 0, 1); return x < 0.5 ? 4*x*x*x : 1 - ((-2*x + 2) ** 3) / 2; };
const easeBack = (t: number) => { const x = clamp(t, 0, 1); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3*(x-1)**3 + c1*(x-1)**2; };
const smoothstep = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
const hit = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const sx = (n: number) => Math.round((n / W) * LW);
const sy = (n: number) => Math.round((n / H) * LH);
const sw = (n: number) => Math.max(1, Math.round((n / W) * LW));
const sh = (n: number) => Math.max(1, Math.round((n / H) * LH));
const rectL = (r: Rect): Rect => ({ x: sx(r.x), y: sy(r.y), w: sw(r.w), h: sh(r.h) });
const textW = (s: string, sc = 1) => (s.length ? (s.length * 6 - 1) * sc : 0);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.decoding = "async"; img.onload = () => resolve(img); img.onerror = () => reject(new Error(`Failed to load image: ${src}`)); img.src = src;
  });
}
function rng(seed: number): () => number { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff); }
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, sc = 1): void {
  ctx.fillStyle = color; let cx = Math.round(x); const yy = Math.round(y);
  for (const ch of text) { const g = FONT[ch] ?? FONT[ch.toUpperCase()] ?? FONT["?"]; for (let r = 0; r < 7; r += 1) { const bits = g[r] ?? 0; for (let c = 0; c < 5; c += 1) if ((bits >> (4-c)) & 1) ctx.fillRect(cx + c*sc, yy + r*sc, sc, sc); } cx += 6 * sc; }
}
function drawTextShadow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, shadow: string, sc = 1): void { drawText(ctx, text, x + sc, y + sc, shadow, sc); drawText(ctx, text, x, y, color, sc); }

function resolveManifest(raw: ManifestRaw): ManifestResolved {
  const sceneIndex: Record<string, number> = {}; raw.sceneAtlas.order.forEach((n,i)=>sceneIndex[n]=i); Object.entries(raw.scenes ?? {}).forEach(([k,v])=>sceneIndex[k]=v);
  const keys = [...new Set([...raw.sceneAtlas.order, ...Object.keys(raw.scenes ?? {})])]; const byNorm = new Map(keys.map((k)=>[norm(k), k] as const));
  const pick = (k: SceneKey, fb: string) => { for (const c of SCENE_ALIAS[k]) if (keys.includes(c)) return c; for (const c of SCENE_ALIAS[k]) { const m = byNorm.get(norm(c)); if (m) return m; } return fb; };
  const first = raw.sceneAtlas.order[0] ?? "launch_pad"; const deep = pick("deep_space", first);
  const sceneName: Record<SceneKey, string> = { launch_pad: pick("launch_pad", first), liftoff: pick("liftoff", first), atmosphere: pick("atmosphere", pick("liftoff", first)), deep_space: deep, mercury: pick("mercury", deep), venus: pick("venus", deep), earth: pick("earth", deep), mars: pick("mars", deep), jupiter: pick("jupiter", deep), saturn: pick("saturn", deep), uranus: pick("uranus", deep), neptune: pick("neptune", deep), pluto: pick("pluto", deep), explosion_bg: pick("explosion_bg", deep), card_bg: pick("card_bg", raw.sceneAtlas.order[raw.sceneAtlas.order.length - 1] ?? deep) };
  return {
    raw, sceneName, sceneIndex,
    times: { countdownTotal: raw.timingsMs?.countdownTotal ?? 2400, liftoffToSpace: raw.timingsMs?.liftoffToSpace ?? 1800, planetHold: raw.timingsMs?.planetHold ?? 1000, planetXFade: raw.timingsMs?.planetXFade ?? 120, crash: raw.timingsMs?.crash ?? 900, explosion: raw.timingsMs?.explosion ?? 900 },
    hitboxes: { openEmail: raw.card?.hitboxes?.openEmail ?? DEFAULT_HITBOXES.openEmail, copyEmail: raw.card?.hitboxes?.copyEmail ?? DEFAULT_HITBOXES.copyEmail, social1: raw.card?.hitboxes?.social1 ?? DEFAULT_HITBOXES.social1, social2: raw.card?.hitboxes?.social2 ?? DEFAULT_HITBOXES.social2, social3: raw.card?.hitboxes?.social3 ?? DEFAULT_HITBOXES.social3, social4: raw.card?.hitboxes?.social4 ?? DEFAULT_HITBOXES.social4, backToPortals: raw.card?.hitboxes?.backToPortals ?? DEFAULT_HITBOXES.backToPortals, candyCastle: raw.card?.hitboxes?.candyCastle ?? DEFAULT_HITBOXES.candyCastle },
  };
}

export default function ContactMissionV6() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const assetsRef = useRef<Assets | null>(null);
  const errRef = useRef<string | null>(null);
  const debugOnRef = useRef(false);
  const pausedRef = useRef(false);
  const stepOnceRef = useRef(false);
  const simElapsedRef = useRef(0);
  const lastRealRef = useRef<number | null>(null);
  const scaleRef = useRef(1);
  const reachedCardRef = useRef(false);
  const guardErrorRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("loading");
  const hoverRef = useRef<HoverId>(null);
  const actionsRef = useRef<Array<{ id: ActionId; rect: Rect; onClick: () => void | Promise<void> }>>([]);
  const cardEnterRef = useRef<number | null>(null);
  const forceCardRef = useRef(false);
  const cardScaleRef = useRef(1);
  const soundOnRef = useRef(false);
  const userGestureRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Array<{ x: number; y: number; s: number; k: number; c: number; size: 1 | 2 }>>([]);
  const trailAccRef = useRef(0);
  const smokeAccRef = useRef(0);
  const countdownShownRef = useRef<number | null>(null);
  const crashOnceRef = useRef(false);
  const explosionOnceRef = useRef(false);
  const toastTextRef = useRef<string | null>(null);
  const toastUntilRef = useRef(0);
  const skipRequestedRef = useRef(false);
  const rocketXRef = useRef<number>(-20);
  const rocketYRef = useRef<number>(H * 0.45);
  const rocketVXRef = useRef<number>(40);
  const rocketVYRef = useRef<number>(0);
  const rocketRotRef = useRef<number>(0);
  const rocketInitRef = useRef<boolean>(false);
  const exhaustAccRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";
    canvas.style.touchAction = "none";

    const lctx = ctx;
    lctx.imageSmoothingEnabled = false;

    let dead = false;

    const seedStars = (): void => {
      const r = rng(0x12345678); const arr: Array<{ x: number; y: number; s: number; k: number; c: number; size: 1 | 2 }> = [];
      for (let i = 0; i < 86; i += 1) arr.push({ x: Math.floor(r()*LW), y: Math.floor(r()*(LH*0.78)), s: 3 + r()*16, k: r()*Math.PI*2, c: r(), size: r() > 0.86 ? 2 : 1 });
      starsRef.current = arr;
    };
    seedStars();

    const setCursor = (id: HoverId): void => { if (hoverRef.current === id) return; hoverRef.current = id; canvas.style.cursor = id ? "pointer" : "default"; };
    const resize = (): void => { const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H))); scaleRef.current = s; canvas.width = W; canvas.height = H; canvas.style.width = `${W * s}px`; canvas.style.height = `${H * s}px`; ctx.imageSmoothingEnabled = false; };
    const toInternal = (e: PointerEvent): { x: number; y: number } => {
      const r = canvas.getBoundingClientRect(); let x = ((e.clientX - r.left) / r.width) * W; let y = ((e.clientY - r.top) / r.height) * H;
      if (phaseRef.current === "card") { const s = cardScaleRef.current; if (Math.abs(s - 1) > 0.001) { const cx = W/2; const cy = H/2; x = (x - cx)/s + cx; y = (y - cy)/s + cy; } }
      return { x, y };
    };

    const getAudio = (): AudioContext | null => {
      if (!userGestureRef.current || !soundOnRef.current) return null;
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      if (!audioRef.current) audioRef.current = new Ctor();
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
      return audioRef.current;
    };
    const beep = (f: number, ms: number, type: OscillatorType, g: number, f2?: number): void => {
      const a = getAudio(); if (!a) return; const t = a.currentTime; const o = a.createOscillator(); const gg = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2 !== undefined) o.frequency.linearRampToValueAtTime(f2, t + ms/1000);
      gg.gain.setValueAtTime(Math.max(0.0001, g), t); gg.gain.exponentialRampToValueAtTime(0.0001, t + ms/1000); o.connect(gg); gg.connect(a.destination); o.start(t); o.stop(t + ms/1000);
    };
    const uiBeep = () => beep(700, 70, "square", 0.03, 860);
    const tickBeep = () => beep(430, 85, "triangle", 0.03, 520);
    const bonkBeep = () => { beep(220, 150, "square", 0.05, 120); beep(120, 110, "triangle", 0.03, 85); };
    const boomBeep = () => { beep(660, 90, "sawtooth", 0.05, 240); beep(240, 240, "triangle", 0.04, 75); };

    const sceneSrc = (a: Assets, logical: SceneKey): Rect | null => {
      const key = a.manifest.sceneName[logical]; const idx = a.manifest.sceneIndex[key]; if (idx === undefined) return null;
      const sa = a.manifest.raw.sceneAtlas; return { x: (idx % sa.cols) * sa.frameW, y: Math.floor(idx / sa.cols) * sa.frameH, w: sa.frameW, h: sa.frameH };
    };
    const fxSrc = (a: Assets, name: string): Rect | null => {
      const idx = a.manifest.raw.fxAtlas.tiles[name]; if (idx === undefined) return null; const fa = a.manifest.raw.fxAtlas;
      return { x: (idx % fa.cols) * fa.tile, y: Math.floor(idx / fa.cols) * fa.tile, w: fa.tile, h: fa.tile };
    };
    const drawScene = (a: Assets, name: SceneKey, alpha = 1, zoom = 1, panX = 0, panY = 0): void => {
      const s = sceneSrc(a, name); if (!s || alpha <= 0) return; lctx.save(); lctx.imageSmoothingEnabled = false; lctx.globalAlpha = clamp(alpha,0,1);
      const dw = Math.max(1, Math.round(LW * zoom)); const dh = Math.max(1, Math.round(LH * zoom)); const dx = Math.round((LW - dw)/2 + panX); const dy = Math.round((LH - dh)/2 + panY);
      lctx.drawImage(a.scenes, s.x, s.y, s.w, s.h, dx, dy, dw, dh); lctx.restore();
    };
    const drawFx = (a: Assets, tile: string, x: number, y: number, size: number, alpha = 1, rot = 0): void => {
      const s = fxSrc(a, tile); if (!s || alpha <= 0) return; lctx.save(); lctx.imageSmoothingEnabled = false; lctx.globalAlpha = clamp(alpha,0,1);
      lctx.translate(Math.round(x), Math.round(y)); if (rot) lctx.rotate(rot); const d = Math.max(1, Math.round(size));
      lctx.drawImage(a.fx, s.x, s.y, s.w, s.h, -Math.floor(d/2), -Math.floor(d/2), d, d); lctx.restore();
    };
    const drawStars = (tSec: number, alpha: number, boost: number): void => {
      if (alpha <= 0) return; lctx.save(); lctx.globalAlpha = clamp(alpha,0,1);
      for (const s of starsRef.current) {
        const x = ((s.x - tSec*s.s*(1 + boost*1.8)) % (LW + 6) + (LW + 6)) % (LW + 6); const tw = 0.55 + Math.sin(tSec*(2 + s.s*0.04) + s.k)*0.45;
        lctx.fillStyle = tw > 0.86 ? "#ffffff" : s.c > 0.8 ? "#fff2bf" : s.c > 0.45 ? "#c8d8ff" : "#b6efff";
        lctx.fillRect(Math.round(x), Math.round(s.y + (s.c < 0.2 ? Math.sin(tSec + s.k) * 0.5 : 0)), s.size, 1);
      }
      lctx.restore();
    };
    const drawSpeedLines = (tSec: number, alpha: number): void => {
      if (alpha <= 0) return; lctx.save(); lctx.globalAlpha = clamp(alpha,0,1); lctx.fillStyle = "#cfe6ff";
      for (let i = 0; i < 14; i += 1) { const len = 10 + ((i*11)%20); const x = ((LW + 10) - ((tSec*(42 + i*3) + i*13) % (LW + len + 18))) | 0; const y = 10 + i*6 + Math.sin(tSec*7 + i)*1.2; lctx.fillRect(Math.round(x), Math.round(y), len, 1); }
      lctx.restore();
    };
    const roundedRectPath = (x: number, y: number, w: number, h: number, r: number): void => {
      const rr = Math.max(0, Math.min(r, Math.floor(Math.min(w, h) / 2)));
      lctx.beginPath();
      lctx.moveTo(x + rr, y);
      lctx.lineTo(x + w - rr, y);
      lctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      lctx.lineTo(x + w, y + h - rr);
      lctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      lctx.lineTo(x + rr, y + h);
      lctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      lctx.lineTo(x, y + rr);
      lctx.quadraticCurveTo(x, y, x + rr, y);
      lctx.closePath();
    };
    const drawCorridor = (_a: Assets, tSec: number, intensity: number): void => {
      lctx.fillStyle = "#000";
      lctx.fillRect(0, 0, LW, LH);
      lctx.save();
      lctx.globalAlpha = 0.98;
      for (const s of starsRef.current) {
        const x = ((s.x - tSec * s.s * (1 + intensity * 1.8)) % (LW + 6) + (LW + 6)) % (LW + 6);
        const y = Math.round(s.y + (s.c < 0.2 ? Math.sin(tSec + s.k) * 0.5 : 0));
        const tw = 0.55 + Math.sin(tSec * (2 + s.s * 0.04) + s.k) * 0.45;
        lctx.fillStyle = tw > 0.86 ? "#ffffff" : s.c > 0.8 ? "#fff2bf" : s.c > 0.45 ? "#c8d8ff" : "#b6efff";
        lctx.fillRect(Math.round(x), y, 1, 1);
      }
      lctx.restore();
      const i = clamp(intensity, 0, 1);
      drawSpeedLines(tSec, 0.2 + i * 0.8);
      if (i > 0.05) {
        lctx.save();
        lctx.globalAlpha = i * 0.7;
        lctx.fillStyle = "#dbeeff";
        const count = Math.round(8 + i * 24);
        for (let n = 0; n < count; n += 1) {
          const len = Math.round(3 + i * 10 + ((n * 5) % 6));
          const x = ((LW + 10) - ((tSec * (52 + i * 52 + n * 1.5) + n * 11) % (LW + len + 14))) | 0;
          const y = 5 + ((n * 4) % (LH - 10));
          lctx.fillRect(Math.round(x), y, len, 1);
        }
        lctx.restore();
      }
    };
    const drawPlanetVignette = (
      a: Assets,
      scene: Planet,
      alpha: number,
      approach: number,
      hold: number,
      exit: number,
      tSec: number,
      planetIndex: number,
    ): MontageVignetteInfo | null => {
      if (alpha <= 0) return null;
      const winW = 360;
      const winH = 200;
      const radius = 10;
      const x = clamp(Math.round((W - winW) * 0.55), 0, W - winW);
      const y = clamp(Math.round((H - winH) * 0.42), 0, H - winH);
      const panX = Math.round(Math.sin(tSec * 0.9 + planetIndex) * 2);
      const panY = Math.round(Math.cos(tSec * 1.1 + planetIndex) * 2);
      const s = sceneSrc(a, scene);

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = clamp(alpha, 0, 1);

      ctx.fillStyle = "rgba(7,13,22,0.84)";
      ctx.beginPath();
      ctx.roundRect(x - 4, y - 4, winW + 8, winH + 8, radius + 2);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(x, y, winW, winH, radius);
      ctx.save();
      ctx.clip();
      if (s) {
        const cropMinX = s.x;
        const cropMaxX = s.x + (400 - winW);
        const cropMinY = s.y;
        const cropMaxY = s.y + (225 - winH);
        const cropX = clamp(s.x + Math.round((400 - winW) / 2) + panX, cropMinX, cropMaxX);
        const cropY = clamp(s.y + Math.round((225 - winH) / 2) + panY, cropMinY, cropMaxY);
        ctx.drawImage(a.scenes, cropX, cropY, winW, winH, x, y, winW, winH);
      }
      ctx.fillStyle = "rgba(120,170,220,0.10)";
      ctx.fillRect(x, y, winW, winH);
      ctx.fillStyle = "rgba(190,225,255,0.08)";
      ctx.fillRect(x, y, winW, 26);
      ctx.restore();

      ctx.strokeStyle = "#cfddec";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, winW, winH, radius);
      ctx.stroke();
      ctx.strokeStyle = "#10213d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, winW - 6, winH - 6, Math.max(1, radius - 2));
      ctx.stroke();
      ctx.restore();
      return {
        x,
        y,
        w: winW,
        h: winH,
        centerX: x + Math.round(winW / 2),
        centerY: y + Math.round(winH / 2),
        approach,
        hold,
        exit,
        alpha,
        radius,
      };
    };
    const drawCapsule = (text: string, yMain: number, alpha: number): void => {
      if (alpha <= 0) return; const wMain = clamp(text.length*6 + 14, 44, 180); const r = rectL({ x: Math.round((W - wMain)/2), y: yMain, w: wMain, h: 16 });
      lctx.save(); lctx.globalAlpha = clamp(alpha,0,1); lctx.fillStyle = "#0c1526"; lctx.fillRect(r.x,r.y,r.w,r.h); lctx.fillStyle = "#31486f"; lctx.fillRect(r.x+1,r.y+1,Math.max(1,r.w-2),Math.max(1,r.h-2)); lctx.fillStyle = "#13203a"; lctx.fillRect(r.x+1,r.y+r.h-3,Math.max(1,r.w-2),2);
      drawTextShadow(lctx, text, r.x + Math.max(2, Math.floor((r.w - textW(text))/2)), r.y + Math.max(2, Math.floor((r.h - 7)/2)), "#eff6ff", "#05080f"); lctx.restore();
    };
    const drawStamp = (): void => {
      const w = textW(STAMP) + 8;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#090f1c";
      ctx.fillRect(4, H - 16, w, 11);
      drawTextShadow(ctx, STAMP, 6, H - 14, "#9bb7ea", "#05080f");
      ctx.restore();
    };
    const drawSound = (): void => {
      const r = rectL(SOUND_RECT); const hov = hoverRef.current === "soundToggle"; lctx.fillStyle = hov ? "#45689f" : "#304a70"; lctx.fillRect(r.x,r.y,r.w,r.h); lctx.fillStyle = "#0d1528"; lctx.fillRect(r.x+1,r.y+1,Math.max(1,r.w-2),Math.max(1,r.h-2));
      drawTextShadow(lctx, soundOnRef.current ? "SOUND ON" : "SOUND OFF", r.x + 4, r.y + 5, hov ? "#f3f8ff" : "#d6e5ff", "#05080f");
    };

    const spawn = (p: Particle) => particlesRef.current.push(p);
    const spawnTrail = (pose: RocketPose, dtMs: number): void => {
      trailAccRef.current += dtMs;
      while (trailAccRef.current >= 22) {
        trailAccRef.current -= 22; const r = rng((Math.floor(performance.now()) ^ particlesRef.current.length * 37) >>> 0); const bx = pose.x - Math.sin(pose.rot)*11; const by = pose.y + Math.cos(pose.rot)*11;
        spawn({ kind:"trail", x:bx + (r()-0.5)*2, y:by + (r()-0.5)*2, vx:(r()-0.5)*8, vy:10 + r()*12, g:0, size:1 + Math.floor(r()*2), life:120 + r()*140, max:260, alpha:0.8, rot:0, spin:0, front:false, color: r() > 0.5 ? "#ffd98a" : "#9fe6ff" });
        if (r() > 0.72) spawn({ kind:"spark", x:bx, y:by, vx:(r()-0.5)*16, vy:(r()-0.5)*10 + 6, g:4, size:6 + r()*4, life:100 + r()*160, max:240, alpha:0.7, rot:r()*Math.PI*2, spin:(r()-0.5)*0.25, front:false, tile: r() > 0.5 ? "sparkle_1" : "sparkle_2" });
      }
    };
    const spawnTravelExhaust = (pose: RocketPose, dtMs: number, intensity: number): void => {
      const ratePerSec = lerp(8, 24, clamp(intensity, 0, 1));
      const lifeMax = lerp(250, 700, clamp(intensity, 0, 1));
      const brightnessBoost = clamp(intensity, 0, 1);
      exhaustAccRef.current += dtMs * (ratePerSec / 1000);
      while (exhaustAccRef.current >= 1) {
        exhaustAccRef.current -= 1;
        const r = rng((Math.floor(performance.now()) ^ (particlesRef.current.length * 71)) >>> 0);
        const bx = Math.round(pose.x - Math.sin(pose.rot) * 10);
        const by = Math.round(pose.y + Math.cos(pose.rot) * 10);
        spawn({
          kind: "trail",
          x: bx + Math.round((r() - 0.5) * 2),
          y: by + Math.round((r() - 0.5) * 2),
          vx: (r() - 0.5) * 5 - Math.sin(pose.rot) * 3,
          vy: 7 + r() * 8 + Math.cos(pose.rot) * 2,
          g: 0,
          size: 1 + (r() > 0.7 ? 1 : 0),
          life: 180 + r() * (lifeMax - 180),
          max: lifeMax,
          alpha: 0.65 + brightnessBoost * 0.35,
          rot: 0,
          spin: 0,
          front: false,
          color: r() > 0.75 ? (brightnessBoost > 0.5 ? "#ffe27f" : "#ffd67a") : r() > 0.45 ? "#ffdfb1" : (brightnessBoost > 0.5 ? "#b5efff" : "#9fe6ff"),
        });
        if (r() > 0.82) {
          spawn({
            kind: "spark",
            x: bx,
            y: by,
            vx: (r() - 0.5) * 10,
            vy: (r() - 0.5) * 8 + 4,
            g: 3,
            size: 4 + r() * 3,
            life: 120 + r() * (220 + brightnessBoost * 180),
            max: 350 + brightnessBoost * 250,
            alpha: 0.45 + brightnessBoost * 0.25,
            rot: r() * Math.PI * 2,
            spin: (r() - 0.5) * 0.18,
            front: false,
            tile: r() > 0.5 ? "sparkle_1" : "sparkle_2",
          });
        }
      }
    };
    const spawnSmoke = (pose: RocketPose, dtMs: number, intensity: number): void => {
      smokeAccRef.current += dtMs * (0.012 + intensity * 0.02);
      while (smokeAccRef.current >= 1) {
        smokeAccRef.current -= 1; const r = rng((Math.floor(performance.now()) ^ particlesRef.current.length * 53) >>> 0);
        spawn({ kind:"smoke", x:pose.x + (r()-0.5)*8, y:pose.y + 14 + r()*4, vx:(r()-0.5)*10, vy:4 + r()*8, g:-1.2, size:10 + r()*8 + intensity*4, life:180 + r()*220, max:420, alpha:0.8, rot:r()*Math.PI*2, spin:(r()-0.5)*0.08, front:false, tile: r() > 0.5 ? (r() > 0.5 ? "smoke_l_1" : "smoke_l_2") : (r() > 0.5 ? "smoke_m_1" : "smoke_m_2") });
      }
    };
    const spawnDust = (x: number, y: number): void => {
      const r = rng(0xcafe);
      for (let i = 0; i < 16; i += 1) {
        const ang = (i/16)*Math.PI + (r()-0.5)*0.45; const sp = 10 + r()*18;
        spawn({ kind:"dust", x, y, vx:Math.cos(ang)*sp, vy:-Math.abs(Math.sin(ang))*sp*0.7 - r()*4, g:24, size:8 + r()*7, life:170 + r()*250, max:420, alpha:1, rot:r()*Math.PI*2, spin:(r()-0.5)*0.14, front:true, tile: r() > 0.5 ? "impact_dust_1" : "impact_dust_2" });
      }
    };
    const spawnExplosion = (x: number, y: number): void => {
      const r = rng(0xdeadbeef);
      for (let i = 0; i < 52; i += 1) {
        const ang = (i/52)*Math.PI*2 + (r()-0.5)*0.2; const sp = 10 + r()*34; const tile = r() > 0.7 ? (r() > 0.5 ? "starburst_1" : "starburst_2") : r() > 0.35 ? (r() > 0.5 ? "glitter_1" : "glitter_2") : (r() > 0.5 ? "sparkle_1" : "sparkle_2");
        spawn({ kind:"spark", x, y, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp - 2, g:12 + r()*16, size: tile.startsWith("starburst") ? 8 + r()*8 : 5 + r()*5, life:220 + r()*520, max:760, alpha:1, rot:r()*Math.PI*2, spin:(r()-0.5)*0.22, front:true, tile });
      }
    };
    const updateParticles = (dtMs: number): void => {
      const dt = dtMs / 1000; const next: Particle[] = [];
      for (const p of particlesRef.current) { p.life -= dtMs; if (p.life <= 0) continue; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += p.g*dt; p.rot += p.spin; next.push(p); }
      particlesRef.current = next;
    };
    const drawParticles = (a: Assets, front: boolean): void => {
      for (const p of particlesRef.current) {
        if (p.front !== front) continue; const lt = clamp(p.life / p.max, 0, 1); const alpha = p.alpha * (p.kind === "smoke" ? lt * 0.75 : Math.sqrt(lt)); if (alpha <= 0) continue;
        if (p.tile) drawFx(a, p.tile, p.x, p.y, p.size, alpha, p.rot); else { lctx.save(); lctx.globalAlpha = alpha; lctx.fillStyle = p.color ?? "#fff"; const s = Math.max(1, Math.round(p.size)); lctx.fillRect(Math.round(p.x - s/2), Math.round(p.y - s/2), s, s); lctx.restore(); }
      }
    };

    const poseMontageBase = (prog: number, tSec: number): RocketPose => ({ x:104 + prog*58 + Math.sin(tSec*1.7)*1.4, y:29 + prog*30 + Math.sin(tSec*2.3 + prog*10)*3.4, rot:0.18 + Math.sin(tSec*1.5 + prog*4)*0.05, size:37, exhaust:0.45, thrust:false, visible:true });
    const poseFor = (tl: Timeline): RocketPose => {
      const a = assetsRef.current; if (!a) return { x:98, y:77, rot:0, size:40, exhaust:0, thrust:false, visible:false };
      const t = a.manifest.times; const tSec = tl.elapsed / 1000;
      if (tl.phase === "countdown") return { x:98 + Math.sin(tSec*5)*0.8, y:77 + Math.sin(tSec*7.5)*0.8, rot:Math.sin(tSec*4)*0.02, size:40, exhaust:0.55, thrust:false, visible:true };
      if (tl.phase === "liftoff") { const p = clamp(tl.local / t.liftoffToSpace, 0, 1); const target = poseMontageBase(0, tSec); return { x:lerp(98,target.x,easeInOut(p)), y:lerp(77,target.y,easeOut(p)), rot:lerp(0.02,0.16,easeOut(p)) + Math.sin(tSec*8)*0.02*(1-p), size:40, exhaust:lerp(0.9,1.9,p), thrust:true, visible:true }; }
      if (tl.phase === "montage") { const mp = clamp(tl.local / (PLANETS.length * t.planetHold), 0, 1); const base = poseMontageBase(mp, tSec); const u = clamp(tl.planetLocal / t.planetHold, 0, 1); const passT = clamp((u - 0.34) / 0.4, 0, 1); const surge = Math.sin(passT * Math.PI) * 24; return { x:base.x + surge, y:base.y + Math.sin(tSec*3.2 + tl.planetIndex*0.7)*1.8 + Math.sin(u*Math.PI*2)*0.8, rot:base.rot + Math.sin(u*Math.PI)*0.06, size:36, exhaust:0.35 + Math.sin(passT*Math.PI)*0.15, thrust: passT > 0.05 && passT < 0.95, visible:true }; }
      if (tl.phase === "crash") { const p = clamp(tl.local / t.crash, 0, 1); const hitT = 0.58; const start = poseMontageBase(1, tSec); if (p < hitT) { const k = easeInOut(p / hitT); return { x:lerp(start.x,149,k), y:lerp(start.y,79,k), rot:lerp(start.rot,0.92,k), size:36, exhaust:lerp(0.8,0.35,k), thrust:true, visible:true }; } const q = clamp((p - hitT)/(1-hitT), 0, 1); const damp = 1 - q; return { x:149 + Math.sin(q*24)*6*damp, y:79 + Math.sin(q*18 + 0.6)*2*damp, rot:0.95 + Math.sin(q*20)*0.17*damp, size:36, exhaust:0.15*damp, thrust:false, visible:true }; }
      return { x:0, y:0, rot:0, size:36, exhaust:0, thrust:false, visible:false };
    };
    const drawRocket = (a: Assets, p: RocketPose, tSec: number, alpha = 1, sizeScale = 1): void => {
      if (!p.visible) return; const tile = p.thrust ? (Math.floor(tSec*14)%2 ? "rocket_boost_1" : "rocket_boost_2") : (Math.floor(tSec*8)%2 ? "rocket_idle_1" : "rocket_idle_2");
      const size = p.size * sizeScale;
      lctx.save();
      lctx.globalAlpha *= clamp(alpha, 0, 1);
      if (p.exhaust > 0.2) drawFx(a, Math.floor(tSec*14)%2 ? "sparkle_1" : "sparkle_2", p.x - Math.sin(p.rot)*11, p.y + Math.cos(p.rot)*11, 6 + p.exhaust*2, 0.65, p.rot);
      drawFx(a, tile, p.x, p.y, size, 1, p.rot);
      lctx.restore();
    };
    const drawRocketFull = (a: Assets, x: number, y: number, rot: number, tSec: number, alpha = 1, sizePx = 52): void => {
      const tile = Math.floor(tSec * 10) % 2 ? "rocket_boost_1" : "rocket_boost_2";
      const s = fxSrc(a, tile);
      if (!s) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.translate(Math.round(x), Math.round(y));
      if (rot) ctx.rotate(rot);
      const d = Math.max(1, Math.round(sizePx));
      ctx.drawImage(a.fx, s.x, s.y, s.w, s.h, -Math.floor(d / 2), -Math.floor(d / 2), d, d);
      ctx.restore();
    };
    const timelineFromElapsed = (elapsed: number): Timeline => {
      const a = assetsRef.current; if (!a) return { phase:"loading", elapsed:0, local:0, planetIndex:0, planetLocal:0 };
      if (forceCardRef.current) { const ce = cardEnterRef.current ?? elapsed; return { phase:"card", elapsed, local: elapsed - ce, planetIndex: PLANETS.length - 1, planetLocal:0 }; }
      const t = a.manifest.times; let c = elapsed; if (c < t.countdownTotal) return { phase:"countdown", elapsed, local:c, planetIndex:0, planetLocal:0 }; c -= t.countdownTotal; if (c < t.liftoffToSpace) return { phase:"liftoff", elapsed, local:c, planetIndex:0, planetLocal:0 }; c -= t.liftoffToSpace;
      const montage = PLANETS.length * t.planetHold; if (c < montage) { const i = Math.min(PLANETS.length - 1, Math.floor(c / t.planetHold)); return { phase:"montage", elapsed, local:c, planetIndex:i, planetLocal:c - i*t.planetHold }; }
      c -= montage; if (c < t.crash) return { phase:"crash", elapsed, local:c, planetIndex:PLANETS.length - 1, planetLocal:0 }; c -= t.crash; if (c < t.explosion) return { phase:"explosion", elapsed, local:c, planetIndex:PLANETS.length - 1, planetLocal:0 };
      if (cardEnterRef.current === null) cardEnterRef.current = elapsed; return { phase:"card", elapsed, local: elapsed - (cardEnterRef.current ?? elapsed), planetIndex: PLANETS.length - 1, planetLocal:0 };
    };
    const montageRocketPose = (): RocketPose => ({
      x: rocketXRef.current / 2,
      y: rocketYRef.current / 2,
      rot: rocketRotRef.current,
      size: 26,
      exhaust: clamp(Math.abs(rocketVXRef.current) / 90, 0.35, 1),
      thrust: true,
      visible: true,
    });
    const updateRocket = (dtMs: number, tl: Timeline, vignetteRect: MontageVignetteInfo | null): RocketPose => {
      if (!rocketInitRef.current) {
        rocketXRef.current = -20;
        rocketYRef.current = H * 0.45;
        rocketVXRef.current = 40;
        rocketVYRef.current = 0;
        rocketRotRef.current = 0;
        rocketInitRef.current = true;
      }
      const dt = clamp(dtMs / 1000, 0, 0.05);
      const planetHold = assetsRef.current?.manifest.times.planetHold ?? 1000;
      const p = tl.planetIndex + tl.planetLocal / Math.max(1, planetHold);
      const m = clamp(p / PLANETS.length, 0, 1);
      const baseX = lerp(-30, W + 30, m);
      const baseY = Math.round(H * 0.38 + Math.sin(m * Math.PI * 4) * 14);
      let targetX = baseX;
      let targetY = baseY;
      if (vignetteRect) {
        const vCx = vignetteRect.x + Math.round(vignetteRect.w * 0.62);
        const vCy = vignetteRect.y + Math.round(vignetteRect.h * 0.55);
        if (vignetteRect.approach > 0) {
          const s = smoothstep(vignetteRect.approach);
          targetX = lerp(baseX, vCx - 18, s);
          targetY = lerp(baseY, vCy - 10, s);
        }
        if (vignetteRect.hold > 0) {
          const s = smoothstep(vignetteRect.hold);
          targetX = lerp(targetX, vCx + 26, s);
          targetY = lerp(targetY, vCy - 8, s);
        }
        if (vignetteRect.exit > 0) {
          const s = smoothstep(vignetteRect.exit);
          targetX = lerp(targetX, baseX + 25, s);
          targetY = lerp(targetY, baseY, s);
        }
      }

      const k = 12;
      const d = 7;
      const ax = (targetX - rocketXRef.current) * k - rocketVXRef.current * d;
      const ay = (targetY - rocketYRef.current) * k - rocketVYRef.current * d;
      rocketVXRef.current += ax * dt;
      rocketVYRef.current += ay * dt;
      rocketXRef.current += rocketVXRef.current * dt;
      rocketYRef.current += rocketVYRef.current * dt;

      const desiredRot =
        clamp(rocketVXRef.current, -80, 80) / 120 + clamp(rocketVYRef.current, -80, 80) / 160;
      rocketRotRef.current = lerp(rocketRotRef.current, desiredRot, 0.12);
      return montageRocketPose();
    };
    const guard = (ok: boolean, msg: string): void => {
      if (!ok && DEV && !guardErrorRef.current) guardErrorRef.current = msg;
    };
    const resetAll = (reason: string): void => {
      void reason;
      simElapsedRef.current = 0;
      lastRealRef.current = null;
      particlesRef.current = [];
      trailAccRef.current = 0;
      smokeAccRef.current = 0;
      countdownShownRef.current = null;
      crashOnceRef.current = false;
      explosionOnceRef.current = false;
      forceCardRef.current = false;
      cardEnterRef.current = null;
      reachedCardRef.current = false;
      guardErrorRef.current = null;
      pausedRef.current = false;
      stepOnceRef.current = false;
      skipRequestedRef.current = false;
      phaseRef.current = "loading";
      rocketXRef.current = -20;
      rocketYRef.current = H * 0.45;
      rocketVXRef.current = 40;
      rocketVYRef.current = 0;
      rocketRotRef.current = 0;
      rocketInitRef.current = false;
      exhaustAccRef.current = 0;
    };
    const phaseOffsets = (a?: Assets | null) => {
      const t = a?.manifest.times ?? { countdownTotal: 2400, liftoffToSpace: 1800, planetHold: 1000, planetXFade: 120, crash: 900, explosion: 900 };
      const countdown = 0;
      const liftoff = countdown + t.countdownTotal;
      const montage = liftoff + t.liftoffToSpace;
      const crash = montage + PLANETS.length * t.planetHold;
      const explosion = crash + t.crash;
      const card = explosion + t.explosion;
      return { countdown, liftoff, montage, crash, explosion, card };
    };
    const jumpToPhase = (target: "countdown" | "liftoff" | "montage" | "crash" | "explosion" | "card"): void => {
      const o = phaseOffsets(assetsRef.current);
      const eps = 10;
      let v = 0;
      if (target === "countdown") v = o.countdown + eps;
      else if (target === "liftoff") v = o.liftoff + eps;
      else if (target === "montage") v = o.montage + eps;
      else if (target === "crash") v = o.crash + eps;
      else if (target === "explosion") v = o.explosion + eps;
      else v = o.card + eps;
      simElapsedRef.current = v;
      lastRealRef.current = null;
      forceCardRef.current = false;
      cardEnterRef.current = target === "card" ? v : null;
      particlesRef.current = [];
      trailAccRef.current = 0;
      smokeAccRef.current = 0;
      crashOnceRef.current = false;
      explosionOnceRef.current = false;
      reachedCardRef.current = false;
      guardErrorRef.current = null;
      countdownShownRef.current = null;
      skipRequestedRef.current = target === "card";
      exhaustAccRef.current = 0;
      if (target === "montage") {
        rocketXRef.current = -20;
        rocketYRef.current = H * 0.45;
        rocketVXRef.current = 40;
        rocketVYRef.current = 0;
        rocketRotRef.current = 0;
        rocketInitRef.current = true;
      }
    };

    const drawButton = (r: Rect, label: string, hov: boolean): void => {
      const lr = rectL(r); lctx.fillStyle = hov ? "#4f78ba" : "#345a92"; lctx.fillRect(lr.x, lr.y, lr.w, lr.h); lctx.fillStyle = "#10192f"; lctx.fillRect(lr.x+1, lr.y+1, Math.max(1, lr.w-2), Math.max(1, lr.h-2)); lctx.fillStyle = hov ? "#dff0ff" : "#bdd5fb"; lctx.fillRect(lr.x+1, lr.y+1, Math.max(1, lr.w-2), 2);
      drawTextShadow(lctx, label, lr.x + Math.max(2, Math.floor((lr.w - textW(label))/2)), lr.y + Math.max(2, Math.floor((lr.h - 7)/2)), "#f4f8ff", "#06090f");
    };
    const drawSocial = (id: ActionId, r: Rect, hov: boolean): void => {
      const lr = rectL(r); lctx.fillStyle = hov ? "#5b88d1" : "#426caf"; lctx.fillRect(lr.x, lr.y, lr.w, lr.h); lctx.fillStyle = "#121f39"; lctx.fillRect(lr.x+1, lr.y+1, Math.max(1,lr.w-2), Math.max(1,lr.h-2)); lctx.fillStyle = "#e0efff";
      if (id === "social1") { lctx.strokeStyle = "#e0efff"; lctx.lineWidth = 1; lctx.strokeRect(lr.x+5, lr.y+5, 7, 7); lctx.fillRect(lr.x+8, lr.y+8, 2, 2); }
      else if (id === "social2") { lctx.fillRect(lr.x+7, lr.y+4, 2, 9); lctx.fillRect(lr.x+5, lr.y+8, 5, 2); lctx.fillRect(lr.x+10, lr.y+8, 3, 2); }
      else if (id === "social3") { lctx.fillRect(lr.x+4, lr.y+4, 2, 9); lctx.fillRect(lr.x+7, lr.y+6, 2, 7); lctx.fillRect(lr.x+10, lr.y+6, 2, 7); }
      else { lctx.fillRect(lr.x+4, lr.y+5, 2, 2); lctx.fillRect(lr.x+6, lr.y+7, 2, 2); lctx.fillRect(lr.x+8, lr.y+9, 2, 2); lctx.fillRect(lr.x+10, lr.y+5, 2, 2); }
    };
    const drawMiniCapsule = (text: string, alpha: number): void => {
      if (alpha <= 0) return;
      const maxW = 90;
      const wMain = clamp(text.length * 6 + 12, 34, maxW);
      guard(wMain <= maxW, "LABEL_CAPSULE_OVERSIZE");
      const r = rectL({ x: Math.round((W - wMain) / 2), y: 10, w: wMain, h: 14 });
      lctx.save();
      lctx.globalAlpha = clamp(alpha, 0, 1);
      lctx.fillStyle = "#0c1526";
      lctx.fillRect(r.x, r.y, r.w, r.h);
      lctx.fillStyle = "#2d4468";
      lctx.fillRect(r.x + 1, r.y + 1, Math.max(1, r.w - 2), Math.max(1, r.h - 2));
      drawTextShadow(lctx, text, r.x + Math.max(2, Math.floor((r.w - textW(text)) / 2)), r.y + 3, "#eff6ff", "#05080f");
      lctx.restore();
    };
    const drawDebugOverlay = (tl: Timeline): void => {
      if (!debugOnRef.current) return;
      const lines = [
        `P ${tl.phase.toUpperCase()}`,
        `T ${Math.round(simElapsedRef.current)}ms`,
        `N ${tl.phase === "montage" ? `${tl.planetIndex}:${PLANETS[tl.planetIndex]}` : "-"}`,
        `S ${scaleRef.current} ${pausedRef.current ? "PAUSE" : "RUN"}`,
        `G ${guardErrorRef.current ?? "OK"}`,
      ];
      let w = 0;
      for (const line of lines) w = Math.max(w, textW(line));
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "rgba(5,10,18,0.65)";
      ctx.fillRect(4, 4, w + 8, lines.length * 8 + 4);
      let y = 6;
      for (const line of lines) { drawTextShadow(ctx, line, 6, y, "#dceaff", "#05080f"); y += 8; }
      ctx.restore();
    };
    const renderGuardFail = (tl: Timeline): void => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#3a0000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#9b1010";
      ctx.fillRect(8, 8, W - 16, H - 16);
      ctx.fillStyle = "#250000";
      ctx.fillRect(12, 12, W - 24, H - 24);
      drawTextShadow(ctx, `GUARD FAIL: ${guardErrorRef.current ?? "UNKNOWN"}`, 22, 34, "#ffd0d0", "#2a0000", 2);
      drawTextShadow(ctx, `PHASE: ${tl.phase.toUpperCase()}`, 22, 76, "#ffe6e6", "#2a0000");
      drawTextShadow(ctx, `ELAPSED: ${Math.round(simElapsedRef.current)}ms`, 22, 88, "#ffe6e6", "#2a0000");
      drawTextShadow(ctx, `SCALE: ${scaleRef.current}`, 22, 100, "#ffe6e6", "#2a0000");
      drawTextShadow(ctx, `SMOOTH: main=${ctx.imageSmoothingEnabled ? "ON" : "OFF"} lo=${lctx.imageSmoothingEnabled ? "ON" : "OFF"}`, 22, 112, "#ffe6e6", "#2a0000");
      drawTextShadow(ctx, "Press R to reset", 22, 128, "#ffd0d0", "#2a0000");
    };

    const renderFrame = (now: number): void => {
      if (dead) return;
      if (lastRealRef.current === null) lastRealRef.current = now;
      const dtReal = clamp(now - lastRealRef.current, 0, 50);
      lastRealRef.current = now;
      let dt = 0;
      if (pausedRef.current) {
        if (stepOnceRef.current) {
          simElapsedRef.current += 16.666;
          dt = 16.666;
          stepOnceRef.current = false;
        }
      } else {
        simElapsedRef.current += dtReal;
        dt = dtReal;
      }
      const tl = timelineFromElapsed(simElapsedRef.current); phaseRef.current = tl.phase;
      if (tl.phase !== "crash") crashOnceRef.current = false;
      if (tl.phase !== "explosion") explosionOnceRef.current = false;
      if (tl.phase !== "card") cardScaleRef.current = 1;

      ctx.imageSmoothingEnabled = false;
      lctx.imageSmoothingEnabled = false;
      guard(Number.isInteger(scaleRef.current) && scaleRef.current >= 1, "BAD_SCALE");
      guard(canvas.style.width === `${W * scaleRef.current}px` && canvas.style.height === `${H * scaleRef.current}px`, "SCALE_MISMATCH");
      guard(ctx.imageSmoothingEnabled === false && lctx.imageSmoothingEnabled === false, "SMOOTHING_ON");
      guard(!(simElapsedRef.current < 2000 && tl.phase === "card" && skipRequestedRef.current === false), "CARD_AT_T0");
      if (tl.phase === "montage") guard(Number.isFinite(rocketXRef.current) && Number.isFinite(rocketYRef.current) && Number.isFinite(rocketVXRef.current) && Number.isFinite(rocketVYRef.current), "ROCKET_NAN");
      if (tl.phase === "card") reachedCardRef.current = true;
      guard(!(reachedCardRef.current && tl.phase !== "card"), "LOOPED_AFTER_CARD");
      if (guardErrorRef.current) {
        if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
        renderGuardFail(tl);
        rafRef.current = null;
        return;
      }
      updateParticles(dt);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      lctx.imageSmoothingEnabled = false;
      lctx.clearRect(0, 0, LW, LH);
      lctx.fillStyle = "#000";
      lctx.fillRect(0, 0, LW, LH);

      const a = assetsRef.current;
      if (!a) {
        const blink = Math.floor(now / 250) % 2 === 0;
        drawTextShadow(lctx, "LOADING...", 72, 52, blink ? "#dce8ff" : "#89a7dd", "#05080f");
        if (errRef.current) drawTextShadow(lctx, "LOAD ERROR", 70, 63, "#f3b7b7", "#2a0909");
        drawSound(); drawStamp(); drawDebugOverlay(tl);
      } else {
        const tSec = tl.elapsed / 1000;
        if (tl.phase === "card") {
          const p = clamp(tl.local / 450, 0, 1); const sc = p < 1 ? 0.86 + easeBack(p) * 0.14 : 1; cardScaleRef.current = sc;
          lctx.save(); lctx.translate(Math.floor(LW/2), Math.floor(LH/2)); lctx.scale(sc, sc); lctx.translate(-Math.floor(LW/2), -Math.floor(LH/2));
          drawScene(a, "card_bg"); lctx.fillStyle = "rgba(5,10,18,0.45)"; lctx.fillRect(12,14,176,85); lctx.fillStyle = "rgba(215,236,255,0.13)"; lctx.fillRect(13,15,174,1);
          drawCapsule("CONTACT CARD", 16, 1); drawTextShadow(lctx, "EMAIL", 20, 29, "#b8d4ff", "#05080f"); drawTextShadow(lctx, CONTACT.email, sx(52), sy(73), "#eff6ff", "#070b12");
          const hb = a.manifest.hitboxes;
          drawButton(hb.openEmail, "OPEN EMAIL", hoverRef.current === "openEmail"); drawButton(hb.copyEmail, "COPY EMAIL", hoverRef.current === "copyEmail"); drawButton(hb.backToPortals, "BACK TO PORTALS", hoverRef.current === "backToPortals"); drawButton(hb.candyCastle, "RETURN TO CANDY CASTLE", hoverRef.current === "candyCastle");
          drawSocial("social1", hb.social1, hoverRef.current === "social1"); drawSocial("social2", hb.social2, hoverRef.current === "social2"); drawSocial("social3", hb.social3, hoverRef.current === "social3"); drawSocial("social4", hb.social4, hoverRef.current === "social4");
          const hov = hoverRef.current; if (hov && hov !== "soundToggle") { const hr = rectL((hb as Record<string, Rect>)[hov]); lctx.fillStyle = "rgba(196,228,255,0.14)"; lctx.fillRect(hr.x, hr.y, hr.w, hr.h); lctx.strokeStyle = "#d3ebff"; lctx.lineWidth = 1; lctx.strokeRect(hr.x + 0.5, hr.y + 0.5, hr.w, hr.h); }
          if (toastTextRef.current && now < toastUntilRef.current) { const tr = rectL({ x:292, y:64, w:66, h:16 }); lctx.fillStyle = "#f7e5a2"; lctx.fillRect(tr.x,tr.y,tr.w,tr.h); lctx.fillStyle = "#233247"; lctx.fillRect(tr.x+1,tr.y+1,Math.max(1,tr.w-2),Math.max(1,tr.h-2)); drawTextShadow(lctx, toastTextRef.current, tr.x + 6, tr.y + 5, "#fff6c7", "#05080f"); }
          lctx.restore();
        } else {
          const shake = tl.phase === "crash"
            ? (() => { const p = clamp(tl.local / a.manifest.times.crash, 0, 1); if (p < 0.58) return { x:0, y:0 }; const q = clamp((p - 0.58)/0.42, 0, 1); const amp = (1-q)*2.4; return { x: Math.round(Math.sin(q*42)*amp), y: Math.round(Math.cos(q*35)*amp) }; })()
            : tl.phase === "explosion"
              ? (() => { const p = clamp(tl.local / a.manifest.times.explosion, 0, 1); const amp = (1-p)*2; return { x: Math.round(Math.sin(p*50)*amp), y: Math.round(Math.cos(p*39)*amp) }; })()
              : { x:0, y:0 };
          lctx.save(); lctx.translate(shake.x, shake.y);
          if (tl.phase === "countdown") {
            drawScene(a, "launch_pad", 1, 1, Math.sin(tSec*0.8), Math.cos(tSec*1.2)*0.4);
            const pose = poseFor(tl); spawnTrail(pose, dt); drawParticles(a, false); drawRocket(a, pose, tSec); drawParticles(a, true);
            const seg = a.manifest.times.countdownTotal / 3; const shown = clamp(3 - Math.floor(tl.local / seg), 1, 3); if (countdownShownRef.current !== shown) { countdownShownRef.current = shown; tickBeep(); }
            const pulse = (tl.local % seg) / seg; const bx=82, by=13, bw=36, bh=18; lctx.fillStyle="#0a1120"; lctx.fillRect(bx,by,bw,bh); lctx.fillStyle="#f3f7ff"; lctx.fillRect(bx+1,by+1,bw-2,bh-2); lctx.fillStyle="#1a2744"; lctx.fillRect(bx+2,by+2,bw-4,bh-4); lctx.fillStyle="#f3f7ff"; lctx.fillRect(bx+14,by+bh-1,6,3); lctx.fillStyle="#1a2744"; lctx.fillRect(bx+15,by+bh,4,2);
            const sc = pulse > 0.6 ? 2 : 1; drawTextShadow(lctx, String(shown), bx + Math.floor((bw - textW(String(shown), sc))/2), by + Math.floor((bh - 7*sc)/2), "#ffd861", "#5b3c00", sc); if (debugOnRef.current) drawCapsule("LAUNCH SEQUENCE", 12, 1);
          } else if (tl.phase === "liftoff") {
            const p = clamp(tl.local / a.manifest.times.liftoffToSpace, 0, 1); const atmo = clamp((p - 0.22)/0.26, 0, 1); const space = clamp((p - 0.58)/0.25, 0, 1);
            drawScene(a, "liftoff", 1 - atmo, 1 + p*0.02, 0, -p*3); drawScene(a, "atmosphere", atmo*(1 - space*0.75), 1 + p*0.015, 0, -p*2); drawScene(a, "deep_space", space, 1, 0, -p); drawStars(tSec, space, p*0.4);
            const pose = poseFor(tl); spawnSmoke(pose, dt, 1 - p*0.3); spawnTrail(pose, dt); drawParticles(a, false); if (p > 0.7) drawSpeedLines(tSec, ((p - 0.7)/0.3)*0.5); drawRocket(a, pose, tSec); drawParticles(a, true); if (debugOnRef.current) drawCapsule("ASCENT", 12, 1 - p*0.2);
          } else if (tl.phase === "montage") {
            const u = clamp(tl.planetLocal / a.manifest.times.planetHold, 0, 1);
            const approach = clamp(u / 0.25, 0, 1);
            const hold = clamp((u - 0.25) / 0.5, 0, 1);
            const exit = clamp((u - 0.75) / 0.25, 0, 1);
            const vignetteAlpha = u < 0.25 ? easeOut(approach) : u < 0.75 ? 1 : 1 - easeOut(exit);
            const travelIntensity = 0.25 + 0.75 * Math.max(approach, exit);
            drawCorridor(a, tSec, travelIntensity);
            const vignette = drawPlanetVignette(a, PLANETS[tl.planetIndex], vignetteAlpha, approach, hold, exit, tSec, tl.planetIndex);
            const pose = updateRocket(dt, tl, vignette);
            guard(Number.isFinite(rocketXRef.current) && Number.isFinite(rocketYRef.current), "ROCKET_NAN");
            spawnTravelExhaust(pose, dt, travelIntensity);
            if (approach > 0.05 || exit > 0.05) spawnTrail(pose, dt);
            drawParticles(a, false);
            if (vignette && hold > 0.25 && vignetteAlpha > 0.6) {
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.imageSmoothingEnabled = false;
              ctx.beginPath();
              ctx.roundRect(vignette.x, vignette.y, vignette.w, vignette.h, vignette.radius);
              ctx.clip();
              drawRocketFull(a, rocketXRef.current, rocketYRef.current, rocketRotRef.current, tSec, 0.78, 52);
              ctx.fillStyle = "rgba(120,180,255,0.08)";
              ctx.fillRect(vignette.x, vignette.y + Math.round(vignette.h * 0.27), vignette.w, 2);
              ctx.fillStyle = "rgba(160,210,255,0.05)";
              ctx.fillRect(vignette.x, vignette.y, vignette.w, vignette.h);
              ctx.restore();
            }
            drawRocket(a, pose, tSec);
            drawParticles(a, true);
            drawMiniCapsule(PLANETS[tl.planetIndex].toUpperCase(), Math.min(clamp(u/0.14, 0, 1), clamp((1-u)/0.18, 0, 1)));
          } else if (tl.phase === "crash") {
            const p = clamp(tl.local / a.manifest.times.crash, 0, 1); drawScene(a, "deep_space", 1, 1, Math.sin(tSec*0.7), Math.cos(tSec*0.9)); drawStars(tSec, 0.8, 0.1); drawScene(a, "pluto", 1, lerp(1.05,1.02,p), lerp(8,-4,p), Math.sin(tSec*1.5)); if (p < 0.6) drawSpeedLines(tSec, (1 - p/0.6)*0.65);
            const pose = poseFor(tl); if (!crashOnceRef.current && p >= 0.58) { crashOnceRef.current = true; bonkBeep(); spawnDust(149,81); spawn({ kind:"spark", x:149, y:78, vx:0, vy:0, g:0, size:20, life:140, max:140, alpha:1, rot:0, spin:0, front:true, tile:"bonk_burst" }); }
            if (p < 0.58) spawnTrail(pose, dt); drawParticles(a, false); drawRocket(a, pose, tSec); drawParticles(a, true); if (debugOnRef.current) drawCapsule("PLUTO", 12, 1);
            if (p >= 0.58) { const q = clamp((p - 0.58)/0.42, 0, 1); const pop = easeBack(Math.min(q*1.4, 1)); const y = 46 - Math.sin(q*10)*2*(1-q); const sc = q < 0.2 ? 2 : 1; lctx.save(); lctx.globalAlpha = clamp(1 - q*0.35, 0, 1); if (Math.abs(pop - 1) > 0.01) { lctx.translate(138, y + 3); lctx.scale(pop, pop); lctx.translate(-138, -(y + 3)); } drawTextShadow(lctx, "BONK!", 138 - Math.floor((textW("BONK!", sc) * pop)/2), y, "#ffe06d", "#543400", sc); lctx.restore(); }
          } else if (tl.phase === "explosion") {
            const p = clamp(tl.local / a.manifest.times.explosion, 0, 1); if (!explosionOnceRef.current) { explosionOnceRef.current = true; boomBeep(); spawnExplosion(111,60); }
            drawScene(a, "explosion_bg"); drawStars(tSec, 0.55 * (1-p), 0.2);
            (["ring_1","ring_2","ring_3","ring_4"] as const).forEach((ring, i) => { const rt = clamp((p - i*0.07)/0.45, 0, 1); if (rt > 0 && rt < 1) drawFx(a, ring, 111, 60, 16 + rt*(26 + i*5), (1 - rt)*(0.95 - i*0.1)); });
            drawFx(a, Math.floor(tSec*14)%2 ? "starburst_1" : "starburst_2", 111, 60, 22 + p*26, 0.95 - p*0.25, p*0.8); drawFx(a, "glitter_1", 100, 52, 8 + p*5, 0.55); drawFx(a, "glitter_2", 124, 67, 8 + p*6, 0.45); drawParticles(a, false); drawParticles(a, true);
          }
          lctx.restore();
        }
        drawSound(); drawStamp(); drawDebugOverlay(tl);
      }

      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false; lctx.imageSmoothingEnabled = false;
      rafRef.current = window.requestAnimationFrame(renderFrame);
    };

    const enterCard = (_elapsed: number): void => {
      void _elapsed;
      jumpToPhase("card");
    };
    const loadAssets = async (): Promise<void> => {
      try {
        const res = await fetch(MANIFEST_PATH, { cache: "no-store" }); if (!res.ok) throw new Error(`Manifest HTTP ${res.status}`);
        const raw = (await res.json()) as ManifestRaw; const manifest = resolveManifest(raw); const [scenes, fx] = await Promise.all([loadImage(raw.sceneAtlas.path), loadImage(raw.fxAtlas.path)]);
        if (dead) return; assetsRef.current = { manifest, scenes, fx };
        const hb = manifest.hitboxes;
        actionsRef.current = [
          { id:"openEmail", rect:hb.openEmail, onClick:()=>{ uiBeep(); window.location.href = `mailto:${CONTACT.email}`; } },
          { id:"copyEmail", rect:hb.copyEmail, onClick:async()=>{ uiBeep(); try { await navigator.clipboard?.writeText?.(CONTACT.email); } catch {} toastTextRef.current = "COPIED!"; toastUntilRef.current = performance.now() + 1100; } },
          { id:"social1", rect:hb.social1, onClick:()=>{ uiBeep(); window.open(CONTACT.instagram, "_blank", "noopener,noreferrer"); } },
          { id:"social2", rect:hb.social2, onClick:()=>{ uiBeep(); window.open(CONTACT.tiktok, "_blank", "noopener,noreferrer"); } },
          { id:"social3", rect:hb.social3, onClick:()=>{ uiBeep(); window.open(CONTACT.linkedin, "_blank", "noopener,noreferrer"); } },
          { id:"social4", rect:hb.social4, onClick:()=>{ uiBeep(); window.open(CONTACT.x, "_blank", "noopener,noreferrer"); } },
          { id:"backToPortals", rect:hb.backToPortals, onClick:()=>{ uiBeep(); router.push(CONTACT.portals); } },
          { id:"candyCastle", rect:hb.candyCastle, onClick:()=>{ uiBeep(); window.location.href = CONTACT.candy; } },
        ];
      } catch (e) { errRef.current = e instanceof Error ? e.message : "Failed to load"; }
    };

    const updateHover = (e: PointerEvent): void => {
      const p = toInternal(e); if (hit(SOUND_RECT, p.x, p.y)) return setCursor("soundToggle");
      if (phaseRef.current !== "card") return setCursor(null);
      for (const a of actionsRef.current) if (hit(a.rect, p.x, p.y)) return setCursor(a.id);
      setCursor(null);
    };
    const onPointerDown = (e: PointerEvent): void => {
      userGestureRef.current = true; const p = toInternal(e);
      if (hit(SOUND_RECT, p.x, p.y)) { soundOnRef.current = !soundOnRef.current; if (soundOnRef.current) window.setTimeout(() => beep(650, 60, "square", 0.03, 840), 0); updateHover(e); return; }
      if (phaseRef.current !== "card") { enterCard(simElapsedRef.current); uiBeep(); return; }
      for (const a of actionsRef.current) if (hit(a.rect, p.x, p.y)) { void a.onClick(); return; }
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      userGestureRef.current = true;
      const key = e.key;
      if (key === "d" || key === "D") { debugOnRef.current = !debugOnRef.current; return; }
      if (key === " ") { e.preventDefault(); pausedRef.current = !pausedRef.current; return; }
      if (key === ".") { if (pausedRef.current) stepOnceRef.current = true; return; }
      if (key === "r" || key === "R") {
        resetAll("key");
        if (rafRef.current === null) rafRef.current = window.requestAnimationFrame(renderFrame);
        return;
      }
      if (key === "1") { jumpToPhase("countdown"); return; }
      if (key === "2") { jumpToPhase("liftoff"); return; }
      if (key === "3") { jumpToPhase("montage"); return; }
      if (key === "4") { jumpToPhase("crash"); return; }
      if (key === "5") { jumpToPhase("explosion"); return; }
      if (key === "6") { jumpToPhase("card"); return; }
    };
    const onLeave = (): void => setCursor(null);

    resetAll("mount");
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("pointermove", updateHover);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    void loadAssets();
    rafRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      dead = true;
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("pointermove", updateHover);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      if (audioRef.current) void audioRef.current.close();
    };
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block"
        style={{ imageRendering: "pixelated" }}
        aria-label="Contact Mission v6.3.1 canvas cutscene"
      />
    </div>
  );
}
