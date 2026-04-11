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

      <div className="overflow-x-auto">
        {/*
          suppressHydrationWarning: the per-cell dates in the <title>
          tooltips can drift between SSR and Turbopack HMR re-renders
          during dev (the GitHub fetch may refresh between passes),
          which React 19 flags as a hydration mismatch. In production
          the page is statically prerendered once so no drift is
          possible — this suppression is purely to silence dev console
          noise without masking a real bug.
        */}
        <svg
          role="img"
          aria-label={`GitHub contribution graph: ${graph.totalContributions} contributions in the last year`}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: width }}
          suppressHydrationWarning
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
              >
                <title>
                  {day.date}: {day.count} contributions
                </title>
              </rect>
            )),
          )}
        </svg>
      </div>

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
