"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getTheme } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   Embedding Space — Canvas2D

   2D projection of word embeddings showing
   semantic clusters, nearest neighbors, and
   vector arithmetic (analogy) relationships.
   ──────────────────────────────────────────── */

/* ── Cluster definitions ── */

interface WordEntry {
  word: string;
  cluster: number;
  /** Pre-computed 2D position (normalized 0-1, mapped to viewport at render time) */
  baseX: number;
  baseY: number;
}

const CLUSTER_LABELS = ["animals", "actions", "emotions", "colors", "size", "food", "royalty"];

/** Muted cluster colors — [dark, light] pairs */
const CLUSTER_COLORS: [string, string][] = [
  ["rgba(120,180,255,C)", "rgba(40,100,200,C)"], // animals — blue
  ["rgba(255,160,100,C)", "rgba(200,100,40,C)"], // actions — orange
  ["rgba(200,130,255,C)", "rgba(140,60,200,C)"], // emotions — purple
  ["rgba(255,100,120,C)", "rgba(200,50,70,C)"], // colors — red/pink
  ["rgba(100,220,180,C)", "rgba(30,160,120,C)"], // size — teal
  ["rgba(240,200,80,C)", "rgba(180,140,20,C)"], // food — gold
  ["rgba(212,255,0,C)", "rgba(42,138,14,C)"], // royalty — accent
];

function clusterColor(ci: number, isDark: boolean, opacity: number): string {
  const pair = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
  const template = isDark ? pair[0] : pair[1];
  return template.replace("C", String(opacity));
}

/* ── Word data with pre-computed 2D positions ── */

const WORDS: WordEntry[] = [
  // Cluster 0: Animals (top-left)
  { word: "cat", cluster: 0, baseX: 0.12, baseY: 0.16 },
  { word: "dog", cluster: 0, baseX: 0.17, baseY: 0.21 },
  { word: "fish", cluster: 0, baseX: 0.08, baseY: 0.24 },
  { word: "bird", cluster: 0, baseX: 0.14, baseY: 0.1 },
  { word: "horse", cluster: 0, baseX: 0.2, baseY: 0.17 },
  { word: "mouse", cluster: 0, baseX: 0.1, baseY: 0.28 },
  { word: "lion", cluster: 0, baseX: 0.18, baseY: 0.12 },
  { word: "wolf", cluster: 0, baseX: 0.22, baseY: 0.23 },
  { word: "bear", cluster: 0, baseX: 0.15, baseY: 0.26 },
  { word: "tiger", cluster: 0, baseX: 0.2, baseY: 0.09 },
  { word: "eagle", cluster: 0, baseX: 0.09, baseY: 0.14 },
  { word: "shark", cluster: 0, baseX: 0.06, baseY: 0.2 },

  // Cluster 1: Actions (left-center)
  { word: "run", cluster: 1, baseX: 0.06, baseY: 0.48 },
  { word: "walk", cluster: 1, baseX: 0.1, baseY: 0.52 },
  { word: "jump", cluster: 1, baseX: 0.08, baseY: 0.44 },
  { word: "swim", cluster: 1, baseX: 0.04, baseY: 0.55 },
  { word: "fly", cluster: 1, baseX: 0.12, baseY: 0.46 },
  { word: "climb", cluster: 1, baseX: 0.07, baseY: 0.58 },
  { word: "sprint", cluster: 1, baseX: 0.05, baseY: 0.42 },
  { word: "leap", cluster: 1, baseX: 0.11, baseY: 0.56 },
  { word: "crawl", cluster: 1, baseX: 0.09, baseY: 0.6 },
  { word: "dash", cluster: 1, baseX: 0.13, baseY: 0.5 },

  // Cluster 2: Emotions (upper-center)
  { word: "happy", cluster: 2, baseX: 0.42, baseY: 0.15 },
  { word: "sad", cluster: 2, baseX: 0.46, baseY: 0.18 },
  { word: "angry", cluster: 2, baseX: 0.44, baseY: 0.22 },
  { word: "calm", cluster: 2, baseX: 0.48, baseY: 0.14 },
  { word: "excited", cluster: 2, baseX: 0.4, baseY: 0.19 },
  { word: "fearful", cluster: 2, baseX: 0.5, baseY: 0.21 },
  { word: "proud", cluster: 2, baseX: 0.43, baseY: 0.12 },
  { word: "shy", cluster: 2, baseX: 0.47, baseY: 0.24 },
  { word: "brave", cluster: 2, baseX: 0.41, baseY: 0.16 },
  { word: "gentle", cluster: 2, baseX: 0.49, baseY: 0.17 },

  // Cluster 3: Colors (top-right)
  { word: "red", cluster: 3, baseX: 0.78, baseY: 0.12 },
  { word: "blue", cluster: 3, baseX: 0.82, baseY: 0.16 },
  { word: "green", cluster: 3, baseX: 0.76, baseY: 0.18 },
  { word: "yellow", cluster: 3, baseX: 0.84, baseY: 0.14 },
  { word: "purple", cluster: 3, baseX: 0.8, baseY: 0.2 },
  { word: "orange", cluster: 3, baseX: 0.86, baseY: 0.18 },
  { word: "black", cluster: 3, baseX: 0.77, baseY: 0.1 },
  { word: "white", cluster: 3, baseX: 0.83, baseY: 0.09 },
  { word: "pink", cluster: 3, baseX: 0.85, baseY: 0.12 },
  { word: "gray", cluster: 3, baseX: 0.81, baseY: 0.22 },

  // Cluster 4: Size/Scale (bottom-left)
  { word: "big", cluster: 4, baseX: 0.12, baseY: 0.74 },
  { word: "small", cluster: 4, baseX: 0.16, baseY: 0.77 },
  { word: "tiny", cluster: 4, baseX: 0.18, baseY: 0.8 },
  { word: "huge", cluster: 4, baseX: 0.1, baseY: 0.72 },
  { word: "giant", cluster: 4, baseX: 0.08, baseY: 0.76 },
  { word: "large", cluster: 4, baseX: 0.14, baseY: 0.7 },
  { word: "vast", cluster: 4, baseX: 0.09, baseY: 0.8 },
  { word: "little", cluster: 4, baseX: 0.17, baseY: 0.73 },
  { word: "massive", cluster: 4, baseX: 0.11, baseY: 0.78 },

  // Cluster 5: Food (bottom-right)
  { word: "bread", cluster: 5, baseX: 0.76, baseY: 0.72 },
  { word: "rice", cluster: 5, baseX: 0.8, baseY: 0.75 },
  { word: "meat", cluster: 5, baseX: 0.78, baseY: 0.78 },
  { word: "fruit", cluster: 5, baseX: 0.82, baseY: 0.73 },
  { word: "cake", cluster: 5, baseX: 0.84, baseY: 0.76 },
  { word: "soup", cluster: 5, baseX: 0.77, baseY: 0.8 },
  { word: "pasta", cluster: 5, baseX: 0.81, baseY: 0.79 },
  { word: "salad", cluster: 5, baseX: 0.85, baseY: 0.77 },
  { word: "cheese", cluster: 5, baseX: 0.79, baseY: 0.7 },

  // Cluster 6: Royalty/hierarchy (center) — analogy demo
  { word: "king", cluster: 6, baseX: 0.48, baseY: 0.48 },
  { word: "queen", cluster: 6, baseX: 0.52, baseY: 0.52 },
  { word: "man", cluster: 6, baseX: 0.44, baseY: 0.54 },
  { word: "woman", cluster: 6, baseX: 0.48, baseY: 0.58 },
  { word: "prince", cluster: 6, baseX: 0.5, baseY: 0.44 },
  { word: "princess", cluster: 6, baseX: 0.54, baseY: 0.48 },
  { word: "boy", cluster: 6, baseX: 0.42, baseY: 0.5 },
  { word: "girl", cluster: 6, baseX: 0.46, baseY: 0.56 },
];

/* ── Analogy definitions ── */

interface Analogy {
  a: string;
  b: string;
  c: string;
  d: string;
  label: string;
}

const ANALOGIES: Analogy[] = [
  { a: "king", b: "queen", c: "man", d: "woman", label: "king \u2212 man + woman \u2248 queen" },
  {
    a: "king",
    b: "prince",
    c: "queen",
    d: "princess",
    label: "king \u2212 queen + princess \u2248 prince",
  },
  { a: "boy", b: "girl", c: "man", d: "woman", label: "boy \u2212 man + woman \u2248 girl" },
];

/* ── Nearest-neighbor demo sequences ── */

interface NeighborDemo {
  word: string;
  neighbors: string[];
}

const NEIGHBOR_DEMOS: NeighborDemo[] = [
  { word: "cat", neighbors: ["dog", "mouse", "lion", "tiger"] },
  { word: "happy", neighbors: ["excited", "proud", "brave", "calm"] },
  { word: "run", neighbors: ["sprint", "dash", "jump", "walk"] },
  { word: "red", neighbors: ["orange", "pink", "blue", "yellow"] },
  { word: "king", neighbors: ["queen", "prince", "man", "boy"] },
  { word: "bread", neighbors: ["rice", "pasta", "cake", "cheese"] },
  { word: "big", neighbors: ["huge", "large", "giant", "massive"] },
];

/* ── Simulation state ── */

interface WordState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

interface SimState {
  words: WordState[];
  paused: boolean;
  hoverIndex: number;
  dragIndex: number;
  dragOffsetX: number;
  dragOffsetY: number;

  // Auto-demo state
  demoMode: "neighbors" | "analogy";
  demoIndex: number;
  demoTimer: number;
  demoFade: number; // 0-1 opacity for current demo
  demoCycle: number; // total time in current demo

  // Search
  searchQuery: string;
  searchResults: number[];
}

/* ── Easing ── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ── Distance helper ── */

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/* ── Cosine similarity (computed from base positions, viewport-independent) ── */

function cosineSim(i: number, j: number): number {
  const wi = WORDS[i];
  const wj = WORDS[j];
  if (!wi || !wj) return 0;
  // Use normalized base positions so similarity is consistent across viewports
  const d = dist(wi.baseX, wi.baseY, wj.baseX, wj.baseY);
  // Max possible distance in unit square is ~1.41; scale so nearby words ≈ 0.9+
  return Math.max(0, Math.min(1, 1 - d * 2.5));
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
    analogyA: "rgba(212,255,0,0.6)",
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
    analogyA: "rgba(42,138,14,0.6)",
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
  const showClustersRef = useRef(true);
  const showAnalogiesRef = useRef(true);
  const resetRef = useRef(0);

  /* ── Initialize simulation state ── */
  const initSim = useCallback((W: number, H: number): SimState => {
    const padX = 60;
    const padTop = 80;
    const padBot = 100;
    const usableW = W - padX * 2;
    const usableH = H - padTop - padBot;

    const words: WordState[] = WORDS.map((w) => {
      const tx = padX + w.baseX * usableW;
      const ty = padTop + w.baseY * usableH;
      // Start fully scattered — the settle animation IS the demo
      return {
        x: padX + Math.random() * usableW,
        y: padTop + Math.random() * usableH,
        vx: 0,
        vy: 0,
        targetX: tx,
        targetY: ty,
      };
    });

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
      demoCycle: -3, // negative = delay before first demo (settle animation plays first)
      searchQuery: "",
      searchResults: [],
    };
  }, []);

  /* ── Main effect ── */
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

    const observer = new ResizeObserver(() => {
      setSize();
      // Recompute target positions on resize
      const r = canvas.getBoundingClientRect();
      const padX = 60;
      const padTop = 80;
      const padBot = 100;
      const usableW = r.width - padX * 2;
      const usableH = r.height - padTop - padBot;
      for (let i = 0; i < WORDS.length; i++) {
        const w = WORDS[i];
        const ws = sim.words[i];
        if (!w || !ws) continue;
        ws.targetX = padX + w.baseX * usableW;
        ws.targetY = padTop + w.baseY * usableH;
      }
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

      // Find nearest word
      let closest = -1;
      let closestDist = 30; // max hover distance
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
        // Re-scatter and re-settle
        const r2 = canvas.getBoundingClientRect();
        const padX = 60;
        const padTop = 80;
        const padBot = 100;
        const usableW = r2.width - padX * 2;
        const usableH = r2.height - padTop - padBot;
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
        }
        sim.demoTimer = 0;
        sim.demoFade = 0;
        sim.demoCycle = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);

    /* ── Find word index by name ── */
    function findWord(name: string): number {
      return WORDS.findIndex((w) => w.word === name);
    }

    /* ── Render loop ── */
    let lastTime = performance.now();
    let lastResetCount = 0;

    function render(now: number) {
      rafRef.current = requestAnimationFrame(render);

      const dt = Math.min(32, now - lastTime) / 1000; // seconds, capped
      lastTime = now;

      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      if (W === 0 || H === 0) return;

      // Check for reset from button
      if (resetRef.current !== lastResetCount) {
        lastResetCount = resetRef.current;
        const padX = 60;
        const padTop = 80;
        const padBot = 100;
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
        }
        sim.demoTimer = 0;
        sim.demoFade = 0;
        sim.demoCycle = 0;
      }

      const isDark = getTheme() === "dark";
      const c = isDark ? darkColors() : lightColors();

      // Clear
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, H);

      /* ── Physics: spring to target + subtle brownian ── */
      if (!sim.paused) {
        for (let i = 0; i < sim.words.length; i++) {
          const ws = sim.words[i];
          if (!ws || i === sim.dragIndex) continue;

          // Spring force toward target
          const dx = ws.targetX - ws.x;
          const dy = ws.targetY - ws.y;
          const springK = 3.0;
          const damping = 0.85;

          ws.vx += dx * springK * dt;
          ws.vy += dy * springK * dt;

          // Very subtle Brownian jitter — just enough to feel alive
          ws.vx += (Math.random() - 0.5) * 0.04;
          ws.vy += (Math.random() - 0.5) * 0.04;

          ws.vx *= damping;
          ws.vy *= damping;

          ws.x += ws.vx;
          ws.y += ws.vy;
        }

        // Advance demo cycle
        sim.demoCycle += dt;

        const DEMO_DURATION = 4.5; // seconds per demo
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
          // Next demo
          sim.demoCycle = 0;
          sim.demoFade = 0;
          sim.demoTimer++;

          // Alternate between neighbor demos and analogies
          const totalDemos = NEIGHBOR_DEMOS.length + ANALOGIES.length;
          const idx = sim.demoTimer % totalDemos;
          if (idx < NEIGHBOR_DEMOS.length) {
            sim.demoMode = "neighbors";
            sim.demoIndex = idx;
          } else {
            sim.demoMode = "analogy";
            sim.demoIndex = idx - NEIGHBOR_DEMOS.length;
          }
        }
      }

      /* ── Draw background grid ── */
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

      /* ── Draw cluster hulls ── */
      if (showClustersRef.current) {
        for (let ci = 0; ci < CLUSTER_LABELS.length; ci++) {
          const clusterWords: number[] = [];
          for (let i = 0; i < WORDS.length; i++) {
            const w = WORDS[i];
            if (w && w.cluster === ci) clusterWords.push(i);
          }
          if (clusterWords.length < 3) continue;

          // Compute convex hull centroid and draw soft circle
          let cx = 0;
          let cy = 0;
          let maxR = 0;
          for (const idx of clusterWords) {
            const ws = sim.words[idx];
            if (ws) {
              cx += ws.x;
              cy += ws.y;
            }
          }
          cx /= clusterWords.length;
          cy /= clusterWords.length;

          for (const idx of clusterWords) {
            const ws = sim.words[idx];
            if (!ws) continue;
            const d = dist(cx, cy, ws.x, ws.y);
            if (d > maxR) maxR = d;
          }

          // Soft gradient circle for cluster region
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 40);
          grad.addColorStop(0, clusterColor(ci, isDark, 0.06));
          grad.addColorStop(0.7, clusterColor(ci, isDark, 0.03));
          grad.addColorStop(1, clusterColor(ci, isDark, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, maxR + 40, 0, Math.PI * 2);
          ctx.fill();

          // Cluster label — positioned at centroid, behind the words
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillStyle = clusterColor(ci, isDark, 0.2);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(CLUSTER_LABELS[ci].toUpperCase(), cx, cy);
        }
      }

      /* ── Draw auto-demo: neighbor connections or analogy arrows ── */
      const hoverActive = sim.hoverIndex >= 0;

      if (!hoverActive && sim.demoFade > 0) {
        ctx.globalAlpha = sim.demoFade;

        if (sim.demoMode === "neighbors") {
          const demo = NEIGHBOR_DEMOS[sim.demoIndex % NEIGHBOR_DEMOS.length];
          if (demo) {
            const centerIdx = findWord(demo.word);
            const centerWs = centerIdx >= 0 ? sim.words[centerIdx] : null;

            if (centerWs) {
              // Highlight ring around center word
              ctx.strokeStyle = c.accent;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(centerWs.x, centerWs.y, 18, 0, Math.PI * 2);
              ctx.stroke();

              // Draw connections to neighbors
              for (let ni = 0; ni < demo.neighbors.length; ni++) {
                const nIdx = findWord(demo.neighbors[ni]);
                const nWs = nIdx >= 0 ? sim.words[nIdx] : null;
                if (!nWs) continue;

                const similarity = cosineSim(centerIdx, nIdx);

                // Connection line
                ctx.strokeStyle = c.accentDim;
                ctx.lineWidth = 1 + similarity * 2;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(centerWs.x, centerWs.y);
                ctx.lineTo(nWs.x, nWs.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Similarity score at midpoint
                const mx = (centerWs.x + nWs.x) / 2;
                const my = (centerWs.y + nWs.y) / 2;
                ctx.font = "9px 'JetBrains Mono', monospace";
                ctx.fillStyle = c.text;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(similarity.toFixed(2), mx, my - 9);
              }

              // "nearest neighbors" label
              ctx.font = "10px 'JetBrains Mono', monospace";
              ctx.fillStyle = c.accent;
              ctx.textAlign = "center";
              ctx.fillText(`nearest neighbors of "${demo.word}"`, centerWs.x, centerWs.y + 30);
            }
          }
        } else if (sim.demoMode === "analogy" && showAnalogiesRef.current) {
          const analogy = ANALOGIES[sim.demoIndex % ANALOGIES.length];
          if (analogy) {
            const aIdx = findWord(analogy.a);
            const bIdx = findWord(analogy.b);
            const cIdx = findWord(analogy.c);
            const dIdx = findWord(analogy.d);
            const aW = aIdx >= 0 ? sim.words[aIdx] : null;
            const bW = bIdx >= 0 ? sim.words[bIdx] : null;
            const cW = cIdx >= 0 ? sim.words[cIdx] : null;
            const dW = dIdx >= 0 ? sim.words[dIdx] : null;

            if (aW && bW && cW && dW) {
              // Draw analogy arrows: a→c parallel to b→d
              const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrowhead
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const headLen = 8;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(
                  x2 - headLen * Math.cos(angle - 0.35),
                  y2 - headLen * Math.sin(angle - 0.35),
                );
                ctx.lineTo(
                  x2 - headLen * Math.cos(angle + 0.35),
                  y2 - headLen * Math.sin(angle + 0.35),
                );
                ctx.closePath();
                ctx.fill();
              };

              // a → c (e.g., king → man) — "gender direction"
              drawArrow(aW.x, aW.y, cW.x, cW.y, c.analogyA);
              // b → d (e.g., queen → woman) — parallel gender direction
              drawArrow(bW.x, bW.y, dW.x, dW.y, c.analogyB);

              // Highlight the four words with rings
              for (const ws of [aW, bW, cW, dW]) {
                ctx.strokeStyle = c.accent;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(ws.x, ws.y, 16, 0, Math.PI * 2);
                ctx.stroke();
              }

              // Label
              const labelX = (aW.x + bW.x + cW.x + dW.x) / 4;
              const labelY = Math.min(aW.y, bW.y, cW.y, dW.y) - 34;
              ctx.font = "11px 'JetBrains Mono', monospace";
              ctx.fillStyle = c.textBright;
              ctx.textAlign = "center";
              ctx.fillText(analogy.label, labelX, labelY);
            }
          }
        }

        ctx.globalAlpha = 1;
      }

      /* ── Draw hover state: nearest neighbors ── */
      if (hoverActive) {
        const hws = sim.words[sim.hoverIndex];
        if (hws) {
          // Find 4 nearest neighbors
          const distances: { idx: number; d: number }[] = [];
          for (let i = 0; i < sim.words.length; i++) {
            if (i === sim.hoverIndex) continue;
            const ws = sim.words[i];
            if (!ws) continue;
            distances.push({ idx: i, d: dist(hws.x, hws.y, ws.x, ws.y) });
          }
          distances.sort((a, b) => a.d - b.d);
          const nearest = distances.slice(0, 5);

          // Highlight ring
          ctx.strokeStyle = c.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hws.x, hws.y, 20, 0, Math.PI * 2);
          ctx.stroke();

          // Draw connections
          for (const n of nearest) {
            const nws = sim.words[n.idx];
            if (!nws) continue;
            const similarity = cosineSim(sim.hoverIndex, n.idx);

            ctx.strokeStyle = c.accentDim;
            ctx.lineWidth = 1 + similarity * 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(hws.x, hws.y);
            ctx.lineTo(nws.x, nws.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Similarity label
            const mx = (hws.x + nws.x) / 2;
            const my = (hws.y + nws.y) / 2;
            ctx.font = "9px 'JetBrains Mono', monospace";
            ctx.fillStyle = c.textBright;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`cos=${similarity.toFixed(2)}`, mx, my - 9);

            // Highlight neighbor dot
            ctx.fillStyle = c.accent;
            ctx.beginPath();
            ctx.arc(nws.x, nws.y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* ── Draw word dots and labels ── */
      for (let i = 0; i < sim.words.length; i++) {
        const ws = sim.words[i];
        const wd = WORDS[i];
        if (!ws || !wd) continue;

        const isHovered = i === sim.hoverIndex;
        const ci = wd.cluster;

        // Dot
        const dotR = isHovered ? 6 : 3.5;
        ctx.fillStyle = isHovered ? c.accent : clusterColor(ci, isDark, 0.7);
        ctx.beginPath();
        ctx.arc(ws.x, ws.y, dotR, 0, Math.PI * 2);
        ctx.fill();

        // Label
        const fontSize = isHovered ? 12 : 10;
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isHovered ? c.textBright : c.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(wd.word, ws.x + dotR + 4, ws.y);
      }

      /* ── Title ── */
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = c.textDim;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("EMBEDDING SPACE", 20, 58);
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(`${WORDS.length} WORDS \u00B7 768D \u2192 2D`, 20, 73);
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

  const btnBase =
    "px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors cursor-pointer";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Controls */}
      <div className="fixed right-5 top-16 z-10 flex items-center gap-2 md:right-8">
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
