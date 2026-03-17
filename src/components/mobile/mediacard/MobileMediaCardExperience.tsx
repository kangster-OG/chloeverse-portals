"use client";

import { useState } from "react";

import { MobileScaffold } from "@/components/mobile/shared/MobileScaffold";
import {
  MEDIACARD_AUDIENCE,
  MEDIACARD_COLLABS,
  MEDIACARD_METRICS,
  MEDIACARD_SERVICES,
} from "@/lib/mobile-content";

const TABS = ["audience", "metrics", "services", "collabs"] as const;
type MediaTab = (typeof TABS)[number];

export function MobileMediaCardExperience() {
  const [tab, setTab] = useState<MediaTab>("audience");

  return (
    <MobileScaffold
      currentPath="/mediacard"
      eyebrow="Luxury Briefing Object"
      title="Mediacard"
      description="The same mobile media-kit substance from desktop, reorganized into a premium handheld briefing."
    >
      <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] px-5 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.24),rgba(255,255,255,0)_30%),linear-gradient(180deg,rgba(111,173,255,0.15),rgba(255,255,255,0)_40%)]" />
        <div className="relative">
          <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-[radial-gradient(circle,rgba(243,248,255,0.94),rgba(185,221,255,0.34)_32%,rgba(255,255,255,0)_64%)] shadow-[0_28px_90px_rgba(138,182,255,0.26)]">
            <div className="h-24 w-24 rounded-full border border-white/28 bg-[radial-gradient(circle_at_32%_30%,rgba(255,255,255,0.78),rgba(159,205,255,0.08)_54%,rgba(255,255,255,0)_76%)]" />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {TABS.map((item) => {
              const active = tab === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={[
                    "rounded-full border px-4 py-2 text-[0.68rem] uppercase tracking-[0.26em] transition",
                    active ? "border-white/22 bg-white/14 text-white" : "border-white/10 bg-black/20 text-white/54",
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {tab === "audience" ? (
        <section className="mt-6 grid gap-3">
          {MEDIACARD_AUDIENCE.map((country) => (
            <div key={country} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-white/42">Market</p>
              <p className="mt-2 text-lg text-white">{country}</p>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "metrics" ? (
        <section className="mt-6 grid grid-cols-2 gap-3">
          {MEDIACARD_METRICS.map((metric) => (
            <div key={metric.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-white/42">{metric.label}</p>
              <p className="mt-3 text-xl font-medium text-white">{metric.value}</p>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "services" ? (
        <section className="mt-6 space-y-4">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-lg text-white">Brand Partnerships</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
              {MEDIACARD_SERVICES.brandPartnerships.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-lg text-white">Dining Partnerships</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
              {MEDIACARD_SERVICES.diningPartnerships.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {tab === "collabs" ? (
        <section className="mt-6 grid gap-3">
          {MEDIACARD_COLLABS.map((brand) => (
            <div key={brand} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-5">
              <p className="text-lg text-white">{brand}</p>
            </div>
          ))}
        </section>
      ) : null}
    </MobileScaffold>
  );
}
