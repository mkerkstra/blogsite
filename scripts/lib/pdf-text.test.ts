import { describe, expect, it } from "vitest";

import { clean, splitLede, splitName, stripBold } from "./pdf-text";

describe("pdf-text helpers", () => {
  describe("clean", () => {
    it("substitutes → with ->", () => {
      expect(clean("Mongo → PG migrations")).toBe("Mongo -> PG migrations");
    });

    it("substitutes ↳ with ->", () => {
      expect(clean("↳ Software Engineer")).toBe("-> Software Engineer");
    });

    it("substitutes ✕ with x", () => {
      expect(clean("2.5✕ growth")).toBe("2.5x growth");
    });

    it("substitutes ✓ with v", () => {
      expect(clean("✓ done")).toBe("v done");
    });

    it("leaves Latin-1 characters alone (em dash, ×, ·)", () => {
      // Em dash, multiplication sign, and middle dot are all in
      // built-in PDF fonts so they should pass through.
      expect(clean("Foo — Bar · 2.5× growth")).toBe("Foo — Bar · 2.5× growth");
    });

    it("returns plain ASCII unchanged", () => {
      expect(clean("plain ascii text")).toBe("plain ascii text");
    });
  });

  describe("stripBold", () => {
    it("removes bold markers", () => {
      expect(stripBold("shipped in **16 days**")).toBe("shipped in 16 days");
    });

    it("handles multiple bold spans", () => {
      expect(stripBold("**Kubernetes** and **vLLM** stack")).toBe("Kubernetes and vLLM stack");
    });

    it("leaves text without bold markers alone", () => {
      expect(stripBold("plain text")).toBe("plain text");
    });
  });

  describe("splitName", () => {
    it("splits a two-word name", () => {
      expect(splitName("Matt Kerkstra")).toEqual(["Matt", "Kerkstra"]);
    });

    it("treats multi-word first name correctly", () => {
      expect(splitName("Mary Anne Smith")).toEqual(["Mary Anne", "Smith"]);
    });

    it("handles a single-word name", () => {
      expect(splitName("Madonna")).toEqual(["Madonna", ""]);
    });

    it("trims surrounding whitespace", () => {
      expect(splitName("  Matt Kerkstra  ")).toEqual(["Matt", "Kerkstra"]);
    });
  });

  describe("splitLede", () => {
    it("splits the first sentence as the lede", () => {
      const blurb = "Software engineer. Seven years building production ML infrastructure.";
      expect(splitLede(blurb)).toEqual([
        "Software engineer.",
        "Seven years building production ML infrastructure.",
      ]);
    });

    it("returns empty rest for a one-sentence blurb", () => {
      expect(splitLede("Just one sentence.")).toEqual(["Just one sentence.", ""]);
    });

    it("joins multiple trailing sentences with a space", () => {
      const blurb = "Lede. Sentence two. Sentence three.";
      expect(splitLede(blurb)).toEqual(["Lede.", "Sentence two. Sentence three."]);
    });
  });
});
