"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const IGNITION_DELAY = 0.35;
const BURN_DURATION = 3;
const BACKGROUND_COLOR = 0x030304;

const paperVertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform float uAspect;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vUv = uv;

    vec3 transformed = position;
    vec2 centered = uv - 0.5;
    float radial = length(vec2(centered.x, centered.y * uAspect));
    float largeNoise = (fbm(uv * 5.4 + uTime * 0.08) - 0.5) * 0.12;
    float fineNoise = (fbm(uv * 20.0 - uTime * 0.22) - 0.5) * 0.032;
    float burnFront = mix(0.02, 0.94, uProgress);
    float signedField = radial + largeNoise + fineNoise - burnFront;

    float edgeBand =
      smoothstep(-0.06, 0.015, signedField) *
      (1.0 - smoothstep(0.02, 0.15, signedField));
    float ripple = sin(uTime * 5.0 + centered.x * 11.0 + centered.y * 8.0) * 0.5 + 0.5;

    transformed.z += edgeBand * (0.11 + ripple * 0.14);
    transformed.x += centered.x * edgeBand * 0.12;
    transformed.y += centered.y * edgeBand * 0.06;
    transformed.z += (fbm(uv * 12.0 + uTime * 0.05) - 0.5) * 0.03 * (1.0 - uProgress * 0.5);
    transformed.x += sin(uTime * 0.4 + uv.y * 2.1) * 0.008;
    transformed.y += cos(uTime * 0.34 + uv.x * 2.7) * 0.008;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const paperFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform float uIgnition;
  uniform float uAspect;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float radial = length(vec2(centered.x, centered.y * uAspect));
    float paperNoise = fbm(vUv * 6.0 + uTime * 0.08);
    float fineNoise = fbm(vUv * 24.0 - uTime * 0.18);
    float fiberNoise = fbm(vec2(vUv.x * 110.0, vUv.y * 10.0));
    float burnFront = mix(0.02, 0.94, uProgress);
    float signedField = radial + (paperNoise - 0.5) * 0.12 + (fineNoise - 0.5) * 0.035 - burnFront;

    float paperMask = smoothstep(-0.025, 0.02, signedField);
    float edge = 1.0 - smoothstep(0.0, 0.07, abs(signedField));
    float hotCore = 1.0 - smoothstep(0.0, 0.028, abs(signedField));
    float charMask =
      smoothstep(-0.004, 0.06, signedField) *
      (1.0 - smoothstep(0.065, 0.15, signedField));

    float ignition = (1.0 - smoothstep(0.0, 0.12, radial)) * uIgnition;
    float emberPulse = 0.84 + 0.16 * sin(uTime * 17.0 + radial * 31.0);

    vec3 paperColor = vec3(0.92, 0.89, 0.82);
    paperColor += (paperNoise - 0.5) * 0.05;
    paperColor += (fiberNoise - 0.5) * 0.03;

    vec3 charColor = vec3(0.085, 0.06, 0.045);
    vec3 emberColor = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.84, 0.5), hotCore);
    vec3 color = mix(paperColor, charColor, charMask * 0.95);
    color += emberColor * edge * (1.08 + 0.35 * emberPulse);
    color += vec3(1.0, 0.65, 0.22) * ignition * (0.5 + 0.2 * sin(uTime * 20.0));

    float alpha = max(paperMask, edge * 0.2 + ignition * 0.2);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function createSpriteTexture(inner: string, outer: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.32, outer);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

export function StartupExperience() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [renderFailed, setRenderFailed] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    setCopyVisible(false);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canUseWebGL()) {
      setRenderFailed(true);
      setCopyVisible(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setRenderFailed(true);
      setCopyVisible(true);
      return;
    }

    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    mountNode.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND_COLOR);
    scene.fog = new THREE.FogExp2(BACKGROUND_COLOR, 0.05);

    const camera = new THREE.PerspectiveCamera(isMobile ? 28 : 24, window.innerWidth / window.innerHeight, 0.1, 32);
    const cameraStartZ = isMobile ? 8.7 : 9.6;
    const cameraEndZ = isMobile ? 7.9 : 8.8;
    camera.position.set(0, 0.05, cameraStartZ);
    camera.lookAt(0, 0, 0);

    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.42,
      0.4,
      0.78,
    );
    composer.addPass(bloomPass);

    scene.add(new THREE.AmbientLight(0x0d0f13, 0.7));

    const fill = new THREE.HemisphereLight(0x3a4555, 0x050506, 0.45);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x6b7488, 0.32);
    rim.position.set(-1.8, 1.2, 2.6);
    scene.add(rim);

    const ignitionLight = new THREE.PointLight(0xff8b2f, 0, 6, 2);
    ignitionLight.position.set(0, 0, 1.15);
    scene.add(ignitionLight);

    const glowTexture = createSpriteTexture("rgba(255,170,72,0.95)", "rgba(255,120,36,0.08)");
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture ?? undefined,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0xffa550,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(isMobile ? 2.2 : 2.6, isMobile ? 2.2 : 2.6, 1);
    glow.position.set(0, 0, 0.45);
    scene.add(glow);

    const paperWidth = isMobile ? 4.2 : 5.4;
    const paperHeight = isMobile ? 5.6 : 7;
    const paperGeometry = new THREE.PlaneGeometry(paperWidth, paperHeight, 140, 180);
    const paperUniforms = {
      uTime: { value: 0 },
      uProgress: { value: prefersReducedMotion ? 1 : 0 },
      uIgnition: { value: prefersReducedMotion ? 0 : 1 },
      uAspect: { value: paperHeight / paperWidth },
    };
    const paperMaterial = new THREE.ShaderMaterial({
      uniforms: paperUniforms,
      vertexShader: paperVertexShader,
      fragmentShader: paperFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.position.set(0, 0, 0);
    paper.rotation.set(0.024, -0.018, 0.009);
    scene.add(paper);

    const emberTexture = createSpriteTexture("rgba(255,245,210,1)", "rgba(255,122,20,0.12)");
    const emberCount = 24;
    const emberGeometry = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberColors = new Float32Array(emberCount * 3);
    const emberSeeds = Array.from({ length: emberCount }, (_, index) => ({
      angle: (index / emberCount) * Math.PI * 2 + Math.random() * 0.4,
      radius: 0.08 + Math.random() * 0.16,
      height: 0.2 + Math.random() * 0.8,
      drift: 0.12 + Math.random() * 0.32,
      speed: 0.42 + Math.random() * 0.8,
    }));
    for (let index = 0; index < emberCount; index += 1) {
      emberColors[index * 3] = 1;
      emberColors[index * 3 + 1] = 0.54 + Math.random() * 0.16;
      emberColors[index * 3 + 2] = 0.08;
    }
    emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
    emberGeometry.setAttribute("color", new THREE.BufferAttribute(emberColors, 3));
    const emberMaterial = new THREE.PointsMaterial({
      map: emberTexture ?? undefined,
      size: isMobile ? 0.08 : 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const embers = new THREE.Points(emberGeometry, emberMaterial);
    embers.position.z = 0.3;
    scene.add(embers);

    const smokeTexture = createSpriteTexture("rgba(212,214,220,0.42)", "rgba(94,96,106,0.02)");
    const smokeCount = 46;
    const smokeGeometry = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeColors = new Float32Array(smokeCount * 3);
    const smokeSeeds = Array.from({ length: smokeCount }, (_, index) => ({
      angle: (index / smokeCount) * Math.PI * 2 + Math.random() * 1.1,
      spread: 0.05 + Math.random() * 0.18,
      sway: 0.14 + Math.random() * 0.3,
      lift: 0.22 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.38 + Math.random() * 0.75,
    }));
    for (let index = 0; index < smokeCount; index += 1) {
      const value = 0.36 + Math.random() * 0.1;
      smokeColors[index * 3] = value;
      smokeColors[index * 3 + 1] = value;
      smokeColors[index * 3 + 2] = value + 0.02;
    }
    smokeGeometry.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
    smokeGeometry.setAttribute("color", new THREE.BufferAttribute(smokeColors, 3));
    const smokeMaterial = new THREE.PointsMaterial({
      map: smokeTexture ?? undefined,
      size: isMobile ? 0.42 : 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
    smoke.position.z = 0.35;
    scene.add(smoke);

    const dustCount = 110;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      dustPositions[index * 3] = (Math.random() - 0.5) * 16;
      dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPositions[index * 3 + 2] = -4 - Math.random() * 7;
    }
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x62697b,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      size: isMobile ? 0.02 : 0.028,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    let disposed = false;
    let revealed = false;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const rawBurn = prefersReducedMotion ? 1 : clamp((elapsed - IGNITION_DELAY) / BURN_DURATION, 0, 1);
      const burn = easeInOutCubic(rawBurn);
      const ignition = prefersReducedMotion
        ? 0
        : clamp(1 - rawBurn * 1.25, 0, 1) * (0.8 + 0.2 * Math.sin(elapsed * 18));

      paperUniforms.uTime.value = elapsed;
      paperUniforms.uProgress.value = burn;
      paperUniforms.uIgnition.value = ignition;

      paper.visible = burn < 0.996 || ignition > 0.02;
      paper.rotation.y = -0.018 + Math.sin(elapsed * 0.24) * 0.01;
      paper.rotation.x = 0.024 + Math.cos(elapsed * 0.21) * 0.008;

      const push = prefersReducedMotion ? 1 : burn;
      camera.position.z = THREE.MathUtils.lerp(cameraStartZ, cameraEndZ, push);
      camera.position.x = Math.sin(elapsed * 0.18) * 0.04;
      camera.position.y = 0.05 + Math.cos(elapsed * 0.22) * 0.02;
      camera.lookAt(0, 0, -0.4 * push);

      ignitionLight.intensity = prefersReducedMotion ? 0 : 0.18 + ignition * 2.2;
      glow.material.opacity = prefersReducedMotion ? 0.08 : 0.04 + ignition * 0.55;
      glow.scale.setScalar((isMobile ? 2.2 : 2.6) + burn * 0.7);

      for (let index = 0; index < emberCount; index += 1) {
        const seed = emberSeeds[index];
        const cycle = Math.max(elapsed - IGNITION_DELAY, 0) * seed.speed + index * 0.11;
        const life = cycle % 1.18;
        const travel = life / 1.18;
        const strength = clamp((rawBurn - 0.03) / 0.97, 0, 1);
        const radius = seed.radius + burn * (0.18 + seed.drift);
        emberPositions[index * 3] = Math.cos(seed.angle + elapsed * 0.22) * radius * travel * strength;
        emberPositions[index * 3 + 1] = Math.sin(seed.angle) * seed.radius * 0.14 + travel * seed.height * strength - 0.04;
        emberPositions[index * 3 + 2] = 0.16 + travel * 0.6;
      }
      emberGeometry.attributes.position.needsUpdate = true;
      emberMaterial.opacity = prefersReducedMotion ? 0.14 : 0.08 + burn * 0.25;

      for (let index = 0; index < smokeCount; index += 1) {
        const seed = smokeSeeds[index];
        const cycle = Math.max(elapsed - IGNITION_DELAY * 0.8, 0) * seed.speed + index * 0.08;
        const life = cycle % 1.55;
        const travel = life / 1.55;
        const spread = (0.08 + burn * 1.2) * seed.spread;
        smokePositions[index * 3] =
          Math.cos(seed.angle + elapsed * 0.08 + seed.phase) * spread +
          Math.sin(elapsed * 0.4 + seed.phase) * seed.sway * 0.06;
        smokePositions[index * 3 + 1] = -0.04 + travel * seed.lift + Math.sin(seed.phase + elapsed * 0.46) * 0.05;
        smokePositions[index * 3 + 2] = 0.2 + travel * 1.2;
      }
      smokeGeometry.attributes.position.needsUpdate = true;
      smokeMaterial.opacity = prefersReducedMotion ? 0.08 : 0.04 + (1 - Math.abs(rawBurn - 0.45) * 1.6) * 0.08;

      dust.rotation.z = elapsed * 0.008;

      if (!revealed && rawBurn >= 0.72) {
        revealed = true;
        setCopyVisible(true);
      }

      composer.render();
      rafRef.current = window.requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      const mobile = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = mobile ? 28 : 24;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      bloomPass.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((entry) => {
            const target = entry as THREE.Material & { map?: THREE.Texture | null };
            target.map?.dispose?.();
            target.dispose();
          });
        } else if (material) {
          const target = material as THREE.Material & { map?: THREE.Texture | null };
          target.map?.dispose?.();
          target.dispose();
        }
      });

      glowTexture?.dispose();
      emberTexture?.dispose();
      smokeTexture?.dispose();
      composer.dispose();
      renderer.dispose();
      mountNode.innerHTML = "";
      if (!disposed) return;
    };
  }, []);

  return (
    <div className="startup">
      <div className="startup__nav">
        <a href="https://chloeverse.io" target="_blank" rel="noreferrer">
          chloeverse
        </a>
        <a href="https://imchloekang.com" target="_blank" rel="noreferrer">
          candy castle
        </a>
      </div>

      <div ref={mountRef} className="startup__canvas" aria-hidden={renderFailed} />

      <div className={`startup__copy ${copyVisible ? "startup__copy--visible" : ""}`}>
        <p>COMING SOON</p>
        <span>4.20</span>
      </div>

      {renderFailed ? <div className="startup__fallback-burn" /> : null}

      <style jsx>{`
        .startup {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #030304;
          color: #f4efe7;
        }

        .startup__canvas {
          position: absolute;
          inset: 0;
        }

        .startup__nav {
          position: absolute;
          inset: 0 0 auto 0;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          padding: 22px 24px;
          pointer-events: none;
          font-size: 13px;
          letter-spacing: 0.015em;
          text-transform: lowercase;
        }

        .startup__nav a {
          pointer-events: auto;
          color: rgba(244, 239, 231, 0.72);
          text-decoration: none;
          transition: color 180ms ease, opacity 180ms ease;
        }

        .startup__nav a:hover,
        .startup__nav a:focus-visible {
          color: rgba(244, 239, 231, 0.96);
          opacity: 1;
        }

        .startup__copy {
          position: absolute;
          inset: 50% auto auto 50%;
          z-index: 2;
          display: grid;
          gap: 10px;
          width: min(88vw, 980px);
          transform: translate3d(-50%, -50%, 0) scale(0.985);
          text-align: center;
          opacity: 0;
          transition: opacity 720ms ease, transform 920ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }

        .startup__copy--visible {
          opacity: 1;
          transform: translate3d(-50%, -50%, 0) scale(1);
        }

        .startup__copy p,
        .startup__copy span {
          margin: 0;
          font-family: "Arial Black", "Helvetica Neue", Helvetica, sans-serif;
          font-weight: 900;
          line-height: 0.95;
          color: rgba(244, 239, 231, 0.96);
          text-shadow:
            0 0 18px rgba(255, 246, 230, 0.08),
            0 0 42px rgba(255, 214, 144, 0.03);
          animation: floatDrift 6.8s ease-in-out infinite;
        }

        .startup__copy p {
          font-size: clamp(38px, 7vw, 110px);
          letter-spacing: 0.12em;
        }

        .startup__copy span {
          font-size: clamp(22px, 3vw, 42px);
          letter-spacing: 0.3em;
          animation-duration: 7.6s;
          animation-delay: 0.35s;
          opacity: 0.92;
        }

        .startup__fallback-burn {
          position: absolute;
          inset: 50% auto auto 50%;
          width: min(56vw, 320px);
          aspect-ratio: 0.76;
          transform: translate(-50%, -50%);
          background:
            radial-gradient(circle at center, transparent 0 13%, rgba(255, 188, 98, 0.8) 15%, rgba(72, 33, 14, 0.68) 19%, rgba(0, 0, 0, 0) 30%),
            linear-gradient(180deg, rgba(236, 228, 211, 0.9), rgba(204, 196, 182, 0.86));
          box-shadow: 0 0 48px rgba(255, 125, 52, 0.08);
          pointer-events: none;
        }

        @keyframes floatDrift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -7px, 0);
          }
        }

        @media (max-width: 767px) {
          .startup__copy {
            gap: 14px;
          }

          .startup__copy p {
            font-size: clamp(34px, 10vw, 68px);
            letter-spacing: 0.1em;
          }

          .startup__copy span {
            font-size: clamp(20px, 5vw, 30px);
            letter-spacing: 0.22em;
          }
        }
      `}</style>
    </div>
  );
}
