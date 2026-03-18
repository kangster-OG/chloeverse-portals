"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

function hashValue(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sample(seed: number, step: number): number {
  const value = Math.sin(seed * 0.00037 + step * 17.133 + 0.73) * 43758.5453123;
  return value - Math.floor(value);
}

function brandLogoForTitle(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("adobe")) return "/mediacard/logos/adobe.png";
  if (normalized.includes("openai")) return "/mediacard/logos/openai.png";
  if (normalized.includes("adidas")) return "/mediacard/logos/adidas.png";
  return null;
}

export function ProjectSignalVisual({
  seedKey,
  accent,
  token,
  kind,
}: {
  seedKey: string;
  accent: string;
  token: string;
  kind: string;
}) {
  const seed = hashValue(seedKey);
  const bars = Array.from({ length: 22 }, (_, index) => {
    const amp = 18 + Math.round(sample(seed, index) * 72);
    return { index, amp };
  });

  return (
    <div className="relative min-h-[14.4rem] overflow-hidden rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,#17120d_0%,#080809_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_34%,rgba(255,170,124,0.12))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute inset-y-4 left-4 right-4 border border-white/5" />
      <div className="absolute bottom-0 left-0 right-0 h-[42%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.42))]" />
      <div className="relative flex min-h-[14.4rem] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="chv-mobile-mono text-[0.52rem] uppercase tracking-[0.26em]" style={{ color: `${accent}cc` }}>
              source cut
            </p>
            <h3 className="chv-mobile-display mt-3 text-[2.15rem] leading-[0.86] tracking-[-0.06em] text-[#f8efe6]">
              {kind}
            </h3>
          </div>
          <p className="chv-mobile-mono max-w-[6rem] text-right text-[0.52rem] uppercase tracking-[0.24em] text-white/34">
            live source
          </p>
        </div>

        <div className="mt-6 flex items-end gap-[5px]">
          {bars.map((bar) => (
            <span
              key={bar.index}
              className="block w-[8px] rounded-t-full"
              style={{
                height: `${bar.amp}px`,
                background: `linear-gradient(180deg, ${accent}, rgba(255,255,255,0.12))`,
                opacity: 0.92 - bar.index * 0.018,
              }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
          <div>
            <p className="chv-mobile-mono text-[0.5rem] uppercase tracking-[0.22em] text-white/34">
              signal id
            </p>
            <p className="mt-2 break-all text-sm text-[#ffd9c6]">{token}</p>
          </div>
          <SignalDisc accent={accent} seed={seed} />
        </div>
      </div>
    </div>
  );
}

export function CollabPosterVisual({
  title,
  accent,
  medium,
}: {
  title: string;
  accent: string;
  medium: string;
}) {
  const seed = hashValue(title);
  const points = Array.from({ length: 6 }, (_, index) => ({
    x: 18 + Math.round(sample(seed, index + 1) * 64),
    y: 18 + Math.round(sample(seed, index + 9) * 54),
  }));
  const logoSrc = brandLogoForTitle(title);

  return (
    <div className="relative min-h-[20.5rem] overflow-hidden rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,#0d1220_0%,#040609_100%)] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(183,206,255,0.28),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)_28%)]" />
      <div className="absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.16),transparent)]" />
      <div className="absolute left-1/2 top-[16%] h-[58%] w-16 -translate-x-1/2 rounded-full blur-2xl" style={{ background: `radial-gradient(circle, ${accent}aa 0%, transparent 72%)` }} />
      <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d={`M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.35"
        />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="1.05" fill={accent} />
        ))}
      </svg>

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.3em] text-[#c7d3ff]/62">
              exhibition plate
            </p>
            <h3 className="chv-mobile-display mt-3 max-w-[12rem] text-[2rem] leading-[0.9] tracking-[-0.06em] text-[#f4eef1]">
              {title}
            </h3>
          </div>
          <p className="chv-mobile-mono max-w-[6rem] text-right text-[0.52rem] uppercase tracking-[0.22em] text-white/34">
            {medium}
          </p>
        </div>

        <div className="mt-10 flex flex-1 items-center justify-center">
          {logoSrc ? (
            <div className="rounded-[1.2rem] border border-white/8 bg-black/22 px-6 py-4">
              <Image
                src={logoSrc}
                alt={title}
                width={140}
                height={54}
                sizes="140px"
                className="h-10 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="rounded-[1.3rem] border border-white/8 bg-black/24 px-5 py-4 text-center">
              <div className="chv-mobile-display text-[2rem] leading-none tracking-[-0.06em] text-white/20">
                {title}
              </div>
              <div className="mt-2 h-px w-24 bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            </div>
          )}
        </div>

        <div className="mt-6 max-w-[14rem]">
          <p className="text-sm leading-6 text-white/58">
            Curated collaborator entry with a direct handoff to the original published piece.
          </p>
        </div>
      </div>
    </div>
  );
}

function SignalDisc({ accent, seed }: { accent: string; seed: number }) {
  const rings = Array.from({ length: 3 }, (_, index) => 42 + Math.round(sample(seed, index + 50) * 24) + index * 10);
  return (
    <div className="relative h-16 w-16">
      {rings.map((ring, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8"
          style={{
            width: `${ring}px`,
            height: `${ring}px`,
          }}
        />
      ))}
      <span
        className="absolute left-1/2 top-1/2 block h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 72%)` }}
      />
    </div>
  );
}

export function ArtifactPanel({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      style={{ ["--artifact-accent" as string]: accent } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_34%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
