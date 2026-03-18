"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { MobileHoldButton } from "@/components/mobile/shared/MobileHoldButton";
import { MobileRitualSettle, useRitualReveal } from "@/components/mobile/shared/MobileRitualState";
import { MobileRouteFrame } from "@/components/mobile/shared/MobileRouteFrame";
import {
  WORK_ENTRIES,
  WORK_HIGHLIGHTS,
  WORK_INTRO_COPY,
  WORK_ROLE_STACK,
} from "@/lib/mobile-content";

const WORK_TABS = ["ABOUT", "TIMELINE", "WINS", "CV"] as const;
type WorkTab = (typeof WORK_TABS)[number];

const ACCENT = "#8fe7ad";

export function MobileWorkExperience() {
  const [tab, setTab] = useState<WorkTab>("ABOUT");
  const ritual = useRitualReveal(false, 700);

  const cvRows = useMemo(
    () =>
      WORK_ENTRIES.map((entry) => ({
        title: entry.title,
        date: entry.date,
        meta: [entry.location, entry.type].filter(Boolean).join(" / "),
      })),
    [],
  );

  return (
    <MobileRouteFrame
      currentPath="/work"
      eyebrow="Pocket Archive"
      title="Work"
      description="A prestige dossier distilled from the desktop archive: real roles, dates, highlights, and the operating record behind the Chloeverse."
      accent={ACCENT}
      ambient={
        <>
          <div className="absolute inset-y-0 right-[14%] w-px bg-[linear-gradient(180deg,transparent,rgba(135,255,184,0.34),transparent)]" />
          <div className="absolute left-[-4rem] top-[14rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(121,255,171,0.16),transparent_70%)] blur-3xl" />
        </>
      }
    >
      {ritual.stage === "idle" ? (
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#8fe7ad]/12 bg-[#07110c]/82 p-5 text-[#d7ffe4]">
            <div className="absolute inset-0 chv-mobile-scanlines opacity-30" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.3em] text-[#8fe7ad]/68">
                    archive seal
                  </p>
                  <p className="mt-3 max-w-[16rem] text-sm leading-6 text-[#d7ffe4]/60">
                    Hold to declassify the blackbook dossier.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8fe7ad]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8fe7ad]/44" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8fe7ad]/22" />
                </div>
              </div>

              <div className="mt-5">
                <MobileHoldButton
                  label="Open dossier"
                  hint="hold to decrypt"
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
            key="work-settle"
            accent={ACCENT}
            label="Archive opening"
            detail="Field records, timeline cuts, and wins are dropping into the dossier rail."
          />
        ) : null}
      </AnimatePresence>

      {ritual.isRevealed ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <section className="relative overflow-hidden rounded-[2rem] border border-[#8fe7ad]/16 bg-[linear-gradient(180deg,rgba(12,30,20,0.96),rgba(4,10,7,0.96))] p-5 text-[#dbffe7] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="absolute inset-0 chv-mobile-scanlines opacity-24" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(143,231,173,0.12),transparent_44%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="chv-mobile-mono text-[0.56rem] uppercase tracking-[0.28em] text-[#97f0b4]/76">
                  field record
                </p>
                <h2 className="chv-mobile-display mt-3 text-[2.4rem] leading-[0.88] tracking-[-0.06em] text-[#edf8f0]">
                  Chloe Kang
                </h2>
              </div>
              <div className="chv-mobile-mono text-right text-[0.52rem] uppercase tracking-[0.22em] text-[#97f0b4]/60">
                <p>node</p>
                <p className="mt-1">03</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {WORK_ROLE_STACK.map((role) => (
                <span key={role} className="chv-mobile-mono border border-[#8fe7ad]/18 bg-[#132219] px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.22em] text-[#e1ffee]/76">
                  {role}
                </span>
              ))}
            </div>
            <p className="mt-4 max-w-[18rem] text-sm leading-6 text-[#e4fced]/76">{WORK_INTRO_COPY}</p>
          </section>

          <section className="mt-6">
            <div className="chv-hide-scrollbar flex gap-2 overflow-x-auto pb-2">
              {WORK_TABS.map((item) => {
                const active = item === tab;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={[
                      "relative overflow-hidden chv-mobile-mono min-w-[5.9rem] border px-3 py-3 text-left text-[0.58rem] uppercase tracking-[0.24em] transition",
                      active
                        ? "border-[#8fe7ad]/30 bg-[#13271b] text-[#effff4]"
                        : "border-white/10 bg-black/26 text-white/52",
                    ].join(" ")}
                    style={{
                      clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
                    }}
                  >
                    {active ? (
                      <motion.span
                        layoutId="work-tab-indicator"
                        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(143,231,173,0.16),rgba(19,39,27,0.92))]"
                        transition={{ type: "spring", stiffness: 240, damping: 26 }}
                      />
                    ) : null}
                    {item}
                  </button>
                );
              })}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {tab === "ABOUT" ? (
              <motion.section
                key="work-about"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 space-y-4"
              >
                {WORK_ENTRIES.slice(0, 3).map((entry) => (
                  <article
                    key={entry.title}
                    className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-[linear-gradient(180deg,rgba(143,231,173,0.9),transparent)]" />
                    <p className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.28em] text-[#8fe7ad]/68">
                      {entry.date}
                    </p>
                    <h3 className="chv-mobile-display mt-3 text-[1.7rem] leading-[0.95] tracking-[-0.05em] text-[#f2eee8]">
                      {entry.title}
                    </h3>
                    <p className="mt-3 text-sm text-white/58">{entry.location}</p>
                    {entry.type ? <p className="mt-1 text-sm text-white/48">{entry.type}</p> : null}
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-white/76">
                      {entry.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </motion.section>
            ) : null}

            {tab === "TIMELINE" ? (
              <motion.section
                key="work-timeline"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 space-y-4"
              >
                {WORK_ENTRIES.map((entry, index) => (
                  <article key={entry.title} className="grid grid-cols-[2.2rem_1fr] gap-3">
                    <div className="flex flex-col items-center pt-2">
                      <span className="h-3 w-3 rounded-full border border-[#8fe7ad]/45 bg-[#8fe7ad]/30" />
                      {index < WORK_ENTRIES.length - 1 ? <span className="mt-2 w-px flex-1 bg-[#8fe7ad]/18" /> : null}
                    </div>
                    <div className="rounded-[1.6rem] border border-white/10 bg-black/24 p-4">
                      <h3 className="chv-mobile-display text-[1.45rem] leading-[0.94] tracking-[-0.05em] text-[#f0ebe4]">
                        {entry.title}
                      </h3>
                      <p className="chv-mobile-mono mt-3 text-[0.52rem] uppercase tracking-[0.24em] text-[#8fe7ad]/62">
                        {entry.date}
                      </p>
                      <p className="mt-3 text-sm text-white/54">{entry.location}</p>
                      {entry.type ? <p className="mt-1 text-sm text-white/44">{entry.type}</p> : null}
                      <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
                        {entry.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </motion.section>
            ) : null}

            {tab === "WINS" ? (
              <motion.section
                key="work-wins"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 grid gap-3"
              >
                {WORK_HIGHLIGHTS.map((item, index) => (
                  <div
                    key={item}
                    className="relative overflow-hidden rounded-[1.5rem] border border-[#8fe7ad]/10 bg-[linear-gradient(180deg,rgba(12,24,17,0.8),rgba(5,10,7,0.9))] px-4 py-4"
                  >
                    <p className="chv-mobile-mono text-[0.52rem] uppercase tracking-[0.24em] text-[#8fe7ad]/54">
                      win {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#dcffe8]/78">{item}</p>
                  </div>
                ))}
              </motion.section>
            ) : null}

            {tab === "CV" ? (
              <motion.section
                key="work-cv"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/26"
              >
                <div className="grid grid-cols-[1.3fr_0.95fr] gap-3 border-b border-white/8 px-4 py-3">
                  <span className="chv-mobile-mono text-[0.52rem] uppercase tracking-[0.22em] text-white/40">Role</span>
                  <span className="chv-mobile-mono text-[0.52rem] uppercase tracking-[0.22em] text-white/40">Date</span>
                </div>
                <div className="divide-y divide-white/8">
                  {cvRows.map((row) => (
                    <div key={row.title} className="grid grid-cols-[1.3fr_0.95fr] gap-3 px-4 py-4">
                      <div>
                        <p className="text-sm text-[#f0ebe4]">{row.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/50">{row.meta}</p>
                      </div>
                      <p className="text-sm text-white/68">{row.date}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>
        </motion.section>
      ) : null}
    </MobileRouteFrame>
  );
}
