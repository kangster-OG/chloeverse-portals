"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type RippleImpulse = {
  x: number;
  y: number;
  radius: number;
  life: number;
  strength: number;
};

const TRANSITION_MS = 900;
const RIPPLE_TEX_SIZE = 256;

function MuseumScene({
  transitionT,
  isLeaving,
  reducedMotion,
}: {
  transitionT: number;
  isLeaving: boolean;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

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
  const fromTarget = useMemo(() => new THREE.Vector3(0, 1.2, 0), []);
  const toTarget = useMemo(() => new THREE.Vector3(0.2, 1.1, -1.2), []);

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

    const t = reducedMotion ? (isLeaving ? 1 : 0) : THREE.MathUtils.clamp(transitionT, 0, 1);
    camera.position.lerpVectors(fromCamera, toCamera, t);
    lookTargetRef.current.lerpVectors(fromTarget, toTarget, t);
    camera.lookAt(lookTargetRef.current);

    if (controlsRef.current) {
      controlsRef.current.enabled = !isLeaving;
      controlsRef.current.target.copy(lookTargetRef.current);
      controlsRef.current.update();
    }
  });

  return (
    <>
      <color attach="background" args={["#060709"]} />
      <fog attach="fog" args={["#060709", 8, 22]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.5, 4.5, 2.5]} intensity={1.1} color="#f0e7cf" />
      <pointLight position={[-2.5, 2.2, -2]} intensity={0.8} color="#95b4ff" />

      <mesh position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#15181d" roughness={0.92} metalness={0.05} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.8, 5.2, 1, 1]} />
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

      <mesh position={[0, 2.5, -3.2]}>
        <boxGeometry args={[11, 5, 0.2]} />
        <meshStandardMaterial color="#111417" roughness={0.95} />
      </mesh>
      <mesh position={[-5.4, 2.5, 0]}>
        <boxGeometry args={[0.2, 5, 7]} />
        <meshStandardMaterial color="#0d1013" roughness={0.9} />
      </mesh>
      <mesh position={[5.4, 2.5, 0]}>
        <boxGeometry args={[0.2, 5, 7]} />
        <meshStandardMaterial color="#0d1013" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.02, 0]}>
        <boxGeometry args={[11, 0.2, 7]} />
        <meshStandardMaterial color="#0a0c0f" roughness={1} />
      </mesh>

      <mesh position={[-2.3, 0.62, -0.6]}>
        <boxGeometry args={[0.95, 1.24, 0.95]} />
        <meshStandardMaterial color="#c7c3ba" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.72, -1.15]}>
        <boxGeometry args={[1.05, 1.44, 1.05]} />
        <meshStandardMaterial color="#d2cec5" roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh position={[2.2, 0.52, -0.4]}>
        <boxGeometry args={[0.9, 1.04, 0.9]} />
        <meshStandardMaterial color="#beb9af" roughness={0.45} metalness={0.12} />
      </mesh>

      <mesh
        position={[0, 0.021, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(event) => {
          if (!event.uv || reducedMotion || isLeaving) return;
          addRipple(event.uv, 0.75);
        }}
        onPointerDown={(event) => {
          if (!event.uv || isLeaving) return;
          addRipple(event.uv, reducedMotion ? 0.45 : 1);
        }}
      >
        <planeGeometry args={[8.8, 5.2, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

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

export default function CollabsMuseumLanding3D() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [transitionT, setTransitionT] = useState(0);

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

  const onEnterReels = () => {
    if (leaving) return;
    if (prefersReducedMotion) {
      router.push("/collabs/reels");
      return;
    }
    setLeaving(true);
    window.setTimeout(() => router.push("/collabs/reels"), TRANSITION_MS);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      <Canvas
        className="h-full w-full"
        camera={{ position: [0, 1.5, 5.7], fov: 46, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
      >
        <MuseumScene transitionT={transitionT} isLeaving={leaving} reducedMotion={prefersReducedMotion} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/60" />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">Chloeverse</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">Collabs</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 sm:text-base">
            Step into the museum and explore the featured reel collection.
          </p>
          <button
            type="button"
            onClick={onEnterReels}
            disabled={leaving}
            className="pointer-events-auto mt-10 inline-flex items-center rounded-full border border-white/30 bg-black/30 px-7 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:border-white/65 hover:bg-white/10 disabled:opacity-70"
          >
            Enter Reels
          </button>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-700 ${
          leaving ? "opacity-100" : "opacity-0"
        }`}
      />
    </main>
  );
}
