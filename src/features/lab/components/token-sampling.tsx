"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { getTheme } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import {
  ControlGroup,
  LabSlider,
  Tool,
  Transport,
} from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";
import { Dices } from "lucide-react";

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
  "▁the",
  "▁a",
  "▁model",
  "▁is",
  "▁not",
  "▁very",
  "▁good",
  "▁at",
  "▁this",
  "▁task",
  "▁but",
  "▁it",
  "▁can",
  "▁still",
  "▁learn",
  "▁from",
  "▁data",
  "▁and",
  "▁improve",
  "▁over",
  "▁time",
  ".",
  ",",
  "▁The",
  "▁quick",
  "▁brown",
  "▁fox",
  "▁with",
  "▁each",
  "▁new",
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

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function TokenSampling({ info }: { info?: ReactNode }) {
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

    // Canvas
    width: 0,
    height: 0,
    dpr: 1,

    // Flags
    needsRecalc: true,

    // One-shot sample request from the chrome control
    sampleRequested: false,
  });

  // React mirrors of the sim state — the chrome controls read/write these.
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(0);
  const [topP, setTopP] = useState(1.0);
  const [autoMode, setAutoMode] = useState(true);
  // Live telemetry, lifted from the sim for the readout HUD.
  const [telemetry, setTelemetry] = useState({
    entropy: 0,
    perplexity: 1,
    effVocab: V,
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
      // Re-anchored below the navbar band AND the LabReadout HUD (top-right),
      // so the generated-token strip never sits behind the live telemetry.
      const topInset = 56;
      const hudClearance = 52;
      const y = topInset + hudClearance + Math.max(0, S.height * 0.01);
      return { x: 24, y, w: S.width - 48, h: Math.min(48, S.height * 0.065) };
    }

    function getChartArea() {
      const seq = getSequenceArea();
      const sliderW = 0;
      const statsH = Math.min(55, S.height * 0.075);
      const topY = seq.y + seq.h + 16;
      const bottomY = S.height - statsH - 12;
      const chartH = bottomY - topY;
      const chartW = S.width - sliderW - 48;
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

    /* ── Draw ───────────────────────────────── */

    function draw(now: number) {
      const W = S.width;
      const H = S.height;
      if (W === 0 || H === 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      if (S.needsRecalc) recalcDistribution();

      // One-shot sample request from the chrome control
      if (S.sampleRequested) {
        S.sampleRequested = false;
        if (!S.dice.active && !S.flying) doSample();
      }

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
        const text = VOCAB[tok.vocabIdx].replace("▁", "");
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
        const label = VOCAB[vi].replace("▁", "");
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

    /* ── Draw: flying token ─────────────────── */

    function drawFlyingToken(c: CanvasRenderingContext2D, pal: Palette, now: number) {
      if (!S.flying) return;
      const dt = Math.min(1, (now - S.flying.startTime) / S.flying.duration);
      const eased = 1 - (1 - dt) * (1 - dt) * (1 - dt);

      const x = lerp(S.flying.startX, S.flying.endX, eased);
      const y = lerp(S.flying.startY, S.flying.endY, eased);
      const arcY = y - Math.sin(eased * Math.PI) * 50;

      const text = VOCAB[S.flying.vocabIdx].replace("▁", "");
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

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  /* ── Lift sim telemetry to React state for the readout HUD ── */

  useEffect(() => {
    const id = window.setInterval(() => {
      const S = stateRef.current;
      const h = computeEntropy(S.displayProbs);
      setTelemetry({
        entropy: h,
        perplexity: Math.pow(2, h),
        effVocab: effectiveVocabSize(S.targetProbs),
      });
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  /* ── Control handlers ── */

  const handleTemperature = useCallback((v: number) => {
    stateRef.current.temperature = v;
    stateRef.current.needsRecalc = true;
    setTemperature(v);
  }, []);

  const handleTopK = useCallback((v: number) => {
    const k = Math.round(v);
    stateRef.current.topK = k;
    stateRef.current.needsRecalc = true;
    setTopK(k);
  }, []);

  const handleTopP = useCallback((v: number) => {
    stateRef.current.topP = v;
    stateRef.current.needsRecalc = true;
    setTopP(v);
  }, []);

  const toggleAuto = useCallback(() => {
    const next = !stateRef.current.autoMode;
    stateRef.current.autoMode = next;
    if (next) stateRef.current.lastSampleTime = performance.now() - 1200;
    setAutoMode(next);
  }, []);

  const reset = useCallback(() => {
    const S = stateRef.current;
    S.generatedTokens = [];
    S.lastTokenIdx = null;
    S.rawLogits = generateLogits(null);
    S.needsRecalc = true;
    S.dice.active = false;
    S.flying = null;
    S.autoMode = false;
    setAutoMode(false);
  }, []);

  const sampleOnce = useCallback(() => {
    stateRef.current.sampleRequested = true;
  }, []);

  /* ── Keyboard: space = toggle auto, r = reset ──
     (f/fullscreen + ?/how-it-works live in LabChrome) */

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggleAuto();
      } else if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        reset();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleAuto, reset]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      <LabReadout corner="right">
        <Gauge label="temperature" value={temperature.toFixed(2)} />
        <Gauge label="eff. vocab" value={telemetry.effVocab} />
        <Gauge label="entropy" value={telemetry.entropy.toFixed(2)} unit="bits" primary />
        <Gauge label="perplexity" value={telemetry.perplexity.toFixed(1)} />
      </LabReadout>

      <LabChrome
        identity={{ name: "token sampling", scent: "temperature · top-k · top-p" }}
        info={info}
      >
        <ControlGroup label="shape">
          <LabSlider
            label="temp"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={handleTemperature}
            format={(v) => v.toFixed(2)}
          />
          <LabSlider
            label="top-k"
            min={0}
            max={30}
            step={1}
            value={topK}
            onChange={handleTopK}
            format={(v) => (v === 0 ? "off" : String(Math.round(v)))}
          />
          <LabSlider
            label="top-p"
            min={0.05}
            max={1}
            step={0.05}
            value={topP}
            onChange={handleTopP}
            format={(v) => v.toFixed(2)}
          />
        </ControlGroup>
        <ControlGroup label="sample">
          <Tool
            label="Sample one token"
            title="Sample one token"
            onClick={sampleOnce}
            icon={<Dices className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Transport playing={autoMode} onToggle={toggleAuto} onReset={reset} />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
