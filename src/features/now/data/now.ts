/**
 * The /now page is partly static, partly derived. The static prose
 * lives here so it's editable in one place. The GitHub-derived bits
 * (contribution graph + recent public repos) are fetched at build time
 * by the page itself.
 *
 * Last updated: 2026-04-11
 */

export const nowState = {
  updatedOn: "2026-04-11",
  focus: [
    {
      label: "Day job",
      blurb:
        "VideaHealth — most of my hours go into synapse-ml and nucleus-api. Operating at staff scope across the ML platform, model-serving stack, and the clinical-note pipeline. The 16-day clinical-note system is in production and now in its iteration phase.",
    },
    {
      label: "Side project",
      blurb:
        "narrative.sh — building an AI companion for tabletop RPG dungeon masters with a small group of longtime collaborators (the same people I started my career with at Reynolds & Reynolds). TypeScript, Next.js, Go.",
    },
    {
      label: "Open source",
      blurb:
        "Occasional contributions to feast-dev. Mostly tracking issues that bump up against the ML platform integration work.",
    },
    {
      label: "Reading",
      blurb: "Re-reading the Foundation trilogy. Three-Body Problem queued after.",
    },
  ],
  inspiration:
    "Kind of borrowed wholesale from nownownow.com — a small page describing what I'm currently focused on, refreshed periodically.",
};

export type NowState = typeof nowState;
