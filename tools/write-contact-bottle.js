/* tools/write-contact-bottle.js
   Writes the new Contact page: "Message-in-a-Bottle" (premium storybook nocturne)
   Run: node tools\write-contact-bottle.js
*/
const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(relPath, content) {
  const abs = path.join(process.cwd(), relPath);
  ensureDir(path.dirname(abs));
  fs.writeFileSync(abs, content, "utf8");
  console.log("WROTE:", relPath);
}

const pageTsx = `import { BottleContactExperience } from "@/components/contact/BottleContactExperience";

export default function ContactPage() {
  return <BottleContactExperience />;
}
`;

const polaroidStub = `"use client";

export function PolaroidContactHero() {
  return null;
}

export default PolaroidContactHero;
`;

const bottleExperience = `"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type TabKey = "email" | "linkedin" | "instagram" | "tiktok" | "x";

type ContactItem = {
  key: TabKey;
  label: string;
  value: string;
  href: string;
  hint: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(!!mq.matches);
    apply();
    // Safari compatibility
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);
  return reduced;
}

type Sfx = {
  ctx: AudioContext;
  master: GainNode;
};

function createSfx(): Sfx | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.06;
    master.connect(ctx.destination);
    return { ctx, master };
  } catch {
    return null;
  }
}

function beep(sfx: Sfx, freq: number, durMs: number, type: OscillatorType = "sine") {
  const { ctx, master } = sfx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;

  const now = ctx.currentTime;
  const dur = Math.max(0.01, durMs / 1000);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  o.connect(g);
  g.connect(master);

  o.start(now);
  o.stop(now + dur + 0.02);
}

function noiseWhoosh(sfx: Sfx, durMs: number) {
  const { ctx, master } = sfx;
  const dur = Math.max(0.05, durMs / 1000);

  // Create white noise buffer
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;

  const g = ctx.createGain();
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(master);

  src.start(now);
  src.stop(now + dur + 0.02);
}

export function BottleContactExperience() {
  const reducedMotion = usePrefersReducedMotion();

  const CONTACTS: ContactItem[] = useMemo(
    () => [
      {
        key: "email",
        label: "Email",
        value: "ugcbychloekang@gmail.com",
        href: "mailto:ugcbychloekang@gmail.com",
        hint: "Send a note directly",
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        value: "Chloe Kang",
        href: "https://www.linkedin.com/in/chloe-kang-234292250",
        hint: "Professional timeline + collabs",
      },
      {
        key: "instagram",
        label: "Instagram",
        value: "@imchloekang",
        href: "https://www.instagram.com/imchloekang/",
        hint: "Daily posts + stories",
      },
      {
        key: "tiktok",
        label: "TikTok",
        value: "@imchloekang",
        href: "https://www.tiktok.com/@imchloekang",
        hint: "UGC + short-form magic",
      },
      {
        key: "x",
        label: "Twitter/X",
        value: "@KangChloe",
        href: "https://x.com/KangChloe",
        hint: "Thoughts + updates",
      },
    ],
    []
  );

  const [active, setActive] = useState<TabKey>("email");
  const [opened, setOpened] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Bottle position in px
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    dx: number;
    dy: number;
  }>({ active: false, pointerId: null, dx: 0, dy: 0 });

  const bottleRef = useRef<HTMLDivElement | null>(null);

  // SFX: create only after first user interaction
  const sfxRef = useRef<Sfx | null>(null);
  const ensureSfx = () => {
    if (typeof window === "undefined") return null;
    if (sfxRef.current) return sfxRef.current;
    const sfx = createSfx();
    sfxRef.current = sfx;
    return sfx;
  };

  // Initialize bottle position relative to viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const place = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Start right-ish, just above water line
      const bx = Math.round(w * 0.72);
      const by = Math.round(h * 0.58);
      setPos({ x: bx, y: by });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  const openScroll = () => {
    if (opened) return;
    setOpened(true);
    setHintDismissed(true);
    const sfx = ensureSfx();
    if (sfx) {
      if (!reducedMotion) noiseWhoosh(sfx, 260);
      beep(sfx, 740, 90, "triangle");
      beep(sfx, 1040, 80, "sine");
    }
  };

  const onBottlePointerDown = (e: React.PointerEvent) => {
    if (opened) return;
    setHintDismissed(true);

    const sfx = ensureSfx();
    if (sfx) beep(sfx, 520, 70, "sine");

    const el = bottleRef.current;
    if (!el) return;

    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const r = el.getBoundingClientRect();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
    };
  };

  const onBottlePointerMove = (e: React.PointerEvent) => {
    if (opened) return;
    if (!dragRef.current.active) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // bottle size approx
    const bw = 132;
    const bh = 190;

    const x = clamp(e.clientX - dragRef.current.dx, 10, w - bw - 10);
    const y = clamp(e.clientY - dragRef.current.dy, 20, h - bh - 10);
    setPos({ x, y });
  };

  const onBottlePointerUp = (e: React.PointerEvent) => {
    if (opened) return;
    if (!dragRef.current.active) {
      // treat as tap
      openScroll();
      return;
    }
    if (dragRef.current.pointerId !== e.pointerId) return;

    dragRef.current.active = false;
    dragRef.current.pointerId = null;

    const sfx = ensureSfx();
    if (sfx) beep(sfx, 420, 70, "triangle");

    const w = window.innerWidth;
    const h = window.innerHeight;

    // "shore zone" near bottom center
    const shoreTop = h * 0.72;
    const shoreLeft = w * 0.34;
    const shoreRight = w * 0.66;

    const bottleCenterX = pos.x + 66;
    const bottleBottomY = pos.y + 190;

    const inZone = bottleBottomY >= shoreTop && bottleCenterX >= shoreLeft && bottleCenterX <= shoreRight;

    if (inZone) {
      openScroll();
      return;
    }

    // Not in zone: a gentle auto-drift toward waterline (small snap) for polish
    if (!reducedMotion) {
      const targetY = Math.round(h * 0.60);
      setPos((p) => ({ ...p, y: clamp(targetY, 20, h - 210) }));
    }
  };

  const openExternal = (href: string) => {
    const sfx = ensureSfx();
    if (sfx) beep(sfx, 860, 60, "sine");
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const copyText = async (t: string) => {
    const sfx = ensureSfx();
    if (sfx) beep(sfx, 980, 55, "square");
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      // fail silently
    }
  };

  const goCandyCastle = () => {
    const sfx = ensureSfx();
    if (sfx) {
      noiseWhoosh(sfx, 220);
      beep(sfx, 680, 80, "triangle");
    }
    window.location.href = "https://imchloekang.com";
  };

  const goChloeverse = () => {
    const sfx = ensureSfx();
    if (sfx) {
      noiseWhoosh(sfx, 220);
      beep(sfx, 620, 90, "triangle");
    }
    window.location.href = "https://chloeverse.io";
  };

  const activeItem = CONTACTS.find((c) => c.key === active) ?? CONTACTS[0];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07080b] text-white">
      {/* Global styles for keyframes / grain */}
      <style jsx global>{\`
        @keyframes oceanDriftA { 0% { transform: translateX(0px); } 100% { transform: translateX(-220px); } }
        @keyframes oceanDriftB { 0% { transform: translateX(0px); } 100% { transform: translateX(240px); } }
        @keyframes bottleFloat { 0%, 100% { transform: translateY(0px) rotate(-1deg); } 50% { transform: translateY(-10px) rotate(1deg); } }
        @keyframes beamSweep { 0% { transform: rotate(-16deg); opacity: .25; } 50% { transform: rotate(16deg); opacity: .38; } 100% { transform: rotate(-16deg); opacity: .25; } }
        @keyframes portalPulse { 0% { transform: scale(1); opacity: .55; } 50% { transform: scale(1.03); opacity: .85; } 100% { transform: scale(1); opacity: .55; } }
        @keyframes grainMove { 0% { transform: translate(0,0); } 100% { transform: translate(-6%, 4%); } }

        .grainOverlay {
          pointer-events: none;
          position: absolute;
          inset: -20%;
          opacity: 0.12;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 220px 220px;
          mix-blend-mode: overlay;
          animation: grainMove 6s steps(2) infinite;
        }

        .noMotion * { animation: none !important; transition: none !important; }
      \`}</style>

      <div className={reducedMotion ? "absolute inset-0 noMotion" : "absolute inset-0"}>
        {/* Backdrop gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% 35%, rgba(140, 255, 220, 0.10) 0%, rgba(140, 255, 220, 0.0) 52%), linear-gradient(180deg, #06070a 0%, #07080b 30%, #0b0f16 55%, #05060a 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 560px at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Water layers */}
        <div className="absolute inset-x-0 top-[52%] bottom-0 overflow-hidden">
          {/* Horizon glow */}
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background: "linear-gradient(90deg, rgba(120,255,230,0) 0%, rgba(120,255,230,0.35) 50%, rgba(120,255,230,0) 100%)",
              opacity: 0.6,
            }}
          />

          {/* Wave sheet A */}
          <div
            className="absolute -inset-x-[220px] inset-y-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(900px 260px at 25% 40%, rgba(110,255,210,0.12) 0%, rgba(110,255,210,0) 60%), radial-gradient(700px 240px at 70% 60%, rgba(120,220,255,0.12) 0%, rgba(120,220,255,0) 62%), linear-gradient(180deg, rgba(12,18,28,0.0) 0%, rgba(6,8,12,0.8) 100%)",
              filter: "blur(0.2px)",
              animation: "oceanDriftA 18s linear infinite",
            }}
          />

          {/* Wave sheet B */}
          <div
            className="absolute -inset-x-[240px] inset-y-0 opacity-45"
            style={{
              backgroundImage:
                "radial-gradient(860px 240px at 35% 70%, rgba(140,255,220,0.10) 0%, rgba(140,255,220,0) 62%), radial-gradient(900px 260px at 85% 45%, rgba(120,200,255,0.10) 0%, rgba(120,200,255,0) 64%)",
              animation: "oceanDriftB 22s linear infinite",
            }}
          />

          {/* Shore shadow */}
          <div
            className="absolute inset-x-0 bottom-0 h-[38%]"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.92) 100%)",
            }}
          />

          {/* Shore 'landing zone' glow */}
          {!opened && (
            <div
              className="absolute bottom-[10%] left-1/2 -translate-x-1/2 h-[110px] w-[min(520px,78vw)] rounded-[999px]"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,190,90,0.15) 0%, rgba(255,190,90,0.06) 45%, rgba(0,0,0,0) 74%)",
                filter: "blur(0.3px)",
              }}
            />
          )}
        </div>

        {/* Lighthouse (Return to Candy Castle) */}
        <button
          type="button"
          onClick={goCandyCastle}
          className="group absolute left-[4.5%] top-[44%] z-20 select-none outline-none"
          aria-label="Return to Candy Castle"
        >
          <div className="relative">
            <div className="h-[46px] w-[18px] rounded-t-[10px] rounded-b-[6px] bg-[#161a22] shadow-[0_10px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/10" />
            <div className="absolute left-1/2 top-[8px] h-[8px] w-[8px] -translate-x-1/2 rounded-full bg-[rgba(255,200,120,0.9)] shadow-[0_0_22px_rgba(255,200,120,0.8)]" />
            <div
              className="absolute left-1/2 top-[12px] h-[180px] w-[260px] origin-left -translate-x-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,200,120,0.22) 0%, rgba(255,200,120,0.10) 35%, rgba(255,200,120,0.0) 70%)",
                clipPath: "polygon(0 45%, 100% 0, 100% 100%)",
                animation: reducedMotion ? "none" : "beamSweep 3.8s ease-in-out infinite",
                filter: "blur(0.2px)",
              }}
            />
          </div>
          <div className="mt-2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1 text-[12px] tracking-wide text-white/85 ring-1 ring-white/10 opacity-0 transition-opacity group-hover:opacity-100">
            Return to Candy Castle
          </div>
        </button>

        {/* Sky portal (Back to Chloeverse) */}
        <button
          type="button"
          onClick={goChloeverse}
          className="group absolute right-[5%] top-[10%] z-20 select-none outline-none"
          aria-label="Back to Chloeverse"
        >
          <div
            className="relative h-[64px] w-[64px] rounded-full"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.10), 0 0 26px rgba(140,255,220,0.18), inset 0 0 34px rgba(180,120,255,0.12)",
              background:
                "radial-gradient(circle at 50% 50%, rgba(120,220,255,0.10) 0%, rgba(120,220,255,0.0) 55%), radial-gradient(circle at 50% 50%, rgba(180,120,255,0.14) 0%, rgba(180,120,255,0.0) 62%)",
              animation: reducedMotion ? "none" : "portalPulse 2.6s ease-in-out infinite",
            }}
          >
            <div
              className="absolute inset-[10px] rounded-full"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.12), 0 0 24px rgba(140,255,220,0.14)",
              }}
            />
          </div>
          <div className="mt-2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1 text-[12px] tracking-wide text-white/85 ring-1 ring-white/10 opacity-0 transition-opacity group-hover:opacity-100">
            Back to Chloeverse
          </div>
        </button>

        {/* Instruction hint */}
        {!opened && !hintDismissed && (
          <div className="absolute left-1/2 top-[16%] z-20 -translate-x-1/2 px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm text-white/85 ring-1 ring-white/10">
              <span className="inline-block h-2 w-2 rounded-full bg-[rgba(140,255,220,0.9)] shadow-[0_0_16px_rgba(140,255,220,0.6)]" />
              Drag the bottle ashore to open the letter
            </div>
          </div>
        )}

        {/* Bottle */}
        <div
          ref={bottleRef}
          className={[
            "absolute z-30 select-none touch-none",
            dragRef.current.active ? "" : opened ? "opacity-40" : "",
          ].join(" ")}
          style={{
            left: pos.x,
            top: pos.y,
            width: 132,
            height: 190,
          }}
          onPointerDown={onBottlePointerDown}
          onPointerMove={onBottlePointerMove}
          onPointerUp={onBottlePointerUp}
          onPointerCancel={onBottlePointerUp}
          role="button"
          aria-label="Message in a bottle"
          tabIndex={0}
          onKeyDown={(e) => {
            if (opened) return;
            if (e.key === "Enter" || e.key === " ") openScroll();
          }}
        >
          <div
            className={[
              "relative h-full w-full",
              dragRef.current.active ? "" : opened ? "" : reducedMotion ? "" : "will-change-transform",
            ].join(" ")}
            style={{
              animation:
                reducedMotion || dragRef.current.active || opened ? "none" : "bottleFloat 3.2s ease-in-out infinite",
            }}
          >
            {/* Glass body */}
            <div
              className="absolute inset-0 rounded-[34px] ring-1 ring-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.65)]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(140,255,220,0.14) 0%, rgba(100,180,255,0.08) 45%, rgba(255,255,255,0.03) 100%)",
                backdropFilter: "blur(1.2px)",
              }}
            />

            {/* Inner glow */}
            <div
              className="absolute inset-[10px] rounded-[26px]"
              style={{
                background:
                  "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.0) 55%), radial-gradient(circle at 60% 75%, rgba(140,255,220,0.08) 0%, rgba(140,255,220,0.0) 60%)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            />

            {/* Highlight streak */}
            <div
              className="absolute left-[16px] top-[16px] h-[150px] w-[18px] rounded-full opacity-60"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.0) 80%)",
                transform: "rotate(-10deg)",
                filter: "blur(0.2px)",
              }}
            />

            {/* Cork */}
            <div
              className="absolute left-1/2 top-[-10px] h-[26px] w-[74px] -translate-x-1/2 rounded-[14px] ring-1 ring-white/10"
              style={{
                background: "linear-gradient(180deg, rgba(70,52,30,0.95) 0%, rgba(40,30,18,0.95) 100%)",
                boxShadow: "0 10px 26px rgba(0,0,0,0.55)",
              }}
            />
            <div
              className="absolute left-1/2 top-[-4px] h-[10px] w-[58px] -translate-x-1/2 rounded-full opacity-70"
              style={{
                background: "linear-gradient(90deg, rgba(255,210,130,0.0) 0%, rgba(255,210,130,0.22) 45%, rgba(255,210,130,0.0) 100%)",
              }}
            />

            {/* Paper hint inside */}
            <div
              className="absolute bottom-[18px] left-1/2 h-[86px] w-[92px] -translate-x-1/2 rounded-[16px] ring-1 ring-black/20"
              style={{
                background: "linear-gradient(180deg, rgba(245,240,232,0.90) 0%, rgba(235,228,216,0.88) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            />
            <div className="absolute bottom-[44px] left-1/2 h-[2px] w-[64px] -translate-x-1/2 rounded-full bg-black/10" />
            <div className="absolute bottom-[34px] left-1/2 h-[2px] w-[52px] -translate-x-1/2 rounded-full bg-black/10" />

            {/* Subtle aura */}
            {!opened && (
              <div
                className="absolute -inset-[22px] rounded-[44px] opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 50% 60%, rgba(140,255,220,0.20) 0%, rgba(140,255,220,0.0) 65%)",
                  filter: "blur(2px)",
                }}
              />
            )}
          </div>

          {/* Click target note */}
          {!opened && (
            <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1 text-[12px] text-white/75 ring-1 ring-white/10">
              drag • or click to open
            </div>
          )}
        </div>

        {/* Letter / Scroll */}
        <div
          className={[
            "absolute inset-0 z-40 grid place-items-center px-4 transition-opacity duration-500",
            opened ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div
            className={[
              "relative w-[min(900px,94vw)] rounded-[28px] ring-1 ring-black/10 shadow-[0_40px_120px_rgba(0,0,0,0.7)]",
              opened ? "translate-y-0 scale-100" : "translate-y-6 scale-[0.98]",
            ].join(" ")}
            style={{
              transition: reducedMotion ? "none" : "transform 520ms cubic-bezier(.2,.9,.2,1), opacity 520ms ease",
              background:
                "linear-gradient(180deg, rgba(248,244,236,0.98) 0%, rgba(236,229,218,0.98) 100%)",
              color: "#0b0d12",
            }}
          >
            {/* Paper texture + edges */}
            <div
              className="absolute inset-0 rounded-[28px]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 42%), radial-gradient(circle at 90% 10%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.0) 46%), linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)",
                opacity: 1,
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute -left-3 top-10 h-[70%] w-6 rounded-full opacity-70"
              style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.08), rgba(0,0,0,0))" }}
            />
            <div
              className="absolute -right-3 top-10 h-[70%] w-6 rounded-full opacity-70"
              style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.08), rgba(0,0,0,0))" }}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 ring-1 ring-black/10">
                    ✦
                  </span>
                  <div>
                    <div className="text-[18px] font-semibold tracking-tight">Chloe Kang is excited to connect with you!</div>
                    <div className="mt-1 text-[13px] text-black/60">
                      Choose a channel below — the fastest way to reach Chloe is email.
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpened(false)}
                className="rounded-full bg-black/5 px-3 py-2 text-[13px] text-black/70 ring-1 ring-black/10 transition hover:bg-black/10"
                aria-label="Close letter"
              >
                Close
              </button>
            </div>

            {/* Tabs */}
            <div className="relative flex flex-wrap gap-2 px-6 py-4">
              {CONTACTS.map((c) => {
                const isActive = c.key === active;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      const sfx = ensureSfx();
                      if (sfx) beep(sfx, isActive ? 520 : 760, 55, "sine");
                      setActive(c.key);
                    }}
                    className={[
                      "group relative rounded-full px-4 py-2 text-[13px] font-medium ring-1 transition",
                      isActive
                        ? "bg-black/90 text-white ring-black/10"
                        : "bg-white/60 text-black/70 ring-black/10 hover:bg-white/80",
                    ].join(" ")}
                  >
                    <span className="relative z-10">{c.label}</span>
                    {/* tiny ribbon notch */}
                    <span
                      className="absolute right-2 top-1/2 h-[10px] w-[10px] -translate-y-1/2 rotate-45 rounded-[2px] opacity-60"
                      style={{
                        background: isActive
                          ? "rgba(255,200,120,0.85)"
                          : "rgba(140,255,220,0.55)",
                        boxShadow: "0 0 18px rgba(0,0,0,0.08)",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="relative grid gap-4 px-6 pb-6 pt-1 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] bg-white/65 p-5 ring-1 ring-black/10">
                <div className="text-[12px] font-semibold tracking-[0.18em] text-black/45">
                  {activeItem.label.toUpperCase()}
                </div>
                <div className="mt-2 text-[22px] font-semibold tracking-tight text-black/90">
                  {activeItem.value}
                </div>
                <div className="mt-2 text-[14px] leading-relaxed text-black/60">{activeItem.hint}</div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openExternal(activeItem.href)}
                    className="rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(activeItem.key === "email" ? "ugcbychloekang@gmail.com" : activeItem.href)}
                    className="rounded-full bg-black/5 px-4 py-2 text-[13px] font-medium text-black/70 ring-1 ring-black/10 transition hover:bg-black/10"
                  >
                    Copy
                  </button>
                </div>

                <div className="mt-5 rounded-[16px] bg-black/5 p-4 text-[13px] text-black/65 ring-1 ring-black/10">
                  <div className="font-medium text-black/80">Quick note</div>
                  <div className="mt-1 leading-relaxed">
                    If you’re reaching out for collabs, include your brand + timeline + budget (if any) — Chloe replies fastest with context.
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] bg-white/55 p-5 ring-1 ring-black/10">
                <div className="text-[12px] font-semibold tracking-[0.18em] text-black/45">ALL CHANNELS</div>
                <div className="mt-3 grid gap-2">
                  {CONTACTS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => {
                        const sfx = ensureSfx();
                        if (sfx) beep(sfx, 820, 55, "triangle");
                        setActive(c.key);
                      }}
                      className="flex items-center justify-between gap-3 rounded-[14px] bg-white/70 px-4 py-3 text-left ring-1 ring-black/10 transition hover:bg-white/90"
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-black/85">{c.label}</div>
                        <div className="text-[12px] text-black/55">{c.value}</div>
                      </div>
                      <div className="text-[12px] text-black/45">›</div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={goCandyCastle}
                    className="rounded-full bg-[rgba(255,200,120,0.18)] px-4 py-2 text-[13px] font-medium text-black/80 ring-1 ring-black/10 transition hover:bg-[rgba(255,200,120,0.26)]"
                  >
                    Return to Candy Castle
                  </button>
                  <button
                    type="button"
                    onClick={goChloeverse}
                    className="rounded-full bg-[rgba(140,255,220,0.16)] px-4 py-2 text-[13px] font-medium text-black/80 ring-1 ring-black/10 transition hover:bg-[rgba(140,255,220,0.24)]"
                  >
                    Back to Chloeverse
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grain */}
        <div className="grainOverlay" />
      </div>
    </div>
  );
}

export default BottleContactExperience;
`;

writeFile("src/app/contact/page.tsx", pageTsx);
writeFile("src/components/contact/BottleContactExperience.tsx", bottleExperience);
writeFile("src/components/contact/PolaroidContactHero.tsx", polaroidStub);

console.log("\\n✅ Contact page written. Start dev server: npm run dev");