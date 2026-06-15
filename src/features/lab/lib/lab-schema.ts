/**
 * JSON-LD generators for the /lab surface.
 *
 * Built from the same `experiments.ts` registry the pages render from
 * and injected in-tree through <JsonLd>, matching the rest of the
 * site's structured data.
 *
 * Each lab page gets:
 *  - CreativeWork  — it's an interactive visualization, not a news/blog
 *    article, so CreativeWork is the accurate schema.org type.
 *  - BreadcrumbList — Home › Lab › <Experiment> for breadcrumb rich
 *    results.
 *
 * Reference: https://schema.org/CreativeWork · https://schema.org/BreadcrumbList
 */
import { type Experiment, sections } from "../data/experiments";
import { SITE_NAME, SITE_PERSON, SITE_URL } from "@/lib/site";

type LocatedExperiment = Experiment & { section: string };

/** Find an experiment (and its section label) by slug. */
export function findExperiment(slug: string): LocatedExperiment | null {
  for (const section of sections) {
    const exp = section.experiments.find((e) => e.slug === slug);
    if (exp) return { ...exp, section: section.label };
  }
  return null;
}

/** Home › Lab breadcrumb for the lab index page. */
export function buildLabIndexSchema(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Lab",
      description: "Visual experiments and algorithm visualizations by Matt Kerkstra.",
      url: `${SITE_URL}/lab`,
      author: SITE_PERSON,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Lab", item: `${SITE_URL}/lab` },
      ],
    },
  ];
}

/**
 * CreativeWork + BreadcrumbList for a single lab experiment. Returns
 * null for an unknown slug so the caller can skip injection.
 */
export function buildLabSchema(slug: string): Record<string, unknown>[] | null {
  const exp = findExperiment(slug);
  if (!exp) return null;

  const url = `${SITE_URL}/lab/${slug}`;
  const image = `${SITE_URL}/lab-previews/${slug}.dark.png`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: exp.title,
      description: exp.description,
      url,
      image,
      genre: exp.section,
      author: SITE_PERSON,
      creator: SITE_PERSON,
      isPartOf: { "@type": "CollectionPage", name: "Lab", url: `${SITE_URL}/lab` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Lab", item: `${SITE_URL}/lab` },
        { "@type": "ListItem", position: 3, name: exp.title, item: url },
      ],
    },
  ];
}
