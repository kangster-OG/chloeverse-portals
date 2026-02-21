/* tools/write-contact-postoffice.js
   Writes the new Contact page: Enchanted Post Office
   Run: node tools\write-contact-postoffice.js
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

const pageTsx = `import { EnchantedPostOfficeContactExperience } from "@/components/contact/EnchantedPostOfficeContactExperience";

export default function ContactPage() {
  return <EnchantedPostOfficeContactExperience />;
}
`;

const polaroidStub = `"use client";

export function PolaroidContactHero() {
  return null;
}

export default PolaroidContactHero;
`;

const experienceTsx = `"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ChannelKey = "email" | "linkedin" | "instagram" | "tiktok" | "x";

type Channel = {
  key: ChannelKey;
  label: string;
  subtitle: string;
  display: string;
  href: string;
  copyValue: string;
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
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);
  return reduced;
}

// ---- Minimal WebAudio SFX (fails silently if blocked) ----
type Sfx = { ctx: AudioContext; master: GainNode };

function createSfx(): Sfx | null {
  try {
    const AC =
      window.AudioContext ||
      (window.webkitAudioContext as unknown as typeof AudioContext | undefined);
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.06;
    master.connect(ctx.destination);
    return { ctx, master };
  } catch {
    return null;
  }
}

function blip(sfx: Sfx, freq: number, durMs: number, type: OscillatorType = "sine") {
  const { ctx, master } = sfx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;

  const now = ctx.currentTime;
  const dur = Math.max(0.01, durMs / 1000);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.75, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  o.connect(g);
  g.connect(master);

  o.start(now);
  o.stop(now + dur + 0.02);
}

function paperWhoosh(sfx: Sfx, durMs: number) {
  const { ctx, master } = sfx;
  const dur = Math.max(0.05, durMs / 1000);
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.25;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1100;
  filter.Q.value = 0.6;

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

function waxPop(sfx: Sfx) {
  blip(sfx, 320, 70, "triangle");
  blip(sfx, 560, 60, "sine");
  blip(sfx, 240, 110, "square");
}

const GLOBAL_CSS = [
  "@keyframes floatA { 0%,100% { transform: translateY(0px) rotate(-1deg); } 50% { transform: translateY(-12px) rotate(1deg); } }",
  "@keyframes floatB { 0%,100% { transform: translateY(0px) rotate(1deg); } 50% { transform: translateY(-10px) rotate(-1deg); } }",
  "@keyframes glowPulse { 0%,100% { opacity: .55; } 50% { opacity: .95; } }",
  "@keyframes sealPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }",
  "@keyframes grainMove { 0% { transform: translate(0,0); } 100% { transform: translate(-6%, 4%); } }",
  ".grainOverlay{pointer-events:none;position:absolute;inset:-20%;opacity:0.12;background-image:url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\\");background-size:220px 220px;mix-blend-mode:overlay;animation:grainMove 6s steps(2) infinite;}",
].join("\\n");

export function EnchantedPostOfficeContactExperience() {
  const reducedMotion = usePrefersReducedMotion();

  const CHANNELS: Channel[] = useMemo(
    () => [
      {
        key: "email",
        label: "Email",
        subtitle: "fastest reply",
        display: "ugcbychloekang@gmail.com",
        href: "mailto:ugcbychloekang@gmail.com",
        copyValue: "ugcbychloekang@gmail.com",
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        subtitle: "professional",
        display: "Chloe Kang",
        href: "https://www.linkedin.com/in/chloe-kang-234292250",
        copyValue: "https://www.linkedin.com/in/chloe-kang-234292250",
      },
      {
        key: "instagram",
        label: "Instagram",
        subtitle: "daily",
        display: "@imchloekang",
        href: "https://www.instagram.com/imchloekang/",
        copyValue: "https://www.instagram.com/imchloekang/",
      },
      {
        key: "tiktok",
        label: "TikTok",
        subtitle: "UGC",
        display: "@imchloekang",
        href: "https://www.tiktok.com/@imchloekang",
        copyValue: "https://www.tiktok.com/@imchloekang",
      },
      {
        key: "x",
        label: "Twitter/X",
        subtitle: "updates",
        display: "@KangChloe",
        href: "https://x.com/KangChloe",
        copyValue: "https://x.com/KangChloe",
      },
    ],
    []
  );

  const [openLetter, setOpenLetter] = useState(false);
  const [active, setActive] = useState<ChannelKey>("email");

  // Quill cursor + ink trail (optional polish)
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const trailRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const [trailTick, setTrailTick] = useState(0);

  // SFX (created after first interaction)
  const sfxRef = useRef<Sfx | null>(null);
  const ensureSfx = () => {
    if (typeof window === "undefined") return null;
    if (sfxRef.current) return sfxRef.current;
    const sfx = createSfx();
    sfxRef.current = sfx;
    return sfx;
  };

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
      const now = performance.now();
      const next = trailRef.current.slice(-18);
      next.push({ x: e.clientX, y: e.clientY, t: now });
      trailRef.current = next;
      setTrailTick((v) => (v + 1) % 100000);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  const trail = useMemo(() => {
    void trailTick;
    const now = performance.now();
    return trailRef.current
      .map((p, idx) => ({ ...p, age: now - p.t, idx }))
      .filter((p) => p.age < 650);
  }, [trailTick]);

  const goCandyCastle = () => {
    const sfx = ensureSfx();
    if (sfx) {
      paperWhoosh(sfx, 180);
      blip(sfx, 680, 80, "triangle");
    }
    window.location.href = "https://imchloekang.com";
  };

  const goChloeverse = () => {
    const sfx = ensureSfx();
    if (sfx) {
      paperWhoosh(sfx, 180);
      blip(sfx, 620, 90, "triangle");
    }
    window.location.href = "https://chloeverse.io";
  };

  const open = () => {
    const sfx = ensureSfx();
    if (sfx) {
      waxPop(sfx);
      paperWhoosh(sfx, 240);
    }
    setOpenLetter(true);
  };

  const close = () => {
    const sfx = ensureSfx();
    if (sfx) blip(sfx, 420, 70, "triangle");
    setOpenLetter(false);
  };

  const openExternal = (href: string) => {
    const sfx = ensureSfx();
    if (sfx) blip(sfx, 860, 55, "sine");
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const copy = async (text: string) => {
    const sfx = ensureSfx();
    if (sfx) blip(sfx, 980, 55, "square");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const activeItem = CHANNELS.find((c) => c.key === active) ?? CHANNELS[0];

  return (
    <div
      className={
        reducedMotion
          ? "fixed inset-0 overflow-hidden bg-[#05060a] text-white"
          : "fixed inset-0 overflow-hidden bg-[#05060a] text-white cursor-none"
      }
    >
      <style jsx global>{GLOBAL_CSS}</style>

      {/* Backdrop: premium night + candle amber + mint glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 700px at 35% 35%, rgba(255,200,120,0.12) 0%, rgba(255,200,120,0.0) 58%), radial-gradient(700px 500px at 70% 35%, rgba(140,255,220,0.08) 0%, rgba(140,255,220,0.0) 62%), linear-gradient(180deg, #05060a 0%, #060711 45%, #03040a 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 560px at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.68) 70%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 px-6 pt-6">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/5 ring-1 ring-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.5)]" />
            <div>
              <div className="text-[14px] font-semibold tracking-wide text-white/85">
                Enchanted Post Office
              </div>
              <div className="text-[12px] text-white/55">A letter for Chloe — sealed & waiting.</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goCandyCastle}
              className="rounded-full bg-white/5 px-4 py-2 text-[12px] font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              Return to Candy Castle
            </button>
            <button
              type="button"
              onClick={goChloeverse}
              className="rounded-full bg-white/5 px-4 py-2 text-[12px] font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              Back to Chloeverse
            </button>
          </div>
        </div>
      </div>

      {/* Desk base */}
      <div className="absolute inset-x-0 bottom-0 h-[34%]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[70%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(40,26,18,0.0) 0%, rgba(40,26,18,0.35) 18%, rgba(20,14,10,0.92) 100%)",
          }}
        />
      </div>

      {/* Mail slot (visual only) */}
      <div className="absolute bottom-[18%] left-1/2 z-[5] w-[min(680px,92vw)] -translate-x-1/2">
        <div className="relative mx-auto h-[84px] rounded-[22px] bg-[#0f1118]/85 ring-1 ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          <div className="absolute left-6 top-6 h-[34px] w-[180px] rounded-full bg-black/35 ring-1 ring-white/10" />
          <div className="absolute left-7 top-[31px] h-[6px] w-[168px] rounded-full bg-white/10" />
          <div className="absolute right-6 top-6 h-[34px] w-[120px] rounded-full bg-black/35 ring-1 ring-white/10" />
          <div className="absolute right-8 top-[31px] h-[6px] w-[96px] rounded-full bg-white/10" />
          {!openLetter && (
            <div
              className="absolute left-1/2 top-[-18px] h-[22px] w-[220px] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,200,120,0.22) 0%, rgba(255,200,120,0.0) 70%)",
                filter: "blur(0.2px)",
                animation: reducedMotion ? "none" : "glowPulse 2.8s ease-in-out infinite",
              }}
            />
          )}
        </div>

        <div className="mt-3 text-center text-[12px] text-white/55">
          Click the wax seal to open Chloe’s letter.
        </div>
      </div>

      {/* Floating envelopes */}
      <div className="absolute inset-0">
        <div
          className="absolute left-[12%] top-[24%] h-[120px] w-[180px] rounded-[18px] ring-1 ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(248,244,236,0.92) 0%, rgba(234,228,216,0.92) 100%)",
            animation: reducedMotion ? "none" : "floatA 4.2s ease-in-out infinite",
          }}
        >
          <div
            className="absolute inset-0 rounded-[18px] opacity-60"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 52%)",
            }}
          />
          <div className="absolute left-4 top-4 h-[10px] w-[90px] rounded-full bg-black/10" />
          <div className="absolute left-4 top-8 h-[10px] w-[70px] rounded-full bg-black/10" />
          <div className="absolute right-4 bottom-4 h-[22px] w-[22px] rounded-full bg-[rgba(140,255,220,0.25)] ring-1 ring-black/10" />
        </div>

        <div
          className="absolute right-[10%] top-[28%] h-[110px] w-[170px] rounded-[18px] ring-1 ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(248,244,236,0.90) 0%, rgba(234,228,216,0.90) 100%)",
            animation: reducedMotion ? "none" : "floatB 4.6s ease-in-out infinite",
          }}
        >
          <div
            className="absolute inset-0 rounded-[18px] opacity-60"
            style={{
              background:
                "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.0) 52%)",
            }}
          />
          <div className="absolute left-4 top-4 h-[10px] w-[92px] rounded-full bg-black/10" />
          <div className="absolute left-4 top-8 h-[10px] w-[58px] rounded-full bg-black/10" />
          <div className="absolute right-4 bottom-4 h-[22px] w-[22px] rounded-full bg-[rgba(180,120,255,0.22)] ring-1 ring-black/10" />
        </div>

        {/* Hero envelope */}
        <div className="absolute left-1/2 top-[36%] z-20 w-[min(560px,92vw)] -translate-x-1/2">
          <div
            className="relative mx-auto h-[220px] w-full rounded-[26px] ring-1 ring-white/10 shadow-[0_50px_140px_rgba(0,0,0,0.75)]"
            style={{
              background:
                "linear-gradient(180deg, rgba(248,244,236,0.96) 0%, rgba(234,228,216,0.96) 100%)",
              transform: "rotate(-0.5deg)",
            }}
          >
            <div
              className="absolute left-1/2 top-0 h-[150px] w-[86%] -translate-x-1/2"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 82%)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(0,0,0,0.06) 100%)",
              }}
            />

            <div className="absolute left-7 top-[36px] text-[12px] font-semibold tracking-[0.18em] text-black/45">
              TO:
            </div>
            <div className="absolute left-7 top-[56px] text-[20px] font-semibold tracking-tight text-black/85">
              You
            </div>

            <div className="absolute right-7 top-[40px] text-[12px] font-semibold tracking-[0.18em] text-black/45">
              FROM:
            </div>
            <div className="absolute right-7 top-[58px] text-[16px] font-semibold tracking-tight text-black/80">
              Chloe Kang
            </div>

            <button
              type="button"
              onClick={open}
              className="group absolute left-1/2 top-[126px] -translate-x-1/2 rounded-full outline-none"
              aria-label="Open the letter"
            >
              <div
                className="relative h-[78px] w-[78px] rounded-full ring-1 ring-black/20 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,220,150,0.55) 0%, rgba(255,220,150,0.0) 38%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.0) 55%), linear-gradient(180deg, rgba(140,20,30,0.98) 0%, rgba(90,10,18,0.98) 100%)",
                  animation: reducedMotion ? "none" : "sealPulse 2.4s ease-in-out infinite",
                }}
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-[12px] font-semibold tracking-[0.22em] text-white/90 drop-shadow">
                  CONTACT
                </div>
              </div>
              <div className="mt-3 text-center text-[12px] font-medium text-black/55">
                click to unseal
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Letter overlay */}
      <div
        className={[
          "absolute inset-0 z-40 grid place-items-center px-4 transition-opacity duration-500",
          openLetter ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div
          className={[
            "relative w-[min(980px,94vw)] rounded-[30px] ring-1 ring-black/10 shadow-[0_60px_160px_rgba(0,0,0,0.8)]",
            openLetter ? "translate-y-0 scale-100" : "translate-y-6 scale-[0.98]",
          ].join(" ")}
          style={{
            transition: reducedMotion ? "none" : "transform 520ms cubic-bezier(.2,.9,.2,1), opacity 520ms ease",
            background:
              "linear-gradient(180deg, rgba(248,244,236,0.98) 0%, rgba(236,229,218,0.98) 100%)",
            color: "#0b0d12",
          }}
        >
          <div
            className="absolute inset-0 rounded-[30px] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 44%), radial-gradient(circle at 88% 14%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.0) 54%), linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)",
            }}
          />

          <div className="relative flex items-start justify-between gap-4 border-b border-black/10 px-7 py-6">
            <div>
              <div className="text-[20px] font-semibold tracking-tight">
                Chloe Kang is excited to connect with you!
              </div>
              <div className="mt-1 text-[13px] text-black/60">
                Pick a stamp — open the link, or copy it.
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-black/5 px-4 py-2 text-[13px] font-medium text-black/70 ring-1 ring-black/10 transition hover:bg-black/10"
            >
              Close
            </button>
          </div>

          <div className="relative grid gap-4 px-7 py-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[22px] bg-white/65 p-4 ring-1 ring-black/10">
              <div className="mb-3 text-[12px] font-semibold tracking-[0.18em] text-black/45">
                STAMPS
              </div>

              <div className="grid gap-2">
                {CHANNELS.map((c) => {
                  const isActive = c.key === active;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => {
                        const sfx = ensureSfx();
                        if (sfx) blip(sfx, isActive ? 520 : 760, 55, "sine");
                        setActive(c.key);
                      }}
                      className={[
                        "relative overflow-hidden rounded-[18px] px-4 py-3 text-left ring-1 transition",
                        isActive
                          ? "bg-black text-white ring-black/10"
                          : "bg-white/70 text-black/80 ring-black/10 hover:bg-white/90",
                      ].join(" ")}
                    >
                      <div
                        className="absolute inset-y-0 left-0 w-[10px] opacity-40"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 14px, rgba(0,0,0,0.12) 0 3px, rgba(0,0,0,0) 3px 100%)",
                          backgroundSize: "10px 18px",
                        }}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[13px] font-semibold tracking-wide">{c.label}</div>
                          <div className={isActive ? "text-[12px] text-white/70" : "text-[12px] text-black/55"}>
                            {c.subtitle}
                          </div>
                        </div>
                        <div className={isActive ? "text-[12px] text-white/70" : "text-[12px] text-black/45"}>›</div>
                      </div>
                    </button>
                  );
                })}
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

            <div className="rounded-[22px] bg-white/55 p-6 ring-1 ring-black/10">
              <div className="text-[12px] font-semibold tracking-[0.18em] text-black/45">
                {activeItem.label.toUpperCase()}
              </div>
              <div className="mt-2 text-[22px] font-semibold tracking-tight text-black/90">
                {activeItem.display}
              </div>
              <div className="mt-2 text-[14px] leading-relaxed text-black/60">
                Tap Open to connect, or Copy to save it.
              </div>

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
                  onClick={() => copy(activeItem.copyValue)}
                  className="rounded-full bg-black/5 px-4 py-2 text-[13px] font-medium text-black/70 ring-1 ring-black/10 transition hover:bg-black/10"
                >
                  Copy
                </button>
              </div>

              <div className="mt-6 rounded-[18px] bg-black/5 p-4 text-[13px] text-black/65 ring-1 ring-black/10">
                <div className="font-semibold text-black/80">Collab note</div>
                <div className="mt-1 leading-relaxed">
                  If you’re reaching out for UGC/collabs, include your brand, timeline, deliverables, and budget (if any).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quill + ink trail */}
      {!reducedMotion && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[60]">
            {trail.map((p) => {
              const alpha = clamp(1 - p.age / 650, 0, 1);
              const size = clamp(9 - p.age / 120, 2, 9);
              return (
                <div
                  key={p.t + "-" + p.idx}
                  className="absolute rounded-full"
                  style={{
                    left: p.x - size / 2,
                    top: p.y - size / 2,
                    width: size,
                    height: size,
                    opacity: alpha * 0.25,
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(140,255,220,0.65) 0%, rgba(180,120,255,0.15) 45%, rgba(0,0,0,0) 70%)",
                    filter: "blur(0.2px)",
                  }}
                />
              );
            })}
          </div>

          <div className="pointer-events-none absolute z-[70]" style={{ left: mouse.x + 10, top: mouse.y + 10 }}>
            <div className="relative h-[22px] w-[22px] rotate-[-18deg]" style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.55))" }}>
              <div
                className="absolute inset-0 rounded-[6px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
              <div
                className="absolute left-[6px] top-[5px] h-[12px] w-[10px] rounded-[999px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,200,120,0.85) 0%, rgba(255,200,120,0.20) 100%)",
                  boxShadow: "0 0 18px rgba(255,200,120,0.28)",
                }}
              />
            </div>
          </div>
        </>
      )}

      <div className="grainOverlay" />
    </div>
  );
}

export default EnchantedPostOfficeContactExperience;
`;

writeFile("src/app/contact/page.tsx", pageTsx);
writeFile("src/components/contact/EnchantedPostOfficeContactExperience.tsx", experienceTsx);
writeFile("src/components/contact/PolaroidContactHero.tsx", polaroidStub);

console.log("\\n✅ Enchanted Post Office contact page written. Start: npm run dev");
`;

writeFile("src/app/contact/page.tsx", pageTsx);
writeFile("src/components/contact/EnchantedPostOfficeContactExperience.tsx", experienceTsx);
writeFile("src/components/contact/PolaroidContactHero.tsx", polaroidStub);

console.log("\\n✅ Enchanted Post Office contact page written. Start: npm run dev");