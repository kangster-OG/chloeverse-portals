#!/usr/bin/env node

const BASE_URL = process.env.COLLABS_QA_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Missing "playwright" dependency (${detail}). Install it with: npm i -D playwright`,
    );
  }

  const health = await fetch(`${BASE_URL}/collabs`).catch(() => null);
  if (!health || health.status !== 200) {
    throw new Error(
      `Dev server is not reachable at ${BASE_URL}. Start it first with: npm run dev -- --port 3000`,
    );
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  const results = [];

  try {
    await page.goto(`${BASE_URL}/collabs`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-collabs-ui="landing"]', { timeout: 15000 });
    results.push("PASS /collabs landing");

    await page.click("[data-collabs-cta]");
    await page.waitForSelector('[data-collabs-ui="reels-gallery"]', { timeout: 15000 });
    if (!page.url().includes("/collabs/reels")) {
      throw new Error(`Expected route /collabs/reels after CTA, got ${page.url()}`);
    }
    results.push("PASS CTA to /collabs/reels");

    const frames = page.locator("button[data-collabs-anchor]");
    const frameCount = await frames.count();
    if (frameCount < 5) {
      throw new Error(`Expected 5 frames, found ${frameCount}`);
    }

    for (let i = 0; i < 5; i += 1) {
      await frames.nth(i).click();
      await page.waitForSelector('[data-collabs-modal="open"]', { timeout: 15000 });
      results.push(`PASS frame ${i + 1} opens modal`);

      await page.click('[data-collabs-modal="open"] button:has-text("Close")');
      await page.waitForSelector('[data-collabs-modal="open"]', {
        state: "detached",
        timeout: 15000,
      });
      results.push(`PASS frame ${i + 1} close button`);

      await frames.nth(i).click();
      await page.waitForSelector('[data-collabs-modal="open"]', { timeout: 15000 });
      await page.keyboard.press("Escape");
      await page.waitForSelector('[data-collabs-modal="open"]', {
        state: "detached",
        timeout: 15000,
      });
      results.push(`PASS frame ${i + 1} ESC close`);
    }
  } finally {
    await browser.close();
  }

  console.log("COLLABS_CLICK_REGRESSION_PASS");
  for (const line of results) {
    console.log(line);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("COLLABS_CLICK_REGRESSION_FAIL");
  console.error(message);
  process.exit(1);
});
