import { EmbeddingSpace } from "@/features/lab/components/embedding-space";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "embedding-space",
  "Embedding Space",
  "Real word vectors from MiniLM, projected to 2D with UMAP. Cosine, analogies, retrieval.",
);

export default function EmbeddingSpacePage() {
  return (
    <>
      <EmbeddingSpace />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          embedding space
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          hover · drag · query
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          Computers don&apos;t understand words. A <Term id="word-embedding">word embedding</Term>{" "}
          maps each word to a dense vector of floats. The ones on this page are real: 75 words
          embedded in 384 dimensions by{" "}
          <a
            href="https://huggingface.co/Xenova/all-MiniLM-L6-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            all-MiniLM-L6-v2
          </a>{" "}
          at build time, projected to 2D with <Term id="umap">UMAP</Term>. Every cosine score and
          nearest-neighbor list you see is computed in the full 384D space — dragging a word around
          the plane does not change what it is close to.
        </p>
        <p>
          The vectors are <Term id="learned-representation">learned</Term>, not hand-crafted. During
          training, words appearing in similar contexts get pushed toward nearby points. No
          dictionary, no labels. &quot;Cat&quot; and &quot;dog&quot; converge because they share
          grammatical slots; &quot;happy&quot; and &quot;calm&quot; converge for the same reason.
          Hover any word to see its top-5 neighbors with real cosine scores.
        </p>
        <p>
          <Term id="cosine-similarity">Cosine similarity</Term> measures angle between vectors:{" "}
          <span className="font-mono">cos(a, b) = a·b / (‖a‖·‖b‖)</span>. Unit-normalized vectors
          (like these) reduce that to a simple dot product. 1.0 is identical direction, 0 is
          orthogonal, −1 is opposite. Synonyms cluster above 0.7; unrelated words fall below 0.3.
        </p>
        <p>
          The striking property is that{" "}
          <Term id="vector-arithmetic">directions encode relationships</Term>. The vector from{" "}
          <span className="font-mono">france</span> to <span className="font-mono">paris</span> is
          parallel to <span className="font-mono">germany</span> to{" "}
          <span className="font-mono">berlin</span>. So{" "}
          <span className="font-mono">paris − france + germany ≈ berlin</span>, and the page proves
          it by resolving the arithmetic against the full vocabulary and showing the actual top
          match with its cosine score. Not programmed — it emerges because the model learned
          &quot;capital-of&quot; as a consistent contextual shift.
        </p>
        <p>
          In production, embeddings become a database column. Each 384D float32 vector is 1.5 KB; a
          million of them is ~1.5 GB before indexing. <Term id="pgvector">pgvector</Term> stores
          them in Postgres with cosine, L2, and inner product operators. For anything beyond a few
          thousand rows, <Term id="approximate-nearest-neighbor">approximate nearest neighbor</Term>{" "}
          indexes like <Term id="hnsw">HNSW</Term> deliver sub-millisecond retrieval at ~0.98
          recall. A semantic search query is one line:{" "}
          <span className="font-mono">SELECT ... ORDER BY emb &lt;=&gt; $1 LIMIT 10</span>.
        </p>
        <p>
          Modern LLMs extend this with <Term id="contextual-embedding">contextual embeddings</Term>:
          one vector per token <em>occurrence</em>, computed from surrounding context.
          &quot;Bank&quot; near &quot;river&quot; and &quot;bank&quot; near &quot;money&quot; get
          different vectors. The static word-level space shown here is the substrate that contextual
          models are trained on top of.
        </p>
        <p className="border-t border-border pt-2 space-y-1">
          <a
            href="https://arxiv.org/abs/1301.3781"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            Mikolov et al. 2013 — Word2Vec
          </a>
          <a
            href="https://arxiv.org/abs/1908.10084"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            Reimers &amp; Gurevych 2019 — Sentence-BERT (MiniLM lineage)
          </a>
          <a
            href="https://arxiv.org/abs/1802.03426"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            McInnes et al. 2018 — UMAP
          </a>
          <a
            href="https://github.com/pgvector/pgvector"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            pgvector — Postgres extension
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
