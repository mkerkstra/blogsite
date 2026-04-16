import type { Metadata } from "next";
import { Pathfinding } from "@/features/lab/components/pathfinding";

export const metadata: Metadata = {
  title: "Pathfinding",
  description: "A* vs Dijkstra vs BFS — draw walls, watch the search.",
  alternates: { canonical: "/lab/pathfinding" },
};

export default function PathfindingPage() {
  return (
    <>
      <Pathfinding />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          pathfinding
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          draw walls, then run
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Draw walls on the grid, then watch three search strategies find a path. BFS explores
              uniformly in all directions. Dijkstra follows lowest cost. A* adds a heuristic that
              pulls the search toward the goal.
            </p>
            <p>
              The colored frontier shows where the algorithm is looking next. Visited cells show
              where it has already been. When it reaches the goal, the shortest path lights up.
              Compare how many cells each algorithm visits.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
