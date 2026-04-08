"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Silkscreen } from "next/font/google";
import { useRouter } from "next/navigation";

import { useAudioGate } from "@/hooks/useAudioGate";
import { CONTACT_DETAILS } from "@/lib/mobile-content";

import styles from "./ContactMissionGame.module.css";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;
const SHIP_RADIUS = 9;
const MISSION_DURATION = 20;
const DOCK_DURATION = 4.8;
const MAX_INTEGRITY = 100;
const DAMAGE_PER_HIT = 22;
const DAMAGE_PER_ENEMY_SHOT = 12;
const SHOT_COOLDOWN = 0.18;
const SHOT_SPEED = 238;
const PROJECTILE_TTL = 1.08;
const ENEMY_PROJECTILE_TTL = 1.8;
const MAX_DT = 1 / 30;
const RECENT_KIND_MEMORY = 4;

type ContactGamePhase = "boot" | "launch" | "flight" | "dock" | "card";
type PlanetKind =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";
type ObstacleKind = PlanetKind | "alien";
type ContactArtKey = PlanetKind | "ship" | "alien" | "station";
type ContactArtMap = Partial<Record<ContactArtKey, HTMLImageElement>>;
type ContactArtSourceMap = Record<ContactArtKey, string[]>;

type PlanetPalette = {
  body: string;
  shadow: string;
  highlight: string;
  accent: string;
  glow: string;
  ring?: string;
};

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
  twinkle: number;
};

type Cloud = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  hue: string;
  drift: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
  color: string;
};

type Projectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  ttl: number;
  friendly: boolean;
};

type Obstacle = {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  spin: number;
  spinVelocity: number;
  wobble: number;
  wobbleSpeed: number;
  shootCooldown: number;
  hp: number;
  maxHp: number;
  passed: boolean;
  destroyed: boolean;
  hitFlash: number;
};

type ShipState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tilt: number;
  flash: number;
  gunFlash: number;
};

type StationState = {
  x: number;
  y: number;
  size: number;
  glow: number;
  bayGlow: number;
};

type RunStats = {
  dodges: number;
  destroyed: number;
  shipsDestroyed: number;
  integrityLeft: number;
  survivedSeconds: number;
};

type HudState = {
  integrity: number;
  dodges: number;
  destroyed: number;
  aliens: number;
  timeLeft: number;
  progress: number;
};

type GameState = {
  phase: ContactGamePhase;
  phaseElapsed: number;
  flightElapsed: number;
  ship: ShipState;
  station: StationState;
  stars: Star[];
  clouds: Cloud[];
  particles: Particle[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
  obstacleId: number;
  projectileId: number;
  recentKinds: PlanetKind[];
  spawnTimer: number;
  shootCooldown: number;
  collisionCooldown: number;
  integrity: number;
  dodgeCount: number;
  destroyCount: number;
  alienDestroyCount: number;
  planetSpawnCount: number;
  alienSpawnCount: number;
  cameraShake: number;
  flash: number;
  dockOrigin: { x: number; y: number };
  cardPulse: number;
};

const PLANET_ORDER: PlanetKind[] = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

const CONTACT_ART_PATHS: ContactArtSourceMap = {
  ship: ["/contact/planet-dodge/ship.png", "/contact/planet-dodge/ship.svg"],
  alien: ["/contact/planet-dodge/alien-fighter.png"],
  station: ["/contact/planet-dodge/space-station.png"],
  mercury: ["/contact/planet-dodge/mercury.png", "/contact/planet-dodge/mercury.svg"],
  venus: ["/contact/planet-dodge/venus.png", "/contact/planet-dodge/venus.svg"],
  earth: ["/contact/planet-dodge/earth.png", "/contact/planet-dodge/earth.svg"],
  mars: ["/contact/planet-dodge/mars.png", "/contact/planet-dodge/mars.svg"],
  jupiter: ["/contact/planet-dodge/jupiter.png", "/contact/planet-dodge/jupiter.svg"],
  saturn: ["/contact/planet-dodge/saturn.png", "/contact/planet-dodge/saturn.svg"],
  uranus: ["/contact/planet-dodge/uranus.png", "/contact/planet-dodge/uranus.svg"],
  neptune: ["/contact/planet-dodge/neptune.png", "/contact/planet-dodge/neptune.svg"],
  pluto: ["/contact/planet-dodge/pluto.png", "/contact/planet-dodge/pluto.svg"],
};

const PLANET_PALETTES: Record<PlanetKind, PlanetPalette> = {
  mercury: {
    body: "#b79275",
    shadow: "#61453a",
    highlight: "#f0cfbb",
    accent: "#8b6451",
    glow: "rgba(240, 206, 187, 0.16)",
  },
  venus: {
    body: "#deb472",
    shadow: "#8b6132",
    highlight: "#fff0ca",
    accent: "#f6d18a",
    glow: "rgba(255, 228, 182, 0.16)",
  },
  earth: {
    body: "#3f7fe5",
    shadow: "#14365e",
    highlight: "#d5f2ff",
    accent: "#61bf7a",
    glow: "rgba(122, 176, 255, 0.18)",
  },
  mars: {
    body: "#c86d57",
    shadow: "#6b3026",
    highlight: "#ffd0ba",
    accent: "#f3a685",
    glow: "rgba(255, 191, 172, 0.14)",
  },
  jupiter: {
    body: "#d0a171",
    shadow: "#7c5132",
    highlight: "#fff0d7",
    accent: "#b46b46",
    glow: "rgba(255, 224, 197, 0.18)",
  },
  saturn: {
    body: "#d9be92",
    shadow: "#7f6846",
    highlight: "#fff3da",
    accent: "#b89a6f",
    glow: "rgba(255, 233, 197, 0.14)",
    ring: "#d8c19a",
  },
  uranus: {
    body: "#8fd0d4",
    shadow: "#2b6063",
    highlight: "#ecffff",
    accent: "#b6f1f3",
    glow: "rgba(190, 249, 255, 0.14)",
  },
  neptune: {
    body: "#5f79f2",
    shadow: "#1e2d74",
    highlight: "#dce7ff",
    accent: "#92aeff",
    glow: "rgba(146, 174, 255, 0.16)",
  },
  pluto: {
    body: "#d9c7b9",
    shadow: "#5c4a53",
    highlight: "#fff7ec",
    accent: "#c493b7",
    glow: "rgba(255, 241, 220, 0.22)",
  },
};

const SOCIAL_LINKS = [
  { label: "Instagram", href: CONTACT_DETAILS.instagram },
  { label: "TikTok", href: CONTACT_DETAILS.tiktok },
  { label: "LinkedIn", href: CONTACT_DETAILS.linkedin },
  { label: "X", href: CONTACT_DETAILS.x },
] as const;

const pixelFont = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function easeInOutSine(value: number) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function createStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    size: Math.random() > 0.78 ? 2 : 1,
    speed: 12 + Math.random() * 55,
    twinkle: Math.random() * Math.PI * 2,
  }));
}

function createClouds(count: number): Cloud[] {
  const hues = ["rgba(79,118,220,0.12)", "rgba(204,144,255,0.08)", "rgba(255,192,140,0.07)"];
  return Array.from({ length: count }, (_, index) => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT * 0.7,
    radius: 36 + Math.random() * 68,
    alpha: 0.28 + Math.random() * 0.22,
    hue: hues[index % hues.length] ?? hues[0],
    drift: -6 + Math.random() * 12,
  }));
}

function createInitialState(phase: ContactGamePhase = "boot"): GameState {
  return {
    phase,
    phaseElapsed: 0,
    flightElapsed: 0,
    ship: {
      x: GAME_WIDTH * 0.5,
      y: GAME_HEIGHT * 0.76,
      vx: 0,
      vy: 0,
      tilt: 0,
      flash: 0,
      gunFlash: 0,
    },
    station: {
      x: GAME_WIDTH * 0.5,
      y: -110,
      size: 54,
      glow: 0,
      bayGlow: 0,
    },
    stars: createStars(96),
    clouds: createClouds(9),
    particles: [],
    projectiles: [],
    obstacles: [],
    obstacleId: 0,
    projectileId: 0,
    recentKinds: [],
    spawnTimer: 0.52,
    shootCooldown: 0,
    collisionCooldown: 0,
    integrity: MAX_INTEGRITY,
    dodgeCount: 0,
    destroyCount: 0,
    alienDestroyCount: 0,
    planetSpawnCount: 0,
    alienSpawnCount: 0,
    cameraShake: 0,
    flash: 0,
    dockOrigin: {
      x: GAME_WIDTH * 0.5,
      y: GAME_HEIGHT * 0.28,
    },
    cardPulse: 0,
  };
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function spawnBurst(game: GameState, x: number, y: number, color: string, count: number) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.5;
    const velocity = 20 + Math.random() * 70;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      size: 1 + Math.floor(Math.random() * 3),
      life: 0,
      ttl: 0.25 + Math.random() * 0.35,
      color,
    });
  }
}

function spawnExhaust(game: GameState, intensity = 1) {
  const x = game.ship.x;
  const y = game.ship.y + 9;
  game.particles.push({
    x: x - 1 + Math.random() * 2,
    y,
    vx: -4 + Math.random() * 8,
    vy: (18 + Math.random() * 32) * intensity,
    size: 1 + Math.floor(Math.random() * 2),
    life: 0,
    ttl: 0.18 + Math.random() * 0.18,
    color: Math.random() > 0.5 ? "#ffd3a1" : "#ff8a5c",
  });
}

function spawnProjectile(game: GameState) {
  game.projectiles.push({
    id: game.projectileId,
    x: game.ship.x + Math.sin(game.ship.tilt) * 4,
    y: game.ship.y - 13,
    vx: Math.sin(game.ship.tilt) * 28,
    vy: -SHOT_SPEED + game.ship.vy * 0.2,
    radius: 3,
    life: 0,
    ttl: PROJECTILE_TTL,
    friendly: true,
  });
  game.projectileId += 1;
  game.ship.gunFlash = 1;
  spawnBurst(game, game.ship.x, game.ship.y - 13, "#ffe9b8", 5);
}

function spawnAlienProjectile(game: GameState, obstacle: Obstacle) {
  const dx = game.ship.x - obstacle.x;
  const dy = Math.max(18, game.ship.y - obstacle.y);
  const length = Math.hypot(dx, dy) || 1;
  const intensity = clamp(game.flightElapsed / MISSION_DURATION, 0, 1);
  const speed = 128 + intensity * 18;

  game.projectiles.push({
    id: game.projectileId,
    x: obstacle.x,
    y: obstacle.y + obstacle.radius * 0.65,
    vx: (dx / length) * speed * 0.38,
    vy: Math.abs((dy / length) * speed) + 78,
    radius: 2.5,
    life: 0,
    ttl: ENEMY_PROJECTILE_TTL,
    friendly: false,
  });
  game.projectileId += 1;
  obstacle.hitFlash = Math.max(obstacle.hitFlash, 0.42);
}

function choosePlanet(intensity: number, recentKinds: PlanetKind[], usedKinds: PlanetKind[]): PlanetKind {
  const giantPool: PlanetKind[] = intensity > 0.72 ? ["jupiter", "saturn"] : [];
  const weightedPool = [...PLANET_ORDER, ...giantPool];
  const uniquePool = Array.from(new Set(weightedPool));

  const notRecentlySeen = uniquePool.filter((kind) => !recentKinds.includes(kind) && !usedKinds.includes(kind));
  if (notRecentlySeen.length > 0) {
    return notRecentlySeen[Math.floor(Math.random() * notRecentlySeen.length)] ?? "mars";
  }

  const notUsedThisWave = uniquePool.filter((kind) => !usedKinds.includes(kind));
  if (notUsedThisWave.length > 0) {
    return notUsedThisWave[Math.floor(Math.random() * notUsedThisWave.length)] ?? "mars";
  }

  return uniquePool[Math.floor(Math.random() * uniquePool.length)] ?? "mars";
}

function chooseObstacleKind(game: GameState, usedKinds: ObstacleKind[], intensity: number): ObstacleKind {
  if (game.alienSpawnCount < game.planetSpawnCount && !usedKinds.includes("alien")) {
    return "alien";
  }

  if (game.planetSpawnCount < game.alienSpawnCount) {
    return choosePlanet(intensity, game.recentKinds, usedKinds.filter((kind): kind is PlanetKind => kind !== "alien"));
  }

  if (Math.random() > 0.5 && !usedKinds.includes("alien")) {
    return "alien";
  }

  return choosePlanet(intensity, game.recentKinds, usedKinds.filter((kind): kind is PlanetKind => kind !== "alien"));
}

function spawnObstacle(game: GameState) {
  const intensity = clamp(game.flightElapsed / MISSION_DURATION, 0, 1);
  const count = intensity > 0.22 && Math.random() > 0.38 ? 2 : 1;
  const laneWidth = GAME_WIDTH - 110;
  const positions: number[] = [];
  const usedKinds: ObstacleKind[] = [];

  for (let index = 0; index < count; index += 1) {
    let x = 55 + Math.random() * laneWidth;
    let attempts = 0;
    while (positions.some((existing) => Math.abs(existing - x) < 84) && attempts < 8) {
      x = 55 + Math.random() * laneWidth;
      attempts += 1;
    }
    positions.push(x);

    const kind = chooseObstacleKind(game, usedKinds, intensity);
    usedKinds.push(kind);

    if (kind === "alien") {
      game.obstacles.push({
        id: game.obstacleId,
        kind,
        x,
        y: -30 - Math.random() * 48,
        radius: 13 + intensity * 5 + Math.random() * 4,
        vx: (-56 + Math.random() * 112) * (0.55 + intensity * 0.35),
        vy: 62 + intensity * 92 + Math.random() * 24,
        spin: 0,
        spinVelocity: -0.24 + Math.random() * 0.48,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 2.2 + Math.random() * 1.4,
        shootCooldown: 0.45 + Math.random() * 0.4,
        hp: 1,
        maxHp: 1,
        passed: false,
        destroyed: false,
        hitFlash: 0,
      });
      game.alienSpawnCount += 1;
    } else {
      const radius =
        13 +
        intensity * 12 +
        Math.random() * 11 +
        (kind === "jupiter" ? 10 : 0) +
        (kind === "saturn" ? 8 : 0);
      const hp = kind === "jupiter" || kind === "saturn" ? 2 : 1;
      game.obstacles.push({
        id: game.obstacleId,
        kind,
        x,
        y: -radius - 22 - Math.random() * 60,
        radius,
        vx: (-24 + Math.random() * 48) * (0.3 + intensity * 0.6),
        vy: 44 + intensity * 84 + Math.random() * 30,
        spin: Math.random() * Math.PI * 2,
        spinVelocity: -0.7 + Math.random() * 1.4,
        wobble: 0,
        wobbleSpeed: 0,
        shootCooldown: 0,
        hp,
        maxHp: hp,
        passed: false,
        destroyed: false,
        hitFlash: 0,
      });
      game.planetSpawnCount += 1;
      game.recentKinds.push(kind);
      if (game.recentKinds.length > RECENT_KIND_MEMORY) {
        game.recentKinds = game.recentKinds.slice(-RECENT_KIND_MEMORY);
      }
    }

    game.obstacleId += 1;
  }
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  kind: PlanetKind,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  glowBoost = 0,
) {
  const palette = PLANET_PALETTES[kind];

  ctx.save();
  ctx.translate(x, y);

  if (kind === "saturn" && palette.ring) {
    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = Math.max(2, radius * 0.22);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.5, radius * 0.54, rotation * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 16 + glowBoost * 18;
  drawCircle(ctx, 0, 0, radius, palette.body);
  ctx.shadowBlur = 0;

  drawCircle(ctx, radius * 0.12, radius * 0.16, radius * 0.8, palette.shadow);
  drawCircle(ctx, -radius * 0.22, -radius * 0.28, radius * 0.48, palette.highlight);

  ctx.fillStyle = palette.accent;
  const craterCount = kind === "jupiter" ? 5 : kind === "saturn" ? 4 : 3;
  for (let index = 0; index < craterCount; index += 1) {
    const angle = rotation + index * 2.1;
    const craterRadius = Math.max(2, radius * (kind === "jupiter" ? 0.14 : 0.12));
    ctx.globalAlpha = 0.42;
    drawCircle(
      ctx,
      Math.cos(angle) * radius * 0.34,
      Math.sin(angle * 1.3) * radius * 0.26,
      craterRadius,
      palette.accent,
    );
  }
  ctx.globalAlpha = 1;

  if (kind === "earth") {
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-radius * 0.5, radius * 0.02, radius * 0.42, radius * 0.18);
    ctx.fillRect(radius * 0.06, -radius * 0.18, radius * 0.3, radius * 0.18);
  }

  if (kind === "jupiter") {
    ctx.fillStyle = "rgba(255,245,235,0.2)";
    for (let band = -2; band <= 2; band += 1) {
      ctx.fillRect(-radius, band * radius * 0.28, radius * 2, radius * 0.13);
    }
  }

  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, ship: ShipState, flightBoost: number, scale = 1) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.tilt);
  ctx.scale(scale, scale);

  const flashMix = ship.flash * 0.6;
  ctx.fillStyle = flashMix > 0.1 ? "#fff6ef" : "#efe2cc";
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(8, 10);
  ctx.lineTo(0, 6);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#6c5768";
  ctx.fillRect(-3, 1, 6, 8);

  ctx.fillStyle = "#fff4e3";
  ctx.fillRect(-1, -4, 2, 3);

  ctx.fillStyle = "#a58a62";
  ctx.fillRect(-1, -14, 2, 7);
  if (ship.gunFlash > 0.04) {
    ctx.fillStyle = "#fff0b0";
    ctx.fillRect(-2, -17, 4, 4);
  }

  ctx.fillStyle = "#ffb06c";
  ctx.fillRect(-3, 10, 2, 4 + flightBoost * 6);
  ctx.fillRect(1, 10, 2, 4 + flightBoost * 6);

  ctx.fillStyle = "#ffd6a7";
  ctx.fillRect(-2, 11, 4, 2 + flightBoost * 4);

  ctx.restore();
}

function drawAlienShip(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, glowBoost = 0) {
  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = "rgba(118, 255, 207, 0.28)";
  ctx.shadowBlur = 16 + glowBoost * 10;
  ctx.fillStyle = "#4ad7c3";
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.08);
  ctx.lineTo(radius * 0.28, -radius * 0.28);
  ctx.lineTo(radius * 0.9, radius * 0.56);
  ctx.lineTo(radius * 0.24, radius * 0.22);
  ctx.lineTo(0, radius * 0.84);
  ctx.lineTo(-radius * 0.24, radius * 0.22);
  ctx.lineTo(-radius * 0.9, radius * 0.56);
  ctx.lineTo(-radius * 0.28, -radius * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#16233a";
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.72);
  ctx.lineTo(radius * 0.18, -radius * 0.16);
  ctx.lineTo(radius * 0.36, radius * 0.36);
  ctx.lineTo(0, radius * 0.1);
  ctx.lineTo(-radius * 0.36, radius * 0.36);
  ctx.lineTo(-radius * 0.18, -radius * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#94fff1";
  ctx.fillRect(-radius * 0.6, radius * 0.42, radius * 0.24, radius * 0.1);
  ctx.fillRect(radius * 0.36, radius * 0.42, radius * 0.24, radius * 0.1);
  ctx.fillStyle = "#9be3ff";
  ctx.fillRect(-radius * 0.12, -radius * 0.36, radius * 0.24, radius * 0.16);
  ctx.fillStyle = "#ffe085";
  ctx.fillRect(-Math.max(1, radius * 0.08), -radius * 1.12, Math.max(2, radius * 0.16), radius * 0.44);
  ctx.fillRect(-radius * 0.16, radius * 0.04, radius * 0.32, radius * 0.12);
  ctx.fillStyle = "#2a9487";
  ctx.fillRect(-radius * 0.76, radius * 0.58, radius * 0.18, radius * 0.08);
  ctx.fillRect(radius * 0.58, radius * 0.58, radius * 0.18, radius * 0.08);
  ctx.restore();
}

function drawPlanetMotionOverlay(
  ctx: CanvasRenderingContext2D,
  kind: PlanetKind,
  radius: number,
  rotation: number,
) {
  ctx.save();
  ctx.rotate(rotation * 0.45);

  if (kind === "venus" || kind === "jupiter" || kind === "saturn" || kind === "uranus" || kind === "neptune") {
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.strokeStyle = "rgba(255, 248, 236, 0.22)";
    ctx.globalAlpha = 0.8;

    for (let band = -2; band <= 2; band += 1) {
      const y = band * radius * 0.22;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.72, y);
      ctx.bezierCurveTo(-radius * 0.22, y - radius * 0.1, radius * 0.18, y + radius * 0.12, radius * 0.7, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "rgba(255, 244, 232, 0.18)";
    ctx.globalAlpha = 0.9;

    for (let index = 0; index < 4; index += 1) {
      const angle = rotation + index * 1.4;
      const craterRadius = Math.max(2, radius * 0.09);
      drawCircle(
        ctx,
        Math.cos(angle) * radius * 0.32,
        Math.sin(angle * 1.12) * radius * 0.25,
        craterRadius,
        "rgba(255, 244, 232, 0.14)",
      );
    }

    if (kind === "pluto") {
      ctx.fillStyle = "rgba(255, 232, 245, 0.26)";
      ctx.beginPath();
      ctx.ellipse(-radius * 0.12, -radius * 0.08, radius * 0.18, radius * 0.13, rotation * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawPlanetVisual(
  ctx: CanvasRenderingContext2D,
  art: ContactArtMap,
  kind: PlanetKind,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  glowBoost = 0,
) {
  const sprite = art[kind];
  if (!sprite) {
    drawPlanet(ctx, kind, x, y, radius, rotation, glowBoost);
    return;
  }

  const palette = PLANET_PALETTES[kind];
  const scale = kind === "saturn" ? 3.05 : kind === "jupiter" ? 2.85 : kind === "pluto" ? 2.9 : 2.65;
  const size = radius * scale;

  ctx.save();
  ctx.translate(x, y);

  const auraRadius = kind === "saturn" ? size * 0.28 : size * 0.24;
  ctx.globalAlpha = 0.3 + glowBoost * 0.2;
  drawCircle(ctx, 0, 0, auraRadius, palette.glow);
  ctx.globalAlpha = 1;

  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 16 + glowBoost * 18;
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.shadowBlur = 0;
  drawPlanetMotionOverlay(ctx, kind, radius * 0.92, rotation);
  if (glowBoost > 0) {
    ctx.globalAlpha = Math.min(0.46, glowBoost * 0.32);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

function drawAlienVisual(
  ctx: CanvasRenderingContext2D,
  _art: ContactArtMap,
  x: number,
  y: number,
  radius: number,
  _rotation: number,
  glowBoost = 0,
) {
  drawAlienShip(ctx, x, y, radius, glowBoost);
}

function drawStation(ctx: CanvasRenderingContext2D, station: StationState) {
  ctx.save();
  ctx.translate(station.x, station.y);
  const width = station.size * 1.08;
  const height = station.size * 0.62;

  ctx.shadowColor = "rgba(255, 196, 129, 0.18)";
  ctx.shadowBlur = 18 + station.glow * 16;
  ctx.fillStyle = "#d6d5e2";
  ctx.fillRect(-width * 0.5, -height * 0.22, width, height * 0.42);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#59647f";
  ctx.fillRect(-width * 0.45, -height * 0.08, width * 0.9, height * 0.18);
  ctx.fillStyle = "#1c2340";
  ctx.fillRect(-width * 0.1, -height * 0.06, width * 0.2, height * 0.14);

  ctx.fillStyle = `rgba(255, 225, 160, ${0.2 + station.bayGlow * 0.55})`;
  ctx.fillRect(-width * 0.08, -height * 0.04, width * 0.16, height * 0.1);
  ctx.restore();
}

function drawStationVisual(ctx: CanvasRenderingContext2D, art: ContactArtMap, station: StationState) {
  const sprite = art.station;
  if (!sprite) {
    drawStation(ctx, station);
    return;
  }

  const width = station.size;
  const height = station.size * 0.62;

  ctx.save();
  ctx.translate(station.x, station.y);
  ctx.globalAlpha = 0.26 + station.glow * 0.18;
  drawCircle(ctx, 0, 0, station.size * 0.34, "rgba(255, 212, 168, 0.12)");
  ctx.globalAlpha = 1;
  ctx.shadowColor = "rgba(255, 196, 129, 0.16)";
  ctx.shadowBlur = 18 + station.glow * 18;
  ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255, 239, 194, ${0.12 + station.bayGlow * 0.34})`;
  ctx.fillRect(-station.size * 0.08, -station.size * 0.01, station.size * 0.16, station.size * 0.07);
  ctx.restore();
}

function drawDockingLane(ctx: CanvasRenderingContext2D, station: StationState, progress: number) {
  ctx.save();
  ctx.translate(station.x, station.y);
  ctx.strokeStyle = `rgba(255, 236, 207, ${0.08 + progress * 0.18})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-station.size * 0.12, station.size * 0.12);
  ctx.lineTo(-station.size * 0.04, -station.size * 0.02);
  ctx.moveTo(station.size * 0.12, station.size * 0.12);
  ctx.lineTo(station.size * 0.04, -station.size * 0.02);
  ctx.stroke();
  ctx.restore();
}

function drawShipVisual(
  ctx: CanvasRenderingContext2D,
  art: ContactArtMap,
  ship: ShipState,
  flightBoost: number,
  scale = 1,
) {
  const sprite = art.ship;
  if (!sprite) {
    drawShip(ctx, ship, flightBoost, scale);
    return;
  }

  const size = (31 + flightBoost * 6) * scale;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.tilt);
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.fillStyle = "#8e7a59";
  ctx.fillRect(-Math.max(1, size * 0.03), -size * 0.48, Math.max(2, size * 0.06), size * 0.18);
  if (ship.flash > 0.04) {
    ctx.globalAlpha = Math.min(0.52, ship.flash * 0.45);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  }
  if (ship.gunFlash > 0.04) {
    ctx.globalAlpha = Math.min(0.68, ship.gunFlash * 0.55);
    ctx.fillStyle = "#fff0b0";
    ctx.fillRect(-size * 0.08, -size * 0.54, size * 0.16, size * 0.16);
  }
  ctx.restore();
}

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const projectile of projectiles) {
    const alpha = clamp(1 - projectile.life / projectile.ttl, 0, 1);
    ctx.globalAlpha = alpha;
    if (projectile.friendly) {
      ctx.fillStyle = "#fff1ba";
      ctx.fillRect(projectile.x - 0.5, projectile.y - 5, 1, 10);
      ctx.fillStyle = "#ffc071";
      ctx.fillRect(projectile.x - 0.5, projectile.y + 4, 1, 2);
    } else {
      ctx.fillStyle = "#9fe7ff";
      ctx.fillRect(projectile.x - 1, projectile.y - 3, 2, 7);
      ctx.fillStyle = "#eaffff";
      ctx.fillRect(projectile.x, projectile.y - 1, 1, 3);
    }
  }
  ctx.globalAlpha = 1;
}

function drawBackground(ctx: CanvasRenderingContext2D, game: GameState, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#0e1630");
  gradient.addColorStop(0.55, "#0a1120");
  gradient.addColorStop(1, "#03050a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  for (const cloud of game.clouds) {
    cloud.x += cloud.drift * 0.0025;
    if (cloud.x < -cloud.radius * 2) cloud.x = GAME_WIDTH + cloud.radius;
    if (cloud.x > GAME_WIDTH + cloud.radius * 2) cloud.x = -cloud.radius;
    ctx.fillStyle = cloud.hue;
    ctx.globalAlpha = cloud.alpha;
    drawCircle(ctx, cloud.x, cloud.y, cloud.radius, cloud.hue);
  }
  ctx.globalAlpha = 1;

  for (const star of game.stars) {
    const speedBoost =
      game.phase === "dock" ? 0.7 : game.phase === "flight" ? 1.45 : game.phase === "launch" ? 0.6 : 0.45;
    star.y += star.speed * speedBoost * 0.006;
    if (star.y > GAME_HEIGHT + 4) {
      star.y = -4;
      star.x = Math.random() * GAME_WIDTH;
    }

    const pulse = 0.55 + Math.sin(time * 2.1 + star.twinkle) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${clamp(pulse, 0.25, 0.95)})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
    if (game.phase !== "boot") {
      ctx.fillStyle = "rgba(164,190,255,0.14)";
      ctx.fillRect(star.x, star.y - star.size * 3, star.size, star.size * 2);
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    const alpha = clamp(1 - particle.life / particle.ttl, 0, 1);
    ctx.fillStyle = particle.color.startsWith("rgba")
      ? particle.color.replace(/\d?\.\d+\)$/u, `${alpha})`)
      : particle.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function makeStats(game: GameState): RunStats {
  return {
    dodges: game.dodgeCount,
    destroyed: game.destroyCount,
    shipsDestroyed: game.alienDestroyCount,
    integrityLeft: Math.max(0, Math.round(game.integrity)),
    survivedSeconds: Number(game.flightElapsed.toFixed(1)),
  };
}

function makeHudState(game: GameState): HudState {
  return {
    integrity: Math.max(0, Math.round(game.integrity)),
    dodges: game.dodgeCount,
    destroyed: game.destroyCount,
    aliens: game.alienDestroyCount,
    timeLeft: Number(Math.max(0, MISSION_DURATION - game.flightElapsed).toFixed(1)),
    progress: clamp(game.flightElapsed / MISSION_DURATION, 0, 1),
  };
}

export default function ContactMissionGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [initialGameState] = useState<GameState>(() => createInitialState());
  const gameRef = useRef<GameState>(initialGameState);
  const artRef = useRef<ContactArtMap>({});
  const rafRef = useRef<number | null>(null);
  const phaseStateRef = useRef<ContactGamePhase>("boot");
  const hudKeyRef = useRef("");
  const startedAudioRef = useRef(false);
  const keyStateRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  });
  const copyTimeoutRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<ContactGamePhase>("boot");
  const [stats, setStats] = useState<RunStats | null>(null);
  const [hud, setHud] = useState<HudState>(() => makeHudState(initialGameState));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const {
    muted,
    requestStart,
    toggleMuted,
    playHoverChime,
    playFocusWhoosh,
    playOpenBloom,
  } = useAudioGate({
    volume: 0.32,
    ambientLevel: 0.34,
    style: "arcade",
  });

  const updatePhase = useCallback((nextPhase: ContactGamePhase) => {
    if (phaseStateRef.current === nextPhase) return;
    phaseStateRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const startAudio = useCallback(() => {
    if (startedAudioRef.current) return;
    startedAudioRef.current = true;
    void requestStart();
  }, [requestStart]);

  const restartGame = useCallback(() => {
    startAudio();
    const nextState = createInitialState("launch");
    nextState.phaseElapsed = 0;
    gameRef.current = nextState;
    hudKeyRef.current = "";
    setHud(makeHudState(nextState));
    setStats(null);
    updatePhase("launch");
    playFocusWhoosh(0.7);
  }, [playFocusWhoosh, startAudio, updatePhase]);

  const copyEmail = useCallback(async () => {
    startAudio();
    try {
      await navigator.clipboard.writeText(CONTACT_DETAILS.email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 1400);
  }, [startAudio]);

  useEffect(() => {
    let cancelled = false;

    const loadAsset = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
      });

    const loadAssetCandidates = async (sources: string[]) => {
      for (const source of sources) {
        try {
          return await loadAsset(source);
        } catch {
          continue;
        }
      }
      throw new Error(`Failed to load any art source: ${sources.join(", ")}`);
    };

    void Promise.allSettled(
      Object.entries(CONTACT_ART_PATHS).map(async ([key, sources]) => {
        const image = await loadAssetCandidates(sources);
        if (!cancelled) {
          artRef.current[key as ContactArtKey] = image;
        }
      }),
    );

    return () => {
      cancelled = true;
      artRef.current = {};
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter", "r"].includes(key)) {
        event.preventDefault();
        startAudio();
      }

      if (phaseStateRef.current === "boot" && (key === " " || key === "enter" || ["w", "a", "s", "d"].includes(key))) {
        restartGame();
        return;
      }

      if (phaseStateRef.current === "card" && key === "r") {
        restartGame();
        return;
      }

      if (key === "w" || key === "arrowup") keyStateRef.current.up = true;
      if (key === "s" || key === "arrowdown") keyStateRef.current.down = true;
      if (key === "a" || key === "arrowleft") keyStateRef.current.left = true;
      if (key === "d" || key === "arrowright") keyStateRef.current.right = true;
      if (key === " ") keyStateRef.current.fire = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "w" || key === "arrowup") keyStateRef.current.up = false;
      if (key === "s" || key === "arrowdown") keyStateRef.current.down = false;
      if (key === "a" || key === "arrowleft") keyStateRef.current.left = false;
      if (key === "d" || key === "arrowright") keyStateRef.current.right = false;
      if (key === " ") keyStateRef.current.fire = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [restartGame, startAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.imageSmoothingEnabled = false;

    let lastTime = performance.now();

    const step = (frameTime: number) => {
      const dt = Math.min(MAX_DT, (frameTime - lastTime) / 1000 || 0.016);
      lastTime = frameTime;

      const game = gameRef.current;
      game.phaseElapsed += dt;
      game.cardPulse += dt;
      game.cameraShake = Math.max(0, game.cameraShake - dt * 2.5);
      game.flash = Math.max(0, game.flash - dt * 1.4);
      game.ship.flash = Math.max(0, game.ship.flash - dt * 2.8);
      game.ship.gunFlash = Math.max(0, game.ship.gunFlash - dt * 6.4);
      game.collisionCooldown = Math.max(0, game.collisionCooldown - dt);
      game.shootCooldown = Math.max(0, game.shootCooldown - dt);

      if (game.phase === "launch") {
        game.ship.y = lerp(game.ship.y, GAME_HEIGHT * 0.72, 0.08);
        spawnExhaust(game, 0.85);

        if (game.phaseElapsed > 1.05) {
          game.phase = "flight";
          game.phaseElapsed = 0;
          updatePhase("flight");
          playFocusWhoosh(0.6);
        }
      }

      if (game.phase === "flight") {
        game.flightElapsed += dt;
        const inputX = (keyStateRef.current.right ? 1 : 0) - (keyStateRef.current.left ? 1 : 0);
        const inputY = (keyStateRef.current.down ? 1 : 0) - (keyStateRef.current.up ? 1 : 0);
        const intensity = clamp(game.flightElapsed / MISSION_DURATION, 0, 1);
        const targetVx = inputX * (116 + intensity * 40);
        const targetVy = inputY * (90 + intensity * 22);

        game.ship.vx = lerp(game.ship.vx, targetVx, 0.12);
        game.ship.vy = lerp(game.ship.vy, targetVy, 0.12);
        game.ship.x = clamp(game.ship.x + game.ship.vx * dt, 22, GAME_WIDTH - 22);
        game.ship.y = clamp(game.ship.y + game.ship.vy * dt, GAME_HEIGHT * 0.34, GAME_HEIGHT - 24);
        game.ship.tilt = lerp(game.ship.tilt, game.ship.vx / 240, 0.16);

        if (keyStateRef.current.fire && game.shootCooldown <= 0) {
          spawnProjectile(game);
          game.shootCooldown = SHOT_COOLDOWN;
        }

        spawnExhaust(game);

        game.spawnTimer -= dt;
        if (game.spawnTimer <= 0) {
          spawnObstacle(game);
          game.spawnTimer = 0.68 - intensity * 0.2 + Math.random() * 0.14;
        }

        for (const projectile of game.projectiles) {
          projectile.life += dt;
          projectile.x += projectile.vx * dt;
          projectile.y += projectile.vy * dt;
        }

        let alienProjectileBudget = Math.max(
          0,
          4 - game.projectiles.filter((projectile) => !projectile.friendly && projectile.life < projectile.ttl).length,
        );

        for (const obstacle of game.obstacles) {
          if (obstacle.destroyed) continue;

          const wobbleOffset =
            obstacle.kind === "alien"
              ? Math.sin(game.flightElapsed * obstacle.wobbleSpeed + obstacle.wobble) * (10 + obstacle.radius * 0.2)
              : 0;
          obstacle.x += obstacle.vx * dt + wobbleOffset * dt;
          obstacle.y += obstacle.vy * dt;
          obstacle.spin += obstacle.spinVelocity * dt;
          obstacle.hitFlash = Math.max(0, obstacle.hitFlash - dt * 3.4);
          obstacle.shootCooldown = Math.max(0, obstacle.shootCooldown - dt);

          if (
            obstacle.kind === "alien" &&
            alienProjectileBudget > 0 &&
            obstacle.shootCooldown <= 0 &&
            obstacle.y > 28 &&
            obstacle.y < GAME_HEIGHT * 0.78 &&
            Math.abs(obstacle.x - game.ship.x) < 140
          ) {
            spawnAlienProjectile(game, obstacle);
            obstacle.shootCooldown = 0.55 + Math.random() * 0.35;
            alienProjectileBudget -= 1;
          }

          const dx = obstacle.x - game.ship.x;
          const dy = obstacle.y - game.ship.y;
          const distance = Math.hypot(dx, dy);
          const collisionDistance = obstacle.radius + SHIP_RADIUS - 4;

          if (game.collisionCooldown <= 0 && distance < collisionDistance) {
            game.integrity = clamp(game.integrity - DAMAGE_PER_HIT, 0, MAX_INTEGRITY);
            game.cameraShake = 1;
            game.flash = 0.72;
            game.ship.flash = 1;
            game.collisionCooldown = 0.68;
            obstacle.hitFlash = 1;
            game.ship.vx -= dx * 1.35;
            game.ship.vy -= dy * 0.95;
            spawnBurst(game, obstacle.x, obstacle.y, obstacle.kind === "alien" ? "#afffe6" : "#ffd3bf", 14);
            playFocusWhoosh(1.1);
          }

          if (!obstacle.passed && obstacle.y > game.ship.y + obstacle.radius + 12) {
            obstacle.passed = true;
            game.dodgeCount += 1;
          }
        }

        for (const projectile of game.projectiles) {
          if (projectile.life >= projectile.ttl) continue;
          if (!projectile.friendly) {
            const distance = Math.hypot(projectile.x - game.ship.x, projectile.y - game.ship.y);
            if (game.collisionCooldown <= 0 && distance < projectile.radius + SHIP_RADIUS - 1) {
              projectile.life = projectile.ttl;
              game.integrity = clamp(game.integrity - DAMAGE_PER_ENEMY_SHOT, 0, MAX_INTEGRITY);
              game.cameraShake = Math.max(game.cameraShake, 0.42);
              game.flash = Math.max(game.flash, 0.34);
              game.ship.flash = 1;
              game.collisionCooldown = 0.48;
              spawnBurst(game, projectile.x, projectile.y, "#b9f2ff", 8);
              playFocusWhoosh(0.86);
            }
            continue;
          }

          for (const obstacle of game.obstacles) {
            if (obstacle.destroyed) continue;
            const distance = Math.hypot(obstacle.x - projectile.x, obstacle.y - projectile.y);
            if (distance > obstacle.radius + projectile.radius) continue;

            projectile.life = projectile.ttl;
            obstacle.hitFlash = 1;
            obstacle.hp -= 1;

            if (obstacle.hp <= 0) {
              obstacle.destroyed = true;
              game.destroyCount += 1;
              if (obstacle.kind === "alien") {
                game.alienDestroyCount += 1;
              }
              game.cameraShake = Math.max(game.cameraShake, 0.24);
              game.flash = Math.max(game.flash, 0.14);
              spawnBurst(game, obstacle.x, obstacle.y, obstacle.kind === "alien" ? "#a2ffe0" : "#ffd7b6", 16);
            } else {
              spawnBurst(game, obstacle.x, obstacle.y, "#ffe2c1", 7);
            }
            break;
          }
        }

        game.projectiles = game.projectiles.filter(
          (projectile) =>
            projectile.life < projectile.ttl &&
            projectile.y > -24 &&
            projectile.y < GAME_HEIGHT + 24 &&
            projectile.x > -24 &&
            projectile.x < GAME_WIDTH + 24,
        );

        game.obstacles = game.obstacles.filter(
          (obstacle) => !obstacle.destroyed && obstacle.y < GAME_HEIGHT + obstacle.radius + 24,
        );

        if (game.flightElapsed >= MISSION_DURATION) {
          game.phase = "dock";
          game.phaseElapsed = 0;
          game.dockOrigin = {
            x: game.ship.x,
            y: game.ship.y,
          };
          game.obstacles = [];
          game.projectiles = [];
          updatePhase("dock");
          playFocusWhoosh(1.26);
        }
      }

      if (game.phase === "dock") {
        const progress = clamp(game.phaseElapsed / DOCK_DURATION, 0, 1);
        const stationEase = easeOutCubic(progress);
        const shipEase = easeInOutSine(clamp(progress / 0.82, 0, 1));

        game.station.x = GAME_WIDTH * 0.5 + Math.sin(progress * 5.4) * 3 * (1 - progress);
        game.station.y = lerp(-110, GAME_HEIGHT * 0.32, stationEase);
        game.station.size = lerp(58, 164, stationEase);
        game.station.glow = progress;
        game.station.bayGlow = clamp((progress - 0.38) / 0.62, 0, 1);

        game.ship.x = lerp(game.dockOrigin.x, game.station.x, shipEase);
        game.ship.y = lerp(game.dockOrigin.y, game.station.y - game.station.size * 0.09, shipEase);
        game.ship.tilt = lerp(game.ship.tilt, 0, 0.12);

        if (progress < 0.86) {
          spawnExhaust(game, 0.55);
        }

        if (progress > 0.72) {
          game.flash = Math.max(game.flash, (progress - 0.72) * 1.5);
        }

        if (progress >= 1) {
          game.phase = "card";
          game.phaseElapsed = 0;
          setStats(makeStats(game));
          updatePhase("card");
          playOpenBloom();
        }
      }

      if (game.phase === "card") {
        game.ship.tilt = lerp(game.ship.tilt, 0, 0.1);
        game.station.y = lerp(game.station.y, GAME_HEIGHT * 0.32, 0.06);
        game.station.size = lerp(game.station.size, 164, 0.06);
        game.station.glow = lerp(game.station.glow, 0.68, 0.06);
        game.station.bayGlow = lerp(game.station.bayGlow, 0.55, 0.06);
      }

      if (game.phase === "launch" || game.phase === "flight" || game.phase === "dock") {
        const nextHud = makeHudState(game);
        const nextHudKey = [
          nextHud.integrity,
          nextHud.dodges,
          nextHud.destroyed,
          nextHud.aliens,
          nextHud.timeLeft.toFixed(1),
          nextHud.progress.toFixed(3),
        ].join("|");
        if (nextHudKey !== hudKeyRef.current) {
          hudKeyRef.current = nextHudKey;
          setHud(nextHud);
        }
      }

      for (const particle of game.particles) {
        particle.life += dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= 0.985;
        particle.vy *= 0.986;
      }
      game.particles = game.particles.filter((particle) => particle.life < particle.ttl);

      context.save();
      const shakeX = (Math.random() - 0.5) * game.cameraShake * 12;
      const shakeY = (Math.random() - 0.5) * game.cameraShake * 12;
      context.translate(shakeX, shakeY);

      drawBackground(context, game, frameTime / 1000);

      if (game.phase === "dock") {
        drawDockingLane(context, game.station, clamp(game.station.glow, 0, 1));
        drawStationVisual(context, artRef.current, game.station);
      }

      for (const obstacle of game.obstacles) {
        context.save();
        if (obstacle.hitFlash > 0) {
          context.globalAlpha = 0.55 + obstacle.hitFlash * 0.45;
        }
        if (obstacle.kind === "alien") {
          drawAlienVisual(context, artRef.current, obstacle.x, obstacle.y, obstacle.radius, obstacle.spin, obstacle.hitFlash * 0.8);
        } else {
          drawPlanetVisual(context, artRef.current, obstacle.kind, obstacle.x, obstacle.y, obstacle.radius, obstacle.spin, obstacle.hitFlash * 0.8);
        }
        context.restore();
      }

      drawProjectiles(context, game.projectiles);
      drawParticles(context, game.particles);

      if (game.phase !== "card") {
        const dockProgress = game.phase === "dock" ? clamp(game.phaseElapsed / DOCK_DURATION, 0, 1) : 0;
        drawShipVisual(
          context,
          artRef.current,
          game.ship,
          game.phase === "boot" ? 0 : game.phase === "dock" ? 0.35 : 0.45 + clamp(game.flightElapsed / MISSION_DURATION, 0, 1) * 0.35,
          game.phase === "dock" ? lerp(1, 0.28, dockProgress) : 1,
        );
      }

      if (game.phase === "dock") {
        context.save();
        context.globalAlpha = clamp(game.flash, 0, 0.62);
        context.fillStyle = "#fff8ef";
        context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        context.restore();
      }

      if (game.phase === "card") {
        context.save();
        const pulse = 0.12 + Math.sin(game.cardPulse * 1.4) * 0.03;
        context.strokeStyle = `rgba(255,245,232,${0.18 + pulse})`;
        context.strokeRect(24, 24, GAME_WIDTH - 48, GAME_HEIGHT - 48);
        context.restore();
      }

      context.restore();

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [playFocusWhoosh, playOpenBloom, updatePhase]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className={`${styles.shell} ${pixelFont.className}`}>
      <div
        className={styles.topBar}
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 0px))" }}
      >
        <button
          type="button"
          onClick={() => {
            startAudio();
            router.push("/");
          }}
          onMouseEnter={playHoverChime}
          className={styles.topButton}
        >
          return to chloeverse
        </button>
        <button
          type="button"
          onClick={() => {
            startAudio();
            toggleMuted();
          }}
          onMouseEnter={playHoverChime}
          className={styles.topButton}
        >
          {muted ? "audio:off" : "audio:on"}
        </button>
      </div>

      <div className={styles.stageWrap}>
        <div className={styles.viewport}>
          <div className={styles.screen}>
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className={styles.canvas}
              aria-label="Playable contact page where you dodge or shoot planets and alien ships before docking with a station."
            />

            {phase === "boot" ? (
              <div className={styles.bootStatusOverlay}>
                <div className={styles.bootStatusTitle}>contact mission</div>
                <div className={styles.bootStatusPrompt}>press any key to start</div>
              </div>
            ) : null}

            {phase === "launch" || phase === "flight" || phase === "dock" ? (
              <div className={styles.hudOverlay}>
                <div className={styles.hudBlock}>
                  <div className={styles.hudLabel}>dock vector</div>
                  <div className={styles.hudValue}>hull {hud.integrity.toString().padStart(3, "0")}%</div>
                  <div className={styles.hudBar}>
                    <div
                      className={styles.hudBarFill}
                      style={{ width: `${Math.max(0, Math.min(100, hud.integrity))}%` }}
                    />
                  </div>
                  <div className={styles.hudMeta}>dodges {hud.dodges.toString().padStart(2, "0")}</div>
                  <div className={styles.hudMeta}>down {hud.destroyed.toString().padStart(2, "0")}</div>
                  {phase === "dock" ? (
                    <>
                      <div className={styles.hudLabelDock}>docking lock</div>
                      <div className={styles.hudMetaDock}>beacon hold</div>
                    </>
                  ) : null}
                </div>

                <div className={`${styles.hudBlock} ${styles.hudBlockRight}`}>
                  <div className={styles.hudValue}>t-dock {hud.timeLeft.toFixed(1)}s</div>
                  <div className={styles.hudBar}>
                    <div
                      className={`${styles.hudBarFill} ${styles.hudBarFillProgress}`}
                      style={{ width: `${Math.max(0, Math.min(100, hud.progress * 100))}%` }}
                    />
                  </div>
                  <div className={styles.hudMeta}>aliens {hud.aliens.toString().padStart(2, "0")}</div>
                </div>
              </div>
            ) : null}

            <div className={styles.bottomStrip}>
              {phase === "boot" ? (
                <div className={styles.bottomRow}>
                  <a
                    href={CONTACT_DETAILS.candy}
                    target="_blank"
                    rel="noreferrer"
                    onMouseEnter={playHoverChime}
                    className={styles.bottomUtilityLink}
                  >
                    return to candy castle
                  </a>
                </div>
              ) : phase === "launch" || phase === "flight" ? (
                <div className={styles.bottomRow}>
                  <div className={styles.bottomSpacer} />
                  <div className={styles.controlsCopy}>
                    <div>wasd / arrows move</div>
                    <div>space shoots</div>
                  </div>
                </div>
              ) : null}
            </div>

            {phase === "boot" ? (
              <div className={styles.bootOverlay}>
                <div className={styles.bootPanel}>
                  <h1 className={styles.bootTitle}>
                    <span>Shoot or dodge through planets and raiders.</span>
                    <span>Dock cleanly to unlock Chloe&apos;s contact card.</span>
                  </h1>
                  <p className={styles.bootBody}>WASD or arrow keys move. Space shoots.</p>
                  <div className={styles.bootActions}>
                    <button
                      type="button"
                      onClick={restartGame}
                      onMouseEnter={playHoverChime}
                      className={styles.bootButton}
                    >
                      begin mission
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {phase === "launch" ? (
              <div className={styles.launchOverlay}>
                <div className={styles.launchChip}>
                  weapons primed
                </div>
              </div>
            ) : null}

            <div className={styles.cardDock}>
              <div
                className={`${styles.cardPanel} ${phase === "card" ? styles.cardPanelVisible : styles.cardPanelHidden}`}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardIdentityRow}>
                    <div className={styles.cardIdentity}>
                      <h2 className={styles.cardTitle}>CHLOE KANG</h2>
                      <p className={styles.cardEmail}>{CONTACT_DETAILS.email}</p>
                    </div>

                    {stats ? (
                      <div className={styles.cardStats}>
                        <div className={styles.cardStatChip}>
                          <span>dodges</span>
                          <strong>{stats.dodges}</strong>
                        </div>
                        <div className={styles.cardStatChip}>
                          <span>targets down</span>
                          <strong>{stats.destroyed}</strong>
                        </div>
                        <div className={styles.cardStatChip}>
                          <span>ships cleared</span>
                          <strong>{stats.shipsDestroyed}</strong>
                        </div>
                        <div className={styles.cardStatChip}>
                          <span>hull left</span>
                          <strong>{stats.integrityLeft}%</strong>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.cardActionGrid}>
                    <a
                      href={`mailto:${CONTACT_DETAILS.email}`}
                      onMouseEnter={playHoverChime}
                      className={styles.cardPrimaryAction}
                    >
                      send signal
                    </a>
                    <button
                      type="button"
                      onClick={copyEmail}
                      onMouseEnter={playHoverChime}
                      className={styles.cardSecondaryAction}
                    >
                      {copyState === "copied" ? "address copied" : copyState === "failed" ? "copy failed" : "copy address"}
                    </button>
                  </div>

                  <div className={styles.cardLinkRow}>
                    {SOCIAL_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={playHoverChime}
                        className={styles.cardMiniLink}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>

                  <div className={styles.cardFooterRow}>
                    <button
                      type="button"
                      onClick={restartGame}
                      onMouseEnter={playHoverChime}
                      className={styles.cardFooterButton}
                    >
                      rerun mission
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
