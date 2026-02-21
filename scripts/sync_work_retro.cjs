const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

function exists(p) {
  return fs.existsSync(p);
}

function run(cwd, cmd, args) {
  const executable = process.platform === "win32" && cmd === "npm" ? "npm.cmd" : cmd;
  const isWindowsCmdFile = process.platform === "win32" && executable.toLowerCase().endsWith(".cmd");
  const result = isWindowsCmdFile
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", executable, ...args], {
        cwd,
        stdio: "inherit",
        shell: false,
      })
    : spawnSync(executable, args, {
        cwd,
        stdio: "inherit",
        shell: false,
      });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${executable} ${args.join(" ")}`);
  }
}

function isRetroRepoDir(dir) {
  return exists(path.join(dir, "package.json")) && exists(path.join(dir, "vite.config.ts"));
}

function failWithLocateError(candidates) {
  console.error("[work:retro:sync] ERROR: Could not locate retro-computer-website.");
  console.error("[work:retro:sync] Checked these locations:");
  for (const candidate of candidates) {
    console.error(`  - ${candidate}`);
  }
  console.error(
    "[work:retro:sync] Set RETRO_WORK_SRC to the retro-computer-website folder path and try again."
  );
  process.exit(1);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const home = os.homedir();
  const envCandidate = process.env.RETRO_WORK_SRC ? path.resolve(process.env.RETRO_WORK_SRC) : null;

  const candidates = [
    envCandidate,
    path.resolve(repoRoot, "..", "retro-computer-website"),
    path.join(home, "Downloads", "retro-computer-website"),
    path.join(home, "Documents", "retro-computer-website"),
  ].filter(Boolean);

  const retroDir = candidates.find(isRetroRepoDir);
  if (!retroDir) {
    failWithLocateError(candidates);
  }

  console.log(`[work:retro:sync] Using retro repo: ${retroDir}`);
  console.log("[work:retro:sync] Installing dependencies...");
  run(retroDir, "npm", ["install"]);

  console.log("[work:retro:sync] Building retro site with base /work-retro/ ...");
  run(retroDir, "npm", ["run", "build", "--", "--base=/work-retro/"]);

  const distDir = path.join(retroDir, "dist");
  const distIndex = path.join(distDir, "index.html");
  if (!exists(distIndex)) {
    throw new Error(`Build output not found: ${distIndex}`);
  }

  const targetDir = path.join(repoRoot, "public", "work-retro");
  if (exists(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(distDir, targetDir, { recursive: true });

  console.log("[work:retro:sync] Success.");
  console.log(`[work:retro:sync] Copied: ${distDir}`);
  console.log(`[work:retro:sync] To:     ${targetDir}`);
}

try {
  main();
} catch (error) {
  console.error("[work:retro:sync] ERROR:", error instanceof Error ? error.message : error);
  process.exit(1);
}
