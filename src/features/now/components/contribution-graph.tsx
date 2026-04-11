import type { ContributionGraph } from "../lib/github-contributions";

/**
 * Render the GitHub contribution heatmap in our editorial style.
 * 7 rows (Sun-Sat) × N weeks. Each cell is a small square colored
 * by activity level. Lime accent for high activity, fading down to
 * the muted card background for none.
 */
export function ContributionGraphView({ graph }: { graph: ContributionGraph }) {
  const cellSize = 11;
  const gap = 2;
  const weeks = graph.weeks;
  const width = weeks.length * (cellSize + gap);
  const height = 7 * (cellSize + gap);

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
        <svg
          role="img"
          aria-label={`GitHub contribution graph: ${graph.totalContributions} contributions in the last year`}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: width }}
        >
          {weeks.map((week, wi) =>
            week.days.map((day, di) => (
              <rect
                key={`${wi}-${di}`}
                x={wi * (cellSize + gap)}
                y={di * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={1}
                ry={1}
                className={LEVEL_CLASS[day.level]}
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
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`inline-block h-2.5 w-2.5 rounded-sm ${LEVEL_CLASS[level as 0 | 1 | 2 | 3 | 4]}`}
          />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "fill-muted [&]:fill-muted",
  1: "fill-accent/25 [&]:fill-accent/25",
  2: "fill-accent/50 [&]:fill-accent/50",
  3: "fill-accent/75 [&]:fill-accent/75",
  4: "fill-accent [&]:fill-accent",
};
