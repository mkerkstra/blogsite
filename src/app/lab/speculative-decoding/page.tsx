import type { Metadata } from "next";

import { SpeculativeDecoding } from "@/features/lab/components/speculative-decoding";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Speculative Decoding",
  description: "Draft fast, verify once. How speculative decoding accelerates LLM inference.",
  alternates: { canonical: "/lab/speculative-decoding" },
};

export default function SpeculativeDecodingPage() {
  return (
    <>
      <SpeculativeDecoding />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          speculative decoding
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to pause · r to reset
        </p>
      </div>
      <LabInfoPanel>
        <p>
          <Term id="autoregressive">Autoregressive generation</Term> is sequential: each token waits
          for the previous one. Speculative decoding breaks this bottleneck. A small, fast{" "}
          <Term id="draft-model">draft model</Term> proposes K tokens in rapid succession, then the
          large target model verifies all K in a single parallel{" "}
          <Term id="forward-pass">forward pass</Term>. Accepted tokens are mathematically guaranteed
          to match what the target model would have generated on its own.
        </p>
        <p>
          The verification uses modified <Term id="rejection-sampling">rejection sampling</Term>.
          For each draft token, compare the draft model&apos;s probability to the target
          model&apos;s. If the target agrees (or assigns higher probability), accept. If not, reject
          with probability proportional to the divergence, and resample from an adjusted
          distribution. This ensures the final output distribution is identical to pure target-model
          sampling.
        </p>
        <p>
          The speedup depends on how well the draft model approximates the target. High acceptance
          rate means most speculated tokens survive, yielding up to Kx throughput improvement. The
          &quot;draft quality&quot; slider controls this. Watch how acceptance rate drops when the
          draft is weaker, causing more cascade rejections.
        </p>
        <p>
          This is the dominant inference optimization in 2025. Google&apos;s Gemini, Meta&apos;s
          LLaMA, and Anthropic&apos;s Claude all use variants. EAGLE-3 extends it with
          tree-structured speculation, exploring multiple continuation paths simultaneously rather
          than a single linear chain.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://arxiv.org/abs/2302.01318"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Leviathan et al. 2023
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
