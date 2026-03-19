import type { ReelItem } from "@/components/collabs/reelsData";

export const HOME_PORTALS = [
  {
    href: "/projects",
    label: "PROJECTS",
    displayTitle: "things i've made",
    subtitle: "films, edits, experiments",
    sigil: "I",
    accent: "#ff8d5c",
    mobileEnabled: true,
  },
  {
    href: "/collabs",
    label: "COLLABS",
    displayTitle: "things we've made",
    subtitle: "brand work, invited rooms",
    sigil: "II",
    accent: "#80a9ff",
    mobileEnabled: true,
  },
  {
    href: "/work",
    label: "WORK",
    displayTitle: "where i've been",
    subtitle: "roles, timeline, wins",
    sigil: "III",
    accent: "#8de7ad",
    mobileEnabled: true,
  },
  {
    href: "/contact",
    label: "CONTACT",
    displayTitle: "where to find me",
    subtitle: "notes, inquiries, hello",
    sigil: "IV",
    accent: "#ffbf72",
    mobileEnabled: true,
  },
  {
    href: "/mediacard",
    label: "MEDIACARD",
    displayTitle: "what the numbers say",
    subtitle: "audience, rates, partners",
    sigil: "V",
    accent: "#ead2a7",
    mobileEnabled: true,
  },
] as const;

export type MobileProjectReel = {
  id: string;
  instagramUrl: string;
  username: string;
  caption: string;
  audioLabel: string;
  coverImage: string;
  videoSrc: string;
  posterAlt: string;
  durationLabel: string;
  metrics?: {
    likes?: string;
    comments?: string;
    shares?: string;
  };
};

export const PROJECT_REELS: MobileProjectReel[] = [
  {
    id: "r3",
    instagramUrl: "https://www.instagram.com/reel/DTZ2XtNkeNC/",
    username: "imchloekang",
    caption: "Original reel, now watchable directly inside Chloeverse.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r3/cover.jpg",
    videoSrc: "/projects/reels/r3/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DTZ2XtNkeNC.",
    durationLabel: "1:03",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r4",
    instagramUrl: "https://www.instagram.com/reel/DR_GW1BkQci/",
    username: "imchloekang",
    caption: "A vertical cut presented in a full-screen reel viewer instead of a generic route list.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r4/cover.jpg",
    videoSrc: "/projects/reels/r4/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DR_GW1BkQci.",
    durationLabel: "0:19",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r5",
    instagramUrl: "https://www.instagram.com/reel/DSitVRLkjEf/",
    username: "imchloekang",
    caption: "A published reel, kept native to the mobile projects experience.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r5/cover.jpg",
    videoSrc: "/projects/reels/r5/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DSitVRLkjEf.",
    durationLabel: "0:16",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r6",
    instagramUrl: "https://www.instagram.com/reel/DOH8x_gk2Ew/",
    username: "imchloekang",
    caption: "Another creator reel surfaced as part of a swipeable in-site feed.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r6/cover.jpg",
    videoSrc: "/projects/reels/r6/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DOH8x_gk2Ew.",
    durationLabel: "0:07",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r7",
    instagramUrl: "https://www.instagram.com/reel/DOQ-ZxuEzan/",
    username: "imchloekang",
    caption: "A reel-first project presentation with local playback and original source preserved.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r7/cover.jpg",
    videoSrc: "/projects/reels/r7/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DOQ-ZxuEzan.",
    durationLabel: "0:14",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r8",
    instagramUrl: "https://www.instagram.com/reel/DObX6ceE-di/",
    username: "imchloekang",
    caption: "The projects route now behaves like a real viewer instead of a card stack.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r8/cover.jpg",
    videoSrc: "/projects/reels/r8/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DObX6ceE-di.",
    durationLabel: "0:21",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r9",
    instagramUrl: "https://www.instagram.com/reel/DOsvvxCkUxJ/",
    username: "imchloekang",
    caption: "Published reel playback with a local poster, local video, and a direct source link.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r9/cover.jpg",
    videoSrc: "/projects/reels/r9/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DOsvvxCkUxJ.",
    durationLabel: "0:18",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r10",
    instagramUrl: "https://www.instagram.com/reel/DMLYWLOhTfg/",
    username: "imchloekang",
    caption: "A local reel slide with the same poster frame and in-site playback flow.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r10/cover.jpg",
    videoSrc: "/projects/reels/r10/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DMLYWLOhTfg.",
    durationLabel: "0:14",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
  {
    id: "r11",
    instagramUrl: "https://www.instagram.com/reel/DMxxlTEp98D/",
    username: "imchloekang",
    caption: "A reel viewer entry that keeps the mobile projects page focused and full-screen.",
    audioLabel: "Original audio",
    coverImage: "/projects/reels/r11/cover.jpg",
    videoSrc: "/projects/reels/r11/video.mp4",
    posterAlt: "Instagram reel cover for Chloe Kang reel DMxxlTEp98D.",
    durationLabel: "0:10",
    metrics: {
      likes: "watch",
      comments: "swipe",
      shares: "source",
    },
  },
];

export const WORK_ROLE_STACK = [
  "Creator",
  "Founder",
  "Creative strategist",
  "Growth Marketer",
] as const;

export const WORK_INTRO_COPY = "Here's what I've been up to the past few years!";

export type WorkEntry = {
  title: string;
  date: string;
  location: string;
  type?: string;
  bullets: string[];
};

export const WORK_ENTRIES: WorkEntry[] = [
  {
    title: "Stealth Startup - Founder",
    date: "Feb 2026 - Present",
    location: "Remote",
    bullets: ["More news soon."],
  },
  {
    title: "Adobe - AI Search",
    date: "Jan 2026 - Present",
    location: "Los Angeles Metropolitan Area  Remote",
    type: "Contract",
    bullets: ["Search optimization for LLM training & retrieval. Not via an organization on campus."],
  },
  {
    title: "Instagram - Creator",
    date: "Jul 2025 - Present",
    location: "Los Angeles, California, United States  Hybrid",
    type: "Self-employed",
    bullets: [
      "300K+ followers",
      "250M views",
      "Grew IG from 0 to 140k+ in 3 months",
      "Viral series accumulated 200M views & attention from major news outlets",
      "Worked with Adidas, Adobe, Estee Lauder, OpenAI, Hera, etc.",
    ],
  },
  {
    title: "Single Origin Studios - CEO",
    date: "Jun 2023 - Jan 2026",
    location: "Los Angeles, California, United States  Remote",
    type: "Self-employed",
    bullets: [
      "Marketing consulting",
      "Previous experience with YC backed startups",
      "Full in house marketing with UGC team management",
      "Scaled brands from 0 to 50k+ users in 2 months",
      "Generated 6 figures of revenue",
      "Worked with pre-seed and early stage",
    ],
  },
  {
    title: "Outsmart - Product Marketing",
    date: "Sep 2025 - Dec 2025",
    location: "Los Angeles, California, United States  Hybrid",
    type: "Contract",
    bullets: [
      "Product and growth directly under ex-CMO @ Duolingo, $38M raised, backed by DST Global, Lightspeed, Khosla Ventures, execs from OpenAI & Quora.",
    ],
  },
  {
    title: "Stealth AI Startup - Head of Growth",
    date: "Jun 2025 - Sep 2025",
    location: "San Francisco, California, United States  On-site",
    type: "Full-time",
    bullets: ["Product and growth for B2C fashion tech, backed by execs from Shopify and Pinterest."],
  },
  {
    title: "Soluna - Product Marketing Intern",
    date: "Oct 2024 - Jun 2025",
    location: "Los Angeles, California, United States  Remote",
    type: "Internship",
    bullets: ["Streamlined Solunas GTM, drove 179% increase in revenue in US market."],
  },
  {
    title: "Headspace - Digital Marketing Intern",
    date: "May 2022 - Sep 2023",
    location: "Los Angeles, California, United States  Remote",
    type: "Internship",
    bullets: ["Tripled Headspaces social media presence in one year, youngest employee to earn an extended contract."],
  },
];

export const WORK_HIGHLIGHTS = [
  "300K+ followers",
  "250M views",
  "200M views from viral series",
  "6 figures of revenue generated",
  "179% increase in revenue in the US market",
  "Tripled Headspaces social presence in one year",
] as const;

export const CONTACT_DETAILS = {
  name: "Chloe Kang",
  email: "ugcbychloekang@gmail.com",
  instagram: "https://instagram.com/imchloekang",
  tiktok: "https://www.tiktok.com/@imchloekang",
  linkedin: "https://www.linkedin.com/in/chloe-kang-234292250/",
  x: "https://x.com/imchloekang",
  candy: "https://imchloekang.com",
} as const;

export type ContactJourneyStop = {
  id: "instagram" | "tiktok" | "linkedin" | "x";
  label: string;
  href: string;
  accent: string;
  planetColor: string;
  glowColor: string;
  xPercent: number;
  yVh: number;
  hitProgress: number;
  rocketXvw: number;
  rocketYvh: number;
};

export const CONTACT_JOURNEY_STOPS: ContactJourneyStop[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: CONTACT_DETAILS.instagram,
    accent: "#f6a9ff",
    planetColor: "#6d3f9d",
    glowColor: "rgba(246,169,255,0.46)",
    xPercent: 72,
    yVh: 76,
    hitProgress: 0.24,
    rocketXvw: 68,
    rocketYvh: 22,
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: CONTACT_DETAILS.tiktok,
    accent: "#86ffe5",
    planetColor: "#174f5f",
    glowColor: "rgba(134,255,229,0.42)",
    xPercent: 28,
    yVh: 71,
    hitProgress: 0.42,
    rocketXvw: 30,
    rocketYvh: 18,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: CONTACT_DETAILS.linkedin,
    accent: "#8cc8ff",
    planetColor: "#214a8d",
    glowColor: "rgba(140,200,255,0.4)",
    xPercent: 70,
    yVh: 59,
    hitProgress: 0.6,
    rocketXvw: 70,
    rocketYvh: 14,
  },
  {
    id: "x",
    label: "X",
    href: CONTACT_DETAILS.x,
    accent: "#ffd1a8",
    planetColor: "#57433a",
    glowColor: "rgba(255,209,168,0.42)",
    xPercent: 34,
    yVh: 46,
    hitProgress: 0.78,
    rocketXvw: 36,
    rocketYvh: 11,
  },
] as const;

export const MEDIACARD_AUDIENCE = ["United States", "Canada", "Australia", "South Korea"] as const;

export const MEDIACARD_METRICS = [
  { label: "Instagram", value: "150K" },
  { label: "TikTok", value: "160K" },
  { label: "Views", value: "12M monthly" },
  { label: "Engagement", value: "12%" },
] as const;

export const MEDIACARD_SERVICES = {
  brandPartnerships: [
    "Per Video (Posted on one platform): $1,200",
    "Cross posted across platforms: $2,000",
    "Link in bio per every 7 days: Additional $100",
    "Whitelisting (per 15 days): Additional $100",
    "Usage rights (per 30 days): Additional $200",
  ],
  diningPartnerships: [
    "Cross Posted across platforms with Instagram story coverage included",
    "Per Cross Posted Video: Hosted dining experience for desired party size",
  ],
} as const;

export const MEDIACARD_COLLABS = ["Adobe", "Adidas", "Estee Lauder", "OpenAI"] as const;

export function getCollabBrandLabel(item: ReelItem): string {
  return item.title;
}

export function getCollabMediumLabel(url: string): "Instagram Reel" | "Instagram Post" {
  return url.includes("/reel/") ? "Instagram Reel" : "Instagram Post";
}
