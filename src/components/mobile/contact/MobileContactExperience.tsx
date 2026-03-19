"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";

import { MobileReturnSigil } from "@/components/mobile/shared/MobileRouteFrame";
import { useContactCarousel } from "@/hooks/useContactCarousel";
import { CONTACT_CAROUSEL_ITEMS, CONTACT_DETAILS, type ContactCarouselItem } from "@/lib/mobile-content";

const ACCENT = "#ffcfac";
const STAR_LAYER_NEAR = [
  { left: "9%", top: "12%", size: "sm", delay: "0.1s" },
  { left: "18%", top: "22%", size: "md", delay: "0.4s" },
  { left: "34%", top: "8%", size: "sm", delay: "1.1s" },
  { left: "52%", top: "16%", size: "lg", delay: "0.6s" },
  { left: "72%", top: "11%", size: "sm", delay: "1.5s" },
  { left: "88%", top: "18%", size: "md", delay: "0.9s" },
  { left: "12%", top: "48%", size: "md", delay: "1.7s" },
  { left: "29%", top: "63%", size: "sm", delay: "0.2s" },
  { left: "47%", top: "58%", size: "md", delay: "1.2s" },
  { left: "71%", top: "66%", size: "lg", delay: "0.7s" },
  { left: "90%", top: "74%", size: "sm", delay: "1.8s" },
] as const;
const STAR_LAYER_FAR = [
  { left: "6%", top: "6%", size: "sm", delay: "1.4s" },
  { left: "26%", top: "16%", size: "sm", delay: "0.7s" },
  { left: "44%", top: "28%", size: "md", delay: "1.8s" },
  { left: "66%", top: "20%", size: "sm", delay: "0.3s" },
  { left: "82%", top: "32%", size: "sm", delay: "1.1s" },
  { left: "17%", top: "70%", size: "md", delay: "0.5s" },
  { left: "37%", top: "80%", size: "sm", delay: "1.6s" },
  { left: "62%", top: "86%", size: "md", delay: "0.8s" },
  { left: "84%", top: "60%", size: "sm", delay: "1.9s" },
] as const;

export function MobileContactExperience() {
  const [copied, setCopied] = useState(false);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const { activeIndex, containerRef, metrics, scrollToIndex, setItemRef } = useContactCarousel(
    CONTACT_CAROUSEL_ITEMS.length,
  );

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
    <main className="chv-mobile-root relative min-h-[100svh] overflow-hidden bg-[#03040a] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#070a12_0%,#04050b_48%,#020207_100%)]" />
      <div className="chv-contact-orbit-nebula absolute inset-0" />
      <div className="chv-contact-orbit-vignette absolute inset-0" />
      <PixelStarField stars={STAR_LAYER_FAR} layer="far" />
      <PixelStarField stars={STAR_LAYER_NEAR} layer="near" />
      <div className="chv-mobile-grain pointer-events-none absolute inset-0 z-10 opacity-30" />

      <MobileReturnSigil accent={ACCENT} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top,0px)+1.05rem)]">
        <div className="mx-auto max-w-[16rem] text-center">
          <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.34em] text-white/44">contact orbit</p>
          <h1 className="chv-contact-orbit-title mt-3 text-[3.4rem] leading-[0.82] tracking-[-0.09em] text-[#fff2df]">
            contact
          </h1>
          <p className="mx-auto mt-3 max-w-[14rem] text-[0.84rem] leading-6 text-white/56">
            Spin through the creator&apos;s channels and tap the contact icon to open the full card.
          </p>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[34%] z-10 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl"
        animate={{
          opacity: [0.3, 0.6, 0.38],
          scale: [0.94, 1.08, 1],
        }}
        transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${activeItem.glow} 0%, transparent 68%)` }}
      />

      <div className="absolute inset-x-0 top-[26%] z-20 px-5">
        <div className="mx-auto max-w-[20rem] text-center">
          <p className="chv-mobile-body text-[0.74rem] italic tracking-[0.03em] text-white/44">
            swipe the wheel
          </p>
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl"
          >
            <p className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.32em] text-white/42">focused icon</p>
            <p className="mt-2 text-[1.5rem] leading-[0.92] tracking-[-0.06em] text-[#fff2df]">{activeItem.label}</p>
            <p className="mt-2 text-[0.8rem] leading-6 text-white/56">
              {activeItem.id === "contact"
                ? "Tap to open the contact card."
                : "Tap to open this social channel."}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+13.6rem)] z-20">
        <div className="chv-contact-orbit-rail mx-auto h-px w-[72vw] max-w-[22rem]" />
      </div>

      <section className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.8rem)] z-30">
        <div className="chv-contact-orbit-shell mx-auto w-[100vw]">
          <div
            ref={containerRef}
            className="chv-contact-orbit-scroll chv-hide-scrollbar flex overflow-x-auto overflow-y-visible pb-10 pt-6"
            style={{ paddingInline: "calc(50vw - 5.2rem)" }}
          >
            {CONTACT_CAROUSEL_ITEMS.map((item, index) => {
              const metric = metrics[index] ?? { focus: 0, offset: 1 };
              const focus = metric.focus;
              const offset = metric.offset;
              const scale = 0.8 + focus * 0.26;
              const translateY = (1 - focus) * 18;
              const rotateY = offset * -26;
              const opacity = 0.42 + focus * 0.58;
              const content = (
                <CarouselIconFace
                  item={item}
                  isActive={index === activeIndex}
                  focus={focus}
                  offset={offset}
                />
              );

              const cardStyle = {
                opacity,
                transform: `perspective(1200px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`,
              } as CSSProperties;

              return (
                <div
                  key={item.id}
                  ref={setItemRef(index)}
                  className="shrink-0 snap-center px-2"
                >
                  {item.id === "contact" ? (
                    <button
                      type="button"
                      onClick={() => {
                        scrollToIndex(index);
                        setContactPanelOpen(true);
                      }}
                      className="block focus:outline-none"
                      style={cardStyle}
                      aria-label="Open contact card"
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      href={item.href ?? "/contact"}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block focus:outline-none"
                      style={cardStyle}
                      aria-label={`Open ${item.label}`}
                    >
                      {content}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {contactPanelOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-40"
          >
            <div className="chv-contact-card-panel relative overflow-hidden rounded-[2rem] border border-white/12 px-5 py-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(255,211,172,0.2),transparent_24%),radial-gradient(circle_at_18%_84%,rgba(143,202,255,0.16),transparent_28%)]" />
              <button
                type="button"
                onClick={() => setContactPanelOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.28em] text-white/76"
              >
                close
              </button>

              <div className="relative pr-16">
                <p className="chv-mobile-mono text-[0.56rem] uppercase tracking-[0.34em] text-white/46">contact card</p>
                <h2 className="mt-4 text-[2.2rem] leading-[0.88] tracking-[-0.08em] text-[#fff1de]">
                  {CONTACT_DETAILS.name}
                </h2>
                <p className="mt-4 break-all text-[1rem] leading-7 text-[#ffe8ca]">{CONTACT_DETAILS.email}</p>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <Link
                    href={`mailto:${CONTACT_DETAILS.email}`}
                    className="chv-contact-orbit-link text-[1.06rem] leading-none text-[#fff7f0]"
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

                <p className="mt-5 text-[0.8rem] leading-6 text-white/52">
                  Scroll the orbit to move between app icons. Tap any social icon to leave for that platform.
                </p>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
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
    <div className={`pointer-events-none absolute inset-0 ${layer === "near" ? "z-10 opacity-95" : "z-0 opacity-65"}`}>
      {stars.map((star) => (
        <span
          key={`${layer}:${star.left}:${star.top}`}
          className={`chv-contact-orbit-star chv-contact-orbit-star--${star.size}`}
          style={{ left: star.left, top: star.top, animationDelay: star.delay }}
        />
      ))}
    </div>
  );
}

function CarouselIconFace({
  item,
  isActive,
  focus,
  offset,
}: {
  item: ContactCarouselItem;
  isActive: boolean;
  focus: number;
  offset: number;
}) {
  const iconStyle = {
    "--orbit-accent": item.accent,
    "--orbit-glow": item.glow,
    "--orbit-surface": item.surface,
    boxShadow: `0 ${16 + focus * 20}px ${36 + focus * 30}px rgba(0,0,0,0.24), 0 0 ${20 + focus * 26}px ${item.glow}`,
  } as CSSProperties;

  return (
    <div className="chv-contact-orbit-card-wrap">
      <div className={`chv-contact-orbit-card ${isActive ? "is-active" : ""}`} style={iconStyle}>
        <div className="chv-contact-orbit-card__halo" style={{ opacity: 0.2 + focus * 0.72 }} />
        <div className="chv-contact-orbit-card__surface" />
        <div className="chv-contact-orbit-card__shine" />
        <div className="chv-contact-orbit-card__inner">
          <div className="chv-contact-orbit-app-icon">
            <AppIcon icon={item.icon} accent={item.accent} focus={focus} />
          </div>
        </div>
        <div className="chv-contact-orbit-card__label">
          <span className="chv-mobile-mono text-[0.5rem] uppercase tracking-[0.28em] text-white/38">app</span>
          <span className="mt-1 block text-[0.95rem] leading-none tracking-[-0.05em] text-[#fff2e0]">{item.label}</span>
          <span className="mt-2 block text-[0.7rem] text-white/46">
            {item.id === "contact" ? "open card" : "open channel"}
          </span>
        </div>
      </div>
      <div
        className="pointer-events-none mt-2 h-6 rounded-full blur-[12px]"
        style={{
          opacity: 0.18 + focus * 0.32,
          background: `radial-gradient(circle, ${item.glow} 0%, transparent 72%)`,
          transform: `translateX(${offset * 8}px) scaleX(${0.9 + focus * 0.24})`,
        }}
      />
    </div>
  );
}

function AppIcon({
  icon,
  accent,
  focus,
}: {
  icon: ContactCarouselItem["icon"];
  accent: string;
  focus: number;
}) {
  const commonClassName = "h-[4.7rem] w-[4.7rem] [shape-rendering:geometricPrecision]";
  const accentOpacity = 0.26 + focus * 0.44;

  if (icon === "contact") {
    return (
      <svg viewBox="0 0 96 96" className={commonClassName}>
        <rect x="10" y="14" width="76" height="68" rx="24" fill={accent} opacity={accentOpacity} />
        <rect x="18" y="22" width="60" height="36" rx="12" fill="#fff4e5" opacity="0.9" />
        <path d="M24 30h48v4L48 48 24 34z" fill="#231829" opacity="0.9" />
        <circle cx="67" cy="61" r="10" fill="#fff3d8" />
        <path d="M67 54l1.8 4.8L74 60l-4 3.1 1.2 5.1-4.2-2.8-4.2 2.8L64 63l-4-3 5.2-1.2z" fill={accent} />
      </svg>
    );
  }

  if (icon === "instagram") {
    return (
      <svg viewBox="0 0 96 96" className={commonClassName}>
        <rect x="18" y="18" width="60" height="60" rx="18" fill={accent} opacity={accentOpacity} />
        <rect x="26" y="26" width="44" height="44" rx="14" fill="none" stroke="#fff3e7" strokeWidth="6" />
        <circle cx="48" cy="48" r="11" fill="none" stroke="#fff3e7" strokeWidth="6" />
        <circle cx="64" cy="33" r="4" fill="#fff3e7" />
      </svg>
    );
  }

  if (icon === "tiktok") {
    return (
      <svg viewBox="0 0 96 96" className={commonClassName}>
        <rect x="16" y="16" width="64" height="64" rx="18" fill={accent} opacity={accentOpacity} />
        <path d="M55 26c3 8 8 12 15 13v10c-6 0-11-1.8-15-5.2V60c0 9-6 15-15 15-8.3 0-14-6-14-13.8C26 53.6 32 48 40 48c1.4 0 2.3.1 4 .5v11.3c-1.1-.8-2.2-1.1-3.8-1.1-2.8 0-5 2.1-5 4.8 0 3.1 2.4 5.3 5.3 5.3 3.7 0 5.5-2.5 5.5-6.2V26z" fill="#fff5ef" />
      </svg>
    );
  }

  if (icon === "linkedin") {
    return (
      <svg viewBox="0 0 96 96" className={commonClassName}>
        <rect x="16" y="16" width="64" height="64" rx="18" fill={accent} opacity={accentOpacity} />
        <circle cx="34" cy="36" r="5" fill="#fff5ef" />
        <rect x="29" y="44" width="10" height="24" fill="#fff5ef" />
        <path d="M46 44h10v4c2.2-3.1 5.4-4.8 10.4-4.8 8.2 0 12.6 5.1 12.6 14.4V68H68V59c0-4.6-1.6-7.1-5.4-7.1-4.1 0-6.1 2.7-6.1 8.1V68H46z" fill="#fff5ef" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className={commonClassName}>
      <rect x="16" y="16" width="64" height="64" rx="18" fill={accent} opacity={accentOpacity} />
      <path d="M29 30h10.5L48 41.6 56.5 30H67L53.7 47.6 69 67H58.3L47.2 53 37 67H26.5l14.6-20.3z" fill="#fff4ed" />
    </svg>
  );
}
