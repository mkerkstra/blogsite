import { AttentionHeads } from "@/features/lab/components/attention-heads";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "attention-heads",
  "Attention Heads",
  "Multi-head self-attention. Different heads learn different patterns.",
);

export default function AttentionHeadsPage() {
  return (
    <>
      <AttentionHeads />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          attention heads
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          hover tokens · click heads
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          Each transformer layer has multiple <Term id="attention-head">attention heads</Term> that
          independently learn which tokens should attend to which other tokens. A head computes{" "}
          <Term id="query-vector">Query</Term>, <Term id="key-vector">Key</Term>, and Value vectors
          for every token, then uses <Term id="softmax">softmax</Term>(QK&sup1;/&radic;d) to produce{" "}
          <Term id="attention-weights">attention weights</Term>. Different heads specialize in
          different patterns.
        </p>
        <p>
          The positional head tracks adjacency, attending strongly to neighboring tokens. The syntax
          head learns grammatical dependencies, connecting verbs to their subjects across the
          sentence. The copy head fires when it sees repeated tokens. The retrieval head makes
          long-range connections, linking a pronoun to its antecedent dozens of tokens back (
          <Term id="coreference">coreference</Term>).
        </p>
        <p>
          Hover over a token to see where it looks (outgoing attention in lime) and who looks at it
          (incoming attention in cyan). The heatmap shows the full NxN{" "}
          <Term id="self-attention">attention matrix</Term>: row i, column j means &quot;how much
          does token i attend to token j.&quot; Each row sums to 1 after softmax.
        </p>
        <p>
          Real models have dozens of layers with 32-128 heads each. The patterns here are simplified
          but representative. In practice, many heads are redundant or uninterpretable, which is why
          techniques like <Term id="head-pruning">attention head pruning</Term> can remove 30-50% of
          heads with minimal quality loss.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://arxiv.org/abs/1706.03762"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Vaswani et al. 2017
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
