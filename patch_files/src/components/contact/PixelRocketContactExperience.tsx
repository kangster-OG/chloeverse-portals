"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Stage = "launch" | "lift" | "flyby" | "crash" | "explosion" | "card";

type Channel = {
  key: string;
  label: string;
  value: string;
  href: string;
  copyValue: string;
};

const ASSETS = {
  launchBg: "/contact/pixelrocket/launch_clean3.png",
  flybyBg: "/contact/pixelrocket/flyby_clean.png",
  boom1: "/contact/pixelrocket/explosion_clean.png",
  boom2: "/contact/pixelrocket/explosion_clean2.png",
  boom3: "/contact/pixelrocket/explosion_clean3.png",
  card: "/contact/pixelrocket/card_clean2.png",
} as const;

const PLANETS = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;

type PlanetName = (typeof PLANETS)[number];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function smooth(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}
function easeOutBack(t: number) {
  const x = clamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

/* -------------------- Tiny SFX pack (WebAudio) -------------------- */
type Sfx = { ctx: AudioContext; master: GainNode; enabled: boolean };

function createSfx(): Sfx | null {
  try {
    const AC =
      (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.06;
    master.connect(ctx.destination);
    return { ctx, master, enabled: true };
  } catch {
    return null;
  }
}

function ensureSfx(ref: React.MutableRefObject<Sfx | null>, enabled: boolean) {
  if (!ref.current) ref.current = createSfx();
  const s = ref.current;
  if (!s) return null;
  s.enabled = enabled;
  if (s.ctx.state === "suspended") void s.ctx.resume().catch(() => {});
  return s;
}

function beep(sfx: Sfx, freq: number, durMs: number, type: OscillatorType = "square", gain = 0.5) {
  if (!sfx.enabled) return;
  const { ctx, master } = sfx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const now = ctx.currentTime;
  const dur = Math.max(0.02, durMs / 1000);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g);
  g.connect(master);
  o.start(now);
  o.stop(now + dur + 0.03);
}

function noiseBurst(sfx: Sfx, durMs: number, cutoff = 1700) {
  if (!sfx.enabled) return;
  const { ctx, master } = sfx;
  const dur = Math.max(0.03, durMs / 1000);
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.22;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;

  const g = ctx.createGain();
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.85, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(master);

  src.start(now);
  src.stop(now + dur + 0.02);
}

/* -------------------- Pixel renderer helpers -------------------- */
function setPixelPerfect(ctx: CanvasRenderingContext2D) {
  // @ts-expect-error - vendor props
  ctx.imageSmoothingEnabled = false;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
}

function ptxt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, c: string, size: number, align: CanvasTextAlign = "left") {
  ctx.fillStyle = c;
  ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(s, Math.round(x), Math.round(y));
}

type Puff = { x: number; y: number; vx: number; vy: number; age: number; life: number; s: number };
type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; c: string; s: number };

function drawStarfield(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, speed: number) {
  // two layers: slow dots + fast streaks
  for (let i = 0; i < 90; i++) {
    const sx = (i * 97) % w;
    const sy = (i * 53) % h;
    const k = 0.2 + (((i * 13) % 50) / 100);
    const x = (sx + t * (6 + 16 * k) * speed) % w;
    const a = 0.25 + 0.50 * (0.5 + 0.5 * Math.sin(t * 1.1 + k * 10));
    ctx.fillStyle = `rgba(170,255,250,${a.toFixed(3)})`;
    const s = 1 + (i % 2);
    ctx.fillRect(Math.round(x), Math.round(sy), s, s);
  }
  for (let i = 0; i < 28; i++) {
    const sy = 8 + i * 6;
    const x = (w - ((t * (90 + i * 7) * speed) % (w + 60)));
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(Math.round(x), Math.round(sy), 10, 1);
  }
  // lilac specks
  for (let i = 0; i < 16; i++) {
    const sx = (i * 83) % w;
    const sy = (i * 41) % h;
    const x = (sx + t * (3 + i) * speed) % w;
    ctx.fillStyle = "rgba(200,140,255,0.07)";
    ctx.fillRect(Math.round(x), Math.round(sy), 2, 2);
  }
}

function drawEarthHorizon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const horizonY = Math.round(h * 0.70);
  // ocean band
  px(ctx, 0, horizonY, w, h - horizonY, "#1d3cff", 1);
  // cloud streaks
  for (let i = 0; i < 6; i++) {
    const y = horizonY + 6 + i * 6;
    const x = (t * (24 + i * 8)) % (w + 60) - 60;
    px(ctx, x, y, 22 + i * 6, 2, "rgba(255,255,255,0.35)");
  }
  // subtle curved edge illusion
  px(ctx, 0, horizonY - 2, w, 2, "rgba(140,255,220,0.10)");
}

function drawLaunchPad(ctx: CanvasRenderingContext2D, cx: number, y: number) {
  px(ctx, cx - 26, y, 52, 8, "#2a2b3b");
  px(ctx, cx - 24, y + 2, 48, 2, "#3b3d55");
  px(ctx, cx - 20, y + 5, 40, 2, "#2a2b3b");
}

function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, mode: "idle" | "thrust" | "wobble", thrust = 0.0) {
  const bob = mode === "idle" ? Math.sin(t * 6) * 1.5 : 0;
  const wob = mode === "wobble" ? Math.sin(t * 18) * 2 : 0;
  const xx = x + wob;
  const yy = y + bob;

  // body
  px(ctx, xx + 8, yy + 2, 8, 22, "#f7f7ff");
  px(ctx, xx + 9, yy + 3, 6, 20, "#e6e6ff");
  // nose
  px(ctx, xx + 9, yy, 6, 3, "#ff4d7d");
  px(ctx, xx + 10, yy + 1, 4, 2, "#ff7da1");
  // window
  px(ctx, xx + 10, yy + 8, 4, 4, "#2bd6ff");
  px(ctx, xx + 11, yy + 9, 2, 2, "#a6f3ff");
  // stripe
  px(ctx, xx + 8, yy + 14, 8, 3, "#ff4d7d");
  px(ctx, xx + 8, yy + 17, 8, 1, "#ffd36b");
  // fins
  px(ctx, xx + 6, yy + 18, 2, 6, "#ff4d7d");
  px(ctx, xx + 16, yy + 18, 2, 6, "#ff4d7d");
  px(ctx, xx + 6, yy + 20, 2, 4, "#ff7da1");
  px(ctx, xx + 16, yy + 20, 2, 4, "#ff7da1");
  // base
  px(ctx, xx + 9, yy + 24, 6, 3, "#3a3a48");
  px(ctx, xx + 10, yy + 25, 4, 2, "#252530");

  // tiny CONTACT stamp
  ptxt(ctx, "C", xx + 12, yy + 15, "rgba(0,0,0,0.35)", 6, "center");

  // flame
  if (mode !== "idle") {
    const flick = Math.floor((t * 18) % 3);
    const h = 4 + flick + Math.round(thrust * 6);
    px(ctx, xx + 11, yy + 27, 2, h, "#ffd36b");
    px(ctx, xx + 11, yy + 28, 2, Math.max(0, h - 2), "#ff7a3d");
    if (flick === 2) px(ctx, xx + 11, yy + 29, 2, Math.max(0, h - 3), "#fff6c7");
  }
}

function planetRamp(name: PlanetName) {
  switch (name) {
    case "Mercury":
      return ["#a6a6b0", "#7b7b86", "#d6d6df", "#5f5f6a"];
    case "Venus":
      return ["#ffe7b0", "#f6d07a", "#d2a954", "#fff6d0"];
    case "Earth":
      return ["#76c8ff", "#2a7bff", "#1b4eb6", "#39d07a"];
    case "Mars":
      return ["#ff9a6d", "#d05b3a", "#9b3a24", "#f2c1a5"];
    case "Jupiter":
      return ["#ffe0c3", "#f2b98a", "#c88a58", "#d85c5c"];
    case "Saturn":
      return ["#fff0d4", "#f0d7a5", "#c9a96a", "#ffffff"];
    case "Uranus":
      return ["#b5f6ff", "#79e3ff", "#4ab8d0", "#ffffff"];
    case "Neptune":
      return ["#7aa0ff", "#3a59ff", "#2636aa", "#ffffff"];
    case "Pluto":
      return ["#f5efe9", "#cfc6bf", "#a79f98", "#ff7da1"];
    default:
      return ["#ffffff", "#cccccc", "#999999", "#666666"];
  }
}

function drawPlanet(ctx: CanvasRenderingContext2D, name: PlanetName, cx: number, cy: number, r: number, t: number) {
  const [hi, base, shade, accent] = planetRamp(name);
  // disc
  for (let yy = -r; yy <= r; yy++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
    const y = cy + yy;
    const k = (yy / r) * 0.5 + 0.5;
    let col = base;
    if (k > 0.62) col = hi;
    else if (k < 0.38) col = shade;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(cx - w), Math.round(y), Math.round(w * 2), 1);

    // stripes/bands for gas giants
    if ((name === "Jupiter" || name === "Saturn" || name === "Venus") && Math.abs(yy) % 4 === 0) {
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(Math.round(cx - w), Math.round(y), Math.round(w * 2), 1);
    }
  }

  // highlight
  px(ctx, cx - r * 0.35, cy - r * 0.35, 3, 3, "rgba(255,255,255,0.25)");

  // special details
  if (name === "Earth") {
    px(ctx, cx - 6, cy + 1, 5, 3, accent, 1);
    px(ctx, cx + 3, cy - 5, 4, 2, accent, 1);
  }
  if (name === "Mars") {
    px(ctx, cx - 2, cy - r + 2, 4, 2, "rgba(255,255,255,0.35)", 1);
  }
  if (name === "Jupiter") {
    px(ctx, cx + Math.round(r * 0.15), cy + Math.round(r * 0.15), 3, 2, accent, 1);
  }
  if (name === "Uranus" || name === "Neptune") {
    // glow aura
    ctx.strokeStyle = "rgba(150,240,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (name === "Pluto") {
    // cute marking
    px(ctx, cx - 2, cy + 1, 2, 2, accent, 0.65);
    px(ctx, cx + 2, cy + 1, 2, 2, accent, 0.65);
  }
  if (name === "Saturn") {
    // ring wobble
    const wob = Math.sin(t * 2) * 1;
    px(ctx, cx - r * 1.35, cy + wob, r * 2.7, 2, "rgba(255,255,255,0.35)");
    px(ctx, cx - r * 1.35, cy + wob + 1, r * 2.7, 1, "rgba(0,0,0,0.15)");
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, sparks: Spark[]) {
  // t: 0..1
  const k = smooth(t);
  const r = 6 + k * 48;

  // expanding ring
  ctx.strokeStyle = "rgba(255, 180, 80, 0.75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // core puff
  ctx.fillStyle = "rgba(255,246,199,0.80)";
  ctx.beginPath();
  ctx.arc(cx, cy, 4 + k * 20, 0, Math.PI * 2);
  ctx.fill();

  // starbursts pixels
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.8;
    const rr = r * (0.6 + 0.5 * Math.sin(i * 1.7 + t * 3));
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    px(ctx, x, y, 2 + (i % 2), 2 + (i % 2), i % 3 === 0 ? "#ff4d7d" : "#ffd36b", 0.9);
  }

  // glitter falling
  sparks.forEach((s) => {
    const a2 = 1 - clamp(s.age / s.life, 0, 1);
    px(ctx, s.x, s.y, s.s, s.s, s.c, a2);
  });
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function PixelRocketContactExperience() {
  const reducedMotion = usePrefersReducedMotion();

  const CONTACTS: Channel[] = useMemo(
    () => [
      { key: "email", label: "Email", value: "ugcbychloekang@gmail.com", href: "mailto:ugcbychloekang@gmail.com", copyValue: "ugcbychloekang@gmail.com" },
      { key: "instagram", label: "Instagram", value: "@imchloekang", href: "https://www.instagram.com/imchloekang/", copyValue: "https://www.instagram.com/imchloekang/" },
      { key: "x", label: "Twitter/X", value: "@KangChloe", href: "https://x.com/KangChloe", copyValue: "https://x.com/KangChloe" },
      { key: "linkedin", label: "LinkedIn", value: "Chloe Kang", href: "https://www.linkedin.com/in/chloe-kang-234292250", copyValue: "https://www.linkedin.com/in/chloe-kang-234292250" },
      { key: "tiktok", label: "TikTok", value: "@imchloekang", href: "https://www.tiktok.com/@imchloekang", copyValue: "https://www.tiktok.com/@imchloekang" },
    ],
    []
  );

  // Card hit areas (these already line up for you)
  const hitAreas = useMemo(
    () => [
      { key: "instagram", x: 0.22, y: 0.46, w: 0.11, h: 0.14, on: () => openNewTab(CONTACTS[1].href) },
      { key: "x",         x: 0.37, y: 0.46, w: 0.11, h: 0.14, on: () => openNewTab(CONTACTS[2].href) },
      { key: "linkedin",  x: 0.52, y: 0.46, w: 0.11, h: 0.14, on: () => openNewTab(CONTACTS[3].href) },
      { key: "tiktok",    x: 0.67, y: 0.46, w: 0.11, h: 0.14, on: () => openNewTab(CONTACTS[4].href) },
      { key: "open",      x: 0.16, y: 0.64, w: 0.33, h: 0.18, on: () => openNewTab(CONTACTS[0].href) },
      { key: "copy",      x: 0.52, y: 0.64, w: 0.33, h: 0.18, on: async () => copyToClipboard(CONTACTS[0].copyValue) },
      { key: "email",     x: 0.10, y: 0.30, w: 0.80, h: 0.12, on: () => openNewTab(CONTACTS[0].href) },
    ],
    [CONTACTS]
  );

  const BASE_W = 320;
  const BASE_H = 180;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const [stage, setStage] = useState<Stage>("launch");
  const stageRef = useRef<Stage>("launch");
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const [planetIndex, setPlanetIndex] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const sfxRef = useRef<Sfx | null>(null);

  // preload images
  const imgRef = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    const load = (key: string, src: string) => {
      const img = new Image();
      img.src = src;
      imgRef.current[key] = img;
    };
    load("launchBg", ASSETS.launchBg);
    load("flybyBg", ASSETS.flybyBg);
    load("boom1", ASSETS.boom1);
    load("boom2", ASSETS.boom2);
    load("boom3", ASSETS.boom3);
    load("card", ASSETS.card);
  }, []);

  const DUR = useMemo(() => {
    return {
      launch: 1.5,
      lift: 1.0,
      flybyEach: 1.0, // 0.9 travel + 0.1 label pop (we approximate)
      crash: 1.6,
      explosion: 1.25,
      cardPop: 0.6,
    };
  }, []);

  const totalFlyby = PLANETS.length * DUR.flybyEach;
  const timelineEnds = DUR.launch + DUR.lift + totalFlyby + DUR.crash + DUR.explosion + DUR.cardPop;

  const puffsRef = useRef<Puff[]>([]);
  const sparksRef = useRef<Spark[]>([]);

  const resetTimeline = () => {
    startRef.current = null;
    setStage("launch");
    setPlanetIndex(0);
    setShowCard(false);
    setCopied(null);
    puffsRef.current = [];
    sparksRef.current = [];
  };

  const skipToCard = () => {
    setShowCard(true);
    setStage("card");
  };

  const replay = () => {
    resetTimeline();
    const s = ensureSfx(sfxRef, soundOn);
    if (s) beep(s, 640, 70, "triangle", 0.20);
  };

  async function copyToClipboard(text: string) {
    const s = ensureSfx(sfxRef, soundOn);
    if (s) beep(s, 980, 40, "square", 0.16);
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied!");
    } catch {
      setCopied("Copy failed");
    }
    window.setTimeout(() => setCopied(null), 900);
  }

  const goCandyCastle = () => (window.location.href = "https://imchloekang.com");
  const goChloeverse = () => (window.location.href = "https://chloeverse.io");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = BASE_W;
    canvas.height = BASE_H;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    setPixelPerfect(ctx);

    const spawnPuff = (x: number, y: number, vx: number, vy: number) => {
      puffsRef.current.push({
        x, y, vx, vy,
        age: 0,
        life: 0.7 + Math.random() * 0.5,
        s: 2 + Math.floor(Math.random() * 2),
      });
    };

    const spawnSpark = (x: number, y: number, strength: number) => {
      const angle = Math.random() * Math.PI * 2;
      const spd = strength * (18 + Math.random() * 30);
      sparksRef.current.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - (10 + Math.random() * 10),
        age: 0,
        life: 0.5 + Math.random() * 0.5,
        c: Math.random() < 0.35 ? "#ff4d7d" : "#ffd36b",
        s: 2,
      });
    };

    let lastSfxStage: Stage | null = null;

    const frame = (ms: number) => {
      if (startRef.current == null) startRef.current = ms;
      const tRaw = (ms - startRef.current) / 1000;
      const t = reducedMotion ? tRaw * 2.2 : tRaw;

      // stage times
      const t0 = 0;
      const tLaunchEnd = t0 + DUR.launch;
      const tLiftEnd = tLaunchEnd + DUR.lift;
      const tFlybyEnd = tLiftEnd + totalFlyby;
      const tCrashEnd = tFlybyEnd + DUR.crash;
      const tExplEnd = tCrashEnd + DUR.explosion;
      const tCardEnd = tExplEnd + DUR.cardPop;

      let st: Stage = "launch";
      if (t < tLaunchEnd) st = "launch";
      else if (t < tLiftEnd) st = "lift";
      else if (t < tFlybyEnd) st = "flyby";
      else if (t < tCrashEnd) st = "crash";
      else if (t < tExplEnd) st = "explosion";
      else st = "card";

      if (st !== stageRef.current) {
        stageRef.current = st;
        setStage(st);
      }

      // sound events
      if (lastSfxStage !== st) {
        lastSfxStage = st;
        const s = ensureSfx(sfxRef, soundOn);
        if (s) {
          if (st === "launch") beep(s, 520, 60, "square", 0.18);
          if (st === "lift") beep(s, 720, 80, "triangle", 0.20);
          if (st === "flyby") beep(s, 860, 40, "square", 0.12);
          if (st === "crash") beep(s, 420, 120, "square", 0.16);
          if (st === "explosion") { noiseBurst(s, 180, 1900); beep(s, 260, 120, "sawtooth", 0.18); }
          if (st === "card") beep(s, 880, 70, "triangle", 0.18);
        }
      }

      // clear background
      ctx.fillStyle = "#070816";
      ctx.fillRect(0, 0, BASE_W, BASE_H);

      // stage-specific base background (use assets as *backplates* but not as slideshow)
      const img = imgRef.current;
      const bg = st === "launch" || st === "lift" ? img.launchBg : img.flybyBg;
      if (bg && bg.complete && bg.naturalWidth > 0) {
        // draw centered contain into base canvas
        const iw = bg.naturalWidth;
        const ih = bg.naturalHeight;
        const s = Math.min(BASE_W / iw, BASE_H / ih);
        const dw = iw * s;
        const dh = ih * s;
        const dx = (BASE_W - dw) / 2;
        const dy = (BASE_H - dh) / 2;
        ctx.drawImage(bg, dx, dy, dw, dh);
      } else {
        drawStarfield(ctx, t, BASE_W, BASE_H, 1.0);
      }

      // overlay our own diorama elements to match spec (always)
      const speed = st === "flyby" ? 1.15 + planetIndex * 0.05 : 1.0;
      drawStarfield(ctx, t * 0.7, BASE_W, BASE_H, speed);

      // subtle vignette
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, BASE_W, 12);
      ctx.fillRect(0, BASE_H - 14, BASE_W, 14);

      // Scene rendering
      if (st === "launch") {
        drawEarthHorizon(ctx, BASE_W, BASE_H, t);
        const cx = 160;
        const padY = 132 - 8;
        drawLaunchPad(ctx, cx, padY);

        // countdown bubble
        const rem = tLaunchEnd - t;
        const n = rem > 1.0 ? "3" : rem > 0.5 ? "2" : "1";
        ptxt(ctx, "CONTACT MISSION", 160, 14, "rgba(255,255,255,0.92)", 12, "center");
        ptxt(ctx, "launching...", 160, 30, "rgba(255,255,255,0.70)", 9, "center");
        ptxt(ctx, n, 160, 54, "#ffd36b", 22, "center");

        // rocket idle + tiny smoke puffs
        drawRocket(ctx, 148, 92, t, "idle");
        if (Math.floor(t * 10) % 2 === 0) spawnPuff(160, 128, (Math.random() - 0.5) * 6, 18 + Math.random() * 6);
      }

      if (st === "lift") {
        const k = smooth((t - tLaunchEnd) / DUR.lift);
        drawEarthHorizon(ctx, BASE_W, BASE_H, t + k);
        const rocketY = lerp(92, 24, k);
        drawRocket(ctx, 148, rocketY, t, "thrust", 0.9);
        ptxt(ctx, "LIFTOFF!", 160, 14, "#ff7da1", 14, "center");

        // smoke trail
        if (Math.floor(t * 20) % 2 === 0) spawnPuff(160, rocketY + 34, (Math.random() - 0.5) * 8, 22 + Math.random() * 10);
      }

      if (st === "flyby") {
        const flyT = t - tLiftEnd;
        const idx = Math.floor(flyT / DUR.flybyEach);
        const local = flyT - idx * DUR.flybyEach;
        const pIndex = clamp(idx, 0, PLANETS.length - 1);
        if (pIndex !== planetIndex) setPlanetIndex(pIndex);

        const planet = PLANETS[pIndex] as PlanetName;
        const travel = clamp(local / 0.9, 0, 1);
        const labelPop = local >= 0.9 ? clamp((local - 0.9) / 0.1, 0, 1) : 0;
        const pxT = smooth(travel);

        // planet slides in from right to left
        const planetX = lerp(BASE_W + 60, -60, pxT);
        const planetY = 92 + Math.sin((t + pIndex) * 1.2) * 6;
        const r = planet === "Jupiter" ? 30 : planet === "Saturn" ? 28 : planet === "Earth" ? 24 : planet === "Pluto" ? 18 : 22;
        drawPlanet(ctx, planet, planetX, planetY, r, t);

        // rocket stays center-left with gentle bob and thruster flicker
        drawRocket(ctx, 96, 78, t, "thrust", 0.45 + pIndex * 0.05);

        // minimal label sign pop (6 frames feel)
        if (labelPop > 0.02) {
          const s = 0.85 + 0.15 * smooth(labelPop);
          ctx.save();
          ctx.translate(160, 18);
          ctx.scale(s, s);
          ptxt(ctx, `${planet.toUpperCase()}!`, 0, 0, "rgba(255,255,255,0.95)", 12, "center");
          ctx.restore();
        }
      }

      if (st === "crash") {
        const k = smooth((t - tFlybyEnd) / DUR.crash);
        const plutoX = 220;
        const plutoY = 92;
        drawPlanet(ctx, "Pluto", plutoX, plutoY, 18, t);

        // rocket wobble then bonk
        const approachX = lerp(96, 196, k);
        const approachY = lerp(78, 86, k);
        drawRocket(ctx, approachX, approachY, t, k > 0.55 ? "wobble" : "thrust", 0.25);

        // smoke
        if (Math.floor(t * 18) % 2 === 0) spawnPuff(approachX + 12, approachY + 34, (Math.random() - 0.5) * 6, 18 + Math.random() * 8);

        if (k > 0.65) ptxt(ctx, "uh oh.", 244, 44, "#ffd36b", 10, "center");
      }

      if (st === "explosion") {
        const k = clamp((t - tCrashEnd) / DUR.explosion, 0, 1);

        // shake
        const shake = reducedMotion ? 0 : (1 - k) * 3.5;
        const sx = (Math.random() - 0.5) * shake;
        const sy = (Math.random() - 0.5) * shake;
        ctx.save();
        ctx.translate(sx, sy);

        // base pluto
        drawPlanet(ctx, "Pluto", 220, 92, 18, t);

        // overlay sprite explosion frames lightly (for your supplied art), but driven by animation timing
        const boomArr = [img.boom1, img.boom2, img.boom3];
        const bi = Math.min(2, Math.floor(k * 3));
        const boom = boomArr[bi];
        if (boom && boom.complete && boom.naturalWidth > 0) {
          const iw = boom.naturalWidth;
          const ih = boom.naturalHeight;
          const s = Math.min(BASE_W / iw, BASE_H / ih);
          const dw = iw * s;
          const dh = ih * s;
          const dx = (BASE_W - dw) / 2;
          const dy = (BASE_H - dh) / 2;
          ctx.globalAlpha = 0.55;
          ctx.drawImage(boom, dx, dy, dw, dh);
          ctx.globalAlpha = 1;
        }

        // spawn glitter sparks early
        if (k < 0.55 && Math.floor(t * 30) % 2 === 0) {
          for (let i = 0; i < 2; i++) spawnSpark(200, 92, 1.0 - k);
        }

        // update sparks
        const sparks = sparksRef.current;
        for (const s of sparks) {
          s.age += 1 / 60;
          s.x += s.vx * (1 / 60);
          s.y += s.vy * (1 / 60);
          s.vy += 32 * (1 / 60);
        }
        sparksRef.current = sparks.filter((s) => s.age < s.life);

        drawExplosion(ctx, 200, 92, k, sparksRef.current);

        ptxt(ctx, "BOOM!!", 160, 14, "#ff7da1", 14, "center");

        ctx.restore();

        // trigger card pop near end
        if (k > 0.75 && !showCard) setShowCard(true);
      }

      // update smoke puffs
      const puffs = puffsRef.current;
      for (const p of puffs) {
        p.age += 1 / 60;
        p.x += p.vx * (1 / 60);
        p.y += p.vy * (1 / 60);
        p.vy += 10 * (1 / 60);
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
      puffsRef.current = puffs.filter((p) => p.age < p.life);

      // draw smoke puffs (always on top)
      for (const p of puffsRef.current) {
        const a = 0.45 * (1 - p.age / p.life);
        px(ctx, p.x, p.y, p.s, p.s, "rgba(255,255,255,1)", a);
        px(ctx, p.x + 2, p.y + 1, p.s, p.s, "rgba(0,0,0,1)", a * 0.08);
      }

      // Card pop animation on canvas behind the interactive overlay
      if (showCard) {
        const tCard = clamp((t - tExplEnd) / DUR.cardPop, 0, 1);
        const s = 0.82 + 0.18 * easeOutBack(tCard);
        const card = img.card;
        if (card && card.complete && card.naturalWidth > 0) {
          const iw = card.naturalWidth;
          const ih = card.naturalHeight;
          const sc = Math.min(BASE_W / iw, BASE_H / ih) * s;
          const dw = iw * sc;
          const dh = ih * sc;
          const dx = (BASE_W - dw) / 2;
          const dy = (BASE_H - dh) / 2 + (1 - tCard) * 6;
          ctx.drawImage(card, dx, dy, dw, dh);
        }
      }

      // stop timeline after end (but keep subtle background motion)
      if (t > timelineEnds + 2.0) {
        // keep rendering so the card backdrop stays consistent; no-op
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [DUR, PLANETS.length, reducedMotion, soundOn, showCard, timelineEnds, totalFlyby, planetIndex]);

  const currentPlanet = PLANETS[Math.max(0, Math.min(PLANETS.length - 1, planetIndex))];

  return (
    <div
      className="fixed inset-0 bg-black"
      onPointerDown={() => {
        // unlock audio
        ensureSfx(sfxRef, soundOn);
      }}
    >
      <style jsx global>{`
        canvas.pixel {
          width: 100vw;
          height: 100vh;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          display: block;
        }
        .pr-hud {
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          justify-content: space-between;
          padding: 12px 14px;
        }
        .pr-chip {
          pointer-events: auto;
          display: inline-flex;
          gap: 8px;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(0,0,0,0.35);
          color: rgba(255,255,255,0.88);
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
        }
        .pr-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #2bd6ff;
          box-shadow: 0 0 16px rgba(43,214,255,0.7);
        }
        .pr-btn {
          pointer-events: auto;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(10px);
        }
        .pr-btn:hover { background: rgba(255,255,255,0.14); }
        .pr-toast {
          position: absolute;
          top: 56px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-weight: 900;
          backdrop-filter: blur(10px);
        }

        .pr-cardOverlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          z-index: 40;
          pointer-events: none;
        }
        .pr-cardWrap {
          position: relative;
          width: min(1180px, 100vw);
          height: 100vh;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .pr-cardImg {
          width: min(1180px, 100vw);
          height: 100vh;
          object-fit: contain;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          filter: drop-shadow(0 30px 90px rgba(0,0,0,0.70));
          pointer-events: none;
        }
        .pr-hit {
          position: absolute;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 10px;
          pointer-events: auto;
        }
        .pr-hit::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: rgba(255,255,255,0.0);
          outline: 1px solid rgba(255,255,255,0.0);
          box-shadow: 0 0 0 rgba(0,0,0,0);
          transition: all 120ms ease-out;
        }
        .pr-hit:hover::before, .pr-hit:focus-visible::before {
          background: rgba(255,255,255,0.08);
          outline: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 0 24px rgba(43,214,255,0.18);
        }

        .pr-actions {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: max(18px, env(safe-area-inset-bottom));
          display: flex;
          gap: 10px;
          z-index: 60;
          pointer-events: auto;
        }
        .pr-actionBtn {
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.92);
          background: rgba(0,0,0,0.40);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(12px);
        }
        .pr-actionBtn:hover { background: rgba(0,0,0,0.50); }

        .pr-planetPill {
          position: absolute;
          top: 76px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 35;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.95);
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 16px;
          text-shadow: 0 2px 0 rgba(0,0,0,0.6);
          backdrop-filter: blur(10px);
          pointer-events: none;
        }
      `}</style>

      <canvas ref={canvasRef} className="pixel" aria-label="Pixel rocket contact animation" />

      {/* HUD */}
      <div className="pr-hud">
        <div className="pr-chip">
          <span className="pr-dot" />
          Cute Pixel Diorama Contact
        </div>
        <div className="flex gap-2">
          <button className="pr-btn" type="button" onClick={() => setSoundOn((v) => !v)}>
            {soundOn ? "Sound: On" : "Sound: Off"}
          </button>
          {showCard ? (
            <button className="pr-btn" type="button" onClick={replay}>
              Replay
            </button>
          ) : (
            <button className="pr-btn" type="button" onClick={skipToCard}>
              Skip
            </button>
          )}
        </div>
      </div>

      {copied && <div className="pr-toast">{copied}</div>}

      {/* planet label during flyby */}
      {stage === "flyby" && !showCard && <div className="pr-planetPill">{currentPlanet}</div>}

      {/* Interactive card overlay (only when card is shown) */}
      {showCard && (
        <div className="pr-cardOverlay">
          <div className="pr-cardWrap">
            <img className="pr-cardImg" src={ASSETS.card} alt="Contact card" />
            {hitAreas.map((a) => (
              <button
                key={a.key}
                type="button"
                className="pr-hit"
                aria-label={a.key}
                title={a.key}
                style={{
                  left: `${a.x * 100}%`,
                  top: `${a.y * 100}%`,
                  width: `${a.w * 100}%`,
                  height: `${a.h * 100}%`,
                }}
                onMouseEnter={() => {
                  const s = ensureSfx(sfxRef, soundOn);
                  if (s) beep(s, 760, 25, "square", 0.10);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const s = ensureSfx(sfxRef, soundOn);
                  if (s) beep(s, 660, 35, "square", 0.14);
                  a.on();
                }}
              />
            ))}
          </div>

          <div className="pr-actions">
            <button type="button" className="pr-actionBtn" onClick={goCandyCastle}>
              Return to Candy Castle
            </button>
            <button type="button" className="pr-actionBtn" onClick={goChloeverse}>
              Back to Chloeverse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PixelRocketContactExperience;
