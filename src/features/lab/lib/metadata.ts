import type { Metadata } from "next";

/**
 * Per-lab page metadata: title, description, canonical.
 *
 * Note: no `openGraph` here. Next 16 auto-derives twitter:* tags from
 * openGraph, and Matt is off X — so og:* (and the per-lab JSON-LD) are
 * rendered in-tree by <LabHead> (src/features/lab/components/lab-head.tsx)
 * instead, which each lab page renders. See
 * docs/architecture/static-seo-routes.md.
 */
export function labMetadata(slug: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `/lab/${slug}` },
  };
}
