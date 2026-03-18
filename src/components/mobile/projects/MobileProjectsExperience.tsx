"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { ProjectSignalVisual } from "@/components/mobile/shared/MobileArtifactVisuals";
import { MobileHoldButton } from "@/components/mobile/shared/MobileHoldButton";
import { MobileRitualSettle, useRitualReveal } from "@/components/mobile/shared/MobileRitualState";
import { MobileRouteFrame } from "@/components/mobile/shared/MobileRouteFrame";
import {
  PROJECT_DEVICE_APPS,
  PROJECT_REELS,
  formatProjectIndex,
  getProjectPathLabel,
  getProjectPermalinkToken,
  getProjectReelKind,
} from "@/lib/mobile-content";

const ACCENT = "#ff9d6f";

export function MobileProjectsExperience() {
  const ritual = useRitualReveal(false, 680);

  return (
    <MobileRouteFrame
      currentPath="/projects"
      eyebrow="Creator Relic"
      title="Projects"
      description="A handheld studio reel translated from the desktop portal into a filmic contact sheet. Every strip opens the original Instagram source."
      accent={ACCENT}
      ambient={
        <>
          <div className="absolute inset-y-0 right-[12%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,181,123,0.35),transparent)]" />
          <div className="absolute right-[-3rem] top-[14rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,153,92,0.22),transparent_68%)] blur-3xl" />
          <div className="absolute left-4 top-[17rem] h-32 w-32 rounded-full border border-white/6" />
        </>
      }
    >
      {ritual.stage === "idle" ? (
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0)_36%,rgba(255,148,77,0.08)_100%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.3em] text-white/46">
                    private device
                  </p>
                  <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/56">
                    Press and hold to unseal Chloe&apos;s project strip.
                  </p>
                </div>
                <div className="relative h-20 w-16 overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/40">
                  <div className="absolute inset-y-0 left-[0.35rem] w-[0.18rem] bg-[radial-gradient(circle,#ffd2bf_0%,rgba(255,210,191,0.2)_68%,transparent_100%)]" />
                  <div className="absolute inset-y-0 right-[0.35rem] w-[0.18rem] bg-[radial-gradient(circle,#ffd2bf_0%,rgba(255,210,191,0.2)_68%,transparent_100%)]" />
                </div>
              </div>

              <div className="mt-5">
                <MobileHoldButton
                  label="Unseal the reel"
                  hint="hold to unlock"
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
            key="projects-settle"
            accent={ACCENT}
            label="Creator device opening"
            detail="Contacts, cuts, and source strips are sliding into alignment."
          />
        ) : null}
      </AnimatePresence>

      {ritual.isRevealed ? (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <div className="flex flex-wrap gap-2">
            {PROJECT_DEVICE_APPS.map((app) => (
              <span
                key={app}
                className="chv-mobile-mono rounded-none border-b border-white/12 px-0 pb-1 pr-3 text-[0.54rem] uppercase tracking-[0.22em] text-white/38"
              >
                {app}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {PROJECT_REELS.map((reel, index) => (
              <article
                key={reel.id}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5"
              >
                <div className="absolute inset-y-0 left-2 flex flex-col justify-around py-5">
                  {Array.from({ length: 8 }).map((_, perforationIndex) => (
                    <span
                      key={perforationIndex}
                      className="block h-2.5 w-2.5 rounded-full border border-white/8 bg-black/70"
                    />
                  ))}
                </div>
                <div className="absolute inset-y-0 right-2 flex flex-col justify-around py-5">
                  {Array.from({ length: 8 }).map((_, perforationIndex) => (
                    <span
                      key={perforationIndex}
                      className="block h-2.5 w-2.5 rounded-full border border-white/8 bg-black/70"
                    />
                  ))}
                </div>

                <div className="relative mx-4">
                  <ProjectSignalVisual
                    seedKey={reel.permalink}
                    accent={ACCENT}
                    token={getProjectPermalinkToken(reel.permalink)}
                    kind={getProjectReelKind(reel.permalink)}
                  />
                </div>

                <div className="relative mt-5 flex items-center justify-between gap-4 px-4">
                  <p className="max-w-[13rem] text-sm leading-6 text-white/54">
                    @{reel.user} / {getProjectPathLabel(reel.permalink)} / cut {formatProjectIndex(index)}
                  </p>
                  <Link
                    href={reel.permalink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="chv-mobile-mono inline-flex items-center rounded-full border border-white/10 bg-white/8 px-4 py-3 text-[0.6rem] uppercase tracking-[0.28em] text-white"
                  >
                    Open source
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </motion.section>
      ) : null}
    </MobileRouteFrame>
  );
}
