import type { Metadata } from "next";

import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
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
      <LabInfoPanel>
        <p>
          Pick any three from eight algorithms. Quick, merge, heap, shell are O(n log n). Insertion,
          selection, bubble are O(n&#178;). Radix is O(d*n). Click an algorithm name to cycle it.
        </p>
        <p>
          The O(n log n) algorithms achieve this bound by different strategies: quicksort partitions
          around a pivot, mergesort divides and conquers with a stable merge step, heapsort
          maintains a binary heap invariant, and shellsort uses diminishing gap sequences to move
          elements long distances early. The O(n&#178;) algorithms are simpler but degrade with
          scale, doing redundant work on every pass.
        </p>
        <p>
          Radix sort avoids comparisons entirely by distributing elements into buckets
          digit-by-digit, making it linear in the number of digits times the input size. It only
          works on integers or fixed-length keys, but when applicable it outperforms
          comparison-based sorts.
        </p>
        <p>
          Try reversed input with bubble sort vs quicksort, or nearly-sorted with insertion sort.
          Nearly-sorted input is a best case for insertion sort (nearly linear) but a worst case for
          naive quicksort (quadratic without median-of-three pivot selection). Each bar is one
          element. The counter tracks comparisons and swaps. Same input, different strategies.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Sorting_algorithm"
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
