"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { REELS } from "@/components/collabs/reelsData";
import { CollabPosterVisual } from "@/components/mobile/shared/MobileArtifactVisuals";
import { MobileHoldButton } from "@/components/mobile/shared/MobileHoldButton";
import { MobileRitualSettle, useRitualReveal } from "@/components/mobile/shared/MobileRitualState";
import { MobileRouteFrame } from "@/components/mobile/shared/MobileRouteFrame";
import { getCollabMediumLabel } from "@/lib/mobile-content";

const ACCENT = "#89a7ff";

export function MobileCollabsExperience({ skipIntro = false }: { skipIntro?: boolean }) {
  const ritual = useRitualReveal(skipIntro, 620);

  return (
    <MobileRouteFrame
      currentPath={skipIntro ? "/collabs/reels" : "/collabs"}
      eyebrow="Threshold Archive"
      title={skipIntro ? "Collabs Reels" : "Collabs"}
      description="A curated installation of collaboration portals. Each plate opens the original destination without the desktop free-look world."
      accent={ACCENT}
      ambient={
        <>
          <div className="absolute left-1/2 top-[11rem] h-[26rem] w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(159,189,255,0.56),transparent)] blur-[0.5px]" />
          <div className="absolute left-1/2 top-[10rem] h-[24rem] w-8 -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.42),rgba(255,255,255,0.06)_26%,transparent_68%)] blur-2xl" />
          <div className="absolute right-[-5rem] top-[14rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(111,138,255,0.22),transparent_68%)] blur-3xl" />
        </>
      }
    >
      {ritual.stage === "idle" ? (
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/36 p-5">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_46%)]" />
            <div className="relative">
              <div className="mx-auto h-52 w-[4.25rem] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.0))] p-[1px]">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-black/78">
                  <div className="absolute left-1/2 top-3 bottom-3 w-[1px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(170,197,255,0.92),rgba(255,255,255,0.08))]" />
                  <div className="absolute left-1/2 top-1/2 h-28 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.72),rgba(176,202,255,0.12)_42%,transparent_70%)] blur-xl" />
                </div>
              </div>

              <p className="mt-6 max-w-[18rem] text-sm leading-6 text-white/56">
                Hold the seam until it blooms, then step into the collaboration installation.
              </p>
              <div className="mt-5">
                <MobileHoldButton
                  label="Cross the threshold"
                  hint="hold at the seam"
                  accent={ACCENT}
                  onComplete={() => ritual.trigger()}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <AnimatePresence mode="wait">
        {ritual.isSettling ? (
          <MobileRitualSettle
            key="collabs-settle"
            accent={ACCENT}
            label="Threshold crossing"
            detail="The installation is brightening and the exhibition plates are stepping forward."
          />
        ) : null}
      </AnimatePresence>

      {ritual.isRevealed ? (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 space-y-5"
        >
          {REELS.map((item, index) => (
            <article
              key={item.id}
              className="relative overflow-hidden rounded-[2.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4"
            >
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_34%,rgba(120,149,255,0.1)_100%)]" />
              <div className="relative">
                <CollabPosterVisual
                  title={item.title}
                  accent={ACCENT}
                  medium={getCollabMediumLabel(item.url)}
                />
              </div>

              <div className="relative mt-4 flex items-center justify-between gap-4 px-2">
                <p className="chv-mobile-mono text-[0.52rem] uppercase tracking-[0.24em] text-white/36">
                  portal {String(index + 1).padStart(2, "0")}
                </p>
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="chv-mobile-mono inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-3 text-[0.6rem] uppercase tracking-[0.28em] text-white"
                >
                  Enter source
                </Link>
              </div>
            </article>
          ))}
        </motion.section>
      ) : null}
    </MobileRouteFrame>
  );
}
