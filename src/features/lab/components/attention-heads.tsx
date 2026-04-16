"use client";

import { useCallback, useEffect, useRef } from "react";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface Sentence {
  tokens: string[];
  heads: number[][][]; // 8 heads, each NxN
}

interface HeadMeta {
  label: string;
  role: string;
}

/* ────────────────────────────────────────────
   Head metadata
   ──────────────────────────────────────────── */

const HEAD_META: HeadMeta[] = [
  { label: "H0", role: "position" },
  { label: "H1", role: "syntax" },
  { label: "H2", role: "copy" },
  { label: "H3", role: "retrieval" },
  { label: "H4", role: "prev" },
  { label: "H5", role: "first" },
  { label: "H6", role: "rare" },
  { label: "H7", role: "spread" },
];

/* ────────────────────────────────────────────
   All-heads color palette (one per head)
   ──────────────────────────────────────────── */

const ALL_HEADS_COLORS = [
  [212, 255, 0], // lime
  [255, 100, 100], // red
  [100, 200, 255], // sky
  [255, 180, 50], // amber
  [180, 100, 255], // violet
  [100, 255, 180], // mint
  [255, 140, 200], // pink
  [200, 200, 200], // grey
];

/* ────────────────────────────────────────────
   Softmax utility
   ──────────────────────────────────────────── */

function softmax(row: number[]): number[] {
  const max = Math.max(...row);
  const exps = row.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function softmaxMatrix(raw: number[][]): number[][] {
  return raw.map(softmax);
}

/* ────────────────────────────────────────────
   Pre-computed attention patterns
   ──────────────────────────────────────────── */

function buildSentence(tokens: string[], rawHeads: number[][][]): Sentence {
  return {
    tokens,
    heads: rawHeads.map(softmaxMatrix),
  };
}

/** Create an NxN matrix filled via a callback, typed as number[][]. */
function matrix(n: number, fill: (i: number, j: number) => number): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) row.push(fill(i, j));
    m.push(row);
  }
  return m;
}

// Sentence 1: "The cat sat on the mat because it was tired"
const S1_TOKENS = ["The", "cat", "sat", "on", "the", "mat", "because", "it", "was", "tired"];

function makeS1(): Sentence {
  const N = 10;
  const heads: number[][][] = [];

  // Head 0: positional (diagonal + neighbors)
  {
    const m = matrix(N, (i, j) => {
      if (i === j) return 2.5;
      if (Math.abs(i - j) === 1) return 2.0;
      if (Math.abs(i - j) === 2) return 0.5;
      return 0.05;
    });
    heads.push(m);
  }

  // Head 1: syntax (verb->subject, coreference)
  {
    const m = matrix(N, (i, j) => (i === j ? 0.3 : 0.05));
    // sat -> cat (verb -> subject)
    m[2][1] = 3.0;
    // was -> it (aux -> subject)
    m[8][7] = 2.8;
    // it -> cat (coreference)
    m[7][1] = 3.2;
    // tired -> was
    m[9][8] = 2.0;
    // on -> sat
    m[3][2] = 1.5;
    // because -> sat
    m[6][2] = 1.8;
    heads.push(m);
  }

  // Head 2: copy/duplicate (the -> the, mat -> cat rhyme)
  {
    const m = matrix(N, (i, j) => (i === j ? 0.5 : 0.05));
    // The -> the (both "the" tokens attend to each other)
    m[0][4] = 3.5;
    m[4][0] = 3.5;
    // mat -> cat
    m[5][1] = 2.5;
    // cat -> mat
    m[1][5] = 2.0;
    heads.push(m);
  }

  // Head 3: retrieval (long-range semantic)
  {
    const m = matrix(N, (i, j) => (i === j ? 0.3 : 0.05));
    // tired -> cat (long-range semantic)
    m[9][1] = 3.5;
    // it -> cat
    m[7][1] = 3.0;
    // because -> tired
    m[6][9] = 2.5;
    // mat -> on
    m[5][3] = 1.8;
    // tired -> because
    m[9][6] = 2.0;
    heads.push(m);
  }

  // Head 4: previous token
  {
    const m = matrix(N, (i, j) => {
      if (j === i - 1) return 3.5;
      if (i === j) return 0.8;
      return 0.02;
    });
    // first token has nowhere to go, attends to self
    m[0][0] = 3.0;
    heads.push(m);
  }

  // Head 5: first token (BOS)
  {
    const m = matrix(N, (i, j) => {
      if (j === 0) return 3.0;
      if (i === j) return 0.5;
      return 0.02;
    });
    heads.push(m);
  }

  // Head 6: rare word (all attend more to less frequent words)
  {
    // "tired", "mat", "because" are less common
    const rarity = [0.1, 0.4, 0.3, 0.2, 0.1, 0.7, 0.6, 0.2, 0.2, 0.9];
    const m = matrix(N, (i, j) => {
      const base = i === j ? 0.3 : 0.05;
      return base + rarity[j] * 2.5;
    });
    heads.push(m);
  }

  // Head 7: aggregate (roughly uniform + slight self-attention)
  {
    const m = matrix(N, (i, j) => {
      if (i === j) return 1.2;
      return 0.9 + Math.sin(i * 0.7 + j * 0.3) * 0.1;
    });
    heads.push(m);
  }

  return buildSentence(S1_TOKENS, heads);
}

// Sentence 2: "She told him that the key was under the flower pot"
const S2_TOKENS = [
  "She",
  "told",
  "him",
  "that",
  "the",
  "key",
  "was",
  "under",
  "the",
  "flower",
  "pot",
];

function makeS2(): Sentence {
  const N = 11;
  const heads: number[][][] = [];

  // Head 0: positional
  {
    const m = matrix(N, (i, j) => {
      if (i === j) return 2.5;
      if (Math.abs(i - j) === 1) return 2.0;
      if (Math.abs(i - j) === 2) return 0.5;
      return 0.05;
    });
    heads.push(m);
  }

  // Head 1: syntax
  {
    const m = matrix(N, (i, j) => (i === j ? 0.3 : 0.05));
    m[1][0] = 3.2; // told -> She
    m[1][2] = 2.5; // told -> him
    m[6][5] = 3.0; // was -> key
    m[7][6] = 2.0; // under -> was
    m[3][1] = 2.5; // that -> told
    m[10][9] = 2.0; // pot -> flower
    heads.push(m);
  }

  // Head 2: copy (the -> the)
  {
    const m = matrix(N, (i, j) => (i === j ? 0.5 : 0.05));
    m[4][8] = 3.5;
    m[8][4] = 3.5;
    heads.push(m);
  }

  // Head 3: retrieval
  {
    const m = matrix(N, (i, j) => (i === j ? 0.3 : 0.05));
    m[7][5] = 3.0; // under -> key
    m[10][5] = 2.8; // pot -> key
    m[5][1] = 2.5; // key -> told
    m[2][0] = 2.5; // him -> She
    heads.push(m);
  }

  // Head 4: previous
  {
    const m = matrix(N, (i, j) => {
      if (j === i - 1) return 3.5;
      if (i === j) return 0.8;
      return 0.02;
    });
    m[0][0] = 3.0;
    heads.push(m);
  }

  // Head 5: first
  {
    const m = matrix(N, (i, j) => {
      if (j === 0) return 3.0;
      if (i === j) return 0.5;
      return 0.02;
    });
    heads.push(m);
  }

  // Head 6: rare word
  {
    const rarity = [0.2, 0.4, 0.2, 0.1, 0.1, 0.7, 0.2, 0.5, 0.1, 0.8, 0.6];
    const m = matrix(N, (i, j) => {
      const base = i === j ? 0.3 : 0.05;
      return base + rarity[j] * 2.5;
    });
    heads.push(m);
  }

  // Head 7: aggregate
  {
    const m = matrix(N, (i, j) => {
      if (i === j) return 1.2;
      return 0.9 + Math.sin(i * 0.5 + j * 0.4) * 0.1;
    });
    heads.push(m);
  }

  return buildSentence(S2_TOKENS, heads);
}

// Sentence 3: "The bank by the river had no money in it"
const S3_TOKENS = ["The", "bank", "by", "the", "river", "had", "no", "money", "in", "it"];

function makeS3(): Sentence {
  const N = 10;
  const heads: number[][][] = [];

  // Head 0: positional
  {
    const m = matrix(N, (i, j) => {
      if (i === j) return 2.5;
      if (Math.abs(i - j) === 1) return 2.0;
      if (Math.abs(i - j) === 2) return 0.5;
      return 0.05;
    });
    heads.push(m);
  }

  // Head 1: syntax
  {
    const m = matrix(N, (i, j) => (i === j ? 0.3 : 0.05));
    m[5][1] = 3.2; // had -> bank
    m[2][1] = 2.5; // by -> bank
    m[4][2] = 2.0; // river -> by
    m[7][5] = 2.5; // money -> had
    m[9][1] = 2.8; // it -> bank
    m[6][7] = 2.0; // no -> money
    heads.push(m);
  }

  // Head 2: copy (The -> the)
  {
    const m = matrix(N, (i, j) => (i === j ? 0.5 : 0.05));
    m[0][3] = 3.5;
    m[3][0] = 3.5;
    // bank -> money (semantic similarity in financial sense)
    m[1][7] = 2.5;
    m[7][1] = 2.0;
    heads.push(m);
  }

  // Head 3: retrieval
  {
    const m = matrix(N, (i, j) => (i === j ? 0.3 : 0.05));
    m[9][1] = 3.5; // it -> bank
    m[7][1] = 3.0; // money -> bank
    m[4][1] = 2.5; // river -> bank (disambiguation)
    m[8][5] = 2.0; // in -> had
    heads.push(m);
  }

  // Head 4: previous
  {
    const m = matrix(N, (i, j) => {
      if (j === i - 1) return 3.5;
      if (i === j) return 0.8;
      return 0.02;
    });
    m[0][0] = 3.0;
    heads.push(m);
  }

  // Head 5: first
  {
    const m = matrix(N, (i, j) => {
      if (j === 0) return 3.0;
      if (i === j) return 0.5;
      return 0.02;
    });
    heads.push(m);
  }

  // Head 6: rare word
  {
    const rarity = [0.1, 0.6, 0.2, 0.1, 0.7, 0.3, 0.3, 0.6, 0.2, 0.2];
    const m = matrix(N, (i, j) => {
      const base = i === j ? 0.3 : 0.05;
      return base + rarity[j] * 2.5;
    });
    heads.push(m);
  }

  // Head 7: aggregate
  {
    const m = matrix(N, (i, j) => {
      if (i === j) return 1.2;
      return 0.9 + Math.sin(i * 0.6 + j * 0.5) * 0.1;
    });
    heads.push(m);
  }

  return buildSentence(S3_TOKENS, heads);
}

const SENTENCES: Sentence[] = [makeS1(), makeS2(), makeS3()];

const _SENTENCE_LABELS = [
  "The cat sat on the mat because it was tired",
  "She told him that the key was under the flower pot",
  "The bank by the river had no money in it",
];

/* ────────────────────────────────────────────
   Theme palettes
   ──────────────────────────────────────────── */

interface Palette {
  bg: string;
  arcOut: (w: number) => string;
  arcIn: (w: number) => string;
  arcAllHead: (head: number, w: number) => string;
  tokenRect: string;
  tokenText: string;
  tokenHover: string;
  headActive: string;
  headInactive: string;
  headText: string;
  headActiveText: string;
  heatCell: (w: number) => string;
  text: string;
  textMuted: string;
  btnBg: string;
  btnBorder: string;
  btnHover: string;
  glowColor: string;
  glowInColor: string;
}

const DARK: Palette = {
  bg: "#0a0a0a",
  arcOut: (w) => `rgba(212,255,0,${(w * 0.8).toFixed(3)})`,
  arcIn: (w) => `rgba(0,212,255,${(w * 0.6).toFixed(3)})`,
  arcAllHead: (h, w) => {
    const c = ALL_HEADS_COLORS[h];
    return `rgba(${c[0]},${c[1]},${c[2]},${(w * 0.35).toFixed(3)})`;
  },
  tokenRect: "rgba(224,226,220,0.06)",
  tokenText: "rgba(224,226,220,0.7)",
  tokenHover: "rgba(212,255,0,0.15)",
  headActive: "rgba(212,255,0,0.3)",
  headInactive: "rgba(224,226,220,0.06)",
  headText: "rgba(224,226,220,0.4)",
  headActiveText: "rgba(224,226,220,0.85)",
  heatCell: (w) => `rgba(212,255,0,${(w * 0.7).toFixed(3)})`,
  text: "rgba(224,226,220,0.5)",
  textMuted: "rgba(224,226,220,0.25)",
  btnBg: "rgba(224,226,220,0.04)",
  btnBorder: "rgba(224,226,220,0.08)",
  btnHover: "rgba(224,226,220,0.08)",
  glowColor: "rgba(212,255,0,0.4)",
  glowInColor: "rgba(0,212,255,0.3)",
};

const LIGHT: Palette = {
  bg: "#f5f1e8",
  arcOut: (w) => `rgba(42,138,14,${(w * 0.7).toFixed(3)})`,
  arcIn: (w) => `rgba(0,120,180,${(w * 0.5).toFixed(3)})`,
  arcAllHead: (h, w) => {
    const c = ALL_HEADS_COLORS[h];
    return `rgba(${Math.max(0, c[0] - 60)},${Math.max(0, c[1] - 60)},${Math.max(0, c[2] - 60)},${(w * 0.3).toFixed(3)})`;
  },
  tokenRect: "rgba(10,10,10,0.06)",
  tokenText: "rgba(10,10,10,0.6)",
  tokenHover: "rgba(42,138,14,0.1)",
  headActive: "rgba(42,138,14,0.25)",
  headInactive: "rgba(10,10,10,0.06)",
  headText: "rgba(10,10,10,0.35)",
  headActiveText: "rgba(10,10,10,0.75)",
  heatCell: (w) => `rgba(42,138,14,${(w * 0.6).toFixed(3)})`,
  text: "rgba(10,10,10,0.4)",
  textMuted: "rgba(10,10,10,0.2)",
  btnBg: "rgba(10,10,10,0.04)",
  btnBorder: "rgba(10,10,10,0.08)",
  btnHover: "rgba(10,10,10,0.08)",
  glowColor: "rgba(42,138,14,0.35)",
  glowInColor: "rgba(0,120,180,0.25)",
};

/* ────────────────────────────────────────────
   Easing
   ──────────────────────────────────────────── */

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function AttentionHeads() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    sentenceIdx: 0,
    activeHead: 0,
    allHeads: false,
    hoveredToken: -1,
    hoveredHeatRow: -1,
    hoveredHeatCol: -1,
    mouseX: -1,
    mouseY: -1,
    // transition state
    transitionProgress: 1, // 0..1, 1 = complete
    transitionFrom: 0,
    transitionTo: 0,
    transitionStart: 0,
    // sentence transition
    sentenceTransition: 1,
    sentenceFrom: 0,
    sentenceTo: 0,
    sentenceTransStart: 0,
  });

  const getPalette = useCallback((): Palette => {
    if (typeof document === "undefined") return DARK;
    return document.documentElement.classList.contains("dark") ? DARK : LIGHT;
  }, []);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;

    const maybeCtx = canvas.getContext("2d", { alpha: false });
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const state = stateRef.current;
    let raf = 0;
    let dpr = 1;

    /* ── Layout geometry (recalculated on resize) ── */
    let W = 0;
    let H = 0;

    // Token row geometry
    let tokenY = 0;
    let tokenBoxW = 0;
    let tokenBoxH = 0;
    let tokenStartX = 0;
    let tokenGap = 0;

    // Head selector geometry
    let headGridX = 0;
    let headGridY = 0;
    let headBoxSize = 0;
    let headGap = 0;

    // Heatmap geometry
    let heatX = 0;
    let heatY = 0;
    let heatCellSize = 0;

    // Sentence button geometry
    let sentBtnX = 0;
    let sentBtnY = 0;
    let sentBtnW = 0;
    let sentBtnH = 0;

    // All-heads toggle
    let allBtnX = 0;
    let allBtnY = 0;
    let allBtnW = 0;
    let allBtnH = 0;

    function computeLayout() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sent = SENTENCES[state.sentenceIdx];
      const N = sent.tokens.length;
      const isSmall = W < 640;

      // Token row: center of canvas vertically, shifted up a bit to make room for heatmap
      tokenBoxH = isSmall ? 28 : 34;
      tokenBoxW = isSmall ? Math.min(60, (W - 120) / N - 4) : Math.min(80, (W - 200) / N - 6);
      tokenGap = isSmall ? 4 : 6;
      const totalTokenW = N * tokenBoxW + (N - 1) * tokenGap;
      const sidebarW = isSmall ? 0 : 140;
      const contentW = W - sidebarW;
      tokenStartX = sidebarW + (contentW - totalTokenW) / 2;
      tokenY = H * 0.38;

      // Head selector: left sidebar
      headBoxSize = isSmall ? 28 : 36;
      headGap = isSmall ? 4 : 6;
      const navH = 52;
      headGridX = isSmall ? 10 : 28;
      headGridY = isSmall ? navH + 10 : Math.max(navH + 10, tokenY - 3 * (headBoxSize + headGap));

      // Heatmap: centered below tokens, constrained to fit above footer
      const footerH = 80;
      heatY = tokenY + tokenBoxH + (isSmall ? 80 : 130);
      const heatAvailH = H - heatY - footerH - 30; // 30px for column labels at top
      const maxCellFromSpace = Math.max(12, heatAvailH / N);
      heatCellSize = isSmall
        ? Math.min(18, (contentW - 40) / N, maxCellFromSpace)
        : Math.min(24, (contentW * 0.5) / N, maxCellFromSpace);
      const heatTotalW = N * heatCellSize;
      heatX = sidebarW + (contentW - heatTotalW) / 2;

      // Sentence button: top right
      sentBtnW = isSmall ? 130 : 160;
      sentBtnH = 28;
      sentBtnX = W - sentBtnW - (isSmall ? 10 : 28);
      sentBtnY = navH + (isSmall ? 10 : 12);

      // All-heads toggle: below head grid
      allBtnW = 2 * headBoxSize + headGap;
      allBtnH = 22;
      allBtnX = headGridX;
      allBtnY = headGridY + 4 * (headBoxSize + headGap) + 8;
    }

    computeLayout();

    /* ── Hit testing ── */

    function hitTestToken(mx: number, my: number): number {
      const sent = SENTENCES[state.sentenceIdx];
      for (let i = 0; i < sent.tokens.length; i++) {
        const tx = tokenStartX + i * (tokenBoxW + tokenGap);
        if (mx >= tx && mx <= tx + tokenBoxW && my >= tokenY - 4 && my <= tokenY + tokenBoxH + 4) {
          return i;
        }
      }
      return -1;
    }

    function hitTestHead(mx: number, my: number): number {
      for (let h = 0; h < 8; h++) {
        const col = h % 2;
        const row = Math.floor(h / 2);
        const hx = headGridX + col * (headBoxSize + headGap);
        const hy = headGridY + row * (headBoxSize + headGap);
        if (mx >= hx && mx <= hx + headBoxSize && my >= hy && my <= hy + headBoxSize) {
          return h;
        }
      }
      return -1;
    }

    function hitTestHeatmap(mx: number, my: number): [number, number] {
      const sent = SENTENCES[state.sentenceIdx];
      const N = sent.tokens.length;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cx = heatX + c * heatCellSize;
          const cy = heatY + r * heatCellSize;
          if (mx >= cx && mx <= cx + heatCellSize && my >= cy && my <= cy + heatCellSize) {
            return [r, c];
          }
        }
      }
      return [-1, -1];
    }

    function hitTestSentenceBtn(mx: number, my: number): boolean {
      return (
        mx >= sentBtnX && mx <= sentBtnX + sentBtnW && my >= sentBtnY && my <= sentBtnY + sentBtnH
      );
    }

    function hitTestAllBtn(mx: number, my: number): boolean {
      return mx >= allBtnX && mx <= allBtnX + allBtnW && my >= allBtnY && my <= allBtnY + allBtnH;
    }

    /* ── Event handlers ── */

    function onMouseMove(e: MouseEvent) {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
      state.hoveredToken = hitTestToken(e.clientX, e.clientY);
      const [hr, hc] = hitTestHeatmap(e.clientX, e.clientY);
      state.hoveredHeatRow = hr;
      state.hoveredHeatCol = hc;

      // Sync: hovering a heatmap cell also highlights the corresponding token
      if (hr >= 0 && hc >= 0) {
        // Don't override token hover
      }

      canvas.style.cursor =
        hitTestHead(e.clientX, e.clientY) >= 0 ||
        hitTestSentenceBtn(e.clientX, e.clientY) ||
        hitTestAllBtn(e.clientX, e.clientY)
          ? "pointer"
          : "default";
    }

    function onMouseLeave() {
      state.hoveredToken = -1;
      state.hoveredHeatRow = -1;
      state.hoveredHeatCol = -1;
      state.mouseX = -1;
      state.mouseY = -1;
    }

    function onClick(e: MouseEvent) {
      const headHit = hitTestHead(e.clientX, e.clientY);
      if (headHit >= 0) {
        state.allHeads = false;
        if (headHit !== state.activeHead) {
          state.transitionFrom = state.activeHead;
          state.transitionTo = headHit;
          state.transitionProgress = 0;
          state.transitionStart = performance.now();
          state.activeHead = headHit;
        }
        return;
      }

      if (hitTestSentenceBtn(e.clientX, e.clientY)) {
        const next = (state.sentenceIdx + 1) % SENTENCES.length;
        state.sentenceFrom = state.sentenceIdx;
        state.sentenceTo = next;
        state.sentenceTransition = 0;
        state.sentenceTransStart = performance.now();
        state.sentenceIdx = next;
        computeLayout();
        return;
      }

      if (hitTestAllBtn(e.clientX, e.clientY)) {
        state.allHeads = !state.allHeads;
        return;
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      state.mouseX = t.clientX;
      state.mouseY = t.clientY;
      state.hoveredToken = hitTestToken(t.clientX, t.clientY);
      const [hr, hc] = hitTestHeatmap(t.clientX, t.clientY);
      state.hoveredHeatRow = hr;
      state.hoveredHeatCol = hc;

      // Handle taps as clicks
      const headHit = hitTestHead(t.clientX, t.clientY);
      if (headHit >= 0) {
        state.allHeads = false;
        if (headHit !== state.activeHead) {
          state.transitionFrom = state.activeHead;
          state.transitionTo = headHit;
          state.transitionProgress = 0;
          state.transitionStart = performance.now();
          state.activeHead = headHit;
        }
        e.preventDefault();
        return;
      }
      if (hitTestSentenceBtn(t.clientX, t.clientY)) {
        const next = (state.sentenceIdx + 1) % SENTENCES.length;
        state.sentenceFrom = state.sentenceIdx;
        state.sentenceTo = next;
        state.sentenceTransition = 0;
        state.sentenceTransStart = performance.now();
        state.sentenceIdx = next;
        computeLayout();
        e.preventDefault();
        return;
      }
      if (hitTestAllBtn(t.clientX, t.clientY)) {
        state.allHeads = !state.allHeads;
        e.preventDefault();
        return;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      state.mouseX = t.clientX;
      state.mouseY = t.clientY;
      state.hoveredToken = hitTestToken(t.clientX, t.clientY);
      const [hr, hc] = hitTestHeatmap(t.clientX, t.clientY);
      state.hoveredHeatRow = hr;
      state.hoveredHeatCol = hc;
    }

    function onTouchEnd() {
      state.hoveredToken = -1;
      state.hoveredHeatRow = -1;
      state.hoveredHeatCol = -1;
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    const ro = new ResizeObserver(() => {
      computeLayout();
    });
    ro.observe(document.documentElement);

    // Watch for theme changes
    const themeObserver = new MutationObserver(() => {
      // Theme class changed, next frame will pick it up
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /* ── Drawing ── */

    function drawArc(
      c: CanvasRenderingContext2D,
      fromIdx: number,
      toIdx: number,
      weight: number,
      color: string,
      glow: boolean,
    ) {
      if (weight < 0.02) return;

      const fx = tokenStartX + fromIdx * (tokenBoxW + tokenGap) + tokenBoxW / 2;
      const tx = tokenStartX + toIdx * (tokenBoxW + tokenGap) + tokenBoxW / 2;
      const fy = tokenY;
      const ty = tokenY;

      // Arc height proportional to distance
      const dist = Math.abs(fromIdx - toIdx);
      const maxArcH = Math.min(H * 0.28, 200);
      const arcHeight = dist === 0 ? 20 : Math.min(maxArcH, 30 + dist * 22);

      // Self-attention: small loop
      if (fromIdx === toIdx) {
        const r = 12 + weight * 6;
        c.beginPath();
        c.arc(fx, fy - r - 4, r, 0, Math.PI * 2);
        if (glow) {
          c.shadowColor = color;
          c.shadowBlur = 12;
        }
        c.strokeStyle = color;
        c.lineWidth = 1 + weight * 2.5;
        c.stroke();
        c.shadowBlur = 0;
        return;
      }

      const midX = (fx + tx) / 2;
      const cpY = fy - arcHeight;

      c.beginPath();
      c.moveTo(fx, fy);
      c.quadraticCurveTo(midX, cpY, tx, ty);

      if (glow) {
        c.shadowColor = color;
        c.shadowBlur = 14;
      }
      c.strokeStyle = color;
      c.lineWidth = 1 + weight * 3;
      c.stroke();
      c.shadowBlur = 0;

      // Arrow head at destination
      if (weight > 0.08) {
        const arrowSize = 4 + weight * 3;
        // Approximate tangent at endpoint
        const tParam = 0.95;
        const bx =
          (1 - tParam) * (1 - tParam) * fx +
          2 * (1 - tParam) * tParam * midX +
          tParam * tParam * tx;
        const by =
          (1 - tParam) * (1 - tParam) * fy + 2 * (1 - tParam) * tParam * cpY + tParam * tParam * ty;
        const angle = Math.atan2(ty - by, tx - bx);
        c.beginPath();
        c.moveTo(tx, ty);
        c.lineTo(tx - arrowSize * Math.cos(angle - 0.4), ty - arrowSize * Math.sin(angle - 0.4));
        c.moveTo(tx, ty);
        c.lineTo(tx - arrowSize * Math.cos(angle + 0.4), ty - arrowSize * Math.sin(angle + 0.4));
        c.strokeStyle = color;
        c.lineWidth = 1 + weight * 1.5;
        c.stroke();
      }
    }

    function draw(now: number) {
      const p = getPalette();
      const c = ctx;

      // Update transitions
      if (state.transitionProgress < 1) {
        const elapsed = now - state.transitionStart;
        state.transitionProgress = Math.min(1, elapsed / 300);
      }
      if (state.sentenceTransition < 1) {
        const elapsed = now - state.sentenceTransStart;
        state.sentenceTransition = Math.min(1, elapsed / 400);
      }

      const sent = SENTENCES[state.sentenceIdx];
      const N = sent.tokens.length;
      const transEase = easeInOutCubic(state.transitionProgress);
      const sentEase = easeInOutCubic(state.sentenceTransition);
      const fadeIn = state.sentenceTransition < 1 ? sentEase : 1;

      // Clear
      c.fillStyle = p.bg;
      c.fillRect(0, 0, W, H);

      c.globalAlpha = fadeIn;

      // ── Draw arcs ──
      const hovToken = state.hoveredToken;
      const hovRow = state.hoveredHeatRow;
      const hovCol = state.hoveredHeatCol;
      const isHovering = hovToken >= 0 || (hovRow >= 0 && hovCol >= 0);

      if (state.allHeads) {
        // All heads mode: draw all 8 heads with different colors
        for (let h = 0; h < 8; h++) {
          const weights = sent.heads[h];
          for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
              const w = weights[i][j];
              if (w < 0.05) continue;
              const color = p.arcAllHead(h, w);
              const glow = false;
              drawArc(c, i, j, w, color, glow);
            }
          }
        }
      } else {
        // Single head mode
        const activeWeights = sent.heads[state.activeHead];

        // During transition, fade out old and fade in new
        if (state.transitionProgress < 1) {
          const oldWeights = sent.heads[state.transitionFrom];
          // Interpolate between old and new
          for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
              const oldW = oldWeights[i][j];
              const newW = activeWeights[i][j];
              const w = oldW * (1 - transEase) + newW * transEase;
              if (w < 0.03) continue;

              let color = p.arcOut(w);
              let glow = false;

              if (isHovering) {
                // Dim non-relevant arcs
                const isRelevantToken = hovToken >= 0 && (i === hovToken || j === hovToken);
                const isRelevantHeat = hovRow >= 0 && hovCol >= 0 && i === hovRow && j === hovCol;

                if (!isRelevantToken && !isRelevantHeat) {
                  color = p.arcOut(w * 0.15);
                } else if (isRelevantHeat || (hovToken >= 0 && i === hovToken)) {
                  color = p.arcOut(Math.min(1, w * 1.3));
                  glow = true;
                } else if (hovToken >= 0 && j === hovToken) {
                  color = p.arcIn(Math.min(1, w * 1.3));
                  glow = true;
                }
              }

              drawArc(c, i, j, w, color, glow);
            }
          }
        } else {
          // Stable state: draw with full interactivity

          // First pass: non-highlighted arcs (background)
          if (isHovering) {
            for (let i = 0; i < N; i++) {
              for (let j = 0; j < N; j++) {
                const w = activeWeights[i][j];
                if (w < 0.03) continue;

                const isRelevantToken = hovToken >= 0 && (i === hovToken || j === hovToken);
                const isRelevantHeat = hovRow >= 0 && hovCol >= 0 && i === hovRow && j === hovCol;

                if (isRelevantToken || isRelevantHeat) continue;

                const color = p.arcOut(w * 0.12);
                drawArc(c, i, j, w * 0.5, color, false);
              }
            }

            // Second pass: highlighted arcs (foreground)
            for (let i = 0; i < N; i++) {
              for (let j = 0; j < N; j++) {
                const w = activeWeights[i][j];
                if (w < 0.03) continue;

                const isRelevantHeat = hovRow >= 0 && hovCol >= 0 && i === hovRow && j === hovCol;

                if (isRelevantHeat) {
                  drawArc(c, i, j, w, p.arcOut(Math.min(1, w * 1.4)), true);
                  continue;
                }

                if (hovToken < 0) continue;

                // Outgoing: token i is the hovered token (it "looks at" j)
                if (i === hovToken) {
                  drawArc(c, i, j, w, p.arcOut(Math.min(1, w * 1.4)), true);
                }
                // Incoming: token j is the hovered token (i "looks at" hovered)
                else if (j === hovToken) {
                  drawArc(c, i, j, w, p.arcIn(Math.min(1, w * 1.4)), true);
                }
              }
            }
          } else {
            // No hover: draw all arcs normally
            for (let i = 0; i < N; i++) {
              for (let j = 0; j < N; j++) {
                const w = activeWeights[i][j];
                if (w < 0.03) continue;
                drawArc(c, i, j, w, p.arcOut(w), false);
              }
            }
          }
        }
      }

      // ── Draw tokens ──
      c.font = `${W < 640 ? 10 : 12}px "JetBrains Mono", monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";

      for (let i = 0; i < N; i++) {
        const tx = tokenStartX + i * (tokenBoxW + tokenGap);
        const isHov = hovToken === i || hovRow === i || hovCol === i;

        // Token box
        c.fillStyle = isHov ? p.tokenHover : "transparent";
        c.strokeStyle = isHov ? p.arcOut(0.4) : p.tokenRect;
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(tx, tokenY, tokenBoxW, tokenBoxH, 3);
        c.fill();
        c.stroke();

        // Token text
        c.fillStyle = isHov
          ? getPalette() === DARK
            ? "rgba(224,226,220,0.95)"
            : "rgba(10,10,10,0.85)"
          : p.tokenText;
        c.fillText(sent.tokens[i], tx + tokenBoxW / 2, tokenY + tokenBoxH / 2);

        // Index below token
        c.font = `${W < 640 ? 7 : 8}px "JetBrains Mono", monospace`;
        c.fillStyle = p.textMuted;
        c.fillText(String(i), tx + tokenBoxW / 2, tokenY + tokenBoxH + 12);
        c.font = `${W < 640 ? 10 : 12}px "JetBrains Mono", monospace`;
      }

      // ── Draw head selector ──
      const isSmall = W < 640;
      for (let h = 0; h < 8; h++) {
        const col = h % 2;
        const row = Math.floor(h / 2);
        const hx = headGridX + col * (headBoxSize + headGap);
        const hy = headGridY + row * (headBoxSize + headGap);
        const isActive = !state.allHeads && state.activeHead === h;

        // Head box
        c.fillStyle = isActive ? p.headActive : p.headInactive;
        c.strokeStyle = isActive ? p.arcOut(0.3) : "transparent";
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(hx, hy, headBoxSize, headBoxSize, 4);
        c.fill();
        if (isActive) c.stroke();

        // All-heads mode: colored indicator
        if (state.allHeads) {
          const hc = ALL_HEADS_COLORS[h];
          c.fillStyle = `rgba(${hc[0]},${hc[1]},${hc[2]},0.3)`;
          c.beginPath();
          c.roundRect(hx, hy, headBoxSize, headBoxSize, 4);
          c.fill();
        }

        // Head number
        c.font = `bold ${isSmall ? 9 : 10}px "JetBrains Mono", monospace`;
        c.textAlign = "center";
        c.fillStyle = isActive || state.allHeads ? p.headActiveText : p.headText;
        c.fillText(String(h), hx + headBoxSize / 2, hy + headBoxSize * 0.38);

        // Head role
        c.font = `${isSmall ? 6 : 7}px "JetBrains Mono", monospace`;
        c.fillStyle = isActive ? p.headActiveText : p.textMuted;
        c.fillText(HEAD_META[h].role, hx + headBoxSize / 2, hy + headBoxSize * 0.7);
      }

      // ── All-heads toggle ──
      c.fillStyle = state.allHeads ? p.headActive : p.btnBg;
      c.strokeStyle = state.allHeads ? p.arcOut(0.2) : p.btnBorder;
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(allBtnX, allBtnY, allBtnW, allBtnH, 3);
      c.fill();
      c.stroke();

      c.font = `${isSmall ? 7 : 8}px "JetBrains Mono", monospace`;
      c.textAlign = "center";
      c.fillStyle = state.allHeads ? p.headActiveText : p.text;
      c.fillText("ALL HEADS", allBtnX + allBtnW / 2, allBtnY + allBtnH / 2 + 1);

      // ── Sentence cycle button ──
      c.fillStyle = p.btnBg;
      c.strokeStyle = p.btnBorder;
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(sentBtnX, sentBtnY, sentBtnW, sentBtnH, 3);
      c.fill();
      c.stroke();

      c.font = `${isSmall ? 7 : 8}px "JetBrains Mono", monospace`;
      c.textAlign = "center";
      c.fillStyle = p.text;
      c.fillText(
        `SENTENCE ${state.sentenceIdx + 1}/${SENTENCES.length}`,
        sentBtnX + sentBtnW / 2,
        sentBtnY + sentBtnH / 2 + 1,
      );

      // ── Draw heatmap ──
      const heatWeights = sent.heads[state.activeHead];

      // Heatmap title
      c.font = `${isSmall ? 7 : 8}px "JetBrains Mono", monospace`;
      c.textAlign = "center";
      c.fillStyle = p.textMuted;
      const heatTotalW = N * heatCellSize;
      c.fillText(
        `ATTENTION MATRIX - HEAD ${state.activeHead} (${HEAD_META[state.activeHead].role.toUpperCase()})`,
        heatX + heatTotalW / 2,
        heatY - 16,
      );

      // Column labels (keys)
      c.font = `${isSmall ? 6 : 7}px "JetBrains Mono", monospace`;
      c.textAlign = "center";
      c.fillStyle = p.textMuted;
      for (let j = 0; j < N; j++) {
        const cx = heatX + j * heatCellSize + heatCellSize / 2;
        c.save();
        c.translate(cx, heatY - 5);
        c.rotate(-Math.PI / 4);
        const isCol = hovCol === j || (hovToken >= 0 && hovToken === j);
        c.fillStyle = isCol ? p.tokenText : p.textMuted;
        c.fillText(sent.tokens[j], 0, 0);
        c.restore();
      }

      // Row labels (queries)
      c.textAlign = "right";
      for (let i = 0; i < N; i++) {
        const cy = heatY + i * heatCellSize + heatCellSize / 2;
        const isRow = hovRow === i || (hovToken >= 0 && hovToken === i);
        c.fillStyle = isRow ? p.tokenText : p.textMuted;
        c.fillText(sent.tokens[i], heatX - 6, cy + 1);
      }

      // Cells
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const w = state.allHeads
            ? sent.heads.reduce((sum, head) => sum + head[i][j], 0) / 8
            : heatWeights[i][j];
          const cx = heatX + j * heatCellSize;
          const cy = heatY + i * heatCellSize;
          const isHeatHov = hovRow === i && hovCol === j;
          const isTokenRelated = hovToken >= 0 && (i === hovToken || j === hovToken);

          c.fillStyle = p.heatCell(w);
          c.fillRect(cx + 0.5, cy + 0.5, heatCellSize - 1, heatCellSize - 1);

          // Highlight outline for hovered cell
          if (isHeatHov) {
            c.strokeStyle = getPalette() === DARK ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
            c.lineWidth = 1.5;
            c.strokeRect(cx + 0.5, cy + 0.5, heatCellSize - 1, heatCellSize - 1);
          } else if (isTokenRelated) {
            c.strokeStyle = getPalette() === DARK ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
            c.lineWidth = 0.5;
            c.strokeRect(cx + 0.5, cy + 0.5, heatCellSize - 1, heatCellSize - 1);
          }

          // Weight text for larger cells
          if (heatCellSize >= 22 && w > 0.04) {
            c.font = `${isSmall ? 6 : 7}px "JetBrains Mono", monospace`;
            c.textAlign = "center";
            c.fillStyle =
              w > 0.3
                ? getPalette() === DARK
                  ? "rgba(0,0,0,0.7)"
                  : "rgba(255,255,255,0.9)"
                : p.textMuted;
            c.fillText(w.toFixed(2).slice(1), cx + heatCellSize / 2, cy + heatCellSize / 2 + 2);
          }
        }
      }

      // Axis labels
      c.font = `${isSmall ? 8 : 9}px "JetBrains Mono", monospace`;
      c.fillStyle = p.text;
      c.textAlign = "center";
      c.fillText("keys (attended to)", heatX + heatTotalW / 2, heatY + N * heatCellSize + 16);

      c.save();
      c.translate(heatX - (isSmall ? 30 : 42), heatY + (N * heatCellSize) / 2);
      c.rotate(-Math.PI / 2);
      c.textAlign = "center";
      c.fillText("queries (attending)", 0, 0);
      c.restore();

      // ── Hover tooltip ──
      if (hovRow >= 0 && hovCol >= 0) {
        const w = heatWeights[hovRow][hovCol];
        const tooltipText = `${sent.tokens[hovRow]} -> ${sent.tokens[hovCol]}: ${w.toFixed(3)}`;
        c.font = `10px "JetBrains Mono", monospace`;
        const metrics = c.measureText(tooltipText);
        const tw = metrics.width + 16;
        const th = 22;
        let ttx = state.mouseX + 12;
        let tty = state.mouseY - 28;
        if (ttx + tw > W) ttx = state.mouseX - tw - 8;
        if (tty < 0) tty = state.mouseY + 16;

        c.fillStyle = getPalette() === DARK ? "rgba(30,30,30,0.92)" : "rgba(245,241,232,0.95)";
        c.strokeStyle = p.btnBorder;
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(ttx, tty, tw, th, 4);
        c.fill();
        c.stroke();

        c.textAlign = "left";
        c.fillStyle = p.tokenText;
        c.fillText(tooltipText, ttx + 8, tty + th / 2 + 3);
      }

      // ── Legend for hover mode ──
      if (hovToken >= 0 && !state.allHeads) {
        const legendY = tokenY + tokenBoxH + 30;
        const sidebarW = isSmall ? 0 : 140;
        const contentW = W - sidebarW;
        const legendX = sidebarW + contentW / 2;

        c.font = `${isSmall ? 7 : 8}px "JetBrains Mono", monospace`;
        c.textAlign = "center";

        // Outgoing legend
        c.fillStyle = p.arcOut(0.8);
        c.fillRect(legendX - 80, legendY - 3, 12, 2);
        c.fillStyle = p.text;
        c.textAlign = "left";
        c.fillText("OUTGOING", legendX - 64, legendY);

        // Incoming legend
        c.fillStyle = p.arcIn(0.8);
        c.fillRect(legendX + 20, legendY - 3, 12, 2);
        c.fillStyle = p.text;
        c.fillText("INCOMING", legendX + 36, legendY);
      }

      c.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [getPalette]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      style={{ touchAction: "none" }}
    />
  );
}
