import type { Metadata } from "next";

/**
 * Per-lab page metadata. Each /lab/[slug]/ directory also has an
 * opengraph-image.png that Next auto-wires as og:image — this helper
 * fills in og:title and og:description so social previews don't fall
 * back to the site-wide defaults from the root layout.
 */
export function labMetadata(slug: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `/lab/${slug}` },
    openGraph: {
      title: `${title} · kerkstra.dev`,
      description,
      url: `/lab/${slug}`,
      type: "article",
    },
  };
}
