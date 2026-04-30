import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { SemanticSearch } from "@/features/lab/components/semantic-search";
import { Term } from "@/features/lab/components/term";
import { DOCUMENT_CHUNKS, SEARCH_QUERIES } from "@/features/lab/data/embedding-data";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "semantic-search",
  "Semantic Search",
  "Query vectors, chunk rankings, thresholds, and filters. The retrieval core of RAG.",
);

export default function SemanticSearchPage() {
  return (
    <>
      <SemanticSearch />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          semantic search
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          query · threshold · filter
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          Semantic search turns a query and a corpus into the same kind of{" "}
          <Term id="word-embedding">embedding</Term> vectors, then ranks chunks by{" "}
          <Term id="cosine-similarity">cosine similarity</Term>. The canvas is using real MiniLM
          vectors generated at build time: {SEARCH_QUERIES.length} query examples searched against{" "}
          {DOCUMENT_CHUNKS.length} document chunks.
        </p>
        <p>
          The ranked list is the practical core of <Term id="rag">RAG</Term>. A user question is
          embedded, the nearest chunks are fetched, and those chunks become context for the language
          model. The model is not searching strings; it is receiving whatever the vector search
          considered nearby enough to include.
        </p>
        <p>
          <Term id="top-k-retrieval">Top-k</Term> controls how many chunks are allowed through.
          Raising it improves recall but adds noise and context cost. The threshold slider makes a
          second decision: even if a chunk is in the top-k set, it is rejected when the cosine score
          is too low.
        </p>
        <p>
          Metadata filters are not a hack; they are how production retrieval keeps vector similarity
          grounded. A query for &quot;bank&quot; can land near finance and geography. Filtering by
          source, tenant, document type, or permission boundary narrows the candidate set before the
          nearest-neighbor ranking matters.
        </p>
        <p>
          For small corpora, exact cosine search is fine. At scale,{" "}
          <Term id="approximate-nearest-neighbor">approximate nearest neighbor</Term> indexes such
          as <Term id="hnsw">HNSW</Term> avoid comparing the query against every vector. That is the
          retrieval tradeoff: much faster search for a small chance of missing the exact best match.
        </p>
        <p className="border-t border-border pt-2 space-y-1">
          <a
            href="https://arxiv.org/abs/2005.11401"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            Lewis et al. 2020 · Retrieval-Augmented Generation
          </a>
          <a
            href="https://github.com/pgvector/pgvector"
            target="_blank"
            rel="noopener noreferrer"
            className="block underline underline-offset-2 hover:text-accent"
          >
            pgvector · vector search in Postgres
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
