import type { Metadata } from "next";

import { DpTable } from "@/features/lab/components/dp-table";

export const metadata: Metadata = {
  title: "DP Table",
  description: "Edit distance — watch dynamic programming fill a table.",
  alternates: { canonical: "/lab/dp-table" },
};

export default function DpTablePage() {
  return (
    <>
      <DpTable />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          dynamic programming
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          edit distance
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Edit distance measures the minimum insertions, deletions, and substitutions to
              transform one string into another. Each cell depends on three neighbors: left
              (insert), above (delete), and diagonal (match or substitute).
            </p>
            <p>
              Watch the table fill left to right, top to bottom. The highlighted arrows show which
              subproblems feed each cell. When complete, the traceback reveals the optimal sequence
              of operations. The bottom-right cell is the answer.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
