import type { Metadata } from "next";

import { MoeRouting } from "@/features/lab/components/moe-routing";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Mixture of Experts",
  description: "Sparse routing. Each token activates a fraction of the network.",
  alternates: { canonical: "/lab/moe-routing" },
};

export default function MoeRoutingPage() {
  return (
    <>
      <MoeRouting />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          mixture of experts
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to pause &middot; r to reset
        </p>
      </div>
      <LabInfoPanel>
        <p>
          A dense transformer sends every token through every parameter. Mixture of Experts replaces
          the monolithic <Term id="feed-forward">feed-forward layer</Term> with N smaller expert
          sub-networks and a learned <Term id="gating-network">router</Term> that assigns each token
          to the top-K experts. A 235B-parameter model might only activate 22B parameters per token.
        </p>
        <p>
          The router computes a <Term id="softmax">softmax</Term> over expert scores for each token,
          then selects the top-K. Only those K experts run their{" "}
          <Term id="forward-pass">forward pass</Term>. The outputs are combined with the
          router&apos;s gating weights. This is why MoE models can be much larger in total
          parameters while matching the inference cost of a smaller dense model.
        </p>
        <p>
          Watch the expert utilization heatmap at the bottom. Without load balancing, a few popular
          experts would handle most tokens while others sit idle, wasting capacity. An{" "}
          <Term id="auxiliary-loss">auxiliary loss</Term> term penalizes uneven routing, pushing the
          distribution toward uniform. Switch input types to see how different experts specialize:
          code tokens route differently than prose or math.
        </p>
        <p>
          This architecture powers DeepSeek-V3, Qwen3-235B, and Kimi K2. The key insight is that not
          all tokens need the same computation. Simple tokens (articles, punctuation) can use
          lightweight experts while complex tokens (technical terms, ambiguous syntax) route to
          heavier specialists. This is <Term id="sparse-activation">sparse activation</Term> in
          practice.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Mixture_of_experts"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Wikipedia
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
