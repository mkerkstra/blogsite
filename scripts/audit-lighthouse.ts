/**
 * Lighthouse audit against the live site. Runs headless Chrome locally,
 * writes scores to src/features/colophon/data/lighthouse.json.
 *
 * Override the target URL with LIGHTHOUSE_URL env var.
 * Skips gracefully if Chrome isn't installed (e.g. Vercel build container).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve("src/features/colophon/data/lighthouse.json");

async function main() {
  // Check for Chrome
  try {
    const chromeLauncher = await import("chrome-launcher");
    chromeLauncher.getChromePath();
  } catch {
    console.log("[audit] Chrome not found. Skipping Lighthouse audit.");
    process.exit(0);
  }

  const url = process.env.LIGHTHOUSE_URL || "https://www.kerkstra.dev";
  console.log(`[audit] Auditing ${url}...`);

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

  // Only write if scores actually changed (avoid dirty git from timestamp-only diffs)
  let shouldWrite = true;
  if (existsSync(OUTPUT_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      if (JSON.stringify(existing.scores) === JSON.stringify(output.scores)) {
        shouldWrite = false;
        console.log("[audit] Scores unchanged, skipping write.");
      }
    } catch {
      // corrupt file, overwrite
    }
  }

  if (shouldWrite) {
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log("[audit] Scores written to", OUTPUT_PATH);
  }
  console.log("[audit]", JSON.stringify(scores));

  // Log failing audits for debugging
  for (const [, cat] of Object.entries(result.lhr.categories)) {
    const catScore = Math.round((cat.score ?? 0) * 100);
    if (catScore < 100) {
      console.log(`\n[audit] ${cat.title} (${catScore}/100) — failing audits:`);
      for (const ref of cat.auditRefs) {
        const audit = result.lhr.audits[ref.id];
        if (audit && audit.score !== null && audit.score < 1) {
          console.log(
            `  ✗ ${audit.title} (score: ${audit.score}) — ${audit.description?.slice(0, 120)}`,
          );
        }
      }
    }
  }
}

main().catch((err) => {
  console.error("[audit] Error:", err);
  // Non-fatal — don't break the build
  process.exit(0);
});
