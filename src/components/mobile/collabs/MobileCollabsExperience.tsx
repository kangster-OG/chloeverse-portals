"use client";

import Link from "next/link";
import { useState } from "react";

import { MobileScaffold } from "@/components/mobile/shared/MobileScaffold";
import { REELS } from "@/components/collabs/reelsData";
import { getCollabBrandLabel } from "@/lib/mobile-content";

export function MobileCollabsExperience({ skipIntro = false }: { skipIntro?: boolean }) {
  const [entered, setEntered] = useState(skipIntro);

  return (
    <MobileScaffold
      currentPath={skipIntro ? "/collabs/reels" : "/collabs"}
      eyebrow="Threshold Archive"
      title={skipIntro ? "Collabs Reels" : "Collabs"}
      description="A lighter mobile portal that keeps the same collaboration showcase while replacing desktop free-look with a guided touch-native entry."
    >
      {!entered ? (
        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.16),rgba(255,255,255,0)_34%),linear-gradient(180deg,rgba(96,156,255,0.15),rgba(5,7,17,0)_42%)]" />
            <div className="relative">
              <div className="mx-auto mt-4 h-52 w-40 rounded-[1.5rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] p-3 shadow-[0_25px_80px_rgba(125,168,255,0.22)]">
                <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-cyan-100/18 bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(219,235,255,0.32)_36%,rgba(255,255,255,0)_68%)]" />
              </div>
              <p className="mt-6 text-center text-sm leading-6 text-white/66">
                Tap once to cross the threshold. Direct visits to reels skip this ritual and open the showcase immediately.
              </p>
              <button
                type="button"
                onClick={() => setEntered(true)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/14 bg-white/10 px-5 py-4 text-[0.76rem] uppercase tracking-[0.3em] text-white"
              >
                Enter collabs
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 space-y-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/45">Showcase</p>
              <p className="mt-2 text-sm leading-6 text-white/66">Same collaborators and Instagram destinations as the desktop reels flow.</p>
            </div>
            <Link
              href="https://imchloekang.com"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.64rem] uppercase tracking-[0.24em] text-white"
            >
              Candy Castle
            </Link>
          </div>
        </div>

        <div className="chv-hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {REELS.map((item, index) => (
            <article
              key={item.id}
              className="min-w-[84%] snap-center overflow-hidden rounded-[1.85rem] border border-white/10 bg-white/[0.06]"
            >
              <div className="relative h-64 overflow-hidden bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.24),rgba(255,255,255,0)_38%),linear-gradient(180deg,#111b2f_0%,#081019_100%)]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_48%,rgba(255,255,255,0.03))]" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-100/72">Portal {String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 font-[var(--font-head)] text-[1.8rem] leading-[1.02] tracking-[-0.06em] text-white">
                    {getCollabBrandLabel(item)}
                  </h2>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-6 text-white/66">
                  Open the original collaboration reel on Instagram.
                </p>
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.66rem] uppercase tracking-[0.24em] text-white"
                >
                  View on Instagram
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MobileScaffold>
  );
}
