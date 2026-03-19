"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { MobileRouteFrame } from "@/components/mobile/shared/MobileRouteFrame";
import { WORK_ENTRIES, WORK_ROLE_STACK, type WorkEntry } from "@/lib/mobile-content";

const WORK_ACCENT = "#bbfff1";

const monthMap: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const cardLayouts = [
  { x: -24, width: 90, rotateY: 10, rotateZ: -6 },
  { x: 20, width: 84, rotateY: -11, rotateZ: 5 },
  { x: -10, width: 88, rotateY: 8, rotateZ: -3 },
  { x: 24, width: 82, rotateY: -10, rotateZ: 6 },
  { x: -18, width: 86, rotateY: 9, rotateZ: -5 },
  { x: 14, width: 89, rotateY: -8, rotateZ: 4 },
] as const;

const fractureVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fractureFragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uDrift;
uniform float uMotion;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return fract(vec2(n, n * 12.34) * vec2(533.3, 371.3));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(8.7, -5.3);
    amplitude *= 0.52;
  }

  return value;
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * aspect * 1.25;
  float time = uTime * 0.12 * uMotion;
  p += uDrift * vec2(0.18, 0.1);
  p += vec2(sin(time + p.y * 1.4), cos(time * 0.8 + p.x * 1.2)) * 0.02;

  vec2 lattice = p * 8.2;
  vec2 cell = floor(lattice);
  vec2 local = fract(lattice);

  float nearest = 10.0;
  float secondNearest = 10.0;
  vec2 nearestVec = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 point = 0.18 + 0.68 * hash22(cell + offset);
      point += vec2(
        sin(time * 0.7 + dot(cell + offset, vec2(1.9, 2.7))) * 0.012,
        cos(time * 0.8 + dot(cell + offset, vec2(2.2, 1.5))) * 0.012
      );
      vec2 delta = offset + point - local;
      float dist = dot(delta, delta);

      if (dist < nearest) {
        secondNearest = nearest;
        nearest = dist;
        nearestVec = delta;
      } else if (dist < secondNearest) {
        secondNearest = dist;
      }
    }
  }

  float ridge = 1.0 - smoothstep(0.0, 0.028, secondNearest - nearest);
  float bodyNoise = fbm(p * 5.5 + nearestVec * 1.8);
  float dust = fbm(p * 14.0 - vec2(time * 0.6, -time * 0.4));
  float refraction = fbm(p * 3.8 - nearestVec * 2.4);

  vec3 base = mix(vec3(0.01, 0.015, 0.026), vec3(0.05, 0.08, 0.13), bodyNoise * 0.72 + 0.12);
  vec3 cold = vec3(0.74, 0.92, 1.0);
  vec3 mint = vec3(0.76, 1.0, 0.92);
  vec3 violet = vec3(0.7, 0.75, 0.9);

  vec3 color = base;
  color += mix(cold, mint, refraction) * ridge * 0.82;
  color += violet * pow(max(0.0, 1.0 - length(p - vec2(0.28, -0.16)) * 1.35), 3.0) * 0.1;
  color += cold * pow(max(0.0, 1.0 - length(p - vec2(-0.22, 0.08)) * 1.7), 3.5) * 0.14;
  color += vec3(dust) * 0.035;

  float shardCore = pow(max(0.0, 1.0 - length(nearestVec) * 1.8), 2.4);
  color += mix(cold, mint, bodyNoise) * shardCore * 0.16;

  float vignette = smoothstep(1.2, 0.12, length((uv - 0.5) * aspect));
  color *= mix(0.42, 1.0, vignette);
  color = pow(clamp(color, 0.0, 1.2), vec3(0.92));

  gl_FragColor = vec4(color, 1.0);
}
`;

type ScrollSnapshot = {
  position: number;
  velocity: number;
};

type WorkSceneItem =
  | {
      kind: "intro";
      id: string;
    }
  | {
      kind: "entry";
      id: string;
      entry: WorkEntry;
    };

function modulo(value: number, length: number) {
  if (length === 0) return 0;
  return ((value % length) + length) % length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseResumeDate(dateRange: string) {
  const [startRaw, endRaw] = dateRange.split(" - ").map((part) => part.trim());
  const parsePart = (value?: string) => {
    if (!value) return 0;
    if (value === "Present") return Number.POSITIVE_INFINITY;
    const [monthLabel, yearLabel] = value.split(" ");
    const month = monthMap[monthLabel] ?? 0;
    const year = Number.parseInt(yearLabel ?? "0", 10);
    return year * 12 + month;
  };

  return {
    start: parsePart(startRaw),
    end: parsePart(endRaw),
  };
}

function splitRoleTitle(title: string) {
  const [company, ...rest] = title.split(" - ");
  return {
    company: company.trim(),
    role: rest.join(" - ").trim() || company.trim(),
  };
}

function normalizeLocation(location: string) {
  return location.replace(/\s{2,}/g, " • ");
}

function seededNoise(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

function makeShardShape(seed: number) {
  const pointCount = 3 + Math.floor(seededNoise(seed + 1) * 4);
  const points: THREE.Vector2[] = [];

  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2 + seededNoise(seed + index * 4.13) * 0.4;
    const radius = 0.55 + seededNoise(seed * 2.11 + index * 1.73) * 0.9;
    points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }

  const shape = new THREE.Shape();
  shape.moveTo(points[0]!.x, points[0]!.y);
  points.slice(1).forEach((point) => shape.lineTo(point.x, point.y));
  shape.closePath();
  return shape;
}

function FractureField({
  reducedMotion,
  scrollRef,
}: {
  reducedMotion: boolean;
  scrollRef: React.MutableRefObject<ScrollSnapshot>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uDrift: { value: new THREE.Vector2(0, 0) },
      uMotion: { value: reducedMotion ? 0.35 : 1 },
    }),
    [reducedMotion],
  );

  useEffect(() => {
    const material = materialRef.current;
    return () => material?.dispose();
  }, []);

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;

    const driftX = clamp(scrollRef.current.velocity * 0.0012, -0.12, 0.12);
    const driftY = modulo(scrollRef.current.position, 1200) / 1200 - 0.5;

    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uResolution.value.set(state.size.width, state.size.height);
    material.uniforms.uDrift.value.set(driftX, driftY);
  });

  return (
    <mesh position={[0, 0, -14]}>
      <planeGeometry args={[24, 36]} />
      <shaderMaterial ref={materialRef} uniforms={uniforms} vertexShader={fractureVertexShader} fragmentShader={fractureFragmentShader} />
    </mesh>
  );
}

function GlassShard({
  seed,
  scrollRef,
}: {
  seed: number;
  scrollRef: React.MutableRefObject<ScrollSnapshot>;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const edgeRef = useRef<THREE.LineSegments | null>(null);
  const shape = useMemo(() => makeShardShape(seed), [seed]);
  const geometry = useMemo(() => new THREE.ShapeGeometry(shape), [shape]);
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 14), [geometry]);

  const config = useMemo(
    () => ({
      x: (seededNoise(seed * 1.9) - 0.5) * 14,
      y: (seededNoise(seed * 2.7) - 0.5) * 28,
      z: -2 - seededNoise(seed * 4.1) * 12,
      scale: 0.42 + seededNoise(seed * 5.3) * 1.2,
      rotX: -0.8 + seededNoise(seed * 6.1) * 1.6,
      rotY: -0.9 + seededNoise(seed * 7.3) * 1.8,
      rotZ: seededNoise(seed * 8.7) * Math.PI * 2,
      opacity: 0.02 + seededNoise(seed * 9.9) * 0.06,
    }),
    [seed],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      edgeGeometry.dispose();
    };
  }, [edgeGeometry, geometry]);

  useFrame((state) => {
    const group = groupRef.current;
    const edge = edgeRef.current;
    if (!group || !edge) return;

    const time = state.clock.getElapsedTime();
    const loop = modulo(scrollRef.current.position, 2200) / 2200;
    const drift = clamp(scrollRef.current.velocity * 0.003, -0.25, 0.25);

    group.position.x = config.x + Math.sin(time * 0.18 + seed) * 0.16 + drift * (config.z + 8) * -0.18;
    group.position.y = config.y + Math.cos(time * 0.14 + seed * 0.73 + loop * Math.PI * 2) * 0.3;
    group.rotation.x = config.rotX + Math.sin(time * 0.11 + seed * 0.4) * 0.08;
    group.rotation.y = config.rotY + Math.cos(time * 0.09 + seed * 0.27 + drift * 2.4) * 0.1;
    group.rotation.z = config.rotZ + loop * 0.22 + Math.sin(time * 0.07 + seed) * 0.04;

    const material = edge.material as THREE.LineBasicMaterial;
    material.opacity = clamp(0.16 + (10 - Math.abs(config.z)) * 0.02, 0.14, 0.34);
  });

  return (
    <group ref={groupRef} position={[config.x, config.y, config.z]} scale={config.scale}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <meshPhysicalMaterial
          color="#daf6ff"
          emissive="#88d6ff"
          emissiveIntensity={0.04}
          transparent
          opacity={config.opacity}
          roughness={0.12}
          metalness={0.04}
          transmission={0.88}
          thickness={0.9}
          ior={1.08}
          clearcoat={1}
          clearcoatRoughness={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.02} position={[0, 0, -0.02]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="#d9ffff" transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments ref={edgeRef} geometry={edgeGeometry}>
        <lineBasicMaterial color="#d7f7ff" transparent opacity={0.18} />
      </lineSegments>
    </group>
  );
}

function DebrisRig({
  reducedMotion,
  scrollRef,
}: {
  reducedMotion: boolean;
  scrollRef: React.MutableRefObject<ScrollSnapshot>;
}) {
  const shards = useMemo(() => Array.from({ length: 42 }, (_, index) => index + 1), []);
  const cameraRigRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    const rig = cameraRigRef.current;
    if (!rig) return;

    const time = state.clock.getElapsedTime();
    const velocity = clamp(scrollRef.current.velocity * 0.0015, -0.16, 0.16);
    rig.position.x += ((velocity * 0.8 + Math.sin(time * 0.08) * 0.06) - rig.position.x) * 0.08;
    rig.position.y += ((Math.cos(time * 0.09) * 0.08) - rig.position.y) * 0.08;
    rig.rotation.z += ((velocity * -0.1) - rig.rotation.z) * 0.08;
  });

  return (
    <group ref={cameraRigRef}>
      <FractureField reducedMotion={reducedMotion} scrollRef={scrollRef} />
      {shards.map((seed) => (
        <GlassShard key={seed} seed={seed} scrollRef={scrollRef} />
      ))}
    </group>
  );
}

function GlassDebrisScene({
  reducedMotion,
  scrollRef,
}: {
  reducedMotion: boolean;
  scrollRef: React.MutableRefObject<ScrollSnapshot>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 8], fov: 36, near: 0.1, far: 60 }}
        className="absolute inset-0 h-full w-full"
      >
        <color attach="background" args={["#03060b"]} />
        <fog attach="fog" args={["#02050a", 8, 20]} />
        <ambientLight intensity={0.45} color="#a7d4ff" />
        <directionalLight position={[3, 4, 6]} intensity={1.15} color="#e7fbff" />
        <pointLight position={[-4, -2, 4]} intensity={0.95} color="#7be7ff" />
        <pointLight position={[4, 3, 3]} intensity={0.82} color="#c8fff2" />
        <DebrisRig reducedMotion={reducedMotion} scrollRef={scrollRef} />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(222,255,253,0.16),transparent_28%),radial-gradient(circle_at_18%_24%,rgba(150,224,255,0.16),transparent_24%),radial-gradient(circle_at_80%_70%,rgba(193,255,236,0.12),transparent_26%),linear-gradient(180deg,rgba(2,6,10,0.22)_0%,rgba(3,6,10,0.08)_26%,rgba(2,5,9,0.42)_70%,rgba(2,3,7,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_18%,transparent_82%,rgba(255,255,255,0.03)_100%)] mix-blend-screen opacity-45" />
    </div>
  );
}

function useLoopingField({
  totalSpan,
  reducedMotion,
  scrollRef,
}: {
  totalSpan: number;
  reducedMotion: boolean;
  scrollRef: React.MutableRefObject<ScrollSnapshot>;
}) {
  const [frame, setFrame] = useState<ScrollSnapshot>({ position: 0, velocity: 0 });
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerRef = useRef<{ id: number | null; y: number; lastDelta: number }>({
    id: null,
    y: 0,
    lastDelta: 0,
  });

  useEffect(() => {
    let frameId = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - previous, 34);
      previous = now;

      if (!draggingRef.current) {
        targetRef.current += velocityRef.current * (delta / 16.67);
        velocityRef.current *= reducedMotion ? 0.86 : 0.935;
        if (Math.abs(velocityRef.current) < 0.015) velocityRef.current = 0;
      }

      const previousCurrent = currentRef.current;
      const easing = reducedMotion ? 0.18 : 0.092;
      currentRef.current += (targetRef.current - currentRef.current) * easing;

      const velocity = currentRef.current - previousCurrent;
      const position = modulo(currentRef.current, totalSpan);
      const snapshot = { position, velocity };

      scrollRef.current = snapshot;
      setFrame(snapshot);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [reducedMotion, scrollRef, totalSpan]);

  const nudge = (delta: number, momentum = delta * 0.32) => {
    targetRef.current += delta;
    velocityRef.current = momentum;
  };

  return {
    frame,
    handlers: {
      onWheel: (event: React.WheelEvent<HTMLDivElement>) => {
        nudge(event.deltaY * 1.05, event.deltaY * 0.42);
      },
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        draggingRef.current = true;
        velocityRef.current = 0;
        pointerRef.current = { id: event.pointerId, y: event.clientY, lastDelta: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current || pointerRef.current.id !== event.pointerId) return;
        const delta = event.clientY - pointerRef.current.y;
        pointerRef.current = { id: event.pointerId, y: event.clientY, lastDelta: delta };
        targetRef.current -= delta * 1.58;
      },
      onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
        if (pointerRef.current.id !== event.pointerId) return;
        draggingRef.current = false;
        velocityRef.current = -pointerRef.current.lastDelta * 1.3;
        pointerRef.current = { id: null, y: 0, lastDelta: 0 };
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
      onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
        if (pointerRef.current.id !== event.pointerId) return;
        draggingRef.current = false;
        velocityRef.current = 0;
        pointerRef.current = { id: null, y: 0, lastDelta: 0 };
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
    },
  };
}

function WorkIntroCard({
  y,
  viewportHeight,
  velocity,
}: {
  y: number;
  viewportHeight: number;
  velocity: number;
}) {
  const center = y + viewportHeight * 0.38;
  const progress = (center - viewportHeight * 0.52) / viewportHeight;
  const focus = 1 - clamp(Math.abs(progress) / 1.2, 0, 1);
  const scale = 0.88 + focus * 0.18;
  const opacity = 0.18 + focus * 0.82;
  const translateX = progress * 34 - velocity * 24;
  const rotateX = progress * 16 - velocity * 18;
  const rotateY = -progress * 13 + velocity * 14;
  const rotateZ = progress * -4;
  const blur = clamp(Math.abs(progress) * 1.1, 0, 1.8);

  return (
    <article
      className="absolute left-1/2 top-0 will-change-transform"
      style={{
        width: "90%",
        transform: `translate3d(calc(-50% + ${translateX}px), ${y}px, ${120 + focus * 120}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        opacity,
        filter: `blur(${blur}px)`,
      }}
    >
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_12%,rgba(215,255,247,0.34),transparent_56%)] blur-3xl" />
      <div className="absolute inset-x-[16%] -bottom-8 h-12 rounded-full bg-black/45 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/18 bg-[linear-gradient(180deg,rgba(238,252,255,0.26),rgba(220,246,255,0.14)_22%,rgba(54,90,110,0.1)_58%,rgba(7,14,22,0.22)_100%)] px-5 py-5 shadow-[0_28px_70px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(182,255,239,0.16)] backdrop-blur-[28px]">
        <div className="absolute inset-0 bg-[linear-gradient(128deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.08)_34%,transparent_60%,rgba(180,255,234,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,255,255,0.24),transparent_18%),radial-gradient(circle_at_86%_74%,rgba(160,255,238,0.12),transparent_22%)]" />
        <div className="relative">
          <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.34em] text-[rgba(224,253,249,0.76)]">
            Work dossier
          </p>
          <div className="mt-4">
            <h1 className="text-[1.52rem] leading-[0.92] tracking-[-0.06em] text-white">Chloe Kang</h1>
            <p className="mt-3 max-w-[14rem] text-[0.88rem] leading-6 text-[rgba(224,241,246,0.76)]">
              A continuous field of roles, contracts, and growth chapters.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {WORK_ROLE_STACK.map((role) => (
              <span
                key={role}
                className="rounded-full border border-white/16 bg-white/[0.07] px-3 py-2 text-[0.56rem] uppercase tracking-[0.22em] text-white/72"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function WorkEntryCard({
  entry,
  index,
  y,
  viewportHeight,
  velocity,
}: {
  entry: WorkEntry;
  index: number;
  y: number;
  viewportHeight: number;
  velocity: number;
}) {
  const layout = cardLayouts[index % cardLayouts.length];
  const { company, role } = splitRoleTitle(entry.title);
  const center = y + viewportHeight * 0.38;
  const progress = (center - viewportHeight * 0.54) / viewportHeight;
  const focus = 1 - clamp(Math.abs(progress) / 1.18, 0, 1);
  const scale = 0.86 + focus * 0.18;
  const opacity = 0.16 + focus * 0.86;
  const translateX = layout.x + Math.sin(progress * 1.8 + index * 0.5) * 18 - velocity * 22;
  const rotateX = progress * 18 - velocity * 20;
  const rotateY = layout.rotateY - progress * 13 + velocity * 16;
  const rotateZ = layout.rotateZ + Math.sin(progress * 2.2) * 2.2;
  const depth = -100 + focus * 220;
  const blur = clamp(Math.abs(progress) * 1.2, 0, 1.9);
  const locationLine = normalizeLocation(entry.location);

  return (
    <article
      className="absolute left-1/2 top-0 will-change-transform"
      style={{
        width: `${layout.width}%`,
        transform: `translate3d(calc(-50% + ${translateX}px), ${y}px, ${depth}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        opacity,
        filter: `blur(${blur}px)`,
      }}
    >
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_6%,rgba(200,255,245,0.26),transparent_56%)] blur-3xl" />
      <div className="absolute inset-x-[10%] -bottom-7 h-11 rounded-full bg-black/45 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/18 bg-[linear-gradient(180deg,rgba(245,253,255,0.26)_0%,rgba(229,247,255,0.14)_20%,rgba(120,176,198,0.08)_52%,rgba(8,16,26,0.2)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-1px_0_rgba(184,247,255,0.14)] backdrop-blur-[28px]">
        <div className="absolute inset-0 bg-[linear-gradient(132deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.1)_28%,transparent_58%,rgba(186,255,245,0.1)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.25),transparent_18%),radial-gradient(circle_at_80%_84%,rgba(154,247,255,0.14),transparent_24%)]" />
        <div className="absolute left-[11%] top-0 h-full w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.3),transparent_20%,transparent_78%,rgba(255,255,255,0.16))]" />
        <div className="relative px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chv-mobile-mono text-[0.58rem] uppercase tracking-[0.32em] text-[rgba(233,255,252,0.76)]">
                {entry.date}
              </p>
              <h2 className="mt-3 text-[1.22rem] leading-[1] tracking-[-0.05em] text-white">{role}</h2>
              <p className="mt-1 text-[0.82rem] uppercase tracking-[0.18em] text-[rgba(222,249,255,0.72)]">{company}</p>
            </div>
            {entry.type ? (
              <span className="rounded-full border border-white/14 bg-white/[0.08] px-2.5 py-1 text-[0.54rem] uppercase tracking-[0.24em] text-white/70">
                {entry.type}
              </span>
            ) : null}
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,16,24,0.18),rgba(6,12,18,0.08))] px-3.5 py-3">
            <p className="chv-mobile-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/48">location</p>
            <p className="mt-1 text-[0.82rem] leading-6 text-[rgba(232,243,247,0.8)]">{locationLine}</p>
          </div>

          <div className="mt-4 space-y-2.5">
            {entry.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,20,30,0.2),rgba(6,12,18,0.08))] px-3.5 py-3.5"
              >
                <p className="text-[0.9rem] leading-6 text-[rgba(243,248,250,0.92)]">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function renderSceneItem({
  item,
  y,
  viewportHeight,
  velocity,
  index,
}: {
  item: WorkSceneItem;
  y: number;
  viewportHeight: number;
  velocity: number;
  index: number;
}) {
  if (item.kind === "intro") {
    return <WorkIntroCard y={y} viewportHeight={viewportHeight} velocity={velocity} />;
  }

  return <WorkEntryCard entry={item.entry} index={index} y={y} viewportHeight={viewportHeight} velocity={velocity} />;
}

export function MobileWorkExperience() {
  const reducedMotion = useReducedMotion() ?? false;
  const [viewportHeight, setViewportHeight] = useState(820);
  const scrollRef = useRef<ScrollSnapshot>({ position: 0, velocity: 0 });

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const sortedEntries = useMemo(
    () =>
      [...WORK_ENTRIES].sort((a, b) => {
        const parsedA = parseResumeDate(a.date);
        const parsedB = parseResumeDate(b.date);

        if (parsedA.end !== parsedB.end) return parsedB.end - parsedA.end;
        return parsedB.start - parsedA.start;
      }),
    [],
  );

  const items = useMemo<WorkSceneItem[]>(
    () => [
      {
        kind: "intro",
        id: "intro",
      },
      ...sortedEntries.map((entry) => ({
        kind: "entry" as const,
        id: entry.title,
        entry,
      })),
    ],
    [sortedEntries],
  );

  const itemSpan = Math.max(370, viewportHeight * 0.78);
  const totalSpan = items.length * itemSpan;
  const { frame, handlers } = useLoopingField({
    totalSpan,
    reducedMotion,
    scrollRef,
  });

  const repeatedItems = useMemo(
    () =>
      [-1, 0, 1].flatMap((copy) =>
        items.map((item, index) => ({
          item,
          index,
          key: `${copy}-${item.id}`,
          y: viewportHeight * 0.16 + (copy * items.length + index) * itemSpan - frame.position,
        })),
      ),
    [frame.position, itemSpan, items, viewportHeight],
  );

  return (
    <MobileRouteFrame
      currentPath="/work"
      eyebrow="Work"
      title="where i've been"
      description="Scroll the work timeline."
      accent={WORK_ACCENT}
      showHeader={false}
      ambient={<GlassDebrisScene reducedMotion={reducedMotion} scrollRef={scrollRef} />}
      contentClassName="h-[100svh] !px-0 !pb-0 !pt-0"
    >
      <section
        className="relative h-[100svh] overflow-hidden touch-none"
        style={{ perspective: "1800px", transformStyle: "preserve-3d" }}
        {...handlers}
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(3,5,9,0.08)_44%,rgba(2,4,7,0.54)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 bg-[linear-gradient(180deg,rgba(2,5,9,0.92)_0%,rgba(2,5,9,0.72)_26%,rgba(2,5,9,0.0)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44 bg-[linear-gradient(180deg,rgba(2,5,9,0.0)_0%,rgba(2,5,9,0.82)_68%,rgba(2,5,9,0.96)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-20 opacity-30 mix-blend-screen" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "100% 22px", maskImage: "linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.72) 16%,rgba(0,0,0,0.78) 84%,transparent 100%)" }} />

        <div className="absolute inset-0 z-30" style={{ transform: `translate3d(0, 0, ${clamp(Math.abs(frame.velocity) * 180, 0, 120)}px)` }}>
          {repeatedItems.map(({ item, index, key, y }) => (
            <div key={key}>{renderSceneItem({ item, y, viewportHeight, velocity: frame.velocity, index })}</div>
          ))}
        </div>
      </section>
    </MobileRouteFrame>
  );
}
