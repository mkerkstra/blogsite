/**
 * GitHub contribution-graph fetcher.
 *
 * Tries to query the GitHub GraphQL API with a personal access token
 * (set GITHUB_TOKEN in Vercel env vars; setup steps in CLAUDE.md →
 * "GitHub contribution graph (private)"). When the token belongs to
 * mkerkstra and "Include private contributions on my profile" is on,
 * this returns the full count including private repos. Without a
 * token, returns null and the UI falls back to a public-only graph.
 */

const GITHUB_USERNAME = "mkerkstra";
const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

export type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type ContributionWeek = {
  days: ContributionDay[];
};

export type ContributionGraph = {
  totalContributions: number;
  weeks: ContributionWeek[];
};

/** Raw shape returned by the GitHub GraphQL `contributionCalendar` field. */
export type RawCalendarResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              date: string;
              contributionCount: number;
              contributionLevel: string;
            }[];
          }[];
        };
      };
    };
  };
};

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const LEVEL_MAP: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/**
 * Pure parser — extract the canonical ContributionGraph shape from
 * a raw GraphQL response. Returns null if the expected fields are
 * missing (errors, rate limit, unauthenticated, etc).
 *
 * Exported for tests; the fetcher composes this with the network call.
 */
export function parseContributionGraph(json: RawCalendarResponse): ContributionGraph | null {
  const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) return null;
  return {
    totalContributions: cal.totalContributions,
    weeks: cal.weeks.map((w) => ({
      days: w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVEL_MAP[d.contributionLevel] ?? 0,
      })),
    })),
  };
}

export async function fetchContributionGraph(): Promise<ContributionGraph | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { login: GITHUB_USERNAME },
      }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RawCalendarResponse;
    return parseContributionGraph(json);
  } catch {
    return null;
  }
}
