import type { Metadata } from "next";

import { Graph } from "@/features/lab/components/graph";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";

export const metadata: Metadata = {
  title: "Graph",
  description: "Tarjan's algorithm — find strongly connected components.",
  alternates: { canonical: "/lab/graph" },
};

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
      <LabInfoPanel>
        <p>
          A strongly connected component is a maximal set of nodes where every node can reach every
          other node through directed edges. Tarjan&apos;s algorithm finds all SCCs in a single
          depth-first traversal.
        </p>
        <p>
          Each node tracks a discovery time and a low-link value. The low-link propagates backward
          through the DFS, and when a node&apos;s low-link equals its discovery time, everything
          above it on the stack forms an SCC. One pass, linear time.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm"
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
