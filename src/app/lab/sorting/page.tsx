import type { Metadata } from "next";

import { Sorting } from "@/features/lab/components/sorting";

export const metadata: Metadata = {
  title: "Sorting",
  description: "Eight sorting algorithms race side-by-side. Pick three, tune the input.",
  alternates: { canonical: "/lab/sorting" },
};

export default function SortingPage() {
  return (
    <>
      <Sorting />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          sorting race
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Pick any three from eight algorithms. Quick, merge, heap, shell are O(n log n).
              Insertion, selection, bubble are O(n&#178;). Radix is O(d*n). Click an algorithm name
              to cycle it.
            </p>
            <p>
              Try reversed input with bubble sort vs quicksort, or nearly-sorted with insertion
              sort. Each bar is one element. The counter tracks comparisons and swaps. Same input,
              different strategies.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
