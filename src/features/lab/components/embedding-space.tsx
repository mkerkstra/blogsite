"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import {
  ANALOGIES,
  CLUSTER_LABELS,
  EMBEDDING_DIM,
  VOCAB_SIZE,
  WORDS,
} from "@/features/lab/data/embedding-data";
import { getTheme } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS, useLabCanvas } from "@/features/lab/lib/use-lab-canvas";
import {
  ControlGroup,
  LabSelect,
  Toggle,
  Transport,
} from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

/* ────────────────────────────────────────────
   Embedding Space — Canvas2D

   Real word embeddings (Xenova/all-MiniLM-L6-v2,
   384D, unit-norm) projected to 2D via UMAP at
   build time. Cosine similarities and analogy
   arithmetic are computed in the full 384D
   space, so dragging a word in the plane does
   not change its true neighbors.
   ──────────────────────────────────────────── */

/* ── Palette ── */

/** One [dark, light] pair per cluster in CLUSTER_LABELS. */
const CLUSTER_COLORS: [string, string][] = [
  ["rgba(120,180,255,C)", "rgba(40,100,200,C)"], // 0 animals — blue
  ["rgba(255,160,100,C)", "rgba(200,100,40,C)"], // 1 actions — orange
  ["rgba(200,130,255,C)", "rgba(140,60,200,C)"], // 2 emotions — purple
  ["rgba(255,100,120,C)", "rgba(200,50,70,C)"], // 3 colors — red/pink
  ["rgba(100,220,180,C)", "rgba(30,160,120,C)"], // 4 size — teal
  ["rgba(240,200,80,C)", "rgba(180,140,20,C)"], // 5 food — gold
  ["rgba(212,255,0,C)", "rgba(42,138,14,C)"], // 6 capitals — accent
  ["rgba(210,170,130,C)", "rgba(130,85,40,C)"], // 7 countries — earth
];

function clusterColor(ci: number, isDark: boolean, opacity: number): string {
  const pair = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
  const template = (isDark ? pair?.[0] : pair?.[1]) ?? "rgba(128,128,128,C)";
  return template.replace("C", String(opacity));
}

/** One representative word per cluster for the auto-demo cycle. */
const CLUSTER_REP_WORDS = ["cat", "run", "happy", "red", "big", "bread", "paris", "france"];

/** Options for the query LabSelect — "none" plus every word in the vocabulary. */
const QUERY_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "", label: "none" },
  ...WORDS.map((w) => ({ value: w.word, label: w.word })),
];

/* ── Sim state ── */

interface WordState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  // Label offset from the dot — tracked independently so overlapping labels can
  // slide apart without disturbing the underlying UMAP geometry.
  lx: number;
  ly: number;
  lvx: number;
  lvy: number;
}

const LABEL_REST_X = 8;
const LABEL_REST_Y = 0;
const LABEL_FONT_PX = 10;
const LABEL_LINE_H = 11;

/** Horizontal breathing room (CSS px) — labBounds has no horizontal inset. */
const PAD_X = 60;

interface SimState {
  words: WordState[];
  paused: boolean;
  hoverIndex: number;
  dragIndex: number;
  dragOffsetX: number;
  dragOffsetY: number;

  demoMode: "neighbors" | "analogy";
  demoIndex: number;
  demoTimer: number;
  demoFade: number;
  demoCycle: number;

  queryText: string;
  queryFocusIdx: number;
}

/* ── Helpers ── */

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function findWordIdx(name: string): number {
  return WORDS.findIndex((w) => w.word === name);
}

/* ── Theme ── */

interface ThemeColors {
  bg: string;
  text: string;
  textBright: string;
  textDim: string;
  accent: string;
  accentDim: string;
  grid: string;
  analogyA: string;
  analogyB: string;
}

function darkColors(): ThemeColors {
  return {
    bg: "#0a0a0a",
    text: "rgba(224,226,220,0.6)",
    textBright: "rgba(224,226,220,0.9)",
    textDim: "rgba(224,226,220,0.25)",
    accent: "#d4ff00",
    accentDim: "rgba(212,255,0,0.3)",
    grid: "rgba(224,226,220,0.04)",
    analogyA: "rgba(212,255,0,0.65)",
    analogyB: "rgba(0,200,255,0.6)",
  };
}

function lightColors(): ThemeColors {
  return {
    bg: "#f5f1e8",
    text: "rgba(10,10,10,0.55)",
    textBright: "rgba(10,10,10,0.85)",
    textDim: "rgba(10,10,10,0.2)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.25)",
    grid: "rgba(10,10,10,0.04)",
    analogyA: "rgba(42,138,14,0.65)",
    analogyB: "rgba(0,120,180,0.6)",
  };
}

/* ── Component ── */

export function EmbeddingSpace({ info }: { info?: ReactNode }) {
  // Full-bleed canvas + DPR sizing + ResizeObserver, owned by the hook. The
  // render loop reads the live size/bounds off sizeRef each frame.
  const { canvasRef, sizeRef } = useLabCanvas({
    onResize: () => recomputeTargetsRef.current?.(),
  });
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef(0);
  const recomputeTargetsRef = useRef<(() => void) | null>(null);

  const [paused, setPaused] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [showAnalogies, setShowAnalogies] = useState(true);
  const [queryText, setQueryText] = useState("");
  // Live focus telemetry, lifted from the sim for the readout HUD.
  const [readout, setReadout] = useState<{ word: string; score: number }>({ word: "—", score: 0 });

  const showClustersRef = useRef(true);
  const showAnalogiesRef = useRef(true);
  const resetRef = useRef(0);

  // ── Layout: a safe content rect in CSS px, centered within labBounds ──
  // (labBounds is device-px; we draw post-setTransform in CSS px, so divide.)
  const layoutFor = useCallback(
    (W: number, H: number, dpr: number) => {
      const bounds = sizeRef.current.bounds;
      const top = bounds.y / dpr;
      const bottom = bounds.bottom / dpr;
      const usableW = Math.max(1, W - PAD_X * 2);
      const usableH = Math.max(1, bottom - top);
      return { padX: PAD_X, top, usableW, usableH };
    },
    [sizeRef],
  );

  // ── Animation loop ──
  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    // Seed words into the safe rect (canvas already sized by useLabCanvas).
    const { dpr } = sizeRef.current;
    const W0 = sizeRef.current.width / dpr;
    const H0 = sizeRef.current.height / dpr;
    const L0 = layoutFor(W0, H0, dpr);

    const words: WordState[] = WORDS.map((w) => ({
      x: L0.padX + Math.random() * L0.usableW,
      y: L0.top + Math.random() * L0.usableH,
      vx: 0,
      vy: 0,
      targetX: L0.padX + w.baseX * L0.usableW,
      targetY: L0.top + w.baseY * L0.usableH,
      lx: LABEL_REST_X,
      ly: LABEL_REST_Y,
      lvx: 0,
      lvy: 0,
    }));

    const sim: SimState = {
      words,
      paused: false,
      hoverIndex: -1,
      dragIndex: -1,
      dragOffsetX: 0,
      dragOffsetY: 0,
      demoMode: "neighbors",
      demoIndex: 0,
      demoTimer: 0,
      demoFade: 0,
      demoCycle: -3,
      queryText: "",
      queryFocusIdx: -1,
    };
    simRef.current = sim;

    // Measure each label once. Redo after web fonts load so widths are
    // precise once JetBrains Mono resolves (fallback monospace is close).
    const labelWidths: number[] = Array.from({ length: WORDS.length }, () => 0);
    const measureLabels = () => {
      ctx.font = `${LABEL_FONT_PX}px 'JetBrains Mono', monospace`;
      for (let i = 0; i < WORDS.length; i++) {
        const w = WORDS[i];
        if (!w) continue;
        labelWidths[i] = ctx.measureText(w.word).width;
      }
    };
    measureLabels();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measureLabels).catch(() => {});
    }

    // Re-spread the spring targets when the canvas resizes (dragged words keep
    // their pinned target so they don't snap back).
    const recomputeTargets = () => {
      const d = sizeRef.current.dpr;
      const w = sizeRef.current.width / d;
      const h = sizeRef.current.height / d;
      const L = layoutFor(w, h, d);
      for (let i = 0; i < WORDS.length; i++) {
        const wd = WORDS[i];
        const ws = sim.words[i];
        if (!wd || !ws || i === sim.dragIndex) continue;
        ws.targetX = L.padX + wd.baseX * L.usableW;
        ws.targetY = L.top + wd.baseY * L.usableH;
      }
    };
    recomputeTargetsRef.current = recomputeTargets;

    /* ── Pointer events ── */
    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;

      if (sim.dragIndex >= 0) {
        const ws = sim.words[sim.dragIndex];
        if (ws) {
          ws.x = mx - sim.dragOffsetX;
          ws.y = my - sim.dragOffsetY;
          ws.targetX = ws.x;
          ws.targetY = ws.y;
          ws.vx = 0;
          ws.vy = 0;
        }
        return;
      }

      let closest = -1;
      let closestDist = 30;
      for (let i = 0; i < sim.words.length; i++) {
        const ws = sim.words[i];
        if (!ws) continue;
        const d = dist(mx, my, ws.x, ws.y);
        if (d < closestDist) {
          closestDist = d;
          closest = i;
        }
      }
      sim.hoverIndex = closest;
      canvas.style.cursor = closest >= 0 ? "grab" : "default";
    };

    const onPointerDown = (e: PointerEvent) => {
      if (sim.hoverIndex >= 0) {
        const r = canvas.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        const ws = sim.words[sim.hoverIndex];
        if (ws) {
          sim.dragIndex = sim.hoverIndex;
          sim.dragOffsetX = mx - ws.x;
          sim.dragOffsetY = my - ws.y;
          canvas.style.cursor = "grabbing";
          canvas.setPointerCapture(e.pointerId);
        }
      }
    };

    const onPointerUp = () => {
      sim.dragIndex = -1;
      canvas.style.cursor = sim.hoverIndex >= 0 ? "grab" : "default";
    };

    const onPointerLeave = () => {
      sim.hoverIndex = -1;
      if (sim.dragIndex < 0) canvas.style.cursor = "default";
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    /* ── Render loop ── */
    let lastTime = performance.now();
    let lastResetCount = 0;

    function render(now: number) {
      rafRef.current = requestAnimationFrame(render);

      const dt = Math.min(32, now - lastTime) / 1000;
      lastTime = now;

      const dpr = sizeRef.current.dpr;
      const W = sizeRef.current.width / dpr;
      const H = sizeRef.current.height / dpr;
      if (W === 0 || H === 0) return;

      // Draw in CSS px regardless of DPR.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const L = layoutFor(W, H, dpr);

      if (resetRef.current !== lastResetCount) {
        lastResetCount = resetRef.current;
        for (let i = 0; i < WORDS.length; i++) {
          const w = WORDS[i];
          const ws = sim.words[i];
          if (!w || !ws) continue;
          ws.targetX = L.padX + w.baseX * L.usableW;
          ws.targetY = L.top + w.baseY * L.usableH;
          ws.x = L.padX + Math.random() * L.usableW;
          ws.y = L.top + Math.random() * L.usableH;
          ws.vx = 0;
          ws.vy = 0;
          ws.lx = LABEL_REST_X;
          ws.ly = LABEL_REST_Y;
          ws.lvx = 0;
          ws.lvy = 0;
        }
        sim.demoTimer = 0;
        sim.demoFade = 0;
        sim.demoCycle = 0;
      }

      const isDark = getTheme() === "dark";
      const c = isDark ? darkColors() : lightColors();

      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, H);

      /* ── Physics ── */
      if (!sim.paused) {
        for (let i = 0; i < sim.words.length; i++) {
          const ws = sim.words[i];
          if (!ws || i === sim.dragIndex) continue;

          const dx = ws.targetX - ws.x;
          const dy = ws.targetY - ws.y;
          const springK = 3.0;
          const damping = 0.85;

          ws.vx += dx * springK * dt;
          ws.vy += dy * springK * dt;
          ws.vx += (Math.random() - 0.5) * 0.04;
          ws.vy += (Math.random() - 0.5) * 0.04;
          ws.vx *= damping;
          ws.vy *= damping;
          ws.x += ws.vx;
          ws.y += ws.vy;
        }

        /* ── Label placement: spring toward rest + pairwise repulsion ── */
        const focusIdxLocal = sim.hoverIndex >= 0 ? sim.hoverIndex : sim.queryFocusIdx;
        const labelSpringK = 7.0;
        const labelDamping = 0.72;
        const halfH = LABEL_LINE_H / 2;

        for (let i = 0; i < sim.words.length; i++) {
          const ws = sim.words[i];
          if (!ws) continue;
          ws.lvx += (LABEL_REST_X - ws.lx) * labelSpringK * dt;
          ws.lvy += (LABEL_REST_Y - ws.ly) * labelSpringK * dt;
        }

        for (let i = 0; i < sim.words.length; i++) {
          const wi = sim.words[i];
          if (!wi) continue;
          const wiBoost = i === focusIdxLocal ? 1.5 : 1;
          const wiWidth = (labelWidths[i] ?? 36) * wiBoost;
          const aLeft = wi.x + wi.lx;
          const aTop = wi.y + wi.ly - halfH * wiBoost;
          const aRight = aLeft + wiWidth;
          const aBot = aTop + LABEL_LINE_H * wiBoost;

          for (let j = i + 1; j < sim.words.length; j++) {
            const wj = sim.words[j];
            if (!wj) continue;
            const wjBoost = j === focusIdxLocal ? 1.5 : 1;
            const wjWidth = (labelWidths[j] ?? 36) * wjBoost;
            const bLeft = wj.x + wj.lx;
            const bTop = wj.y + wj.ly - halfH * wjBoost;
            const bRight = bLeft + wjWidth;
            const bBot = bTop + LABEL_LINE_H * wjBoost;

            const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
            const overlapY = Math.min(aBot, bBot) - Math.max(aTop, bTop);
            if (overlapX <= 0 || overlapY <= 0) continue;

            // Push along the axis of smaller overlap — minimizes disruption.
            if (overlapX < overlapY) {
              const push = (overlapX + 1) * 0.5;
              const dir = aLeft + wiWidth / 2 < bLeft + wjWidth / 2 ? -1 : 1;
              wi.lvx += dir * push * 18 * dt;
              wj.lvx -= dir * push * 18 * dt;
            } else {
              const push = (overlapY + 1) * 0.5;
              const dir = aTop + LABEL_LINE_H / 2 < bTop + LABEL_LINE_H / 2 ? -1 : 1;
              wi.lvy += dir * push * 18 * dt;
              wj.lvy -= dir * push * 18 * dt;
            }
          }
        }

        for (let i = 0; i < sim.words.length; i++) {
          const ws = sim.words[i];
          if (!ws) continue;
          ws.lvx *= labelDamping;
          ws.lvy *= labelDamping;
          ws.lx += ws.lvx * dt * 60; // scale to per-frame units
          ws.ly += ws.lvy * dt * 60;
          // Clamp so labels never drift absurdly far from their dot.
          const maxOff = 42;
          if (ws.lx > maxOff) ws.lx = maxOff;
          else if (ws.lx < -maxOff) ws.lx = -maxOff;
          if (ws.ly > maxOff) ws.ly = maxOff;
          else if (ws.ly < -maxOff) ws.ly = -maxOff;
        }

        sim.demoCycle += dt;

        const DEMO_DURATION = 4.5;
        const FADE_IN = 0.6;
        const FADE_OUT = 0.6;
        const HOLD = DEMO_DURATION - FADE_IN - FADE_OUT;

        if (sim.demoCycle < FADE_IN) {
          sim.demoFade = easeOutCubic(sim.demoCycle / FADE_IN);
        } else if (sim.demoCycle < FADE_IN + HOLD) {
          sim.demoFade = 1;
        } else if (sim.demoCycle < DEMO_DURATION) {
          sim.demoFade = 1 - easeOutCubic((sim.demoCycle - FADE_IN - HOLD) / FADE_OUT);
        } else {
          sim.demoCycle = 0;
          sim.demoFade = 0;
          sim.demoTimer++;

          const totalDemos = CLUSTER_REP_WORDS.length + ANALOGIES.length;
          const idx = sim.demoTimer % totalDemos;
          if (idx < CLUSTER_REP_WORDS.length) {
            sim.demoMode = "neighbors";
            sim.demoIndex = idx;
          } else {
            sim.demoMode = "analogy";
            sim.demoIndex = idx - CLUSTER_REP_WORDS.length;
          }
        }
      }

      /* ── Background grid (full-bleed) ── */
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 1;
      const gridSpacing = 60;
      for (let gx = gridSpacing; gx < W; gx += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = gridSpacing; gy < H; gy += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      /* ── Cluster hulls ── */
      if (showClustersRef.current) {
        for (let ci = 0; ci < CLUSTER_LABELS.length; ci++) {
          const clusterWordIdxs: number[] = [];
          for (let i = 0; i < WORDS.length; i++) {
            const w = WORDS[i];
            if (w && w.cluster === ci) clusterWordIdxs.push(i);
          }
          if (clusterWordIdxs.length < 3) continue;

          let cx = 0;
          let cy = 0;
          for (const idx of clusterWordIdxs) {
            const ws = sim.words[idx];
            if (ws) {
              cx += ws.x;
              cy += ws.y;
            }
          }
          cx /= clusterWordIdxs.length;
          cy /= clusterWordIdxs.length;

          let maxR = 0;
          for (const idx of clusterWordIdxs) {
            const ws = sim.words[idx];
            if (!ws) continue;
            const d = dist(cx, cy, ws.x, ws.y);
            if (d > maxR) maxR = d;
          }

          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 36);
          grad.addColorStop(0, clusterColor(ci, isDark, 0.06));
          grad.addColorStop(0.7, clusterColor(ci, isDark, 0.03));
          grad.addColorStop(1, clusterColor(ci, isDark, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, maxR + 36, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillStyle = clusterColor(ci, isDark, 0.22);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(CLUSTER_LABELS[ci].toUpperCase(), cx, cy);
        }
      }

      /* ── Determine focus mode: hover > query > demo ── */
      const hoverIdx = sim.hoverIndex;
      const queryIdx = sim.queryFocusIdx;
      const focusIdx = hoverIdx >= 0 ? hoverIdx : queryIdx;
      const focusSource: "hover" | "query" | "demo" =
        hoverIdx >= 0 ? "hover" : queryIdx >= 0 ? "query" : "demo";

      /* ── Auto-demo (only when no focus) ── */
      if (focusSource === "demo" && sim.demoFade > 0) {
        ctx.globalAlpha = sim.demoFade;

        if (sim.demoMode === "neighbors") {
          const repWord = CLUSTER_REP_WORDS[sim.demoIndex % CLUSTER_REP_WORDS.length];
          if (repWord) {
            const centerIdx = findWordIdx(repWord);
            const centerWord = centerIdx >= 0 ? WORDS[centerIdx] : null;
            const centerWs = centerIdx >= 0 ? sim.words[centerIdx] : null;

            if (centerWord && centerWs) {
              drawNeighborFan(ctx, sim, centerIdx, centerWord, centerWs, c, 4);
              ctx.font = "10px 'JetBrains Mono', monospace";
              ctx.fillStyle = c.accent;
              ctx.textAlign = "center";
              ctx.fillText(`top cosine neighbors of "${repWord}"`, centerWs.x, centerWs.y + 32);
            }
          }
        } else if (sim.demoMode === "analogy" && showAnalogiesRef.current) {
          const analogy = ANALOGIES[sim.demoIndex % ANALOGIES.length];
          if (analogy) drawAnalogy(ctx, sim, analogy, c);
        }

        ctx.globalAlpha = 1;
      }

      /* ── Focus overlays (hover or query) ── */
      if (focusSource !== "demo" && focusIdx >= 0) {
        const fw = WORDS[focusIdx];
        const fws = sim.words[focusIdx];
        if (fw && fws) {
          drawNeighborFan(ctx, sim, focusIdx, fw, fws, c, 5);
          if (focusSource === "query") {
            ctx.font = "10px 'JetBrains Mono', monospace";
            ctx.fillStyle = c.accent;
            ctx.textAlign = "center";
            ctx.fillText(`query: "${fw.word}" · top 5 by cosine`, fws.x, fws.y + 32);
          }
        }
      }

      /* ── Word dots + labels ── */
      for (let i = 0; i < sim.words.length; i++) {
        const ws = sim.words[i];
        const wd = WORDS[i];
        if (!ws || !wd) continue;

        const isFocus = i === focusIdx;
        const ci = wd.cluster;

        const dotR = isFocus ? 6 : 3.5;
        ctx.fillStyle = isFocus ? c.accent : clusterColor(ci, isDark, 0.72);
        ctx.beginPath();
        ctx.arc(ws.x, ws.y, dotR, 0, Math.PI * 2);
        ctx.fill();

        const labelX = ws.x + ws.lx;
        const labelY = ws.y + ws.ly;

        // Leader line when the label has been pushed off its rest position.
        const offDx = ws.lx - LABEL_REST_X;
        const offDy = ws.ly - LABEL_REST_Y;
        if (offDx * offDx + offDy * offDy > 144) {
          ctx.strokeStyle = c.grid;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(ws.x, ws.y);
          ctx.lineTo(labelX - 2, labelY);
          ctx.stroke();
        }

        const fontSize = isFocus ? 12 : 10;
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isFocus ? c.textBright : c.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(wd.word, labelX, labelY);
      }
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      recomputeTargetsRef.current = null;
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [canvasRef, sizeRef, layoutFor]);

  // ── Transport callbacks shared by the keyboard handler and the Transport ──
  const togglePause = useCallback(() => {
    const next = !(simRef.current?.paused ?? false);
    if (simRef.current) simRef.current.paused = next;
    setPaused(next);
  }, []);

  const reset = useCallback(() => {
    resetRef.current++;
  }, []);

  // ── Keyboard: space = pause, r = reset ── (f/fullscreen + ?/how-it-works live in LabChrome)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " " || e.code === "Space") {
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

  // ── Lift live focus telemetry to React state for the readout HUD ──
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = simRef.current;
      if (!s) return;

      // Focus precedence mirrors the render loop: hover > query > demo.
      let idx = s.hoverIndex >= 0 ? s.hoverIndex : s.queryFocusIdx;
      if (idx < 0 && s.demoMode === "neighbors") {
        const rep = CLUSTER_REP_WORDS[s.demoIndex % CLUSTER_REP_WORDS.length];
        if (rep) idx = findWordIdx(rep);
      }

      if (idx < 0) {
        // Analogy demo (or nothing): surface the analogy's top match.
        const analogy =
          s.demoMode === "analogy" ? ANALOGIES[s.demoIndex % ANALOGIES.length] : undefined;
        const top = analogy?.top[0];
        const w = top ? (WORDS[top.idx]?.word ?? "—") : "—";
        setReadout({ word: w, score: top?.score ?? 0 });
        return;
      }

      const top = WORDS[idx]?.neighbors[0];
      setReadout({ word: WORDS[idx]?.word ?? "—", score: top?.score ?? 0 });
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  // ── Sync React state → refs ──
  useEffect(() => {
    if (simRef.current) simRef.current.paused = paused;
  }, [paused]);
  useEffect(() => {
    showClustersRef.current = showClusters;
  }, [showClusters]);
  useEffect(() => {
    showAnalogiesRef.current = showAnalogies;
  }, [showAnalogies]);
  useEffect(() => {
    const s = simRef.current;
    if (!s) return;
    const q = queryText.trim().toLowerCase();
    s.queryText = q;
    s.queryFocusIdx = q ? findWordIdx(q) : -1;
  }, [queryText]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      <LabReadout corner="right">
        <Gauge label="top cosine" value={readout.score.toFixed(2)} primary />
        <Gauge label="focus" value={readout.word} />
        <Gauge label="dim" value={EMBEDDING_DIM} unit="D" />
        <Gauge label="vocab" value={VOCAB_SIZE} />
      </LabReadout>

      <LabChrome identity={{ name: "embedding space", scent: "hover · drag · query" }} info={info}>
        <ControlGroup label="query">
          <LabSelect
            label="word"
            value={queryText}
            onChange={setQueryText}
            options={QUERY_OPTIONS}
          />
        </ControlGroup>
        <ControlGroup label="layers">
          <Toggle label="clusters" pressed={showClusters} onChange={setShowClusters} />
          <Toggle label="analogies" pressed={showAnalogies} onChange={setShowAnalogies} />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Transport playing={!paused} onToggle={togglePause} onReset={reset} />
        </ControlGroup>
      </LabChrome>
    </>
  );
}

/* ────────────────────────────────────────────
   Drawing helpers
   ──────────────────────────────────────────── */

function drawNeighborFan(
  ctx: CanvasRenderingContext2D,
  sim: SimState,
  centerIdx: number,
  centerWord: (typeof WORDS)[number],
  centerWs: WordState,
  c: ThemeColors,
  k: number,
) {
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerWs.x, centerWs.y, 18, 0, Math.PI * 2);
  ctx.stroke();

  const neighbors = centerWord.neighbors.slice(0, k);
  for (const n of neighbors) {
    const nws = sim.words[n.idx];
    if (!nws) continue;

    ctx.strokeStyle = c.accentDim;
    ctx.lineWidth = 1 + n.score * 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(centerWs.x, centerWs.y);
    ctx.lineTo(nws.x, nws.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const mx = (centerWs.x + nws.x) / 2;
    const my = (centerWs.y + nws.y) / 2;
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = c.textBright;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`cos=${n.score.toFixed(2)}`, mx, my - 9);

    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(nws.x, nws.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAnalogy(
  ctx: CanvasRenderingContext2D,
  sim: SimState,
  analogy: (typeof ANALOGIES)[number],
  c: ThemeColors,
) {
  const aIdx = findWordIdx(analogy.a);
  const bIdx = findWordIdx(analogy.b);
  const cIdx = findWordIdx(analogy.c);
  const dIdx = analogy.top[0]?.idx ?? -1;
  if (aIdx < 0 || bIdx < 0 || cIdx < 0 || dIdx < 0) return;

  const aW = sim.words[aIdx];
  const bW = sim.words[bIdx];
  const cW = sim.words[cIdx];
  const dW = sim.words[dIdx];
  if (!aW || !bW || !cW || !dW) return;

  /* Draw b→a parallel to c→d — the shared direction vector. */
  drawArrow(ctx, bW.x, bW.y, aW.x, aW.y, c.analogyA);
  drawArrow(ctx, cW.x, cW.y, dW.x, dW.y, c.analogyB);

  for (const ws of [aW, bW, cW, dW]) {
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ws.x, ws.y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  const labelX = (aW.x + bW.x + cW.x + dW.x) / 4;
  const labelY = Math.min(aW.y, bW.y, cW.y, dW.y) - 38;
  const predictedWord = WORDS[dIdx]?.word ?? "?";
  const score = analogy.top[0]?.score.toFixed(2) ?? "?";

  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.textBright;
  ctx.textAlign = "center";
  ctx.fillText(`${analogy.a} − ${analogy.b} + ${analogy.c} ≈ ${predictedWord}`, labelX, labelY);
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.text;
  ctx.fillText(`top match cos=${score}`, labelX, labelY + 14);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.35), y2 - headLen * Math.sin(angle - 0.35));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.35), y2 - headLen * Math.sin(angle + 0.35));
  ctx.closePath();
  ctx.fill();
}
