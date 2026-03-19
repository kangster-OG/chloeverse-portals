import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const REELS = [
  { id: "DQukZZpjrpu", type: "p" },
  { id: "DUjezQzjpYx", type: "reel" },
  { id: "DTRjg4rkcIT", type: "p" },
  { id: "DT14hYEDq__", type: "p" },
  { id: "DPEZ7PfERdU", type: "p" },
];

function decodeEscapedUrl(value) {
  return value
    .replace(/\\\\u0026/g, "&")
    .replace(/\\u0026/g, "&")
    .replace(/\\\\\//g, "/")
    .replace(/\\\//g, "/");
}

function extractEscapedField(html, key) {
  const index = html.indexOf(key);
  if (index === -1) return null;
  const snippet = html.slice(index, index + 4000);
  const match = snippet.match(/:\\"([^"]+)\\"/);
  return match ? decodeEscapedUrl(match[1]) : null;
}

function extractMediaUrls(html) {
  return {
    videoUrl: extractEscapedField(html, "video_url"),
    imageUrl: extractEscapedField(html, "display_url") ?? extractEscapedField(html, "thumbnail_src") ?? "",
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return await response.text();
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: "https://www.instagram.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(destination, Buffer.from(arrayBuffer));
}

for (const reel of REELS) {
  const embedUrl = `https://www.instagram.com/${reel.type}/${reel.id}/embed/captioned/`;
  const html = await fetchText(embedUrl);
  const { videoUrl, imageUrl } = extractMediaUrls(html);

  if (!imageUrl) {
    throw new Error(`No image URL found for ${reel.id}`);
  }

  const targetDir = path.join(process.cwd(), "public", "collabs", "reels", reel.id);
  await mkdir(targetDir, { recursive: true });
  await downloadFile(imageUrl, path.join(targetDir, "cover.jpg"));

  if (videoUrl) {
    await downloadFile(videoUrl, path.join(targetDir, "video.mp4"));
  }

  console.log(`Fetched ${reel.id}`);
}
