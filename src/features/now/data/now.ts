/**
 * The /now page is partly static, partly derived. The static prose
 * lives here so it's editable in one place. The GitHub-derived bits
 * (contribution graph + recent public repos) are fetched at build time
 * by the page itself. Update `updatedOn` when you edit the focus
 * blurbs — the page surfaces it as "last updated".
 */

/**
 * Image keys for optional photos rendered alongside a focus block.
 * The page component (src/app/now/page.tsx) imports the actual
 * image files statically and looks them up by key here — keeping
 * the data file free of import paths.
 */
export type FocusImage = "ollie" | "heidelberg";

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
        "narrative.sh - an AI companion for tabletop RPG dungeon masters, co-built with a group of long-time friends who are also software devs. TypeScript, Next.js, Go.",
    },
    {
      label: "Open source",
      blurb: "Occasional contributions where the ML platform work bumps into upstream issues.",
    },
    {
      label: "Home",
      blurb: "My wife and our chipoodle Ollie. Reality TV to unwind.",
      image: "ollie" as FocusImage,
      imageAlt: "Ollie the chipoodle",
    },
    {
      label: "Travel",
      blurb:
        "We're national-parks-and-travel people. Most recent trip was down the Rhine for the Christmas markets.",
      image: "heidelberg" as FocusImage,
      imageAlt: "Matt and his wife in Heidelberg",
    },
  ],
};

export type NowState = typeof nowState;
