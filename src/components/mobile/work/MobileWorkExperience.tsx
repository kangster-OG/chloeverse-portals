"use client";

import { useMemo, useState } from "react";

import { MobileScaffold } from "@/components/mobile/shared/MobileScaffold";
import {
  WORK_ENTRIES,
  WORK_HIGHLIGHTS,
  WORK_INTRO_COPY,
  WORK_ROLE_STACK,
} from "@/lib/mobile-content";

const WORK_TABS = ["ABOUT", "TIMELINE", "WINS", "CV"] as const;
type WorkTab = (typeof WORK_TABS)[number];

export function MobileWorkExperience() {
  const [tab, setTab] = useState<WorkTab>("ABOUT");

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
    <MobileScaffold
      currentPath="/work"
      eyebrow="Chlo-Linux 1.0 LTS"
      title="Work"
      description="The same work archive from the retro desktop route, rebuilt as a thumb-friendly dossier instead of a mobile iframe."
    >
      <section className="overflow-hidden rounded-[2rem] border border-[#8fffbe]/15 bg-[#07110c]/88 p-5 text-[#c9ffd8] shadow-[0_24px_90px_rgba(80,255,154,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.66rem] uppercase tracking-[0.3em] text-[#89f4a7]/75">booted</p>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#79ffab]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#79ffab]/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#79ffab]/20" />
          </div>
        </div>
        <h2 className="mt-4 font-mono text-[1.65rem] leading-[1.05] tracking-[-0.04em]">Hi, I&apos;m Chloe</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {WORK_ROLE_STACK.map((role) => (
            <span key={role} className="rounded-full border border-[#8fffbe]/20 bg-[#0f1b16] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[#c9ffd8]/76">
              {role}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-[#c9ffd8]/72">{WORK_INTRO_COPY}</p>
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
                  "rounded-full border px-4 py-2 text-[0.68rem] uppercase tracking-[0.24em] transition",
                  active
                    ? "border-[#8fffbe]/30 bg-[#112017] text-[#d9ffe3]"
                    : "border-white/10 bg-white/[0.05] text-white/56",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {tab === "ABOUT" ? (
        <section className="mt-6 space-y-4">
          {WORK_ENTRIES.slice(0, 3).map((entry) => (
            <article key={entry.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-[0.66rem] uppercase tracking-[0.26em] text-[#8fffbe]/72">{entry.date}</p>
              <h3 className="mt-3 text-xl font-medium text-white">{entry.title}</h3>
              <p className="mt-2 text-sm text-white/54">{entry.location}</p>
              {entry.type ? <p className="mt-1 text-sm text-white/54">{entry.type}</p> : null}
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "TIMELINE" ? (
        <section className="mt-6 space-y-4">
          {WORK_ENTRIES.map((entry) => (
            <article key={entry.title} className="rounded-[1.55rem] border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium text-white">{entry.title}</h3>
                  <p className="mt-1 text-sm text-white/56">{entry.date}</p>
                </div>
                {entry.type ? (
                  <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.2em] text-white/56">
                    {entry.type}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-white/56">{entry.location}</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "WINS" ? (
        <section className="mt-6 grid gap-3">
          {WORK_HIGHLIGHTS.map((item) => (
            <div key={item} className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-white/74">
              {item}
            </div>
          ))}
        </section>
      ) : null}

      {tab === "CV" ? (
        <section className="mt-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/22">
          <div className="grid grid-cols-[1.2fr_0.9fr] gap-3 border-b border-white/8 px-4 py-3 text-[0.64rem] uppercase tracking-[0.24em] text-white/45">
            <span>Role</span>
            <span>Date</span>
          </div>
          <div className="divide-y divide-white/8">
            {cvRows.map((row) => (
              <div key={row.title} className="grid grid-cols-[1.2fr_0.9fr] gap-3 px-4 py-4">
                <div>
                  <p className="text-sm text-white">{row.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">{row.meta}</p>
                </div>
                <p className="text-sm text-white/72">{row.date}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </MobileScaffold>
  );
}
