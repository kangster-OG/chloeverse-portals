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

const PLANETS = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
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

function beep(sfx: Sfx, freq: number, durMs: number, type: OscillatorType = "square", gain = 0.45) {
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

function noiseBurst(sfx: Sfx, durMs: number, cutoff = 1800) {
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

/* -------------------- Pixel rendering helpers -------------------- */
function setPixelPerfect(ctx: CanvasRenderingContext2D) {
  // @ts-expect-error
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

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#55b9ff");
  g.addColorStop(0.55, "#2a7bff");
  g.addColorStop(1, "#1d3cff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawSpace(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#070816");
  g.addColorStop(1, "#04040c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawClouds(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, layer: 0 | 1) {
  const yBase = layer === 0 ? Math.round(h * 0.50) : Math.round(h * 0.62);
  const speed = layer === 0 ? 14 : 28;
  const alpha = layer === 0 ? 0.20 : 0.14;
  for (let i = 0; i < 6; i++) {
    const ww = 28 + i * 12;
    const hh = 6 + (i % 2) * 2;
    const x = ((t * speed) + i * 56) % (w + 80) - 80;
    const y = yBase + i * 4;
    px(ctx, x, y, ww, hh, "rgba(255,255,255,1)", alpha);
    px(ctx, x + 6, y - 2, ww * 0.55, hh, "rgba(255,255,255,1)", alpha * 0.85);
  }
}

function drawStarfield(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, speed: number) {
  // mint/cyan stars
  for (let i = 0; i < 110; i++) {
    const sx = (i * 97) % w;
    const sy = (i * 53) % h;
    const k = 0.2 + (((i * 13) % 50) / 100);
    const x = (sx + t * (6 + 18 * k) * speed) % w;
    const a = 0.22 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.1 + k * 10));
    ctx.fillStyle = `rgba(170,255,250,${a.toFixed(3)})`;
    const s = 1 + (i % 2);
    ctx.fillRect(Math.round(x), Math.round(sy), s, s);
  }
  // lilac nebula specks
  for (let i = 0; i < 22; i++) {
    const sx = (i * 83) % w;
    const sy = (i * 41) % h;
    const x = (sx + t * (2.5 + i * 0.4) * speed) % w;
    ctx.fillStyle = "rgba(200,140,255,0.06)";
    ctx.fillRect(Math.round(x), Math.round(sy), 2, 2);
  }
  // streaks
  for (let i = 0; i < 24; i++) {
    const sy = 10 + i * 7;
    const x = (w - ((t * (90 + i * 7) * speed) % (w + 60)));
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(Math.round(x), Math.round(sy), 10, 1);
  }
}

function drawEarthHorizon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const horizonY = Math.round(h * 0.72);
  // ocean band
  px(ctx, 0, horizonY, w, h - horizonY, "#1d3cff", 1);
  // cloud streaks on horizon
  for (let i = 0; i < 6; i++) {
    const y = horizonY + 4 + i * 6;
    const x = (t * (26 + i * 8)) % (w + 60) - 60;
    px(ctx, x, y, 20 + i * 6, 2, "rgba(255,255,255,1)", 0.32);
  }
  // glow edge
  px(ctx, 0, horizonY - 2, w, 2, "rgba(140,255,220,1)", 0.10);
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
    const h = 4 + flick + Math.round(thrust * 7);
    px(ctx, xx + 11, yy + 27, 2, h, "#ffd36b");
    px(ctx, xx + 11, yy + 28, 2, Math.max(0, h - 2), "#ff7a3d");
    if (flick === 2) px(ctx, xx + 11, yy + 29, 2, Math.max(0, h - 3), "#fff6c7");
  }
}

function planetRamp(name: PlanetName) {
  switch (name) {
    case "Mercury":
      return ["#d6d6df", "#a6a6b0", "#7b7b86", "#5f5f6a"];
    case "Venus":
      return ["#fff6d0", "#f6d07a", "#d2a954", "#ffe7b0"];
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
  }
}

function drawPlanet(ctx: CanvasRenderingContext2D, name: PlanetName, cx: number, cy: number, r: number, t: number) {
  const [hi, base, shade, accent] = planetRamp(name);
  for (let yy = -r; yy <= r; yy++) {
    const ww = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
    const y = cy + yy;
    const k = (yy / r) * 0.5 + 0.5;
    let col = base;
    if (k > 0.62) col = hi;
    else if (k < 0.38) col = shade;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(cx - ww), Math.round(y), Math.round(ww * 2), 1);

    if ((name === "Jupiter" || name === "Saturn" || name === "Venus") && Math.abs(yy) % 4 === 0) {
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(Math.round(cx - ww), Math.round(y), Math.round(ww * 2), 1);
    }
  }
  px(ctx, cx - r * 0.35, cy - r * 0.35, 3, 3, "rgba(255,255,255,1)", 0.25);

  if (name === "Earth") {
    px(ctx, cx - 6, cy + 1, 5, 3, accent, 1);
    px(ctx, cx + 3, cy - 5, 4, 2, accent, 1);
  }
  if (name === "Mars") {
    px(ctx, cx - 2, cy - r + 2, 4, 2, "rgba(255,255,255,1)", 0.30);
  }
  if (name === "Jupiter") {
    px(ctx, cx + Math.round(r * 0.15), cy + Math.round(r * 0.15), 3, 2, accent, 1);
  }
  if (name === "Uranus" || name === "Neptune") {
    ctx.strokeStyle = "rgba(150,240,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (name === "Pluto") {
    px(ctx, cx - 2, cy + 1, 2, 2, accent, 0.65);
    px(ctx, cx + 2, cy + 1, 2, 2, accent, 0.65);
  }
  if (name === "Saturn") {
    const wob = Math.sin(t * 2) * 1;
    px(ctx, cx - r * 1.35, cy + wob, r * 2.7, 2, "rgba(255,255,255,1)", 0.35);
    px(ctx, cx - r * 1.35, cy + wob + 1, r * 2.7, 1, "rgba(0,0,0,1)", 0.15);
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, sparks: Spark[]) {
  const k = smooth(t);
  const r = 6 + k * 52;

  ctx.strokeStyle = "rgba(255, 180, 80, 0.75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,246,199,0.80)";
  ctx.beginPath();
  ctx.arc(cx, cy, 4 + k * 20, 0, Math.PI * 2);
  ctx.fill();

  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.8;
    const rr = r * (0.6 + 0.5 * Math.sin(i * 1.7 + t * 3));
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    px(ctx, x, y, 2 + (i % 2), 2 + (i % 2), i % 3 === 0 ? "#ff4d7d" : "#ffd36b", 0.9);
  }

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

  const BASE_W = 320;
  const BASE_H = 180;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const [stage, setStage] = useState<Stage>("launch");
  const [planetIndex, setPlanetIndex] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const sfxRef = useRef<Sfx | null>(null);

  const puffsRef = useRef<Puff[]>([]);
  const sparksRef = useRef<Spark[]>([]);

  const DUR = useMemo(() => {
    return {
      launch: 1.5,
      lift: 1.0,
      flyEach: 1.0,
      crash: 1.6,
      boom: 1.25,
      card: 0.6,
    };
  }, []);

  const totalFly = PLANETS.length * DUR.flyEach;
  const tLaunchEnd = DUR.launch;
  const tLiftEnd = tLaunchEnd + DUR.lift;
  const tFlyEnd = tLiftEnd + totalFly;
  const tCrashEnd = tFlyEnd + DUR.crash;
  const tBoomEnd = tCrashEnd + DUR.boom;
  const tCardEnd = tBoomEnd + DUR.card;

  const reset = () => {
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
    reset();
    const s = ensureSfx(sfxRef, soundOn);
    if (s) beep(s, 740, 60, "triangle", 0.20);
  };

  const copyToClipboard = async (text: string) => {
    const s = ensureSfx(sfxRef, soundOn);
    if (s) beep(s, 980, 40, "square", 0.16);
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied!");
    } catch {
      setCopied("Copy failed");
    }
    window.setTimeout(() => setCopied(null), 900);
  };

  const goCandyCastle = () => (window.location.href = "https://imchloekang.com");
  const goChloeverse = () => (window.location.href = "https://chloeverse.io");

  // HTML card UI (matches spec; no fake email in an image)
  const CardUI = () => (
    <div className="pr-cardUi" role="dialog" aria-label="Contact card">
      <div className="pr-cardFrame">
        <div className="pr-cardTitle">Contact Me!</div>
        <div className="pr-cardLine">
          <span className="pr-cardLabel">Email:</span>
          <button className="pr-cardLink" onClick={() => openNewTab(CONTACTS[0].href)} type="button">
            {CONTACTS[0].value}
          </button>
        </div>

        <div className="pr-icons">
          <button className="pr-icon" onClick={() => openNewTab(CONTACTS[1].href)} type="button" aria-label="Instagram">IG</button>
          <button className="pr-icon" onClick={() => openNewTab(CONTACTS[2].href)} type="button" aria-label="Twitter/X">X</button>
          <button className="pr-icon" onClick={() => openNewTab(CONTACTS[3].href)} type="button" aria-label="LinkedIn">in</button>
          <button className="pr-icon" onClick={() => openNewTab(CONTACTS[4].href)} type="button" aria-label="TikTok">TT</button>
        </div>

        <div className="pr-cardBtns">
          <button className="pr-btnA" onClick={() => openNewTab(CONTACTS[0].href)} type="button">Open</button>
          <button className="pr-btnB" onClick={() => copyToClipboard(CONTACTS[0].copyValue)} type="button">Copy</button>
        </div>
      </div>

      <div className="pr-actions">
        <button type="button" className="pr-actionBtn" onClick={goCandyCastle}>Return to Candy Castle</button>
        <button type="button" className="pr-actionBtn" onClick={goChloeverse}>Back to Chloeverse</button>
      </div>
    </div>
  );

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
        life: 0.6 + Math.random() * 0.6,
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
        life: 0.5 + Math.random() * 0.6,
        c: Math.random() < 0.35 ? "#ff4d7d" : "#ffd36b",
        s: 2,
      });
    };

    let lastStage: Stage | null = null;

    const frame = (ms: number) => {
      if (startRef.current == null) startRef.current = ms;
      const tRaw = (ms - startRef.current) / 1000;
      const t = reducedMotion ? tRaw * 2.2 : tRaw;

      // Determine stage
      let st: Stage = "launch";
      if (t < tLaunchEnd) st = "launch";
      else if (t < tLiftEnd) st = "lift";
      else if (t < tFlyEnd) st = "flyby";
      else if (t < tCrashEnd) st = "crash";
      else if (t < tBoomEnd) st = "explosion";
      else st = "card";

      if (st !== stage) setStage(st);

      // SFX triggers on stage transitions (and countdown beeps)
      if (lastStage !== st) {
        lastStage = st;
        const s = ensureSfx(sfxRef, soundOn);
        if (s) {
          if (st === "launch") beep(s, 520, 50, "square", 0.18);
          if (st === "lift") beep(s, 740, 80, "triangle", 0.20);
          if (st === "flyby") beep(s, 860, 40, "square", 0.12);
          if (st === "crash") beep(s, 420, 120, "square", 0.16);
          if (st === "explosion") { noiseBurst(s, 190, 1900); beep(s, 260, 130, "sawtooth", 0.18); }
          if (st === "card") beep(s, 880, 70, "triangle", 0.18);
        }
      }

      // Background
      if (st === "launch" || st === "lift") {
        drawSky(ctx, BASE_W, BASE_H);
        drawClouds(ctx, t, BASE_W, BASE_H, 0);
        drawClouds(ctx, t, BASE_W, BASE_H, 1);
        drawEarthHorizon(ctx, BASE_W, BASE_H, t);
      } else {
        drawSpace(ctx, BASE_W, BASE_H);
      }

      // Parallax stars for space scenes
      if (st !== "launch" && st !== "lift") {
        const speed = st === "flyby" ? 1.05 + planetIndex * 0.06 : st === "crash" ? 1.15 : 1.0;
        drawStarfield(ctx, t * 0.7, BASE_W, BASE_H, speed);
      }

      // Scene content
      if (st === "launch") {
        const cx = 160;
        const padY = 124;
        drawLaunchPad(ctx, cx, padY);

        // countdown
        const rem = tLaunchEnd - t;
        const n = rem > 1.0 ? "3" : rem > 0.5 ? "2" : "1";
        ptxt(ctx, "CONTACT MISSION", 160, 14, "rgba(255,255,255,0.92)", 12, "center");
        ptxt(ctx, "launching...", 160, 30, "rgba(255,255,255,0.70)", 9, "center");
        ptxt(ctx, n, 160, 54, "#ffd36b", 22, "center");

        drawRocket(ctx, 148, 92, t, "idle");

        // smoke puffs
        if (Math.floor(t * 12) % 2 === 0) spawnPuff(160, 128, (Math.random() - 0.5) * 6, 18 + Math.random() * 6);

        // countdown beeps
        const s = ensureSfx(sfxRef, soundOn);
        if (s) {
          if (Math.abs(rem - 1.0) < 0.02) beep(s, 520, 40, "square", 0.10);
          if (Math.abs(rem - 0.5) < 0.02) beep(s, 560, 40, "square", 0.10);
        }
      }

      if (st === "lift") {
        const k = smooth((t - tLaunchEnd) / DUR.lift);
        const rocketY = lerp(92, 18, k);
        drawRocket(ctx, 148, rocketY, t, "thrust", 0.95);
        ptxt(ctx, "LIFTOFF!", 160, 14, "#ff7da1", 14, "center");
        if (Math.floor(t * 20) % 2 === 0) spawnPuff(160, rocketY + 34, (Math.random() - 0.5) * 8, 22 + Math.random() * 10);

        // darken towards space
        px(ctx, 0, 0, BASE_W, BASE_H, "#070816", k * 0.35);
      }

      if (st === "flyby") {
        const flyT = t - tLiftEnd;
        const idx = Math.floor(flyT / DUR.flyEach);
        const local = flyT - idx * DUR.flyEach;
        const pIndex = clamp(idx, 0, PLANETS.length - 1);
        if (pIndex !== planetIndex) {
          setPlanetIndex(pIndex);
          const s = ensureSfx(sfxRef, soundOn);
          if (s) beep(s, 620 + pIndex * 18, 35, "square", 0.10);
        }

        const planet = PLANETS[pIndex] as PlanetName;
        const travel = clamp(local / 0.9, 0, 1);
        const labelPop = local >= 0.9 ? clamp((local - 0.9) / 0.1, 0, 1) : 0;
        const pxT = smooth(travel);

        const planetX = lerp(BASE_W + 60, -60, pxT);
        const planetY = 92 + Math.sin((t + pIndex) * 1.2) * 6;
        const r = planet === "Jupiter" ? 30 : planet === "Saturn" ? 28 : planet === "Earth" ? 24 : planet === "Pluto" ? 18 : 22;
        drawPlanet(ctx, planet, planetX, planetY, r, t);

        drawRocket(ctx, 96, 78, t, "thrust", 0.45 + pIndex * 0.05);

        // tiny label pop (6-frame feel)
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
        const k = smooth((t - tFlyEnd) / DUR.crash);
        const plutoX = 220;
        const plutoY = 92;
        drawPlanet(ctx, "Pluto", plutoX, plutoY, 18, t);

        const approachX = lerp(96, 196, k);
        const approachY = lerp(78, 86, k);
        drawRocket(ctx, approachX, approachY, t, k > 0.55 ? "wobble" : "thrust", 0.25);

        if (Math.floor(t * 18) % 2 === 0) spawnPuff(approachX + 12, approachY + 34, (Math.random() - 0.5) * 6, 18 + Math.random() * 8);

        if (k > 0.65) ptxt(ctx, "uh oh.", 244, 44, "#ffd36b", 10, "center");
      }

      if (st === "explosion") {
        const k = clamp((t - tCrashEnd) / DUR.boom, 0, 1);

        // shake
        const shake = reducedMotion ? 0 : (1 - k) * 3.0;
        const sx = (Math.random() - 0.5) * shake;
        const sy = (Math.random() - 0.5) * shake;

        ctx.save();
        ctx.translate(sx, sy);

        drawPlanet(ctx, "Pluto", 220, 92, 18, t);

        if (k < 0.55 && Math.floor(t * 30) % 2 === 0) {
          for (let i = 0; i < 3; i++) spawnSpark(200, 92, 1.0 - k);
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

        if (k > 0.76 && !showCard) setShowCard(true);
      }

      // update puffs
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

      // draw puffs on top
      for (const p of puffsRef.current) {
        const a = 0.45 * (1 - p.age / p.life);
        px(ctx, p.x, p.y, p.s, p.s, "rgba(255,255,255,1)", a);
        px(ctx, p.x + 2, p.y + 1, p.s, p.s, "rgba(0,0,0,1)", a * 0.08);
      }

      // card pop behind HTML UI
      if (showCard) {
        const tCard = clamp((t - tBoomEnd) / DUR.card, 0, 1);
        const s = 0.82 + 0.18 * easeOutBack(tCard);
        const w = 210 * s;
        const h = 92 * s;
        const x = (BASE_W - w) / 2;
        const y = 44 - (1 - tCard) * 6;
        px(ctx, x, y, w, h, "rgba(10,12,20,1)", 0.70);
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(x) + 1, Math.round(y) + 1, Math.round(w) - 2, Math.round(h) - 2);
        ptxt(ctx, "CONTACT CARD", 160, y + 10, "rgba(255,255,255,0.9)", 10, "center");
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [DUR, PLANETS.length, reducedMotion, soundOn, stage, showCard, planetIndex, tBoomEnd, tCardEnd, tCrashEnd, tFlyEnd, tLiftEnd, tLaunchEnd]);

  return (
    <div
      className="fixed inset-0 bg-black"
      onPointerDown={() => {
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

        .pr-cardUi {
          position: absolute;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .pr-cardFrame {
          pointer-events: auto;
          width: min(520px, 92vw);
          border-radius: 18px;
          background: rgba(12, 15, 26, 0.82);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 30px 90px rgba(0,0,0,0.65);
          backdrop-filter: blur(12px);
          padding: 16px;
        }
        .pr-cardTitle {
          font-weight: 900;
          color: rgba(255,255,255,0.92);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 14px;
        }
        .pr-cardLine {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pr-cardLabel { color: rgba(255,255,255,0.65); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; }
        .pr-cardLink {
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(0,0,0,0.22);
          color: rgba(255,255,255,0.9);
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }
        .pr-cardLink:hover { background: rgba(0,0,0,0.30); }

        .pr-icons { margin-top: 12px; display: flex; gap: 10px; }
        .pr-icon {
          width: 44px; height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(0,0,0,0.22);
          color: rgba(255,255,255,0.88);
          font-weight: 900;
          cursor: pointer;
        }
        .pr-icon:hover { background: rgba(0,0,0,0.30); }

        .pr-cardBtns { margin-top: 12px; display: flex; gap: 10px; }
        .pr-btnA, .pr-btnB {
          flex: 1;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.14);
        }
        .pr-btnA { background: rgba(255,211,107,0.95); color: rgba(0,0,0,0.85); }
        .pr-btnB { background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.9); }
        .pr-btnA:hover { opacity: 0.96; }
        .pr-btnB:hover { background: rgba(255,255,255,0.14); }

        .pr-actions {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          justify-content: center;
          pointer-events: auto;
        }
        .pr-actionBtn {
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(255,255,255,0.92);
          background: rgba(0,0,0,0.40);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(12px);
          cursor: pointer;
        }
        .pr-actionBtn:hover { background: rgba(0,0,0,0.50); }
      `}</style>

      <canvas ref={canvasRef} className="pixel" aria-label="Pixel rocket contact animation" />

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

      {showCard && <CardUI />}
    </div>
  );
}

export default PixelRocketContactExperience;
