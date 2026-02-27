"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, OrbitControls, useGLTF } from "@react-three/drei";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  BOTTOM_CAP_H,
  CollabsInstagramEmbedRuntime,
  InstagramProjectsEmbed,
  MODAL_CROP_VISIBLE,
  TOP_CAP_H,
} from "@/components/collabs/InstagramProjectsEmbed";
import CollabsReelsCorridor, { REELS } from "./CollabsReelsCorridor";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

declare global {
  interface Window {
    __COLLABS_SHELL_MOUNTS?: number;
    __COLLABS_LAST_NAV?: number;
  }
}

type RippleImpulse = {
  x: number;
  y: number;
  radius: number;
  life: number;
  strength: number;
};

type FrameAnchorName =
  | "ANCHOR_FRAME_01"
  | "ANCHOR_FRAME_02"
  | "ANCHOR_FRAME_03"
  | "ANCHOR_FRAME_04"
  | "ANCHOR_FRAME_05";

type FrameAnchorInfo = {
  name: FrameAnchorName;
  worldPosition: THREE.Vector3;
};

const HOME_MODEL_URL = "/assets/models/collabs/home.glb";
const GALLERY_MODEL_URL = "/assets/models/collabs/gallery.glb";
const FRAME_ANCHOR_NAMES: FrameAnchorName[] = [
  "ANCHOR_FRAME_01",
  "ANCHOR_FRAME_02",
  "ANCHOR_FRAME_03",
  "ANCHOR_FRAME_04",
  "ANCHOR_FRAME_05",
];

const TRANSITION_MS = 900;
const RIPPLE_TEX_SIZE = 256;
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function cloneScene(scene: THREE.Object3D) {
  const cloned = scene.clone(true);
  const waterNode = cloned.getObjectByName("WATER_PLANE");
  if (waterNode instanceof THREE.Mesh) {
    waterNode.visible = false;
  }
  return cloned;
}

function getNamedAnchors(scene: THREE.Object3D): FrameAnchorInfo[] {
  scene.updateWorldMatrix(true, true);
  return FRAME_ANCHOR_NAMES.map((name) => {
    const node = scene.getObjectByName(name);
    if (!node) return null;
    const worldPosition = new THREE.Vector3();
    node.getWorldPosition(worldPosition);
    return { name, worldPosition };
  }).filter((entry): entry is FrameAnchorInfo => Boolean(entry));
}

function MuseumScene({
  transitionT,
  isLeaving,
  reducedMotion,
  inReelsRoute,
  onGalleryAnchorsChange,
}: {
  transitionT: number;
  isLeaving: boolean;
  reducedMotion: boolean;
  inReelsRoute: boolean;
  onGalleryAnchorsChange: (anchors: FrameAnchorInfo[]) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const homeGltf = useGLTF(HOME_MODEL_URL);
  const galleryGltf = useGLTF(GALLERY_MODEL_URL);

  const homeScene = useMemo(() => cloneScene(homeGltf.scene), [homeGltf.scene]);
  const galleryScene = useMemo(() => cloneScene(galleryGltf.scene), [galleryGltf.scene]);
  const activeScene = inReelsRoute ? galleryScene : homeScene;

  const galleryAnchors = useMemo(() => getNamedAnchors(galleryScene), [galleryScene]);

  useEffect(() => {
    onGalleryAnchorsChange(galleryAnchors);
  }, [galleryAnchors, onGalleryAnchorsChange]);

  const waterNode = useMemo(() => {
    const node = activeScene.getObjectByName("WATER_PLANE");
    if (!(node instanceof THREE.Mesh)) return null;
    node.updateWorldMatrix(true, false);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    node.matrixWorld.decompose(position, quaternion, scale);
    return {
      node,
      geometry: node.geometry,
      position,
      quaternion,
      scale,
    };
  }, [activeScene]);

  const rippleCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = RIPPLE_TEX_SIZE;
    canvas.height = RIPPLE_TEX_SIZE;
    return canvas;
  }, []);

  const rippleTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(rippleCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }, [rippleCanvas]);
  const rippleTextureRef = useRef(rippleTexture);

  const impulsesRef = useRef<RippleImpulse[]>([]);
  const lastRippleAtRef = useRef(0);
  const lookTargetRef = useRef(new THREE.Vector3(0, 1.25, 0));
  const fromCamera = useMemo(() => new THREE.Vector3(0, 1.5, 5.7), []);
  const toCamera = useMemo(() => new THREE.Vector3(0.35, 1.25, 2.4), []);
  const galleryCamera = useMemo(() => new THREE.Vector3(0.1, 1.4, 3.2), []);
  const fromTarget = useMemo(() => new THREE.Vector3(0, 1.2, 0), []);
  const toTarget = useMemo(() => new THREE.Vector3(0.2, 1.1, -1.2), []);
  const galleryTarget = useMemo(() => new THREE.Vector3(0.0, 1.35, -4.8), []);

  const addRipple = (uv: THREE.Vector2, strength: number) => {
    const now = performance.now();
    if (now - lastRippleAtRef.current < 24) return;
    lastRippleAtRef.current = now;
    impulsesRef.current.push({
      x: uv.x,
      y: 1 - uv.y,
      radius: 0.01,
      life: 1,
      strength,
    });
    if (impulsesRef.current.length > 20) impulsesRef.current.shift();
  };

  useEffect(() => {
    camera.position.copy(fromCamera);
    camera.lookAt(fromTarget);
  }, [camera, fromCamera, fromTarget]);

  useFrame((_, delta) => {
    const ctx = rippleCanvas.getContext("2d");
    if (!ctx) return;

    const dim = RIPPLE_TEX_SIZE;
    const fadeAlpha = reducedMotion ? 0.25 : 0.12;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(0, 0, dim, dim);

    const nextImpulses: RippleImpulse[] = [];
    for (const impulse of impulsesRef.current) {
      const speed = reducedMotion ? 0.1 : 0.23;
      const decay = reducedMotion ? 0.8 : 1.8;
      const next = {
        ...impulse,
        radius: impulse.radius + delta * speed,
        life: impulse.life - delta * decay,
      };

      if (next.life > 0) {
        const px = next.x * dim;
        const py = next.y * dim;
        const radiusPx = Math.max(8, next.radius * dim * 1.8);
        const gradient = ctx.createRadialGradient(px, py, radiusPx * 0.18, px, py, radiusPx);
        gradient.addColorStop(0, `rgba(255,255,255,${Math.min(0.9, next.life * next.strength)})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        nextImpulses.push(next);
      }
    }
    impulsesRef.current = nextImpulses;

    if (!reducedMotion) {
      const t = performance.now() * 0.00065;
      ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.sin(t) * 0.015})`;
      ctx.fillRect(0, 0, dim, 1);
    }

    rippleTextureRef.current.needsUpdate = true;

    const baseT = reducedMotion ? (isLeaving ? 1 : 0) : THREE.MathUtils.clamp(transitionT, 0, 1);
    if (inReelsRoute) {
      camera.position.lerp(galleryCamera, 0.08);
      lookTargetRef.current.lerp(galleryTarget, 0.08);
    } else {
      camera.position.lerpVectors(fromCamera, toCamera, baseT);
      lookTargetRef.current.lerpVectors(fromTarget, toTarget, baseT);
    }
    camera.lookAt(lookTargetRef.current);

    if (controlsRef.current) {
      controlsRef.current.enabled = !isLeaving && !inReelsRoute;
      controlsRef.current.target.copy(lookTargetRef.current);
      controlsRef.current.update();
    }
  });

  return (
    <>
      <color attach="background" args={["#060709"]} />
      <fog attach="fog" args={["#060709", 8, 32]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.5, 4.5, 2.5]} intensity={1.1} color="#f0e7cf" />
      <pointLight position={[-2.5, 2.2, -2]} intensity={0.8} color="#95b4ff" />

      <primitive object={activeScene} />

      {waterNode ? (
        <mesh
          geometry={waterNode.geometry}
          position={waterNode.position}
          quaternion={waterNode.quaternion}
          scale={waterNode.scale}
          onPointerMove={(event) => {
            if (!event.uv || reducedMotion || isLeaving || inReelsRoute) return;
            addRipple(event.uv, 0.75);
          }}
          onPointerDown={(event) => {
            if (!event.uv || isLeaving || inReelsRoute) return;
            addRipple(event.uv, reducedMotion ? 0.45 : 1);
          }}
        >
          <MeshReflectorMaterial
            color="#142433"
            roughness={0.1}
            metalness={0.55}
            blur={[220, 36]}
            mixBlur={1.8}
            mixStrength={reducedMotion ? 0.25 : 1.1}
            resolution={512}
            mirror={0.45}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.8}
            depthScale={0.45}
            distortion={reducedMotion ? 0.015 : 0.14}
            distortionMap={rippleTexture}
          />
        </mesh>
      ) : null}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.09}
        target={[0, 1.2, 0]}
        minPolarAngle={0.98}
        maxPolarAngle={1.33}
        minAzimuthAngle={-0.62}
        maxAzimuthAngle={0.62}
      />
    </>
  );
}

useGLTF.preload(HOME_MODEL_URL);
useGLTF.preload(GALLERY_MODEL_URL);

export default function CollabsShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [transitionT, setTransitionT] = useState(0);
  const [anchorDepthByName, setAnchorDepthByName] = useState<Partial<Record<FrameAnchorName, number>>>({});
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [modalEmbedReady, setModalEmbedReady] = useState(false);
  const [modalUserInteracted, setModalUserInteracted] = useState(false);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const shellMarkerRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const priorFocusRef = useRef<HTMLElement | null>(null);
  const prevPathnameRef = useRef(pathname);
  const transitionSwapTimerRef = useRef<number | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);
  const [visualIsReelsRoute, setVisualIsReelsRoute] = useState(pathname === "/collabs/reels");

  const debugLog = useCallback((...args: unknown[]) => {
    if (process.env.NODE_ENV === "production") return;
    console.log(...args);
  }, []);

  const smokeMode = searchParams.get("__collabsSmoke") === "1";
  const smokeAction = searchParams.get("__action");
  const activeItem = selectedFrameIndex === null ? null : (REELS[selectedFrameIndex] ?? null);
  const modalOpen = Boolean(activeItem);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.__COLLABS_SHELL_MOUNTS !== "number") window.__COLLABS_SHELL_MOUNTS = 0;
    window.__COLLABS_SHELL_MOUNTS += 1;
    if (shellMarkerRef.current) {
      shellMarkerRef.current.setAttribute(
        "data-collabs-shell-mounts",
        String(window.__COLLABS_SHELL_MOUNTS),
      );
    }
  }, []);

  useEffect(() => {
    if (!leaving || prefersReducedMotion) return;

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / TRANSITION_MS);
      setTransitionT(p);
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [leaving, prefersReducedMotion]);

  useEffect(() => {
    debugLog("pathname now", pathname);
    const prevPath = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    const deferredTimers: number[] = [];
    const defer = (fn: () => void) => {
      const timer = window.setTimeout(fn, 0);
      deferredTimers.push(timer);
      return timer;
    };

    if (watchdogTimerRef.current !== null && pathname !== "/collabs") {
      window.clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    if (transitionSwapTimerRef.current !== null) {
      window.clearTimeout(transitionSwapTimerRef.current);
      transitionSwapTimerRef.current = null;
    }

    if (prevPath === "/collabs" && pathname === "/collabs/reels") {
      defer(() => {
        setTransitionT(0);
        setLeaving(true);
      });
      const swapDelay = prefersReducedMotion ? 120 : TRANSITION_MS;
      transitionSwapTimerRef.current = window.setTimeout(() => {
        setVisualIsReelsRoute(true);
        setLeaving(false);
        setTransitionT(0);
        transitionSwapTimerRef.current = null;
      }, swapDelay);
      return () => {
        deferredTimers.forEach((timer) => window.clearTimeout(timer));
      };
    }

    if (pathname === "/collabs") {
      defer(() => {
        setVisualIsReelsRoute(false);
        setLeaving(false);
        setTransitionT(0);
      });
      return () => {
        deferredTimers.forEach((timer) => window.clearTimeout(timer));
      };
    }

    if (pathname === "/collabs/reels") {
      defer(() => {
        setVisualIsReelsRoute(true);
      });
    }

    return () => {
      deferredTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [debugLog, pathname, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (transitionSwapTimerRef.current !== null) {
        window.clearTimeout(transitionSwapTimerRef.current);
      }
      if (watchdogTimerRef.current !== null) {
        window.clearTimeout(watchdogTimerRef.current);
      }
    };
  }, []);

  const closeModal = useCallback(() => {
    setSelectedFrameIndex(null);
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
  }, [closeModal, modalOpen]);

  useEffect(() => {
    if (!(smokeMode && pathname === "/collabs" && smokeAction === "cta")) return;
    const timer = window.setTimeout(() => ctaRef.current?.click(), 250);
    return () => window.clearTimeout(timer);
  }, [smokeAction, smokeMode, pathname]);

  const onEnterReels = () => {
    if (leaving) return;
    debugLog("CTA click");
    window.__COLLABS_LAST_NAV = Date.now();

    const nextPath = smokeMode
      ? "/collabs/reels?__collabsSmoke=1&__action=cta"
      : "/collabs/reels?__action=cta";

    debugLog("router push fired");
    router.push(nextPath);

    if (watchdogTimerRef.current !== null) {
      window.clearTimeout(watchdogTimerRef.current);
    }
    watchdogTimerRef.current = window.setTimeout(() => {
      if (window.location.pathname === "/collabs") {
        window.location.assign("/collabs/reels?__action=cta");
      }
      watchdogTimerRef.current = null;
    }, 1200);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      <div ref={shellMarkerRef} data-collabs-shell data-collabs-shell-mounts="0" className="sr-only" />
      <Canvas
        className="h-full w-full"
        camera={{ position: [0, 1.5, 5.7], fov: 46, near: 0.1, far: 60 }}
        dpr={[1, 1.5]}
      >
        <MuseumScene
          transitionT={transitionT}
          isLeaving={leaving}
          reducedMotion={prefersReducedMotion}
          inReelsRoute={visualIsReelsRoute}
          onGalleryAnchorsChange={(anchors) => {
            if (anchors.length === 0) return;
            const byName: Partial<Record<FrameAnchorName, number>> = {};
            anchors.forEach((anchor, index) => {
              const depth = Math.max(80, Math.round(Math.abs(anchor.worldPosition.z) * 120) + index * 40);
              byName[anchor.name] = depth;
            });
            setAnchorDepthByName(byName);
          }}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/60" />

      {!visualIsReelsRoute ? (
        <section
          data-collabs-ui="landing"
          className="absolute inset-0 z-10 flex items-center justify-center px-6"
        >
          <div className="max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">Chloeverse</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">Collabs</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 sm:text-base">
              Step into the museum and explore the featured reel collection.
            </p>
            <button
              ref={ctaRef}
              data-collabs-cta
              type="button"
              onClick={onEnterReels}
              disabled={leaving}
              className="pointer-events-auto mt-10 inline-flex items-center rounded-full border border-white/30 bg-black/30 px-7 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:border-white/65 hover:bg-white/10 disabled:opacity-70"
            >
              Enter Reels
            </button>
          </div>
        </section>
      ) : (
        <CollabsReelsCorridor
          smokeAction={smokeMode ? smokeAction : null}
          anchorDepthByName={anchorDepthByName}
          onSelectFrame={(index) => {
            setModalEmbedReady(false);
            setModalUserInteracted(false);
            setSelectedFrameIndex(index);
          }}
        />
      )}

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
                          token={999000 + (selectedFrameIndex ?? 0)}
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

      <div
        data-collabs-transition={leaving ? "active" : "idle"}
        className={`absolute inset-0 z-40 bg-black transition-opacity ${
          prefersReducedMotion ? "duration-200" : "duration-700"
        } ${leaving ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />
      {children}
    </main>
  );
}
