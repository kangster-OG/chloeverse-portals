"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";

import { MobileRouteLink } from "@/components/mobile/shared/MobileRouteLink";
import { useContactCarousel } from "@/hooks/useContactCarousel";
import { CONTACT_CAROUSEL_ITEMS, CONTACT_DETAILS, type ContactCarouselItem } from "@/lib/mobile-content";

const ACCENT = "#ffcfac";
const STAR_LAYER = [
  { left: "8%", top: "12%", size: "sm", delay: "0.1s" },
  { left: "18%", top: "24%", size: "md", delay: "0.5s" },
  { left: "32%", top: "10%", size: "sm", delay: "1.1s" },
  { left: "46%", top: "20%", size: "lg", delay: "0.7s" },
  { left: "64%", top: "14%", size: "md", delay: "1.4s" },
  { left: "82%", top: "22%", size: "sm", delay: "0.9s" },
  { left: "12%", top: "58%", size: "sm", delay: "0.3s" },
  { left: "27%", top: "72%", size: "md", delay: "1.7s" },
  { left: "44%", top: "66%", size: "sm", delay: "0.8s" },
  { left: "63%", top: "78%", size: "lg", delay: "1.3s" },
  { left: "84%", top: "64%", size: "md", delay: "0.2s" },
] as const;

export function MobileContactExperience() {
  const [copied, setCopied] = useState(false);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const { activeIndex, bind, rotation, snapToIndex } = useContactCarousel(CONTACT_CAROUSEL_ITEMS.length);

  const activeItem = CONTACT_CAROUSEL_ITEMS[activeIndex] ?? CONTACT_CAROUSEL_ITEMS[0];

  useEffect(() => {
    if (activeItem.id !== "contact" && contactPanelOpen) {
      setContactPanelOpen(false);
    }
  }, [activeItem.id, contactPanelOpen]);

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
    <main className="chv-mobile-root relative min-h-[100svh] overflow-hidden bg-[#04050a] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#070b14_0%,#04050b_46%,#020207_100%)]" />
      <div className="chv-contact-space-nebula absolute inset-0" />
      <div className="chv-contact-space-vignette absolute inset-0" />
      <PixelStarField stars={STAR_LAYER} />
      <div className="chv-mobile-grain pointer-events-none absolute inset-0 z-10 opacity-24" />

      <MobileRouteLink
        href="/"
        accent={ACCENT}
        label="Chloeverse"
        aria-label="Return to the Chloeverse"
        className="fixed left-4 top-[calc(env(safe-area-inset-top,0px)+0.9rem)] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-white/84 backdrop-blur-xl"
      >
        <span aria-hidden="true" className="text-[1.25rem] leading-none">
          &#x2039;
        </span>
      </MobileRouteLink>

      <motion.div
        key={activeItem.id}
        className="pointer-events-none absolute left-1/2 top-[42%] z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        initial={{ opacity: 0.28, scale: 0.9 }}
        animate={{ opacity: 0.58, scale: 1.04 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: `radial-gradient(circle, ${activeItem.glow} 0%, transparent 70%)` }}
      />

      <section className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="chv-contact-ring-stage relative h-[20rem] w-full touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={bind.onPointerDown}
          onPointerMove={bind.onPointerMove}
          onPointerUp={bind.onPointerUp}
          onPointerCancel={bind.onPointerUp}
        >
          <div
            className="chv-contact-ring absolute left-1/2 top-1/2 h-[15rem] w-[15rem] -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(-50%, -50%) rotateX(-10deg) rotateY(${rotation}deg)` }}
          >
            {CONTACT_CAROUSEL_ITEMS.map((item, index) => (
              <RingIcon
                key={item.id}
                index={index}
                item={item}
                rotation={rotation}
              />
            ))}
          </div>
          <CenteredAction
            item={activeItem}
            onContactOpen={() => {
              snapToIndex(activeIndex);
              setContactPanelOpen(true);
            }}
          />
        </div>
      </section>

      <AnimatePresence>
        {contactPanelOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-50"
          >
            <div className="chv-contact-overlay-card relative overflow-hidden rounded-[2rem] border border-white/12 px-5 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,210,176,0.22),transparent_24%),radial-gradient(circle_at_16%_84%,rgba(145,201,255,0.18),transparent_28%)]" />
              <button
                type="button"
                onClick={() => setContactPanelOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.28em] text-white/76"
              >
                close
              </button>

              <div className="relative pr-16">
                <h2 className="text-[2.15rem] leading-[0.88] tracking-[-0.08em] text-[#fff2de]">
                  {CONTACT_DETAILS.name}
                </h2>
                <p className="mt-4 break-all text-[1rem] leading-7 text-[#ffe8ca]">{CONTACT_DETAILS.email}</p>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <Link
                    href={`mailto:${CONTACT_DETAILS.email}`}
                    className="chv-contact-overlay-link text-[1.06rem] leading-none text-[#fff7ef]"
                  >
                    write ↗
                  </Link>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="chv-mobile-mono text-[0.7rem] uppercase tracking-[0.28em] text-white/70"
                  >
                    {copied ? "copied" : "copy"}
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function RingIcon({
  index,
  item,
  rotation,
}: {
  index: number;
  item: ContactCarouselItem;
  rotation: number;
}) {
  const step = 360 / CONTACT_CAROUSEL_ITEMS.length;
  const currentAngle = index * step + rotation;
  const radians = (Math.abs(currentAngle) * Math.PI) / 180;
  const frontness = Math.max(0, Math.cos(radians));
  const scale = 0.74 + frontness * 0.34;
  const opacity = 0.14 + frontness * 0.96;
  const zIndex = Math.round(frontness * 100);
  const iconStyle = {
    opacity,
    zIndex,
    transform: `translate(-50%, -50%) rotateY(${index * step}deg) translateZ(8.75rem)`,
  } as CSSProperties;

  const bubbleStyle = {
    filter: `drop-shadow(0 ${10 + frontness * 16}px ${18 + frontness * 22}px rgba(0,0,0,0.32)) drop-shadow(0 0 ${10 + frontness * 24}px ${item.glow})`,
    transform: `scale(${scale})`,
  } as CSSProperties;

  const iconBubble = (
    <div className="chv-contact-app-glyph" style={bubbleStyle}>
      <AppIcon icon={item.icon} accent={item.accent} />
    </div>
  );

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 block" style={iconStyle}>
      {iconBubble}
    </div>
  );
}

function CenteredAction({
  item,
  onContactOpen,
}: {
  item: ContactCarouselItem;
  onContactOpen: () => void;
}) {
  if (item.id === "contact") {
    return (
      <button
        type="button"
        aria-label="Open contact card"
        onClick={onContactOpen}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        className="absolute left-1/2 top-1/2 z-20 h-[8.5rem] w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] focus:outline-none"
      />
    );
  }

  return (
    <Link
      href={item.href ?? "/contact"}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Open ${item.label}`}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      className="absolute left-1/2 top-1/2 z-20 block h-[8.5rem] w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] focus:outline-none"
    />
  );
}

function PixelStarField({
  stars,
}: {
  stars: readonly { left: string; top: string; size: "sm" | "md" | "lg"; delay: string }[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-90">
      {stars.map((star) => (
        <span
          key={`${star.left}:${star.top}`}
          className={`chv-contact-space-star chv-contact-space-star--${star.size}`}
          style={{ left: star.left, top: star.top, animationDelay: star.delay }}
        />
      ))}
    </div>
  );
}

function AppIcon({
  icon,
  accent,
}: {
  icon: ContactCarouselItem["icon"];
  accent: string;
}) {
  const className = "h-[6.8rem] w-[6.8rem] [shape-rendering:geometricPrecision]";

  if (icon === "contact") {
    return (
      <svg viewBox="0 0 96 96" className={className}>
        <defs>
          <linearGradient id="contactGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff5e8" />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>
        <rect x="14" y="14" width="68" height="68" rx="22" fill="#151720" opacity="0.92" />
        <rect x="22" y="26" width="44" height="30" rx="10" fill="url(#contactGradient)" opacity="0.98" />
        <path d="M27 33h34.5v3.5L44.2 48.8 27 36.5z" fill="#261b2a" opacity="0.92" />
        <circle cx="63" cy="60" r="11" fill="#fff7ea" />
        <path d="M63 53l1.8 4.8 5.2 1.2-4 3.1 1.2 5.1-4.2-2.8-4.2 2.8 1.2-5.1-4-3 5.2-1.2z" fill={accent} />
      </svg>
    );
  }

  if (icon === "instagram") {
    return (
      <svg viewBox="0 0 96 96" className={className}>
        <rect x="18" y="18" width="60" height="60" rx="18" fill={accent} opacity="0.94" />
        <rect x="27" y="27" width="42" height="42" rx="13" fill="none" stroke="#fff6ee" strokeWidth="6" />
        <circle cx="48" cy="48" r="10.5" fill="none" stroke="#fff6ee" strokeWidth="6" />
        <circle cx="63" cy="33" r="4" fill="#fff6ee" />
      </svg>
    );
  }

  if (icon === "tiktok") {
    return (
      <svg viewBox="0 0 96 96" className={className}>
        <rect x="16" y="16" width="64" height="64" rx="18" fill={accent} opacity="0.94" />
        <path d="M56 26c3 8 8 12 15 13v10c-6 0-11-1.8-15-5.2V60c0 9-6 15-15 15-8.3 0-14-6-14-13.8C27 53.6 33 48 41 48c1.4 0 2.3.1 4 .5v11.3c-1.1-.8-2.2-1.1-3.8-1.1-2.8 0-5 2.1-5 4.8 0 3.1 2.4 5.3 5.3 5.3 3.7 0 5.5-2.5 5.5-6.2V26z" fill="#fff8f1" />
      </svg>
    );
  }

  if (icon === "linkedin") {
    return (
      <svg viewBox="0 0 96 96" className={className}>
        <rect x="16" y="16" width="64" height="64" rx="18" fill={accent} opacity="0.94" />
        <circle cx="34" cy="35" r="5" fill="#fff7ef" />
        <rect x="29" y="44" width="10" height="24" fill="#fff7ef" />
        <path d="M46 44h10v4c2.2-3.1 5.4-4.8 10.4-4.8 8.2 0 12.6 5.1 12.6 14.4V68H68V59c0-4.6-1.6-7.1-5.4-7.1-4.1 0-6.1 2.7-6.1 8.1V68H46z" fill="#fff7ef" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className={className}>
      <rect x="16" y="16" width="64" height="64" rx="18" fill={accent} opacity="0.94" />
      <path d="M29 30h10.4L48 41.4 56.6 30H67L53.8 47.8 69 67H58.4L47.2 52.8 36.8 67H26.4l14.8-20.4z" fill="#fff7ef" />
    </svg>
  );
}
