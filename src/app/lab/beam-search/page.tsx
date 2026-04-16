import type { Metadata } from "next";

import { BeamSearch } from "@/features/lab/components/beam-search";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Beam Search",
  description: "Tree of candidates, pruned by score. Greedy vs beam width comparison.",
  alternates: { canonical: "/lab/beam-search" },
};

export default function BeamSearchPage() {
  return (
    <>
      <BeamSearch />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          beam search
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to pause · r to reset
        </p>
      </div>
      <LabInfoPanel>
        <p>
          <Term id="greedy-decoding">Greedy decoding</Term> picks the highest-probability token at
          each step. It is fast but shortsighted. A locally optimal choice can lead to a globally
          poor sequence. <Term id="beam-search">Beam search</Term> fixes this by maintaining
          multiple candidate sequences (beams) in parallel, keeping the top B at each step.
        </p>
        <p>
          At each generation step, every active beam is extended with all possible next tokens. The
          candidates are scored by <Term id="cumulative-probability">cumulative probability</Term>{" "}
          (the product of all token probabilities along the path). Only the top B scoring sequences
          survive. The rest are pruned.
        </p>
        <p>
          Set beam width to 1 and you get greedy search. A single path, no alternatives considered.
          Increase it to 3 or 5 and watch how the tree explores more branches. Higher beam widths
          find better sequences at the cost of more computation (linear in beam width per step).
        </p>
        <p>
          The <Term id="sequence-score">sequence score</Term> shown at the top is the log-sum of
          probabilities along the best path. Real systems often apply length normalization to avoid
          biasing toward shorter sequences. The visualization shows this tradeoff: wider beams
          explore more, pruning identifies globally better paths that greedy would have missed.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Beam_search"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Wikipedia: Beam search
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
