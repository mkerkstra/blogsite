import type { Metadata } from "next";
import { Graph } from "@/features/lab/components/graph";

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
          tarjan's algorithm
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              A strongly connected component is a maximal set of nodes where every node can reach
              every other node through directed edges. Tarjan's algorithm finds all SCCs in a single
              depth-first traversal.
            </p>
            <p>
              Each node tracks a discovery time and a low-link value. The low-link propagates
              backward through the DFS, and when a node's low-link equals its discovery time,
              everything above it on the stack forms an SCC. One pass, linear time.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
