import type { MetadataRoute } from "next";

const SITE_URL = "https://www.kerkstra.dev";

/**
 * sitemap.xml — Next 16 picks this up automatically and serves it
 * at /sitemap.xml. Routes here are listed by hand because there's a
 * fixed top-level set; if /writing comes back, generate from the
 * posts index instead.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/now`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/reading`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/api/resume.json`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
