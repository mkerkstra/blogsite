import { describe, expect, it } from "vitest";

import { ollieBio, olliePics } from "./ollie";

describe("olliePics", () => {
  it("has exactly 12 entries", () => {
    expect(olliePics).toHaveLength(12);
  });

  it("every entry has src, alt, and caption", () => {
    for (const pic of olliePics) {
      expect(pic.src).toBeDefined();
      expect(pic.alt).toBeTruthy();
      expect(pic.caption).toBeTruthy();
    }
  });

  it("no captions contain em-dashes", () => {
    for (const pic of olliePics) {
      expect(pic.caption).not.toContain("—");
      expect(pic.caption).not.toContain("–");
    }
  });
});

describe("ollieBio", () => {
  it("has gotchaDay as a valid date string", () => {
    expect(new Date(ollieBio.gotchaDay).toString()).not.toBe("Invalid Date");
  });

  it("has at least one trait", () => {
    expect(ollieBio.traits.length).toBeGreaterThan(0);
  });
});
