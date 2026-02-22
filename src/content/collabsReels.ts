export type CollabsReel = {
  id: string;
  title: string;
  subtitle: string;
  posterSrc: string;
  videoSrc: string;
  year?: number;
  durationSec?: number;
  tags?: string[];
};

export const collabsReels: CollabsReel[] = [
  {
    id: "reel-1",
    title: "Solar Static",
    subtitle: "Neon Editorial Capsule",
    posterSrc: "/collabs/posters/reel-1.svg",
    videoSrc: "/work-retro/assets/Glowbal-D_GSRTBE.mp4",
    year: 2025,
    durationSec: 58,
    tags: ["fashion", "campaign", "music"],
  },
  {
    id: "reel-2",
    title: "Glass Echo",
    subtitle: "Studio Lighting Study",
    posterSrc: "/collabs/posters/reel-2.svg",
    videoSrc: "",
    year: 2025,
    durationSec: 73,
    tags: ["beauty", "studio", "portrait"],
  },
  {
    id: "reel-3",
    title: "Chrome Bloom",
    subtitle: "Runway Micro Narrative",
    posterSrc: "/collabs/posters/reel-3.svg",
    videoSrc: "",
    year: 2024,
    durationSec: 66,
    tags: ["runway", "film", "brand"],
  },
  {
    id: "reel-4",
    title: "Nocturne Field",
    subtitle: "Night Exterior Mood",
    posterSrc: "/collabs/posters/reel-4.svg",
    videoSrc: "",
    year: 2024,
    durationSec: 42,
    tags: ["outdoor", "cinematic", "editorial"],
  },
  {
    id: "reel-5",
    title: "Velvet Transit",
    subtitle: "After Hours Teaser",
    posterSrc: "/collabs/posters/reel-5.svg",
    videoSrc: "",
    year: 2023,
    durationSec: 49,
    tags: ["teaser", "story", "motion"],
  },
];
