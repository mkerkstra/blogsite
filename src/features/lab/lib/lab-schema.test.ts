import { describe, expect, it } from "vitest";

import { sections } from "../data/experiments";
import { buildLabIndexSchema, buildLabSchema, findExperiment } from "./lab-schema";

describe("findExperiment", () => {
  it("locates a known experiment and tags it with its section", () => {
    const exp = findExperiment("kirigami");
    expect(exp?.title).toBe("Kirigami");
    expect(exp?.section).toBe("Math");
  });

  it("returns null for an unknown slug", () => {
    expect(findExperiment("not-a-real-slug")).toBeNull();
  });
});

describe("buildLabSchema", () => {
  it("returns null for an unknown slug", () => {
    expect(buildLabSchema("not-a-real-slug")).toBeNull();
  });

  it("emits a CreativeWork + BreadcrumbList for a known slug", () => {
    const schema = buildLabSchema("kirigami");
    if (!schema) throw new Error("expected a schema for kirigami");
    const [creativeWork, breadcrumb] = schema;

    expect(creativeWork["@type"]).toBe("CreativeWork");
    expect(creativeWork.name).toBe("Kirigami");
    expect(creativeWork.url).toBe("https://www.kerkstra.dev/lab/kirigami");
    expect(creativeWork.image).toBe("https://www.kerkstra.dev/lab/kirigami/opengraph-image.png");
    expect((creativeWork.author as Record<string, string>).name).toBe("Matt Kerkstra");

    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[2].name).toBe("Kirigami");
    expect(items[2].item).toBe("https://www.kerkstra.dev/lab/kirigami");
  });

  it("builds a valid schema for every registered experiment", () => {
    for (const section of sections) {
      for (const exp of section.experiments) {
        const schema = buildLabSchema(exp.slug);
        if (!schema) throw new Error(`missing schema for ${exp.slug}`);
        expect(schema[0].name).toBe(exp.title);
      }
    }
  });
});

describe("buildLabIndexSchema", () => {
  it("emits a CollectionPage + a two-level breadcrumb", () => {
    const [collection, breadcrumb] = buildLabIndexSchema();
    expect(collection["@type"]).toBe("CollectionPage");
    expect(collection.url).toBe("https://www.kerkstra.dev/lab");
    const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[1].name).toBe("Lab");
  });
});
