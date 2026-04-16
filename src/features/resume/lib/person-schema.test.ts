import { describe, expect, it } from "vitest";

import { buildPersonSchema } from "./person-schema";

describe("buildPersonSchema", () => {
  const schema = buildPersonSchema();

  it("uses the schema.org Person type", () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Person");
  });

  it("includes name, url, image, jobTitle, description", () => {
    expect(schema.name).toBe("Matt Kerkstra");
    expect(schema.url).toBe("https://www.kerkstra.dev");
    expect(schema.image).toBe("https://www.kerkstra.dev/profile/profilePic.jpg");
    expect(schema.jobTitle).toBeTruthy();
    expect(schema.description).toBeTruthy();
  });

  it("emits a PostalAddress for the location", () => {
    const address = schema.address as Record<string, string>;
    expect(address["@type"]).toBe("PostalAddress");
    expect(address.addressLocality).toBe("Austin");
    expect(address.addressRegion).toBe("TX");
    expect(address.addressCountry).toBe("US");
  });

  it("includes GitHub and LinkedIn in sameAs", () => {
    const sameAs = schema.sameAs as string[];
    expect(sameAs).toContain("https://github.com/mkerkstra");
    expect(sameAs).toContain("https://linkedin.com/in/matt-kerkstra");
  });

  it("includes worksFor (current employer)", () => {
    const worksFor = schema.worksFor as Record<string, string>;
    expect(worksFor["@type"]).toBe("Organization");
    expect(worksFor.name).toBeTruthy();
  });

  it("includes alumniOf when education is present", () => {
    const alumniOf = schema.alumniOf as Record<string, string>;
    expect(alumniOf["@type"]).toBe("CollegeOrUniversity");
    expect(alumniOf.name).toBe("Rice University");
  });

  it("includes knowsAbout populated from the toolbox", () => {
    const knowsAbout = schema.knowsAbout as string[];
    expect(knowsAbout.length).toBeGreaterThan(10);
    expect(knowsAbout).toContain("Kubernetes");
    expect(knowsAbout).toContain("TypeScript");
  });
});
