import { describe, expect, it } from "vitest";

import { maskRepo } from "./github-repos";

const baseRepo = {
  name: "test",
  full_name: "owner/test",
  html_url: "https://github.com/owner/test",
  description: "a test repo",
  language: "TypeScript",
  pushed_at: "2026-04-11T18:00:00Z",
  fork: false,
  private: false,
};

describe("maskRepo", () => {
  it("passes public repos through unmasked regardless of owner", () => {
    const result = maskRepo({ ...baseRepo, full_name: "videahealth/public-repo", private: false });
    expect(result.displayName).toBe("videahealth/public-repo");
    expect(result.url).toBe("https://github.com/owner/test");
    expect(result.description).toBe("a test repo");
    expect(result.redacted).toBe(false);
  });

  it("passes mkerkstra/* private repos through unmasked", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "mkerkstra/secret-thing",
      private: true,
    });
    expect(result.displayName).toBe("mkerkstra/secret-thing");
    expect(result.redacted).toBe(false);
    expect(result.description).toBe("a test repo");
  });

  it("passes narrative-nexus/* private repos through unmasked", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "narrative-nexus/narrative-nexus",
      private: true,
    });
    expect(result.displayName).toBe("narrative-nexus/narrative-nexus");
    expect(result.redacted).toBe(false);
  });

  it("redacts private videahealth/* repo names", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "videahealth/cromulent-snorkel",
      private: true,
    });
    expect(result.displayName).toBe("videahealth/[redacted]");
    expect(result.redacted).toBe(true);
  });

  it("nulls out url and description for redacted repos", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "videahealth/wibble-wobble",
      private: true,
    });
    expect(result.url).toBeNull();
    expect(result.description).toBeNull();
  });

  it("preserves language even when redacted (languages are broad enough to be safe)", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "videahealth/internal-thing",
      private: true,
      language: "Python",
    });
    expect(result.language).toBe("Python");
  });

  it("redacts unknown private orgs by default", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "some-other-org/private-thing",
      private: true,
    });
    expect(result.displayName).toBe("some-other-org/[redacted]");
    expect(result.redacted).toBe(true);
  });

  it("uses a hashed key (NOT the original name) so React Server Components doesn't leak it", () => {
    const result = maskRepo({
      ...baseRepo,
      full_name: "videahealth/cromulent-snorkel",
      private: true,
    });
    // Should be a base36 hash, not the original name
    expect(result.key).not.toBe("videahealth/cromulent-snorkel");
    expect(result.key).not.toContain("cromulent");
    expect(result.key).not.toContain("videahealth");
    expect(result.key).toMatch(/^[a-z0-9]+$/);
  });

  it("produces stable keys (same input → same key)", () => {
    const a = maskRepo({ ...baseRepo, full_name: "videahealth/x", private: true });
    const b = maskRepo({ ...baseRepo, full_name: "videahealth/x", private: true });
    expect(a.key).toBe(b.key);
  });

  it("produces distinct keys for different repos", () => {
    const a = maskRepo({ ...baseRepo, full_name: "videahealth/a", private: true });
    const b = maskRepo({ ...baseRepo, full_name: "videahealth/b", private: true });
    expect(a.key).not.toBe(b.key);
  });
});
