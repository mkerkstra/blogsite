import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { VectorStructure } from "@/features/lab/components/vector-structure";
import { ANALOGIES, CONTEXTUAL_EXAMPLES } from "@/features/lab/data/embedding-data";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "vector-structure",
  "Vector Structure",
  "Relationship directions and contextual embeddings inside a learned vector space.",
);

export default function VectorStructurePage() {
  return (
    <>
      <VectorStructure />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          vector structure
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          directions · context
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          <Term id="word-embedding">Embeddings</Term> are not just points. They also contain
          directions. If several word pairs share the same relationship, the displacement between
          their vectors often points the same way. This is the classic{" "}
          <Term id="vector-arithmetic">vector arithmetic</Term> result.
        </p>
        <p>
          The direction view uses {ANALOGIES.length} generated analogies. Each one is resolved in
          the full 384D MiniLM space, then drawn in the 2D projection. For example, the page
          computes
          <span className="font-mono"> paris - france + germany</span>, ranks every candidate word,
          and shows the real top match and cosine score.
        </p>
        <p>
          This works because training creates a{" "}
          <Term id="learned-representation">learned representation</Term>. The model does not store
          a symbolic &quot;capital-of&quot; rule, but examples involving capitals and countries
          produce similar geometric offsets.
        </p>
        <p>
          The context view shows the limit of static word-level maps. A{" "}
          <Term id="contextual-embedding">contextual embedding</Term> represents a word occurrence,
          not just a spelling. The same word can move toward different anchors depending on nearby
          words. This page includes {CONTEXTUAL_EXAMPLES.length} ambiguous surface words generated
          as full phrases at build time.
        </p>
        <p>
          In transformer models, those contextual vectors are produced by{" "}
          <Term id="self-attention">self-attention</Term> and feed-forward layers. Earlier tokens,
          nearby nouns, syntax, and long-range references all shape the final representation used by
          later prediction or retrieval steps.
        </p>
        <p className="border-t border-border pt-2 space-y-1">
          <a
            href="https://arxiv.org/abs/1301.3781"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            Mikolov et al. 2013 · Linguistic regularities in vector space
          </a>
          <a
            href="https://arxiv.org/abs/1706.03762"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            Vaswani et al. 2017 · Attention Is All You Need
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
