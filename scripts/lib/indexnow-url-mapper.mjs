import { readFileSync } from "node:fs";

const TOP_LEVEL_ROUTES = ["/", "/now", "/reading", "/colophon", "/lab"];

const GLOBAL_ROUTE_PATTERNS = [
  /^src\/app\/layout\.tsx$/,
  /^src\/app\/globals\.css$/,
  /^src\/app\/sitemap\.ts$/,
  /^src\/app\/robots\.ts$/,
  /^src\/components\/breadcrumbs\.tsx$/,
  /^src\/components\/json-ld\.tsx$/,
  /^src\/components\/social-meta\.tsx$/,
  /^src\/lib\/seo-schema\.ts$/,
  /^src\/lib\/site\.ts$/,
  /^next\.config\.ts$/,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
];

const LAB_INDEX_PATTERNS = [/^src\/app\/lab\/page\.tsx$/];

// Modules here change crawlable lab HTML/metadata; canvas-paint-only code
// such as env, palette, and WebGL helpers is intentionally excluded.
const LAB_SURFACE_PATTERNS = [
  /^src\/features\/lab\/data\/experiments\.ts$/,
  /^src\/features\/lab\/data\/embedding-data\.ts$/,
  /^src\/features\/lab\/data\/glossary\.ts$/,
  /^src\/features\/lab\/lib\/lab-schema\.ts$/,
  /^src\/features\/lab\/lib\/metadata\.ts$/,
  /^src\/features\/lab\/lib\/layout\.ts$/,
  /^src\/features\/lab\/lib\/use-lab-canvas\.ts$/,
  /^src\/features\/lab\/lib\/use-lab-tools\.ts$/,
  /^src\/features\/lab\/components\/agent-pattern-canvas\.tsx$/,
  /^src\/features\/lab\/components\/lab-head\.tsx$/,
  /^src\/features\/lab\/components\/term\.tsx$/,
  /^src\/features\/lab\/components\/chrome\//,
];

const ROUTE_RULES = [
  { route: "/", patterns: [/^src\/app\/page\.tsx$/, /^src\/features\/resume\//] },
  { route: "/now", patterns: [/^src\/app\/now\/page\.tsx$/, /^src\/features\/now\//] },
  { route: "/reading", patterns: [/^src\/app\/reading\/page\.tsx$/, /^src\/features\/reading\//] },
  {
    route: "/colophon",
    patterns: [/^src\/app\/colophon\/page\.tsx$/, /^src\/features\/colophon\//],
  },
  { route: "/lab", patterns: LAB_INDEX_PATTERNS },
];

export const labSlugs = [
  ...readFileSync("src/features/lab/data/experiments.ts", "utf8").matchAll(/slug:\s*"([^"]+)"/g),
].map((match) => match[1]);
export const labRoutes = labSlugs.map((slug) => `/lab/${slug}`);

function normalizePath(path) {
  return path.trim().replace(/^\.?\//, "");
}

function matchesAny(path, patterns) {
  return patterns.some((pattern) => pattern.test(path));
}

function addLabSurfaceRoutes(routes) {
  routes.add("/lab");
  for (const route of labRoutes) routes.add(route);
}

function routeForAppPage(path) {
  const match = path.match(/^src\/app\/lab\/([^/]+)\/page\.tsx$/);
  return match ? `/lab/${match[1]}` : null;
}

function routeForLabComponent(path) {
  const match = path.match(/^src\/features\/lab\/components\/([^/]+)\.tsx$/);
  if (!match) return null;
  const slug = match[1];
  return labSlugs.includes(slug) ? `/lab/${slug}` : null;
}

function routeForLabPreview(path) {
  const match = path.match(/^public\/lab-previews\/(.+)\.(dark|light)\.png$/);
  if (!match) return null;
  const slug = match[1];
  return labSlugs.includes(slug) ? `/lab/${slug}` : null;
}

export function routesForChangedFiles(changedFiles) {
  const paths = changedFiles.map(normalizePath).filter(Boolean);
  const routes = new Set();

  if (paths.some((path) => matchesAny(path, GLOBAL_ROUTE_PATTERNS))) {
    for (const route of [...TOP_LEVEL_ROUTES, ...labRoutes]) routes.add(route);
    return [...routes];
  }

  for (const path of paths) {
    if (matchesAny(path, LAB_SURFACE_PATTERNS)) {
      addLabSurfaceRoutes(routes);
      continue;
    }

    for (const rule of ROUTE_RULES) {
      if (matchesAny(path, rule.patterns)) routes.add(rule.route);
    }

    const appLabRoute = routeForAppPage(path);
    if (appLabRoute) {
      routes.add("/lab");
      routes.add(appLabRoute);
    }

    const componentLabRoute = routeForLabComponent(path);
    if (componentLabRoute) {
      routes.add("/lab");
      routes.add(componentLabRoute);
    }

    const previewLabRoute = routeForLabPreview(path);
    if (previewLabRoute) {
      routes.add("/lab");
      routes.add(previewLabRoute);
    }
  }

  return [...routes];
}

export function absoluteUrlsForChangedFiles(changedFiles, siteUrl) {
  return routesForChangedFiles(changedFiles).map(
    (route) => `${siteUrl}${route === "/" ? "" : route}`,
  );
}
