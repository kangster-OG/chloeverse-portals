/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = process.cwd();

function writeFile(absPath, content) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, "utf8");
  console.log("Wrote:", path.relative(root, absPath));
}

const pagePath = path.join(root, "src", "app", "collabs", "page.tsx");
const campaignsPath = path.join(root, "src", "lib", "collabsCampaigns.ts");

const pageContent = `import { CollabsDashboardGlass } from "@/components/collabs/CollabsDashboardGlass";
import { collabsCampaigns } from "@/lib/collabsCampaigns";

type SearchParams = Record<string, string | string[] | undefined>;

function getReturnUrl(searchParams?: SearchParams) {
  const raw = searchParams?.return;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return "https://imchloekang.com";
  const trimmed = value.trim();
  // Simple safety: only allow https URLs.
  if (!trimmed.startsWith("https://")) return "https://imchloekang.com";
  return trimmed;
}

export default function CollabsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const returnUrl = getReturnUrl(searchParams);
  return (
    <CollabsDashboardGlass campaigns={collabsCampaigns} returnUrl={returnUrl} />
  );
}
`;

const campaignsStub = `export type Platform = "IG Reels" | "TikTok" | "YouTube Shorts";

export type CampaignStatus =
  | "Draft"
  | "In Review"
  | "Approved"
  | "Delivered"
  | "Live"
  | "Renewed";

export type CampaignDeliverable = {
  id: string;
  title: string;
  mp4Url: string; // "/collabs/mp4/filename.mp4"
  caption?: string;
  tags?: string[];
  posterUrl?: string; // optional: "/collabs/posters/x.jpg"
};

export type CollabsCampaign = {
  id: string;
  brand: { name: string; logoUrl?: string };
  title: string;
  status: CampaignStatus;
  platforms: Platform[];
  deliveredOn?: string; // "YYYY-MM-DD"
  summary?: string;
  notes?: string[];
  deliverables: CampaignDeliverable[];
};

// AUTO-GENERATED (or hand-edited) DATA.
// Run to regenerate from MP4 filenames:
//   node tools/collabs/generateCampaignsFromMp4.cjs
export const collabsCampaigns: CollabsCampaign[] = [];
`;

writeFile(pagePath, pageContent);

// Only create stub if it doesn't exist yet. The generator overwrites it later.
if (!fs.existsSync(campaignsPath)) {
  writeFile(campaignsPath, campaignsStub);
} else {
  console.log("Exists:", path.relative(root, campaignsPath));
}

console.log("Done. Next:");
console.log("  1) Put MP4s in public/collabs/mp4/");
console.log("  2) node tools/collabs/generateCampaignsFromMp4.cjs");
