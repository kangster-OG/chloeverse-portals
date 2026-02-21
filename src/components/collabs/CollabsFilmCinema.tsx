"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { CollabsFilmItem } from "@/lib/collabsFilmData";
import styles from "./CollabsFilmCinema.module.css";

type CollabsFilmCinemaProps = {
  items: CollabsFilmItem[];
  returnUrl: string;
};

const DUST_PARTICLES = Array.from({ length: 18 }, (_, index) => index);

const FALLBACK_ITEMS: CollabsFilmItem[] = [
  { id: "awaiting-reel-a", title: "Awaiting Reel A", mp4Url: "" },
  { id: "awaiting-reel-b", title: "Awaiting Reel B", mp4Url: "" },
  { id: "awaiting-reel-c", title: "Awaiting Reel C", mp4Url: "" },
  { id: "awaiting-reel-d", title: "Awaiting Reel D", mp4Url: "" },
];

type ZoomOrigin = {
  x: number;
  y: number;
};

export function CollabsFilmCinema({ items, returnUrl }: CollabsFilmCinemaProps) {
  const activeItems = items.length > 0 ? items : FALLBACK_ITEMS;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<ZoomOrigin>({ x: 0, y: 0 });
  const previousFocusRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Duplicate once so 0% to -50% translation loops seamlessly.
  const loopItems = useMemo(() => [...activeItems, ...activeItems], [activeItems]);
  const selectedItem = selectedIndex === null ? null : activeItems[selectedIndex];

  const hasPlayableContent = useMemo(
    () => activeItems.some((item) => Boolean(item.mp4Url)),
    [activeItems],
  );

  const tryPlayWithSound = useCallback((mp4Url: string) => {
    const video = videoRef.current;
    if (!video) {
      setNeedsUserPlay(true);
      return;
    }

    setNeedsUserPlay(false);
    video.pause();
    video.src = mp4Url;
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
    video.preload = "auto";
    video.load();

    const attempt = video.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(() => setNeedsUserPlay(false)).catch(() => setNeedsUserPlay(true));
    }
  }, []);

  const getAdjacentPlayableIndex = useCallback(
    (start: number, direction: 1 | -1) => {
      for (let step = 1; step <= activeItems.length; step += 1) {
        const candidate =
          (start + step * direction + activeItems.length) % activeItems.length;
        if (activeItems[candidate]?.mp4Url) return candidate;
      }
      return null;
    },
    [activeItems],
  );

  const closeViewer = useCallback(() => {
    const video = videoRef.current;
    if (video) video.pause();

    setIsViewerOpen(false);
    setNeedsUserPlay(false);
    previousFocusRef.current?.focus();
  }, []);

  const showPrev = useCallback(() => {
    if (!hasPlayableContent || selectedIndex === null) return;
    const nextIndex = getAdjacentPlayableIndex(selectedIndex, -1);
    if (nextIndex === null) return;
    setSelectedIndex(nextIndex);
    setIsViewerOpen(true);
    tryPlayWithSound(activeItems[nextIndex].mp4Url);
  }, [
    activeItems,
    getAdjacentPlayableIndex,
    hasPlayableContent,
    selectedIndex,
    tryPlayWithSound,
  ]);

  const showNext = useCallback(() => {
    if (!hasPlayableContent || selectedIndex === null) return;
    const nextIndex = getAdjacentPlayableIndex(selectedIndex, 1);
    if (nextIndex === null) return;
    setSelectedIndex(nextIndex);
    setIsViewerOpen(true);
    tryPlayWithSound(activeItems[nextIndex].mp4Url);
  }, [
    activeItems,
    getAdjacentPlayableIndex,
    hasPlayableContent,
    selectedIndex,
    tryPlayWithSound,
  ]);

  const openViewer = (
    event: MouseEvent<HTMLButtonElement>,
    normalizedIndex: number,
    playable: boolean,
  ) => {
    if (!playable) return;
    const item = activeItems[normalizedIndex];
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setZoomOrigin({
      x: Math.round(centerX - window.innerWidth / 2),
      y: Math.round(centerY - window.innerHeight / 2),
    });
    previousFocusRef.current = event.currentTarget;
    setSelectedIndex(normalizedIndex);
    setIsViewerOpen(true);
    tryPlayWithSound(item.mp4Url);
  };

  useEffect(() => {
    if (!isViewerOpen) return;
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeViewer, isViewerOpen, showNext, showPrev]);

  return (
    <section
      className={`${styles.stage} ${isViewerOpen ? styles.viewerActive : ""}`.trim()}
      aria-label="Collabs cinema reels"
    >
      <a className={styles.returnPill} href={returnUrl}>
        Return
      </a>

      <div className={styles.vignette} aria-hidden />
      <div className={styles.grain} aria-hidden />

      <div className={styles.beamCone} aria-hidden>
        <div className={styles.dustField}>
          {DUST_PARTICLES.map((particle) => (
            <span
              key={particle}
              className={styles.dust}
              style={
                {
                  "--dust-x": `${(particle * 13) % 94}%`,
                  "--dust-y": `${8 + ((particle * 19) % 80)}%`,
                  "--dust-delay": `${(particle % 9) * -0.8}s`,
                  "--dust-scale": `${0.55 + ((particle * 7) % 12) / 10}`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <div className={styles.shutterFlash} aria-hidden />
      <div className={styles.lightLeak} aria-hidden />

      <div className={`${styles.scene} ${isViewerOpen ? styles.paused : ""}`.trim()}>
        <div className={styles.stripRig}>
          <div className={styles.weaveX}>
            <div className={styles.weaveY}>
              <div className={styles.waveMajor}>
                <div className={styles.waveMinor}>
                  <div className={styles.weaveR}>
                    <div className={styles.stripReveal}>
                      <div className={styles.stripTrack}>
                        <span className={styles.stripHighlightPrimary} aria-hidden />
                        <span className={styles.stripHighlightSecondary} aria-hidden />
                        <span className={styles.stripShadowBand} aria-hidden />
                        <span className={styles.stripScratches} aria-hidden />
                        <span className={styles.stripSpecks} aria-hidden />
                        {loopItems.map((item, index) => {
                          const normalizedIndex = index % activeItems.length;
                          const playable = Boolean(item.mp4Url);
                          return (
                            <button
                              key={`${item.id}-${index}`}
                              type="button"
                              className={styles.frameButton}
                              aria-label={
                                playable
                                  ? `Open ${item.title} reel`
                                  : `${item.title} reel unavailable`
                              }
                              disabled={!playable}
                              onClick={(event) =>
                                openViewer(event, normalizedIndex, playable)
                              }
                            >
                              <span className={styles.frameWindow}>
                                {item.posterUrl ? (
                                  <Image
                                    src={item.posterUrl}
                                    alt=""
                                    fill
                                    className={styles.poster}
                                    sizes="(max-width: 640px) 36vw, (max-width: 1000px) 22vw, 180px"
                                  />
                                ) : (
                                  <span className={styles.placeholder}>
                                    <strong>{item.title}</strong>
                                    <small>
                                      {playable ? "CLICK TO VIEW" : "POSTER PENDING"}
                                    </small>
                                  </span>
                                )}
                              </span>
                              <span className={styles.frameLabel}>{item.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.modalBackdrop} ${
          isViewerOpen ? styles.modalVisible : styles.modalHidden
        }`.trim()}
        aria-hidden={!isViewerOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer();
        }}
      >
        <div
          className={styles.modal}
          style={
            {
              "--zoom-from-x": `${zoomOrigin.x}px`,
              "--zoom-from-y": `${zoomOrigin.y}px`,
            } as CSSProperties
          }
          role="dialog"
          aria-modal={isViewerOpen}
          aria-labelledby={
            selectedItem ? `film-viewer-title-${selectedItem.id}` : undefined
          }
        >
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={closeViewer}
            aria-label="Close viewer"
          >
            Close
          </button>

          <button
            type="button"
            className={`${styles.navButton} ${styles.navPrev}`}
            onClick={showPrev}
            aria-label="Previous reel"
          >
            {"<"}
          </button>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navNext}`}
            onClick={showNext}
            aria-label="Next reel"
          >
            {">"}
          </button>

          <div className={styles.viewerFrame}>
            <p className={styles.viewerMeta}>Cinema Playback</p>
            <h2
              id={
                selectedItem ? `film-viewer-title-${selectedItem.id}` : "film-viewer-title"
              }
              className={styles.viewerTitle}
            >
              {selectedItem ? selectedItem.title : "Select a Reel"}
            </h2>
            <video
              ref={videoRef}
              className={styles.viewerVideo}
              controls
              playsInline
              preload="auto"
            />
            {needsUserPlay ? (
              <button
                type="button"
                className={styles.playAssist}
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.muted = false;
                  video.volume = 1;
                  const attempt = video.play();
                  if (attempt && typeof attempt.then === "function") {
                    attempt
                      .then(() => setNeedsUserPlay(false))
                      .catch(() => setNeedsUserPlay(true));
                  }
                }}
              >
                Tap to play with sound
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
