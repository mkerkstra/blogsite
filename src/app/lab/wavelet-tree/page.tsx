import type { Metadata } from "next";

import { WaveletTree } from "@/features/lab/components/wavelet-tree";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Wavelet Tree",
  description: "Recursive alphabet splitting with bitvector rank queries.",
  alternates: { canonical: "/lab/wavelet-tree" },
};

export default function WaveletTreePage() {
  return (
    <>
      <WaveletTree />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          wavelet tree
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          pick a char, query rank
        </p>
      </div>
      <LabInfoPanel>
        <p>
          A wavelet tree represents a string over an alphabet of size sigma, supporting{" "}
          <Term id="rank-query">rank</Term>,<Term id="select-query">select</Term>, and access
          queries in O(log sigma) time. Each internal node stores a{" "}
          <Term id="bitvector">bitvector</Term> that records which half of the alphabet each
          character belongs to. The left child gets the subsequence of left-half characters, the
          right child gets the rest.
        </p>
        <p>
          To answer rank(c, i) &mdash; how many times does c appear up to position i &mdash; walk
          from root to leaf. At each node, count how many bits match c&apos;s side of the alphabet
          split up to the current position. That count becomes the new position in the child. When
          you reach the leaf for c, the position is the answer.
        </p>
        <p>
          Grossi, Gupta, and Vitter introduced wavelet trees at SODA 2003 as the backbone for
          compressed full-text indexes. The wavelet matrix variant (Claude and Navarro, 2015)
          rearranges the layout for better cache performance. Modern implementations in the SDSL
          library power compressed suffix arrays and FM-indexes used in bioinformatics tools like
          bowtie2 for genome alignment.
        </p>
        <p>
          The structure uses n log(sigma) bits total, matching the{" "}
          <Term id="zero-order-entropy">zero-order entropy</Term> of the string. Every query touches
          exactly one bitvector per level, so the depth of the tree directly determines the query
          cost. Pick a character and position, then watch the rank query propagate down.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://doi.org/10.1137/1.9781611974331.ch5"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Grossi, Gupta &amp; Vitter (SODA 2003)
          </a>
          {" / "}
          <a
            href="https://en.wikipedia.org/wiki/Wavelet_tree"
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
