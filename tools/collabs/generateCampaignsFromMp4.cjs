/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const mp4Dir = path.join(root, "public", "collabs", "mp4");
const outTs = path.join(root, "src", "lib", "collabsCampaigns.ts");
const notesMd = path.join(root, "COLLABS_MP4_NOTES.md");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "x"
  );
}

function titleizeFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function inferBrand(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const first = base.split(/[_-]/)[0] || "Brand";
  return first
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildCampaigns(files) {
  const groups = new Map();
  for (const f of files) {
    const brand = inferBrand(f);
    if (!groups.has(brand)) groups.set(brand, []);
    groups.get(brand).push(f);
  }

  const campaigns = [];
  for (const [brand, brandFiles] of groups.entries()) {
    const campId = `camp-${slugify(brand)}`;
    const deliverables = brandFiles.map((f, i) => {
      const id = `${slugify(brand)}-${String(i + 1).padStart(2, "0")}`;
      return {
        id,
        title: titleizeFilename(f),
        mp4Url: `/collabs/mp4/${f}`,
        tags: ["sponsored", "deliverable"],
      };
    });

    campaigns.push({
      id: campId,
      brand: { name: brand },
      title: "Sponsored Deliverables",
      status: "Live",
      platforms: ["IG Reels"],
      deliveredOn: "2026-02-21",
      summary:
        "Auto-generated from MP4 filenames. Edit campaigns to add real titles, status, platforms, and notes.",
      notes: [
        "Tip: rename MP4s like brand_campaign_01.mp4 for better grouping + titles.",
        "You can add posters later at /public/collabs/posters/ and set posterUrl.",
      ],
      deliverables,
    });
  }

  campaigns.sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  return campaigns;
}

function renderNotes(files, campaigns) {
  const now = new Date().toISOString();
  let md = `# Collabs MP4 Notes\n\nGenerated: ${now}\n\n`;
  md += `MP4 directory: \`public/collabs/mp4/\`\n\n`;
  md += `Found **${files.length}** MP4 file(s).\n\n`;
  md += `## Grouping (inferred by filename prefix)\n\n`;
  for (const c of campaigns) {
    md += `### ${c.brand.name}\n\n`;
    for (const d of c.deliverables) md += `- ${d.mp4Url}\n`;
    md += `\n`;
  }
  md += `## Tips\n\n`;
  md += `- Best naming format: \`brand_campaign_01.mp4\` (groups cleanly)\n`;
  md += `- Re-run generator anytime after adding/removing MP4s:\n\n`;
  md += "```bat\nnode tools\\collabs\\generateCampaignsFromMp4.cjs\n```\n";
  return md;
}

function renderTs(campaigns) {
  return `export type Platform = "IG Reels" | "TikTok" | "YouTube Shorts";

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
  mp4Url: string;
  caption?: string;
  tags?: string[];
  posterUrl?: string;
};

export type CollabsCampaign = {
  id: string;
  brand: { name: string; logoUrl?: string };
  title: string;
  status: CampaignStatus;
  platforms: Platform[];
  deliveredOn?: string;
  summary?: string;
  notes?: string[];
  deliverables: CampaignDeliverable[];
};

// AUTO-GENERATED FILE.
// Run: node tools/collabs/generateCampaignsFromMp4.cjs
export const collabsCampaigns: CollabsCampaign[] = ${JSON.stringify(campaigns, null, 2)};
`;
}

function main() {
  if (!fs.existsSync(mp4Dir)) {
    die(`Missing folder: ${mp4Dir}\nCreate it and add MP4s first.`);
  }

  const files = fs
    .readdirSync(mp4Dir)
    .filter((f) => f.toLowerCase().endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) die(`No .mp4 files found in: ${mp4Dir}`);

  const campaigns = buildCampaigns(files);

  if (fs.existsSync(outTs)) {
    const bak = outTs + ".bak";
    try {
      fs.copyFileSync(outTs, bak);
    } catch {}
  }

  fs.mkdirSync(path.dirname(outTs), { recursive: true });
  fs.writeFileSync(outTs, renderTs(campaigns), "utf8");
  fs.writeFileSync(notesMd, renderNotes(files, campaigns), "utf8");

  console.log(`Wrote: ${outTs}`);
  console.log(`Wrote: ${notesMd}`);
  console.log(`Campaigns: ${campaigns.length} | Deliverables: ${files.length}`);
}

main();
