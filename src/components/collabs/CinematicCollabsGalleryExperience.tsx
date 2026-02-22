"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  startTransition,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { collabsReels, type CollabsReel } from "@/content/collabsReels";

import { CollabsReelModalPlayer } from "./CollabsReelModalPlayer";
import styles from "./collabsCinematicOverlay.module.css";

type Vec3 = [number, number, number];

type PosterLayout = {
  id: string;
  position: Vec3;
  rotationY: number;
  width: number;
  height: number;
};

const TUNING = {
  colors: {
    background: "#15100c",
    fog: "#1f1914",
    plaster: "#d9c8b0",
    plasterAlt: "#ccb498",
    floorStone: "#b8a48f",
    runway: "#5b3f33",
    runwayInlay: "#d8c2ab",
    step: "#786554",
    hallway: "#211a15",
    hallwayDeep: "#17120f",
    posterFrame: "#3c3128",
    skylight: "#ffffff",
  },
  materials: {
    plasterRoughness: 0.88,
    plasterMetalness: 0.02,
    floorRoughness: 0.75,
    floorMetalness: 0.03,
    runwayRoughness: 0.55,
    runwayMetalness: 0.05,
    frameRoughness: 0.74,
    frameMetalness: 0.08,
  },
  camera: {
    fov: 42,
    near: 0.1,
    far: 100,
    lookAt: [0, 1.05, 0] as Vec3,
    introStartPosition: [0, 1.1, 10.1] as Vec3,
    finalPosition: [0, 1.35, 10.8] as Vec3,
    settleDurationSec: 1.5,
    driftAmplitude: 0.03,
    driftSpeed: 0.22,
  },
  shell: {
    radius: 10,
    height: 5.2,
    centerZ: -1.6,
    thetaStart: Math.PI * 0.15,
    thetaLength: Math.PI * 1.7,
    radialSegments: 128,
    floorRadius: 10.2,
    ceilingRadius: 10.2,
    floorY: 0,
    ceilingY: 5.2,
    rotationY: Math.PI * 0.5,
    seamCount: 9,
    seamWidth: 0.055,
    seamDepth: 0.18,
    seamHeight: 4.9,
    wainscotHeight: 0.34,
    wainscotY: 1.18,
    wainscotInset: 0.08,
  },
  skylight: {
    position: [0, 2.55, -1.6] as Vec3,
    radius: 6.8,
    rimRadius: 7.15,
    emissiveIntensity: 3.1,
    spotIntensity: 20,
    spotAngle: 0.96,
    spotPenumbra: 1,
    spotDistance: 28,
    spotDecay: 2,
    targetPosition: [0, 1.05, 0] as Vec3,
  },
  arch: {
    z: -2.2,
    wallWidth: 13.8,
    wallHeight: 5.2,
    wallThickness: 0.7,
    openingWidth: 4.4,
    openingHeight: 3.45,
    openingBottomY: 0.65,
    frameDepth: 0.22,
    frameThickness: 0.34,
    corridorWidth: 3.95,
    corridorHeight: 3.2,
    corridorDepth: 7.2,
    corridorFrames: 3,
    corridorSpacing: 1.35,
    corridorScaleFalloff: 0.12,
  },
  runway: {
    width: 3.6,
    depth: 15.5,
    thickness: 0.03,
    y: 0.025,
    z: 0.55,
    inlayWidth: 0.03,
    inlayInset: 1.12,
    inlayLift: 0.009,
  },
  steps: {
    count: 4,
    width: 4.8,
    height: 0.12,
    depth: 0.72,
    startZ: -0.6,
    widthFalloff: 0.35,
    depthFalloff: 0.08,
    zSpacingFactor: 0.95,
    cornerRadius: 0.05,
  },
  ledges: {
    width: 3.8,
    height: 0.42,
    depth: 2.55,
    y: 0.21,
    z: 1.05,
    xOffset: 6.1,
    cornerRadius: 0.08,
  },
  lights: {
    ambient: 0.38,
    hemi: 0.32,
    keyDirectional: 0.34,
    leftFill: 3.6,
    rightFill: 3.3,
    hallGlow: 2.4,
  },
  contactShadows: {
    position: [0, 0.03, -0.6] as Vec3,
    scale: 22,
    blur: 2.1,
    opacity: 0.28,
    far: 18,
  },
  interaction: {
    hoverLift: 0.2,
    hoverScale: 1.04,
    damping: 8.2,
  },
  poster: {
    frameBorder: 0.15,
    frameOffset: -0.02,
    posterOffset: 0.01,
  },
  posterLayout: [
    {
      id: "reel-1",
      position: [-6.3, 1.05, 1.2],
      rotationY: 0.34,
      width: 2.65,
      height: 3.95,
    },
    {
      id: "reel-2",
      position: [-2.5, 1.05, 0.6],
      rotationY: 0.1,
      width: 1.6,
      height: 2.4,
    },
    {
      id: "reel-3",
      position: [2.2, 1.05, 0.6],
      rotationY: -0.08,
      width: 1.6,
      height: 2.4,
    },
    {
      id: "reel-4",
      position: [5.7, 1.02, 1.2],
      rotationY: -0.28,
      width: 2.2,
      height: 3.35,
    },
    {
      id: "reel-5",
      position: [0, 1.05, -5.5],
      rotationY: 0,
      width: 1.1,
      height: 1.65,
    },
  ] as PosterLayout[],
};

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
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
    const onChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  return prefersReducedMotion;
}

function useProceduralNoiseTexture(
  size: number,
  contrast: number,
  repeatX: number,
  repeatY: number,
  seed: number,
) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
      const fallbackTexture = new THREE.CanvasTexture(canvas);
      fallbackTexture.wrapS = THREE.RepeatWrapping;
      fallbackTexture.wrapT = THREE.RepeatWrapping;
      fallbackTexture.repeat.set(repeatX, repeatY);
      return fallbackTexture;
    }

    let state = seed >>> 0;
    const next = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967295;
    };

    const imageData = context.createImageData(size, size);
    for (let index = 0; index < imageData.data.length; index += 4) {
      const value = Math.min(
        255,
        Math.max(0, Math.round(128 + (next() - 0.5) * contrast * 2)),
      );
      imageData.data[index] = value;
      imageData.data[index + 1] = value;
      imageData.data[index + 2] = value;
      imageData.data[index + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.wrapS = THREE.RepeatWrapping;
    canvasTexture.wrapT = THREE.RepeatWrapping;
    canvasTexture.repeat.set(repeatX, repeatY);
    canvasTexture.colorSpace = THREE.NoColorSpace;
    canvasTexture.needsUpdate = true;
    return canvasTexture;
  }, [contrast, repeatX, repeatY, seed, size]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return texture;
}

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    const startPosition = reducedMotion
      ? TUNING.camera.finalPosition
      : TUNING.camera.introStartPosition;
    camera.position.set(...startPosition);
    camera.lookAt(...TUNING.camera.lookAt);
  }, [camera, reducedMotion]);

  useFrame((state) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const settleProgress = reducedMotion
      ? 1
      : Math.min(elapsed / TUNING.camera.settleDurationSec, 1);
    const eased = easeOutCubic(settleProgress);

    const startPosition = reducedMotion
      ? TUNING.camera.finalPosition
      : TUNING.camera.introStartPosition;
    const finalPosition = TUNING.camera.finalPosition;

    const driftX = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * TUNING.camera.driftSpeed) *
        TUNING.camera.driftAmplitude;
    const driftY = reducedMotion
      ? 0
      : Math.cos(state.clock.elapsedTime * TUNING.camera.driftSpeed * 0.87) *
        TUNING.camera.driftAmplitude *
        0.55;

    camera.position.set(
      THREE.MathUtils.lerp(startPosition[0], finalPosition[0], eased) + driftX,
      THREE.MathUtils.lerp(startPosition[1], finalPosition[1], eased) + driftY,
      THREE.MathUtils.lerp(startPosition[2], finalPosition[2], eased),
    );
    camera.lookAt(
      TUNING.camera.lookAt[0],
      TUNING.camera.lookAt[1] + driftY * 0.35,
      TUNING.camera.lookAt[2],
    );
  });

  return null;
}

type ArchRibProps = {
  position: Vec3;
  width: number;
  height: number;
  thickness: number;
  depth: number;
  color: string;
  roughness: number;
  metalness: number;
};

function ArchRib({
  position,
  width,
  height,
  thickness,
  depth,
  color,
  roughness,
  metalness,
}: ArchRibProps) {
  const radius = width * 0.5;
  const straightHeight = Math.max(height - radius, thickness * 1.15);

  return (
    <group position={position}>
      <mesh position={[0, straightHeight, 0]} castShadow receiveShadow>
        <torusGeometry args={[radius, thickness * 0.5, 18, 80, Math.PI]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>

      <RoundedBox
        args={[thickness, straightHeight, depth]}
        radius={Math.min(0.055, thickness * 0.22)}
        smoothness={3}
        position={[-radius, straightHeight * 0.5, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </RoundedBox>

      <RoundedBox
        args={[thickness, straightHeight, depth]}
        radius={Math.min(0.055, thickness * 0.22)}
        smoothness={3}
        position={[radius, straightHeight * 0.5, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </RoundedBox>
    </group>
  );
}

type PosterExhibitProps = {
  reel: CollabsReel;
  layout: PosterLayout;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
  onSelect: (reel: CollabsReel) => void;
};

function PosterExhibit({
  reel,
  layout,
  hovered,
  onHoverChange,
  onSelect,
}: PosterExhibitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(reel.posterSrc);

  const posterTexture = useMemo(() => {
    const configuredTexture = texture.clone();
    configuredTexture.colorSpace = THREE.SRGBColorSpace;
    configuredTexture.anisotropy = 8;
    configuredTexture.needsUpdate = true;
    return configuredTexture;
  }, [texture]);

  useEffect(() => {
    return () => {
      posterTexture.dispose();
    };
  }, [posterTexture]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const hoverDistance = hovered ? TUNING.interaction.hoverLift : 0;
    const liftX = Math.sin(layout.rotationY) * hoverDistance;
    const liftZ = Math.cos(layout.rotationY) * hoverDistance;
    const targetScale = hovered ? TUNING.interaction.hoverScale : 1;

    group.position.x = THREE.MathUtils.damp(
      group.position.x,
      layout.position[0] + liftX,
      TUNING.interaction.damping,
      delta,
    );
    group.position.y = THREE.MathUtils.damp(
      group.position.y,
      layout.position[1],
      TUNING.interaction.damping,
      delta,
    );
    group.position.z = THREE.MathUtils.damp(
      group.position.z,
      layout.position[2] + liftZ,
      TUNING.interaction.damping,
      delta,
    );
    group.scale.x = THREE.MathUtils.damp(
      group.scale.x,
      targetScale,
      TUNING.interaction.damping,
      delta,
    );
    group.scale.y = THREE.MathUtils.damp(
      group.scale.y,
      targetScale,
      TUNING.interaction.damping,
      delta,
    );
    group.scale.z = THREE.MathUtils.damp(
      group.scale.z,
      targetScale,
      TUNING.interaction.damping,
      delta,
    );
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHoverChange(reel.id);
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHoverChange(null);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(reel);
  };

  const frameWidth = layout.width + TUNING.poster.frameBorder * 2;
  const frameHeight = layout.height + TUNING.poster.frameBorder * 2;

  return (
    <group
      ref={groupRef}
      position={layout.position}
      rotation={[0, layout.rotationY, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <mesh
        castShadow
        receiveShadow
        position={[0, 0, TUNING.poster.frameOffset]}
      >
        <planeGeometry args={[frameWidth, frameHeight]} />
        <meshStandardMaterial
          color={TUNING.colors.posterFrame}
          roughness={TUNING.materials.frameRoughness}
          metalness={TUNING.materials.frameMetalness}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0, TUNING.poster.posterOffset]}>
        <planeGeometry args={[layout.width, layout.height]} />
        <meshStandardMaterial map={posterTexture} roughness={0.86} metalness={0.04} />
      </mesh>
    </group>
  );
}

type GalleryRoomProps = {
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
  onSelectReel: (reel: CollabsReel) => void;
  reducedMotion: boolean;
};

function GalleryRoom({
  hoveredId,
  onHoverChange,
  onSelectReel,
  reducedMotion,
}: GalleryRoomProps) {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const spotlightTargetRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!spotlightRef.current || !spotlightTargetRef.current) return;
    spotlightRef.current.target = spotlightTargetRef.current;
  }, []);

  const plasterNoise = useProceduralNoiseTexture(128, 22, 4.2, 2.4, 1337);
  const stoneNoise = useProceduralNoiseTexture(128, 36, 8.5, 8.5, 4242);

  const layoutById = useMemo(() => {
    return new Map(TUNING.posterLayout.map((layout) => [layout.id, layout]));
  }, []);
  const seamAngles = useMemo(() => {
    const edgePadding = 0.09;
    return Array.from({ length: TUNING.shell.seamCount }, (_, index) => {
      const t = (index + 1) / (TUNING.shell.seamCount + 1);
      return (
        TUNING.shell.thetaStart +
        edgePadding +
        (TUNING.shell.thetaLength - edgePadding * 2) * t
      );
    });
  }, []);
  const corridorFrameColors = ["#241c16", "#1f1813", "#19130f"] as const;

  const openingHalfWidth = TUNING.arch.openingWidth * 0.5;
  const wallHalfWidth = TUNING.arch.wallWidth * 0.5;
  const sidePillarWidth = wallHalfWidth - openingHalfWidth;
  const openingTopY = TUNING.arch.openingBottomY + TUNING.arch.openingHeight;
  const lintelHeight = Math.max(TUNING.arch.wallHeight - openingTopY, 0.3);

  return (
    <>
      <color attach="background" args={[TUNING.colors.background]} />
      <fog attach="fog" args={[TUNING.colors.fog, 10, 26]} />

      <CameraRig reducedMotion={reducedMotion} />

      <ambientLight color="#ffefd6" intensity={TUNING.lights.ambient} />
      <hemisphereLight
        color="#fff2db"
        groundColor="#7b6554"
        intensity={TUNING.lights.hemi}
      />
      <directionalLight
        castShadow
        color="#f7ead5"
        intensity={TUNING.lights.keyDirectional}
        position={[0, 9.2, 3.4]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />

      <pointLight
        position={[-10.2, 4.1, -5.5]}
        intensity={TUNING.lights.leftFill}
        color="#f4dfc2"
        distance={32}
        decay={2}
      />
      <pointLight
        position={[10.4, 3.8, -5.3]}
        intensity={TUNING.lights.rightFill}
        color="#efdac0"
        distance={32}
        decay={2}
      />
      <pointLight
        position={[0, 3.2, -18.5]}
        intensity={TUNING.lights.hallGlow}
        color="#c9a57c"
        distance={20}
        decay={2.2}
      />
      <Environment resolution={256}>
        <Lightformer
          form="circle"
          intensity={3.5}
          scale={12}
          position={[0, 2.6, TUNING.shell.centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          scale={[8, 4]}
          position={[-6, 1.6, TUNING.shell.centerZ + 4]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          scale={[8, 4]}
          position={[6, 1.6, TUNING.shell.centerZ + 4]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Environment>

      <spotLight
        ref={spotlightRef}
        castShadow
        position={[
          TUNING.skylight.position[0],
          TUNING.skylight.position[1] - 0.1,
          TUNING.skylight.position[2],
        ]}
        intensity={TUNING.skylight.spotIntensity}
        angle={TUNING.skylight.spotAngle}
        penumbra={TUNING.skylight.spotPenumbra}
        distance={TUNING.skylight.spotDistance}
        decay={TUNING.skylight.spotDecay}
        color={TUNING.colors.skylight}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <group ref={spotlightTargetRef} position={TUNING.skylight.targetPosition} />

      <group
        position={[0, TUNING.shell.height * 0.5, TUNING.shell.centerZ]}
        rotation={[0, TUNING.shell.rotationY, 0]}
      >
        <mesh castShadow receiveShadow>
          <cylinderGeometry
            args={[
              TUNING.shell.radius,
              TUNING.shell.radius,
              TUNING.shell.height,
              TUNING.shell.radialSegments,
              1,
              true,
              TUNING.shell.thetaStart,
              TUNING.shell.thetaLength,
            ]}
          />
          <meshStandardMaterial
            color={TUNING.colors.plaster}
            roughness={TUNING.materials.plasterRoughness}
            metalness={TUNING.materials.plasterMetalness}
            roughnessMap={plasterNoise}
            side={THREE.BackSide}
          />
        </mesh>

        <mesh
          position={[0, TUNING.shell.wainscotY - TUNING.shell.height * 0.5, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry
            args={[
              TUNING.shell.radius - TUNING.shell.wainscotInset,
              TUNING.shell.radius - TUNING.shell.wainscotInset,
              TUNING.shell.wainscotHeight,
              TUNING.shell.radialSegments,
              1,
              true,
              TUNING.shell.thetaStart,
              TUNING.shell.thetaLength,
            ]}
          />
          <meshStandardMaterial
            color={TUNING.colors.plasterAlt}
            roughness={0.82}
            metalness={0.03}
            roughnessMap={plasterNoise}
            side={THREE.BackSide}
          />
        </mesh>

        {seamAngles.map((angle, index) => {
          const seamRadius = TUNING.shell.radius - TUNING.shell.seamDepth * 0.5 - 0.02;
          return (
            <mesh
              key={`wall-seam-${index}`}
              position={[
                Math.cos(angle) * seamRadius,
                0,
                Math.sin(angle) * seamRadius,
              ]}
              rotation={[0, angle + Math.PI / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  TUNING.shell.seamWidth,
                  TUNING.shell.seamHeight,
                  TUNING.shell.seamDepth,
                ]}
              />
              <meshStandardMaterial
                color="#bda78f"
                roughness={0.86}
                metalness={0.02}
              />
            </mesh>
          );
        })}
      </group>

      <mesh
        position={[0, TUNING.shell.floorY, TUNING.shell.centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[TUNING.shell.floorRadius, 96]} />
        <meshStandardMaterial
          color={TUNING.colors.floorStone}
          roughness={TUNING.materials.floorRoughness}
          metalness={TUNING.materials.floorMetalness}
          roughnessMap={stoneNoise}
        />
      </mesh>

      <mesh
        position={[0, TUNING.shell.ceilingY, TUNING.shell.centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[TUNING.shell.ceilingRadius, 96]} />
        <meshStandardMaterial
          color={TUNING.colors.plasterAlt}
          roughness={TUNING.materials.plasterRoughness}
          metalness={TUNING.materials.plasterMetalness}
          roughnessMap={plasterNoise}
        />
      </mesh>

      <mesh
        position={TUNING.skylight.position}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.18, 1, 0.84]}
      >
        <circleGeometry args={[TUNING.skylight.radius, 96]} />
        <meshStandardMaterial
          color="#fffef9"
          emissive={TUNING.colors.skylight}
          emissiveIntensity={TUNING.skylight.emissiveIntensity}
          roughness={0.22}
          metalness={0.04}
        />
      </mesh>
      <mesh
        position={[
          TUNING.skylight.position[0],
          TUNING.skylight.position[1] - 0.02,
          TUNING.skylight.position[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.18, 1, 0.84]}
      >
        <ringGeometry args={[TUNING.skylight.radius, TUNING.skylight.rimRadius, 96]} />
        <meshStandardMaterial color="#efe1ca" roughness={0.5} metalness={0.07} />
      </mesh>

      <mesh
        receiveShadow
        position={[0, TUNING.runway.y, TUNING.runway.z]}
      >
        <boxGeometry args={[TUNING.runway.width, TUNING.runway.thickness, TUNING.runway.depth]} />
        <meshStandardMaterial
          color={TUNING.colors.runway}
          roughness={TUNING.materials.runwayRoughness}
          metalness={TUNING.materials.runwayMetalness}
          roughnessMap={stoneNoise}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[
          -TUNING.runway.inlayInset,
          TUNING.runway.y + TUNING.runway.inlayLift,
          TUNING.runway.z,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[TUNING.runway.inlayWidth, TUNING.runway.depth]} />
        <meshStandardMaterial
          color={TUNING.colors.runwayInlay}
          roughness={0.44}
          metalness={0.14}
        />
      </mesh>
      <mesh
        receiveShadow
        position={[
          TUNING.runway.inlayInset,
          TUNING.runway.y + TUNING.runway.inlayLift,
          TUNING.runway.z,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[TUNING.runway.inlayWidth, TUNING.runway.depth]} />
        <meshStandardMaterial
          color={TUNING.colors.runwayInlay}
          roughness={0.44}
          metalness={0.14}
        />
      </mesh>

      {Array.from({ length: TUNING.steps.count }).map((_, index) => {
        const width = TUNING.steps.width - index * TUNING.steps.widthFalloff;
        const depth = TUNING.steps.depth - index * TUNING.steps.depthFalloff;
        const y = TUNING.steps.height * (index + 0.5);
        const z = TUNING.steps.startZ - index * (TUNING.steps.depth * TUNING.steps.zSpacingFactor);

        return (
          <RoundedBox
            key={`step-${index}`}
            args={[width, TUNING.steps.height, depth]}
            radius={TUNING.steps.cornerRadius}
            smoothness={3}
            position={[0, y, z]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={TUNING.colors.step}
              roughness={0.72}
              metalness={0.05}
            />
          </RoundedBox>
        );
      })}

      <RoundedBox
        args={[TUNING.ledges.width, TUNING.ledges.height, TUNING.ledges.depth]}
        radius={TUNING.ledges.cornerRadius}
        smoothness={3}
        position={[-TUNING.ledges.xOffset, TUNING.ledges.y, TUNING.ledges.z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#725f4f" roughness={0.68} metalness={0.05} />
      </RoundedBox>
      <RoundedBox
        args={[TUNING.ledges.width, TUNING.ledges.height, TUNING.ledges.depth]}
        radius={TUNING.ledges.cornerRadius}
        smoothness={3}
        position={[TUNING.ledges.xOffset, TUNING.ledges.y, TUNING.ledges.z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#725f4f" roughness={0.68} metalness={0.05} />
      </RoundedBox>

      <mesh
        position={[
          -(openingHalfWidth + sidePillarWidth * 0.5),
          TUNING.arch.wallHeight * 0.5,
          TUNING.arch.z,
        ]}
      >
        <boxGeometry args={[sidePillarWidth, TUNING.arch.wallHeight, TUNING.arch.wallThickness]} />
        <meshStandardMaterial
          color={TUNING.colors.plasterAlt}
          roughness={TUNING.materials.plasterRoughness}
          metalness={TUNING.materials.plasterMetalness}
          roughnessMap={plasterNoise}
        />
      </mesh>
      <mesh
        position={[
          openingHalfWidth + sidePillarWidth * 0.5,
          TUNING.arch.wallHeight * 0.5,
          TUNING.arch.z,
        ]}
      >
        <boxGeometry args={[sidePillarWidth, TUNING.arch.wallHeight, TUNING.arch.wallThickness]} />
        <meshStandardMaterial
          color={TUNING.colors.plasterAlt}
          roughness={TUNING.materials.plasterRoughness}
          metalness={TUNING.materials.plasterMetalness}
          roughnessMap={plasterNoise}
        />
      </mesh>
      <mesh
        position={[
          0,
          openingTopY + lintelHeight * 0.5,
          TUNING.arch.z,
        ]}
      >
        <boxGeometry args={[TUNING.arch.openingWidth, lintelHeight, TUNING.arch.wallThickness]} />
        <meshStandardMaterial
          color={TUNING.colors.plasterAlt}
          roughness={TUNING.materials.plasterRoughness}
          metalness={TUNING.materials.plasterMetalness}
          roughnessMap={plasterNoise}
        />
      </mesh>

      <ArchRib
        position={[0, TUNING.arch.openingBottomY, TUNING.arch.z + TUNING.arch.frameDepth]}
        width={TUNING.arch.openingWidth}
        height={TUNING.arch.openingHeight}
        thickness={TUNING.arch.frameThickness}
        depth={TUNING.arch.frameDepth}
        color={TUNING.colors.plaster}
        roughness={0.67}
        metalness={0.06}
      />

      <mesh
        position={[
          0,
          TUNING.arch.openingBottomY + TUNING.arch.corridorHeight * 0.5,
          TUNING.arch.z - TUNING.arch.corridorDepth * 0.55,
        ]}
      >
        <boxGeometry args={[TUNING.arch.corridorWidth, TUNING.arch.corridorHeight, TUNING.arch.corridorDepth]} />
        <meshStandardMaterial
          color={TUNING.colors.hallway}
          roughness={0.95}
          metalness={0.02}
          side={THREE.BackSide}
        />
      </mesh>

      {Array.from({ length: TUNING.arch.corridorFrames }).map((_, index) => {
        const scale = 1 - index * TUNING.arch.corridorScaleFalloff;
        return (
          <ArchRib
            key={`corridor-arch-${index}`}
            position={[
              0,
              TUNING.arch.openingBottomY,
              TUNING.arch.z - (index + 1) * TUNING.arch.corridorSpacing,
            ]}
            width={TUNING.arch.corridorWidth * scale}
            height={TUNING.arch.corridorHeight * scale}
            thickness={TUNING.arch.frameThickness * 0.8}
            depth={Math.max(0.2, TUNING.arch.frameDepth - index * 0.04)}
            color={corridorFrameColors[index] ?? TUNING.colors.hallwayDeep}
            roughness={0.9}
            metalness={0.03}
          />
        );
      })}

      {collabsReels.map((reel) => {
        const layout = layoutById.get(reel.id);
        if (!layout) return null;
        return (
          <PosterExhibit
            key={reel.id}
            reel={reel}
            layout={layout}
            hovered={hoveredId === reel.id}
            onHoverChange={onHoverChange}
            onSelect={onSelectReel}
          />
        );
      })}

      <ContactShadows
        position={TUNING.contactShadows.position}
        scale={TUNING.contactShadows.scale}
        blur={TUNING.contactShadows.blur}
        opacity={TUNING.contactShadows.opacity}
        far={TUNING.contactShadows.far}
      />
    </>
  );
}

export function CinematicCollabsGalleryExperience() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<CollabsReel | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (!hoveredId) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [hoveredId]);

  const openFilter = () => {
    startTransition(() => {
      setIsFilterOpen(true);
    });
  };

  const toggleFilter = () => {
    startTransition(() => {
      setIsFilterOpen((prev) => !prev);
    });
  };

  const openReel = (reel: CollabsReel) => {
    startTransition(() => {
      setIsFilterOpen(false);
      setSelectedReel(reel);
    });
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#100d0a] text-[#f5ebdb]">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.24;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.enabled = true;
        }}
        camera={{
          fov: TUNING.camera.fov,
          near: TUNING.camera.near,
          far: TUNING.camera.far,
          position: TUNING.camera.introStartPosition,
        }}
      >
        <Suspense fallback={null}>
          <GalleryRoom
            hoveredId={hoveredId}
            onHoverChange={setHoveredId}
            onSelectReel={openReel}
            reducedMotion={prefersReducedMotion}
          />
        </Suspense>
      </Canvas>

      <div className={styles.overlayRoot} aria-hidden="true">
        <div className={styles.highlight} />
        <div className={styles.vignette} />
        <div className={styles.grain} />
        <div className={styles.fringe} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="flex items-start justify-between p-5 md:p-7">
          <div className="text-[0.68rem] uppercase tracking-[0.28em] text-[#efe4d1] md:text-xs">
            ChloeVerse
          </div>
          <div className="pointer-events-auto flex items-center gap-2 text-[0.63rem] uppercase tracking-[0.24em] md:gap-3 md:text-[0.68rem]">
            <span className="rounded-md border border-white/15 bg-black/20 px-2 py-1 text-[#d6c8b2]">
              Content Overview
            </span>
            <button
              type="button"
              onClick={toggleFilter}
              className="rounded-md border border-white/20 bg-black/25 px-3 py-1.5 text-[#f5e8d3] transition hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c89f]"
            >
              Filter Reels
            </button>
            <button
              type="button"
              aria-label="Toggle reels menu"
              onClick={toggleFilter}
              className="rounded-md border border-white/20 bg-black/25 px-2.5 py-1.5 text-sm leading-none text-[#f5e8d3] transition hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c89f]"
            >
              |||
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8">
          <button
            type="button"
            onClick={openFilter}
            className="pointer-events-auto rounded-full border border-white/25 bg-black/25 px-5 py-2 text-[0.63rem] uppercase tracking-[0.3em] text-[#f7ecd8] transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c89f]"
          >
            View All Reels
          </button>
        </div>
      </div>

      {isFilterOpen ? (
        <div
          className="absolute inset-0 z-30 bg-black/28 backdrop-blur-[1px]"
          onClick={() => setIsFilterOpen(false)}
          role="presentation"
        >
          <section
            className="absolute right-4 top-16 w-[min(22rem,calc(100%-2rem))] rounded-xl border border-[#f4e5cb40] bg-[#17110cf2] p-4 text-[#f0e3cf] shadow-[0_20px_80px_rgba(0,0,0,0.55)] md:right-7 md:top-20"
            onClick={(event) => event.stopPropagation()}
            aria-label="Reel filter panel"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.26em] text-[#dac7a8]">
                Reels
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded border border-white/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c89f]"
              >
                Close
              </button>
            </div>
            <ul className="space-y-2">
              {collabsReels.map((reel) => (
                <li key={reel.id}>
                  <button
                    type="button"
                    onClick={() => openReel(reel)}
                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-left transition hover:border-[#e1c89f80] hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c89f]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tracking-[0.03em]">{reel.title}</p>
                        <p className="text-[0.66rem] uppercase tracking-[0.2em] text-[#d6c4a8]">
                          {reel.subtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[0.63rem] uppercase tracking-[0.18em] text-[#cab492]">
                          {reel.year ?? "Year TBD"}
                        </p>
                        <p className="text-[0.63rem] uppercase tracking-[0.18em] text-[#cab492]">
                          {formatDuration(reel.durationSec)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(reel.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-white/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-[#d9c6a7]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      <CollabsReelModalPlayer
        key={selectedReel?.id ?? "closed"}
        reel={selectedReel}
        onClose={() => setSelectedReel(null)}
      />
    </main>
  );
}
