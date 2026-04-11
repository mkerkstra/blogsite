import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
