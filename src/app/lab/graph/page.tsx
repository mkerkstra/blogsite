import { Graph } from "@/features/lab/components/graph";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "graph",
  "Graph",
  "Tarjan's algorithm. Find strongly connected components.",
);

export default function GraphPage() {
  return (
    <>
      <LabHead slug="graph" />
      <Graph
        info={
          <>
            <p>
              A <Term id="scc">strongly connected component</Term>&nbsp;is a maximal set of nodes
              where every node can reach every other node through directed edges. Tarjan&apos;s
              algorithm finds all SCCs in a single depth-first traversal. Robert Tarjan published it
              in 1972.
            </p>
            <p>
              The algorithm maintains a stack of nodes in the current DFS path. Each node tracks a
              discovery time (when DFS first visits it) and a{" "}
              <Term id="low-link">low-link value</Term> (the smallest discovery time reachable from
              its subtree through back edges). As DFS unwinds, low-link values propagate upward.
            </p>
            <p>
              When a node&apos;s low-link equals its own discovery time, it is the root of an SCC.
              Everything above it on the stack, up to and including itself, forms the component.
              Those nodes are popped and grouped together. The algorithm runs in O(V + E) time,
              making a single pass over the graph.
            </p>
            <p>
              Watch the discovery times increment as DFS visits each node, and the low-link values
              update as back edges are found. When a root is identified, the entire component
              highlights at once. Add edges to create cycles and see how the SCC structure changes.
            </p>
            <p className="border-t border-border pt-2">
              <a
                href="https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm"
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
