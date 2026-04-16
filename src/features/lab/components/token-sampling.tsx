"use client";

import { useEffect, useRef } from "react";
import { getTheme } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   LLM Token Sampling — Canvas2D

   Interactive visualization of how temperature,
   top-K, and top-P shape a probability distribution
   before the next token is sampled.

   Holtzman et al., "The Curious Case of Neural
   Text Degeneration" (ICLR 2020)
   https://arxiv.org/abs/1904.09751
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   Vocabulary + bigram priors
   ──────────────────────────────────────────── */

const VOCAB = [
  "\u2581the",
  "\u2581a",
  "\u2581model",
  "\u2581is",
  "\u2581not",
  "\u2581very",
  "\u2581good",
  "\u2581at",
  "\u2581this",
  "\u2581task",
  "\u2581but",
  "\u2581it",
  "\u2581can",
  "\u2581still",
  "\u2581learn",
  "\u2581from",
  "\u2581data",
  "\u2581and",
  "\u2581improve",
  "\u2581over",
  "\u2581time",
  ".",
  ",",
  "\u2581The",
  "\u2581quick",
  "\u2581brown",
  "\u2581fox",
  "\u2581with",
  "\u2581each",
  "\u2581new",
];

const V = VOCAB.length;

/** Contextual logit boosts keyed by last-token index. */
const BIGRAM_BOOSTS: Record<number, number[]> = {
  0: [2, 24, 29],
  1: [5, 6, 29],
  2: [3, 12],
  3: [4, 5, 6, 1],
  4: [5, 6, 1],
  5: [6],
  6: [7, 10, 22],
  7: [8, 11],
  8: [9, 21],
  10: [11, 0],
  11: [3, 12],
  12: [13, 14, 18],
  13: [14, 18],
  14: [15, 17],
  15: [16, 0, 28],
  16: [17, 22, 21],
  17: [18, 11, 0],
  18: [19, 27],
  19: [20],
  21: [23, 1],
  22: [17, 10, 11],
  23: [2, 24],
  24: [25],
  25: [26],
  26: [3, 21],
  27: [28, 0, 1],
  28: [29],
  29: [2, 9, 16],
};

/* ────────────────────────────────────────────
   Color palettes
   ──────────────────────────────────────────── */

interface Palette {
  bg: string;
  barActive: string;
  barFiltered: string;
  barGhost: string;
  cumCurve: string;
  topKLine: string;
  highlight: string;
  diceBounce: string;
  label: string;
  labelDim: string;
  axis: string;
  tokenBg: string;
  tokenBgDim: string;
  tokenText: string;
  sliderTrack: string;
  sliderFill: string;
  sliderThumb: string;
  sliderLabel: string;
  statLabel: string;
  statValue: string;
  probLabel: string;
}

const DARK: Palette = {
  bg: "#0a0a0a",
  barActive: "rgba(212,255,0,0.5)",
  barFiltered: "rgba(224,226,220,0.05)",
  barGhost: "rgba(224,226,220,0.08)",
  cumCurve: "rgba(0,212,255,0.4)",
  topKLine: "rgba(255,120,60,0.5)",
  highlight: "rgba(212,255,0,0.8)",
  diceBounce: "rgba(212,255,0,0.6)",
  label: "rgba(224,226,220,0.5)",
  labelDim: "rgba(224,226,220,0.2)",
  axis: "rgba(224,226,220,0.1)",
  tokenBg: "rgba(212,255,0,0.15)",
  tokenBgDim: "rgba(224,226,220,0.06)",
  tokenText: "rgba(224,226,220,0.7)",
  sliderTrack: "rgba(224,226,220,0.08)",
  sliderFill: "rgba(212,255,0,0.2)",
  sliderThumb: "rgba(212,255,0,0.7)",
  sliderLabel: "rgba(224,226,220,0.4)",
  statLabel: "rgba(224,226,220,0.3)",
  statValue: "rgba(224,226,220,0.6)",
  probLabel: "rgba(212,255,0,0.6)",
};

const LIGHT: Palette = {
  bg: "#f5f1e8",
  barActive: "rgba(42,138,14,0.4)",
  barFiltered: "rgba(10,10,10,0.03)",
  barGhost: "rgba(10,10,10,0.05)",
  cumCurve: "rgba(0,120,180,0.35)",
  topKLine: "rgba(200,80,30,0.4)",
  highlight: "rgba(42,138,14,0.7)",
  diceBounce: "rgba(42,138,14,0.5)",
  label: "rgba(10,10,10,0.4)",
  labelDim: "rgba(10,10,10,0.15)",
  axis: "rgba(10,10,10,0.08)",
  tokenBg: "rgba(42,138,14,0.1)",
  tokenBgDim: "rgba(10,10,10,0.04)",
  tokenText: "rgba(10,10,10,0.6)",
  sliderTrack: "rgba(10,10,10,0.06)",
  sliderFill: "rgba(42,138,14,0.15)",
  sliderThumb: "rgba(42,138,14,0.6)",
  sliderLabel: "rgba(10,10,10,0.35)",
  statLabel: "rgba(10,10,10,0.25)",
  statValue: "rgba(10,10,10,0.5)",
  probLabel: "rgba(42,138,14,0.5)",
};

/* ────────────────────────────────────────────
   Math helpers
   ──────────────────────────────────────────── */

function softmax(logits: number[], temperature: number): number[] {
  if (temperature < 0.01) {
    const out = Array.from({ length: logits.length }, () => 0);
    let maxIdx = 0;
    for (let i = 1; i < logits.length; i++) {
      if (logits[i] > logits[maxIdx]) maxIdx = i;
    }
    out[maxIdx] = 1;
    return out;
  }
  const scaled = logits.map((l) => l / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function applyTopK(probs: number[], k: number): number[] {
  if (k <= 0 || k >= probs.length) return [...probs];
  const indexed = probs.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => b.p - a.p);
  const out = Array.from({ length: probs.length }, () => 0);
  let sum = 0;
  for (let j = 0; j < k; j++) {
    out[indexed[j].i] = indexed[j].p;
    sum += indexed[j].p;
  }
  if (sum > 0) for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

function applyTopP(probs: number[], p: number): { probs: number[]; cumulative: number[] } {
  const indexed = probs.map((pr, i) => ({ p: pr, i }));
  indexed.sort((a, b) => b.p - a.p);
  const cumByOrig = Array.from({ length: probs.length }, () => 0);

  if (p >= 1.0) {
    let acc = 0;
    for (const item of indexed) {
      acc += item.p;
      cumByOrig[item.i] = acc;
    }
    return { probs: [...probs], cumulative: cumByOrig };
  }

  const out = Array.from({ length: probs.length }, () => 0);
  let acc = 0;
  let cutoffReached = false;

  for (const item of indexed) {
    if (!cutoffReached) {
      out[item.i] = item.p;
      acc += item.p;
      cumByOrig[item.i] = acc;
      if (acc >= p) cutoffReached = true;
    } else {
      cumByOrig[item.i] = acc;
    }
  }

  const sum = out.reduce((a, b) => a + b, 0);
  if (sum > 0) for (let i = 0; i < out.length; i++) out[i] /= sum;

  return { probs: out, cumulative: cumByOrig };
}

function sampleFrom(probs: number[]): number {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  for (let i = probs.length - 1; i >= 0; i--) {
    if (probs[i] > 0) return i;
  }
  return 0;
}

function computeEntropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 1e-10) h -= p * Math.log2(p);
  }
  return h;
}

function effectiveVocabSize(probs: number[]): number {
  let count = 0;
  for (const p of probs) {
    if (p > 1e-6) count++;
  }
  return count;
}

function generateLogits(lastTokenIdx: number | null): number[] {
  const logits: number[] = [];
  for (let i = 0; i < V; i++) {
    // Zipf-like base: a few tokens get high logits, long tail of low
    logits.push(Math.random() * 2.5 - 1.5 + 1 / (i + 1));
  }

  // Contextual boosts from bigram table
  if (lastTokenIdx !== null && BIGRAM_BOOSTS[lastTokenIdx]) {
    for (const boosted of BIGRAM_BOOSTS[lastTokenIdx]) {
      logits[boosted] += 2.5 + Math.random() * 1.5;
    }
  }

  // Sprinkle additional random "hot" tokens
  const nHot = 3 + Math.floor(Math.random() * 4);
  const hotIndices: number[] = [];
  for (let i = 0; i < nHot; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * V);
    } while (hotIndices.includes(idx));
    hotIndices.push(idx);
    logits[idx] += 1.5 + Math.random() * 2;
  }

  return logits;
}

/* ────────────────────────────────────────────
   Lerp
   ──────────────────────────────────────────── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface SliderSpec {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  lowLabel: string;
  highLabel: string;
  format: (v: number) => string;
}

interface GeneratedToken {
  vocabIdx: number;
  prob: number;
  pulseT: number; // 1 → 0 pulse animation
}

interface DiceAnim {
  active: boolean;
  startTime: number;
  duration: number;
  bounceIndices: number[];
  finalIdx: number;
  currentHighlight: number;
}

interface FlyingToken {
  vocabIdx: number;
  prob: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  duration: number;
}

interface SliderRect {
  x: number;
  y: number;
  w: number;
  h: number;
  min: number;
  max: number;
  step: number;
  key: string;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function TokenSampling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    // Slider values
    temperature: 1.0,
    topK: 0,
    topP: 1.0,

    // Distributions
    rawLogits: generateLogits(null),
    sortedIndices: [] as number[],
    displayProbs: Array.from({ length: V }, () => 0),
    targetProbs: Array.from({ length: V }, () => 0),
    ghostProbs: Array.from({ length: V }, () => 0),
    afterTempProbs: Array.from({ length: V }, () => 0),
    cumulativeDisplay: Array.from({ length: V }, () => 0),
    cumulativeTarget: Array.from({ length: V }, () => 0),
    topKCutoffDisplay: -1,

    // Generated sequence
    generatedTokens: [] as GeneratedToken[],
    lastTokenIdx: null as number | null,

    // Auto-generate
    autoMode: true,
    lastSampleTime: 0,

    // Dice animation
    dice: {
      active: false,
      startTime: 0,
      duration: 400,
      bounceIndices: [],
      finalIdx: 0,
      currentHighlight: -1,
    } as DiceAnim,

    // Flying token
    flying: null as FlyingToken | null,

    // Slider interaction
    activeSlider: -1,
    sliderRects: [] as SliderRect[],

    // Sample button
    sampleBtnRect: { x: 0, y: 0, w: 0, h: 0 },
    sampleBtnHover: false,

    // Canvas
    width: 0,
    height: 0,
    dpr: 1,

    // Mouse
    mouseX: 0,
    mouseY: 0,

    // Flags
    needsRecalc: true,
  });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const maybeCtx = el.getContext("2d", { alpha: false });
    if (!maybeCtx) return;
    const ctx = maybeCtx;
    // Alias narrowed to non-null for use in closures
    const canvas = el;

    const S = stateRef.current;
    let rafId = 0;

    /* ── Resize ─────────────────────────────── */

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      S.width = rect.width;
      S.height = rect.height;
      S.dpr = dpr;
    });
    ro.observe(canvas);

    /* ── Distribution recalc ────────────────── */

    function recalcDistribution() {
      // Ghost = raw softmax at temp=1 (reference)
      S.ghostProbs = softmax(S.rawLogits, 1.0);

      // After temperature
      S.afterTempProbs = softmax(S.rawLogits, S.temperature);

      // Sort indices by post-temp probability (descending)
      const indexed = S.afterTempProbs.map((pr, i) => ({ p: pr, i }));
      indexed.sort((a, b) => b.p - a.p);
      S.sortedIndices = indexed.map((item) => item.i);

      // After top-K
      const afterK = applyTopK(S.afterTempProbs, S.topK);

      // After top-P
      const { probs: afterP, cumulative } = applyTopP(afterK, S.topP);

      S.targetProbs = afterP;
      S.cumulativeTarget = cumulative;
      S.topKCutoffDisplay = S.topK > 0 && S.topK < V ? S.topK : -1;
      S.needsRecalc = false;
    }

    // Initial calc + snapshot
    recalcDistribution();
    S.displayProbs = [...S.targetProbs];
    S.cumulativeDisplay = [...S.cumulativeTarget];

    /* ── Sampling ───────────────────────────── */

    function doSample() {
      recalcDistribution();

      // Bounce candidates: non-zero bars in sorted order
      const candidates: number[] = [];
      for (const vi of S.sortedIndices) {
        if (S.targetProbs[vi] > 1e-6) candidates.push(vi);
      }

      const nBounces = Math.min(candidates.length, 5 + Math.floor(Math.random() * 4));
      const bounceIndices: number[] = [];
      for (let i = 0; i < nBounces; i++) {
        bounceIndices.push(candidates[Math.floor(Math.random() * candidates.length)]);
      }

      const chosen = sampleFrom(S.targetProbs);
      bounceIndices.push(chosen);

      S.dice = {
        active: true,
        startTime: performance.now(),
        duration: 400,
        bounceIndices,
        finalIdx: chosen,
        currentHighlight: -1,
      };
    }

    function finalizeSample(chosenIdx: number) {
      const prob = S.targetProbs[chosenIdx];
      const sortedPos = S.sortedIndices.indexOf(chosenIdx);

      const chart = getChartArea();
      const barX = chart.x + sortedPos * (chart.barW + chart.gap) + chart.barW / 2;
      const maxScale = Math.max(0.01, ...S.displayProbs, ...S.ghostProbs);
      const barH = (S.displayProbs[chosenIdx] / maxScale) * chart.maxBarH * 0.92;
      const barTopY = chart.y + chart.maxBarH - barH;

      const seq = getSequenceArea();
      const tokenW = 64;
      const targetX = seq.x + S.generatedTokens.length * (tokenW + 5);
      const targetY = seq.y + seq.h / 2;

      S.flying = {
        vocabIdx: chosenIdx,
        prob,
        startX: barX,
        startY: barTopY,
        endX: targetX,
        endY: targetY,
        startTime: performance.now(),
        duration: 320,
      };
    }

    function addTokenToSequence(vocabIdx: number, prob: number) {
      if (S.generatedTokens.length >= 14) {
        S.generatedTokens.shift();
      }

      S.generatedTokens.push({ vocabIdx, prob, pulseT: 1 });
      S.lastTokenIdx = vocabIdx;
      S.rawLogits = generateLogits(vocabIdx);
      S.needsRecalc = true;
      S.lastSampleTime = performance.now();
    }

    /* ── Layout helpers ─────────────────────── */

    function getSequenceArea() {
      const navH = 52;
      const y = navH + Math.max(12, S.height * 0.02);
      return { x: 24, y, w: S.width - 48, h: Math.min(48, S.height * 0.065) };
    }

    function getChartArea() {
      const seq = getSequenceArea();
      const sliderW = Math.min(210, Math.max(160, S.width * 0.18));
      const statsH = Math.min(55, S.height * 0.075);
      const topY = seq.y + seq.h + 16;
      const bottomY = S.height - statsH - 12;
      const chartH = bottomY - topY;
      const chartW = S.width - sliderW - 70;
      const labelH = 52;
      const maxBarH = chartH - labelH - 16;

      const totalGapFraction = 0.28;
      const barW = (chartW * (1 - totalGapFraction)) / V;
      const gap = (chartW * totalGapFraction) / (V - 1);

      return {
        x: 24,
        y: topY,
        w: chartW,
        h: chartH,
        maxBarH: Math.max(40, maxBarH),
        labelY: topY + Math.max(40, maxBarH) + 6,
        barW,
        gap,
      };
    }

    function getSliderArea() {
      const sliderW = Math.min(210, Math.max(160, S.width * 0.18));
      const seq = getSequenceArea();
      const topY = seq.y + seq.h + 36;
      return { x: S.width - sliderW - 24, y: topY, w: sliderW };
    }

    function getStatsArea() {
      const statsH = Math.min(55, S.height * 0.075);
      return { x: 24, y: S.height - statsH - 12, w: S.width - 48, h: statsH };
    }

    /* ── Draw ───────────────────────────────── */

    function draw(now: number) {
      const W = S.width;
      const H = S.height;
      if (W === 0 || H === 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      if (S.needsRecalc) recalcDistribution();

      // Smooth bar interpolation
      const t = 0.13;
      for (let i = 0; i < V; i++) {
        S.displayProbs[i] = lerp(S.displayProbs[i], S.targetProbs[i], t);
        S.cumulativeDisplay[i] = lerp(S.cumulativeDisplay[i], S.cumulativeTarget[i], t);
      }

      // Token pulse decay
      for (const tok of S.generatedTokens) {
        if (tok.pulseT > 0) tok.pulseT = Math.max(0, tok.pulseT - 0.025);
      }

      // Auto-sample
      if (S.autoMode && !S.dice.active && !S.flying && now - S.lastSampleTime > 1500) {
        doSample();
      }

      // Dice animation
      if (S.dice.active) {
        const elapsed = now - S.dice.startTime;
        const dt = Math.min(1, elapsed / S.dice.duration);
        const eased = 1 - (1 - dt) * (1 - dt);
        const idx = Math.min(
          S.dice.bounceIndices.length - 1,
          Math.floor(eased * S.dice.bounceIndices.length),
        );
        S.dice.currentHighlight = S.dice.bounceIndices[idx];
        if (dt >= 1) {
          S.dice.active = false;
          finalizeSample(S.dice.finalIdx);
        }
      }

      // Flying token
      if (S.flying) {
        const dt = Math.min(1, (now - S.flying.startTime) / S.flying.duration);
        if (dt >= 1) {
          addTokenToSequence(S.flying.vocabIdx, S.flying.prob);
          S.flying = null;
        }
      }

      const pal = getTheme() === "dark" ? DARK : LIGHT;

      ctx.save();
      ctx.scale(S.dpr, S.dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);

      drawSequence(ctx, pal);
      drawChart(ctx, pal, now);
      drawSliders(ctx, pal);
      drawStats(ctx, pal);
      if (S.flying) drawFlyingToken(ctx, pal, now);

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    }

    /* ── Draw: generated token sequence ─────── */

    function drawSequence(c: CanvasRenderingContext2D, pal: Palette) {
      const area = getSequenceArea();
      const tokenH = Math.min(26, area.h * 0.7);
      const tokenW = 64;
      const tokenGap = 5;

      c.font = "10px monospace";
      const tokens = S.generatedTokens;

      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        const text = VOCAB[tok.vocabIdx].replace("\u2581", "");
        const tw = Math.min(tokenW, c.measureText(text).width + 18);
        const x = area.x + i * (tokenW + tokenGap);
        const y = area.y + (area.h - tokenH) / 2;

        const brightness = 0.15 + Math.min(1, tok.prob * 2) * 0.85;
        const pulse = tok.pulseT;

        c.fillStyle = brightness > 0.4 ? pal.tokenBg : pal.tokenBgDim;

        if (pulse > 0) {
          c.globalAlpha = 0.4 * pulse + 0.6;
          c.shadowColor = pal.highlight;
          c.shadowBlur = 14 * pulse;
        }

        c.beginPath();
        c.roundRect(x, y, tw, tokenH, 3);
        c.fill();
        c.shadowBlur = 0;
        c.globalAlpha = 1;

        // Probability as tiny superscript
        c.font = "7px monospace";
        c.fillStyle = pal.labelDim;
        c.textAlign = "right";
        c.textBaseline = "bottom";
        c.fillText((tok.prob * 100).toFixed(0) + "%", x + tw - 3, y - 1);

        // Token text
        c.font = "10px monospace";
        c.fillStyle = pal.tokenText;
        c.globalAlpha = 0.35 + brightness * 0.65;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(text, x + tw / 2, y + tokenH / 2);
        c.globalAlpha = 1;
      }

      // Cursor blink if sequence is non-empty
      if (tokens.length > 0 && !S.flying) {
        const cursorX = area.x + tokens.length * (tokenW + tokenGap);
        const cursorY = area.y + (area.h - tokenH) / 2;
        const blink = Math.sin(performance.now() / 500) > 0;
        if (blink) {
          c.fillStyle = pal.labelDim;
          c.fillRect(cursorX, cursorY + 2, 2, tokenH - 4);
        }
      }
    }

    /* ── Draw: probability bar chart ────────── */

    function drawChart(c: CanvasRenderingContext2D, pal: Palette, now: number) {
      const chart = getChartArea();
      const { x: cx, y: cy, barW, gap, maxBarH, labelY, w: chartW } = chart;
      const sorted = S.sortedIndices;
      if (sorted.length === 0) return;

      // Use max of ghost + display for consistent scaling
      const maxProb = Math.max(0.01, ...S.displayProbs, ...S.ghostProbs);

      // Axis
      c.strokeStyle = pal.axis;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(cx, cy + maxBarH);
      c.lineTo(cx + chartW, cy + maxBarH);
      c.stroke();

      // Bars
      for (let si = 0; si < V; si++) {
        const vi = sorted[si];
        const barX = cx + si * (barW + gap);

        // Ghost bar (raw softmax at temp=1)
        const ghostH = (S.ghostProbs[vi] / maxProb) * maxBarH * 0.92;
        if (ghostH > 0.5) {
          c.fillStyle = pal.barGhost;
          c.fillRect(barX, cy + maxBarH - ghostH, barW, ghostH);
        }

        // Final bar (after all filters)
        const barH = (S.displayProbs[vi] / maxProb) * maxBarH * 0.92;
        const isFiltered = S.targetProbs[vi] < 1e-6;
        const isDice = S.dice.active && S.dice.currentHighlight === vi;

        if (isDice) {
          c.fillStyle = pal.diceBounce;
          c.shadowColor = pal.highlight;
          c.shadowBlur = 16;
        } else if (isFiltered) {
          c.fillStyle = pal.barFiltered;
        } else {
          c.fillStyle = pal.barActive;
        }

        if (barH > 0.5) {
          c.beginPath();
          c.roundRect(barX, cy + maxBarH - barH, barW, barH, [2, 2, 0, 0]);
          c.fill();
        }
        c.shadowBlur = 0;

        // Probability label on top 5 bars
        if (si < 5 && !isFiltered && S.displayProbs[vi] > 0.01) {
          const pct = (S.displayProbs[vi] * 100).toFixed(1);
          c.font = "7px monospace";
          c.fillStyle = pal.probLabel;
          c.textAlign = "center";
          c.textBaseline = "bottom";
          c.fillText(pct + "%", barX + barW / 2, cy + maxBarH - barH - 3);
        }

        // Token label (rotated 45 deg)
        const label = VOCAB[vi].replace("\u2581", "");
        c.save();
        c.translate(barX + barW / 2, labelY);
        c.rotate(-Math.PI / 4);
        c.font = "9px monospace";
        c.fillStyle = isFiltered ? pal.labelDim : pal.label;
        c.textAlign = "right";
        c.textBaseline = "top";
        c.fillText(label, 0, 0);
        c.restore();
      }

      // Top-K cutoff line
      if (S.topKCutoffDisplay > 0 && S.topKCutoffDisplay < V) {
        const cutX = cx + S.topKCutoffDisplay * (barW + gap) - gap / 2;
        c.strokeStyle = pal.topKLine;
        c.lineWidth = 2;
        c.setLineDash([5, 4]);
        c.beginPath();
        c.moveTo(cutX, cy);
        c.lineTo(cutX, cy + maxBarH);
        c.stroke();
        c.setLineDash([]);

        c.font = "8px monospace";
        c.fillStyle = pal.topKLine;
        c.textAlign = "center";
        c.textBaseline = "bottom";
        c.fillText("top-" + S.topK, cutX, cy - 3);
      }

      // Top-P cumulative curve + threshold
      if (S.topP < 1.0) {
        c.beginPath();
        c.strokeStyle = pal.cumCurve;
        c.lineWidth = 2;

        for (let si = 0; si < V; si++) {
          const vi = sorted[si];
          const cum = S.cumulativeDisplay[vi];
          const bx = cx + si * (barW + gap) + barW / 2;
          const cumY = cy + maxBarH - cum * maxBarH * 0.92;
          if (si === 0) c.moveTo(bx, cumY);
          else c.lineTo(bx, cumY);
        }
        c.stroke();

        // Threshold line
        const threshY = cy + maxBarH - S.topP * maxBarH * 0.92;
        c.strokeStyle = pal.cumCurve;
        c.lineWidth = 1;
        c.setLineDash([3, 3]);
        c.beginPath();
        c.moveTo(cx, threshY);
        c.lineTo(cx + chartW, threshY);
        c.stroke();
        c.setLineDash([]);

        c.font = "8px monospace";
        c.fillStyle = pal.cumCurve;
        c.textAlign = "left";
        c.textBaseline = "middle";
        c.fillText("p=" + S.topP.toFixed(2), cx + chartW + 6, threshY);
      }

      void now; // used only for potential future animation
    }

    /* ── Draw: sliders ──────────────────────── */

    function drawSliders(c: CanvasRenderingContext2D, pal: Palette) {
      const area = getSliderArea();

      const sliders: SliderSpec[] = [
        {
          label: "TEMPERATURE",
          min: 0,
          max: 2,
          step: 0.05,
          value: S.temperature,
          lowLabel: "deterministic",
          highLabel: "creative",
          format: (v) => v.toFixed(2),
        },
        {
          label: "TOP-K",
          min: 0,
          max: 30,
          step: 1,
          value: S.topK,
          lowLabel: "all",
          highLabel: "30",
          format: (v) => (v === 0 ? "off" : String(Math.round(v))),
        },
        {
          label: "TOP-P",
          min: 0.05,
          max: 1,
          step: 0.05,
          value: S.topP,
          lowLabel: "narrow",
          highLabel: "all",
          format: (v) => v.toFixed(2),
        },
      ];

      const spacing = 62;
      S.sliderRects = [];

      for (let i = 0; i < sliders.length; i++) {
        const sl = sliders[i];
        const sy = area.y + i * spacing;
        const trackY = sy + 20;
        const trackH = 3;
        const thumbR = 7;
        const pct = (sl.value - sl.min) / (sl.max - sl.min);

        // Label
        c.font = "9px monospace";
        c.fillStyle = pal.sliderLabel;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(sl.label, area.x, sy);

        // Current value
        c.textAlign = "right";
        c.fillStyle = pal.statValue;
        c.fillText(sl.format(sl.value), area.x + area.w, sy);

        // Track background
        c.fillStyle = pal.sliderTrack;
        c.beginPath();
        c.roundRect(area.x, trackY, area.w, trackH, 1.5);
        c.fill();

        // Filled portion
        c.fillStyle = pal.sliderFill;
        c.beginPath();
        c.roundRect(area.x, trackY, area.w * pct, trackH, 1.5);
        c.fill();

        // Thumb
        const thumbX = area.x + area.w * pct;
        const thumbY = trackY + trackH / 2;
        c.beginPath();
        c.arc(thumbX, thumbY, thumbR, 0, Math.PI * 2);
        c.fillStyle = pal.sliderThumb;
        c.fill();

        // Min/max annotations
        c.font = "7px monospace";
        c.fillStyle = pal.labelDim;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(sl.lowLabel, area.x, trackY + trackH + 6);
        c.textAlign = "right";
        c.fillText(sl.highLabel, area.x + area.w, trackY + trackH + 6);

        // Hit rect (generous padding)
        S.sliderRects.push({
          x: area.x - 10,
          y: trackY - 14,
          w: area.w + 20,
          h: 32,
          min: sl.min,
          max: sl.max,
          step: sl.step,
          key: ["temperature", "topK", "topP"][i],
        });
      }

      // Sample button
      const btnY = area.y + sliders.length * spacing + 12;
      const btnW = area.w;
      const btnH = 28;
      S.sampleBtnRect = { x: area.x, y: btnY, w: btnW, h: btnH };

      const hover = S.sampleBtnHover;
      c.strokeStyle = hover ? pal.sliderThumb : pal.axis;
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(area.x, btnY, btnW, btnH, 3);
      c.stroke();

      c.font = "9px monospace";
      c.fillStyle = hover ? pal.sliderThumb : pal.sliderLabel;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(S.autoMode ? "AUTO-SAMPLING" : "SAMPLE", area.x + btnW / 2, btnY + btnH / 2);

      if (S.autoMode) {
        const pulse = (Math.sin(performance.now() / 400) + 1) / 2;
        c.beginPath();
        c.arc(area.x + btnW / 2 - 50, btnY + btnH / 2, 3, 0, Math.PI * 2);
        c.fillStyle = pal.sliderThumb;
        c.globalAlpha = 0.4 + pulse * 0.6;
        c.fill();
        c.globalAlpha = 1;
      }
    }

    /* ── Draw: stats ────────────────────────── */

    function drawStats(c: CanvasRenderingContext2D, pal: Palette) {
      const area = getStatsArea();
      const h = computeEntropy(S.displayProbs);
      const perplexity = Math.pow(2, h);
      const eff = effectiveVocabSize(S.targetProbs);

      const stats = [
        { label: "TEMPERATURE", value: S.temperature.toFixed(2) },
        { label: "EFF. VOCAB", value: String(eff) },
        { label: "ENTROPY", value: h.toFixed(2) + " bits" },
        { label: "PERPLEXITY", value: perplexity.toFixed(1) },
      ];

      const colW = Math.min(150, area.w / stats.length);

      for (let i = 0; i < stats.length; i++) {
        const x = area.x + i * colW;
        c.font = "7px monospace";
        c.fillStyle = pal.statLabel;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(stats[i].label, x, area.y);

        c.font = "11px monospace";
        c.fillStyle = pal.statValue;
        c.fillText(stats[i].value, x, area.y + 13);
      }
    }

    /* ── Draw: flying token ─────────────────── */

    function drawFlyingToken(c: CanvasRenderingContext2D, pal: Palette, now: number) {
      if (!S.flying) return;
      const dt = Math.min(1, (now - S.flying.startTime) / S.flying.duration);
      const eased = 1 - (1 - dt) * (1 - dt) * (1 - dt);

      const x = lerp(S.flying.startX, S.flying.endX, eased);
      const y = lerp(S.flying.startY, S.flying.endY, eased);
      const arcY = y - Math.sin(eased * Math.PI) * 50;

      const text = VOCAB[S.flying.vocabIdx].replace("\u2581", "");
      c.font = "10px monospace";
      const tw = c.measureText(text).width + 16;
      const tokenH = 24;

      c.globalAlpha = 0.85;
      c.fillStyle = pal.tokenBg;
      c.shadowColor = pal.highlight;
      c.shadowBlur = 12;
      c.beginPath();
      c.roundRect(x - tw / 2, arcY - tokenH / 2, tw, tokenH, 3);
      c.fill();

      c.shadowBlur = 0;
      c.fillStyle = pal.tokenText;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, x, arcY);
      c.globalAlpha = 1;
    }

    /* ── Interaction helpers ─────────────────── */

    function getCanvasXY(e: MouseEvent | Touch): [number, number] {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function hitTestSliders(mx: number, my: number): number {
      for (let i = 0; i < S.sliderRects.length; i++) {
        const r = S.sliderRects[i];
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
      }
      return -1;
    }

    function hitTestSampleBtn(mx: number, my: number): boolean {
      const r = S.sampleBtnRect;
      return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    function updateSliderValue(idx: number, mx: number) {
      const r = S.sliderRects[idx];
      const trackX = r.x + 10;
      const trackW = r.w - 20;
      const pct = Math.max(0, Math.min(1, (mx - trackX) / trackW));
      let val = r.min + pct * (r.max - r.min);
      val = Math.round(val / r.step) * r.step;
      val = Math.max(r.min, Math.min(r.max, val));

      if (r.key === "temperature") S.temperature = val;
      else if (r.key === "topK") S.topK = Math.round(val);
      else if (r.key === "topP") S.topP = val;

      S.needsRecalc = true;
    }

    /* ── Pointer events ─────────────────────── */

    function onPointerDown(e: PointerEvent) {
      const [mx, my] = getCanvasXY(e);
      S.mouseX = mx;
      S.mouseY = my;

      const si = hitTestSliders(mx, my);
      if (si >= 0) {
        S.activeSlider = si;
        updateSliderValue(si, mx);
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      if (hitTestSampleBtn(mx, my) && !S.dice.active && !S.flying) {
        doSample();
        e.preventDefault();
      }
    }

    function onPointerMove(e: PointerEvent) {
      const [mx, my] = getCanvasXY(e);
      S.mouseX = mx;
      S.mouseY = my;

      if (S.activeSlider >= 0) {
        updateSliderValue(S.activeSlider, mx);
        return;
      }

      S.sampleBtnHover = hitTestSampleBtn(mx, my);
      const overInteractive = hitTestSliders(mx, my) >= 0 || S.sampleBtnHover;
      canvas.style.cursor = overInteractive ? "pointer" : "default";
    }

    function onPointerUp(e: PointerEvent) {
      S.activeSlider = -1;
      canvas.releasePointerCapture(e.pointerId);
    }

    /* ── Touch events (fallback) ────────────── */

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const [mx, my] = getCanvasXY(e.touches[0]);
      S.mouseX = mx;
      S.mouseY = my;

      const si = hitTestSliders(mx, my);
      if (si >= 0) {
        S.activeSlider = si;
        updateSliderValue(si, mx);
        e.preventDefault();
        return;
      }

      if (hitTestSampleBtn(mx, my) && !S.dice.active && !S.flying) {
        doSample();
        e.preventDefault();
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const [mx] = getCanvasXY(e.touches[0]);
      if (S.activeSlider >= 0) {
        updateSliderValue(S.activeSlider, mx);
        e.preventDefault();
      }
    }

    function onTouchEnd() {
      S.activeSlider = -1;
    }

    /* ── Keyboard ───────────────────────────── */

    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === " ") {
        e.preventDefault();
        S.autoMode = !S.autoMode;
        if (S.autoMode) S.lastSampleTime = performance.now() - 1200;
      }

      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        S.generatedTokens = [];
        S.lastTokenIdx = null;
        S.rawLogits = generateLogits(null);
        S.needsRecalc = true;
        S.dice.active = false;
        S.flying = null;
        S.autoMode = false;
      }
    }

    /* ── Wire up ────────────────────────────── */

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKeyDown);

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-screen w-screen"
      style={{ touchAction: "none" }}
    />
  );
}
