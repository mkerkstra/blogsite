import { Pathfinding } from "@/features/lab/components/pathfinding";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "pathfinding",
  "Pathfinding",
  "A* vs Dijkstra vs BFS. Draw walls, watch the search.",
);

export default function PathfindingPage() {
  return (
    <>
      <LabHead slug="pathfinding" />
      <Pathfinding
        info={
          <>
            <p>
              Draw walls on the grid, then watch three search strategies find a path. BFS explores
              uniformly in all directions. Dijkstra follows lowest cost. A* adds a heuristic that
              pulls the search toward the goal.
            </p>
            <p>
              BFS treats all edges equally, expanding one layer at a time across an unweighted
              graph. Dijkstra generalizes to weighted graphs by using a{" "}
              <Term id="priority-queue">priority queue</Term> to always expand the lowest-cost
              frontier node. A* extends Dijkstra with a <Term id="heuristic">heuristic</Term>{" "}
              function h(n) that estimates the remaining distance to the goal, focusing the search
              and eliminating wasted exploration.
            </p>
            <p>
              With a consistent heuristic (Manhattan distance on this grid), A* is both optimal and
              complete. It never overestimates, so the first path it finds is guaranteed shortest.
              The visited cell count shows the tradeoff: BFS explores the most, A* explores the
              least, Dijkstra falls between.
            </p>
            <p>
              The colored frontier shows where the algorithm is looking next. Visited cells show
              where it has already been. When it reaches the goal, the shortest path lights up.
              Compare how many cells each algorithm visits.
            </p>
            <p className="border-t border-border pt-2">
              <a
                href="https://www.redblobgames.com/pathfinding/a-star/introduction.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                Red Blob Games
              </a>
              {" · "}
              <a
                href="https://en.wikipedia.org/wiki/A*_search_algorithm"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                Wikipedia
              </a>
            </p>
          </>
        }
      />
    </>
  );
}
