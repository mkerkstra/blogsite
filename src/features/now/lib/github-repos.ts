/**
 * GitHub recent-repos fetcher with NDA-aware name redaction.
 *
 * When GITHUB_TOKEN is set, queries the authenticated /user/repos
 * endpoint which returns ALL repos the user has access to (public,
 * private, and org repos via collaborator/member affiliation).
 * Without a token, falls back to the public /users/mkerkstra/repos
 * endpoint which only returns public repos owned by mkerkstra.
 *
 * Private repos owned by orgs not in ALLOW_FULL_NAMES (e.g.
 * videahealth/*) get their repo name redacted to `${owner}/[redacted]`
 * before display, with description and link nulled out. Matt is
 * sensitive about leaking internal repo names — see memory:
 * feedback_dont_name_drop. The contribution heatmap above the
 * recent-repos list already shows the private contribution count
 * via the GraphQL endpoint, so the activity volume is preserved
 * without leaking specific repo names.
 */

const GITHUB_USERNAME = "mkerkstra";
const REVALIDATE_SECONDS = 86400;
const MAX_RESULTS = 6;

/**
 * Owners whose repo names are OK to show in full. Everything else
 * gets redacted to `${owner}/[redacted]` for private repos. Public
 * repos always show in full regardless of owner.
 */
const ALLOW_FULL_NAMES = new Set(["mkerkstra", "narrative-nexus"]);

/** Raw shape returned by the GitHub /user/repos and /users/.../repos APIs. */
type RawRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string;
  fork: boolean;
  private: boolean;
};

/**
 * FNV-1a 32-bit hash → base36 string. Used to derive React keys
 * from the original repo full_name without leaking the name into
 * the React Server Components Flight payload (which serializes
 * the `key` prop). Deterministic, unique enough for our list
 * sizes, and one-way.
 */
function stableKey(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** What the /now page renders for each repo entry. */
export type DisplayRepo = {
  /** React key (stable across renders) */
  key: string;
  /** owner/repo name, possibly masked to "owner/[redacted]" */
  displayName: string;
  /** Link target — null when redacted (clicking would 404 for visitors anyway) */
  url: string | null;
  /** One-line description — null when redacted */
  description: string | null;
  /** Primary language — kept even when redacted (broad enough to be safe) */
  language: string | null;
  /** ISO 8601 push timestamp */
  pushedAt: string;
  /** Whether the repo is private */
  private: boolean;
  /** Whether this entry was redacted */
  redacted: boolean;
};

/**
 * Pure function: take a raw repo and either pass it through or
 * redact based on owner. Exported for testing.
 */
export function maskRepo(repo: RawRepo): DisplayRepo {
  const owner = repo.full_name.split("/")[0] ?? "";
  const allowFullName = !repo.private || ALLOW_FULL_NAMES.has(owner);

  // CRITICAL: do not put the original repo name in the React key
  // for redacted repos. RSC serializes the key into the Flight
  // payload — using the full_name leaks it into the HTML even
  // though it's never visually rendered. Hash it instead.
  const key = stableKey(repo.full_name);

  if (allowFullName) {
    return {
      key,
      displayName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      pushedAt: repo.pushed_at,
      private: repo.private,
      redacted: false,
    };
  }

  return {
    key,
    displayName: `${owner}/[redacted]`,
    url: null,
    description: null,
    language: repo.language,
    pushedAt: repo.pushed_at,
    private: true,
    redacted: true,
  };
}

export async function fetchRecentRepos(): Promise<DisplayRepo[]> {
  const token = process.env.GITHUB_TOKEN;

  // Authenticated endpoint includes private + org repos. Unauthenticated
  // falls back to public mkerkstra/* only.
  const url = token
    ? "https://api.github.com/user/repos?sort=pushed&per_page=20&affiliation=owner,collaborator,organization_member"
    : `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=10&type=owner`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const repos: RawRepo[] = await res.json();
    return repos
      .filter((r) => !r.fork)
      .slice(0, MAX_RESULTS)
      .map(maskRepo);
  } catch {
    return [];
  }
}
