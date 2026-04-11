import type { MetadataRoute } from "next";

const SITE_URL = "https://www.kerkstra.dev";

/**
 * robots.txt — Next 16 picks this up automatically and serves it
 * at /robots.txt. Allow all crawlers, point them at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
