#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const mp4Dir = path.join(projectRoot, "public", "collabs", "mp4");
const outputDataPath = path.join(projectRoot, "src", "lib", "collabsFilmData.ts");
const outputNotesPath = path.join(projectRoot, "COLLABS_FILM_NOTES.md");

function toTitleCase(input) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueId(baseId, usedIds) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  const nextId = `${baseId}-${suffix}`;
  usedIds.add(nextId);
  return nextId;
}

function readMp4Files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp4"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function buildItems(filenames) {
  const usedIds = new Set();
  return filenames.map((filename) => {
    const base = filename.replace(/\.mp4$/i, "");
    const title = toTitleCase(base);
    const rawId = slugify(base) || "reel";
    const id = uniqueId(rawId, usedIds);
    return {
      id,
      title,
      mp4Url: `/collabs/mp4/${filename}`,
    };
  });
}

function renderDataFile(items) {
  const header = [
    "export type CollabsFilmItem = {",
    "  id: string;",
    "  title: string;",
    "  mp4Url: string;",
    "  posterUrl?: string;",
    "};",
    "",
    "export const collabsFilmItems: CollabsFilmItem[] = [",
  ];

  const body = items.map(
    (item) =>
      [
        "  {",
        `    id: "${item.id}",`,
        `    title: "${item.title.replace(/"/g, '\\"')}",`,
        `    mp4Url: "${item.mp4Url}",`,
        "  },",
      ].join("\n"),
  );

  const footer = ["];", ""];
  return [...header, ...body, ...footer].join("\n");
}

function renderNotes(filenames) {
  const lines = [
    "# Collabs Film Notes",
    "",
    "Generated from `public/collabs/mp4`.",
    "",
    "## Mapped Files",
  ];

  if (filenames.length === 0) {
    lines.push("- _No MP4 files found._");
  } else {
    filenames.forEach((filename, index) => {
      lines.push(`${index + 1}. \`${filename}\``);
    });
  }

  lines.push(
    "",
    "## Naming Tip",
    "Use hyphenated lowercase names like `brand-campaign-cut-01.mp4` for clean IDs and readable titles.",
    "",
  );

  return lines.join("\n");
}

function main() {
  const filenames = readMp4Files(mp4Dir);
  const items = buildItems(filenames);
  const dataFileContent = renderDataFile(items);
  const notesContent = renderNotes(filenames);

  fs.mkdirSync(path.dirname(outputDataPath), { recursive: true });
  fs.writeFileSync(outputDataPath, dataFileContent, "utf8");
  fs.writeFileSync(outputNotesPath, notesContent, "utf8");

  console.log(
    `[collabs-film] Found ${filenames.length} MP4 file(s) in ${path.relative(
      projectRoot,
      mp4Dir,
    )}`,
  );
  console.log(
    `[collabs-film] Wrote ${path.relative(projectRoot, outputDataPath)} and ${path.relative(projectRoot, outputNotesPath)}`,
  );
}

main();
