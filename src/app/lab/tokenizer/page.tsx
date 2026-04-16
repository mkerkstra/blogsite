import type { Metadata } from "next";

import { Tokenizer } from "@/features/lab/components/tokenizer";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Tokenizer (BPE)",
  description: "Byte-pair encoding. How text becomes tokens before the model ever sees it.",
  alternates: { canonical: "/lab/tokenizer" },
};

export default function TokenizerPage() {
  return (
    <>
      <Tokenizer />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          tokenizer (bpe)
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to pause · r to reset
        </p>
      </div>
      <LabInfoPanel>
        <p>
          Before a language model sees any text, a <Term id="bpe-tokenizer">tokenizer</Term> breaks
          it into tokens. The dominant method is{" "}
          <Term id="byte-pair-encoding">byte-pair encoding</Term> (BPE), which starts with
          individual characters and iteratively merges the most frequent adjacent pair into a new
          token. Each merge reduces the sequence length while building up a vocabulary of common
          subwords.
        </p>
        <p>
          The algorithm is greedy: at each step, scan the entire sequence, count every adjacent
          pair, and merge the most frequent one. &quot;t&quot; + &quot;h&quot; becomes
          &quot;th&quot;. &quot;th&quot; + &quot;e&quot; becomes &quot;the&quot;. Common words
          become single tokens. Rare words stay as character fragments the model can still process.
        </p>
        <p>
          This is why <Term id="subword-tokenization">subword tokenization</Term> works so well. It
          avoids the fixed-vocabulary problem of whole-word tokenizers (which can&apos;t handle
          unseen words) while being far more compact than character-level encoding. GPT-4 uses ~100k
          BPE tokens. Claude uses a similar-sized vocabulary. The{" "}
          <Term id="compression-ratio">compression ratio</Term> (characters per token) is typically
          3-4x for English.
        </p>
        <p>
          Watch the merge log on the right. Each rule shows which pair was merged, in the order the
          algorithm discovered it. This ordered list of merge rules <em>is</em> the tokenizer. At
          inference time, the same rules are applied in the same order to any new text. The
          vocabulary and merge table are fixed after training.
        </p>
        <p>
          The space character is typically represented as &quot;▁&quot; (lower one-eighth block) to
          make word boundaries explicit. This is the SentencePiece convention used by most modern
          tokenizers.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://arxiv.org/abs/1508.07909"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Sennrich et al. 2016
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
