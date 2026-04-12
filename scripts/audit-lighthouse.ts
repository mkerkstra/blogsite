/**
 * Post-build Lighthouse audit. Starts a local prod server, runs Lighthouse,
 * writes scores to src/features/colophon/data/lighthouse.json.
 *
 * Skips gracefully if Chrome isn't installed (e.g. Vercel build container).
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve("src/features/colophon/data/lighthouse.json");

async function getRandomPort(): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function main() {
  // Check for Chrome
  let chromePath: string;
  try {
    const chromeLauncher = await import("chrome-launcher");
    chromePath = chromeLauncher.getChromePath();
    console.log(`[audit] Chrome found at ${chromePath}`);
  } catch {
    console.log("[audit] Chrome not found. Skipping Lighthouse audit.");
    process.exit(0);
  }

  // Check that .next exists (need a built site)
  if (!existsSync(".next")) {
    console.log("[audit] No .next directory found. Run 'next build' first.");
    process.exit(0);
  }

  const port = await getRandomPort();
  const url = `http://localhost:${port}`;

  // Start next start
  console.log(`[audit] Starting production server on port ${port}...`);
  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(port)], {
    stdio: "pipe",
    detached: false,
  });

  try {
    await waitForServer(url);
    console.log("[audit] Server ready. Running Lighthouse...");

    const chromeLauncher = await import("chrome-launcher");
    const lighthouse = (await import("lighthouse")).default;

    const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });

    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });

    await chrome.kill();

    if (!result?.lhr?.categories) {
      throw new Error("Lighthouse returned no categories");
    }

    const scores = {
      performance: Math.round((result.lhr.categories["performance"]?.score ?? 0) * 100),
      accessibility: Math.round((result.lhr.categories["accessibility"]?.score ?? 0) * 100),
      bestPractices: Math.round((result.lhr.categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((result.lhr.categories["seo"]?.score ?? 0) * 100),
    };

    const output = {
      scores,
      auditedAt: new Date().toISOString(),
      url,
    };

    // Ensure directory exists
    const dir = resolve("src/features/colophon/data");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log("[audit] Scores written to", OUTPUT_PATH);
    console.log("[audit]", JSON.stringify(scores));
  } finally {
    // Kill the server
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("[audit] Error:", err);
  // Non-fatal — don't break the build
  process.exit(0);
});
