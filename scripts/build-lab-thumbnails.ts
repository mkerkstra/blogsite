/**
 * Capture 1200x630 PNGs of every /lab/[slug] page in both themes and write
 * them to public/lab-previews/[slug].{dark,light}.png. The dark variant
 * doubles as the OG image (copied into src/app/lab/[slug]/opengraph-image.png).
 *
 * Requires the dev server running on $LAB_THUMBS_URL (default
 * http://localhost:3000). Reuses chrome-launcher (already in devDeps for
 * Lighthouse) and drives it with puppeteer-core, so no Chromium download.
 *
 * Usage: pnpm build:lab-thumbs
 *   LAB_THUMBS_URL=...          override base URL
 *   LAB_THUMBS_BAKE_MS=...      override per-lab settle time (default 2500ms)
 *   LAB_THUMBS_ONLY=slug,slug   regenerate only specific slugs
 *   LAB_THUMBS_THEME=dark|light|both   restrict to one theme (default both)
 */

import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

import puppeteer from "puppeteer-core";

import { sections } from "../src/features/lab/data/experiments";

const BASE_URL = process.env["LAB_THUMBS_URL"] ?? "http://localhost:3000";
const BAKE_MS = Number(process.env["LAB_THUMBS_BAKE_MS"] ?? 2500);
const ONLY = process.env["LAB_THUMBS_ONLY"]?.split(",").map((s) => s.trim()) ?? [];
const THEME_ARG = (process.env["LAB_THUMBS_THEME"] ?? "both") as "dark" | "light" | "both";
const THEMES: Array<"dark" | "light"> = THEME_ARG === "both" ? ["dark", "light"] : [THEME_ARG];
const OUT_DIR = resolve("public/lab-previews");
const APP_LAB_DIR = resolve("src/app/lab");
const WIDTH = 1200;
const HEIGHT = 630;

async function main() {
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  const chromeLauncher = await import("chrome-launcher");
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      "--headless=new",
      "--hide-scrollbars",
      "--no-sandbox",
      `--window-size=${WIDTH},${HEIGHT}`,
      "--use-gl=angle",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  });

  const wsRes = await fetch(`http://127.0.0.1:${chrome.port}/json/version`);
  const { webSocketDebuggerUrl } = (await wsRes.json()) as { webSocketDebuggerUrl: string };
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
  });

  try {
    const slugs = sections
      .flatMap((s) => s.experiments.map((e) => e.slug))
      .filter((slug) => ONLY.length === 0 || ONLY.includes(slug));

    console.log(`[thumbs] capturing ${slugs.length} labs × ${THEMES.length} themes`);

    for (const theme of THEMES) {
      for (const slug of slugs) {
        const page = await browser.newPage();
        await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
        await page.evaluateOnNewDocument((t: string) => {
          try {
            localStorage.setItem("theme", t);
          } catch {
            // ignore
          }
        }, theme);

        const url = `${BASE_URL}/lab/${slug}`;
        try {
          // domcontentloaded, not networkidle2 — heavy WebGL labs never go idle.
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
          await page.waitForSelector("canvas, svg", { timeout: 10_000 });
          // Hide site chrome + Next dev indicator so the canvas fills the frame.
          await page.addStyleTag({
            content: `
              header, footer, .scroll-progress { display: none !important; }
              main { padding: 0 !important; max-width: none !important; }
              body { overflow: hidden !important; }
              nextjs-portal { display: none !important; }
            `,
          });
          await new Promise((r) => setTimeout(r, BAKE_MS));

          const out = resolve(OUT_DIR, `${slug}.${theme}.png`);
          await page.screenshot({ path: out as `${string}.png`, type: "png", fullPage: false });

          // Dark variant doubles as the OG image — keep slug dirs in sync.
          if (theme === "dark") {
            const ogDir = resolve(APP_LAB_DIR, slug);
            if (existsSync(ogDir)) {
              copyFileSync(out, resolve(ogDir, "opengraph-image.png"));
            }
          }

          console.log(`[thumbs] ✓ ${theme} / ${slug}`);
        } catch (err) {
          console.error(`[thumbs] ✗ ${theme} / ${slug}: ${(err as Error).message}`);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.disconnect();
    await chrome.kill();
  }
}

main().catch((err) => {
  console.error("[thumbs] fatal:", err);
  process.exit(1);
});
