import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

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
