/**
 * Renders JSON-LD structured data as <script type="application/ld+json">
 * directly in the React tree (server component). This is the
 * Next.js-recommended approach and, unlike the old post-build HTML
 * injection, it actually survives Vercel's build (post-build edits to
 * .next/**\/*.html never reached the served pages — see
 * docs/architecture/static-seo-routes.md).
 *
 * Accepts a single schema object or an array (e.g. CreativeWork +
 * BreadcrumbList). The `<` escape guards against breaking out of the
 * script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item) => (
        <script
          key={String(item["@type"])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
