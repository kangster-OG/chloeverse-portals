"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from "react";

import { useSearchParams } from "next/navigation";

import { collabsReels, type CollabsReel } from "@/content/collabsReels";

import { CollabsReelModalPlayer } from "./CollabsReelModalPlayer";
import { DepthBackplate } from "./DepthBackplate";
import styles from "./backplateCollabs.module.css";

type View =
  | "lobby"
  | "transitionToProgram"
  | "program"
  | "transitionToReel"
  | "reel";

type PlateKey = "lobby" | "program" | "reel";

type Placement = {
  left: number;
  top: number;
  w: number;
  h: number;
  z: number;
};

type PlateStatusMap = Record<PlateKey, "idle" | "ok" | "error">;

const PLATES: Record<PlateKey, string> = {
  lobby: "/collabs/backplate.png",
  program: "/collabs/plates/program.png",
  reel: "/collabs/plates/reel.png",
};

const TIMING = { pushMs: 720, crossfadeMs: 240, staggerMs: 85 } as const;
const ARCH_FOCUS = { x: 50, y: 50 } as const;
const SCALE = { program: 1.35, reel: 1.55 } as const;
const GRADE = { brightness: 1.1, contrast: 1.03, saturate: 1.03 } as const;

const LOBBY_PLACEMENTS: Placement[] = [
  { left: 4, top: 38, w: 18, h: 48, z: 1.0 },
  { left: 27, top: 45, w: 13, h: 38, z: 0.7 },
  { left: 57, top: 45, w: 13, h: 38, z: 0.7 },
  { left: 78, top: 38, w: 18, h: 48, z: 1.0 },
  { left: 46, top: 53, w: 8, h: 24, z: 0.3 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDuration(durationSec?: number) {
  if (!durationSec || durationSec <= 0) return "TBD";
  const minutes = Math.floor(durationSec / 60);
  const seconds = String(durationSec % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return prefersReducedMotion;
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);

  return size;
}

function desiredPlateForView(view: View): PlateKey {
  if (view === "reel") return "reel";
  if (view === "program") return "program";
  if (view === "transitionToReel") return "program";
  if (view === "transitionToProgram") return "lobby";
  return "lobby";
}

function scaleForView(view: View) {
  if (view === "transitionToReel" || view === "reel") return SCALE.reel;
  if (view === "transitionToProgram" || view === "program") return SCALE.program;
  return 1;
}

function resolvePlate(
  plate: PlateKey,
  status: PlateStatusMap,
): { requested: PlateKey; effective: PlateKey; src: string; fellBack: boolean } {
  if (plate !== "lobby" && status[plate] === "error") {
    return {
      requested: plate,
      effective: "lobby",
      src: PLATES.lobby,
      fellBack: true,
    };
  }

  return {
    requested: plate,
    effective: plate,
    src: PLATES[plate],
    fellBack: false,
  };
}

type PlateSurfaceProps = {
  plate: PlateKey;
  stageWidth: number;
  stageHeight: number;
  mx: number;
  my: number;
  prefersReducedMotion: boolean;
  depthEnabled: boolean;
  onDepthUnavailable: () => void;
  onPlateLoad: (plate: PlateKey) => void;
  onPlateError: (plate: PlateKey) => void;
  className: string;
};

function PlateSurface({
  plate,
  stageWidth,
  stageHeight,
  mx,
  my,
  prefersReducedMotion,
  depthEnabled,
  onDepthUnavailable,
  onPlateLoad,
  onPlateError,
  className,
}: PlateSurfaceProps) {
  if (plate === "lobby") {
    if (!depthEnabled || prefersReducedMotion) {
      return (
        <img
          src={PLATES.lobby}
          alt=""
          aria-hidden="true"
          className={className}
          style={{
            filter: `brightness(${GRADE.brightness}) contrast(${GRADE.contrast}) saturate(${GRADE.saturate})`,
          }}
          onLoad={() => onPlateLoad("lobby")}
          onError={() => onPlateError("lobby")}
        />
      );
    }

    return (
      <DepthBackplate
        widthPx={Math.max(1, stageWidth)}
        heightPx={Math.max(1, stageHeight)}
        mx={mx}
        my={my}
        grade={GRADE}
        enableDepth
        onMissingDepth={onDepthUnavailable}
        className={className}
      />
    );
  }

  return (
    <img
      src={PLATES[plate]}
      alt=""
      aria-hidden="true"
      className={className}
      style={{
        filter: `brightness(${GRADE.brightness}) contrast(${GRADE.contrast}) saturate(${GRADE.saturate})`,
      }}
      onLoad={() => onPlateLoad(plate)}
      onError={() => onPlateError(plate)}
    />
  );
}

export function BackplateCollabsExperience() {
  const reels = collabsReels.slice(0, 5);
  const prefersReducedMotion = usePrefersReducedMotion();
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "1";
  const isDev = process.env.NODE_ENV !== "production";

  const stageRef = useRef<HTMLDivElement>(null);
  const pushTimeoutRef = useRef<number | null>(null);
  const crossfadeTimeoutRef = useRef<number | null>(null);
  const { width: stageWidth, height: stageHeight } = useElementSize(stageRef);

  const [view, setView] = useState<View>("lobby");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredLobbyIndex, setHoveredLobbyIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [modalReel, setModalReel] = useState<CollabsReel | null>(null);
  const [plateStatus, setPlateStatus] = useState<PlateStatusMap>({
    lobby: "idle",
    program: "idle",
    reel: "idle",
  });
  const [depthAvailable, setDepthAvailable] = useState(true);
  const [committedPlate, setCommittedPlate] = useState<PlateKey>("lobby");
  const [fadingPlate, setFadingPlate] = useState<PlateKey | null>(null);
  const [lineupRunKey, setLineupRunKey] = useState(0);

  const motionPointer = prefersReducedMotion ? { x: 0, y: 0 } : pointer;
  const pushMs = prefersReducedMotion ? 0 : TIMING.pushMs;
  const crossfadeMs = prefersReducedMotion ? 0 : TIMING.crossfadeMs;

  const selectedReel = reels[selectedIndex] ?? reels[0] ?? null;
  const desiredPlate = desiredPlateForView(view);
  const committedResolved = resolvePlate(committedPlate, plateStatus);
  const fadingResolved = fadingPlate ? resolvePlate(fadingPlate, plateStatus) : null;
  const isCrossfading =
    Boolean(fadingResolved) &&
    (fadingResolved.src !== committedResolved.src ||
      fadingResolved.effective !== committedResolved.effective);

  useEffect(() => {
    const keys: PlateKey[] = ["lobby", "program", "reel"];
    const cleanups: Array<() => void> = [];

    keys.forEach((plateKey) => {
      const image = new Image();
      let disposed = false;
      image.onload = () => {
        if (disposed) return;
        setPlateStatus((prev) =>
          prev[plateKey] === "ok" ? prev : { ...prev, [plateKey]: "ok" },
        );
      };
      image.onerror = () => {
        if (disposed) return;
        setPlateStatus((prev) =>
          prev[plateKey] === "error" ? prev : { ...prev, [plateKey]: "error" },
        );
      };
      image.src = PLATES[plateKey];
      cleanups.push(() => {
        disposed = true;
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (pushTimeoutRef.current !== null) {
      window.clearTimeout(pushTimeoutRef.current);
      pushTimeoutRef.current = null;
    }

    if (view === "transitionToProgram") {
      if (prefersReducedMotion) {
        setView("program");
        return;
      }
      pushTimeoutRef.current = window.setTimeout(() => {
        setView("program");
      }, TIMING.pushMs);
    }

    if (view === "transitionToReel") {
      if (prefersReducedMotion) {
        setView("reel");
        return;
      }
      pushTimeoutRef.current = window.setTimeout(() => {
        setView("reel");
      }, TIMING.pushMs);
    }

    return () => {
      if (pushTimeoutRef.current !== null) {
        window.clearTimeout(pushTimeoutRef.current);
        pushTimeoutRef.current = null;
      }
    };
  }, [prefersReducedMotion, view]);

  useEffect(() => {
    if (view === "program") {
      setLineupRunKey((value) => value + 1);
    }
  }, [view]);

  useEffect(() => {
    if (crossfadeTimeoutRef.current !== null) {
      window.clearTimeout(crossfadeTimeoutRef.current);
      crossfadeTimeoutRef.current = null;
    }

    if (desiredPlate === committedPlate) {
      setFadingPlate(null);
      return;
    }

    if (prefersReducedMotion || crossfadeMs === 0) {
      setFadingPlate(null);
      setCommittedPlate(desiredPlate);
      return;
    }

    setFadingPlate((current) => (current === desiredPlate ? current : desiredPlate));

    crossfadeTimeoutRef.current = window.setTimeout(() => {
      setCommittedPlate(desiredPlate);
      setFadingPlate(null);
    }, crossfadeMs);

    return () => {
      if (crossfadeTimeoutRef.current !== null) {
        window.clearTimeout(crossfadeTimeoutRef.current);
        crossfadeTimeoutRef.current = null;
      }
    };
  }, [committedPlate, crossfadeMs, desiredPlate, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (pushTimeoutRef.current !== null) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      if (crossfadeTimeoutRef.current !== null) {
        window.clearTimeout(crossfadeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hoveredLobbyIndex === null) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [hoveredLobbyIndex]);

  const onStageMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer({
      x: clamp(x, -1, 1),
      y: clamp(y, -1, 1),
    });
  };

  const onStageMouseLeave = () => {
    setPointer({ x: 0, y: 0 });
    setHoveredLobbyIndex(null);
  };

  const startProgram = (index: number) => {
    startTransition(() => {
      setSelectedIndex(index);
      setView(prefersReducedMotion ? "program" : "transitionToProgram");
    });
  };

  const startReel = (index: number) => {
    startTransition(() => {
      setSelectedIndex(index);
      setView(prefersReducedMotion ? "reel" : "transitionToReel");
    });
  };

  const returnToProgram = () => {
    startTransition(() => setView("program"));
  };

  const returnToLobby = () => {
    startTransition(() => {
      setView("lobby");
      setHoveredLobbyIndex(null);
    });
  };

  const playSelectedReel = () => {
    if (!selectedReel) return;
    startTransition(() => setModalReel(selectedReel));
  };

  const pushScale = scaleForView(view);
  const pushTransform = `translate(-${ARCH_FOCUS.x}%, -${ARCH_FOCUS.y}%) scale(${pushScale}) translate(${ARCH_FOCUS.x}%, ${ARCH_FOCUS.y}%)`;
  const parallaxTransform = prefersReducedMotion
    ? "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)"
    : `translate3d(${motionPointer.x * 4}px, ${motionPointer.y * 2}px, 0px) rotateX(${-motionPointer.y * 1.3}deg) rotateY(${motionPointer.x * 1.7}deg)`;

  const stageVars = useMemo(
    () =>
      ({
        ["--push-ms" as const]: `${pushMs}ms`,
        ["--crossfade-ms" as const]: `${crossfadeMs}ms`,
      }) satisfies CSSProperties,
    [crossfadeMs, pushMs],
  );

  const titleVisible = view === "program";
  const lineupVisible = view === "program";
  const reelVisible = view === "reel";
  const lobbyVisible = view === "lobby";

  const failedPlateFallbacks = (["program", "reel"] as const).filter(
    (key) => plateStatus[key] === "error",
  );

  const markPlateLoad = (plate: PlateKey) => {
    setPlateStatus((prev) => (prev[plate] === "ok" ? prev : { ...prev, [plate]: "ok" }));
  };

  const markPlateError = (plate: PlateKey) => {
    setPlateStatus((prev) =>
      prev[plate] === "error" ? prev : { ...prev, [plate]: "error" },
    );
  };

  return (
    <main className={styles.wrapper}>
      <div
        ref={stageRef}
        className={styles.stageFrame}
        style={stageVars}
        onMouseMove={onStageMouseMove}
        onMouseLeave={onStageMouseLeave}
        data-view={view}
      >
        <div
          className={styles.pushLayer}
          style={{ transform: pushTransform }}
          data-transition={
            view === "transitionToProgram" || view === "transitionToReel" ? "pushing" : "idle"
          }
        >
          <div className={styles.parallaxLayer} style={{ transform: parallaxTransform }}>
            <div className={styles.plateLayer} aria-hidden="true">
              <div
                className={`${styles.plateSlot} ${isCrossfading ? styles.fadeOut : styles.opaque}`}
              >
                <PlateSurface
                  plate={committedResolved.effective}
                  stageWidth={stageWidth}
                  stageHeight={stageHeight}
                  mx={motionPointer.x}
                  my={motionPointer.y}
                  prefersReducedMotion={prefersReducedMotion}
                  depthEnabled={depthAvailable && committedResolved.effective === "lobby"}
                  onDepthUnavailable={() => setDepthAvailable(false)}
                  onPlateLoad={markPlateLoad}
                  onPlateError={markPlateError}
                  className={styles.plateMedia}
                />
              </div>

              {fadingResolved ? (
                <div
                  className={`${styles.plateSlot} ${isCrossfading ? styles.fadeIn : styles.transparent}`}
                >
                  <PlateSurface
                    plate={fadingResolved.effective}
                    stageWidth={stageWidth}
                    stageHeight={stageHeight}
                    mx={motionPointer.x}
                    my={motionPointer.y}
                    prefersReducedMotion={prefersReducedMotion}
                    depthEnabled={depthAvailable && fadingResolved.effective === "lobby"}
                    onDepthUnavailable={() => setDepthAvailable(false)}
                    onPlateLoad={markPlateLoad}
                    onPlateError={markPlateError}
                    className={styles.plateMedia}
                  />
                </div>
              ) : null}
            </div>

            <div className={styles.interactiveLayer}>
              <div
                className={`${styles.lobbyHotspots} ${lobbyVisible ? styles.visibleLayer : ""}`}
                aria-hidden={!lobbyVisible}
              >
                {reels.map((reel, index) => {
                  const placement = LOBBY_PLACEMENTS[index];
                  if (!placement) return null;

                  const hovered = hoveredLobbyIndex === index;
                  const tx = motionPointer.x * (6 * placement.z);
                  const ty = motionPointer.y * (4 * placement.z) + (hovered ? -6 : 0);
                  const ry = motionPointer.x * (2 * placement.z);
                  const rx = -motionPointer.y * (1.3 * placement.z);
                  const scale = hovered ? 1.012 : 1;

                  return (
                    <div
                      key={reel.id}
                      className={styles.lobbyHotspotSlot}
                      style={{
                        left: `${placement.left}%`,
                        top: `${placement.top}%`,
                        width: `${placement.w}%`,
                        height: `${placement.h}%`,
                        transform: `translate3d(${tx}px, ${ty}px, ${placement.z * 14}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
                      }}
                    >
                      <button
                        type="button"
                        className={`${styles.lobbyHotspotButton} ${
                          hovered ? styles.isHotspotHovered : ""
                        }`}
                        style={{ backgroundImage: `url(${reel.posterSrc})` }}
                        onMouseEnter={() => setHoveredLobbyIndex(index)}
                        onMouseLeave={() =>
                          setHoveredLobbyIndex((current) => (current === index ? null : current))
                        }
                        onFocus={() => setHoveredLobbyIndex(index)}
                        onBlur={() =>
                          setHoveredLobbyIndex((current) => (current === index ? null : current))
                        }
                        onClick={() => startProgram(index)}
                        aria-label={`Open program room from ${reel.title}`}
                      >
                        <span className={styles.hotspotGlow} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div
                className={`${styles.programTitle} ${titleVisible ? styles.visibleLayer : ""}`}
                style={{ transitionDelay: `${crossfadeMs}ms` }}
                aria-hidden={!titleVisible}
              >
                MONTAGE
              </div>

              <section
                className={`${styles.programLineupWrap} ${
                  lineupVisible ? styles.visibleLayer : ""
                }`}
                style={{ transitionDelay: `${crossfadeMs}ms` }}
                aria-hidden={!lineupVisible}
              >
                <div className={styles.programLineupHeader}>
                  <p className={styles.programKicker}>Program Room</p>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={returnToLobby}
                  >
                    RETURN TO LOBBY
                  </button>
                </div>

                <div key={lineupRunKey} className={styles.programLineup}>
                  {reels.map((reel, index) => (
                    <button
                      key={reel.id}
                      type="button"
                      className={styles.lineupItem}
                      style={{ animationDelay: `${index * TIMING.staggerMs}ms` }}
                      onClick={() => startReel(index)}
                    >
                      <span className={styles.lineupPoster}>
                        <img src={reel.posterSrc} alt="" aria-hidden="true" />
                      </span>
                      <span className={styles.lineupCopy}>
                        <span className={styles.lineupTitle}>{reel.title}</span>
                        <span className={styles.lineupSubtitle}>{reel.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section
                className={`${styles.reelRoom} ${reelVisible ? styles.visibleLayer : ""}`}
                style={{ transitionDelay: `${crossfadeMs}ms` }}
                aria-hidden={!reelVisible}
              >
                {selectedReel ? (
                  <div className={styles.reelRoomContent}>
                    <div className={styles.reelHeroPosterWrap}>
                      <img
                        src={selectedReel.posterSrc}
                        alt={`${selectedReel.title} poster`}
                        className={styles.reelHeroPoster}
                      />
                    </div>

                    <div className={styles.reelHeroCopy}>
                      <p className={styles.programKicker}>Reel Room</p>
                      <h2 className={styles.reelHeroTitle}>{selectedReel.title}</h2>
                      <p className={styles.reelHeroSubtitle}>{selectedReel.subtitle}</p>
                      <div className={styles.reelHeroMeta}>
                        <span>{selectedReel.year ?? "Year TBD"}</span>
                        <span>{formatDuration(selectedReel.durationSec)}</span>
                        <span>{selectedReel.videoSrc ? "Video Ready" : "No Video Yet"}</span>
                      </div>
                      <div className={styles.reelHeroActions}>
                        <button
                          type="button"
                          onClick={playSelectedReel}
                          className={styles.primaryButton}
                        >
                          PLAY REEL
                        </button>
                        <button
                          type="button"
                          onClick={returnToProgram}
                          className={styles.ghostButton}
                        >
                          RETURN TO PROGRAM
                        </button>
                        <button
                          type="button"
                          onClick={returnToLobby}
                          className={styles.ghostButton}
                        >
                          RETURN TO LOBBY
                        </button>
                      </div>
                      {!selectedReel.videoSrc ? (
                        <p className={styles.reelHeroHint}>
                          No <code>videoSrc</code> is set for this reel yet. Play Reel will open the
                          modal with a placeholder message.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>

            <div className={styles.overlayLayer} aria-hidden="true">
              <div className={styles.vignette} />
              <div className={styles.grain} />
            </div>
          </div>
        </div>

        <div className={styles.screenUi}>
          <div className={styles.brand}>CHLOEVERSE</div>
        </div>

        {plateStatus.lobby === "error" ? (
          <div className={styles.missingBanner} role="alert">
            Missing lobby plate: public{PLATES.lobby}
          </div>
        ) : null}

        {isDev && failedPlateFallbacks.length > 0 ? (
          <div className={styles.devBadge}>
            Plate fallback: {failedPlateFallbacks.join(", ")} -&gt; lobby
          </div>
        ) : null}

        {debug ? (
          <>
            <div
              className={styles.debugCrosshair}
              style={{ left: `${ARCH_FOCUS.x}%`, top: `${ARCH_FOCUS.y}%` }}
              aria-hidden="true"
            />
            <div className={styles.debugHud}>
              <div>view: {view}</div>
              <div>selectedIndex: {selectedIndex}</div>
              <div>
                currentPlate: {committedResolved.requested}
                {committedResolved.fellBack ? ` -> ${committedResolved.effective}` : ""}
              </div>
              <div>
                nextPlate:{" "}
                {fadingResolved
                  ? `${fadingResolved.requested}${
                      fadingResolved.fellBack ? ` -> ${fadingResolved.effective}` : ""
                    }`
                  : "-"}
              </div>
              <div>depth: {depthAvailable ? "on" : "off"}</div>
            </div>
          </>
        ) : null}
      </div>

      <CollabsReelModalPlayer
        key={modalReel?.id ?? "closed"}
        reel={modalReel}
        onClose={() => setModalReel(null)}
      />
    </main>
  );
}

