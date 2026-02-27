#!/usr/bin/env node

const { execSync, spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = 4310;
const BASE_URL = `http://${HOST}:${PORT}`;
const NODE = process.execPath;
const NEXT_BIN = path.resolve("node_modules/next/dist/bin/next");

function fail(message) {
  throw new Error(message);
}

function expectContains(haystack, needle, context) {
  if (!haystack.includes(needle)) {
    fail(`Missing marker "${needle}" in ${context}.`);
  }
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`Server did not start in ${timeoutMs}ms.`);
}

function findHeadlessBrowser() {
  if (process.env.COLLABS_HEADLESS_BROWSER) {
    return process.env.COLLABS_HEADLESS_BROWSER;
  }

  const candidates = ["msedge", "chrome", "chromium", "chromium-browser"];
  for (const candidate of candidates) {
    try {
      const output = execSync(`where ${candidate}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const resolved = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
      if (resolved) return resolved;
    } catch (_) {
      // continue
    }
  }
  return null;
}

function dumpDom(browserPath, url) {
  const argSets = [
    ["--headless=new", "--disable-gpu", "--virtual-time-budget=12000", "--dump-dom", url],
    ["--headless", "--disable-gpu", "--virtual-time-budget=12000", "--dump-dom", url],
  ];

  for (const args of argSets) {
    const result = spawnSync(browserPath, args, {
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 12 * 1024 * 1024,
    });
    if (result.status === 0 && result.stdout) {
      return result.stdout;
    }
  }

  fail(`Could not dump DOM with browser "${browserPath}".`);
}

async function main() {
  const server = spawn(NODE, [NEXT_BIN, "dev", "-p", String(PORT), "-H", HOST], {
    stdio: "pipe",
  });

  let stdout = "";
  let stderr = "";
  server.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/collabs`, 90000);

    const collabsHtml = await fetch(`${BASE_URL}/collabs`).then((res) => res.text());
    expectContains(collabsHtml, 'data-collabs-page="landing"', "/collabs HTML");
    expectContains(collabsHtml, 'data-collabs-ui="landing"', "/collabs HTML");
    expectContains(collabsHtml, "data-collabs-cta", "/collabs HTML");

    const reelsHtml = await fetch(`${BASE_URL}/collabs/reels`).then((res) => res.text());
    expectContains(reelsHtml, 'data-collabs-page="reels"', "/collabs/reels HTML");
    expectContains(reelsHtml, 'data-collabs-ui="reels-gallery"', "/collabs/reels HTML");
    expectContains(reelsHtml, 'data-collabs-marker="reels-corridor"', "/collabs/reels HTML");

    const browser = findHeadlessBrowser();
    if (!browser) {
      fail("No supported headless browser found (set COLLABS_HEADLESS_BROWSER).");
    }

    const ctaDom = dumpDom(browser, `${BASE_URL}/collabs?__collabsSmoke=1&__action=cta`);
    expectContains(ctaDom, 'data-collabs-page="reels"', "CTA smoke DOM");
    expectContains(ctaDom, 'data-collabs-ui="reels-gallery"', "CTA smoke DOM");
    expectContains(ctaDom, 'data-collabs-shell-mounts="1"', "CTA smoke DOM");

    const modalDom = dumpDom(browser, `${BASE_URL}/collabs/reels?__collabsSmoke=1&__action=open-frame`);
    expectContains(modalDom, 'data-collabs-modal="open"', "frame click smoke DOM");
    expectContains(modalDom, 'role="dialog"', "frame click smoke DOM");
    expectContains(modalDom, "data-phone-shell", "frame click smoke DOM");

    process.stdout.write("Collabs smoke checks passed.\n");
  } finally {
    server.kill("SIGTERM");
    setTimeout(() => {
      if (!server.killed) server.kill("SIGKILL");
    }, 1500);

    if (server.exitCode !== null && server.exitCode !== 0) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
