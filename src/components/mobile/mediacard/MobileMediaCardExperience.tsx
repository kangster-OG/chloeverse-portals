"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { MobileRouteLink } from "@/components/mobile/shared/MobileRouteLink";
import {
  MEDIACARD_AUDIENCE,
  MEDIACARD_COLLABS,
  MEDIACARD_METRICS,
  MEDIACARD_SERVICES,
} from "@/lib/mobile-content";

const ACCENT = "#f4eee6";
const CUBE_SIZE = 13.2;
const HALF_DEPTH = `${CUBE_SIZE / 2}rem`;

type FaceId = "metrics" | "markets" | "collabs" | "terms";

type CubeFace = {
  id: FaceId;
  label: string;
  detailTitle: string;
  eyebrow: string;
  transform: string;
};

const SIDE_FACES: CubeFace[] = [
  {
    id: "metrics",
    label: "metrics",
    detailTitle: "Metrics",
    eyebrow: "audience scale",
    transform: `translateZ(${HALF_DEPTH})`,
  },
  {
    id: "markets",
    label: "markets",
    detailTitle: "Markets",
    eyebrow: "audience territories",
    transform: `rotateY(90deg) translateZ(${HALF_DEPTH})`,
  },
  {
    id: "collabs",
    label: "collabs",
    detailTitle: "Collabs",
    eyebrow: "selected names",
    transform: `rotateY(180deg) translateZ(${HALF_DEPTH})`,
  },
  {
    id: "terms",
    label: "terms",
    detailTitle: "Terms",
    eyebrow: "partnership details",
    transform: `rotateY(-90deg) translateZ(${HALF_DEPTH})`,
  },
] as const;

const TOP_FACE_STYLE = {
  transform: `rotateX(90deg) translateZ(${HALF_DEPTH})`,
} as const;

const BOTTOM_FACE_STYLE = {
  transform: `rotateX(-90deg) translateZ(${HALF_DEPTH})`,
} as const;

const MARKET_LAYOUT = [
  { left: "10%", top: "16%" },
  { left: "54%", top: "12%" },
  { left: "14%", top: "60%" },
  { left: "56%", top: "56%" },
] as const;

function brandLogoPath(brand: string) {
  return `/mediacard/logos/${brand.toLowerCase().replace(/\s+/g, "")}.png`;
}

export function MobileMediaCardExperience() {
  const reducedMotion = useReducedMotion();
  const rotationRef = useRef(0);
  const [rotationY, setRotationY] = useState(0);
  const [activeFaceId, setActiveFaceId] = useState<FaceId | null>(null);

  useEffect(() => {
    if (reducedMotion || activeFaceId) return;

    let previousTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      rotationRef.current = (rotationRef.current + dt * 12) % 360;
      setRotationY(rotationRef.current);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [activeFaceId, reducedMotion]);

  const activeFace = useMemo(
    () => SIDE_FACES.find((face) => face.id === activeFaceId) ?? null,
    [activeFaceId],
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (activeFaceId) return;

    const shouldRotate = Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 360;
    if (!shouldRotate) return;

    rotationRef.current += info.offset.x < 0 || info.velocity.x < 0 ? -90 : 90;
    setRotationY(rotationRef.current);
  };

  const pagePadding = {
    paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.95rem)",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5.1rem)",
  } as CSSProperties;

  return (
    <main className="chv-mobile-root relative min-h-[100svh] overflow-hidden bg-[#020202] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,#020202_54%,#010101_100%)]" />
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_68%)] blur-3xl" />
        <div className="absolute left-1/2 top-[30%] h-[16rem] w-[16rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_72%)] blur-[90px]" />
        <div className="chv-vignette absolute inset-0 opacity-80" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4" style={{ paddingTop: pagePadding.paddingTop }}>
        <div className="flex items-start justify-between gap-4">
          <MobileRouteLink
            href="/"
            accent={ACCENT}
            label="Chloeverse"
            aria-label="Return to the Chloeverse"
            className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] px-3.5 py-2 text-white/84 backdrop-blur-xl"
          >
            <span className="inline-flex items-center gap-3">
              <span className="relative block h-7 w-7 overflow-hidden rounded-full border border-white/18">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.96),rgba(255,255,255,0.14)_54%,transparent_76%)]" />
              </span>
              <span className="chv-mobile-body text-[0.7rem] italic tracking-[0.02em] text-white/84">back to chloeverse</span>
            </span>
          </MobileRouteLink>

          <div className="max-w-[11rem] rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] px-4 py-3 text-right shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <p className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.34em] text-white/42">white cube</p>
            <p className="mt-2 chv-mobile-display text-[1.52rem] leading-[0.9] tracking-[-0.06em] text-[#f8f5f1]">
              mediacard
            </p>
            <p className="mt-2 text-[0.74rem] leading-6 text-white/54">swipe the cube, tap a face.</p>
          </div>
        </div>
      </div>

      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-4" style={pagePadding}>
        <motion.div
          drag={reducedMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={handleDragEnd}
          whileDrag={activeFaceId ? undefined : { scale: 1.02 }}
          className="relative h-[26rem] w-full max-w-[23rem] touch-none"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
            <div className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-2 backdrop-blur-xl">
              <p className="chv-mobile-body text-[0.78rem] italic tracking-[0.02em] text-white/60">
                Four stamped sides. One quiet object in empty space.
              </p>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center [perspective:1800px]">
            <div className="relative h-[13.2rem] w-[13.2rem] [transform-style:preserve-3d] [transform:rotateX(-28deg)_rotateZ(45deg)]">
              <motion.div
                animate={{ rotateY: rotationY }}
                transition={
                  activeFaceId
                    ? { duration: 0.22 }
                    : reducedMotion
                      ? { duration: 0.35 }
                      : { duration: 0.12, ease: "linear" }
                }
                className="relative h-full w-full [transform-style:preserve-3d]"
              >
                {SIDE_FACES.map((face) => (
                  <button
                    key={face.id}
                    type="button"
                    onClick={() => setActiveFaceId(face.id)}
                    className="absolute inset-0 flex items-center justify-center overflow-hidden border border-[#d8d2cb] bg-[linear-gradient(180deg,#ffffff_0%,#f1ece5_64%,#e1dbd3_100%)] text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.84),0_10px_30px_rgba(0,0,0,0.06)]"
                    style={{
                      transform: face.transform,
                      backfaceVisibility: "hidden",
                    }}
                    aria-label={`Open ${face.detailTitle}`}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0)_36%,rgba(195,189,182,0.16)_100%)]" />
                    <span className="pointer-events-none absolute inset-[8%] border border-black/6" />
                    <span className="pointer-events-none absolute inset-x-[14%] top-[22%] h-px bg-black/8" />
                    <span className="relative flex flex-col items-center justify-center px-4">
                      <span className="chv-mobile-mono text-[0.52rem] uppercase tracking-[0.34em] text-black/34">
                        stamp
                      </span>
                      <span className="mt-3 chv-mobile-display text-[1.55rem] leading-[0.92] tracking-[-0.06em] text-black/68">
                        {face.label}
                      </span>
                    </span>
                  </button>
                ))}

                <div
                  className="absolute inset-0 border border-[#d8d2cb] bg-[linear-gradient(180deg,#f7f3ed_0%,#eee8e1_100%)]"
                  style={{ ...TOP_FACE_STYLE, backfaceVisibility: "hidden" }}
                />
                <div
                  className="absolute inset-0 border border-[#d8d2cb] bg-[linear-gradient(180deg,#d6d1ca_0%,#c3beb7_100%)]"
                  style={{ ...BOTTOM_FACE_STYLE, backfaceVisibility: "hidden" }}
                />
              </motion.div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4">
            <div className="max-w-[10rem]">
              <p className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.32em] text-white/36">interaction</p>
              <p className="mt-2 text-[0.82rem] leading-6 text-white/54">
                Each side is stamped once. Tap a face and it opens cleanly.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.05)] px-3 py-2 backdrop-blur-xl">
              {SIDE_FACES.map((face) => (
                <span
                  key={face.id}
                  className={`block h-2.5 rounded-full ${activeFaceId === face.id ? "w-8 bg-white/76" : "w-2.5 bg-white/24"}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {activeFace ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),rgba(0,0,0,0.72)_44%,rgba(0,0,0,0.9)_100%)] px-4"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.9rem)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.2rem)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[22rem] overflow-hidden rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f6f2eb_100%)] px-5 py-5 text-black shadow-[0_30px_90px_rgba(0,0,0,0.3)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0)_38%,rgba(210,204,196,0.18)_100%)]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 border-b border-black/8 pb-4">
                  <div>
                    <p className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.34em] text-black/34">
                      {activeFace.eyebrow}
                    </p>
                    <h2 className="mt-3 chv-mobile-display text-[2.5rem] leading-[0.9] tracking-[-0.07em] text-black/84">
                      {activeFace.detailTitle}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFaceId(null)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-black/62"
                    aria-label={`Close ${activeFace.detailTitle}`}
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5">
                  {activeFace.id === "metrics" ? <MetricsCard /> : null}
                  {activeFace.id === "markets" ? <MarketsCard /> : null}
                  {activeFace.id === "collabs" ? <CollabsCard /> : null}
                  {activeFace.id === "terms" ? <TermsCard /> : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function MetricsCard() {
  const [instagram, tiktok, views, engagement] = MEDIACARD_METRICS;

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricTile metric={instagram} large />
      <MetricTile metric={tiktok} />
      <MetricTile metric={views} full />
      <MetricTile metric={engagement} full />
    </div>
  );
}

function MetricTile({
  metric,
  large,
  full,
}: {
  metric: (typeof MEDIACARD_METRICS)[number];
  large?: boolean;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.4rem] border border-black/8 bg-[rgba(255,255,255,0.65)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ${
        large ? "col-span-2" : ""
      } ${full ? "col-span-2" : ""}`}
    >
      <p className="chv-mobile-mono text-[0.5rem] uppercase tracking-[0.3em] text-black/34">{metric.label}</p>
      <p
        className={`mt-3 chv-mobile-display tracking-[-0.06em] text-black/84 ${
          large ? "text-[2.9rem] leading-[0.86]" : "text-[2rem] leading-[0.9]"
        }`}
      >
        {metric.value}
      </p>
    </div>
  );
}

function MarketsCard() {
  return (
    <div className="relative min-h-[15rem] overflow-hidden rounded-[1.5rem] border border-black/8 bg-[rgba(255,255,255,0.68)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="absolute left-1/2 top-[14%] bottom-[12%] w-px -translate-x-1/2 bg-black/8" />
      {MEDIACARD_AUDIENCE.map((market, index) => (
        <div
          key={market}
          className="absolute"
          style={MARKET_LAYOUT[index] as CSSProperties}
        >
          <div className="flex items-center gap-2">
            <span className="block h-2.5 w-2.5 rounded-full bg-black/60" />
            <div className="rounded-full border border-black/8 bg-white/72 px-3 py-2">
              <p className="chv-mobile-display text-[1.08rem] leading-none tracking-[-0.05em] text-black/78">{market}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CollabsCard() {
  return (
    <div className="grid gap-3">
      {MEDIACARD_COLLABS.map((brand) => (
        <div
          key={brand}
          className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-black/8 bg-[rgba(255,255,255,0.68)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        >
          <div>
            <p className="chv-mobile-mono text-[0.48rem] uppercase tracking-[0.28em] text-black/32">selected collaboration</p>
            <p className="mt-2 chv-mobile-display text-[1.42rem] leading-[0.92] tracking-[-0.05em] text-black/78">{brand}</p>
          </div>
          <Image
            src={brandLogoPath(brand)}
            alt={brand}
            width={100}
            height={38}
            sizes="100px"
            className="h-8 w-auto object-contain opacity-[0.88]"
          />
        </div>
      ))}
    </div>
  );
}

function TermsCard() {
  return (
    <div className="space-y-4">
      <section className="rounded-[1.4rem] border border-black/8 bg-[rgba(255,255,255,0.68)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <p className="chv-mobile-mono text-[0.5rem] uppercase tracking-[0.3em] text-black/34">brand partnerships</p>
        <div className="mt-4 space-y-3">
          {MEDIACARD_SERVICES.brandPartnerships.map((item, index) => (
            <div key={item} className="flex gap-3">
              <span className="chv-mobile-mono pt-[1px] text-[0.56rem] uppercase tracking-[0.2em] text-black/28">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-[0.86rem] leading-6 text-black/70">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-black/8 bg-[rgba(255,255,255,0.68)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <p className="chv-mobile-mono text-[0.5rem] uppercase tracking-[0.3em] text-black/34">dining partnerships</p>
        <div className="mt-4 space-y-3">
          {MEDIACARD_SERVICES.diningPartnerships.map((item) => (
            <p key={item} className="text-[0.86rem] leading-6 text-black/70">
              {item}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
