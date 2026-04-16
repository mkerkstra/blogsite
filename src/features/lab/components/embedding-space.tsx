"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ANALOGIES,
  CLUSTER_LABELS,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
  VOCAB_SIZE,
  WORDS,
} from "@/features/lab/data/embedding-data";
import { getTheme } from "@/features/lab/lib/env";

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

export function EmbeddingSpace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [showAnalogies, setShowAnalogies] = useState(true);
  const [queryText, setQueryText] = useState("");

  const showClustersRef = useRef(true);
  const showAnalogiesRef = useRef(true);
  const resetRef = useRef(0);

  const initSim = useCallback((W: number, H: number): SimState => {
    const padX = 60;
    const padTop = 110;
    const padBot = 110;
    const usableW = W - padX * 2;
    const usableH = H - padTop - padBot;

    const words: WordState[] = WORDS.map((w) => ({
      x: padX + Math.random() * usableW,
      y: padTop + Math.random() * usableH,
      vx: 0,
      vy: 0,
      targetX: padX + w.baseX * usableW,
      targetY: padTop + w.baseY * usableH,
      lx: LABEL_REST_X,
      ly: LABEL_REST_Y,
      lvx: 0,
      lvy: 0,
    }));

    return {
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
  }, []);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const rect = canvas.getBoundingClientRect();
    const sim = initSim(rect.width, rect.height);
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

    const recomputeTargets = (W: number, H: number) => {
      const padX = 60;
      const padTop = 110;
      const padBot = 110;
      const usableW = W - padX * 2;
      const usableH = H - padTop - padBot;
      for (let i = 0; i < WORDS.length; i++) {
        const w = WORDS[i];
        const ws = sim.words[i];
        if (!w || !ws) continue;
        ws.targetX = padX + w.baseX * usableW;
        ws.targetY = padTop + w.baseY * usableH;
      }
    };

    const observer = new ResizeObserver(() => {
      setSize();
      const r = canvas.getBoundingClientRect();
      recomputeTargets(r.width, r.height);
    });
    observer.observe(canvas);

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

    /* ── Keyboard ── */
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        sim.paused = !sim.paused;
        setPaused(sim.paused);
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetRef.current++;
      }
    };
    window.addEventListener("keydown", onKeyDown);

    /* ── Render loop ── */
    let lastTime = performance.now();
    let lastResetCount = 0;

    function render(now: number) {
      rafRef.current = requestAnimationFrame(render);

      const dt = Math.min(32, now - lastTime) / 1000;
      lastTime = now;

      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      if (W === 0 || H === 0) return;

      if (resetRef.current !== lastResetCount) {
        lastResetCount = resetRef.current;
        const padX = 60;
        const padTop = 110;
        const padBot = 110;
        const usableW = W - padX * 2;
        const usableH = H - padTop - padBot;
        for (let i = 0; i < WORDS.length; i++) {
          const w = WORDS[i];
          const ws = sim.words[i];
          if (!w || !ws) continue;
          ws.targetX = padX + w.baseX * usableW;
          ws.targetY = padTop + w.baseY * usableH;
          ws.x = padX + Math.random() * usableW;
          ws.y = padTop + Math.random() * usableH;
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

      /* ── Background grid ── */
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

      /* ── Title block (top-left) ── */
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = c.textDim;
      ctx.fillText("EMBEDDING SPACE", 20, 58);
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(
        `${EMBEDDING_MODEL.split("/").pop()} · ${EMBEDDING_DIM}D \u2192 2D (UMAP)`,
        20,
        73,
      );
      ctx.fillText(`${VOCAB_SIZE} words · ${CLUSTER_LABELS.length} clusters`, 20, 86);

      /* ── Scale / cost panel (bottom-right) ── */
      const bytesPerVec = EMBEDDING_DIM * 4;
      const kbPerVec = (bytesPerVec / 1024).toFixed(2);
      const gbPerMillion = ((bytesPerVec * 1_000_000) / 1024 ** 3).toFixed(2);

      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.font = "9px 'JetBrains Mono', monospace";
      const panelX = W - 20;
      const lineH = 13;
      const lines = [
        `cos(a,b) = a\u00B7b / \u2016a\u2016\u2016b\u2016`,
        `float32 \u00D7 ${EMBEDDING_DIM} = ${kbPerVec} KB/vec`,
        `1M vectors \u2248 ${gbPerMillion} GB (+HNSW)`,
        `SELECT ... ORDER BY emb <=> $1 LIMIT 5`,
      ];
      for (let i = 0; i < lines.length; i++) {
        ctx.fillStyle = i === 0 ? c.text : c.textDim;
        ctx.fillText(lines[i], panelX, H - 20 - (lines.length - 1 - i) * lineH);
      }
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [initSim]);

  /* ── Sync React state → refs ── */
  useEffect(() => {
    const s = simRef.current;
    if (s) s.paused = paused;
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

  const btnBase =
    "px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors cursor-pointer";

  const queryResolved =
    queryText.trim() && findWordIdx(queryText.trim().toLowerCase()) < 0 ? "not in vocab" : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      <div className="fixed right-5 top-16 z-10 flex items-center gap-2 md:right-8">
        <div className="relative">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="query…"
            aria-label="semantic search query"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="w-28 border border-foreground/15 bg-transparent px-2 py-1.5 font-mono text-[10px] lowercase tracking-[0.1em] text-foreground/70 placeholder:text-foreground/25 focus:border-accent focus:outline-none"
          />
          {queryResolved ? (
            <span className="pointer-events-none absolute -bottom-4 right-0 font-mono text-[8px] uppercase tracking-[0.15em] text-foreground/35">
              {queryResolved}
            </span>
          ) : null}
        </div>

        <span className="h-4 w-px bg-foreground/10" />

        <button
          onClick={() => setShowClusters(!showClusters)}
          className={`${btnBase} ${showClusters ? "text-foreground/60 hover:text-foreground/80" : "text-foreground/25 hover:text-foreground/40"}`}
        >
          clusters
        </button>

        <span className="h-4 w-px bg-foreground/10" />

        <button
          onClick={() => setShowAnalogies(!showAnalogies)}
          className={`${btnBase} ${showAnalogies ? "text-foreground/60 hover:text-foreground/80" : "text-foreground/25 hover:text-foreground/40"}`}
        >
          analogies
        </button>

        <span className="h-4 w-px bg-foreground/10" />

        <button
          onClick={() => {
            const s = simRef.current;
            if (s) {
              s.paused = !s.paused;
              setPaused(s.paused);
            }
          }}
          className={`${btnBase} text-foreground/30 hover:text-foreground/50`}
        >
          {paused ? "play" : "pause"}
        </button>

        <button
          onClick={() => {
            resetRef.current++;
          }}
          className={`${btnBase} text-foreground/30 hover:text-foreground/50`}
        >
          reset
        </button>
      </div>
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
  ctx.fillText(
    `${analogy.a} \u2212 ${analogy.b} + ${analogy.c} \u2248 ${predictedWord}`,
    labelX,
    labelY,
  );
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
