"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
}

type EdgeKind = "tree" | "back" | "cross" | "forward";

type TarjanStep =
  | { type: "visit"; node: number; discovery: number; lowLink: number }
  | { type: "edge"; from: number; to: number; kind: EdgeKind }
  | { type: "update"; node: number; newLowLink: number }
  | { type: "scc"; nodes: number[] }
  | { type: "done" };

type RunState = "idle" | "running" | "paused" | "done";

/* ────────────────────────────────────────────
   Graph generation
   ──────────────────────────────────────────── */

function generateGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodeCount = 12 + Math.floor(Math.random() * 5); // 12-16

  // Partition nodes into 3-5 clusters for SCCs
  const clusterCount = 3 + Math.floor(Math.random() * 3);
  const clusters: number[][] = Array.from({ length: clusterCount }, () => []);
  for (let i = 0; i < nodeCount; i++) {
    clusters[i % clusterCount].push(i);
  }

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];

  const addEdge = (from: number, to: number) => {
    if (from === to) return;
    const key = `${from}-${to}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ from, to });
  };

  // Make each cluster strongly connected (cycle + extra edges)
  for (const cluster of clusters) {
    if (cluster.length < 2) continue;
    // Create a cycle within the cluster
    for (let i = 0; i < cluster.length; i++) {
      addEdge(cluster[i], cluster[(i + 1) % cluster.length]);
    }
    // Add extra intra-cluster edges for density
    const extraCount = Math.floor(cluster.length * 0.6);
    for (let i = 0; i < extraCount; i++) {
      const a = cluster[Math.floor(Math.random() * cluster.length)];
      const b = cluster[Math.floor(Math.random() * cluster.length)];
      addEdge(a, b);
    }
  }

  // Add some inter-cluster edges (one direction only to avoid merging SCCs)
  for (let i = 0; i < clusterCount - 1; i++) {
    const from = clusters[i][Math.floor(Math.random() * clusters[i].length)];
    const to = clusters[i + 1][Math.floor(Math.random() * clusters[i + 1].length)];
    addEdge(from, to);
  }

  // Add a few random cross-cluster edges (forward direction only)
  const crossCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < crossCount; i++) {
    const ci = Math.floor(Math.random() * (clusterCount - 1));
    const cj = ci + 1 + Math.floor(Math.random() * (clusterCount - ci - 1));
    const from = clusters[ci][Math.floor(Math.random() * clusters[ci].length)];
    const to = clusters[cj][Math.floor(Math.random() * clusters[cj].length)];
    addEdge(from, to);
  }

  // Initial positions will be set by force layout
  const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
  }));

  return { nodes, edges };
}

/* ────────────────────────────────────────────
   Force-directed layout
   ──────────────────────────────────────────── */

function runForceLayout(nodes: Node[], edges: Edge[], width: number, height: number): void {
  const pad = 60;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Initialize positions in a circle
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(w, h) * 0.35;
  for (let i = 0; i < nodes.length; i++) {
    const angle = (2 * Math.PI * i) / nodes.length;
    nodes[i].x = cx + radius * Math.cos(angle);
    nodes[i].y = cy + radius * Math.sin(angle);
  }

  const vx = new Float64Array(nodes.length);
  const vy = new Float64Array(nodes.length);

  const repulsion = 3000;
  const attraction = 0.005;
  const damping = 0.85;
  const iterations = 200;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        vx[i] += dx;
        vy[i] += dy;
        vx[j] -= dx;
        vy[j] -= dy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const dx = nodes[edge.to].x - nodes[edge.from].x;
      const dy = nodes[edge.to].y - nodes[edge.from].y;
      const fx = dx * attraction;
      const fy = dy * attraction;
      vx[edge.from] += fx;
      vy[edge.from] += fy;
      vx[edge.to] -= fx;
      vy[edge.to] -= fy;
    }

    // Center gravity
    for (let i = 0; i < nodes.length; i++) {
      vx[i] += (cx - nodes[i].x) * 0.001;
      vy[i] += (cy - nodes[i].y) * 0.001;
    }

    // Apply velocities with damping and constrain
    for (let i = 0; i < nodes.length; i++) {
      vx[i] *= damping;
      vy[i] *= damping;
      nodes[i].x += vx[i];
      nodes[i].y += vy[i];
      nodes[i].x = Math.max(pad, Math.min(width - pad, nodes[i].x));
      nodes[i].y = Math.max(pad, Math.min(height - pad, nodes[i].y));
    }
  }
}

/* ────────────────────────────────────────────
   Tarjan's SCC algorithm (generator)
   ──────────────────────────────────────────── */

function* tarjanSCC(nodeCount: number, edges: Edge[]): Generator<TarjanStep, void, undefined> {
  // Build adjacency list
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const e of edges) {
    adj[e.from].push(e.to);
  }

  let time = 0;
  const disc = new Map<number, number>();
  const low = new Map<number, number>();
  const onStack = new Set<number>();
  const stack: number[] = [];

  function* dfs(u: number): Generator<TarjanStep, void, undefined> {
    const uDisc = time;
    disc.set(u, uDisc);
    low.set(u, uDisc);
    time++;
    stack.push(u);
    onStack.add(u);

    yield {
      type: "visit",
      node: u,
      discovery: uDisc,
      lowLink: uDisc,
    };

    for (const v of adj[u]) {
      if (!disc.has(v)) {
        yield { type: "edge", from: u, to: v, kind: "tree" };
        yield* dfs(v);
        const oldLow = low.get(u) ?? 0;
        const newLow = Math.min(oldLow, low.get(v) ?? 0);
        if (newLow !== oldLow) {
          low.set(u, newLow);
          yield { type: "update", node: u, newLowLink: newLow };
        }
      } else if (onStack.has(v)) {
        yield { type: "edge", from: u, to: v, kind: "back" };
        const oldLow = low.get(u) ?? 0;
        const newLow = Math.min(oldLow, disc.get(v) ?? 0);
        if (newLow !== oldLow) {
          low.set(u, newLow);
          yield { type: "update", node: u, newLowLink: newLow };
        }
      } else {
        yield { type: "edge", from: u, to: v, kind: "cross" };
      }
    }

    // Root of SCC
    if (low.get(u) === disc.get(u)) {
      const scc: number[] = [];
      let w = stack.pop();
      while (w !== undefined) {
        onStack.delete(w);
        scc.push(w);
        if (w === u) break;
        w = stack.pop();
      }
      yield { type: "scc", nodes: scc };
    }
  }

  for (let i = 0; i < nodeCount; i++) {
    if (!disc.has(i)) {
      yield* dfs(i);
    }
  }

  yield { type: "done" };
}

/* ────────────────────────────────────────────
   Color palettes
   ──────────────────────────────────────────── */

const SCC_COLORS_DARK = ["#d4ff00", "#00d4ff", "#ff6b6b", "#c084fc", "#34d399", "#fbbf24"];
const SCC_COLORS_LIGHT = ["#2a8a0e", "#0e6a8a", "#c0392b", "#7c3aed", "#059669", "#d97706"];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function Graph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const genRef = useRef<Generator<TarjanStep, void, undefined> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);

  // Algorithm state refs
  const discoveryRef = useRef<Map<number, number>>(new Map());
  const lowLinkRef = useRef<Map<number, number>>(new Map());
  const stackRef = useRef<number[]>([]);
  const sccsRef = useRef<number[][]>([]);
  const currentNodeRef = useRef<number | null>(null);
  const currentEdgeRef = useRef<{ from: number; to: number } | null>(null);
  const treeEdgesRef = useRef<Set<string>>(new Set());
  const backEdgesRef = useRef<Set<string>>(new Set());
  const crossEdgesRef = useRef<Set<string>>(new Set());
  const stateRef = useRef<RunState>("idle");
  const speedRef = useRef(3);
  const nodeToSccRef = useRef<Map<number, number>>(new Map());

  const [runState, setRunState] = useState<RunState>("idle");
  const [speed, setSpeed] = useState(3);

  /* ── Drawing ── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    if (nodes.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const isDark = getTheme() === "dark";

    const bg = isDark ? "#0a0a0a" : "#f5f1e8";
    const nodeMuted = isDark ? "rgba(224,226,220,0.2)" : "rgba(10,10,10,0.15)";
    const edgeMuted = isDark ? "rgba(224,226,220,0.15)" : "rgba(10,10,10,0.1)";
    const activeEdge = isDark ? "rgba(212,255,0,0.7)" : "rgba(42,138,14,0.6)";
    const textColor = isDark ? "rgba(224,226,220,0.6)" : "rgba(10,10,10,0.5)";
    const textDim = isDark ? "rgba(224,226,220,0.35)" : "rgba(10,10,10,0.3)";
    const accentBorder = isDark ? "#d4ff00" : "#2a8a0e";
    const sccColors = isDark ? SCC_COLORS_DARK : SCC_COLORS_LIGHT;
    const sccAlpha = isDark ? 0.6 : 0.5;
    const stackFill = isDark ? "rgba(212,255,0,0.12)" : "rgba(42,138,14,0.08)";
    const visitedFill = isDark ? "rgba(224,226,220,0.08)" : "rgba(10,10,10,0.05)";

    const nodeRadius = 16 * dpr;
    const arrowSize = 8 * dpr;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const discovery = discoveryRef.current;
    const lowLink = lowLinkRef.current;
    const stack = stackRef.current;
    const sccs = sccsRef.current;
    const currentEdge = currentEdgeRef.current;
    const nodeToScc = nodeToSccRef.current;
    const treeEdges = treeEdgesRef.current;
    const backEdges = backEdgesRef.current;
    const crossEdges = crossEdgesRef.current;
    const stackSet = new Set(stack);

    /* ── Draw edges ── */
    for (const edge of edges) {
      const from = nodes[edge.from];
      const to = nodes[edge.to];
      const dx = to.x * dpr - from.x * dpr;
      const dy = to.y * dpr - from.y * dpr;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      const startX = from.x * dpr + nx * nodeRadius;
      const startY = from.y * dpr + ny * nodeRadius;
      const endX = to.x * dpr - nx * (nodeRadius + arrowSize * 0.5);
      const endY = to.y * dpr - ny * (nodeRadius + arrowSize * 0.5);

      const edgeKey = `${edge.from}-${edge.to}`;
      const isCurrent = currentEdge && currentEdge.from === edge.from && currentEdge.to === edge.to;

      // Determine edge color
      const fromScc = nodeToScc.get(edge.from);
      const toScc = nodeToScc.get(edge.to);
      let edgeColor = edgeMuted;
      let lineWidth = 1 * dpr;
      let dashed = false;

      if (isCurrent) {
        edgeColor = activeEdge;
        lineWidth = 2.5 * dpr;
      } else if (fromScc !== undefined && toScc !== undefined && fromScc === toScc) {
        edgeColor = hexToRgba(sccColors[fromScc % sccColors.length], sccAlpha);
        lineWidth = 1.5 * dpr;
      } else if (treeEdges.has(edgeKey)) {
        edgeColor = isDark ? "rgba(224,226,220,0.4)" : "rgba(10,10,10,0.3)";
        lineWidth = 1.5 * dpr;
      } else if (backEdges.has(edgeKey) || crossEdges.has(edgeKey)) {
        dashed = true;
        edgeColor = isDark ? "rgba(224,226,220,0.2)" : "rgba(10,10,10,0.12)";
      }

      ctx.save();
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = lineWidth;
      if (dashed) ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();

      // Arrowhead
      const arrowX = to.x * dpr - nx * nodeRadius;
      const arrowY = to.y * dpr - ny * nodeRadius;
      ctx.save();
      ctx.fillStyle = edgeColor;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - nx * arrowSize + ny * arrowSize * 0.35,
        arrowY - ny * arrowSize - nx * arrowSize * 0.35,
      );
      ctx.lineTo(
        arrowX - nx * arrowSize - ny * arrowSize * 0.35,
        arrowY - ny * arrowSize + nx * arrowSize * 0.35,
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* ── Draw nodes ── */
    for (const node of nodes) {
      const x = node.x * dpr;
      const y = node.y * dpr;
      const sccIdx = nodeToScc.get(node.id);
      const isOnStack = stackSet.has(node.id);
      const isVisited = discovery.has(node.id);

      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);

      // Fill
      if (sccIdx !== undefined) {
        ctx.fillStyle = hexToRgba(sccColors[sccIdx % sccColors.length], sccAlpha * 0.5);
        ctx.fill();
      } else if (isOnStack) {
        ctx.fillStyle = stackFill;
        ctx.fill();
      } else if (isVisited) {
        ctx.fillStyle = visitedFill;
        ctx.fill();
      }

      // Stroke
      if (sccIdx !== undefined) {
        ctx.strokeStyle = hexToRgba(sccColors[sccIdx % sccColors.length], sccAlpha);
        ctx.lineWidth = 2 * dpr;
      } else if (isOnStack) {
        ctx.strokeStyle = accentBorder;
        ctx.lineWidth = 2.5 * dpr;
      } else {
        ctx.strokeStyle = nodeMuted;
        ctx.lineWidth = 1.5 * dpr;
      }
      ctx.stroke();

      // Node label
      ctx.fillStyle =
        sccIdx !== undefined
          ? hexToRgba(sccColors[sccIdx % sccColors.length], 0.9)
          : isOnStack
            ? accentBorder
            : textColor;
      ctx.font = `bold ${11 * dpr}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(node.id), x, y);

      // Discovery / low-link values
      if (isVisited) {
        const d = discovery.get(node.id) ?? 0;
        const l = lowLink.get(node.id) ?? 0;
        ctx.fillStyle = textDim;
        ctx.font = `${8 * dpr}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`d:${d} l:${l}`, x, y + nodeRadius + 3 * dpr);
      }
    }

    /* ── Info panel: DFS stack ── */
    if (stack.length > 0 || sccs.length > 0) {
      const panelX = 12 * dpr;
      const panelY = 56 * dpr;
      const lineH = 14 * dpr;
      const panelPad = 8 * dpr;

      ctx.font = `${9 * dpr}px monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      let yOff = panelY + panelPad;

      if (stack.length > 0) {
        ctx.fillStyle = textDim;
        ctx.fillText("STACK", panelX + panelPad, yOff);
        yOff += lineH;
        ctx.fillStyle = textColor;
        ctx.fillText(`[ ${stack.join(", ")} ]`, panelX + panelPad, yOff);
        yOff += lineH * 1.3;
      }

      if (sccs.length > 0) {
        ctx.fillStyle = textDim;
        ctx.fillText("SCCs FOUND", panelX + panelPad, yOff);
        yOff += lineH;
        for (let i = 0; i < sccs.length; i++) {
          ctx.fillStyle = hexToRgba(sccColors[i % sccColors.length], isDark ? 0.8 : 0.7);
          ctx.fillText(`{ ${sccs[i].join(", ")} }`, panelX + panelPad, yOff);
          yOff += lineH;
        }
      }
    }
  }, []);

  /* ── Step the algorithm ── */
  const stepOnce = useCallback((): boolean => {
    const gen = genRef.current;
    if (!gen) return true;

    const result = gen.next();
    if (result.done) {
      stateRef.current = "done";
      setRunState("done");
      currentNodeRef.current = null;
      currentEdgeRef.current = null;
      return true;
    }

    const step = result.value;

    switch (step.type) {
      case "visit":
        discoveryRef.current.set(step.node, step.discovery);
        lowLinkRef.current.set(step.node, step.lowLink);
        stackRef.current = [...stackRef.current, step.node];
        currentNodeRef.current = step.node;
        currentEdgeRef.current = null;
        break;
      case "edge":
        currentEdgeRef.current = { from: step.from, to: step.to };
        if (step.kind === "tree") treeEdgesRef.current.add(`${step.from}-${step.to}`);
        else if (step.kind === "back") backEdgesRef.current.add(`${step.from}-${step.to}`);
        else crossEdgesRef.current.add(`${step.from}-${step.to}`);
        break;
      case "update":
        lowLinkRef.current.set(step.node, step.newLowLink);
        currentEdgeRef.current = null;
        break;
      case "scc": {
        const sccIndex = sccsRef.current.length;
        sccsRef.current = [...sccsRef.current, step.nodes];
        for (const n of step.nodes) {
          nodeToSccRef.current.set(n, sccIndex);
        }
        // Remove SCC nodes from visual stack
        const sccSet = new Set(step.nodes);
        stackRef.current = stackRef.current.filter((n) => !sccSet.has(n));
        currentEdgeRef.current = null;
        break;
      }
      case "done":
        stateRef.current = "done";
        setRunState("done");
        currentNodeRef.current = null;
        currentEdgeRef.current = null;
        return true;
    }

    draw();
    return false;
  }, [draw]);

  /* ── Timer-based run loop ── */
  const scheduleStep = useCallback(() => {
    if (stateRef.current !== "running") return;
    const done = stepOnce();
    if (done) return;
    const delay = Math.max(20, 1000 / speedRef.current);
    timerRef.current = setTimeout(scheduleStep, delay);
  }, [stepOnce]);

  /* ── Reset algorithm state ── */
  const resetAlgoState = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    genRef.current = null;
    discoveryRef.current = new Map();
    lowLinkRef.current = new Map();
    stackRef.current = [];
    sccsRef.current = [];
    currentNodeRef.current = null;
    currentEdgeRef.current = null;
    treeEdgesRef.current = new Set();
    backEdgesRef.current = new Set();
    crossEdgesRef.current = new Set();
    nodeToSccRef.current = new Map();
    stateRef.current = "idle";
    setRunState("idle");
  }, []);

  /* ── Generate new graph ── */
  const generateNewGraph = useCallback(() => {
    resetAlgoState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.width / dpr;
    const displayH = canvas.height / dpr;

    const { nodes, edges } = generateGraph();
    runForceLayout(nodes, edges, displayW, displayH);
    nodesRef.current = nodes;
    edgesRef.current = edges;
    draw();
  }, [resetAlgoState, draw]);

  /* ── Run ── */
  const run = useCallback(() => {
    if (stateRef.current === "done") return;
    if (stateRef.current === "idle") {
      genRef.current = tarjanSCC(nodesRef.current.length, edgesRef.current);
    }
    stateRef.current = "running";
    setRunState("running");
    scheduleStep();
  }, [scheduleStep]);

  /* ── Pause ── */
  const pause = useCallback(() => {
    stateRef.current = "paused";
    setRunState("paused");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* ── Manual step ── */
  const manualStep = useCallback(() => {
    if (stateRef.current === "running" || stateRef.current === "done") return;
    if (stateRef.current === "idle") {
      genRef.current = tarjanSCC(nodesRef.current.length, edgesRef.current);
      stateRef.current = "paused";
      setRunState("paused");
    }
    stepOnce();
  }, [stepOnce]);

  /* ── Reduced motion: instant reveal ── */
  const instantReveal = useCallback(() => {
    const gen = tarjanSCC(nodesRef.current.length, edgesRef.current);
    genRef.current = gen;
    let result = gen.next();
    while (!result.done) {
      const step = result.value;
      switch (step.type) {
        case "visit":
          discoveryRef.current.set(step.node, step.discovery);
          lowLinkRef.current.set(step.node, step.lowLink);
          break;
        case "update":
          lowLinkRef.current.set(step.node, step.newLowLink);
          break;
        case "scc": {
          const sccIndex = sccsRef.current.length;
          sccsRef.current = [...sccsRef.current, step.nodes];
          for (const n of step.nodes) {
            nodeToSccRef.current.set(n, sccIndex);
          }
          break;
        }
        case "done":
          break;
      }
      result = gen.next();
    }
    stateRef.current = "done";
    setRunState("done");
    draw();
  }, [draw]);

  /* ── Mount ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      // Re-run layout if we have nodes
      if (nodesRef.current.length > 0) {
        runForceLayout(nodesRef.current, edgesRef.current, rect.width, rect.height);
      }
      draw();
    };

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);

    // Initial sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // Generate initial graph
    const displayW = rect.width;
    const displayH = rect.height;
    const { nodes, edges } = generateGraph();
    runForceLayout(nodes, edges, displayW, displayH);
    nodesRef.current = nodes;
    edgesRef.current = edges;
    draw();

    // Auto-run Tarjan's so the algorithm is running on page load
    {
      const gen = tarjanSCC(nodes.length, edges);
      genRef.current = gen;
      stateRef.current = "running";
      setRunState("running");
      scheduleStep();
    }

    // Reduced motion: instant reveal
    const reduced = prefersReducedMotion();
    if (reduced) {
      // Run algorithm to completion instantly
      const gen = tarjanSCC(nodes.length, edges);
      genRef.current = gen;
      let result = gen.next();
      while (!result.done) {
        const step = result.value;
        switch (step.type) {
          case "visit":
            discoveryRef.current.set(step.node, step.discovery);
            lowLinkRef.current.set(step.node, step.lowLink);
            break;
          case "update":
            lowLinkRef.current.set(step.node, step.newLowLink);
            break;
          case "scc": {
            const sccIndex = sccsRef.current.length;
            sccsRef.current = [...sccsRef.current, step.nodes];
            for (const n of step.nodes) {
              nodeToSccRef.current.set(n, sccIndex);
            }
            break;
          }
          case "done":
            break;
        }
        result = gen.next();
      }
      stateRef.current = "done";
      setRunState("done");
      draw();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [draw, instantReveal]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    speedRef.current = v;
    setSpeed(v);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />
      {/* Controls overlay */}
      <div
        className="fixed bottom-16 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded bg-background/60 px-4 py-2 backdrop-blur-sm"
        style={{ zIndex: 10 }}
      >
        <button
          onClick={generateNewGraph}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/60 transition-colors hover:text-foreground/90"
        >
          new graph
        </button>
        <span className="text-foreground/10">|</span>
        <button
          onClick={runState === "running" ? pause : run}
          disabled={runState === "done"}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/60 transition-colors hover:text-foreground/90 disabled:text-foreground/20"
        >
          {runState === "running" ? "pause" : "run"}
        </button>
        <span className="text-foreground/10">|</span>
        <button
          onClick={manualStep}
          disabled={runState === "running" || runState === "done"}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/60 transition-colors hover:text-foreground/90 disabled:text-foreground/20"
        >
          step
        </button>
        <span className="text-foreground/10">|</span>
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          spd
          <input
            type="range"
            min={1}
            max={20}
            value={speed}
            onChange={handleSpeedChange}
            className="h-1 w-16 cursor-pointer appearance-none rounded bg-foreground/10 accent-foreground/40"
          />
          <span className="w-5 text-right tabular-nums text-foreground/60">{speed}</span>
        </label>
      </div>
    </>
  );
}
