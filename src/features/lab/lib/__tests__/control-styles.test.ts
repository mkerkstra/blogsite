import { describe, expect, it } from "vitest";
import {
  btnBase,
  btnActive,
  btnInactive,
  controlBar,
  controlDivider,
  controlLabel,
} from "../control-styles";

describe("control-styles", () => {
  it("exports non-empty class strings", () => {
    for (const cls of [btnBase, btnActive, btnInactive, controlBar, controlDivider, controlLabel]) {
      expect(typeof cls).toBe("string");
      expect(cls.length).toBeGreaterThan(0);
    }
  });

  it("btnBase includes font-mono and uppercase", () => {
    expect(btnBase).toContain("font-mono");
    expect(btnBase).toContain("uppercase");
    expect(btnBase).toContain("transition-colors");
  });

  it("btnActive includes foreground styling", () => {
    expect(btnActive).toContain("text-foreground");
  });

  it("btnInactive includes hover state", () => {
    expect(btnInactive).toContain("hover:");
  });

  it("controlBar includes fixed positioning and backdrop blur", () => {
    expect(controlBar).toContain("fixed");
    expect(controlBar).toContain("backdrop-blur");
  });
});
