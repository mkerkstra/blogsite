import type { ContributionGraph } from "../lib/github-contributions";

/**
 * Render the GitHub contribution heatmap in our editorial style.
 * 7 rows (Sun-Sat) × N weeks. Each cell is a small square colored
 * by activity level. Lime accent for high activity, fading down to
 * the muted card background for none.
 */

const CELL_SIZE = 11;
const CELL_GAP = 2;
const ROWS = 7;

/** SVG `fill-*` classes for the heatmap rect cells. */
const LEVEL_FILL: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "fill-muted",
  1: "fill-accent/25",
  2: "fill-accent/50",
  3: "fill-accent/75",
  4: "fill-accent",
};

/** Matching `bg-*` classes for the legend swatch <span> elements. */
const LEVEL_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted",
  1: "bg-accent/25",
  2: "bg-accent/50",
  3: "bg-accent/75",
  4: "bg-accent",
};

export function ContributionGraphView({ graph }: { graph: ContributionGraph }) {
  const weeks = graph.weeks;
  const width = weeks.length * (CELL_SIZE + CELL_GAP);
  const height = ROWS * (CELL_SIZE + CELL_GAP);

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded border border-border bg-card p-4">
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>
          <span className="text-foreground">{graph.totalContributions.toLocaleString()}</span>
          {" contributions · last 12 months"}
        </span>
        <span className="hidden text-muted-foreground md:inline">includes private</span>
      </div>

      {/*
        Per-cell <title> children were removed because React 19 hoists
        <title> elements in ways that conflict with the SVG content model,
        producing a hydration mismatch warning in dev. The parent <svg>
        carries an aggregate aria-label that covers accessibility. If
        per-cell hover tooltips are ever wanted back, implement them via
        client-side hover state + an overlay <div>, not SVG <title>.
      */}
      <svg
        role="img"
        aria-label={`GitHub contribution graph: ${graph.totalContributions} contributions in the last year`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
      >
        {weeks.map((week, wi) =>
          week.days.map((day, di) => (
            <rect
              key={`${wi}-${di}`}
              x={wi * (CELL_SIZE + CELL_GAP)}
              y={di * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={1}
              ry={1}
              className={LEVEL_FILL[day.level]}
            />
          )),
        )}
      </svg>

      <div className="flex items-center justify-end gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={`inline-block h-2.5 w-2.5 rounded-sm ${LEVEL_BG[level]}`} />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
