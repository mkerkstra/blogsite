/**
 * The /now page is partly static, partly derived. The static prose
 * lives here so it's editable in one place. The GitHub-derived bits
 * (contribution graph + recent public repos) are fetched at build time
 * by the page itself.
 *
 * NOTE TO MATT: the focus blurbs below are starting drafts based on
 * what's in your resume + the GitHub screenshot you shared. Replace
 * with your own words whenever you want. Update the `updatedOn` date
 * when you do — the page surfaces it as "last updated".
 */

export const nowState = {
  updatedOn: "2026-04-11",
  focus: [
    {
      label: "Day job",
      blurb:
        "VideaHealth. Operating at staff scope across the ML platform, the model-serving stack, and the clinical-note pipeline.",
    },
    {
      label: "Side project",
      blurb:
        "narrative.sh — an AI companion for tabletop RPG dungeon masters, co-built with a group of long-time friends who are also software devs. TypeScript, Next.js, Go.",
    },
    {
      label: "Open source",
      blurb: "Occasional contributions where the ML platform work bumps into upstream issues.",
    },
  ],
};

export type NowState = typeof nowState;
