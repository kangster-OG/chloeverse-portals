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

function getCoverRect(viewportW: number, viewportH: number, imgAspect = 16 / 9) {
  if (viewportW <= 0 || viewportH <= 0) {
    return { x: 0, y: 0, w: viewportW, h: viewportH };
  }

  const viewportAspect = viewportW / viewportH;

  if (viewportAspect > imgAspect) {
    const w = viewportW;
    const h = w / imgAspect;
    return { x: 0, y: (viewportH - h) * 0.5, w, h };
  }

  const h = viewportH;
  const w = h * imgAspect;
  return { x: (viewportW - w) * 0.5, y: 0, w, h };
}

function desiredPlateForView(view: View): PlateKey {
  if (view === "reel" || view === "transitionToReel") return "reel";
  if (view === "program" || view === "transitionToProgram") return "program";
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
  const showMasks = searchParams.get("mask") === "1";

  const stageRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const tokenRef = useRef(0);
  const { width: stageWidth, height: stageHeight } = useElementSize(stageRef);

  const [view, setView] = useState<View>("lobby");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [lineupRunKey, setLineupRunKey] = useState(0);

  const motionPointer = prefersReducedMotion ? { x: 0, y: 0 } : pointer;
  const pushMs = prefersReducedMotion ? 0 : TIMING.pushMs;
  const crossfadeMs = prefersReducedMotion ? 0 : TIMING.crossfadeMs;
  const coverRect = useMemo(
    () => getCoverRect(stageWidth, stageHeight, 16 / 9),
    [stageHeight, stageWidth],
  );
  const archFocusPx = useMemo(
    () => ({
      x: coverRect.x + coverRect.w * (ARCH_FOCUS.x / 100),
      y: coverRect.y + coverRect.h * (ARCH_FOCUS.y / 100),
    }),
    [coverRect],
  );

  const selectedReel =
    selectedIndex === null ? null : (reels[selectedIndex] ?? null);
  const desiredPlate = desiredPlateForView(view);
  const committedResolved = resolvePlate(committedPlate, plateStatus);
  const fadingResolved = fadingPlate ? resolvePlate(fadingPlate, plateStatus) : null;
  const showCrossfade =
    isCrossfading &&
    Boolean(fadingResolved) &&
    (fadingResolved.src !== committedResolved.src ||
      fadingResolved.effective !== committedResolved.effective);

  const clearAll = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  const bumpToken = () => {
    tokenRef.current += 1;
    return tokenRef.current;
  };

  const isToken = (token: number) => tokenRef.current === token;

  const schedule = (callback: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((current) => current !== id);
      callback();
    }, ms);
    timeoutsRef.current.push(id);
  };

  const commitPlateForView = (nextView: View) => {
    setCommittedPlate(desiredPlateForView(nextView));
    setFadingPlate(null);
    setIsCrossfading(false);
  };

  const startPlateCrossfade = (targetPlate: PlateKey, token: number) => {
    if (prefersReducedMotion || crossfadeMs === 0) {
      setCommittedPlate(targetPlate);
      setFadingPlate(null);
      setIsCrossfading(false);
      return;
    }

    setFadingPlate(targetPlate);
    setIsCrossfading(true);
    schedule(() => {
      if (!isToken(token)) return;
      setCommittedPlate(targetPlate);
      setFadingPlate(null);
      setIsCrossfading(false);
    }, crossfadeMs);
  };

  const resetToLobby = () => {
    clearAll();
    bumpToken();
    setCommittedPlate("lobby");
    setFadingPlate(null);
    setIsCrossfading(false);
    setView("lobby");
    setSelectedIndex(null);
    setHoveredLobbyIndex(null);
    setPointer({ x: 0, y: 0 });
  };

  const resetToProgram = () => {
    clearAll();
    bumpToken();
    setCommittedPlate("program");
    setFadingPlate(null);
    setIsCrossfading(false);
    setView("program");
    setHoveredLobbyIndex(null);
    setPointer({ x: 0, y: 0 });
  };

  const beginTransition = (
    transitionView: Extract<View, "transitionToProgram" | "transitionToReel">,
    finalView: Extract<View, "program" | "reel">,
    index: number,
  ) => {
    clearAll();
    const token = bumpToken();

    setSelectedIndex(index);

    if (prefersReducedMotion) {
      commitPlateForView(finalView);
      setView(finalView);
      return;
    }

    setView(transitionView);
    startPlateCrossfade(desiredPlateForView(transitionView), token);

    schedule(() => {
      if (!isToken(token)) return;
      setView(finalView);
    }, TIMING.pushMs);
  };

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
    if (view === "program") {
      setLineupRunKey((value) => value + 1);
    }
  }, [view]);

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (modalReel) return;
      resetToLobby();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalReel]);

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
      beginTransition("transitionToProgram", "program", index);
    });
  };

  const startReel = (index: number) => {
    startTransition(() => {
      beginTransition("transitionToReel", "reel", index);
    });
  };

  const returnToProgram = () => {
    startTransition(() => {
      resetToProgram();
    });
  };

  const returnToLobby = () => {
    startTransition(() => {
      resetToLobby();
    });
  };

  const playSelectedReel = () => {
    if (!selectedReel) return;
    startTransition(() => setModalReel(selectedReel));
  };

  const pushScale = scaleForView(view);
  const pushOriginX = stageWidth > 0 ? (archFocusPx.x / stageWidth) * 100 : ARCH_FOCUS.x;
  const pushOriginY = stageHeight > 0 ? (archFocusPx.y / stageHeight) * 100 : ARCH_FOCUS.y;
  const pushTransform = `translate(-${pushOriginX}%, -${pushOriginY}%) scale(${pushScale}) translate(${pushOriginX}%, ${pushOriginY}%)`;
  const parallaxTransform = "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)";

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
  const lobbyHitboxesVisible = view === "lobby" || view === "transitionToProgram";

  const missingPlateBadge =
    desiredPlate !== "lobby" && plateStatus[desiredPlate] === "error"
      ? `Missing ${desiredPlate} plate`
      : null;
  const showProgramMasks =
    (view === "transitionToProgram" || view === "program") && plateStatus.program === "error";
  const showReelMasks =
    (view === "transitionToReel" || view === "reel") && plateStatus.reel === "error";
  const showMaskFallback = showMasks && (showProgramMasks || showReelMasks);

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
                className={`${styles.plateSlot} ${showCrossfade ? styles.fadeOut : styles.opaque}`}
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
                  className={`${styles.plateSlot} ${showCrossfade ? styles.fadeIn : styles.transparent}`}
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

            {showMaskFallback ? (
              <div className={styles.maskFallbackLayer} aria-hidden="true">
                <div className={styles.maskFallbackPanel} style={{ left: "2%", top: "34%", width: "22%", height: "57%" }} />
                <div className={styles.maskFallbackPanel} style={{ left: "25%", top: "43%", width: "17%", height: "44%" }} />
                <div className={styles.maskFallbackPanel} style={{ left: "55%", top: "43%", width: "17%", height: "44%" }} />
                <div className={styles.maskFallbackPanel} style={{ left: "76%", top: "34%", width: "22%", height: "57%" }} />
              </div>
            ) : null}

            <div className={styles.interactiveLayer}>
              {lobbyHitboxesVisible ? (
                <div className={`${styles.lobbyHotspots} ${styles.visibleLayer}`} aria-hidden={false}>
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
                        left: `${coverRect.x + (coverRect.w * placement.left) / 100}px`,
                        top: `${coverRect.y + (coverRect.h * placement.top) / 100}px`,
                        width: `${(coverRect.w * placement.w) / 100}px`,
                        height: `${(coverRect.h * placement.h) / 100}px`,
                        transform: `translate3d(${tx}px, ${ty}px, ${placement.z * 14}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
                      }}
                    >
                      <button
                        type="button"
                        className={`${styles.lobbyHotspotButton} ${
                          hovered ? styles.isHotspotHovered : ""
                        }`}
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
                      />
                    </div>
                  );
                  })}
                </div>
              ) : null}

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

        {missingPlateBadge ? (
          <div className={styles.devBadge}>
            {missingPlateBadge}
          </div>
        ) : null}

        {debug ? (
          <>
            <div
              className={styles.debugCrosshair}
              style={{ left: `${ARCH_FOCUS.x}%`, top: `${ARCH_FOCUS.y}%` }}
              aria-hidden="true"
            />
            <div
              className={styles.debugCoverRect}
              style={{
                left: `${coverRect.x}px`,
                top: `${coverRect.y}px`,
                width: `${coverRect.w}px`,
                height: `${coverRect.h}px`,
              }}
              aria-hidden="true"
            />
            <div className={styles.debugHud}>
              <div>view: {view}</div>
              <div>selectedIndex: {selectedIndex}</div>
              <div>
                committedPlateSrc: {committedResolved.src}
              </div>
              <div>
                fadingPlate:{" "}
                {fadingResolved ? fadingResolved.src : "-"}
              </div>
              <div>token: {tokenRef.current}</div>
              <div>depth: {depthAvailable ? "on" : "off"}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className={styles.fixedControlsOverlay}>
        {view === "program" || view === "reel" ? (
          <div className={styles.returnRail}>
            {view === "reel" ? (
              <>
                <button type="button" className={styles.returnButton} onClick={returnToProgram}>
                  RETURN TO PROGRAM
                </button>
                <button type="button" className={styles.returnButton} onClick={returnToLobby}>
                  RETURN TO LOBBY
                </button>
              </>
            ) : (
              <button type="button" className={styles.returnButton} onClick={returnToLobby}>
                RETURN TO LOBBY
              </button>
            )}
          </div>
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
