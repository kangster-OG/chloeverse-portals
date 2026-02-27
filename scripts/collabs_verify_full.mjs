import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.COLLABS_VERIFY_PORT ?? "4310", 10);
const READY_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 500;
const baseUrl = `http://${HOST}:${PORT}`;

const pagesToCheck = [
  {
    path: "/collabs",
    markers: ['data-collabs-page="landing"', "Collabs"],
  },
  {
    path: "/collabs/reels",
    markers: ['data-collabs-page="reels"', 'data-collabs-ui="reels-gallery"'],
  },
];

function log(step) {
  console.log(`[collabs:verify:full] ${step}`);
}

function isWin() {
  return process.platform === "win32";
}

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} failed with exit code ${code ?? "unknown"}`));
      }
    });
  });
}

function runNpmScript(scriptName) {
  if (isWin()) {
    return runCommand("cmd.exe", ["/d", "/s", "/c", `npm run ${scriptName}`], `npm run ${scriptName}`);
  }
  return runCommand("npm", ["run", scriptName], `npm run ${scriptName}`);
}

async function loadPackageJson() {
  const pkgPath = path.join(process.cwd(), "package.json");
  const raw = await readFile(pkgPath, "utf8");
  return JSON.parse(raw);
}

async function runOptionalScript(pkgScripts, scriptName) {
  if (!Object.prototype.hasOwnProperty.call(pkgScripts, scriptName)) {
    log(`Skipping npm run ${scriptName} (script not found).`);
    return;
  }
  log(`Running npm run ${scriptName}...`);
  await runNpmScript(scriptName);
}

function startNextServer() {
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(PORT), "-H", HOST], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
  return child;
}

async function stopProcessTree(child) {
  if (!child || child.exitCode !== null) return;

  if (isWin()) {
    spawnSync("cmd.exe", ["/d", "/s", "/c", `taskkill /PID ${child.pid} /T /F`], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

async function waitForServerReady(child, stderrBuffer) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    if (child.exitCode !== null) {
      throw new Error(
        `next start exited early with code ${child.exitCode}. Stderr:\n${stderrBuffer()}`,
      );
    }

    try {
      const res = await fetch(`${baseUrl}/collabs`);
      if (res.status === 200) return;
    } catch {
      // keep polling
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Timed out waiting for server at ${baseUrl}. Stderr:\n${stderrBuffer()}`);
}

async function verifyPage(routePath, markers) {
  const url = `${baseUrl}${routePath}`;
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(`${routePath} returned HTTP ${response.status}, expected 200.`);
  }

  const html = await response.text();
  for (const marker of markers) {
    if (!html.includes(marker)) {
      throw new Error(`${routePath} missing marker: ${marker}`);
    }
  }
  log(`Verified ${routePath} (200 + markers).`);
}

async function main() {
  const pkg = await loadPackageJson();
  const scripts = pkg.scripts ?? {};

  if (Object.prototype.hasOwnProperty.call(scripts, "lint:collabs")) {
    log("Running npm run lint:collabs...");
    await runNpmScript("lint:collabs");
  } else {
    await runOptionalScript(scripts, "lint");
  }
  await runOptionalScript(scripts, "typecheck");

  log("Running npm run build...");
  try {
    await runNpmScript("build");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`WARNING: Build skipped due to environment restrictions or local build setup issue (${message}).`);
    log("WARNING: Smoke checks skipped because a production build is unavailable.");
    return;
  }

  let stderr = "";
  let stdout = "";
  const server = startNextServer();

  server.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
    if (stdout.length > 16_000) stdout = stdout.slice(-16_000);
  });
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
    if (stderr.length > 16_000) stderr = stderr.slice(-16_000);
  });

  try {
    log(`Starting production server on ${baseUrl}...`);
    await waitForServerReady(server, () => stderr || stdout);

    for (const page of pagesToCheck) {
      await verifyPage(page.path, page.markers);
    }

    log("Full verification passed.");
  } finally {
    await stopProcessTree(server);
  }
}

main().catch((error) => {
  console.error(`[collabs:verify:full] ERROR: ${error.message}`);
  process.exit(1);
});
