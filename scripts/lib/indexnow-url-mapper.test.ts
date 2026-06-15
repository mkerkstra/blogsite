import { describe, expect, it } from "vitest";

// @ts-expect-error The production script is plain ESM; this test exercises it directly.
import { absoluteUrlsForChangedFiles, routesForChangedFiles } from "./indexnow-url-mapper.mjs";

describe("routesForChangedFiles", () => {
  it("maps top-level page/data changes to their canonical routes", () => {
    expect(
      routesForChangedFiles([
        "src/app/now/page.tsx",
        "src/features/reading/data/reading.ts",
        "src/features/colophon/data/stack.ts",
      ]),
    ).toEqual(["/now", "/reading", "/colophon"]);
  });

  it("maps lab page, component, and preview changes to lab index plus detail route", () => {
    expect(
      routesForChangedFiles([
        "src/app/lab/boids/page.tsx",
        "src/features/lab/components/mandelbrot.tsx",
        "public/lab-previews/kirigami.dark.png",
      ]),
    ).toEqual(["/lab", "/lab/boids", "/lab/mandelbrot", "/lab/kirigami"]);
  });

  it("maps lab index page changes to the lab index", () => {
    expect(routesForChangedFiles(["src/app/lab/page.tsx"])).toEqual(["/lab"]);
  });

  it("maps lab metadata and head changes to the whole lab surface", () => {
    const routes = routesForChangedFiles(["src/features/lab/components/lab-head.tsx"]);
    expect(routes).toContain("/lab");
    expect(routes).toContain("/lab/boids");
    expect(routes).toContain("/lab/kv-cache");
    expect(routes).toContain("/lab/documentation-principles");
  });

  it("maps shared lab rendering code to the whole lab surface", () => {
    const routes = routesForChangedFiles([
      "src/features/lab/components/chrome/lab-chrome.tsx",
      "src/features/lab/components/term.tsx",
      "src/features/lab/data/embedding-data.ts",
      "src/features/lab/lib/layout.ts",
    ]);

    expect(routes).toContain("/lab");
    expect(routes).toContain("/lab/boids");
    expect(routes).toContain("/lab/embedding-space");
    expect(routes).toContain("/lab/semantic-search");
  });

  it("maps global SEO changes to the whole canonical surface", () => {
    const routes = routesForChangedFiles(["src/app/sitemap.ts"]);
    expect(routes).toContain("/");
    expect(routes).toContain("/now");
    expect(routes).toContain("/lab");
    expect(routes).toContain("/lab/boids");
  });

  it("ignores files without public canonical routes", () => {
    expect(routesForChangedFiles(["README.md", "src/features/lab/lib/env.ts"])).toEqual([]);
  });
});

describe("absoluteUrlsForChangedFiles", () => {
  it("expands mapped routes to absolute URLs", () => {
    expect(
      absoluteUrlsForChangedFiles(["src/app/now/page.tsx"], "https://www.kerkstra.dev"),
    ).toEqual(["https://www.kerkstra.dev/now"]);
  });
});
