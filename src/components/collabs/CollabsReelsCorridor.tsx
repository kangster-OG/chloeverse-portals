"use client";

import { useEffect, useMemo, useRef } from "react";

export type ReelItem = {
  id: string;
  title: string;
  url: string;
};

const FRAME_ANCHOR_NAMES = [
  "ANCHOR_FRAME_01",
  "ANCHOR_FRAME_02",
  "ANCHOR_FRAME_03",
  "ANCHOR_FRAME_04",
  "ANCHOR_FRAME_05",
] as const;

export const REELS: ReelItem[] = [
  { id: "DQukZZpjrpu", title: "Adobe", url: "https://www.instagram.com/p/DQukZZpjrpu/" },
  { id: "DUjezQzjpYx", title: "OpenAI", url: "https://www.instagram.com/reel/DUjezQzjpYx/" },
  { id: "DTRjg4rkcIT", title: "Ume - Williamsburg", url: "https://www.instagram.com/p/DTRjg4rkcIT/" },
  { id: "DT14hYEDq__", title: "Beauty/fashion", url: "https://www.instagram.com/p/DT14hYEDq__/" },
  { id: "DPEZ7PfERdU", title: "Adidas", url: "https://www.instagram.com/p/DPEZ7PfERdU/" },
];

export default function CollabsReelsCorridor({
  smokeAction,
  anchorDepthByName,
  onSelectFrame,
}: {
  smokeAction?: string | null;
  anchorDepthByName?: Partial<Record<(typeof FRAME_ANCHOR_NAMES)[number], number>>;
  onSelectFrame: (index: number) => void;
}) {
  const corridorRef = useRef<HTMLDivElement | null>(null);
  const frameRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (smokeAction !== "open-frame") return;
    const timer = window.setTimeout(() => {
      onSelectFrame(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [onSelectFrame, smokeAction]);

  useEffect(() => {
    const root = corridorRef.current;
    if (!root) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      root.scrollBy({ top: event.deltaY, behavior: "auto" });
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  const reelsForDepth = useMemo(
    () =>
      REELS.map((reel, index) => {
        const anchorName = FRAME_ANCHOR_NAMES[index];
        const z = anchorDepthByName?.[anchorName] ?? index * 120;
        return { reel, index, z, anchorName };
      }),
    [anchorDepthByName],
  );

  return (
    <>
      <section
        data-collabs-ui="reels-gallery"
        className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_12%,rgba(157,190,255,0.14),rgba(0,0,0,0)_52%),linear-gradient(180deg,rgba(2,5,9,0.65)_0%,rgba(0,0,0,0.86)_100%)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 px-8 pt-10">
          <p className="text-xs uppercase tracking-[0.24em] text-white/65">Collabs</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Reels Corridor</h1>
        </div>

        <div ref={corridorRef} className="relative h-full overflow-y-auto chv-hide-scrollbar" data-collabs-marker="reels-corridor">
          <div className="mx-auto h-[220vh] max-w-6xl px-6 pb-28 pt-32 [perspective:1300px]">
            <div className="mx-auto w-full max-w-2xl space-y-10">
              {reelsForDepth.map(({ reel, index, anchorName }) => (
                <button
                  key={reel.id}
                  data-collabs-anchor={anchorName}
                  ref={(node) => {
                    frameRefs.current[index] = node;
                  }}
                  type="button"
                  onClick={() => {
                    if (process.env.NODE_ENV !== "production") {
                      console.log("frame click", index);
                    }
                    onSelectFrame(index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    if (process.env.NODE_ENV !== "production") {
                      console.log("frame click", index);
                    }
                    onSelectFrame(index);
                  }}
                  aria-label={`Open ${reel.title} reel`}
                  className="group relative block h-44 w-full cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(180deg,rgba(17,22,31,0.9),rgba(7,10,15,0.95))] text-left transition hover:border-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 sm:h-52"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(158,194,255,0.25),rgba(0,0,0,0)_68%)] opacity-80 transition group-hover:opacity-100" />
                  <div className="relative flex h-full items-end p-5 sm:p-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">Frame {index + 1}</p>
                      <p className="mt-2 text-lg font-semibold text-white sm:text-xl">{reel.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
