/**
 * OpenGraph meta tags, rendered in-tree.
 *
 * Why not `metadata.openGraph`? Next 16 auto-derives twitter:* tags
 * from openGraph (and from the opengraph-image file convention) with
 * no opt-out — and Matt is off X, so no twitter tags anywhere. By
 * hand-rendering only og:* we keep Slack/LinkedIn/Discord previews
 * without emitting a single twitter tag. React 19 hoists these <meta>
 * tags into <head> during SSR/prerender. See
 * docs/architecture/static-seo-routes.md.
 *
 * og:image must be an absolute URL.
 */
const SITE_URL = "https://www.kerkstra.dev";
const SITE_NAME = "kerkstra.dev";

type OgType = "website" | "article" | "profile";

function abs(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

export function SocialMeta({
  title,
  description,
  url,
  image = "/og",
  type = "website",
  imageWidth = 1200,
  imageHeight = 630,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: OgType;
  imageWidth?: number;
  imageHeight?: number;
}) {
  return (
    <>
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={abs(url)} />
      <meta property="og:image" content={abs(image)} />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta property="og:image:alt" content={title} />
    </>
  );
}
