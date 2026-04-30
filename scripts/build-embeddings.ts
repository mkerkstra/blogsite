/**
 * Generate real word embeddings for the /lab/embedding-space visualization.
 *
 * 1. Embed each vocab word in 384D with Xenova/all-MiniLM-L6-v2 via
 *    @huggingface/transformers (ONNX runtime, Node).
 * 2. Project to 2D with UMAP (seeded for determinism).
 * 3. Precompute top-K cosine neighbors per word (in 384D).
 * 4. Resolve each analogy (a − b + c) against the full vocab to find the
 *    actual top matches, so the visualization can show what the model
 *    _really_ thinks, not what we hope it thinks.
 * 5. Emit src/features/lab/data/embedding-data.ts.
 *
 * Run with: pnpm build:embeddings
 *
 * The generator takes ~30s on first run (model download, ~22MB quantized),
 * <5s after the model is cached under ~/.cache/huggingface/.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { pipeline } from "@huggingface/transformers";
import { UMAP } from "umap-js";

/* ── Vocabulary ───────────────────────────────────────────────────────── */

const CLUSTER_LABELS = [
  "animals",
  "actions",
  "emotions",
  "colors",
  "size",
  "food",
  "capitals",
  "countries",
] as const;

interface VocabEntry {
  word: string;
  cluster: number;
}

const VOCAB: VocabEntry[] = [
  ...[
    "cat",
    "dog",
    "fish",
    "bird",
    "horse",
    "mouse",
    "lion",
    "wolf",
    "bear",
    "tiger",
    "eagle",
    "shark",
  ].map((word) => ({ word, cluster: 0 })),
  // Actions include 3 past-tense forms (ran/walked/jumped) for a tense-direction analogy.
  ...[
    "run",
    "walk",
    "jump",
    "swim",
    "fly",
    "climb",
    "sprint",
    "leap",
    "crawl",
    "dash",
    "ran",
    "walked",
    "jumped",
  ].map((word) => ({ word, cluster: 1 })),
  ...["happy", "sad", "angry", "calm", "excited", "fearful", "proud", "shy", "brave", "gentle"].map(
    (word) => ({
      word,
      cluster: 2,
    }),
  ),
  ...["red", "blue", "green", "yellow", "purple", "orange", "black", "white", "pink", "gray"].map(
    (word) => ({
      word,
      cluster: 3,
    }),
  ),
  ...["big", "small", "tiny", "huge", "giant", "large", "vast", "little", "massive"].map(
    (word) => ({
      word,
      cluster: 4,
    }),
  ),
  ...["bread", "rice", "meat", "fruit", "cake", "soup", "pasta", "salad", "cheese"].map((word) => ({
    word,
    cluster: 5,
  })),
  ...["paris", "berlin", "tokyo", "london", "rome", "madrid"].map((word) => ({ word, cluster: 6 })),
  ...["france", "germany", "japan", "england", "italy", "spain"].map((word) => ({
    word,
    cluster: 7,
  })),
];

/** Capital-of direction + past-tense direction — non-gender analogies that mirror the classic Word2Vec demo. */
const ANALOGY_TEMPLATES: { a: string; b: string; c: string; expected: string; label: string }[] = [
  {
    a: "paris",
    b: "france",
    c: "germany",
    expected: "berlin",
    label: "paris − france + germany ≈ berlin",
  },
  { a: "tokyo", b: "japan", c: "italy", expected: "rome", label: "tokyo − japan + italy ≈ rome" },
  { a: "walk", b: "walked", c: "ran", expected: "run", label: "walk − walked + ran ≈ run" },
];

interface DocumentChunkTemplate {
  id: string;
  title: string;
  source: string;
  category: string;
  text: string;
}

const DOCUMENT_CHUNKS: DocumentChunkTemplate[] = [
  {
    id: "lion-speed",
    title: "Lion sprint speed",
    source: "field notes",
    category: "animals",
    text: "A lion can sprint quickly for short bursts when chasing prey across open grassland.",
  },
  {
    id: "tiger-stalk",
    title: "Tiger ambush",
    source: "field notes",
    category: "animals",
    text: "Tigers rely on stealth, dense cover, and sudden acceleration rather than long pursuit.",
  },
  {
    id: "horse-endurance",
    title: "Horse endurance",
    source: "field notes",
    category: "animals",
    text: "Horses are large animals built for distance running and carrying riders over terrain.",
  },
  {
    id: "berlin-capital",
    title: "Berlin",
    source: "atlas",
    category: "cities",
    text: "Berlin is the capital city of Germany and a major center for art and technology.",
  },
  {
    id: "tokyo-rail",
    title: "Tokyo rail",
    source: "atlas",
    category: "cities",
    text: "Tokyo is Japan's capital and is known for dense neighborhoods and an enormous train network.",
  },
  {
    id: "paris-france",
    title: "Paris",
    source: "atlas",
    category: "cities",
    text: "Paris is the capital of France, with landmarks, museums, and historic boulevards.",
  },
  {
    id: "bread-fermentation",
    title: "Bread fermentation",
    source: "cookbook",
    category: "food",
    text: "Bread dough develops flavor as yeast ferments sugars and produces gas before baking.",
  },
  {
    id: "pasta-sauce",
    title: "Pasta sauce",
    source: "cookbook",
    category: "food",
    text: "Pasta is often paired with tomato, cheese, herbs, and olive oil in quick meals.",
  },
  {
    id: "hnsw-index",
    title: "HNSW index",
    source: "engineering",
    category: "ml",
    text: "HNSW builds a layered nearest-neighbor graph so vector databases can search embeddings quickly.",
  },
  {
    id: "rag-context",
    title: "RAG context",
    source: "engineering",
    category: "ml",
    text: "Retrieval augmented generation embeds a user query, fetches relevant chunks, and sends them to a language model.",
  },
  {
    id: "river-bank",
    title: "River bank",
    source: "glossary",
    category: "geography",
    text: "A river bank is the sloped edge of land beside flowing water.",
  },
  {
    id: "savings-bank",
    title: "Savings bank",
    source: "glossary",
    category: "finance",
    text: "A bank can hold deposits, approve loans, and move money between accounts.",
  },
];

const QUERY_EXAMPLES = [
  { id: "fast-animal", label: "fast animal", text: "fast animal chasing prey" },
  { id: "germany-capital", label: "capital of germany", text: "capital city of Germany" },
  { id: "bread", label: "how bread rises", text: "how bread dough rises before baking" },
  {
    id: "vector-db",
    label: "vector database search",
    text: "nearest neighbor search over embeddings",
  },
  { id: "river-bank", label: "river bank", text: "land beside a river" },
  { id: "money-bank", label: "money bank", text: "bank loans deposits and accounts" },
] as const;

const CONTEXT_ANCHORS = [
  "river",
  "water",
  "shore",
  "money",
  "loan",
  "account",
  "capital city",
  "country",
  "past tense",
] as const;

const CONTEXT_EXAMPLE_TEMPLATES = [
  {
    word: "bank",
    note: "Same surface word, different surrounding words, different vector neighborhood.",
    contexts: [
      {
        label: "river bank",
        phrase: "The canoe scraped against the river bank after the storm.",
      },
      {
        label: "money bank",
        phrase: "The bank approved the loan and opened a savings account.",
      },
    ],
  },
  {
    word: "capital",
    note: "Context decides whether capital means a city, money, or something else.",
    contexts: [
      {
        label: "capital city",
        phrase: "Berlin is the capital city of Germany.",
      },
      {
        label: "capital investment",
        phrase: "The company raised capital to fund new equipment.",
      },
    ],
  },
] as const;

/* ── Helpers ──────────────────────────────────────────────────────────── */

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function seededRandom(seed: number): () => number {
  // Mulberry32 — good-enough PRNG for UMAP determinism.
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeProjection(points: number[][]): [number, number][] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    const x = p[0] ?? 0;
    const y = p[1] ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  return points.map((p) => {
    const x = (p[0] ?? 0) - minX;
    const y = (p[1] ?? 0) - minY;
    return [+(0.1 + (x / spanX) * 0.8).toFixed(4), +(0.12 + (y / spanY) * 0.76).toFixed(4)];
  });
}

function topMatches(
  queryVector: number[],
  candidates: number[][],
  count: number,
): { idx: number; score: number }[] {
  const ranked: { idx: number; score: number }[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const v = candidates[i];
    if (!v) continue;
    ranked.push({ idx: i, score: cosineSim(queryVector, v) });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, count).map((m) => ({ idx: m.idx, score: +m.score.toFixed(4) }));
}

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  console.log(`[1/4] Loading Xenova/all-MiniLM-L6-v2 (~22MB on first run)…`);
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "q8",
  });

  console.log(`[2/4] Embedding ${VOCAB.length} words…`);
  const vectors: number[][] = [];
  for (const entry of VOCAB) {
    const output = await embedder(entry.word, { pooling: "mean", normalize: true });
    vectors.push(Array.from(output.data as Float32Array));
  }
  const dim = vectors[0]?.length ?? 0;
  if (dim === 0) throw new Error("empty embedding");
  console.log(`      → ${VOCAB.length} × ${dim}D unit vectors.`);

  console.log(`[3/4] Projecting to 2D via UMAP (seeded, deterministic)…`);
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors: 8,
    minDist: 0.6,
    spread: 2.2,
    random: seededRandom(7),
  });
  const projected = umap.fit(vectors);

  // UMAP preserves _local_ neighborhoods but places the 8 clusters arbitrarily
  // in 2D — MiniLM embeddings tend to produce one tight globule of common-noun
  // clusters plus a couple of outliers, which fills a corner and leaves empty
  // space. For a visualization we want even canvas coverage, so we post-process:
  // recenter each cluster's UMAP cloud onto an 8-slot grid, preserving the
  // within-cluster geometry that actually carries the nearest-neighbor intuition.

  const clusterGroups = new Map<number, number[]>();
  for (let i = 0; i < VOCAB.length; i++) {
    const v = VOCAB[i];
    if (!v) continue;
    const list = clusterGroups.get(v.cluster) ?? [];
    list.push(i);
    clusterGroups.set(v.cluster, list);
  }

  // 4×2 grid placement so 8 clusters fill the canvas. Order chosen so that
  // semantically related clusters (capitals next to countries, size next to
  // actions) sit adjacent in the grid — analogy arrows stay readable.
  const GRID_LAYOUT: Record<number, [number, number]> = {
    0: [0.22, 0.3], // animals  top-left
    2: [0.5, 0.22], // emotions top-center-left
    4: [0.72, 0.3], // size     top-center-right (near actions)
    6: [0.85, 0.25], // capitals top-right (near countries)
    1: [0.28, 0.72], // actions  bottom-left
    3: [0.5, 0.8], // colors   bottom-center-left
    5: [0.7, 0.72], // food     bottom-center-right
    7: [0.85, 0.75], // countries bottom-right (near capitals, same column)
  };

  const coords: [number, number][] = new Array(VOCAB.length);
  for (const [clusterId, idxs] of clusterGroups) {
    let cx = 0;
    let cy = 0;
    for (const i of idxs) {
      const row = projected[i] as [number, number] | undefined;
      if (!row) continue;
      cx += row[0];
      cy += row[1];
    }
    cx /= idxs.length;
    cy /= idxs.length;

    // Tightness scale: how far individual words offset from the cluster center.
    // Keep it small-ish so clusters stay readable as distinct regions.
    let maxOffset = 0;
    for (const i of idxs) {
      const row = projected[i] as [number, number] | undefined;
      if (!row) continue;
      const dx = row[0] - cx;
      const dy = row[1] - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > maxOffset) maxOffset = d;
    }
    const target = GRID_LAYOUT[clusterId] ?? [0.5, 0.5];
    const RADIUS = 0.09; // fraction of canvas a cluster occupies

    for (const i of idxs) {
      const row = projected[i] as [number, number] | undefined;
      if (!row) continue;
      const dx = row[0] - cx;
      const dy = row[1] - cy;
      const scale = maxOffset > 0 ? RADIUS / maxOffset : 0;
      coords[i] = [target[0] + dx * scale, target[1] + dy * scale];
    }
  }

  console.log(`[4/5] Precomputing cosine neighbors + resolving analogies…`);
  const K = 6;
  const neighbors: { idx: number; score: number }[][] = [];
  for (let i = 0; i < vectors.length; i++) {
    const vi = vectors[i];
    if (!vi) {
      neighbors.push([]);
      continue;
    }
    const scored: { idx: number; score: number }[] = [];
    for (let j = 0; j < vectors.length; j++) {
      if (i === j) continue;
      const vj = vectors[j];
      if (!vj) continue;
      scored.push({ idx: j, score: cosineSim(vi, vj) });
    }
    scored.sort((a, b) => b.score - a.score);
    neighbors.push(scored.slice(0, K));
  }

  const wordIndex = new Map<string, number>();
  for (let i = 0; i < VOCAB.length; i++) {
    const entry = VOCAB[i];
    if (entry) wordIndex.set(entry.word, i);
  }

  const analogies = ANALOGY_TEMPLATES.map((tpl) => {
    const ai = wordIndex.get(tpl.a);
    const bi = wordIndex.get(tpl.b);
    const ci = wordIndex.get(tpl.c);
    if (ai === undefined || bi === undefined || ci === undefined) {
      throw new Error(`analogy refs unknown word: ${tpl.a}/${tpl.b}/${tpl.c}`);
    }
    const va = vectors[ai];
    const vb = vectors[bi];
    const vc = vectors[ci];
    if (!va || !vb || !vc) throw new Error("missing vector");

    // v_target = v_a - v_b + v_c
    const target = new Array<number>(dim);
    for (let i = 0; i < dim; i++) {
      target[i] = (va[i] ?? 0) - (vb[i] ?? 0) + (vc[i] ?? 0);
    }

    const ranked: { idx: number; score: number }[] = [];
    for (let i = 0; i < vectors.length; i++) {
      if (i === ai || i === bi || i === ci) continue;
      const v = vectors[i];
      if (!v) continue;
      ranked.push({ idx: i, score: cosineSim(target, v) });
    }
    ranked.sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 3);

    const expectedIdx = wordIndex.get(tpl.expected) ?? -1;
    const hit = top[0]?.idx === expectedIdx;
    const predictedWord = top[0] ? VOCAB[top[0].idx]?.word : undefined;
    console.log(
      `      ${tpl.label}  →  predicted=${predictedWord} (${top[0]?.score.toFixed(3)}) ${
        hit ? "✓" : `(expected ${tpl.expected})`
      }`,
    );

    return {
      a: tpl.a,
      b: tpl.b,
      c: tpl.c,
      expected: tpl.expected,
      label: tpl.label,
      top: top.map((t) => ({ idx: t.idx, score: +t.score.toFixed(4) })),
    };
  });

  console.log(`[5/5] Embedding retrieval chunks + contextual examples…`);
  const chunkVectors: number[][] = [];
  for (const chunk of DOCUMENT_CHUNKS) {
    const output = await embedder(`${chunk.title}. ${chunk.text}`, {
      pooling: "mean",
      normalize: true,
    });
    chunkVectors.push(Array.from(output.data as Float32Array));
  }

  const queryVectors: number[][] = [];
  for (const query of QUERY_EXAMPLES) {
    const output = await embedder(query.text, { pooling: "mean", normalize: true });
    queryVectors.push(Array.from(output.data as Float32Array));
  }

  const searchUmap = new UMAP({
    nComponents: 2,
    nNeighbors: 5,
    minDist: 0.35,
    spread: 1.5,
    random: seededRandom(17),
  });
  const searchProjection = normalizeProjection(searchUmap.fit([...chunkVectors, ...queryVectors]));
  const chunkCoords = searchProjection.slice(0, chunkVectors.length);
  const queryCoords = searchProjection.slice(chunkVectors.length);

  const documentChunks = DOCUMENT_CHUNKS.map((chunk, i) => {
    const xy = chunkCoords[i] ?? [0.5, 0.5];
    return {
      ...chunk,
      baseX: xy[0],
      baseY: xy[1],
    };
  });

  const searchQueries = QUERY_EXAMPLES.map((query, i) => {
    const xy = queryCoords[i] ?? [0.5, 0.5];
    const qv = queryVectors[i];
    if (!qv) throw new Error(`missing query vector ${query.id}`);
    return {
      ...query,
      baseX: xy[0],
      baseY: xy[1],
      matches: topMatches(qv, chunkVectors, DOCUMENT_CHUNKS.length),
    };
  });

  const anchorVectors: number[][] = [];
  for (const anchor of CONTEXT_ANCHORS) {
    const output = await embedder(anchor, { pooling: "mean", normalize: true });
    anchorVectors.push(Array.from(output.data as Float32Array));
  }

  const contextPhrases = CONTEXT_EXAMPLE_TEMPLATES.flatMap((example) =>
    example.contexts.map((context) => context.phrase),
  );
  const contextVectors: number[][] = [];
  for (const phrase of contextPhrases) {
    const output = await embedder(phrase, { pooling: "mean", normalize: true });
    contextVectors.push(Array.from(output.data as Float32Array));
  }

  const contextUmap = new UMAP({
    nComponents: 2,
    nNeighbors: 4,
    minDist: 0.4,
    spread: 1.7,
    random: seededRandom(29),
  });
  const contextProjection = normalizeProjection(
    contextUmap.fit([...anchorVectors, ...contextVectors]),
  );
  const anchorCoords = contextProjection.slice(0, anchorVectors.length);
  const contextCoords = contextProjection.slice(anchorVectors.length);
  const contextAnchors = CONTEXT_ANCHORS.map((label, i) => {
    const xy = anchorCoords[i] ?? [0.5, 0.5];
    return { label, baseX: xy[0], baseY: xy[1] };
  });

  let contextOffset = 0;
  const contextualExamples = CONTEXT_EXAMPLE_TEMPLATES.map((example) => ({
    word: example.word,
    note: example.note,
    anchors: contextAnchors,
    contexts: example.contexts.map((context) => {
      const idx = contextOffset++;
      const xy = contextCoords[idx] ?? [0.5, 0.5];
      const cv = contextVectors[idx];
      if (!cv) throw new Error(`missing contextual vector ${context.label}`);
      return {
        label: context.label,
        phrase: context.phrase,
        baseX: xy[0],
        baseY: xy[1],
        nearestAnchors: topMatches(cv, anchorVectors, 3).map((m) => ({
          label: CONTEXT_ANCHORS[m.idx] ?? "unknown",
          score: m.score,
        })),
      };
    }),
  }));

  /* ── Emit TypeScript ────────────────────────────────────────────────── */

  const words = VOCAB.map((entry, i) => {
    const xy = coords[i] ?? [0, 0];
    return {
      word: entry.word,
      cluster: entry.cluster,
      baseX: +xy[0].toFixed(4),
      baseY: +xy[1].toFixed(4),
      neighbors: (neighbors[i] ?? []).map((n) => ({
        idx: n.idx,
        score: +n.score.toFixed(4),
      })),
    };
  });

  const out = `// AUTO-GENERATED by scripts/build-embeddings.ts. Do not hand-edit.
// Regenerate with: pnpm build:embeddings
//
// Source model: Xenova/all-MiniLM-L6-v2 (quantized ONNX, 384D, unit-normalized).
// Projection: umap-js, seeded, with per-view parameters tuned for readability.
// Neighbors and analogies are computed in the full 384D space, not on UMAP
// coords — so drag-to-move in the UI cannot distort similarity scores.

export const CLUSTER_LABELS = ${JSON.stringify(CLUSTER_LABELS)} as const;

export const EMBEDDING_DIM = ${dim};
export const VOCAB_SIZE = ${VOCAB.length};
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

export interface EmbeddingWord {
  word: string;
  cluster: number;
  baseX: number;
  baseY: number;
  neighbors: { idx: number; score: number }[];
}

export interface EmbeddingAnalogy {
  a: string;
  b: string;
  c: string;
  expected: string;
  label: string;
  top: { idx: number; score: number }[];
}

export interface EmbeddingDocumentChunk {
  id: string;
  title: string;
  source: string;
  category: string;
  text: string;
  baseX: number;
  baseY: number;
}

export interface EmbeddingSearchQuery {
  id: string;
  label: string;
  text: string;
  baseX: number;
  baseY: number;
  matches: { idx: number; score: number }[];
}

export interface EmbeddingContextualExample {
  word: string;
  note: string;
  anchors: { label: string; baseX: number; baseY: number }[];
  contexts: {
    label: string;
    phrase: string;
    baseX: number;
    baseY: number;
    nearestAnchors: { label: string; score: number }[];
  }[];
}

export const WORDS: EmbeddingWord[] = ${JSON.stringify(words, null, 2)};

export const ANALOGIES: EmbeddingAnalogy[] = ${JSON.stringify(analogies, null, 2)};

export const DOCUMENT_CHUNKS: EmbeddingDocumentChunk[] = ${JSON.stringify(documentChunks, null, 2)};

export const SEARCH_QUERIES: EmbeddingSearchQuery[] = ${JSON.stringify(searchQueries, null, 2)};

export const CONTEXTUAL_EXAMPLES: EmbeddingContextualExample[] = ${JSON.stringify(contextualExamples, null, 2)};
`;

  const outputPath = resolve("src/features/lab/data/embedding-data.ts");
  writeFileSync(outputPath, out);
  console.log(`\n✔ Wrote ${outputPath} (${(out.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
