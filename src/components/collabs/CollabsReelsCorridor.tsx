"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOTTOM_CAP_H,
  CollabsInstagramEmbedRuntime,
  InstagramProjectsEmbed,
  MODAL_CROP_VISIBLE,
  TOP_CAP_H,
} from "@/components/collabs/InstagramProjectsEmbed";

type ReelItem = {
  id: string;
  title: string;
  url: string;
};

const REELS: ReelItem[] = [
  { id: "DQukZZpjrpu", title: "Adobe", url: "https://www.instagram.com/p/DQukZZpjrpu/" },
  { id: "DUjezQzjpYx", title: "OpenAI", url: "https://www.instagram.com/reel/DUjezQzjpYx/" },
  { id: "DTRjg4rkcIT", title: "Ume - Williamsburg", url: "https://www.instagram.com/p/DTRjg4rkcIT/" },
  { id: "DT14hYEDq__", title: "Beauty/fashion", url: "https://www.instagram.com/p/DT14hYEDq__/" },
  { id: "DPEZ7PfERdU", title: "Adidas", url: "https://www.instagram.com/p/DPEZ7PfERdU/" },
];

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function CollabsReelsCorridor({
  smokeAction,
}: {
  smokeAction?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [modalEmbedReady, setModalEmbedReady] = useState(false);
  const [modalUserInteracted, setModalUserInteracted] = useState(false);

  const corridorRef = useRef<HTMLDivElement | null>(null);
  const frameRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const priorFocusRef = useRef<HTMLElement | null>(null);

  const activeItem = activeIndex === null ? null : (REELS[activeIndex] ?? null);
  const modalOpen = Boolean(activeItem);

  const closeModal = () => {
    setActiveIndex(null);
  };

  useEffect(() => {
    if (smokeAction !== "open-frame") return;
    const timer = window.setTimeout(() => {
      frameRefs.current[0]?.click();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [smokeAction]);

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

  useEffect(() => {
    if (!modalOpen) return;

    priorFocusRef.current = document.activeElement as HTMLElement | null;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      priorFocusRef.current?.focus();
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      const root = modalRef.current;
      if (!root) return;

      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.tabIndex !== -1 &&
          element.offsetParent !== null,
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (current === first || !root.contains(current))) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const reelsForDepth = useMemo(
    () =>
      REELS.map((reel, index) => {
        const z = index * 120;
        return { reel, index, z };
      }),
    [],
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
              {reelsForDepth.map(({ reel, index, z }) => (
                <button
                  key={reel.id}
                  ref={(node) => {
                    frameRefs.current[index] = node;
                  }}
                  type="button"
                  onClick={() => {
                    setModalEmbedReady(false);
                    setModalUserInteracted(false);
                    setActiveIndex(index);
                  }}
                  aria-label={`Open ${reel.title} reel`}
                  className="group relative block h-44 w-full overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(180deg,rgba(17,22,31,0.9),rgba(7,10,15,0.95))] text-left transition hover:border-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 sm:h-52"
                  style={{ transform: `translateZ(-${z}px)` }}
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

      {modalOpen && activeItem ? (
        <>
          <CollabsInstagramEmbedRuntime />
          <div
            data-collabs-modal="open"
            className="fixed inset-0 z-50 bg-black/90 p-4 md:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collabs-reels-modal-title"
            onClick={closeModal}
          >
            <div ref={modalRef} className="mx-auto flex h-full w-full max-w-7xl flex-col">
              <div className="mb-3 flex justify-end">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeModal();
                  }}
                  className="rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#f0e4ce] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Close
                </button>
              </div>
              <div className="grid min-h-0 flex-1 place-items-center" onClick={(event) => event.stopPropagation()}>
                <h2 id="collabs-reels-modal-title" className="sr-only">
                  {activeItem.title} reel
                </h2>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-[-30px] rounded-[46px] bg-[radial-gradient(circle_at_50%_38%,rgba(132,171,238,0.24),rgba(0,0,0,0)_68%)] blur-xl" />
                  <div
                    data-phone-shell="true"
                    className="relative h-[92vh] min-h-[560px] max-h-[920px] w-auto aspect-[608/1000] overflow-hidden rounded-[34px] bg-white p-0 ring-0 border-0 outline-none shadow-[0_40px_140px_rgba(0,0,0,0.55)] md:h-[94vh] md:min-h-[740px] md:max-h-[1120px] md:p-0"
                    style={{
                      border: "none",
                      outline: "none",
                      boxShadow: "0 40px 140px rgba(0,0,0,0.55)",
                      backgroundClip: "padding-box",
                    }}
                  >
                    <div
                      className="relative mx-auto h-full aspect-[9/16] overflow-hidden rounded-[28px] bg-white"
                      onPointerDownCapture={() => setModalUserInteracted(true)}
                    >
                      <div className="absolute inset-0 z-0">
                        <InstagramProjectsEmbed
                          key={`modal:${activeItem.url}:${modalOpen ? 1 : 0}`}
                          url={activeItem.url}
                          token={999000 + (activeIndex ?? 0)}
                          crop={MODAL_CROP_VISIBLE}
                          onReadyChange={setModalEmbedReady}
                        />
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-white" style={{ height: TOP_CAP_H }} />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-white"
                        style={{ height: BOTTOM_CAP_H, pointerEvents: "none" }}
                      >
                        <a
                          href={activeItem.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="block h-full px-4 text-[13px] font-medium text-blue-600"
                          style={{ pointerEvents: "auto", display: "flex", alignItems: "center" }}
                        >
                          View more on Instagram
                        </a>
                      </div>
                      {modalEmbedReady && !modalUserInteracted ? (
                        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                          <div className="grid h-16 w-16 place-items-center rounded-full bg-black/35 ring-1 ring-white/25">
                            <div className="ml-1 h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-white/85" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
