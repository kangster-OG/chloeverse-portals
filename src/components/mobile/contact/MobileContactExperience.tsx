"use client";

import Link from "next/link";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { useMemo, useState, type CSSProperties } from "react";

import { MobileReturnSigil } from "@/components/mobile/shared/MobileRouteFrame";
import { useContactJourney } from "@/hooks/useContactJourney";
import { CONTACT_DETAILS, CONTACT_JOURNEY_STOPS, type ContactJourneyStop } from "@/lib/mobile-content";

const ACCENT = "#ffcfac";
const STAGE_TOP = "-70svh";
const STAGE_HEIGHT = "180svh";
const CARD_WORLD_TOP = 108;
const STAR_LAYER_NEAR = [
  { left: "10%", top: "14%", size: "sm", delay: "0.1s" },
  { left: "22%", top: "24%", size: "md", delay: "0.6s" },
  { left: "36%", top: "10%", size: "sm", delay: "1.1s" },
  { left: "54%", top: "19%", size: "lg", delay: "0.3s" },
  { left: "68%", top: "8%", size: "sm", delay: "1.6s" },
  { left: "84%", top: "18%", size: "md", delay: "0.8s" },
  { left: "17%", top: "42%", size: "lg", delay: "1.9s" },
  { left: "44%", top: "34%", size: "sm", delay: "1.2s" },
  { left: "74%", top: "40%", size: "md", delay: "0.4s" },
  { left: "90%", top: "30%", size: "sm", delay: "1.4s" },
  { left: "12%", top: "66%", size: "md", delay: "0.2s" },
  { left: "28%", top: "76%", size: "sm", delay: "0.7s" },
  { left: "58%", top: "72%", size: "lg", delay: "1.5s" },
  { left: "80%", top: "62%", size: "sm", delay: "0.9s" },
  { left: "92%", top: "82%", size: "md", delay: "1.8s" },
] as const;
const STAR_LAYER_FAR = [
  { left: "6%", top: "8%", size: "sm", delay: "1.2s" },
  { left: "26%", top: "16%", size: "sm", delay: "0.5s" },
  { left: "40%", top: "28%", size: "md", delay: "1.7s" },
  { left: "63%", top: "24%", size: "sm", delay: "0.2s" },
  { left: "76%", top: "12%", size: "sm", delay: "1s" },
  { left: "88%", top: "26%", size: "md", delay: "1.4s" },
  { left: "8%", top: "52%", size: "sm", delay: "0.4s" },
  { left: "34%", top: "58%", size: "md", delay: "1.3s" },
  { left: "48%", top: "46%", size: "sm", delay: "0.9s" },
  { left: "69%", top: "54%", size: "sm", delay: "1.6s" },
  { left: "84%", top: "66%", size: "sm", delay: "0.7s" },
  { left: "18%", top: "88%", size: "md", delay: "1.8s" },
  { left: "46%", top: "82%", size: "sm", delay: "0.1s" },
  { left: "70%", top: "90%", size: "md", delay: "1.1s" },
] as const;

export function MobileContactExperience() {
  const [copied, setCopied] = useState(false);
  const {
    activeImpactId,
    finalImpactActive,
    isPlaying,
    journeyState,
    prefersReducedMotion,
    progress,
    replayJourney,
    revealedStopIds,
    skipJourney,
  } = useContactJourney();

  const revealedStopSet = useMemo(() => new Set(revealedStopIds), [revealedStopIds]);
  const stageShift = useTransform(progress, [0, 1], ["0svh", "50svh"]);
  const cardY = useTransform(progress, [0, 0.08, 1], ["8px", "0px", "-10px"]);
  const cardScale = useTransform(progress, [0, 0.08, 1], [0.97, 1, 0.94]);
  const rocketX = useTransform(
    progress,
    [0, 0.12, 0.24, 0.42, 0.6, 0.78, 0.96, 1],
    ["48vw", "54vw", "68vw", "30vw", "70vw", "36vw", "50vw", "50vw"],
  );
  const rocketY = useTransform(
    progress,
    [0, 0.12, 0.24, 0.42, 0.6, 0.78, 0.96, 1],
    ["64svh", "54svh", "22svh", "18svh", "14svh", "11svh", "7svh", "-10svh"],
  );
  const rocketRotate = useTransform(
    progress,
    [0, 0.12, 0.24, 0.42, 0.6, 0.78, 0.96, 1],
    ["-10deg", "-3deg", "18deg", "-16deg", "18deg", "-12deg", "0deg", "0deg"],
  );
  const rocketOpacity = useTransform(progress, [0, 0.95, 0.985, 1], [1, 1, 0, 0]);
  const rocketScale = useTransform(progress, [0, 0.22, 1], [0.92, 1, 0.96]);
  const starsNearY = useTransform(progress, [0, 1], ["0svh", "-18svh"]);
  const starsFarY = useTransform(progress, [0, 1], ["0svh", "-10svh"]);
  const nebulaY = useTransform(progress, [0, 1], ["0svh", "-6svh"]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_DETAILS.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      window.location.href = `mailto:${CONTACT_DETAILS.email}`;
    }
  };

  return (
    <main className="chv-mobile-root relative min-h-[100svh] overflow-hidden bg-[#04030a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,222,182,0.1),transparent_26%),linear-gradient(180deg,#070611_0%,#03030a_44%,#020207_100%)]" />
      <motion.div className="pointer-events-none absolute inset-0" style={{ y: nebulaY }}>
        <div className="chv-contact-nebula absolute inset-0" />
        <div className="chv-contact-vignette absolute inset-0" />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ y: starsFarY }}>
        <PixelStarField stars={STAR_LAYER_FAR} layer="far" />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ y: starsNearY }}>
        <PixelStarField stars={STAR_LAYER_NEAR} layer="near" />
      </motion.div>
      <div className="chv-mobile-grain pointer-events-none absolute inset-0 z-10 opacity-40" />

      <MobileReturnSigil accent={ACCENT} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 px-5 pt-[calc(env(safe-area-inset-top,0px)+1.05rem)]">
        <div className="mx-auto max-w-[14rem] text-center">
          <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.34em] text-white/46">open channel</p>
          <h1 className="chv-contact-title mt-3 text-[3.4rem] leading-[0.82] tracking-[-0.09em] text-[#fff3dd]">
            contact
          </h1>
          <p className="mx-auto mt-2 max-w-[13rem] text-[0.82rem] leading-6 text-white/54">
            Launch sequence toward the social planets.
          </p>
        </div>
      </div>

      <JourneyControls
        isPlaying={isPlaying}
        journeyState={journeyState}
        prefersReducedMotion={prefersReducedMotion}
        onReplay={replayJourney}
        onSkip={skipJourney}
      />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-x-0 z-20"
          style={{
            top: STAGE_TOP,
            height: STAGE_HEIGHT,
            y: stageShift,
          }}
        >
          <motion.div
            className="absolute inset-x-[7%] z-30"
            style={{
              top: `${CARD_WORLD_TOP}svh`,
              y: cardY,
              scale: cardScale,
            }}
          >
            <ContactCard copied={copied} onCopy={copyEmail} />
          </motion.div>

          {CONTACT_JOURNEY_STOPS.map((stop) => (
            <PixelPlanetStop
              key={stop.id}
              stop={stop}
              activeImpact={activeImpactId === stop.id}
              revealed={revealedStopSet.has(stop.id)}
            />
          ))}

          <div className="pointer-events-none absolute left-[18%] top-[124svh] h-[0.9rem] w-[0.9rem] rounded-none border border-white/10 bg-[rgba(255,225,194,0.18)] shadow-[0_0_18px_rgba(255,215,170,0.18)]" />
          <div className="pointer-events-none absolute left-[82%] top-[92svh] h-[0.7rem] w-[0.7rem] rounded-none border border-white/10 bg-[rgba(180,198,255,0.18)] shadow-[0_0_14px_rgba(180,198,255,0.18)]" />
          <div className="pointer-events-none absolute left-[54%] top-[54svh] h-[0.6rem] w-[0.6rem] rounded-none border border-white/10 bg-[rgba(255,196,228,0.14)]" />
        </motion.div>

        {!prefersReducedMotion ? (
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-50 -translate-x-1/2 -translate-y-1/2"
            style={{
              x: rocketX,
              y: rocketY,
              rotate: rocketRotate,
              opacity: rocketOpacity,
              scale: rocketScale,
            }}
          >
            <PixelRocket />
          </motion.div>
        ) : null}

        <AnimatePresence>
          {finalImpactActive ? (
            <motion.div
              key="contact-final-explosion"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.12 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+4.6rem)] z-50 -translate-x-1/2 -translate-y-1/2"
            >
              <PixelExplosion large />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

function JourneyControls({
  isPlaying,
  journeyState,
  prefersReducedMotion,
  onReplay,
  onSkip,
}: {
  isPlaying: boolean;
  journeyState: "playing" | "finished";
  prefersReducedMotion: boolean;
  onReplay: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+0.9rem)] z-50 flex items-center gap-2">
      {!prefersReducedMotion && isPlaying ? (
        <button
          type="button"
          onClick={onSkip}
          className="chv-contact-pixel-button chv-mobile-mono text-[0.56rem] uppercase tracking-[0.28em] text-white/80"
        >
          skip
        </button>
      ) : null}

      {journeyState === "finished" ? (
        <button
          type="button"
          onClick={onReplay}
          className="chv-contact-pixel-button chv-mobile-mono text-[0.56rem] uppercase tracking-[0.28em] text-white/84"
        >
          replay
        </button>
      ) : null}
    </div>
  );
}

function ContactCard({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="chv-contact-card relative overflow-hidden rounded-none border border-white/10 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(255,216,178,0.24),transparent_26%),radial-gradient(circle_at_18%_88%,rgba(134,255,229,0.16),transparent_28%)]" />
      <div className="absolute left-3 top-3 h-3 w-3 rounded-none border border-white/16 bg-[#ffe0b8]" />
      <div className="absolute right-3 top-3 h-3 w-3 rounded-none border border-white/16 bg-[#8fd1ff]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,243,221,0.7),transparent)]" />

      <div className="relative">
        <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.34em] text-white/50">launch pad</p>
        <h2 className="mt-4 text-[2.2rem] leading-[0.88] tracking-[-0.08em] text-[#fff1dc]">
          {CONTACT_DETAILS.name}
        </h2>
        <p className="mt-4 break-all text-[1.02rem] leading-7 text-[#ffe8ca]">{CONTACT_DETAILS.email}</p>

        <div className="mt-6 flex items-end justify-between gap-3">
          <Link
            href={`mailto:${CONTACT_DETAILS.email}`}
            className="chv-contact-pixel-link text-[1.05rem] leading-none text-[#fff7ef]"
          >
            write ↗
          </Link>
          <button
            type="button"
            onClick={onCopy}
            className="chv-mobile-mono text-[0.7rem] uppercase tracking-[0.24em] text-white/72"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 text-[0.72rem] text-white/48">
          <span className="inline-block h-2.5 w-2.5 rounded-none bg-[#ffb16c] shadow-[0_0_12px_rgba(255,177,108,0.4)]" />
          <span className="chv-mobile-body italic tracking-[0.02em]">rocket armed for upward departure</span>
        </div>
      </div>
    </section>
  );
}

function PixelPlanetStop({
  stop,
  activeImpact,
  revealed,
}: {
  stop: ContactJourneyStop;
  activeImpact: boolean;
  revealed: boolean;
}) {
  const planetStyle = {
    left: `${stop.xPercent}%`,
    top: `${stop.yVh}svh`,
    "--planet-accent": stop.accent,
    "--planet-color": stop.planetColor,
    "--planet-glow": stop.glowColor,
  } as CSSProperties;

  const body = (
    <motion.div
      initial={false}
      animate={{
        opacity: revealed ? 1 : 0.28,
        scale: activeImpact ? 1.12 : revealed ? 1 : 0.84,
        y: activeImpact ? -6 : 0,
      }}
      transition={{ duration: activeImpact ? 0.16 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className={`chv-contact-planet-wrap ${revealed ? "is-revealed" : ""} ${activeImpact ? "is-impacting" : ""}`}>
        <div className="chv-contact-planet-orbit" />
        <div className="chv-contact-planet-body">
          <PixelPlanetArt accent={stop.accent} planetColor={stop.planetColor} />
        </div>
        <div className="chv-contact-planet-label">
          <span className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.28em] text-white/54">planet</span>
          <span className="mt-1 block text-[1.12rem] leading-none tracking-[-0.06em] text-[#fff1dd]">{stop.label}</span>
          <AnimatePresence>
            {revealed ? (
              <motion.span
                key={`${stop.id}-cta`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 block text-[0.66rem] uppercase tracking-[0.26em] text-white/72"
              >
                open ↗
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {activeImpact ? (
          <motion.div
            key={`${stop.id}-impact`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-1/2 top-[1.65rem] z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <PixelExplosion />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );

  if (!revealed) {
    return (
      <div className="absolute z-20 -translate-x-1/2" style={planetStyle}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={stop.href}
      target="_blank"
      rel="noreferrer noopener"
      className="absolute z-30 -translate-x-1/2 focus:outline-none"
      style={planetStyle}
      aria-label={`Open ${stop.label}`}
    >
      {body}
    </Link>
  );
}

function PixelStarField({
  stars,
  layer,
}: {
  stars: readonly { left: string; top: string; size: "sm" | "md" | "lg"; delay: string }[];
  layer: "near" | "far";
}) {
  return (
    <div className={`absolute inset-0 ${layer === "near" ? "opacity-95" : "opacity-65"}`}>
      {stars.map((star) => (
        <span
          key={`${layer}:${star.left}:${star.top}`}
          className={`chv-contact-star chv-contact-star--${star.size}`}
          style={{ left: star.left, top: star.top, animationDelay: star.delay }}
        />
      ))}
    </div>
  );
}

function PixelPlanetArt({
  accent,
  planetColor,
}: {
  accent: string;
  planetColor: string;
}) {
  return (
    <svg viewBox="0 0 84 84" className="h-20 w-20 [shape-rendering:crispEdges]">
      <rect x="18" y="8" width="12" height="6" fill={accent} opacity="0.45" />
      <rect x="30" y="8" width="24" height="6" fill={accent} opacity="0.6" />
      <rect x="54" y="8" width="12" height="6" fill={accent} opacity="0.45" />

      <rect x="12" y="14" width="60" height="6" fill={accent} opacity="0.28" />
      <rect x="6" y="20" width="72" height="12" fill={planetColor} />
      <rect x="0" y="32" width="84" height="20" fill={planetColor} />
      <rect x="6" y="52" width="72" height="12" fill={planetColor} />
      <rect x="12" y="64" width="60" height="6" fill={accent} opacity="0.32" />

      <rect x="18" y="22" width="18" height="6" fill={accent} opacity="0.22" />
      <rect x="48" y="28" width="12" height="6" fill={accent} opacity="0.26" />
      <rect x="26" y="42" width="30" height="6" fill="#ffffff" opacity="0.12" />
      <rect x="18" y="48" width="12" height="6" fill={accent} opacity="0.18" />
      <rect x="48" y="52" width="18" height="6" fill={accent} opacity="0.22" />

      <rect x="6" y="32" width="6" height="20" fill="#ffffff" opacity="0.12" />
      <rect x="72" y="32" width="6" height="20" fill="#000000" opacity="0.16" />
    </svg>
  );
}

function PixelRocket() {
  return (
    <div className="relative h-24 w-20">
      <div className="absolute left-1/2 top-full -z-10 h-10 w-8 -translate-x-1/2">
        <div className="chv-contact-rocket-flame absolute left-1/2 top-0 h-full w-4 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1 h-8 w-8 -translate-x-1/2 rounded-none bg-[rgba(255,196,122,0.18)] blur-[8px]" />
      </div>

      <svg viewBox="0 0 64 96" className="h-full w-full [shape-rendering:crispEdges]">
        <rect x="24" y="6" width="16" height="10" fill="#fff7e7" />
        <rect x="18" y="16" width="28" height="16" fill="#fff7e7" />
        <rect x="14" y="32" width="36" height="28" fill="#dce7ff" />
        <rect x="20" y="38" width="24" height="16" fill="#334a90" />
        <rect x="24" y="42" width="16" height="10" fill="#9fe7ff" />
        <rect x="8" y="44" width="10" height="16" fill="#ff9f6b" />
        <rect x="46" y="44" width="10" height="16" fill="#ff9f6b" />
        <rect x="18" y="60" width="28" height="10" fill="#fff7e7" />
        <rect x="12" y="70" width="12" height="10" fill="#ff9f6b" />
        <rect x="40" y="70" width="12" height="10" fill="#ff9f6b" />
        <rect x="24" y="70" width="16" height="12" fill="#ffd46f" />
        <rect x="28" y="82" width="8" height="8" fill="#ff8a52" />
      </svg>
    </div>
  );
}

function PixelExplosion({ large = false }: { large?: boolean }) {
  const sizeClassName = large ? "h-32 w-32" : "h-16 w-16";

  return (
    <div className={`relative ${sizeClassName}`}>
      <div className="absolute inset-0 rounded-none bg-[rgba(255,240,189,0.14)] blur-[14px]" />
      <svg viewBox="0 0 96 96" className="h-full w-full [shape-rendering:crispEdges]">
        <rect x="42" y="0" width="12" height="20" fill="#ffe28a" />
        <rect x="42" y="76" width="12" height="20" fill="#ff9160" />
        <rect x="0" y="42" width="20" height="12" fill="#ffe28a" />
        <rect x="76" y="42" width="20" height="12" fill="#ff9160" />
        <rect x="18" y="18" width="16" height="10" fill="#ffd26d" />
        <rect x="62" y="18" width="16" height="10" fill="#ffaf72" />
        <rect x="18" y="68" width="16" height="10" fill="#ffaf72" />
        <rect x="62" y="68" width="16" height="10" fill="#ffd26d" />
        <rect x="24" y="24" width="48" height="48" fill="#ffecc0" />
        <rect x="34" y="34" width="28" height="28" fill="#ffb56d" />
      </svg>
    </div>
  );
}
