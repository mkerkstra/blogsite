import { absoluteUrl, SITE_NAME, SITE_PERSON, SITE_URL } from "@/lib/site";

export type BreadcrumbSchemaItem = {
  name: string;
  path: string;
};

type PageSchemaOptions = {
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "ProfilePage" | "CollectionPage" | "AboutPage";
  breadcrumbs?: BreadcrumbSchemaItem[];
  extra?: Record<string, unknown>;
};

export function buildBreadcrumbSchema(items: BreadcrumbSchemaItem[]): Record<string, unknown> {
  const current = items.at(-1);
  const idPath = current ? current.path : "/";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(idPath)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildPageSchema({
  name,
  description,
  path,
  type = "WebPage",
  breadcrumbs,
  extra,
}: PageSchemaOptions): Record<string, unknown>[] {
  const url = absoluteUrl(path);
  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url,
    author: SITE_PERSON,
    publisher: SITE_PERSON,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...extra,
  };

  if (breadcrumbs && breadcrumbs.length >= 2) {
    page.breadcrumb = { "@id": `${url}#breadcrumb` };
    return [page, buildBreadcrumbSchema(breadcrumbs)];
  }

  return [page];
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-US",
    publisher: SITE_PERSON,
  };
}
