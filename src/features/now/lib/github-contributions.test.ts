import { describe, expect, it } from "vitest";

import { parseContributionGraph, type RawCalendarResponse } from "./github-contributions";

const validResponse: RawCalendarResponse = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 4851,
          weeks: [
            {
              contributionDays: [
                {
                  date: "2026-01-01",
                  contributionCount: 0,
                  contributionLevel: "NONE",
                },
                {
                  date: "2026-01-02",
                  contributionCount: 3,
                  contributionLevel: "FIRST_QUARTILE",
                },
                {
                  date: "2026-01-03",
                  contributionCount: 8,
                  contributionLevel: "SECOND_QUARTILE",
                },
              ],
            },
            {
              contributionDays: [
                {
                  date: "2026-01-08",
                  contributionCount: 14,
                  contributionLevel: "THIRD_QUARTILE",
                },
                {
                  date: "2026-01-09",
                  contributionCount: 25,
                  contributionLevel: "FOURTH_QUARTILE",
                },
              ],
            },
          ],
        },
      },
    },
  },
};

describe("parseContributionGraph", () => {
  it("returns null when the response has no data field", () => {
    expect(parseContributionGraph({})).toBeNull();
  });

  it("returns null when contributionCalendar is missing (e.g. unauthenticated query)", () => {
    expect(parseContributionGraph({ data: { user: {} } })).toBeNull();
  });

  it("returns null when user is missing (e.g. wrong login)", () => {
    expect(parseContributionGraph({ data: {} })).toBeNull();
  });

  it("extracts the total contribution count", () => {
    const result = parseContributionGraph(validResponse);
    expect(result?.totalContributions).toBe(4851);
  });

  it("flattens weeks → days with the canonical shape", () => {
    const result = parseContributionGraph(validResponse);
    expect(result?.weeks).toHaveLength(2);
    expect(result?.weeks[0]?.days).toHaveLength(3);
    expect(result?.weeks[1]?.days).toHaveLength(2);
  });

  it("maps contributionLevel strings to 0-4 numeric levels", () => {
    const result = parseContributionGraph(validResponse);
    expect(result?.weeks[0]?.days[0]?.level).toBe(0); // NONE
    expect(result?.weeks[0]?.days[1]?.level).toBe(1); // FIRST_QUARTILE
    expect(result?.weeks[0]?.days[2]?.level).toBe(2); // SECOND_QUARTILE
    expect(result?.weeks[1]?.days[0]?.level).toBe(3); // THIRD_QUARTILE
    expect(result?.weeks[1]?.days[1]?.level).toBe(4); // FOURTH_QUARTILE
  });

  it("preserves date and count fields per day", () => {
    const result = parseContributionGraph(validResponse);
    const day = result?.weeks[0]?.days[1];
    expect(day?.date).toBe("2026-01-02");
    expect(day?.count).toBe(3);
  });

  it("falls back to level 0 for unknown contributionLevel strings", () => {
    const weird: RawCalendarResponse = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 1,
              weeks: [
                {
                  contributionDays: [
                    {
                      date: "2026-01-01",
                      contributionCount: 0,
                      contributionLevel: "MYSTERY_NEW_LEVEL",
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    };
    expect(parseContributionGraph(weird)?.weeks[0]?.days[0]?.level).toBe(0);
  });
});
