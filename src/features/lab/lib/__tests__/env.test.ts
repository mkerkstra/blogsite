import { describe, expect, it, beforeEach } from "vitest";
import { getTheme, prefersReducedMotion } from "../env";

describe("getTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("returns 'light' when no dark class is present", () => {
    expect(getTheme()).toBe("light");
  });

  it("returns 'dark' when dark class is present", () => {
    document.documentElement.classList.add("dark");
    expect(getTheme()).toBe("dark");
  });
});

describe("prefersReducedMotion", () => {
  it("returns a boolean", () => {
    expect(typeof prefersReducedMotion()).toBe("boolean");
  });
});
