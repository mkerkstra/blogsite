import { describe, expect, it } from "vitest";

import { labMetadata } from "./metadata";

describe("labMetadata", () => {
  it("derives title and description from the experiment registry", () => {
    expect(labMetadata("boids")).toMatchObject({
      title: "Boids",
      description: "Flocking. Separation, alignment, cohesion. No leader, no plan.",
      alternates: { canonical: "/lab/boids" },
    });
  });

  it("falls back gracefully for unknown slugs", () => {
    expect(labMetadata("not-real")).toMatchObject({
      title: "not-real",
      description: "Interactive lab experiment by Matt Kerkstra.",
      alternates: { canonical: "/lab/not-real" },
    });
  });
});
