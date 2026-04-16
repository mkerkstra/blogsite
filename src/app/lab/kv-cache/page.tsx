import { KvCache } from "@/features/lab/components/kv-cache";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "kv-cache",
  "KV Cache",
  "How key-value caching makes autoregressive generation fast.",
);

export default function KvCachePage() {
  return (
    <>
      <KvCache />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          kv cache
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to pause · r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          During <Term id="autoregressive">autoregressive generation</Term>, each new token attends
          to every previous token. Without caching, this means recomputing every{" "}
          <Term id="key-vector">key</Term> and value vector from scratch at every step, turning
          generation into an O(n&sup2;) operation. The <Term id="kv-cache">KV cache</Term> stores
          these vectors so each token computes once and stays in memory.
        </p>
        <p>
          Toggle between cached and uncached modes to see the difference. In cached mode, only the
          new row (the current token) lights up. In uncached mode, watch the entire matrix recompute
          top-to-bottom every step. The memory bar on the right grows linearly either way, but the
          computation cost diverges dramatically.
        </p>
        <p>
          <Term id="prompt-caching">Prompt caching</Term> (used by Anthropic and others) extends
          this idea across requests. If two API calls share the same system prompt prefix, the KV
          pairs for that prefix are stored and reused. This can reduce first-token latency by 85%
          and cost by 90% on cache hits. The cache has a <Term id="ttl">TTL</Term> (typically 5
          minutes). Keeping the cache warm means structuring prompts so the prefix stays identical
          across calls.
        </p>
        <p>
          The attention arrows show the core operation: the new token&apos;s{" "}
          <Term id="query-vector">query vector</Term> dot-products against every cached key to
          produce <Term id="attention-weights">attention weights</Term>. With KV caching, the keys
          are already there. Without it, you&apos;re rebuilding the entire phone book just to look
          up one number.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)"
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
