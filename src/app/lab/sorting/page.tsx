import type { Metadata } from "next";

import { Sorting } from "@/features/lab/components/sorting";

export const metadata: Metadata = {
  title: "Sorting",
  description: "Quicksort vs mergesort vs heapsort — side-by-side race.",
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
              Three sorting algorithms race on identical copies of a random array. Quicksort
              partitions around a pivot. Mergesort divides and conquers. Heapsort builds a max-heap
              and extracts.
            </p>
            <p>
              Each bar is one element. Highlighted bars show the current comparison. The counter
              tracks total comparisons. Same input, different strategies, different performance
              profiles.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
