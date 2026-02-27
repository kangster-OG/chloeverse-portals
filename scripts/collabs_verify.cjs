#!/usr/bin/env node

const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const NODE = process.execPath;
const ESLINT_BIN = path.resolve("node_modules/eslint/bin/eslint.js");
const TSC_BIN = path.resolve("node_modules/typescript/bin/tsc");
const NEXT_BIN = path.resolve("node_modules/next/dist/bin/next");
const COLLABS_SMOKE = path.resolve("scripts/collabs_smoke.cjs");

function run(binPath, args) {
  const result = spawnSync(NODE, [binPath, ...args], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runCapture(binPath, args) {
  return spawnSync(NODE, [binPath, ...args], { stdio: "pipe", encoding: "utf8" });
}

function main() {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const scripts = pkg.scripts || {};

  if (scripts.lint) {
    run(ESLINT_BIN, [
      "src/app/collabs",
      "src/components/collabs",
    ]);
  }
  if (scripts.typecheck) {
    run(TSC_BIN, ["--noEmit"]);
  } else {
    run(TSC_BIN, ["-p", "tsconfig.collabs.json", "--noEmit"]);
  }

  if (scripts.build) {
    const build = runCapture(NEXT_BIN, ["build"]);
    if (build.status !== 0) {
      const combined = `${build.stdout || ""}\n${build.stderr || ""}`;
      if (combined.includes("Failed to fetch") && combined.includes("Google Fonts")) {
        process.stdout.write("Build skipped due to offline Google Fonts fetch in this environment.\n");
      } else {
        process.stdout.write(build.stdout || "");
        process.stderr.write(build.stderr || "");
        process.exit(build.status ?? 1);
      }
    } else {
      process.stdout.write(build.stdout || "");
      process.stderr.write(build.stderr || "");
    }
  }

  run(COLLABS_SMOKE, []);
}

main();
