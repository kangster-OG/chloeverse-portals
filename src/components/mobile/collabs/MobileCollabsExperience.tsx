"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

import {
  CollabsInstagramEmbedRuntime,
  InstagramProjectsEmbed,
  MODAL_CROP_VISIBLE,
} from "@/components/collabs/InstagramProjectsEmbed";
import { REELS } from "@/components/collabs/reelsData";
import { MobileRouteLink } from "@/components/mobile/shared/MobileRouteLink";
import { getCollabMediumLabel } from "@/lib/mobile-content";

const ACCENT = "#bcc6ff";

const COLLAB_STORIES = [
  {
    eyebrow: "Creative system",
    caption: "A collab surfaced in the same full-screen feed grammar as projects, but tuned for partner work instead of solo studies.",
    audioLabel: "Adobe commission",
    accent: "#c9d3ff",
    gradient:
      "radial-gradient(circle_at_18%_18%,rgba(201,211,255,0.28),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.12),transparent_20%),linear-gradient(180deg,#1a1d33_0%,#090c18_58%,#030408_100%)",
    glyph: "A",
    metrics: {
      likes: "brand",
      comments: "post",
      shares: "source",
    },
  },
  {
    eyebrow: "Invited room",
    caption: "Shared work presented with the same swipe rhythm as projects, but framed as a partner-facing reel rather than a creator archive.",
    audioLabel: "OpenAI collaboration",
    accent: "#c8b8ff",
    gradient:
      "radial-gradient(circle_at_22%_22%,rgba(211,182,255,0.26),transparent_22%),radial-gradient(circle_at_78%_16%,rgba(151,206,255,0.16),transparent_18%),linear-gradient(180deg,#1a1630_0%,#090613_54%,#030207_100%)",
    glyph: "O",
    metrics: {
      likes: "brand",
      comments: "reel",
      shares: "source",
    },
  },
  {
    eyebrow: "Dining feature",
    caption: "The collabs route now enters as a reel viewer first, with each partner piece living in the same direct feed structure as projects.",
    audioLabel: "Ume editorial placement",
    accent: "#a7e1ff",
    gradient:
      "radial-gradient(circle_at_18%_18%,rgba(167,225,255,0.24),transparent_22%),radial-gradient(circle_at_80%_82%,rgba(255,226,178,0.14),transparent_22%),linear-gradient(180deg,#172331_0%,#071018_56%,#020508_100%)",
    glyph: "U",
    metrics: {
      likes: "venue",
      comments: "post",
      shares: "source",
    },
  },
  {
    eyebrow: "Beauty / fashion",
    caption: "A partner story slide with the same top controls, swipe pacing, and footer treatment as the projects feed.",
    audioLabel: "Beauty / fashion placement",
    accent: "#ffd6ef",
    gradient:
      "radial-gradient(circle_at_20%_18%,rgba(255,214,239,0.28),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.1),transparent_18%),linear-gradient(180deg,#311827_0%,#150a12_58%,#050207_100%)",
    glyph: "B",
    metrics: {
      likes: "brand",
      comments: "post",
      shares: "source",
    },
  },
  {
    eyebrow: "Campaign frame",
    caption: "The same mobile reel-viewer format, but pointed at brand collaborations and original source handoff.",
    audioLabel: "Adidas collaboration",
    accent: "#d9f0ff",
    gradient:
      "radial-gradient(circle_at_18%_18%,rgba(217,240,255,0.24),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.12),transparent_18%),linear-gradient(180deg,#142233_0%,#071019_58%,#020307_100%)",
    glyph: "A",
    metrics: {
      likes: "brand",
      comments: "post",
      shares: "source",
    },
  },
] as const;

type CollabFeedItem = (typeof REELS)[number] & (typeof COLLAB_STORIES)[number];

const COLLAB_FEED: CollabFeedItem[] = REELS.map((item, index) => ({
  ...item,
  ...COLLAB_STORIES[index],
}));

export function MobileCollabsExperience({ skipIntro = false }: { skipIntro?: boolean }) {
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const slides = slideRefs.current.filter((slide): slide is HTMLElement => Boolean(slide));
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let nextIndex = activeIndex;
        let nextRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = slideRefs.current.findIndex((slide) => slide === entry.target);
          if (index === -1) continue;
          if (entry.intersectionRatio >= nextRatio) {
            nextRatio = entry.intersectionRatio;
            nextIndex = index;
          }
        }

        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex);
        }
      },
      {
        threshold: [0.45, 0.6, 0.75],
      },
    );

    for (const slide of slides) {
      observer.observe(slide);
    }

    return () => observer.disconnect();
  }, [activeIndex]);

  const setSlideRef = (index: number) => (node: HTMLElement | null) => {
    slideRefs.current[index] = node;
  };

  return (
    <main className="chv-mobile-root relative min-h-[100svh] overflow-hidden bg-black text-white">
      <CollabsInstagramEmbedRuntime />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(188,198,255,0.12),transparent_24%),linear-gradient(180deg,#151726_0%,#05060d_40%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),transparent_18%,transparent_74%,rgba(0,0,0,0.56)_100%)]" />

      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.55rem)]"
        aria-label="Collabs reel controls"
      >
        <MobileRouteLink
          href="/"
          accent={ACCENT}
          label="Chloeverse"
          aria-label="Return to Chloeverse"
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md"
        >
          <span aria-hidden="true" className="text-[1.3rem] leading-none">
            &#x2039;
          </span>
        </MobileRouteLink>

        <div className="pointer-events-none text-center">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-white/58">
            {skipIntro ? "Reels" : "Collabs"}
          </p>
          <p className="mt-1 text-[1rem] font-semibold tracking-[-0.03em] text-white">Reels</p>
        </div>

        <div className="pointer-events-none min-w-[2.25rem] text-right text-[0.78rem] font-medium text-white/72">
          {String(activeIndex + 1).padStart(2, "0")}
        </div>
      </header>

      <div className="chv-mobile-reels-feed chv-hide-scrollbar relative z-10 h-[100svh] overflow-y-auto overscroll-y-contain">
        {COLLAB_FEED.map((item, index) => {
          const isNearActive = Math.abs(index - activeIndex) <= 1;

          return (
            <section
              key={item.id}
              ref={setSlideRef(index)}
              className="chv-mobile-reel-slide relative isolate"
              aria-label={`Collab reel ${index + 1}`}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0" style={{ background: item.gradient }} />
                <div
                  className="absolute left-1/2 top-[20%] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full blur-3xl"
                  style={{ background: `radial-gradient(circle, ${item.accent}2e 0%, transparent 68%)` }}
                />
                <div className="absolute inset-x-[-18%] top-[48%] h-[15rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_64%)] blur-3xl" />
                <div
                  aria-hidden="true"
                  className="absolute right-[-0.04em] top-[16%] chv-mobile-display text-[7.5rem] leading-none tracking-[-0.12em] text-white/7"
                >
                  {item.glyph}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+3.75rem)] z-20 px-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/24 px-3 py-1 text-[0.72rem] font-medium text-white/88 backdrop-blur-md">
                  <span>{item.eyebrow}</span>
                  <span className="text-white/34">&bull;</span>
                  <span>{getCollabMediumLabel(item.url)}</span>
                </div>
              </div>

              <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+6.7rem)] bottom-[calc(env(safe-area-inset-bottom,0px)+8.7rem)] z-20 flex items-center justify-center px-4">
                <div className="relative flex h-full max-h-[34rem] min-h-[24rem] w-full max-w-[21rem] items-center justify-center">
                  <div className="absolute inset-0 rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] shadow-[0_36px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl" />
                  <div className="relative h-[calc(100%-1rem)] w-[calc(100%-1rem)] overflow-hidden rounded-[1.55rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                    {isNearActive ? (
                      <InstagramProjectsEmbed
                        key={`collab-feed:${item.url}:${index}`}
                        url={item.url}
                        token={index + 1}
                        crop={MODAL_CROP_VISIBLE}
                      />
                    ) : (
                      <CollabPlaceholder title={item.title} eyebrow={item.eyebrow} accent={item.accent} />
                    )}
                  </div>
                </div>
              </div>

              <aside className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] right-3 z-30 flex flex-col items-center gap-4">
                <ReelAction icon={<Heart size={30} strokeWidth={1.85} />} label={item.metrics.likes} />
                <ReelAction icon={<MessageCircle size={30} strokeWidth={1.85} />} label={item.metrics.comments} />
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex flex-col items-center gap-1.5 text-white"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/34 backdrop-blur-md">
                    <Send size={30} strokeWidth={1.85} />
                  </span>
                  <span className="text-[0.66rem] font-medium text-white/84">{item.metrics.shares}</span>
                </Link>
                <ReelAction icon={<Bookmark size={30} strokeWidth={1.85} />} label="save" />
              </aside>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.15rem)]">
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-[74%]">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-8 w-8 rounded-full border border-white/16"
                        style={{
                          background: `radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.94),${item.accent}88 34%,rgba(0,0,0,0.18)_72%)`,
                        }}
                      />
                      <p className="text-[0.95rem] font-semibold tracking-[-0.02em] text-white">{item.title}</p>
                    </div>
                    <p className="mt-3 text-[0.94rem] leading-6 text-white/92">{item.caption}</p>
                    <p className="mt-3 text-[0.82rem] font-medium text-white/74">{item.audioLabel}</p>
                    <div className="pointer-events-auto mt-4 flex items-center gap-3">
                      <Link
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex rounded-full border border-white/14 bg-white/9 px-3.5 py-2 text-[0.76rem] font-medium text-white backdrop-blur-md"
                      >
                        open original
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ReelAction({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-white">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/34 backdrop-blur-md">{icon}</span>
      <span className="text-[0.66rem] font-medium text-white/84">{label}</span>
    </div>
  );
}

function CollabPlaceholder({
  title,
  eyebrow,
  accent,
}: {
  title: string;
  eyebrow: string;
  accent: string;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-end overflow-hidden px-5 py-6 text-white"
      style={{
        background: `radial-gradient(circle_at_20%_18%, ${accent}3d 0%, transparent 26%), linear-gradient(180deg, rgba(24,24,36,0.9) 0%, rgba(10,10,18,0.98) 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.14),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%,rgba(0,0,0,0.18)_100%)]" />
      <div className="relative">
        <p className="chv-mobile-mono text-[0.62rem] uppercase tracking-[0.34em] text-white/46">{eyebrow}</p>
        <p className="mt-4 chv-mobile-display text-[2.3rem] leading-[0.9] tracking-[-0.07em] text-[#f7f4ff]">
          {title}
        </p>
        <p className="mt-3 text-[0.9rem] leading-6 text-white/62">Loading the collab viewer for this slide.</p>
      </div>
    </div>
  );
}
