import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  // Modern browsers fetch /icon.svg via the <link rel="icon"> tag, but
  // some legacy paths (and Lighthouse audits) hit /favicon.ico directly.
  // Redirect to the SVG so we don't 404 the legacy fallback path.
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.svg",
        permanent: true,
      },
    ];
  },
  // Belt-and-braces cache headers for the SEO metadata routes. Next
  // serves these from the static cache already, but an explicit long
  // s-maxage with stale-while-revalidate guarantees crawlers (and the
  // CDN) hold the sitemap/robots without re-rendering per hit.
  async headers() {
    const seoCache = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
    return [
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: seoCache }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: seoCache }],
      },
    ];
  },
};

export default nextConfig;
