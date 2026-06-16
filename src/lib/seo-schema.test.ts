import { describe, expect, it } from "vitest";

import { absoluteUrl } from "@/lib/site";

import { buildBreadcrumbSchema, buildPageSchema, buildWebSiteSchema } from "./seo-schema";

describe("absoluteUrl", () => {
  it("resolves site-relative paths", () => {
    expect(absoluteUrl("/now")).toBe("https://www.kerkstra.dev/now");
    expect(absoluteUrl("/")).toBe("https://www.kerkstra.dev/");
  });

  it("passes absolute URLs through", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("emits ordered BreadcrumbList items", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lab", path: "/lab" },
    ]);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema["@id"]).toBe("https://www.kerkstra.dev/lab#breadcrumb");
    expect(schema.itemListElement).toMatchObject([
      { position: 1, name: "Home", item: "https://www.kerkstra.dev/" },
      { position: 2, name: "Lab", item: "https://www.kerkstra.dev/lab" },
    ]);
  });
});

describe("buildPageSchema", () => {
  it("links page schema to breadcrumb schema when provided", () => {
    const [page, breadcrumb] = buildPageSchema({
      name: "Reading",
      description: "A reading list.",
      path: "/reading",
      type: "CollectionPage",
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "Reading", path: "/reading" },
      ],
    });

    expect(page["@type"]).toBe("CollectionPage");
    expect(page.url).toBe("https://www.kerkstra.dev/reading");
    expect(page.breadcrumb).toEqual({ "@id": "https://www.kerkstra.dev/reading#breadcrumb" });
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
  });

  it("spreads extra page properties", () => {
    const [page] = buildPageSchema({
      name: "Now",
      description: "Current focus.",
      path: "/now",
      extra: { dateModified: "2026-04-11" },
    });

    expect(page.dateModified).toBe("2026-04-11");
  });
});

describe("buildWebSiteSchema", () => {
  it("identifies the site and publisher", () => {
    const schema = buildWebSiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("kerkstra.dev");
    expect(schema.url).toBe("https://www.kerkstra.dev");
    expect(schema.publisher).toMatchObject({ name: "Matt Kerkstra" });
  });
});
