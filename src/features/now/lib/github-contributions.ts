/**
 * GitHub contribution-graph fetcher.
 *
 * Tries to query the GitHub GraphQL API with a personal access token
 * (set GITHUB_TOKEN in Vercel env vars, scope `read:user`). When the
 * token belongs to mkerkstra and "Include private contributions on
 * my profile" is enabled in github.com/settings/profile, this returns
 * the full count including private repos. Without a token, returns
 * null and the UI falls back to a public-only graph.
 */

const GITHUB_USERNAME = "mkerkstra";

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

export async function fetchContributionGraph(): Promise<ContributionGraph | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch("https://api.github.com/graphql", {
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

    const json = (await res.json()) as {
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
  } catch {
    return null;
  }
}
