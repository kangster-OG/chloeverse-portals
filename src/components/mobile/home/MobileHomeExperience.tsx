"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { MobileRouteLink } from "@/components/mobile/shared/MobileRouteLink";
import { MobileRouteFrame } from "@/components/mobile/shared/MobileRouteFrame";
import { HOME_PORTALS } from "@/lib/mobile-content";

type MobileHomeExperienceProps = {
  titleFontClassName?: string;
  monoFontClassName?: string;
};

const ITEM_HEIGHT = 132;

export function MobileHomeExperience(_: MobileHomeExperienceProps) {
  void _.titleFontClassName;
  void _.monoFontClassName;
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const nextIndex = Number(visible.target.getAttribute("data-index") ?? "0");
        setActiveIndex(nextIndex);
      },
      {
        root,
        threshold: [0.42, 0.68, 0.9],
      },
    );

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  const topPad = useMemo(() => `calc(20svh - ${ITEM_HEIGHT / 2}px)`, []);
  const activePortal = HOME_PORTALS[activeIndex] ?? HOME_PORTALS[0];

  return (
    <MobileRouteFrame
      currentPath="/"
      eyebrow="Signal Atlas"
      title="The Chloeverse"
      description=""
      accent={activePortal.accent}
      showHeader={false}
      ambient={
        <>
          <motion.div
            animate={reducedMotion ? undefined : { opacity: [0.22, 0.36, 0.22], scale: [1, 1.04, 1] }}
            transition={{ duration: 6.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute left-1/2 top-[10%] h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${activePortal.accent}66 0%, transparent 68%)` }}
          />
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.36)_12%,rgba(255,255,255,0.08)_55%,transparent)]" />
          <div className="absolute inset-x-8 top-[10.2rem] h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
        </>
      }
    >
      <section className="pt-8 text-center">
        <div className="relative mx-auto max-w-sm">
          <motion.div
            animate={reducedMotion ? undefined : { opacity: [0.2, 0.34, 0.2], x: [-8, 0, -8] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="chv-mobile-display absolute inset-x-0 top-0 text-[3.05rem] leading-[0.84] tracking-[-0.08em] text-white/10 blur-[1.6px]"
          >
            The Chloeverse
          </motion.div>
          <motion.div
            animate={reducedMotion ? undefined : { opacity: [0.18, 0.36, 0.18], x: [10, 4, 10], y: [2, -2, 2] }}
            transition={{ duration: 7.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="chv-mobile-display absolute inset-x-0 top-1 text-[3.05rem] leading-[0.84] tracking-[-0.08em]"
            style={{ color: `${activePortal.accent}55` }}
          >
            The Chloeverse
          </motion.div>
          <h1 className="chv-mobile-display relative text-[3.05rem] leading-[0.84] tracking-[-0.08em] text-[#f7f1e9] [text-shadow:0_0_32px_rgba(255,255,255,0.1)]">
            The Chloeverse
          </h1>
        </div>

        <div className="mx-auto mt-6 max-w-[20rem] space-y-1">
          <p className="chv-mobile-body text-[1.01rem] leading-7 text-white/74">
            where storytelling meets tomorrow
          </p>
          <p className="chv-mobile-body text-[0.98rem] leading-7 text-white/56">
            a living archive of projects, collaborations, work, and signals
          </p>
          <p className="chv-mobile-mono pt-1 text-[0.6rem] uppercase tracking-[0.34em] text-white/42">
            scroll to enter
          </p>
        </div>
      </section>

      <section className="relative mt-8">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.26)_10%,rgba(255,255,255,0.08)_55%,transparent)]" />
        <div
          ref={containerRef}
          className="chv-hide-scrollbar relative z-10 h-[52svh] snap-y snap-mandatory overflow-y-auto"
          style={{ paddingTop: topPad, paddingBottom: topPad }}
          aria-label="Portal navigation"
        >
          <div className="mx-auto flex max-w-sm flex-col gap-3">
            {HOME_PORTALS.map((item, index) => {
              const active = activeIndex === index;
              const sharedClassName =
                "group relative snap-center px-4 py-5 transition-transform duration-300";
              const innerClassName = [
                "relative flex min-h-[110px] items-center justify-between gap-5 rounded-[2rem] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-5",
                active ? "scale-[1.01] border-white/14" : "opacity-58",
              ].join(" ");

              const content = (
                <div className={innerClassName}>
                  <div className="absolute inset-y-4 left-[2.35rem] w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.26),transparent)]" />
                  <div className="relative pl-6">
                    <p className="chv-mobile-mono text-[0.56rem] uppercase tracking-[0.3em] text-white/34">
                      {item.sigil}
                    </p>
                    <h2 className="chv-mobile-display mt-2 text-[1.66rem] leading-[0.9] tracking-[-0.06em] text-[#f5efe8]">
                      {item.label}
                    </h2>
                    <p className="mt-2 text-[0.88rem] leading-6 text-white/48">{item.subtitle}</p>
                  </div>
                  <div className="relative flex flex-col items-end">
                    <span className="chv-mobile-mono text-[0.56rem] uppercase tracking-[0.28em] text-white/34">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="mt-4 block h-9 w-9 rounded-full border border-white/10"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${item.accent}bb 0%, transparent 58%)`,
                        boxShadow: active ? `0 0 26px ${item.accent}55` : "none",
                      }}
                    />
                  </div>
                </div>
              );

              return (
                <MobileRouteLink
                  key={item.href}
                  href={item.href}
                  accent={item.accent}
                  label={item.label}
                  ref={(node) => {
                    itemRefs.current[index] = node as HTMLElement | null;
                  }}
                  data-index={index}
                  aria-current={active ? "true" : undefined}
                  onPointerDown={() => setActiveIndex(index)}
                  className={sharedClassName}
                  style={{
                    transform: active ? "translateX(0px)" : `translateX(${index < activeIndex ? "-8px" : "8px"})`,
                  }}
                >
                  {content}
                </MobileRouteLink>
              );
            })}
          </div>
        </div>
      </section>
    </MobileRouteFrame>
  );
}
