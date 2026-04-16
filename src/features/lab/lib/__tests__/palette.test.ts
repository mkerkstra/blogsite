import { describe, expect, it } from "vitest";
import { PALETTE, TRAIL_PALETTE } from "../palette";

describe("PALETTE", () => {
  it("has dark and light themes", () => {
    expect(PALETTE).toHaveProperty("dark");
    expect(PALETTE).toHaveProperty("light");
  });

  it.each(["dark", "light"] as const)("%s theme has bg, fg, and accent as RGB triples", (theme) => {
    for (const channel of ["bg", "fg", "accent"] as const) {
      const rgb = PALETTE[theme][channel];
      expect(rgb).toHaveLength(3);
      for (const v of rgb) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("TRAIL_PALETTE", () => {
  it("has dark and light themes with bg and color", () => {
    for (const theme of ["dark", "light"] as const) {
      expect(TRAIL_PALETTE[theme].bg).toHaveLength(3);
      expect(TRAIL_PALETTE[theme].color).toHaveLength(3);
    }
  });
});
