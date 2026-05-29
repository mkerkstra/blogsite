import type { MetadataRoute } from "next";

import { sections } from "@/features/lab/data/experiments";

const SITE_URL = "https://www.kerkstra.dev";

/**
 * sitemap.xml — Next 16 picks this up automatically and serves it
 * at /sitemap.xml.
 *
 * Top-level routes are listed by hand (small, fixed set). The lab
 * experiments — the bulk of the indexable surface — are generated
 * from the same `sections` registry the /lab index and per-page
 * routes read, so a new experiment lands in the sitemap with no
 * extra step. /ollie is intentionally omitted: it's `noindex` (see
 * src/app/ollie/page.tsx).
 *
 * Note: every URL here is a clean path with no query string, so the
 * `&`-escaping caveat that bites query-param sitemaps (?a=x&b=y) in
 * Next's resolveSitemap doesn't apply. If a route with query params
 * ever joins this list, XML-escape the ampersands by hand.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const topLevel: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/lab`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/now`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/reading`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/colophon`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${SITE_URL}/api/resume.json`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const labRoutes: MetadataRoute.Sitemap = sections.flatMap((section) =>
    section.experiments.map((exp) => ({
      url: `${SITE_URL}/lab/${exp.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [...topLevel, ...labRoutes];
}
