"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Mixture of Experts Routing — Canvas2D

   Visualises sparse routing in MoE transformer
   layers: a learned router assigns each token to
   the top-K of N expert sub-networks, so only a
   fraction of total parameters activate per token.
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   Token vocabularies per input type
   ──────────────────────────────────────────── */

const TOKENS: Record<InputType, string[]> = {
  code: ["fn", "main", "()", "{", "let", "x", "=", "42", ";", "print", "!", "(", "x", ")", "}"],
  prose: [
    "The",
    "quick",
    "brown",
    "fox",
    "jumps",
    "over",
    "the",
    "lazy",
    "dog",
    "and",
    "runs",
    "away",
  ],
  math: [
    "\u222B",
    "f(x)",
    "dx",
    "=",
    "lim",
    "\u03A3",
    "n\u2192\u221E",
    "\u0394x",
    "\u00B7",
    "f(x\u1D62)",
    "+",
    "C",
  ],
  mixed: [],
};

// Build mixed from all three, interleaved
{
  const code = TOKENS.code;
  const prose = TOKENS.prose;
  const math = TOKENS.math;
  const maxLen = Math.max(code.length, prose.length, math.length);
  const mixed: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < code.length) mixed.push(code[i]);
    if (i < prose.length) mixed.push(prose[i]);
    if (i < math.length) mixed.push(math[i]);
  }
  TOKENS.mixed = mixed;
}

type InputType = "code" | "prose" | "math" | "mixed";
const INPUT_TYPES: InputType[] = ["code", "prose", "math", "mixed"];

/* ────────────────────────────────────────────
   Routing affinity matrices
   Row = expert index, Col = input type (0=code, 1=prose, 2=math)
   Higher value = stronger affinity. Values 0-1.
   ──────────────────────────────────────────── */

function buildAffinityMatrix(numExperts: number): number[][] {
  // For 8 experts:
  //   code  -> experts 0,1,3 (high affinity)
  //   prose -> experts 2,4,5
  //   math  -> experts 1,6,7
  // For 16 experts, double up the pattern with slight variations
  const matrix: number[][] = [];

  for (let e = 0; e < numExperts; e++) {
    const row = [0.1, 0.1, 0.1]; // base affinity for [code, prose, math]

    if (numExperts <= 8) {
      // 8-expert layout
      switch (e) {
        case 0:
          row[0] = 0.9;
          row[1] = 0.15;
          row[2] = 0.2;
          break;
        case 1:
          row[0] = 0.75;
          row[1] = 0.1;
          row[2] = 0.7;
          break;
        case 2:
          row[0] = 0.15;
          row[1] = 0.85;
          row[2] = 0.1;
          break;
        case 3:
          row[0] = 0.8;
          row[1] = 0.2;
          row[2] = 0.15;
          break;
        case 4:
          row[0] = 0.1;
          row[1] = 0.8;
          row[2] = 0.2;
          break;
        case 5:
          row[0] = 0.2;
          row[1] = 0.75;
          row[2] = 0.15;
          break;
        case 6:
          row[0] = 0.1;
          row[1] = 0.15;
          row[2] = 0.85;
          break;
        case 7:
          row[0] = 0.15;
          row[1] = 0.1;
          row[2] = 0.8;
          break;
      }
    } else {
      // 16-expert layout: spread specialization wider
      const group = e % 8;
      const variant = e < 8 ? 0 : 0.1;
      switch (group) {
        case 0:
          row[0] = 0.9 - variant;
          row[1] = 0.12;
          row[2] = 0.15;
          break;
        case 1:
          row[0] = 0.7 - variant;
          row[1] = 0.1;
          row[2] = 0.65 + variant;
          break;
        case 2:
          row[0] = 0.12;
          row[1] = 0.85 - variant;
          row[2] = 0.1;
          break;
        case 3:
          row[0] = 0.8 - variant;
          row[1] = 0.18;
          row[2] = 0.12;
          break;
        case 4:
          row[0] = 0.1;
          row[1] = 0.78 + variant;
          row[2] = 0.18;
          break;
        case 5:
          row[0] = 0.18;
          row[1] = 0.72 - variant;
          row[2] = 0.12;
          break;
        case 6:
          row[0] = 0.1;
          row[1] = 0.12;
          row[2] = 0.88 - variant;
          break;
        case 7:
          row[0] = 0.12;
          row[1] = 0.1;
          row[2] = 0.82 + variant;
          break;
      }
    }

    matrix.push(row);
  }

  return matrix;
}

/* ────────────────────────────────────────────
   Gaussian noise helper
   ──────────────────────────────────────────── */

function gaussianNoise(sigma: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/* ────────────────────────────────────────────
   Softmax
   ──────────────────────────────────────────── */

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ────────────────────────────────────────────
   Color palettes
   ──────────────────────────────────────────── */

interface ThemeColors {
  bg: string;
  tokenParticle: string;
  tokenParticleAlpha: number;
  pathDim: string;
  pathActive: string;
  expertActive: string;
  expertInactive: string;
  routerGate: string;
  heatCold: string;
  heatHot: string;
  text: string;
  textDim: string;
}

const DARK_COLORS: ThemeColors = {
  bg: "#0a0a0a",
  tokenParticle: "rgba(212,255,0,0.8)",
  tokenParticleAlpha: 0.8,
  pathDim: "rgba(212,255,0,0.2)",
  pathActive: "rgba(212,255,0,0.5)",
  expertActive: "rgba(212,255,0,0.15)",
  expertInactive: "rgba(224,226,220,0.03)",
  routerGate: "rgba(224,226,220,0.08)",
  heatCold: "rgba(224,226,220,0.05)",
  heatHot: "rgba(212,255,0,0.6)",
  text: "rgba(224,226,220,0.7)",
  textDim: "rgba(224,226,220,0.35)",
};

const LIGHT_COLORS: ThemeColors = {
  bg: "#f5f1e8",
  tokenParticle: "rgba(42,138,14,0.7)",
  tokenParticleAlpha: 0.7,
  pathDim: "rgba(42,138,14,0.15)",
  pathActive: "rgba(42,138,14,0.4)",
  expertActive: "rgba(42,138,14,0.1)",
  expertInactive: "rgba(10,10,10,0.02)",
  routerGate: "rgba(10,10,10,0.05)",
  heatCold: "rgba(10,10,10,0.03)",
  heatHot: "rgba(42,138,14,0.5)",
  text: "rgba(10,10,10,0.6)",
  textDim: "rgba(10,10,10,0.3)",
};

/* ────────────────────────────────────────────
   Animation state types
   ──────────────────────────────────────────── */

interface ActiveToken {
  label: string;
  inputTypeIndex: number; // 0=code, 1=prose, 2=math
  phase: "enter" | "route" | "fan" | "travel" | "pulse" | "exit";
  phaseStart: number; // timestamp ms when current phase began
  routerScores: number[]; // softmax probabilities for all experts
  topKExperts: number[]; // indices of chosen experts
  // Positions (in canvas-space, pre-DPR)
  x: number;
  y: number;
  // Travel particles: one per top-K expert
  particles: { x: number; y: number; targetExpert: number; progress: number }[];
  // Exit particles
  exitParticles: { x: number; y: number; progress: number }[];
}

interface SimState {
  numExperts: number;
  topK: number;
  inputType: InputType;
  affinityMatrix: number[][];
  expertLoads: number[]; // cumulative load per expert
  totalTokens: number;
  tokenIndex: number; // index into current token list
  paused: boolean;
  activeToken: ActiveToken | null;
  lastTokenTime: number;
  tokenInterval: number; // ms per token cycle
  // Layout metrics (updated on resize)
  layout: LayoutMetrics;
  // Persistent dim paths for recently-routed tokens (fade out)
  persistentPaths: PersistentPath[];
}

interface PersistentPath {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  cpX: number;
  cpY: number;
  alpha: number;
  expertIndex: number;
}

interface LayoutMetrics {
  w: number;
  h: number;
  dpr: number;
  tokenStartX: number;
  routerX: number;
  routerW: number;
  expertStartX: number;
  expertEndX: number;
  expertSpacing: number;
  expertW: number;
  expertTop: number;
  expertBottom: number;
  outputX: number;
  heatmapY: number;
  heatmapH: number;
}

/* ────────────────────────────────────────────
   Layout calculation
   ──────────────────────────────────────────── */

function computeLayout(w: number, h: number, dpr: number, numExperts: number): LayoutMetrics {
  const navH = 52 * dpr;
  const margin = 60 * dpr;
  const tokenStartX = margin;
  const routerX = w * 0.22;
  const routerW = 6 * dpr;
  const expertStartX = w * 0.35;
  const expertEndX = w * 0.78;
  const outputX = w * 0.9;
  const expertSpacing = numExperts > 1 ? (expertEndX - expertStartX) / (numExperts - 1) : 0;
  const expertW = Math.max(4 * dpr, Math.min(16 * dpr, expertSpacing * 0.5));
  const expertTop = navH + 24 * dpr;
  const expertBottom = h * 0.72;
  const heatmapY = h * 0.78;
  const heatmapH = 24 * dpr;

  return {
    w,
    h,
    dpr,
    tokenStartX,
    routerX,
    routerW,
    expertStartX,
    expertEndX,
    expertSpacing,
    expertW,
    expertTop,
    expertBottom,
    outputX,
    heatmapY,
    heatmapH,
  };
}

/* ────────────────────────────────────────────
   Determine input type index for routing
   ──────────────────────────────────────────── */

function getInputTypeIndex(inputType: InputType, label: string): number {
  if (inputType !== "mixed") {
    return inputType === "code" ? 0 : inputType === "prose" ? 1 : 2;
  }
  // For mixed: check which vocabulary the token came from
  if (TOKENS.code.includes(label)) return 0;
  if (TOKENS.prose.includes(label)) return 1;
  return 2;
}

/* ────────────────────────────────────────────
   Route a token: compute scores, apply softmax, pick top-K
   ──────────────────────────────────────────── */

function routeToken(
  affinityMatrix: number[][],
  inputTypeIndex: number,
  numExperts: number,
  topK: number,
): { scores: number[]; topKExperts: number[] } {
  const rawScores: number[] = [];
  for (let e = 0; e < numExperts; e++) {
    const affinity = affinityMatrix[e]?.[inputTypeIndex] ?? 0.1;
    rawScores.push(affinity * 3 + gaussianNoise(0.3)); // scale up + noise
  }

  const scores = softmax(rawScores);

  // Pick top-K
  const indexed = scores.map((s, i) => ({ s, i }));
  indexed.sort((a, b) => b.s - a.s);
  const topKExperts = indexed.slice(0, topK).map((x) => x.i);

  return { scores, topKExperts };
}

/* ────────────────────────────────────────────
   Easing functions
   ──────────────────────────────────────────── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/* ────────────────────────────────────────────
   Bezier curve helpers
   ──────────────────────────────────────────── */

function quadBezierPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

/* ────────────────────────────────────────────
   Phase durations (ms)
   ──────────────────────────────────────────── */

const PHASE_ENTER = 200;
const PHASE_FAN = 180;
const PHASE_TRAVEL = 420;
const PHASE_PULSE = 200;
const PHASE_EXIT = 200;
const TOKEN_INTERVAL = 1200;

/* ────────────────────────────────────────────
   Draw radial probability chart
   ──────────────────────────────────────────── */

function drawRadialScores(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scores: number[],
  topKExperts: number[],
  progress: number, // 0..1
  colors: ThemeColors,
  dpr: number,
) {
  const numExperts = scores.length;
  const maxRadius = 30 * dpr;
  const sliceAngle = (Math.PI * 2) / numExperts;
  const fadeAlpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

  ctx.save();
  ctx.globalAlpha = fadeAlpha * 0.7;

  for (let i = 0; i < numExperts; i++) {
    const angle = -Math.PI / 2 + i * sliceAngle;
    const radius = maxRadius * (scores[i] ?? 0) * progress;
    const isTopK = topKExperts.includes(i);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
    ctx.closePath();

    ctx.fillStyle = isTopK ? colors.pathActive : colors.pathDim;
    ctx.fill();
  }

  ctx.restore();
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function MoeRouting() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<SimState>({
    numExperts: 8,
    topK: 2,
    inputType: "code",
    affinityMatrix: buildAffinityMatrix(8),
    expertLoads: Array.from({ length: 8 }, () => 0),
    totalTokens: 0,
    tokenIndex: 0,
    paused: false,
    activeToken: null,
    lastTokenTime: 0,
    tokenInterval: TOKEN_INTERVAL,
    layout: computeLayout(800, 600, 1, 8),
    persistentPaths: [],
  });

  const [numExperts, setNumExperts] = useState(8);
  const [topK, setTopK] = useState(2);
  const [inputType, setInputType] = useState<InputType>("code");

  /* ── Initializer ── */

  const initSim = useCallback((w: number, h: number, dpr: number) => {
    const s = simRef.current;
    s.layout = computeLayout(w, h, dpr, s.numExperts);
    s.expertLoads = Array.from({ length: s.numExperts }, () => 0);
    s.totalTokens = 0;
    s.tokenIndex = 0;
    s.activeToken = null;
    s.lastTokenTime = 0;
    s.persistentPaths = [];
  }, []);

  /* ── Reset handler ── */

  const reset = useCallback(() => {
    const s = simRef.current;
    s.affinityMatrix = buildAffinityMatrix(s.numExperts);
    const canvas = canvasRef.current;
    if (canvas) {
      initSim(canvas.width, canvas.height, window.devicePixelRatio || 1);
    }
  }, [initSim]);

  /* ── Animation loop ── */

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;

    /* Size canvas */
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    s.layout = computeLayout(canvas.width, canvas.height, dpr, s.numExperts);

    /* Resize observer */
    const observer = new ResizeObserver(([entry]) => {
      const dp = window.devicePixelRatio || 1;
      const newW = Math.round(entry.contentRect.width * dp);
      const newH = Math.round(entry.contentRect.height * dp);
      canvas.width = newW;
      canvas.height = newH;
      s.layout = computeLayout(newW, newH, dp, s.numExperts);
    });
    observer.observe(canvas);

    /* Animation state */
    let raf = 0;
    let lastFrameTime = performance.now();

    function getExpertCenterX(expertIdx: number): number {
      const { expertStartX, expertSpacing } = s.layout;
      return expertStartX + expertIdx * expertSpacing;
    }

    function getExpertCenterY(): number {
      const { expertTop, expertBottom } = s.layout;
      return (expertTop + expertBottom) / 2;
    }

    function getControlPointForExpert(
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      expertIdx: number,
    ): { x: number; y: number } {
      const midX = (fromX + toX) / 2;
      const { expertTop, expertBottom } = s.layout;
      const expertRange = expertBottom - expertTop;
      // Offset the control point vertically based on expert position
      const normalizedIdx = s.numExperts > 1 ? expertIdx / (s.numExperts - 1) : 0.5;
      const verticalOffset = (normalizedIdx - 0.5) * expertRange * 0.5;
      const midY = (fromY + toY) / 2 + verticalOffset;
      return { x: midX, y: midY };
    }

    function advanceToken(now: number) {
      if (s.paused) return;

      const at = s.activeToken;
      if (!at) {
        // Spawn new token
        if (now - s.lastTokenTime < s.tokenInterval) return;

        const tokenList = TOKENS[s.inputType];
        const label = tokenList[s.tokenIndex % tokenList.length];
        s.tokenIndex++;

        const inputTypeIdx = getInputTypeIndex(s.inputType, label);
        const { layout } = s;
        const routerCenterY = (layout.expertTop + layout.expertBottom) / 2;

        s.activeToken = {
          label,
          inputTypeIndex: inputTypeIdx,
          phase: "enter",
          phaseStart: now,
          routerScores: [],
          topKExperts: [],
          x: layout.tokenStartX - 40 * layout.dpr,
          y: routerCenterY + gaussianNoise(20 * layout.dpr),
          particles: [],
          exitParticles: [],
        };
        return;
      }

      const elapsed = now - at.phaseStart;
      const { layout } = s;

      switch (at.phase) {
        case "enter": {
          const t = Math.min(1, elapsed / PHASE_ENTER);
          const eased = easeOutCubic(t);
          at.x =
            layout.tokenStartX -
            40 * layout.dpr +
            eased * (layout.routerX - (layout.tokenStartX - 40 * layout.dpr));
          if (t >= 1) {
            // Compute routing
            const { scores, topKExperts } = routeToken(
              s.affinityMatrix,
              at.inputTypeIndex,
              s.numExperts,
              s.topK,
            );
            at.routerScores = scores;
            at.topKExperts = topKExperts;
            at.phase = "fan";
            at.phaseStart = now;
          }
          break;
        }

        case "fan": {
          const t = Math.min(1, elapsed / PHASE_FAN);
          if (t >= 1) {
            // Set up travel particles
            at.particles = at.topKExperts.map((expertIdx) => ({
              x: layout.routerX + layout.routerW,
              y: at.y,
              targetExpert: expertIdx,
              progress: 0,
            }));
            at.phase = "travel";
            at.phaseStart = now;
          }
          break;
        }

        case "travel": {
          const t = Math.min(1, elapsed / PHASE_TRAVEL);
          const eased = easeInOutCubic(t);

          for (const p of at.particles) {
            const fromX = layout.routerX + layout.routerW;
            const fromY = at.y;
            const toX = getExpertCenterX(p.targetExpert);
            const toY = getExpertCenterY();
            const cp = getControlPointForExpert(fromX, fromY, toX, toY, p.targetExpert);

            const pos = quadBezierPoint(fromX, fromY, cp.x, cp.y, toX, toY, eased);
            p.x = pos.x;
            p.y = pos.y;
            p.progress = eased;
          }

          if (t >= 1) {
            // Record loads
            for (const expertIdx of at.topKExperts) {
              s.expertLoads[expertIdx] = (s.expertLoads[expertIdx] ?? 0) + 1;
            }
            s.totalTokens++;

            // Add persistent paths
            for (const expertIdx of at.topKExperts) {
              const fromX = layout.routerX + layout.routerW;
              const fromY = at.y;
              const toX = getExpertCenterX(expertIdx);
              const toY = getExpertCenterY();
              const cp = getControlPointForExpert(fromX, fromY, toX, toY, expertIdx);

              s.persistentPaths.push({
                fromX,
                fromY,
                toX,
                toY,
                cpX: cp.x,
                cpY: cp.y,
                alpha: 0.4,
                expertIndex: expertIdx,
              });
            }

            at.phase = "pulse";
            at.phaseStart = now;
          }
          break;
        }

        case "pulse": {
          const t = Math.min(1, elapsed / PHASE_PULSE);
          if (t >= 1) {
            // Set up exit particles from each expert
            at.exitParticles = at.topKExperts.map((expertIdx) => ({
              x: getExpertCenterX(expertIdx),
              y: getExpertCenterY(),
              progress: 0,
            }));
            at.phase = "exit";
            at.phaseStart = now;
          }
          break;
        }

        case "exit": {
          const t = Math.min(1, elapsed / PHASE_EXIT);
          const eased = easeOutQuad(t);

          for (const p of at.exitParticles) {
            p.x = p.x + eased * (layout.outputX - p.x) * 0.5;
            p.progress = eased;
          }

          if (t >= 1) {
            s.activeToken = null;
            s.lastTokenTime = now;
          }
          break;
        }
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);

      const dt = now - lastFrameTime;
      lastFrameTime = now;

      // Throttle to ~60fps
      if (dt < 8) return;

      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
      const { layout } = s;
      const { w, h, dpr } = layout;

      // Advance simulation
      advanceToken(now);

      // Fade persistent paths
      for (let i = s.persistentPaths.length - 1; i >= 0; i--) {
        const pp = s.persistentPaths[i];
        pp.alpha -= 0.003;
        if (pp.alpha <= 0) {
          s.persistentPaths.splice(i, 1);
        }
      }

      /* ── Clear ── */
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, h);

      /* ── Draw router gate ── */
      const routerTop = layout.expertTop - 20 * dpr;
      const routerBottom = layout.expertBottom + 20 * dpr;
      ctx.fillStyle = colors.routerGate;
      ctx.fillRect(
        layout.routerX - layout.routerW / 2,
        routerTop,
        layout.routerW,
        routerBottom - routerTop,
      );

      // Router label
      ctx.save();
      ctx.font = `${9 * dpr}px monospace`;
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.fillText("ROUTER", layout.routerX, routerTop - 8 * dpr);
      ctx.restore();

      /* ── Draw expert columns ── */
      for (let e = 0; e < s.numExperts; e++) {
        const cx = getExpertCenterX(e);
        const isActive =
          s.activeToken?.topKExperts.includes(e) &&
          (s.activeToken.phase === "travel" || s.activeToken.phase === "pulse");

        // Column rectangle
        const colW = layout.expertW;
        const colTop = layout.expertTop;
        const colBottom = layout.expertBottom;

        // Pulse glow
        if (isActive && s.activeToken?.phase === "pulse") {
          const pulseT = Math.min(1, (now - s.activeToken.phaseStart) / PHASE_PULSE);
          const pulseAlpha = (1 - pulseT) * 0.3;
          ctx.fillStyle = colors.expertActive.replace(/[\d.]+\)$/, `${pulseAlpha})`);
          ctx.fillRect(cx - colW * 1.5, colTop - 10 * dpr, colW * 3, colBottom - colTop + 20 * dpr);
        }

        ctx.fillStyle = isActive ? colors.expertActive : colors.expertInactive;
        ctx.fillRect(cx - colW / 2, colTop, colW, colBottom - colTop);

        // Expert label
        ctx.save();
        ctx.font = `${8 * dpr}px monospace`;
        ctx.fillStyle = isActive ? colors.text : colors.textDim;
        ctx.textAlign = "center";
        ctx.fillText(`E${e}`, cx, colTop - 6 * dpr);
        ctx.restore();

        // Load counter
        const load = s.expertLoads[e] ?? 0;
        if (load > 0) {
          ctx.save();
          ctx.font = `${8 * dpr}px monospace`;
          ctx.fillStyle = colors.textDim;
          ctx.textAlign = "center";
          ctx.fillText(`${load}`, cx, colBottom + 14 * dpr);
          ctx.restore();
        }
      }

      /* ── Draw heatmap ── */
      if (s.totalTokens > 0) {
        const maxLoad = Math.max(...s.expertLoads, 1);
        for (let e = 0; e < s.numExperts; e++) {
          const cx = getExpertCenterX(e);
          const intensity = (s.expertLoads[e] ?? 0) / maxLoad;
          const barW = Math.max(layout.expertW, layout.expertSpacing * 0.6);

          // Interpolate between cold and hot colors
          // Parse the colors for interpolation
          if (theme === "dark") {
            const r = Math.round(224 + (212 - 224) * intensity);
            const g = Math.round(226 + (255 - 226) * intensity);
            const b = Math.round(220 + (0 - 220) * intensity);
            const a = 0.05 + intensity * 0.55;
            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          } else {
            const r = Math.round(10 + (42 - 10) * intensity);
            const g = Math.round(10 + (138 - 10) * intensity);
            const b = Math.round(10 + (14 - 10) * intensity);
            const a = 0.03 + intensity * 0.47;
            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          }

          ctx.fillRect(cx - barW / 2, layout.heatmapY, barW, layout.heatmapH);
        }

        // Heatmap label
        ctx.save();
        ctx.font = `${7 * dpr}px monospace`;
        ctx.fillStyle = colors.textDim;
        ctx.textAlign = "center";
        ctx.fillText(
          "UTILIZATION",
          (layout.expertStartX + layout.expertEndX) / 2,
          layout.heatmapY + layout.heatmapH + 12 * dpr,
        );
        ctx.restore();
      }

      /* ── Draw persistent Bezier paths ── */
      for (const pp of s.persistentPaths) {
        ctx.save();
        ctx.globalAlpha = pp.alpha;
        ctx.strokeStyle = colors.pathDim;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(pp.fromX, pp.fromY);
        ctx.quadraticCurveTo(pp.cpX, pp.cpY, pp.toX, pp.toY);
        ctx.stroke();
        ctx.restore();
      }

      /* ── Draw active token ── */
      const at = s.activeToken;
      if (at) {
        const particleR = 5 * dpr;
        const labelFont = `bold ${9 * dpr}px monospace`;

        switch (at.phase) {
          case "enter": {
            // Draw the entering token particle
            ctx.save();
            ctx.fillStyle = colors.tokenParticle;
            ctx.beginPath();
            ctx.arc(at.x, at.y, particleR, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            const trailLen = 30 * dpr;
            const gradient = ctx.createLinearGradient(at.x - trailLen, at.y, at.x, at.y);
            gradient.addColorStop(0, "transparent");
            gradient.addColorStop(1, colors.pathActive);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.moveTo(at.x - trailLen, at.y);
            ctx.lineTo(at.x, at.y);
            ctx.stroke();

            // Label
            ctx.font = labelFont;
            ctx.fillStyle = colors.text;
            ctx.textAlign = "center";
            ctx.fillText(at.label, at.x, at.y - particleR - 4 * dpr);
            ctx.restore();
            break;
          }

          case "fan": {
            // Draw token at router position
            ctx.save();
            ctx.fillStyle = colors.tokenParticle;
            ctx.beginPath();
            ctx.arc(at.x, at.y, particleR, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = labelFont;
            ctx.fillStyle = colors.text;
            ctx.textAlign = "center";
            ctx.fillText(at.label, at.x, at.y - particleR - 4 * dpr);

            // Radial probability distribution
            const fanT = Math.min(1, (now - at.phaseStart) / PHASE_FAN);
            drawRadialScores(ctx, at.x, at.y, at.routerScores, at.topKExperts, fanT, colors, dpr);
            ctx.restore();
            break;
          }

          case "travel": {
            // Draw Bezier paths (full curves, dimmed)
            for (const p of at.particles) {
              const fromX = layout.routerX + layout.routerW;
              const fromY = at.y;
              const toX = getExpertCenterX(p.targetExpert);
              const toY = getExpertCenterY();
              const cp = getControlPointForExpert(fromX, fromY, toX, toY, p.targetExpert);

              // Draw the full curve as a dim guide
              ctx.save();
              ctx.strokeStyle = colors.pathDim;
              ctx.lineWidth = 1.5 * dpr;
              ctx.setLineDash([4 * dpr, 4 * dpr]);
              ctx.beginPath();
              ctx.moveTo(fromX, fromY);
              ctx.quadraticCurveTo(cp.x, cp.y, toX, toY);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.restore();

              // Draw the active portion of the curve (up to current progress)
              ctx.save();
              ctx.strokeStyle = colors.pathActive;
              ctx.lineWidth = 2 * dpr;
              ctx.beginPath();
              const steps = 30;
              const maxT = p.progress;
              for (let step = 0; step <= steps; step++) {
                const t = (step / steps) * maxT;
                const pt = quadBezierPoint(fromX, fromY, cp.x, cp.y, toX, toY, t);
                if (step === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
              }
              ctx.stroke();
              ctx.restore();

              // Draw particle with trail
              ctx.save();

              // Trail: draw a few previous positions
              const trailSteps = 6;
              for (let ti = trailSteps; ti >= 1; ti--) {
                const trailT = Math.max(0, p.progress - ti * 0.03);
                const trailPt = quadBezierPoint(fromX, fromY, cp.x, cp.y, toX, toY, trailT);
                const alpha = (1 - ti / (trailSteps + 1)) * colors.tokenParticleAlpha * 0.4;
                ctx.fillStyle = colors.tokenParticle.replace(/[\d.]+\)$/, `${alpha})`);
                ctx.beginPath();
                ctx.arc(trailPt.x, trailPt.y, particleR * (1 - ti * 0.1), 0, Math.PI * 2);
                ctx.fill();
              }

              // Main particle
              ctx.fillStyle = colors.tokenParticle;
              ctx.beginPath();
              ctx.arc(p.x, p.y, particleR, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }

            // Token label at router
            ctx.save();
            ctx.font = labelFont;
            ctx.fillStyle = colors.textDim;
            ctx.textAlign = "center";
            ctx.fillText(at.label, layout.routerX, at.y - particleR - 4 * dpr);
            ctx.restore();
            break;
          }

          case "pulse": {
            // Particles sit at expert columns, pulsing
            const pulseT = Math.min(1, (now - at.phaseStart) / PHASE_PULSE);
            const pulseScale = 1 + Math.sin(pulseT * Math.PI) * 0.4;

            for (const expertIdx of at.topKExperts) {
              const ex = getExpertCenterX(expertIdx);
              const ey = getExpertCenterY();

              ctx.save();
              ctx.fillStyle = colors.tokenParticle;
              ctx.beginPath();
              ctx.arc(ex, ey, particleR * pulseScale, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
            break;
          }

          case "exit": {
            const exitT = Math.min(1, (now - at.phaseStart) / PHASE_EXIT);
            const fadeAlpha = 1 - exitT;

            for (const p of at.exitParticles) {
              ctx.save();
              ctx.globalAlpha = fadeAlpha;
              ctx.fillStyle = colors.tokenParticle;
              ctx.beginPath();
              ctx.arc(
                p.x + p.progress * (layout.outputX - p.x),
                p.y,
                particleR * (1 - exitT * 0.3),
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.restore();
            }
            break;
          }
        }
      }

      /* ── Stats (bottom center) ── */
      {
        const statsY = h - 30 * dpr;
        ctx.save();
        ctx.font = `${8 * dpr}px monospace`;
        ctx.fillStyle = colors.textDim;
        ctx.textAlign = "center";

        // Active params: simulate MoE sizing
        const totalParams = s.numExperts <= 8 ? 47 : 235;
        const activeParams =
          s.numExperts <= 8
            ? Math.round(totalParams * (s.topK / s.numExperts) + 6)
            : Math.round(totalParams * (s.topK / s.numExperts) + 22);

        const loadBalance = computeLoadBalance(s.expertLoads, s.numExperts, s.totalTokens);
        const loadStr = s.totalTokens > 0 ? loadBalance.toFixed(2) : "---";

        const statsText = `active params: ${activeParams}B / ${totalParams}B    load balance: ${loadStr}    tokens: ${s.totalTokens}`;
        ctx.fillText(statsText, w / 2, statsY);

        ctx.restore();
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [initSim]);

  /* ── Load balance metric ── */

  /* ── Keyboard handlers ── */

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " ") {
        e.preventDefault();
        simRef.current.paused = !simRef.current.paused;
      }

      if (e.key === "r" || e.key === "R") {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        reset();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reset]);

  /* ── Control handlers ── */

  const handleExpertToggle = useCallback(() => {
    const s = simRef.current;
    const next = s.numExperts === 8 ? 16 : 8;
    s.numExperts = next;
    s.affinityMatrix = buildAffinityMatrix(next);
    s.expertLoads = Array.from({ length: next }, () => 0);
    s.totalTokens = 0;
    s.tokenIndex = 0;
    s.activeToken = null;
    s.persistentPaths = [];
    setNumExperts(next);

    const canvas = canvasRef.current;
    if (canvas) {
      s.layout = computeLayout(canvas.width, canvas.height, window.devicePixelRatio || 1, next);
    }
  }, []);

  const handleTopK = useCallback((val: number) => {
    const s = simRef.current;
    const clamped = Math.max(1, Math.min(4, Math.min(val, s.numExperts)));
    s.topK = clamped;
    setTopK(clamped);
  }, []);

  const handleInputType = useCallback(() => {
    const s = simRef.current;
    const idx = INPUT_TYPES.indexOf(s.inputType);
    const next = INPUT_TYPES[(idx + 1) % INPUT_TYPES.length];
    s.inputType = next;
    s.tokenIndex = 0;
    setInputType(next);
  }, []);

  /* ── Styles ── */

  const btnBase = "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors";
  const btnInactive = "text-foreground/30 hover:text-foreground/50";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      {/* Controls overlay — top right */}
      <div className="fixed right-5 top-16 z-10 md:right-8 md:top-16">
        <div className="flex flex-wrap items-center gap-2 rounded bg-background/80 px-3 py-2 backdrop-blur-sm">
          <button onClick={handleExpertToggle} className={`${btnBase} ${btnInactive}`}>
            experts: {numExperts}
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          <label className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              top-k
            </span>
            <input
              type="range"
              min={1}
              max={Math.min(4, numExperts)}
              value={topK}
              onChange={(e) => handleTopK(Number(e.target.value))}
              className="h-1 w-12 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-3 font-mono text-[9px] text-foreground/30">{topK}</span>
          </label>

          <span className="h-4 w-px bg-foreground/10" />

          <button onClick={handleInputType} className={`${btnBase} ${btnInactive}`}>
            input: {inputType}
          </button>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────
   Load balance computation
   1.0 = perfectly balanced, approaches 0 with extreme imbalance
   Uses coefficient of variation inverted
   ──────────────────────────────────────────── */

function computeLoadBalance(loads: number[], numExperts: number, totalTokens: number): number {
  if (totalTokens === 0) return 1;

  const mean = totalTokens / numExperts;
  if (mean === 0) return 1;

  let variance = 0;
  for (let i = 0; i < numExperts; i++) {
    const diff = (loads[i] ?? 0) - mean;
    variance += diff * diff;
  }
  variance /= numExperts;

  const stddev = Math.sqrt(variance);
  const cv = stddev / mean; // coefficient of variation

  // Map CV to 0..1 range. CV of 0 = perfect balance (1.0), CV > 2 approaches 0
  return Math.max(0, 1 - cv / 2);
}
