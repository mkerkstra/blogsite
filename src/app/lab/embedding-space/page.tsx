import { EmbeddingSpace } from "@/features/lab/components/embedding-space";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "embedding-space",
  "Embedding Space",
  "Words as vectors. Semantic meaning emerges from learned geometry.",
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
          hover words · drag to move
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          Computers don&apos;t understand words. A <Term id="word-embedding">word embedding</Term>{" "}
          solves this by mapping every word to a dense vector of numbers, typically 256 to 4096
          dimensions. These vectors are <Term id="learned-representation">learned</Term>, not
          hand-crafted. During training, words that appear in similar contexts are pushed to nearby
          points in the vector space.
        </p>
        <p>
          The result is a geometry of meaning. &quot;Cat&quot; and &quot;dog&quot; end up close
          together because they share context: both follow &quot;the,&quot; both precede
          &quot;ran.&quot; &quot;Happy&quot; and &quot;sad&quot; cluster because they fill the same
          grammatical slots. The model discovers these relationships from raw text alone, with no
          dictionary or human labeling.
        </p>
        <p>
          The most striking property is that{" "}
          <Term id="vector-arithmetic">directions encode relationships</Term>. The vector from
          &quot;man&quot; to &quot;woman&quot; is nearly parallel to &quot;king&quot; to
          &quot;queen.&quot; So king &minus; man + woman &approx; queen. This isn&apos;t programmed.
          It emerges because the model learns that gender is a consistent contextual shift across
          many word pairs.
        </p>
        <p>
          <Term id="cosine-similarity">Cosine similarity</Term> measures how aligned two vectors
          are: 1.0 means identical direction (synonyms), 0 means unrelated, &minus;1 means opposite.
          Hover any word to see its nearest neighbors and their similarity scores. Words in the same
          cluster score high. Words across clusters score low.
        </p>
        <p>
          Modern LLMs use this same principle but with{" "}
          <Term id="contextual-embedding">contextual embeddings</Term>. Instead of one vector per
          word, the model computes a different vector for each occurrence based on surrounding
          context. &quot;Bank&quot; near &quot;river&quot; gets a different embedding than
          &quot;bank&quot; near &quot;money.&quot; The static space shown here is the foundation
          that contextual models build on.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://arxiv.org/abs/1301.3781"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Mikolov et al. 2013 (Word2Vec)
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
