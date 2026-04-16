import type { Metadata } from "next";

import { TokenSampling } from "@/features/lab/components/token-sampling";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Token Sampling",
  description: "Temperature, top-K, top-P. How LLMs choose the next word.",
  alternates: { canonical: "/lab/token-sampling" },
};

export default function TokenSamplingPage() {
  return (
    <>
      <TokenSampling />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          token sampling
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to auto-sample · r to reset
        </p>
      </div>
      <LabInfoPanel>
        <p>
          After the model computes <Term id="logits">logits</Term> for every token in its
          vocabulary, sampling strategies decide which token is actually selected. The raw logits
          are a log-probability distribution. Three knobs shape it.
        </p>
        <p>
          <Term id="temperature">Temperature</Term> scales the logits before{" "}
          <Term id="softmax">softmax</Term>. At temperature 0, the highest-logit token always wins
          (greedy/argmax). At temperature 1, the original distribution is preserved. Above 1, the
          distribution flattens, giving unlikely tokens a real chance. Watch the bars reshape as you
          drag the slider.
        </p>
        <p>
          <Term id="top-k-sampling">Top-K</Term> truncates to the K highest-probability tokens and
          renormalizes. Everything outside the top K is zeroed out. This prevents sampling from the
          extreme tail (hallucination territory) while preserving diversity among likely candidates.
        </p>
        <p>
          <Term id="nucleus-sampling">Top-P (nucleus sampling)</Term> is adaptive. Instead of a
          fixed count, it takes the smallest set of tokens whose cumulative probability exceeds P.
          When the model is confident, this might be 3 tokens. When uncertain, it might be 20. The
          cumulative curve on the chart shows exactly where the threshold falls.
        </p>
        <p>
          These filters stack: temperature first, then top-K, then top-P. The combination determines
          the tradeoff between coherence and creativity. Most API defaults use temperature 1.0 with
          top-P 0.95, leaving top-K disabled.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://arxiv.org/abs/1904.09751"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Holtzman et al. 2019
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
