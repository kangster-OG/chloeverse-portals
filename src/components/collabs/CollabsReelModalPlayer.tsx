"use client";

import {
  type MouseEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CollabsReel } from "@/content/collabsReels";

type CollabsReelModalPlayerProps = {
  reel: CollabsReel | null;
  onClose: () => void;
};

export function CollabsReelModalPlayer({
  reel,
  onClose,
}: CollabsReelModalPlayerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  const isOpen = Boolean(reel);

  const hasVideo = useMemo(() => Boolean(reel?.videoSrc), [reel?.videoSrc]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
  }, [isOpen, reel?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !hasVideo) return;
    const element = videoRef.current;
    if (!element) return;
    element.currentTime = 0;
    const playResult = element.play();
    if (typeof playResult?.catch === "function") {
      playResult.catch(() => {
        setShowTapToPlay(true);
      });
    }
  }, [hasVideo, isOpen, reel?.id]);

  if (!isOpen || !reel) return null;

  const handleBackdropMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleManualPlay = () => {
    const element = videoRef.current;
    if (!element) return;
    setShowTapToPlay(false);
    element
      .play()
      .then(() => {
        setShowTapToPlay(false);
      })
      .catch(() => {
        setShowTapToPlay(true);
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-[#111111] text-[#f4ede2] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collabs-reel-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <h2 id="collabs-reel-title" className="text-lg font-semibold">
              {reel.title}
            </h2>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d7cbb8]">
              {reel.subtitle}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/30 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c89f]"
          >
            Close
          </button>
        </div>

        <div className="relative bg-black">
          {hasVideo ? (
            <>
              <video
                ref={videoRef}
                src={reel.videoSrc}
                controls
                playsInline
                autoPlay
                className="aspect-video w-full bg-black"
              />
              {showTapToPlay ? (
                <button
                  type="button"
                  onClick={handleManualPlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-black/55"
                >
                  Tap to play
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center px-8 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-[#e8dcc9]">
                Add <code className="rounded bg-white/10 px-1">videoSrc</code>{" "}
                to play in the modal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
