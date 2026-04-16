"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Types ── */

interface KeyEdge {
  key: number;
  positions: [number, number, number];
  fingerprint: number;
  color: string;
}

interface PeelStep {
  vertex: number;
  edgeIndex: number;
}

type Phase = "idle" | "build" | "peel" | "assign" | "ready";

/* ── Palette ── */

const PALETTE = {
  dark: {
    bg: "#0a0a0a",
    stroke: "rgba(224,226,220,0.15)",
    text: "rgba(224,226,220,0.8)",
    muted: "rgba(224,226,220,0.3)",
    accent: "#d4ff00",
    accentDim: "rgba(212,255,0,0.3)",
    cellBg: "rgba(224,226,220,0.04)",
    seg0: "rgba(100,140,255,0.04)",
    seg1: "rgba(224,226,220,0.02)",
    seg2: "rgba(255,160,100,0.04)",
    keyFill: "rgba(224,226,220,0.06)",
    keyStroke: "rgba(224,226,220,0.2)",
  },
  light: {
    bg: "#f5f1e8",
    stroke: "rgba(10,10,10,0.12)",
    text: "rgba(10,10,10,0.8)",
    muted: "rgba(10,10,10,0.3)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.3)",
    cellBg: "rgba(10,10,10,0.03)",
    seg0: "rgba(60,100,200,0.05)",
    seg1: "rgba(10,10,10,0.02)",
    seg2: "rgba(200,100,60,0.05)",
    keyFill: "rgba(10,10,10,0.04)",
    keyStroke: "rgba(10,10,10,0.15)",
  },
};

/* ── Edge colors (dim, for visual separation) ── */

const EDGE_COLORS_DARK = [
  "rgba(120,180,255,0.25)",
  "rgba(255,140,120,0.25)",
  "rgba(120,255,160,0.25)",
  "rgba(255,220,100,0.25)",
  "rgba(200,140,255,0.25)",
  "rgba(255,160,220,0.25)",
  "rgba(140,220,255,0.25)",
  "rgba(180,255,140,0.25)",
  "rgba(255,180,140,0.25)",
  "rgba(140,180,220,0.25)",
];

const EDGE_COLORS_LIGHT = [
  "rgba(60,100,200,0.3)",
  "rgba(200,60,50,0.3)",
  "rgba(40,160,80,0.3)",
  "rgba(180,140,20,0.3)",
  "rgba(130,60,200,0.3)",
  "rgba(200,60,140,0.3)",
  "rgba(40,140,180,0.3)",
  "rgba(100,160,40,0.3)",
  "rgba(200,100,40,0.3)",
  "rgba(60,100,140,0.3)",
];

/* ── Hash functions ── */

function mixHash(key: number, seed: number): number {
  let x = (key ^ seed) | 0;
  x = Math.imul((x >>> 16) ^ x, 0x45d9f3b);
  x = Math.imul((x >>> 16) ^ x, 0x45d9f3b);
  x = (x >>> 16) ^ x;
  return x >>> 0;
}

function getPositions(key: number, tableSize: number, seed: number): [number, number, number] {
  const seg = Math.floor(tableSize / 3);
  const seg2Size = tableSize - seg * 2;
  return [
    mixHash(key * 3, seed) % seg,
    seg + (mixHash(key * 3 + 1, seed) % seg),
    seg * 2 + (mixHash(key * 3 + 2, seed) % seg2Size),
  ];
}

function getFingerprint(key: number): number {
  let x = key | 0;
  x = Math.imul((x >>> 16) ^ x, 0x45d9f3b);
  x = Math.imul((x >>> 16) ^ x, 0x45d9f3b);
  x = (x >>> 16) ^ x;
  // Ensure nonzero so the XOR invariant is meaningful to observe
  return (x >>> 0) & 0xff || 1;
}

/* ── Peeling algorithm ── */

function buildAndPeel(
  keys: number[],
  tableSize: number,
  seed: number,
): { edges: KeyEdge[]; peelOrder: PeelStep[]; success: boolean } {
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const colorSet = isDark ? EDGE_COLORS_DARK : EDGE_COLORS_LIGHT;

  const edges: KeyEdge[] = keys.map((key, i) => ({
    key,
    positions: getPositions(key, tableSize, seed),
    fingerprint: getFingerprint(key),
    color: colorSet[i % colorSet.length],
  }));

  // Check for position collisions within an edge
  for (const e of edges) {
    const [a, b, c] = e.positions;
    if (a === b || b === c || a === c) return { edges, peelOrder: [], success: false };
  }

  // Build degree count and adjacency
  const degree = new Int32Array(tableSize);
  const vertexEdges: number[][] = Array.from({ length: tableSize }, () => []);
  const removed = new Uint8Array(keys.length);

  for (let i = 0; i < edges.length; i++) {
    const [a, b, c] = edges[i].positions;
    degree[a]++;
    degree[b]++;
    degree[c]++;
    vertexEdges[a].push(i);
    vertexEdges[b].push(i);
    vertexEdges[c].push(i);
  }

  // Peel: find degree-1 vertices and remove their edge
  const peelOrder: PeelStep[] = [];
  const queue: number[] = [];

  for (let v = 0; v < tableSize; v++) {
    if (degree[v] === 1) queue.push(v);
  }

  while (queue.length > 0) {
    const v = queue.shift();
    if (v === undefined || degree[v] !== 1) continue;

    // Find the single remaining edge at this vertex
    let edgeIdx = -1;
    for (const ei of vertexEdges[v]) {
      if (!removed[ei]) {
        edgeIdx = ei;
        break;
      }
    }
    if (edgeIdx === -1) continue;

    peelOrder.push({ vertex: v, edgeIndex: edgeIdx });
    removed[edgeIdx] = 1;

    const [a, b, c] = edges[edgeIdx].positions;
    degree[a]--;
    degree[b]--;
    degree[c]--;

    if (degree[a] === 1) queue.push(a);
    if (degree[b] === 1) queue.push(b);
    if (degree[c] === 1) queue.push(c);
  }

  const success = peelOrder.length === keys.length;
  return { edges, peelOrder, success };
}

function assignFingerprints(edges: KeyEdge[], peelOrder: PeelStep[], tableSize: number): number[] {
  const B = Array.from<number>({ length: tableSize }).fill(0);

  // Walk in reverse peel order
  for (let i = peelOrder.length - 1; i >= 0; i--) {
    const { vertex, edgeIndex } = peelOrder[i];
    const edge = edges[edgeIndex];
    const [a, b, c] = edge.positions;

    // soloPos is `vertex`, the other two are the remaining positions
    const others = [a, b, c].filter((p) => p !== vertex);
    B[vertex] = edge.fingerprint ^ B[others[0]] ^ B[others[1]];
  }

  return B;
}

/* ── Random key generation ── */

function generateKeys(count: number): number[] {
  const keys = new Set<number>();
  while (keys.size < count) {
    keys.add(10 + Math.floor(Math.random() * 90));
  }
  return Array.from(keys);
}

/* ── Component ── */

export function XorFilter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [speed, setSpeed] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const [queryInput, setQueryInput] = useState("");
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("press build to start");

  const stateRef = useRef<{
    keys: number[];
    tableSize: number;
    edges: KeyEdge[];
    peelOrder: PeelStep[];
    B: number[];
    phase: Phase;
    speed: number;
    autoPlay: boolean;

    // Animation progress
    buildStep: number; // how many edges have been drawn in
    peelStep: number; // how many peels done
    assignStep: number; // how many assignments done (from end of peelOrder)
    edgeFadeProgress: Map<number, number>; // edgeIndex -> fade 0..1
    flashVertex: number; // vertex currently flashing
    flashAlpha: number; // flash intensity
    highlightEdge: number; // edge index being highlighted
    highlightPositions: number[]; // positions being highlighted in assign
    assigningValue: number | null; // value being written

    // Query
    queryPositions: [number, number, number] | null;
    queryXorResult: number | null;
    queryFingerprint: number | null;
    queryIsMember: boolean | null;

    seed: number;
    frameCount: number;
    pendingStep: boolean;
  }>({
    keys: [],
    tableSize: 0,
    edges: [],
    peelOrder: [],
    B: [],
    phase: "idle",
    speed: 1,
    autoPlay: true,
    buildStep: 0,
    peelStep: 0,
    assignStep: 0,
    edgeFadeProgress: new Map(),
    flashVertex: -1,
    flashAlpha: 0,
    highlightEdge: -1,
    highlightPositions: [],
    assigningValue: null,
    queryPositions: null,
    queryXorResult: null,
    queryFingerprint: null,
    queryIsMember: null,
    seed: 42,
    frameCount: 0,
    pendingStep: false,
  });

  useEffect(() => {
    stateRef.current.speed = speed;
  }, [speed]);

  useEffect(() => {
    stateRef.current.autoPlay = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    stateRef.current.phase = phase;
  }, [phase]);

  const doBuild = useCallback(() => {
    const s = stateRef.current;
    const keys = generateKeys(10);
    const tableSize = Math.ceil(keys.length * 1.23);

    let seed = Math.floor(Math.random() * 100000);
    let result = buildAndPeel(keys, tableSize, seed);
    let attempts = 0;
    while (!result.success && attempts < 200) {
      seed++;
      attempts++;
      result = buildAndPeel(keys, tableSize, seed);
    }

    if (!result.success) {
      // Extremely unlikely with 10 keys, but handle it
      setStatusText("peeling failed, retrying...");
      setTimeout(() => doBuild(), 100);
      return;
    }

    s.keys = keys;
    s.tableSize = tableSize;
    s.edges = result.edges;
    s.peelOrder = result.peelOrder;
    s.B = Array.from<number>({ length: tableSize }).fill(0);
    s.seed = seed;
    s.buildStep = 0;
    s.peelStep = 0;
    s.assignStep = 0;
    s.edgeFadeProgress = new Map();
    s.flashVertex = -1;
    s.flashAlpha = 0;
    s.highlightEdge = -1;
    s.highlightPositions = [];
    s.assigningValue = null;
    s.queryPositions = null;
    s.queryXorResult = null;
    s.queryFingerprint = null;
    s.queryIsMember = null;
    s.pendingStep = false;

    setQueryInput("");
    setQueryResult(null);
    setPhase("build");
    setStatusText("building hypergraph...");
  }, []);

  const doQuery = useCallback((value: number) => {
    const s = stateRef.current;
    if (s.phase !== "ready") return;

    const positions = getPositions(value, s.tableSize, s.seed);
    const xorResult = s.B[positions[0]] ^ s.B[positions[1]] ^ s.B[positions[2]];
    const fp = getFingerprint(value);
    const isMember = xorResult === fp;

    s.queryPositions = positions;
    s.queryXorResult = xorResult;
    s.queryFingerprint = fp;
    s.queryIsMember = isMember;

    const inSet = s.keys.includes(value);
    const label = isMember
      ? inSet
        ? "member (true positive)"
        : "probable member (false positive!)"
      : "not a member";
    setQueryResult(
      `B[${positions[0]}]=${hex(s.B[positions[0]])} ^ B[${positions[1]}]=${hex(s.B[positions[1]])} ^ B[${positions[2]}]=${hex(s.B[positions[2]])} = ${hex(xorResult)} vs fp=${hex(fp)} => ${label}`,
    );
  }, []);

  const advanceStep = useCallback(() => {
    stateRef.current.pendingStep = true;
  }, []);

  // Auto-start build on mount
  useEffect(() => {
    const t = setTimeout(() => doBuild(), 300);
    return () => clearTimeout(t);
  }, [doBuild]);

  // Main canvas rendering and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Resize
    const observer = new ResizeObserver(([entry]) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(entry.contentRect.width * dpr);
      canvas.height = Math.round(entry.contentRect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    observer.observe(canvas);

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let tickAccum = 0;
    let lastTime = performance.now();

    const cvs = canvas;
    const g = ctx;

    function getTheme() {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      const theme = getTheme();
      const colors = PALETTE[theme];
      const w = cvs.width / (window.devicePixelRatio || 1);
      const h = cvs.height / (window.devicePixelRatio || 1);

      // ── Animation stepping ──
      const shouldStep = s.autoPlay || s.pendingStep;
      if (shouldStep) {
        const baseRate = s.autoPlay ? s.speed * 3 : 100; // manual step is instant
        tickAccum += dt * baseRate;

        if (reduced && s.phase !== "idle" && s.phase !== "ready") {
          // Skip all animations
          if (s.phase === "build") {
            s.buildStep = s.edges.length;
            setPhase("peel");
            setStatusText("peeling...");
            s.phase = "peel";
          }
          if (s.phase === "peel") {
            // Do all peels
            for (let i = 0; i < s.peelOrder.length; i++) {
              s.edgeFadeProgress.set(s.peelOrder[i].edgeIndex, 1);
            }
            s.peelStep = s.peelOrder.length;
            setPhase("assign");
            setStatusText("assigning...");
            s.phase = "assign";
          }
          if (s.phase === "assign") {
            s.B = assignFingerprints(s.edges, s.peelOrder, s.tableSize);
            s.assignStep = s.peelOrder.length;
            setPhase("ready");
            setStatusText("ready - enter a key to query");
            s.phase = "ready";
          }
          tickAccum = 0;
        }

        const steps = s.pendingStep ? 1 : Math.floor(tickAccum);
        if (steps > 0) {
          tickAccum -= s.pendingStep ? 0 : steps;
          s.pendingStep = false;

          for (let step = 0; step < steps; step++) {
            if (s.phase === "build") {
              if (s.buildStep < s.edges.length) {
                s.buildStep++;
                setStatusText(`building hypergraph ${s.buildStep}/${s.edges.length}`);
              }
              if (s.buildStep >= s.edges.length) {
                setPhase("peel");
                setStatusText(`peeling 0/${s.peelOrder.length}`);
                s.phase = "peel";
              }
            } else if (s.phase === "peel") {
              if (s.peelStep < s.peelOrder.length) {
                const peel = s.peelOrder[s.peelStep];
                s.flashVertex = peel.vertex;
                s.flashAlpha = 1;
                s.highlightEdge = peel.edgeIndex;
                s.edgeFadeProgress.set(peel.edgeIndex, 0);
                s.peelStep++;
                setStatusText(`peeling ${s.peelStep}/${s.peelOrder.length}`);
              }
              if (s.peelStep >= s.peelOrder.length) {
                s.flashVertex = -1;
                s.highlightEdge = -1;
                setPhase("assign");
                setStatusText(`assigning 0/${s.peelOrder.length}`);
                s.phase = "assign";
              }
            } else if (s.phase === "assign") {
              if (s.assignStep < s.peelOrder.length) {
                // Walk reverse peel order
                const ri = s.peelOrder.length - 1 - s.assignStep;
                const { vertex, edgeIndex } = s.peelOrder[ri];
                const edge = s.edges[edgeIndex];
                const [a, b, c] = edge.positions;
                const others = [a, b, c].filter((p) => p !== vertex);

                s.B[vertex] = edge.fingerprint ^ s.B[others[0]] ^ s.B[others[1]];
                s.flashVertex = vertex;
                s.flashAlpha = 1;
                s.highlightPositions = [a, b, c];
                s.assigningValue = s.B[vertex];
                s.assignStep++;
                setStatusText(`assigning ${s.assignStep}/${s.peelOrder.length}`);
              }
              if (s.assignStep >= s.peelOrder.length) {
                s.flashVertex = -1;
                s.highlightPositions = [];
                s.assigningValue = null;
                setPhase("ready");
                setStatusText("ready - enter a key to query");
                s.phase = "ready";
              }
            }
          }
        }
      }

      // Decay flash
      if (s.flashAlpha > 0) {
        s.flashAlpha = Math.max(0, s.flashAlpha - dt * 4);
      }

      // Fade removed edges
      for (const [ei, progress] of s.edgeFadeProgress) {
        if (progress < 1) {
          s.edgeFadeProgress.set(ei, Math.min(1, progress + dt * 5));
        }
      }

      // ── Draw ──
      g.clearRect(0, 0, w, h);
      g.fillStyle = colors.bg;
      g.fillRect(0, 0, w, h);

      if (s.keys.length === 0) return;

      // Layout
      const keyCount = s.keys.length;
      const tableSize = s.tableSize;
      const seg = Math.floor(tableSize / 3);

      const marginX = 40;
      const topMargin = 70; // clear navbar
      const bottomMargin = 140; // clear controls + footer
      const usableW = w - marginX * 2;
      const usableH = h - topMargin - bottomMargin;

      // Key circles (top zone)
      const keyY = topMargin + usableH * 0.12;
      const keyRadius = Math.min(14, usableW / (keyCount * 3.5));
      const keySpacing = Math.min(usableW / (keyCount + 1), keyRadius * 4);
      const keysWidth = keySpacing * (keyCount - 1);
      const keyStartX = (w - keysWidth) / 2;

      // Table cells (middle zone)
      const tableY = topMargin + usableH * 0.38;
      const cellSize = Math.min(28, (usableW - 40) / (tableSize + 2));
      const cellGap = 2;
      const totalTableW = tableSize * cellSize + (tableSize - 1) * cellGap;
      const tableStartX = (w - totalTableW) / 2;

      // ── Draw table cells ──
      g.font = `${Math.max(7, cellSize * 0.32)}px monospace`;
      g.textAlign = "center";
      g.textBaseline = "middle";

      for (let i = 0; i < tableSize; i++) {
        const cx = tableStartX + i * (cellSize + cellGap);
        const cy = tableY;

        // Segment tint
        let segColor: string;
        if (i < seg) {
          segColor = colors.seg0;
        } else if (i < seg * 2) {
          segColor = colors.seg1;
        } else {
          segColor = colors.seg2;
        }

        // Cell background
        g.fillStyle = segColor;
        g.fillRect(cx, cy, cellSize, cellSize);

        // Highlight during assignment
        if (s.highlightPositions.includes(i)) {
          g.fillStyle = colors.accentDim;
          g.fillRect(cx, cy, cellSize, cellSize);
        }

        // Flash vertex
        if (s.flashVertex === i && s.flashAlpha > 0) {
          g.fillStyle = colors.accent;
          g.globalAlpha = s.flashAlpha * 0.6;
          g.fillRect(cx, cy, cellSize, cellSize);
          g.globalAlpha = 1;
        }

        // Query highlight
        if (s.queryPositions && s.queryPositions.includes(i)) {
          g.fillStyle = colors.accentDim;
          g.fillRect(cx, cy, cellSize, cellSize);
        }

        // Cell border
        g.strokeStyle = colors.stroke;
        g.lineWidth = 1;
        g.strokeRect(cx, cy, cellSize, cellSize);

        // Cell value
        if (s.B[i] !== 0 || (s.phase === "ready" && s.B.length > 0)) {
          const val = s.B[i] || 0;
          if (val !== 0) {
            g.fillStyle = colors.text;
            g.globalAlpha = 0.7;
            g.fillText(hex(val), cx + cellSize / 2, cy + cellSize / 2);
            g.globalAlpha = 1;
          }
        }

        // Index label below
        g.fillStyle = colors.muted;
        g.globalAlpha = 0.5;
        g.font = `${Math.max(6, cellSize * 0.25)}px monospace`;
        g.fillText(String(i), cx + cellSize / 2, cy + cellSize + 8);
        g.globalAlpha = 1;
        g.font = `${Math.max(7, cellSize * 0.32)}px monospace`;
      }

      // Segment labels
      g.font = `${Math.max(8, cellSize * 0.35)}px monospace`;
      g.fillStyle = colors.muted;
      g.globalAlpha = 0.4;
      const segLabelY = tableY - 10;
      if (seg > 0) {
        const seg0CenterX = tableStartX + ((seg - 1) * (cellSize + cellGap)) / 2 + cellSize / 2;
        g.fillText("h0", seg0CenterX, segLabelY);
      }
      if (seg > 0) {
        const seg1CenterX =
          tableStartX +
          seg * (cellSize + cellGap) +
          ((seg - 1) * (cellSize + cellGap)) / 2 +
          cellSize / 2;
        g.fillText("h1", seg1CenterX, segLabelY);
      }
      {
        const seg2Start = seg * 2;
        const seg2Count = tableSize - seg2Start;
        const seg2CenterX =
          tableStartX +
          seg2Start * (cellSize + cellGap) +
          ((seg2Count - 1) * (cellSize + cellGap)) / 2 +
          cellSize / 2;
        g.fillText("h2", seg2CenterX, segLabelY);
      }
      g.globalAlpha = 1;

      // ── Draw key circles ──
      g.font = `bold ${Math.max(9, keyRadius * 0.85)}px monospace`;
      g.textAlign = "center";
      g.textBaseline = "middle";

      for (let i = 0; i < keyCount; i++) {
        const kx = keyStartX + i * keySpacing;
        const ky = keyY;

        // Circle fill
        g.beginPath();
        g.arc(kx, ky, keyRadius, 0, Math.PI * 2);
        g.fillStyle = colors.keyFill;
        g.fill();
        g.strokeStyle = colors.keyStroke;
        g.lineWidth = 1;
        g.stroke();

        // Key label
        g.fillStyle = colors.text;
        g.globalAlpha = 0.8;
        g.fillText(String(s.keys[i]), kx, ky);
        g.globalAlpha = 1;
      }

      // ── Draw hyperedges (bezier curves) ──
      const visibleEdges = Math.min(s.buildStep, s.edges.length);
      for (let i = 0; i < visibleEdges; i++) {
        const edge = s.edges[i];
        const fadeProgress = s.edgeFadeProgress.get(i) ?? -1;
        const isRemoved = fadeProgress >= 0;
        const isHighlighted = s.highlightEdge === i;

        if (isRemoved && fadeProgress >= 1) continue; // fully faded

        const keyIdx = s.keys.indexOf(edge.key);
        if (keyIdx === -1) continue;

        const kx = keyStartX + keyIdx * keySpacing;
        const ky = keyY + keyRadius;

        let alpha = 1;
        if (isRemoved) {
          alpha = 1 - fadeProgress;
        }

        for (let p = 0; p < 3; p++) {
          const pos = edge.positions[p];
          const cx = tableStartX + pos * (cellSize + cellGap) + cellSize / 2;
          const cy = tableY;

          g.beginPath();
          g.moveTo(kx, ky);

          // Quadratic bezier with control point between key and cell
          const midY = (ky + cy) / 2;
          const cpx = kx + (cx - kx) * 0.3;
          const cpy = midY;
          g.quadraticCurveTo(cpx, cpy, cx, cy);

          if (isHighlighted) {
            g.strokeStyle = colors.accent;
            g.globalAlpha = alpha * 0.8;
            g.lineWidth = 2;
          } else {
            g.strokeStyle = edge.color;
            g.globalAlpha = alpha;
            g.lineWidth = 1;
          }
          g.stroke();
          g.globalAlpha = 1;
          g.lineWidth = 1;
        }
      }

      // ── Status text (bottom zone) ──
      // Status is rendered by React, but we can draw additional info on canvas
      // Draw the XOR computation during assignment
      if (s.phase === "assign" && s.assignStep > 0 && s.assignStep <= s.peelOrder.length) {
        const ri = s.peelOrder.length - s.assignStep;
        if (ri >= 0 && ri < s.peelOrder.length) {
          const { vertex, edgeIndex } = s.peelOrder[ri];
          const edge = s.edges[edgeIndex];
          const [a, b, c] = edge.positions;
          const others = [a, b, c].filter((p) => p !== vertex);

          const compY = tableY + cellSize + 30;
          g.font = "10px monospace";
          g.fillStyle = colors.text;
          g.globalAlpha = 0.6;
          g.textAlign = "center";
          g.fillText(
            `B[${vertex}] = fp(${edge.key})=${hex(edge.fingerprint)} ^ B[${others[0]}]=${hex(s.B[others[0]])} ^ B[${others[1]}]=${hex(s.B[others[1]])} = ${hex(s.B[vertex])}`,
            w / 2,
            compY,
          );
          g.globalAlpha = 1;
        }
      }

      // Draw query result visualization
      if (s.phase === "ready" && s.queryPositions) {
        const compY = tableY + cellSize + 30;
        g.font = "10px monospace";
        g.fillStyle = s.queryIsMember ? colors.accent : colors.text;
        g.globalAlpha = 0.8;
        g.textAlign = "center";
        const [p0, p1, p2] = s.queryPositions;
        g.fillText(
          `B[${p0}]=${hex(s.B[p0])} ^ B[${p1}]=${hex(s.B[p1])} ^ B[${p2}]=${hex(s.B[p2])} = ${hex(s.queryXorResult ?? 0)}  |  fp = ${hex(s.queryFingerprint ?? 0)}  |  ${s.queryIsMember ? "MATCH" : "NO MATCH"}`,
          w / 2,
          compY,
        );
        g.globalAlpha = 1;
      }

      s.frameCount++;
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Controls */}
      <div
        className="fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        style={{
          background: "rgba(128,128,128,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "6px",
          padding: "8px 12px",
        }}
      >
        <button
          onClick={doBuild}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80"
        >
          build
        </button>

        <button
          onClick={advanceStep}
          disabled={phase === "idle" || phase === "ready"}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-30"
        >
          step
        </button>

        <button
          onClick={() => setAutoPlay((v) => !v)}
          className={`rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            autoPlay ? "text-foreground/80" : "text-foreground/50 hover:text-foreground/80"
          }`}
        >
          {autoPlay ? "auto" : "manual"}
        </button>

        <div className="mx-0.5 h-4 w-px bg-foreground/10" />

        <input
          type="number"
          min={10}
          max={99}
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="key"
          disabled={phase !== "ready"}
          className="w-12 rounded border border-foreground/10 bg-transparent px-1.5 py-1 font-mono text-[10px] text-foreground/60 outline-none placeholder:text-foreground/20 disabled:opacity-30"
          aria-label="Query key"
          onKeyDown={(e) => {
            if (e.key === "Enter" && queryInput) {
              doQuery(Number(queryInput));
            }
          }}
        />
        <button
          onClick={() => queryInput && doQuery(Number(queryInput))}
          disabled={phase !== "ready" || !queryInput}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-30"
        >
          query
        </button>

        <div className="mx-0.5 h-4 w-px bg-foreground/10" />

        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
            spd
          </span>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.25}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 w-14 accent-foreground/40"
          />
        </label>

        <div className="mx-0.5 h-4 w-px bg-foreground/10" />

        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30">
          {statusText}
        </span>
      </div>

      {/* Query result */}
      {queryResult && (
        <div
          className="fixed bottom-32 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
          style={{
            background: "rgba(128,128,128,0.08)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "4px",
            padding: "6px 10px",
            maxWidth: "90vw",
            whiteSpace: "nowrap",
          }}
        >
          {queryResult}
        </div>
      )}
    </>
  );
}

/* ── Helpers ── */

function hex(n: number): string {
  return "0x" + (n & 0xff).toString(16).padStart(2, "0");
}
