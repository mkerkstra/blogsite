import type { Metadata } from "next";

import { DpTable } from "@/features/lab/components/dp-table";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

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
      <LabInfoPanel>
        <p>
          <Term id="edit-distance">Edit distance</Term> measures the minimum insertions, deletions,
          and substitutions to transform one string into another. Vladimir Levenshtein defined this
          distance in 1965, and the Wagner-Fischer algorithm fills the table in O(mn) time and
          space, where m and n are the lengths of the two strings.
        </p>
        <p>
          Each cell&apos;s value is the minimum of three options: the cell above plus 1 (deletion),
          the cell to the left plus 1 (insertion), or the diagonal cell plus 0 if the characters
          match (or plus 1 for a substitution). This recurrence guarantees that every cell captures
          the cheapest way to align the prefixes up to that point.
        </p>
        <p>
          The traceback follows the path of minimum-cost decisions backward from the bottom-right
          corner to the top-left, revealing the optimal edit script. Each step in the path
          corresponds to a keep, insert, delete, or substitute operation.
        </p>
        <p>
          Watch the table fill left to right, top to bottom. The highlighted arrows show which
          subproblems feed each cell. When complete, the traceback reveals the optimal sequence of
          operations. The bottom-right cell is the answer.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Levenshtein_distance"
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
