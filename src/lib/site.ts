export const SITE_URL = "https://www.kerkstra.dev";
export const SITE_NAME = "kerkstra.dev";
export const SITE_AUTHOR = "Matt Kerkstra";
export const DEFAULT_TITLE = "Matt Kerkstra - Staff AI Engineer";
export const DEFAULT_DESCRIPTION =
  "Staff AI engineer shipping production LLM systems, evaluation loops, retrieval, model-serving infrastructure, and reliable AI products.";

export const SITE_PERSON = {
  "@type": "Person",
  name: SITE_AUTHOR,
  url: SITE_URL,
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path}`;
}
