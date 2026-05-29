/**
 * Post-build HTML rewriter. Runs after `next build` to fix things
 * that can't be cleanly expressed inside the React/metadata pipeline:
 *
 * 1. Strip auto-generated <meta name="twitter:..."> tags from every
 *    prerendered HTML file. Next 16's metadata API auto-derives
 *    twitter:* tags from openGraph with no clean opt-out — see the
 *    long comment in src/app/layout.tsx. Matt is off X.
 *
 * 2. Inject JSON-LD structured data into the prerendered HTML:
 *      - homepage  → Person schema
 *      - /lab      → CollectionPage + BreadcrumbList
 *      - /lab/*    → CreativeWork + BreadcrumbList
 *    Rendering <script type="application/ld+json"> inside React's
 *    tree triggers a hydration warning that drops Lighthouse
 *    best-practices, and next/script defers the script to runtime
 *    where crawlers can't see it. Post-build injection emits a real
 *    <script> in the prerendered HTML where Google can read it AND
 *    avoids React's reconciler entirely.
 *
 * This step only works when the routes are statically prerendered (so
 * the .html files exist). If the build ever flips pages back to
 * `ƒ Dynamic`, these files vanish and injection silently no-ops — see
 * docs/architecture/static-seo-routes.md for how that happened once.
 *
 * Wired into `pnpm build` after `next build`.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { buildLabIndexSchema, buildLabSchema } from "../src/features/lab/lib/lab-schema";
import { buildPersonSchema } from "../src/features/resume/lib/person-schema";

// Match any <meta name="twitter:..."> tag (open-only, single-line).
const TWITTER_META_RE = /<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/g;

function walkSync(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSync(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function stripTwitterTags(html: string): { html: string; stripped: number } {
  const matches = html.match(TWITTER_META_RE);
  if (!matches) return { html, stripped: 0 };
  return { html: html.replace(TWITTER_META_RE, ""), stripped: matches.length };
}

/**
 * Inject one or more JSON-LD objects as <script> tags right before
 * </head>. Idempotent: if the file already has a JSON-LD script we
 * assume it was injected on a prior pass and skip.
 */
function injectJsonLd(
  html: string,
  objects: Record<string, unknown>[],
): {
  html: string;
  injected: boolean;
} {
  if (objects.length === 0) return { html, injected: false };
  if (html.includes('type="application/ld+json"')) return { html, injected: false };

  const headCloseIdx = html.indexOf("</head>");
  if (headCloseIdx === -1) return { html, injected: false };

  const tags = objects
    .map((obj) => {
      // Escape closing-script-tag sequences defensively even though our
      // schema doesn't contain user input.
      const safeJson = JSON.stringify(obj).replace(/<\//g, "<\\/");
      return `<script type="application/ld+json">${safeJson}</script>`;
    })
    .join("");

  const updated = html.slice(0, headCloseIdx) + tags + html.slice(headCloseIdx);
  return { html: updated, injected: true };
}

/**
 * Map a prerendered HTML file (relative to .next/server/app) to the
 * JSON-LD objects it should carry. Returns [] for routes with no
 * structured data.
 */
function schemaForRoute(relPath: string): Record<string, unknown>[] {
  const segments = relPath.split(path.sep);

  // Homepage → app/index.html
  if (relPath === "index.html") return [buildPersonSchema()];

  // Lab index → app/lab.html
  if (relPath === "lab.html") return buildLabIndexSchema();

  // Lab detail → app/lab/<slug>.html (exactly two segments)
  if (segments.length === 2 && segments[0] === "lab" && segments[1].endsWith(".html")) {
    const slug = segments[1].slice(0, -".html".length);
    return buildLabSchema(slug) ?? [];
  }

  return [];
}

function main() {
  const root = path.resolve(process.cwd(), ".next/server/app");
  const files = walkSync(root);

  let twitterFiles = 0;
  let twitterTags = 0;
  let schemaFiles = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let current = original;

    // 1. Strip twitter tags everywhere
    const stripResult = stripTwitterTags(current);
    if (stripResult.stripped > 0) {
      current = stripResult.html;
      twitterFiles++;
      twitterTags += stripResult.stripped;
    }

    // 2. Inject JSON-LD for the routes that carry it
    const relPath = path.relative(root, file);
    const objects = schemaForRoute(relPath);
    const injectResult = injectJsonLd(current, objects);
    if (injectResult.injected) {
      current = injectResult.html;
      schemaFiles++;
    }

    if (current !== original) {
      fs.writeFileSync(file, current);
    }
  }

  if (twitterFiles === 0) {
    console.log("✓ no twitter:* tags found in build output");
  } else {
    console.log(
      `✓ stripped ${twitterTags} twitter:* tags from ${twitterFiles} prerendered HTML files`,
    );
  }
  if (schemaFiles > 0) {
    console.log(`✓ injected JSON-LD into ${schemaFiles} prerendered HTML file(s)`);
  } else {
    console.log("⚠ no prerendered HTML found to inject JSON-LD into (are pages static?)");
  }
}

main();
