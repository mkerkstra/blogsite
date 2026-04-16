import { Graph } from "@/features/lab/components/graph";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "graph",
  "Graph",
  "Tarjan's algorithm — find strongly connected components.",
);

export default function GraphPage() {
  return (
    <>
      <Graph />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          strongly connected components
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          tarjan&apos;s algorithm
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          A <Term id="scc">strongly connected component</Term> is a maximal set of nodes where every
          node can reach every other node through directed edges. Tarjan&apos;s algorithm finds all
          SCCs in a single depth-first traversal. Robert Tarjan published it in 1972.
        </p>
        <p>
          The algorithm maintains a stack of nodes in the current DFS path. Each node tracks a
          discovery time (when DFS first visits it) and a <Term id="low-link">low-link value</Term>{" "}
          (the smallest discovery time reachable from its subtree through back edges). As DFS
          unwinds, low-link values propagate upward.
        </p>
        <p>
          When a node&apos;s low-link equals its own discovery time, it is the root of an SCC.
          Everything above it on the stack, up to and including itself, forms the component. Those
          nodes are popped and grouped together. The algorithm runs in O(V + E) time, making a
          single pass over the graph.
        </p>
        <p>
          Watch the discovery times increment as DFS visits each node, and the low-link values
          update as back edges are found. When a root is identified, the entire component highlights
          at once. Add edges to create cycles and see how the SCC structure changes.
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
      </LabInfoPanel>
    </>
  );
}
