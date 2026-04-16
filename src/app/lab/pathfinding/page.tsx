import type { Metadata } from "next";

import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Pathfinding } from "@/features/lab/components/pathfinding";
import { Term } from "@/features/lab/components/term";

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
      <LabInfoPanel>
        <p>
          Draw walls on the grid, then watch three search strategies find a path. BFS explores
          uniformly in all directions. Dijkstra follows lowest cost. A* adds a heuristic that pulls
          the search toward the goal.
        </p>
        <p>
          BFS treats all edges equally, expanding one layer at a time across an unweighted graph.
          Dijkstra generalizes to weighted graphs by using a{" "}
          <Term id="priority-queue">priority queue</Term> to always expand the lowest-cost frontier
          node. A* extends Dijkstra with a <Term id="heuristic">heuristic</Term> function h(n) that
          estimates the remaining distance to the goal, focusing the search and eliminating wasted
          exploration.
        </p>
        <p>
          With a consistent heuristic (Manhattan distance on this grid), A* is both optimal and
          complete. It never overestimates, so the first path it finds is guaranteed shortest. The
          visited cell count shows the tradeoff: BFS explores the most, A* explores the least,
          Dijkstra falls between.
        </p>
        <p>
          The colored frontier shows where the algorithm is looking next. Visited cells show where
          it has already been. When it reaches the goal, the shortest path lights up. Compare how
          many cells each algorithm visits.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://www.redblobgames.com/pathfinding/a-star/introduction.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Red Blob Games
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/A*_search_algorithm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Wikipedia
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
