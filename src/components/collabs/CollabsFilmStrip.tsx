"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import Image from "next/image";
import type { CollabsFilmItem } from "@/lib/collabsFilmData";
import styles from "./CollabsFilmStrip.module.css";

type CollabsFilmStripProps = {
  items: CollabsFilmItem[];
  returnUrl: string;
};

const DUST_PARTICLES = Array.from({ length: 14 }, (_, i) => i);

export function CollabsFilmStrip({ items, returnUrl }: CollabsFilmStripProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLButtonElement | null>(null);

  // Duplicate once so animating to -50% creates a seamless endless loop.
  const stripItems = useMemo(() => [...items, ...items], [items]);
  const selectedItem = selectedIndex === null ? null : items[selectedIndex];

  const closeViewer = useCallback(() => {
    setSelectedIndex(null);
    previousFocusRef.current?.focus();
  }, []);

  const openViewer = (
    event: MouseEvent<HTMLButtonElement>,
    normalizedIndex: number,
  ) => {
    previousFocusRef.current = event.currentTarget;
    setSelectedIndex(normalizedIndex);
  };

  const showPrev = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || !items.length) return current;
      return (current - 1 + items.length) % items.length;
    });
  }, [items.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || !items.length) return current;
      return (current + 1) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    if (!selectedItem) return;
    // Keep the stage static while the viewer modal is open.
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
  }, [closeViewer, selectedItem, showNext, showPrev]);

  return (
    <section className={styles.stage} aria-label="Collabs film reels">
      <a className={styles.returnPill} href={returnUrl}>
        Return
      </a>

      <div className={styles.vignette} aria-hidden />
      <div className={styles.grain} aria-hidden />

      <div className={styles.projectorBeam} aria-hidden>
        <div className={styles.dustLayer}>
          {DUST_PARTICLES.map((particle) => (
            <span
              key={particle}
              className={styles.dustParticle}
              style={
                {
                  "--dust-x": `${(particle * 7) % 95}%`,
                  "--dust-y": `${12 + ((particle * 13) % 72)}%`,
                  "--dust-delay": `${(particle % 7) * -0.8}s`,
                  "--dust-scale": `${0.6 + ((particle * 17) % 10) / 12}`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <div className={styles.projectorRig} aria-hidden>
        <div className={styles.projectorBody} />
        <div className={styles.projectorLens} />
        <div className={styles.reelLarge}>
          <span />
        </div>
        <div className={styles.reelSmall}>
          <span />
        </div>
      </div>

      <div
        className={`${styles.stripScene} ${selectedItem ? styles.paused : ""}`.trim()}
      >
        <div className={styles.stripViewport}>
          <div className={styles.filmTrack}>
            {stripItems.map((item, index) => {
              const normalizedIndex = index % items.length;
              return (
                <button
                  key={`${item.id}-${index}`}
                  type="button"
                  aria-label={`Open ${item.title} reel`}
                  className={styles.frame}
                  onClick={(event) => openViewer(event, normalizedIndex)}
                >
                  <span className={styles.frameInner}>
                    {item.posterUrl ? (
                      <Image
                        src={item.posterUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 56vw, (max-width: 1200px) 23vw, 320px"
                        className={styles.poster}
                      />
                    ) : (
                      <span className={styles.placeholder}>
                        <strong>{item.title}</strong>
                        <small>CLICK TO VIEW</small>
                      </span>
                    )}
                    <span className={styles.frameLabel}>{item.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedItem ? (
        <div
          className={styles.modalBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`film-title-${selectedItem.id}`}
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
              <p className={styles.viewerMeta}>CINEMA VIEW</p>
              <h2 id={`film-title-${selectedItem.id}`} className={styles.viewerTitle}>
                {selectedItem.title}
              </h2>
              <video
                key={selectedItem.id}
                className={styles.viewerVideo}
                src={selectedItem.mp4Url}
                controls
                playsInline
                preload="metadata"
                autoPlay
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
