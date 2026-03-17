"use client";

import Link from "next/link";
import { useState } from "react";

import { MobileScaffold } from "@/components/mobile/shared/MobileScaffold";
import { CONTACT_DETAILS } from "@/lib/mobile-content";

export function MobileContactExperience() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = [
    { label: "Instagram", href: CONTACT_DETAILS.instagram },
    { label: "TikTok", href: CONTACT_DETAILS.tiktok },
    { label: "LinkedIn", href: CONTACT_DETAILS.linkedin },
    { label: "X", href: CONTACT_DETAILS.x },
    { label: "Candy Castle", href: CONTACT_DETAILS.candy },
  ];

  return (
    <MobileScaffold
      currentPath="/contact"
      eyebrow="Send Signal"
      title="Contact"
      description="A lighter transmission ritual that preserves the real outbound actions from the desktop mission."
    >
      {!open ? (
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(180,226,255,0.18),rgba(255,255,255,0)_34%),linear-gradient(180deg,rgba(92,132,255,0.12),rgba(255,255,255,0))]" />
            <div className="relative">
              <div className="mx-auto mt-4 grid h-44 w-44 place-items-center rounded-full border border-white/12 bg-black/20 shadow-[0_24px_90px_rgba(110,166,255,0.2)]">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.94),rgba(190,226,255,0.26)_44%,rgba(255,255,255,0)_72%)]" />
              </div>
              <p className="mt-6 text-center text-sm leading-6 text-white/68">
                Tap once to open the transmission card, then choose email or one of Chloe&apos;s live channels.
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/14 bg-white/10 px-5 py-4 text-[0.76rem] uppercase tracking-[0.3em] text-white"
              >
                Open transmission
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[2rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-xl">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/46">Beacon card</p>
        <h2 className="mt-3 text-2xl font-medium text-white">{CONTACT_DETAILS.name}</h2>
        <p className="mt-2 break-all text-sm leading-6 text-cyan-100/76">{CONTACT_DETAILS.email}</p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <Link
            href={`mailto:${CONTACT_DETAILS.email}`}
            className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/12 px-5 py-4 text-[0.72rem] uppercase tracking-[0.28em] text-white"
          >
            Email Chloe
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(CONTACT_DETAILS.email);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              } catch {
                window.location.href = `mailto:${CONTACT_DETAILS.email}`;
              }
            }}
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-black/25 px-5 py-4 text-[0.72rem] uppercase tracking-[0.28em] text-white/76"
          >
            {copied ? "Email copied" : "Copy email"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-center text-[0.68rem] uppercase tracking-[0.24em] text-white/72"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </MobileScaffold>
  );
}
