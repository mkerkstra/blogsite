import type { Metadata } from "next";

import { LearnedIndex } from "@/features/lab/components/learned-index";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Learned Index",
  description: "ALEX. Piecewise linear models replace B-tree pages. The CDF is the index.",
  alternates: { canonical: "/lab/learned-index" },
};

export default function LearnedIndexPage() {
  return (
    <>
      <LearnedIndex />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          learned index
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          insert keys, watch the CDF
        </p>
      </div>
      <LabInfoPanel>
        <p>
          ALEX is a learned index that replaces B-tree pages with linear regression models. Each
          internal node predicts which child contains the target key. Each leaf holds a{" "}
          <Term id="gapped-array">gapped array</Term>, a sorted array with empty slots reserved for
          future inserts. The model at each leaf predicts where within the array a key should go.
        </p>
        <p>
          The key insight: sorted data forms a{" "}
          <Term id="cdf">cumulative distribution function</Term> (CDF), and a CDF can be
          approximated by piecewise linear functions. Instead of navigating a tree of pivot keys (as
          in a B-tree), you evaluate a linear function at each level. Prediction errors are bounded,
          so a short local scan corrects any model inaccuracy.
        </p>
        <p>
          ALEX adapts to the data distribution. Dense key regions get more model segments (finer
          approximation), sparse regions get fewer. When a gapped array fills up, the leaf splits
          and both children train new models. This is analogous to a B-tree page split but driven by
          model error rather than fixed capacity.
        </p>
        <p>
          Ding et al. introduced ALEX at SIGMOD 2020. Unlike the original Learned Index (Kraska et
          al., 2018), ALEX is fully updatable with O(log n) inserts and lookups. The FITing-Tree
          (Galakatos et al., SIGMOD 2019) is a related structure that uses an error-bounded
          approach. RadixSpline (Kipf et al., SIGMOD 2020) takes a simpler hybrid approach with a
          radix table on top of a spline approximation.
        </p>
        <p>
          Try different distributions. Uniform data produces evenly-spaced model segments. Skewed
          data forces the tree to allocate more segments where keys cluster, fewer where they are
          sparse.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://doi.org/10.1145/3318464.3389711"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Ding et al. (SIGMOD 2020)
          </a>
          {" / "}
          <a
            href="https://doi.org/10.1145/3183713.3196898"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Kraska et al. &quot;The Case for Learned Index Structures&quot; (2018)
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
