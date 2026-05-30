"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { getTheme } from "@/features/lab/lib/env";
import { labBounds } from "@/features/lab/lib/layout";
import { LAB_CANVAS_CLASS, useLabCanvas } from "@/features/lab/lib/use-lab-canvas";
import {
  ControlGroup,
  LabSlider,
  Toggle,
  Transport,
} from "@/features/lab/components/chrome/controls";
import { Gauge, ProgressGauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

/* ────────────────────────────────────────────
   Token vocabulary (common BPE subwords)
   ──────────────────────────────────────────── */

const VOCAB = [
  "The",
  "▁model",
  "▁gen",
  "erat",
  "es",
  "▁text",
  "▁by",
  "▁predict",
  "ing",
  "▁the",
  "▁next",
  "▁token",
  "▁in",
  "▁a",
  "▁seq",
  "uence",
  "▁of",
  "▁words",
  "▁each",
  "▁step",
  "▁attend",
  "s",
  "▁to",
  "▁every",
  "▁previous",
  "▁position",
  "▁using",
  "▁attention",
  "▁weights",
  "▁computed",
  "▁from",
  "▁query",
  "▁key",
  "▁value",
  "▁vectors",
  "▁that",
  "▁are",
  "▁stored",
  "▁for",
  "▁re",
  "use",
  "▁with",
  "▁cach",
  "ing",
  "▁en",
  "abled",
  "▁transform",
  "er",
  "▁runs",
  "▁self",
  "▁fast",
  "▁linear",
  "▁time",
  "▁decode",
  "▁output",
  "▁hidden",
  "▁state",
  "▁matrix",
  "▁multi",
  "▁head",
  "▁soft",
  "max",
  "▁scale",
  "▁dot",
  "▁product",
];

const MAX_TOKENS = 64;
const NUM_HEADS = 16;

/* ────────────────────────────────────────────
   Theme colors
   ──────────────────────────────────────────── */

interface ThemeColors {
  bg: string;
  cacheFilled: string;
  cacheNew: string;
  recompute: string;
  queryArrow: string;
  text: string;
  textBright: string;
  textDim: string;
  gridLine: string;
  barFill: string;
  barGhost: string;
  tokenBg: string;
  tokenBorder: string;
  tokenNewBg: string;
}

function darkColors(): ThemeColors {
  return {
    bg: "#0a0a0a",
    cacheFilled: "rgba(212,255,0,0.15)",
    cacheNew: "rgba(212,255,0,0.6)",
    recompute: "rgba(255,120,60,0.4)",
    queryArrow: "rgba(212,255,0,0.3)",
    text: "rgba(224,226,220,0.7)",
    textBright: "rgba(224,226,220,0.9)",
    textDim: "rgba(224,226,220,0.35)",
    gridLine: "rgba(224,226,220,0.08)",
    barFill: "rgba(212,255,0,0.3)",
    barGhost: "rgba(255,120,60,0.15)",
    tokenBg: "rgba(224,226,220,0.06)",
    tokenBorder: "rgba(224,226,220,0.12)",
    tokenNewBg: "rgba(212,255,0,0.12)",
  };
}

function lightColors(): ThemeColors {
  return {
    bg: "#f5f1e8",
    cacheFilled: "rgba(42,138,14,0.1)",
    cacheNew: "rgba(42,138,14,0.5)",
    recompute: "rgba(200,80,30,0.3)",
    queryArrow: "rgba(42,138,14,0.25)",
    text: "rgba(10,10,10,0.6)",
    textBright: "rgba(10,10,10,0.8)",
    textDim: "rgba(10,10,10,0.3)",
    gridLine: "rgba(10,10,10,0.06)",
    barFill: "rgba(42,138,14,0.25)",
    barGhost: "rgba(200,80,30,0.12)",
    tokenBg: "rgba(10,10,10,0.04)",
    tokenBorder: "rgba(10,10,10,0.1)",
    tokenNewBg: "rgba(42,138,14,0.08)",
  };
}

/* ────────────────────────────────────────────
   Easing
   ──────────────────────────────────────────── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/* ────────────────────────────────────────────
   Simulation state
   ──────────────────────────────────────────── */

interface SimState {
  tokens: string[];
  currentStep: number;
  cached: boolean;
  paused: boolean;
  speed: number;

  // Animation timing
  stepStartTime: number;
  stepDuration: number;

  // Per-row animation progress [0..1]
  rowProgress: Float64Array;
  // Per-column fill progress for current row [0..1]
  colProgress: Float64Array;
  // Recompute sweep progress (no-cache mode)
  recomputeRow: number;
  recomputeProgress: number;

  // Attention arrow animation
  arrowProgress: number;

  // Token appearance opacity [0..1]
  tokenOpacity: Float64Array;

  // Performance counters
  cachedOps: number;
  uncachedOps: number;

  // Finish state
  done: boolean;
}

function createSim(): SimState {
  return {
    tokens: [],
    currentStep: -1,
    cached: true,
    paused: false,
    speed: 1,
    stepStartTime: 0,
    stepDuration: 800,
    rowProgress: new Float64Array(MAX_TOKENS),
    colProgress: new Float64Array(NUM_HEADS),
    recomputeRow: 0,
    recomputeProgress: 0,
    arrowProgress: 0,
    tokenOpacity: new Float64Array(MAX_TOKENS),
    cachedOps: 0,
    uncachedOps: 0,
    done: false,
  };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function KvCache({ info }: { info?: ReactNode }) {
  const { canvasRef, sizeRef } = useLabCanvas();
  const simRef = useRef<SimState>(createSim());
  const rafRef = useRef<number>(0);

  const [cached, setCached] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  // Live telemetry, lifted from the sim for the readout HUD.
  const [metrics, setMetrics] = useState({ step: 0, cacheKB: 0, tps: 0, ghostTps: 0 });

  /* ── Generate token sequence ── */
  const generateTokens = useCallback((): string[] => {
    const tokens: string[] = [];
    for (let i = 0; i < MAX_TOKENS; i++) {
      tokens.push(VOCAB[Math.floor(Math.random() * VOCAB.length)]);
    }
    return tokens;
  }, []);

  /* ── Reset simulation ── */
  const reset = useCallback(() => {
    const s = simRef.current;
    s.tokens = generateTokens();
    s.currentStep = -1;
    s.stepStartTime = performance.now();
    s.rowProgress.fill(0);
    s.colProgress.fill(0);
    s.recomputeRow = 0;
    s.recomputeProgress = 0;
    s.arrowProgress = 0;
    s.tokenOpacity.fill(0);
    s.cachedOps = 0;
    s.uncachedOps = 0;
    s.done = false;
    s.paused = false;
    setPaused(false);
  }, [generateTokens]);

  /* ── Toggle cached mode ── */
  const toggleCached = useCallback(
    (next: boolean) => {
      const s = simRef.current;
      s.cached = next;
      setCached(next);
      reset();
    },
    [reset],
  );

  /* ── Toggle pause ── */
  const togglePause = useCallback(() => {
    const s = simRef.current;
    s.paused = !s.paused;
    if (!s.paused) {
      // Reset step timing so it doesn't jump ahead
      s.stepStartTime = performance.now();
    }
    setPaused(s.paused);
  }, []);

  /* ── Main effect: canvas + animation loop ── */
  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;
    const s = simRef.current;

    // Initialize
    s.tokens = generateTokens();
    s.stepStartTime = performance.now();

    /* ── Render loop ── */
    function render(now: number) {
      rafRef.current = requestAnimationFrame(render);

      const size = sizeRef.current;
      const dpr = size.dpr || 1;
      const W = size.width / dpr;
      const H = size.height / dpr;

      if (W === 0 || H === 0) return;

      // Draw in CSS-pixel space; the hook keeps the backing store at device px.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isDark = getTheme() === "dark";
      const colors = isDark ? darkColors() : lightColors();

      // Clear (full-bleed background)
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // Safe content rect (CSS px) — keep meaningful content below the readout
      // HUD band at top and above the control strip at bottom.
      const bounds = labBounds(W, H, 1);

      // Layout calculations
      const tokenAreaWidth = Math.min(280, W * 0.2);
      const barAreaWidth = Math.min(120, W * 0.1);
      const matrixAreaWidth = W - tokenAreaWidth - barAreaWidth - 80;
      const matrixLeft = tokenAreaWidth + 30;
      const barLeft = W - barAreaWidth - 20;

      // Reserve a band at the top of the content rect for the section labels so
      // they clear the readout HUD (which floats at top-right); the matrix
      // re-centers in the remaining height instead of hugging the old navbar.
      const labelBand = 64;
      const matrixTop = bounds.y + labelBand;
      const matrixHeight = bounds.bottom - matrixTop;

      const cellW = Math.max(4, Math.min(24, (matrixAreaWidth - 20) / NUM_HEADS));
      const cellH = Math.max(3, Math.min(14, (matrixHeight - 20) / MAX_TOKENS));
      const matrixW = cellW * NUM_HEADS;
      const matrixH = cellH * MAX_TOKENS;

      // Center matrix horizontally in its area, vertically in the content rect
      const mxStart = matrixLeft + (matrixAreaWidth - matrixW) / 2;
      const myStart = matrixTop + (matrixHeight - matrixH) / 2;

      /* ── Advance simulation ── */
      if (!s.paused && !s.done) {
        const elapsed = (now - s.stepStartTime) * s.speed;
        const stepDur = s.stepDuration;

        if (s.currentStep < 0) {
          // Initial delay before first token
          if (elapsed > 400) {
            s.currentStep = 0;
            s.stepStartTime = now;
          }
        } else {
          const stepProgress = Math.min(1, elapsed / stepDur);

          // Current token being generated
          const ci = s.currentStep;

          // Token fade-in (quick)
          s.tokenOpacity[ci] = Math.min(1, stepProgress * 3);

          if (s.cached) {
            /* ── CACHED MODE ── */
            // Phase 1 (0-0.5): Fill new row columns left-to-right
            // Phase 2 (0.5-1.0): Attention arrows from new row to all cached rows
            if (stepProgress < 0.5) {
              const fillProgress = easeOutCubic(stepProgress / 0.5);
              for (let c = 0; c < NUM_HEADS; c++) {
                const colStart = c / NUM_HEADS;
                const colEnd = (c + 1) / NUM_HEADS;
                const colP = Math.max(
                  0,
                  Math.min(1, (fillProgress - colStart) / (colEnd - colStart)),
                );
                s.colProgress[c] = colP;
              }
              s.arrowProgress = 0;
            } else {
              // Row is fully filled
              s.colProgress.fill(1);
              s.rowProgress[ci] = 1;
              s.arrowProgress = easeInOutQuad((stepProgress - 0.5) / 0.5);
            }

            s.cachedOps += 1;
            s.uncachedOps += ci + 1;
          } else {
            /* ── NO-CACHE MODE ── */
            // Phase 1 (0-0.7): Sweep recompute all rows top-to-bottom
            // Phase 2 (0.7-1.0): New row fills + arrows
            if (stepProgress < 0.7) {
              const sweepProgress = easeOutCubic(stepProgress / 0.7);
              s.recomputeRow = Math.floor(sweepProgress * (ci + 1));
              s.recomputeProgress = sweepProgress;
              s.arrowProgress = 0;
              s.colProgress.fill(0);
            } else {
              s.recomputeRow = ci + 1;
              s.recomputeProgress = 1;
              const tailProgress = (stepProgress - 0.7) / 0.3;
              // Fill new row
              for (let c = 0; c < NUM_HEADS; c++) {
                const colStart = c / NUM_HEADS;
                const colEnd = (c + 1) / NUM_HEADS;
                const colP = Math.max(
                  0,
                  Math.min(1, (easeOutCubic(tailProgress) - colStart) / (colEnd - colStart)),
                );
                s.colProgress[c] = colP;
              }
              if (tailProgress > 0.5) {
                s.arrowProgress = easeInOutQuad((tailProgress - 0.5) / 0.5);
              }
              s.rowProgress[ci] = tailProgress;
            }

            s.cachedOps += 1;
            s.uncachedOps += ci + 1;
          }

          // Step complete
          if (stepProgress >= 1) {
            s.rowProgress[ci] = 1;
            s.colProgress.fill(0);
            s.tokenOpacity[ci] = 1;
            s.arrowProgress = 0;
            s.recomputeRow = 0;
            s.recomputeProgress = 0;

            if (ci + 1 >= MAX_TOKENS) {
              s.done = true;
            } else {
              s.currentStep = ci + 1;
              s.stepStartTime = now;
            }
          }
        }
      }

      const ci = Math.max(0, s.currentStep);

      /* ── Draw: Token sequence (left) ── */
      const tokenH = Math.min(16, cellH);
      const tokenGap = 2;
      const tokenX = 20;
      const maxVisible = Math.floor(matrixHeight / (tokenH + tokenGap));
      const startToken = Math.max(0, ci - maxVisible + 3);

      ctx.save();
      // Label
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "left";
      ctx.fillText("TOKEN SEQUENCE", tokenX, matrixTop - 14);

      for (let i = startToken; i <= ci && i < s.tokens.length; i++) {
        const tokenY = myStart + (i - startToken) * (tokenH + tokenGap);
        if (tokenY > myStart + matrixH) break;

        const opacity = s.tokenOpacity[i] || (i < ci ? 1 : 0);
        if (opacity <= 0) continue;

        const isCurrentToken = i === ci;
        ctx.globalAlpha = opacity;

        // Token background
        ctx.fillStyle = isCurrentToken ? colors.tokenNewBg : colors.tokenBg;
        const tw = tokenAreaWidth - 40;
        ctx.beginPath();
        roundRect(ctx, tokenX, tokenY, tw, tokenH, 2);
        ctx.fill();

        // Token border
        ctx.strokeStyle = isCurrentToken ? colors.cacheNew : colors.tokenBorder;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        roundRect(ctx, tokenX, tokenY, tw, tokenH, 2);
        ctx.stroke();

        // Token label
        ctx.fillStyle = isCurrentToken ? colors.textBright : colors.text;
        ctx.font = `${Math.max(8, tokenH - 4)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const label = s.tokens[i].replace("▁", "");
        ctx.fillText(label, tokenX + 5, tokenY + tokenH / 2 + 0.5);

        // Position number
        ctx.fillStyle = colors.textDim;
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(String(i), tokenX + tw - 4, tokenY + tokenH / 2 + 0.5);

        ctx.globalAlpha = 1;
      }
      ctx.restore();

      /* ── Draw: KV Cache Matrix (center) ── */
      ctx.save();

      // Matrix label
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.fillText("KV CACHE", mxStart + matrixW / 2, matrixTop - 14);

      // Column headers (head indices)
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      for (let c = 0; c < NUM_HEADS; c++) {
        if (c % 4 === 0) {
          ctx.fillText(`h${c}`, mxStart + c * cellW + cellW / 2, myStart - 4);
        }
      }

      // Grid lines
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= MAX_TOKENS; r++) {
        const y = myStart + r * cellH;
        ctx.beginPath();
        ctx.moveTo(mxStart, y);
        ctx.lineTo(mxStart + matrixW, y);
        ctx.stroke();
      }
      for (let c = 0; c <= NUM_HEADS; c++) {
        const x = mxStart + c * cellW;
        ctx.beginPath();
        ctx.moveTo(x, myStart);
        ctx.lineTo(x, myStart + matrixH);
        ctx.stroke();
      }

      // Filled rows (previous tokens, already cached)
      for (let r = 0; r < ci; r++) {
        const rp = s.rowProgress[r];
        if (rp <= 0) continue;

        for (let c = 0; c < NUM_HEADS; c++) {
          const x = mxStart + c * cellW + 0.5;
          const y = myStart + r * cellH + 0.5;
          const w = cellW - 1;
          const h = cellH - 1;

          // In no-cache mode, show recomputation sweep
          if (!s.cached && s.recomputeProgress > 0 && r < s.recomputeRow) {
            ctx.fillStyle = colors.recompute;
            ctx.fillRect(x, y, w, h);
          } else {
            ctx.fillStyle = colors.cacheFilled;
            ctx.fillRect(x, y, w, h);
          }
        }
      }

      // Current row animation (filling columns)
      if (s.currentStep >= 0 && !s.done) {
        const r = ci;
        for (let c = 0; c < NUM_HEADS; c++) {
          const cp = s.colProgress[c];
          if (cp <= 0) continue;

          const x = mxStart + c * cellW + 0.5;
          const y = myStart + r * cellH + 0.5;
          const w = cellW - 1;
          const h = cellH - 1;

          ctx.globalAlpha = cp;
          ctx.fillStyle = colors.cacheNew;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1;
        }
      }

      // Attention arrows: from current token's query to all cached keys
      if (s.arrowProgress > 0 && s.currentStep > 0) {
        const queryY = myStart + ci * cellH + cellH / 2;
        const queryX = mxStart + matrixW + 8;

        ctx.strokeStyle = colors.queryArrow;
        ctx.lineWidth = 1;

        const numArrows = Math.min(ci, Math.ceil(s.arrowProgress * ci));
        for (let r = 0; r < numArrows; r++) {
          const targetY = myStart + r * cellH + cellH / 2;
          const targetX = mxStart + matrixW + 4;

          // Compute per-arrow opacity: arrows near the top appear first
          const arrowT = r / Math.max(1, ci - 1);
          const arrowOpacity = Math.max(0, Math.min(1, (s.arrowProgress - arrowT * 0.5) / 0.5));
          if (arrowOpacity <= 0) continue;

          ctx.globalAlpha = arrowOpacity * 0.6;
          ctx.beginPath();
          // Curved arrow from query row out and back to target row
          const cpX = queryX + 12 + Math.abs(queryY - targetY) * 0.08;
          ctx.moveTo(queryX, queryY);
          ctx.quadraticCurveTo(cpX, (queryY + targetY) / 2, targetX, targetY);
          ctx.stroke();

          // Small arrowhead
          const angle = Math.atan2(targetY - (queryY + targetY) / 2, targetX - cpX);
          const headLen = 4;
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(
            targetX - headLen * Math.cos(angle - 0.4),
            targetY - headLen * Math.sin(angle - 0.4),
          );
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(
            targetX - headLen * Math.cos(angle + 0.4),
            targetY - headLen * Math.sin(angle + 0.4),
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Query label
        ctx.fillStyle = colors.cacheNew;
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.globalAlpha = s.arrowProgress;
        ctx.fillText("Q", queryX + 2, queryY - 6);
        ctx.globalAlpha = 1;
      }

      // Row position labels (every 8th)
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "right";
      for (let r = 0; r < MAX_TOKENS; r += 8) {
        ctx.fillText(String(r), mxStart - 4, myStart + r * cellH + cellH / 2 + 2);
      }

      ctx.restore();

      /* ── Draw: Memory bars (right) ── */
      ctx.save();
      const barW = 28;
      const barH = matrixH;
      const barTop = myStart;
      const barX1 = barLeft;
      const barX2 = barLeft + barW + 16;

      // Labels
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.fillText("MEM", barX1 + barW / 2, matrixTop - 14);
      ctx.fillText("OPS", barX2 + barW / 2, matrixTop - 14);

      // Memory bar outline
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX1, barTop, barW, barH);
      ctx.strokeRect(barX2, barTop, barW, barH);

      // Memory fill (linear growth with tokens)
      const memFraction = (ci + 1) / MAX_TOKENS;
      const memFillH = memFraction * barH;
      ctx.fillStyle = colors.barFill;
      ctx.fillRect(barX1, barTop + barH - memFillH, barW, memFillH);

      // Operations bar: cached = linear, uncached = quadratic
      // For visual clarity, we show the divergence
      const cachedFraction = memFraction; // O(n) -- one compute per token
      const uncachedFraction = Math.min(1, ((ci + 1) * (ci + 2)) / (MAX_TOKENS * (MAX_TOKENS + 1))); // O(n^2)

      if (s.cached) {
        // Show cached ops as main bar, ghost shows uncached cost
        const opsFillH = cachedFraction * barH;
        ctx.fillStyle = colors.barFill;
        ctx.fillRect(barX2, barTop + barH - opsFillH, barW, opsFillH);

        // Ghost bar for uncached
        const ghostFillH = uncachedFraction * barH;
        ctx.fillStyle = colors.barGhost;
        ctx.fillRect(barX2 + 2, barTop + barH - ghostFillH, barW - 4, ghostFillH);
      } else {
        // Show uncached ops as main bar, ghost shows cached savings
        const opsFillH = uncachedFraction * barH;
        ctx.fillStyle = colors.recompute;
        ctx.fillRect(barX2, barTop + barH - opsFillH, barW, opsFillH);

        // Ghost bar for cached
        const ghostFillH = cachedFraction * barH;
        ctx.fillStyle = colors.barFill;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(barX2 + 2, barTop + barH - ghostFillH, barW - 4, ghostFillH);
        ctx.globalAlpha = 1;
      }

      // Bar labels at bottom
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.fillText("O(n)", barX1 + barW / 2, barTop + barH + 14);

      if (s.cached) {
        ctx.fillStyle = colors.cacheNew;
        ctx.fillText("O(n)", barX2 + barW / 2, barTop + barH + 14);
        ctx.fillStyle = colors.textDim;
        ctx.font = "6px 'JetBrains Mono', monospace";
        ctx.fillText("(ghost: O(n²))", barX2 + barW / 2, barTop + barH + 24);
      } else {
        ctx.fillStyle = colors.recompute;
        ctx.fillText("O(n²)", barX2 + barW / 2, barTop + barH + 14);
        ctx.fillStyle = colors.textDim;
        ctx.font = "6px 'JetBrains Mono', monospace";
        ctx.fillText("(ghost: O(n))", barX2 + barW / 2, barTop + barH + 24);
      }

      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, sizeRef, generateTokens]);

  /* ── Keyboard: space = pause, r = reset ── (f/fullscreen + ?/how-it-works live in LabChrome) */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePause();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePause, reset]);

  /* ── Lift sim telemetry to React state for the readout HUD ── */
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = simRef.current;
      const ci = Math.max(0, s.currentStep);
      const step = Math.min(s.currentStep + 1, MAX_TOKENS);
      // ~2 * d_head bytes per KV pair
      const cacheKB = ((ci + 1) * NUM_HEADS * 2 * 64) / 1024;
      const cachedTps = (1000 / s.stepDuration) * s.speed;
      const uncachedTps = cachedTps / Math.max(1, ci * 0.3 + 1);
      // The "live" throughput depends on the active mode; the ghost is the foil.
      const tps = s.cached ? cachedTps : uncachedTps;
      const ghostTps = s.cached ? uncachedTps : cachedTps;
      setMetrics({ step, cacheKB, tps, ghostTps });
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  /* ── Sync React state → sim ── */
  useEffect(() => {
    simRef.current.cached = cached;
  }, [cached]);

  useEffect(() => {
    simRef.current.speed = speed;
  }, [speed]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      <LabReadout corner="right">
        <Gauge
          label={cached ? "cached" : "uncached"}
          value={metrics.tps.toFixed(1)}
          unit="tok/s"
          primary
        />
        <Gauge
          label={cached ? "uncached" : "cached"}
          value={metrics.ghostTps.toFixed(1)}
          unit="tok/s"
        />
        <Gauge label="cache" value={metrics.cacheKB.toFixed(0)} unit="KB" />
        <ProgressGauge label="tokens" value={metrics.step} total={MAX_TOKENS} />
      </LabReadout>

      <LabChrome identity={{ name: "kv cache", scent: "cache · recompute" }} info={info}>
        <ControlGroup label="mode">
          <Toggle label={cached ? "cached" : "no cache"} pressed={cached} onChange={toggleCached} />
        </ControlGroup>
        <ControlGroup label="rate">
          <LabSlider
            label="speed"
            min={1}
            max={8}
            value={speed}
            onChange={setSpeed}
            format={(v) => `${v}x`}
          />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Transport playing={!paused} onToggle={togglePause} onReset={reset} />
        </ControlGroup>
      </LabChrome>
    </>
  );
}

/* ── Canvas helper: rounded rect ── */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
