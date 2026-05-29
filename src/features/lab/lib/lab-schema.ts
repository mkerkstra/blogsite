/**
 * JSON-LD generators for the /lab surface.
 *
 * Mirrors the homepage Person schema approach: built from the same
 * `experiments.ts` registry the pages render from, and injected into
 * the prerendered HTML by scripts/post-process-html.ts (NOT rendered
 * in the React tree, which trips a hydration warning that costs
 * Lighthouse best-practices points — see src/app/page.tsx).
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

const SITE_URL = "https://www.kerkstra.dev";

const AUTHOR = {
  "@type": "Person",
  name: "Matt Kerkstra",
  url: SITE_URL,
} as const;

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
      author: AUTHOR,
      isPartOf: { "@type": "WebSite", name: "kerkstra.dev", url: SITE_URL },
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
  const image = `${url}/opengraph-image.png`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: exp.title,
      description: exp.description,
      url,
      image,
      genre: exp.section,
      author: AUTHOR,
      creator: AUTHOR,
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
