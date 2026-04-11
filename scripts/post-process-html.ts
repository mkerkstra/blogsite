/**
 * Post-build HTML rewriter. Runs after `next build` to fix things
 * that can't be cleanly expressed inside the React/metadata pipeline:
 *
 * 1. Strip auto-generated <meta name="twitter:..."> tags from every
 *    prerendered HTML file. Next 16's metadata API auto-derives
 *    twitter:* tags from openGraph with no clean opt-out — see the
 *    long comment in src/app/layout.tsx. Matt is off X.
 *
 * 2. Inject the JSON-LD Person schema into the homepage <head>.
 *    Rendering <script type="application/ld+json"> inside React's
 *    tree triggers a hydration warning that drops Lighthouse
 *    best-practices, and next/script defers the script to runtime
 *    where crawlers can't see it. Post-build injection emits a real
 *    <script> in the prerendered HTML where Google can read it
 *    AND avoids React's reconciler entirely.
 *
 * Wired into `pnpm build` after `next build`.
 */
import * as fs from "node:fs";
import * as path from "node:path";

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

function injectPersonSchema(html: string): { html: string; injected: boolean } {
  // Only inject once per file. The check looks for a JSON-LD script
  // tag — if one already exists, don't add another.
  if (html.includes('type="application/ld+json"')) {
    return { html, injected: false };
  }
  const schema = buildPersonSchema();
  // Escape closing-script-tag in JSON to be safe even though our
  // schema doesn't contain user input.
  const safeJson = JSON.stringify(schema).replace(/<\//g, "<\\/");
  const tag = `<script type="application/ld+json">${safeJson}</script>`;

  // Inject right before </head>.
  const headCloseIdx = html.indexOf("</head>");
  if (headCloseIdx === -1) return { html, injected: false };
  const updated = html.slice(0, headCloseIdx) + tag + html.slice(headCloseIdx);
  return { html: updated, injected: true };
}

function main() {
  const root = path.resolve(process.cwd(), ".next/server/app");
  const files = walkSync(root);

  let twitterFiles = 0;
  let twitterTags = 0;
  let schemaInjected = 0;

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

    // 2. Inject Person schema only on the homepage (root index.html)
    const isHomepage = file.endsWith(`${path.sep}app${path.sep}index.html`);
    if (isHomepage) {
      const injectResult = injectPersonSchema(current);
      if (injectResult.injected) {
        current = injectResult.html;
        schemaInjected++;
      }
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
  if (schemaInjected > 0) {
    console.log(`✓ injected JSON-LD Person schema into ${schemaInjected} file(s)`);
  } else {
    console.log("⚠ no homepage found to inject JSON-LD into");
  }
}

main();
