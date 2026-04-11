/**
 * Smoke test for the /api/resume.json route handler. Calls GET()
 * directly (not via HTTP) and verifies the response shape matches the
 * jsonresume v1 schema. We don't validate the schema exhaustively —
 * just the load-bearing fields that downstream consumers rely on.
 */
import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/api/resume.json", () => {
  it("returns 200 with json content-type", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("sets a cache-control header", async () => {
    const response = await GET();
    expect(response.headers.get("cache-control")).toContain("public");
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
  });

  it("returns valid jsonresume v1 schema with all top-level sections", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.$schema).toBe(
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    );
    expect(body.basics).toBeDefined();
    expect(body.work).toBeInstanceOf(Array);
    expect(body.education).toBeInstanceOf(Array);
    expect(body.projects).toBeInstanceOf(Array);
    expect(body.skills).toBeInstanceOf(Array);
    expect(body.meta).toBeDefined();
  });

  it("includes basics name, email, and location", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.basics.name).toBe("Matt Kerkstra");
    expect(body.basics.email).toBe("mattkerkstra@gmail.com");
    expect(body.basics.location).toMatchObject({
      city: "Austin",
      region: "TX",
      countryCode: "US",
    });
  });

  it("includes GitHub and LinkedIn profiles", async () => {
    const response = await GET();
    const body = await response.json();

    const networks = body.basics.profiles.map((p: { network: string }) => p.network);
    expect(networks).toContain("GitHub");
    expect(networks).toContain("LinkedIn");
  });

  it("strips bold markdown markers from work highlights", async () => {
    const response = await GET();
    const body = await response.json();

    const allHighlights = body.work.flatMap((w: { highlights: string[] }) => w.highlights);
    for (const h of allHighlights) {
      expect(h).not.toMatch(/\*\*/);
    }
  });

  it("emits ISO-8601 dates on work entries", async () => {
    const response = await GET();
    const body = await response.json();

    for (const job of body.work) {
      expect(job.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (job.endDate) {
        expect(job.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("emits at least one work entry, one education entry, one project, and one skill group", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.work.length).toBeGreaterThan(0);
    expect(body.education.length).toBeGreaterThan(0);
    expect(body.projects.length).toBeGreaterThan(0);
    expect(body.skills.length).toBeGreaterThan(0);
  });

  it("has a meta.canonical URL", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.meta.canonical).toBe("https://www.kerkstra.dev/api/resume.json");
  });
});
