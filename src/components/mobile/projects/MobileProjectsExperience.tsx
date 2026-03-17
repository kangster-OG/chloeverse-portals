"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import { MobileScaffold } from "@/components/mobile/shared/MobileScaffold";
import { PROJECT_DEVICE_APPS, PROJECT_REELS, getProjectReelKind } from "@/lib/mobile-content";

export function MobileProjectsExperience() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <MobileScaffold
      currentPath="/projects"
      eyebrow="Pocket Creator Device"
      title="Projects"
      description="A handheld archive of the same project reel stream from desktop, translated into a touch-native creator device."
    >
      {!unlocked ? (
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(156,199,255,0.18),rgba(255,255,255,0)_38%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
            <div className="relative">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/46">Unlock ritual</p>
              <div className="mt-6 flex items-center justify-center">
                <div className="grid h-40 w-40 place-items-center rounded-[2.25rem] border border-white/12 bg-black/30 shadow-[0_24px_90px_rgba(92,130,255,0.25)]">
                  <div className="relative h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.94),rgba(190,220,255,0.28)_38%,rgba(255,255,255,0)_70%)]">
                    <div className="absolute inset-[-0.85rem] rounded-full border border-cyan-100/18" />
                  </div>
                </div>
              </div>
              <p className="mt-6 text-center text-sm leading-6 text-white/66">
                Tap to open Chloe&apos;s creator device. The feed below keeps the same Instagram project posts and reels from the desktop route.
              </p>
              <button
                type="button"
                onClick={() => setUnlocked(true)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/14 bg-white/10 px-5 py-4 text-[0.76rem] uppercase tracking-[0.3em] text-white"
              >
                Enter device
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <motion.section
        initial={false}
        animate={{ opacity: unlocked ? 1 : 0.45, y: unlocked ? 0 : 12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 space-y-5"
      >
        <div className="flex flex-wrap gap-2">
          {PROJECT_DEVICE_APPS.map((app) => (
            <span
              key={app}
              className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.22em] text-white/62"
            >
              {app}
            </span>
          ))}
        </div>

        {PROJECT_REELS.map((reel, index) => (
          <article
            key={reel.id}
            className="overflow-hidden rounded-[1.85rem] border border-white/10 bg-white/[0.06]"
          >
            <div className="relative h-48 overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(145,190,255,0.28),rgba(255,255,255,0)_40%),linear-gradient(180deg,#151927_0%,#0c1019_100%)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_34%,rgba(255,255,255,0.05)_100%)]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-cyan-100/70">
                    {getProjectReelKind(reel.permalink)}
                  </p>
                  <p className="mt-3 font-[var(--font-head)] text-3xl tracking-[-0.08em] text-white">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/45">Source</p>
                  <h2 className="mt-2 text-lg font-medium text-white">@{reel.user}</h2>
                </div>
                <Link
                  href={reel.permalink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.64rem] uppercase tracking-[0.24em] text-white"
                >
                  Open
                </Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/62">{reel.caption}</p>
              <p className="mt-4 break-all text-xs leading-5 text-cyan-100/58">{reel.permalink}</p>
            </div>
          </article>
        ))}
      </motion.section>
    </MobileScaffold>
  );
}
