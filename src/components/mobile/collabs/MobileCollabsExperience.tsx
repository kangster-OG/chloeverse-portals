"use client";

import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Sparkles, Stars } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";

import {
  CollabsInstagramEmbedRuntime,
  InstagramProjectsEmbed,
  MODAL_CROP_VISIBLE,
} from "@/components/collabs/InstagramProjectsEmbed";
import { REELS } from "@/components/collabs/reelsData";
import { MobileRouteLink } from "@/components/mobile/shared/MobileRouteLink";
import { getCollabMediumLabel } from "@/lib/mobile-content";

const ACCENT = "#b9c2ff";
const PLANET_RADIUS = 2.7;
const PROXIMITY_ANGLE = 0.42;
const DOOR_SLOTS = [
  { lat: 18, lon: -16, accent: "#d6dcff", viewerSide: 0.34 },
  { lat: -8, lon: 50, accent: "#f8c8ff", viewerSide: -0.34 },
  { lat: 24, lon: 136, accent: "#9cd6ff", viewerSide: 0.28 },
  { lat: -26, lon: -124, accent: "#ffe2bc", viewerSide: -0.3 },
  { lat: -2, lon: -72, accent: "#bfffd8", viewerSide: 0.24 },
] as const;

type JoystickVector = {
  x: number;
  y: number;
};

type CollabDoor = (typeof REELS)[number] & {
  lat: number;
  lon: number;
  accent: string;
  viewerSide: number;
};

const COLLAB_DOORS: CollabDoor[] = REELS.map((item, index) => ({
  ...item,
  ...DOOR_SLOTS[index],
}));

function clampJoystick(x: number, y: number): JoystickVector {
  const length = Math.hypot(x, y);
  if (length <= 1) {
    return { x, y };
  }
  return { x: x / length, y: y / length };
}

function latLonToNormal(lat: number, lon: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ).normalize();
}

function getSurfaceVertical(normal: THREE.Vector3) {
  const fallback = Math.abs(normal.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  return fallback.sub(normal.clone().multiplyScalar(fallback.dot(normal))).normalize();
}

function getSurfaceRight(normal: THREE.Vector3) {
  const vertical = getSurfaceVertical(normal);
  return new THREE.Vector3().crossVectors(vertical, normal).normalize();
}

function getDoorById(id: string | null) {
  return COLLAB_DOORS.find((door) => door.id === id) ?? null;
}

export function MobileCollabsExperience({ skipIntro = false }: { skipIntro?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [joystick, setJoystick] = useState<JoystickVector>({ x: 0, y: 0 });
  const [nearestDoorId, setNearestDoorId] = useState<string | null>(COLLAB_DOORS[0]?.id ?? null);
  const [activeDoorId, setActiveDoorId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [embedToken, setEmbedToken] = useState(0);
  const [embedReady, setEmbedReady] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  const activeDoor = getDoorById(activeDoorId);
  const nearestDoor = getDoorById(nearestDoorId);

  useEffect(() => {
    if (Math.abs(joystick.x) > 0.08 || Math.abs(joystick.y) > 0.08) {
      setHintDismissed(true);
    }
  }, [joystick]);

  useEffect(() => {
    if (!activeDoorId) {
      setViewerVisible(false);
      setEmbedReady(false);
      return;
    }

    setEmbedReady(false);
    const timeout = window.setTimeout(() => {
      setViewerVisible(true);
    }, reducedMotion ? 140 : 420);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeDoorId, reducedMotion]);

  const openDoor = () => {
    if (!nearestDoor) return;
    setJoystick({ x: 0, y: 0 });
    setEmbedToken((token) => token + 1);
    setActiveDoorId(nearestDoor.id);
  };

  const closeDoor = () => {
    setViewerVisible(false);
    setActiveDoorId(null);
    setEmbedToken((token) => token + 1);
  };

  return (
    <main className="chv-mobile-root relative min-h-[100svh] overflow-hidden bg-[#02010a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(146,164,255,0.18),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(120,255,223,0.08),transparent_22%),linear-gradient(180deg,#05040c_0%,#020209_55%,#010106_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.06),transparent_18%),radial-gradient(circle_at_84%_22%,rgba(206,194,255,0.08),transparent_18%),radial-gradient(circle_at_40%_78%,rgba(255,226,188,0.08),transparent_18%)]" />
        <div className="chv-mobile-grain absolute inset-0 opacity-50" />
        <div className="chv-vignette absolute inset-0" />
      </div>

      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 2.8, 7.2], fov: 34 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          className="h-full w-full"
        >
          <CollabsPlanetScene
            joystick={activeDoorId ? { x: 0, y: 0 } : joystick}
            activeDoorId={activeDoorId}
            reducedMotion={Boolean(reducedMotion)}
            onNearestDoorChange={setNearestDoorId}
          />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.9rem)]">
        <div className="flex items-start justify-between gap-4">
          <MobileRouteLink
            href="/"
            accent={ACCENT}
            label="Chloeverse"
            aria-label="Return to the Chloeverse"
            className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-3.5 py-2 text-white/84 backdrop-blur-xl"
            style={{
              boxShadow: "0 18px 42px rgba(0,0,0,0.28), 0 0 0 1px rgba(185,194,255,0.1)",
            }}
          >
            <span className="inline-flex items-center gap-3">
              <span className="relative block h-7 w-7 overflow-hidden rounded-full border border-white/18">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.96),rgba(255,255,255,0.14)_54%,transparent_76%)]" />
              </span>
              <span className="chv-mobile-body text-[0.7rem] italic tracking-[0.02em] text-white/84">back to chloeverse</span>
            </span>
          </MobileRouteLink>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -12 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="max-w-[11.75rem] rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3 text-right shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-xl"
          >
            <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.34em] text-white/42">
              {skipIntro ? "reels orbit" : "collabs orbit"}
            </p>
            <p className="mt-2 chv-mobile-display text-[1.6rem] leading-[0.9] tracking-[-0.06em] text-[#f7f4ff]">
              five doors
            </p>
            <p className="mt-2 text-[0.8rem] leading-6 text-white/56">
              Walk the planet, arrive at a door, then open the reel from the world itself.
            </p>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {!hintDismissed && !activeDoorId ? (
          <motion.div
            key="collabs-hint"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+7rem)] z-20 w-[min(88vw,18rem)] -translate-x-1/2 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3 text-center shadow-[0_22px_58px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          >
            <p className="chv-mobile-body text-[0.86rem] italic tracking-[0.03em] text-white/64">
              Guide the little glow through the void with the joystick.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {viewerVisible && activeDoor ? (
          <>
            <CollabsInstagramEmbedRuntime />
            <motion.div
              key={`viewer-shell:${activeDoor.id}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-30 px-4"
            >
              <div className="mx-auto max-w-[22rem]">
                <div className="mb-3 flex items-center justify-between px-2">
                  <div>
                    <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.32em] text-white/42">
                      {getCollabMediumLabel(activeDoor.url)}
                    </p>
                    <p className="mt-2 chv-mobile-display text-[1.9rem] leading-[0.9] tracking-[-0.06em] text-[#f8f5ff]">
                      {activeDoor.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDoor}
                    className="pointer-events-auto rounded-full border border-white/12 bg-white/10 px-3 py-2 text-[0.68rem] uppercase tracking-[0.24em] text-white/84 backdrop-blur-xl"
                  >
                    close
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[rgba(255,255,255,0.08)] p-2 shadow-[0_34px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                    <div className="relative aspect-[9/16] bg-white">
                      <InstagramProjectsEmbed
                        key={`collabs-mobile:${activeDoor.url}:${embedToken}`}
                        url={activeDoor.url}
                        token={embedToken}
                        crop={MODAL_CROP_VISIBLE}
                        onReadyChange={setEmbedReady}
                      />
                      {!embedReady ? (
                        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_24%,rgba(236,239,255,0.9),rgba(255,255,255,0.96))]">
                          <div className="rounded-full border border-[#d4d9ff] px-4 py-2 text-[0.64rem] uppercase tracking-[0.28em] text-[#5d6691]">
                            loading reel
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-2">
                  <p className="text-[0.8rem] leading-6 text-white/52">Docked to the selected door in orbit.</p>
                  <Link
                    href={activeDoor.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="chv-mobile-body text-[0.84rem] italic tracking-[0.02em] text-white/74"
                  >
                    source ↗
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {!activeDoorId ? (
        <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-20 flex items-end justify-between gap-4 px-4">
          <MobileJoystick value={joystick} onChange={setJoystick} />

          <div className="pointer-events-auto flex flex-col items-end gap-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3 text-right shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="chv-mobile-mono text-[0.54rem] uppercase tracking-[0.34em] text-white/38">nearest door</p>
              <p className="mt-2 chv-mobile-display max-w-[10rem] text-[1.45rem] leading-[0.92] tracking-[-0.05em] text-[#f7f4ff]">
                {nearestDoor?.title ?? "keep walking"}
              </p>
            </div>

            <button
              type="button"
              onClick={openDoor}
              disabled={!nearestDoor}
              className="rounded-full border border-white/14 bg-[linear-gradient(135deg,rgba(245,247,255,0.18),rgba(255,255,255,0.06))] px-5 py-4 text-left shadow-[0_22px_54px_rgba(0,0,0,0.32)] backdrop-blur-xl disabled:opacity-40"
            >
              <span className="chv-mobile-mono block text-[0.56rem] uppercase tracking-[0.34em] text-white/44">
                action
              </span>
              <span className="chv-mobile-display mt-2 block text-[1.45rem] leading-[0.92] tracking-[-0.05em] text-[#f7f4ff]">
                {nearestDoor ? `open ${nearestDoor.title}` : "approach a door"}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function MobileJoystick({
  value,
  onChange,
}: {
  value: JoystickVector;
  onChange: (next: JoystickVector) => void;
}) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    const rawX = (clientX - (rect.left + rect.width / 2)) / radius;
    const rawY = (clientY - (rect.top + rect.height / 2)) / radius;
    onChange(clampJoystick(rawX, rawY));
  };

  const endPointer = () => {
    pointerIdRef.current = null;
    onChange({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientPoint(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    updateFromClientPoint(event.clientX, event.clientY);
  };

  return (
    <div className="pointer-events-auto">
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="relative h-32 w-32 touch-none rounded-full border border-white/12 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_34%,rgba(7,8,16,0.72)_100%)] shadow-[0_28px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl"
      >
        <div className="absolute inset-[18px] rounded-full border border-white/8" />
        <div className="absolute left-1/2 top-1/2 h-px w-[68%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
        <div className="absolute left-1/2 top-1/2 h-[68%] w-px -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.14),transparent)]" />
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/14 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.82),rgba(255,255,255,0.16)_34%,rgba(12,16,34,0.86)_100%)] shadow-[0_18px_32px_rgba(0,0,0,0.28)]"
          style={{
            transform: `translate(calc(-50% + ${value.x * 1.75}rem), calc(-50% + ${value.y * 1.75}rem))`,
          }}
        />
      </div>
      <p className="mt-3 pl-2 text-[0.72rem] italic tracking-[0.03em] text-white/46">walk the planet</p>
    </div>
  );
}

function CollabsPlanetScene({
  joystick,
  activeDoorId,
  reducedMotion,
  onNearestDoorChange,
}: {
  joystick: JoystickVector;
  activeDoorId: string | null;
  reducedMotion: boolean;
  onNearestDoorChange: (doorId: string | null) => void;
}) {
  const cameraLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const characterRef = useRef<THREE.Group | null>(null);
  const planetAuraRef = useRef<THREE.Mesh | null>(null);
  const currentDoorRef = useRef<string | null>(null);
  const characterNormal = useRef(latLonToNormal(10, -8));
  const characterForward = useRef(new THREE.Vector3(0.92, 0, 0.38).normalize());

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    const normal = characterNormal.current.clone();
    let forward = characterForward.current.clone().sub(normal.clone().multiplyScalar(characterForward.current.dot(normal)));
    if (forward.lengthSq() < 0.0001) {
      forward = getSurfaceVertical(normal);
    }
    forward.normalize();

    if (!activeDoorId) {
      const intensity = Math.min(1, Math.hypot(joystick.x, joystick.y));
      if (intensity > 0.02) {
        const right = getSurfaceRight(normal);
        const vertical = getSurfaceVertical(normal);
        const movement = right.multiplyScalar(joystick.x).add(vertical.multiplyScalar(-joystick.y));
        if (movement.lengthSq() > 0.0001) {
          movement.normalize();
          normal.addScaledVector(movement, dt * 0.9).normalize();
          forward.lerp(movement, 1 - Math.exp(-dt * 10));
          forward.sub(normal.clone().multiplyScalar(forward.dot(normal))).normalize();
          characterNormal.current.copy(normal);
          characterForward.current.copy(forward);
        }
      }
    }

    let nearestDoor: CollabDoor | null = null;
    let nearestAngle = Number.POSITIVE_INFINITY;

    for (const door of COLLAB_DOORS) {
      const doorNormal = latLonToNormal(door.lat, door.lon);
      const angle = normal.angleTo(doorNormal);
      if (angle < nearestAngle) {
        nearestAngle = angle;
        nearestDoor = angle <= PROXIMITY_ANGLE ? door : null;
      }
    }

    const nextDoorId = nearestDoor?.id ?? null;
    if (nextDoorId !== currentDoorRef.current) {
      currentDoorRef.current = nextDoorId;
      onNearestDoorChange(nextDoorId);
    }

    if (characterRef.current) {
      const position = normal.clone().multiplyScalar(PLANET_RADIUS + 0.15);
      characterRef.current.position.copy(position);

      const correctedRight = new THREE.Vector3().crossVectors(forward, normal).multiplyScalar(-1).normalize();
      const correctedForward = new THREE.Vector3().crossVectors(normal, correctedRight).normalize();
      const basis = new THREE.Matrix4().makeBasis(correctedRight, normal, correctedForward);
      const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(basis);
      characterRef.current.quaternion.slerp(targetQuaternion, 1 - Math.exp(-dt * 10));
    }

    if (planetAuraRef.current) {
      const pulse = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      planetAuraRef.current.scale.setScalar(1.06 + pulse);
    }

    const selectedDoor = getDoorById(activeDoorId);
    const cameraTarget = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    if (selectedDoor) {
      const doorNormal = latLonToNormal(selectedDoor.lat, selectedDoor.lon);
      const doorVertical = getSurfaceVertical(doorNormal);
      const doorRight = getSurfaceRight(doorNormal);
      const doorAnchor = doorNormal.clone().multiplyScalar(PLANET_RADIUS + 0.18).add(doorVertical.clone().multiplyScalar(0.7));
      lookTarget.copy(doorAnchor).add(doorNormal.clone().multiplyScalar(0.2));
      cameraTarget
        .copy(doorAnchor)
        .add(doorNormal.clone().multiplyScalar(2.05))
        .add(doorVertical.clone().multiplyScalar(0.2))
        .add(doorRight.clone().multiplyScalar(selectedDoor.viewerSide));
    } else {
      const position = normal.clone().multiplyScalar(PLANET_RADIUS + 0.15);
      const shoulder = new THREE.Vector3().crossVectors(normal, forward).normalize();
      lookTarget.copy(position).add(forward.clone().multiplyScalar(0.42)).add(normal.clone().multiplyScalar(-0.28));
      cameraTarget
        .copy(position)
        .add(normal.clone().multiplyScalar(2.05))
        .add(forward.clone().multiplyScalar(-1.18))
        .add(shoulder.clone().multiplyScalar(0.3));
    }

    state.camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * (selectedDoor ? 3.4 : 2.6)));
    cameraLookAt.current.lerp(lookTarget, 1 - Math.exp(-dt * (selectedDoor ? 3.8 : 2.9)));
    state.camera.lookAt(cameraLookAt.current);
  });

  return (
    <>
      <color attach="background" args={["#04030b"]} />
      <fog attach="fog" args={["#04030b", 8, 16]} />
      <ambientLight intensity={0.9} color="#9ba7ff" />
      <directionalLight position={[4, 8, 6]} intensity={2.2} color="#e9f1ff" />
      <directionalLight position={[-5, -3, -4]} intensity={0.75} color="#8cd7ff" />
      <pointLight position={[0, 0, 0]} intensity={1.15} color="#5e72ff" distance={12} />
      <Stars radius={26} depth={18} count={1600} factor={2.2} saturation={0} fade speed={reducedMotion ? 0 : 0.6} />
      <Sparkles count={44} scale={[11, 11, 11]} size={2.4} speed={reducedMotion ? 0.08 : 0.34} color="#d8e2ff" />

      <group>
        <mesh ref={planetAuraRef} scale={1.06}>
          <sphereGeometry args={[PLANET_RADIUS + 0.18, 48, 48]} />
          <meshBasicMaterial color="#8fa3ff" transparent opacity={0.08} />
        </mesh>

        <mesh rotation={[0.14, 0.5, 0]}>
          <icosahedronGeometry args={[PLANET_RADIUS, 6]} />
          <meshStandardMaterial
            color="#140f24"
            roughness={0.9}
            metalness={0.14}
            emissive="#0f0c1d"
            emissiveIntensity={0.95}
          />
        </mesh>

        <mesh rotation={[-0.12, 0.2, 0.14]} scale={[1.008, 1.008, 1.008]}>
          <icosahedronGeometry args={[PLANET_RADIUS, 5]} />
          <meshStandardMaterial
            color="#302248"
            roughness={0.98}
            metalness={0.04}
            transparent
            opacity={0.18}
            emissive="#6d5bff"
            emissiveIntensity={0.14}
          />
        </mesh>

        {COLLAB_DOORS.map((door) => (
          <PlanetDoor key={door.id} door={door} open={door.id === activeDoorId} />
        ))}

        <group ref={characterRef}>
          <SmiskiInspiredFigure moving={!activeDoorId && Math.hypot(joystick.x, joystick.y) > 0.08} reducedMotion={reducedMotion} />
        </group>
      </group>
    </>
  );
}

function PlanetDoor({
  door,
  open,
}: {
  door: CollabDoor;
  open: boolean;
}) {
  const rootRef = useRef<THREE.Group | null>(null);
  const leafRef = useRef<THREE.Group | null>(null);
  const portalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const labelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const normal = latLonToNormal(door.lat, door.lon);
    const vertical = getSurfaceVertical(normal);
    const right = getSurfaceRight(normal);
    const basis = new THREE.Matrix4().makeBasis(right, vertical, normal);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

    if (rootRef.current) {
      rootRef.current.position.copy(normal.multiplyScalar(PLANET_RADIUS + 0.06));
      rootRef.current.quaternion.copy(quaternion);
    }
  }, [door.lat, door.lon]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033);
    if (leafRef.current) {
      leafRef.current.rotation.y = THREE.MathUtils.damp(leafRef.current.rotation.y, open ? -1.08 : 0, 4.4, dt);
    }

    if (portalMaterialRef.current) {
      const target = open ? 1 : 0.34;
      portalMaterialRef.current.opacity = THREE.MathUtils.damp(portalMaterialRef.current.opacity, target, 3.8, dt);
    }

    if (labelRef.current) {
      labelRef.current.position.y = 1.45 + Math.sin(state.clock.elapsedTime * 1.1 + door.lat) * 0.03;
    }
  });

  return (
    <group ref={rootRef}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.54, 0.72, 48]} />
        <meshBasicMaterial color={door.accent} transparent opacity={0.14} />
      </mesh>

      <group position={[0, 0.62, 0.18]}>
        <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[1.1, 1.64, 0.18]} />
          <meshStandardMaterial color="#f6f5ff" roughness={0.82} metalness={0.08} />
        </mesh>

        <mesh castShadow position={[0, 0.06, 0.11]}>
          <boxGeometry args={[0.84, 1.38, 0.06]} />
          <meshStandardMaterial
            ref={portalMaterialRef}
            color="#ffffff"
            emissive={door.accent}
            emissiveIntensity={1.7}
            transparent
            opacity={0.34}
            roughness={0.08}
            metalness={0}
          />
        </mesh>

        <group ref={leafRef} position={[-0.36, -0.01, 0.13]}>
          <group position={[0.36, 0, 0]}>
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.72, 1.3, 0.08]} />
              <meshStandardMaterial color="#ecebff" roughness={0.72} metalness={0.06} />
            </mesh>
            <mesh position={[0.23, -0.02, 0.06]}>
              <sphereGeometry args={[0.04, 18, 18]} />
              <meshStandardMaterial color="#f9fbff" emissive={door.accent} emissiveIntensity={0.48} />
            </mesh>
          </group>
        </group>
      </group>

      <group ref={labelRef} position={[0, 1.45, 0.22]}>
        <Html center transform distanceFactor={8} occlude>
          <div className="pointer-events-none rounded-full border border-white/12 bg-[rgba(8,9,18,0.74)] px-3 py-1.5 text-center shadow-[0_14px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="chv-mobile-mono text-[0.5rem] uppercase tracking-[0.3em] text-white/38">door</div>
            <div className="chv-mobile-display mt-1 whitespace-nowrap text-[0.9rem] leading-none tracking-[-0.04em] text-[#f7f5ff]">
              {door.title}
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

function SmiskiInspiredFigure({
  moving,
  reducedMotion,
}: {
  moving: boolean;
  reducedMotion: boolean;
}) {
  const bodyRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!bodyRef.current) return;
    const wobble = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * (moving ? 8 : 3.2)) * (moving ? 0.06 : 0.02);
    bodyRef.current.position.y = 0.02 + wobble;
    bodyRef.current.rotation.z = wobble * 0.32;
  });

  return (
    <group ref={bodyRef}>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color="#d6ff98" emissive="#96ff72" emissiveIntensity={1.35} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <capsuleGeometry args={[0.16, 0.38, 10, 18]} />
        <meshStandardMaterial color="#d6ff98" emissive="#82ff6b" emissiveIntensity={1.15} roughness={0.74} />
      </mesh>
      <mesh position={[-0.18, 0.14, 0]}>
        <capsuleGeometry args={[0.035, 0.18, 6, 12]} />
        <meshStandardMaterial color="#d6ff98" emissive="#82ff6b" emissiveIntensity={0.82} roughness={0.78} />
      </mesh>
      <mesh position={[0.18, 0.14, 0]}>
        <capsuleGeometry args={[0.035, 0.18, 6, 12]} />
        <meshStandardMaterial color="#d6ff98" emissive="#82ff6b" emissiveIntensity={0.82} roughness={0.78} />
      </mesh>
      <mesh position={[-0.07, -0.24, 0]}>
        <capsuleGeometry args={[0.035, 0.18, 6, 12]} />
        <meshStandardMaterial color="#d6ff98" emissive="#82ff6b" emissiveIntensity={0.82} roughness={0.78} />
      </mesh>
      <mesh position={[0.07, -0.24, 0]}>
        <capsuleGeometry args={[0.035, 0.18, 6, 12]} />
        <meshStandardMaterial color="#d6ff98" emissive="#82ff6b" emissiveIntensity={0.82} roughness={0.78} />
      </mesh>
      <pointLight position={[0, 0.18, 0.1]} intensity={1.2} distance={2.4} color="#baff80" />
    </group>
  );
}
