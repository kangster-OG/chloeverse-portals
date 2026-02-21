export type Platform = "IG Reels" | "TikTok" | "YouTube Shorts";

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
