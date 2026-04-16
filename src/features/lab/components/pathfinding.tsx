"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type Cell = [number, number];
type Algorithm = "bfs" | "dijkstra" | "astar";
type RunState = "drawing" | "running" | "paused" | "done";

type StepVisit = { type: "visit"; cell: Cell };
type StepFrontier = { type: "frontier"; cell: Cell };
type StepPath = { type: "path"; cells: Cell[] };
type StepDone = { type: "done" };
type Step = StepVisit | StepFrontier | StepPath | StepDone;

/* ────────────────────────────────────────────
   Colors
   ──────────────────────────────────────────── */

const COLORS = {
  dark: {
    bg: "#0a0a0a",
    grid: "rgba(224,226,220,0.06)",
    wall: "rgba(224,226,220,0.7)",
    visited: "rgba(224,226,220,0.08)",
    frontier: "rgba(212,255,0,0.25)",
    path: "rgba(212,255,0,0.8)",
    start: "rgba(212,255,0,0.6)",
    end: "rgba(212,255,0,0.6)",
    text: "rgba(224,226,220,0.4)",
  },
  light: {
    bg: "#f5f1e8",
    grid: "rgba(10,10,10,0.05)",
    wall: "rgba(10,10,10,0.7)",
    visited: "rgba(10,10,10,0.06)",
    frontier: "rgba(42,138,14,0.2)",
    path: "rgba(42,138,14,0.7)",
    start: "rgba(42,138,14,0.5)",
    end: "rgba(42,138,14,0.5)",
    text: "rgba(10,10,10,0.4)",
  },
} as const;

/* ────────────────────────────────────────────
   Priority queue (min-heap)
   ──────────────────────────────────────────── */

class MinHeap<T> {
  private heap: { priority: number; value: T }[] = [];

  push(value: T, priority: number) {
    this.heap.push({ priority, value });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].value;
    const end = this.heap.pop();
    if (end && this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.heap.length;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[i].priority >= this.heap[parent].priority) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

/* ────────────────────────────────────────────
   Algorithm generators
   ──────────────────────────────────────────── */

const DIRS: Cell[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function key(r: number, c: number) {
  return `${r},${c}`;
}

function reconstructPath(cameFrom: Map<string, string>, endKey: string): Cell[] {
  const path: Cell[] = [];
  let cur: string | undefined = endKey;
  while (cur !== undefined) {
    const [r, c] = cur.split(",").map(Number);
    path.push([r, c]);
    cur = cameFrom.get(cur);
  }
  path.reverse();
  return path;
}

function* bfs(
  grid: boolean[][],
  start: Cell,
  end: Cell,
  rows: number,
  cols: number,
): Generator<Step> {
  const queue: Cell[] = [start];
  const visited = new Set<string>([key(start[0], start[1])]);
  const cameFrom = new Map<string, string>();

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    const [r, c] = next;
    yield { type: "visit", cell: [r, c] };

    if (r === end[0] && c === end[1]) {
      yield { type: "path", cells: reconstructPath(cameFrom, key(r, c)) };
      yield { type: "done" };
      return;
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = key(nr, nc);
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc] && !visited.has(nk)) {
        visited.add(nk);
        cameFrom.set(nk, key(r, c));
        queue.push([nr, nc]);
        yield { type: "frontier", cell: [nr, nc] };
      }
    }
  }

  yield { type: "done" };
}

function* dijkstra(
  grid: boolean[][],
  start: Cell,
  end: Cell,
  rows: number,
  cols: number,
): Generator<Step> {
  const dist = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const visited = new Set<string>();
  const heap = new MinHeap<Cell>();

  const sk = key(start[0], start[1]);
  dist.set(sk, 0);
  heap.push(start, 0);

  while (heap.size > 0) {
    const popped = heap.pop();
    if (!popped) break;
    const [r, c] = popped;
    const ck = key(r, c);
    if (visited.has(ck)) continue;
    visited.add(ck);
    yield { type: "visit", cell: [r, c] };

    if (r === end[0] && c === end[1]) {
      yield { type: "path", cells: reconstructPath(cameFrom, ck) };
      yield { type: "done" };
      return;
    }

    const curDist = dist.get(ck) ?? 0;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = key(nr, nc);
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc] && !visited.has(nk)) {
        const nd = curDist + 1;
        if (!dist.has(nk) || nd < (dist.get(nk) ?? Infinity)) {
          dist.set(nk, nd);
          cameFrom.set(nk, ck);
          heap.push([nr, nc], nd);
          yield { type: "frontier", cell: [nr, nc] };
        }
      }
    }
  }

  yield { type: "done" };
}

function manhattan(a: Cell, b: Cell) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function* astar(
  grid: boolean[][],
  start: Cell,
  end: Cell,
  rows: number,
  cols: number,
): Generator<Step> {
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const visited = new Set<string>();
  const heap = new MinHeap<Cell>();

  const sk = key(start[0], start[1]);
  gScore.set(sk, 0);
  heap.push(start, manhattan(start, end));

  while (heap.size > 0) {
    const popped = heap.pop();
    if (!popped) break;
    const [r, c] = popped;
    const ck = key(r, c);
    if (visited.has(ck)) continue;
    visited.add(ck);
    yield { type: "visit", cell: [r, c] };

    if (r === end[0] && c === end[1]) {
      yield { type: "path", cells: reconstructPath(cameFrom, ck) };
      yield { type: "done" };
      return;
    }

    const curG = gScore.get(ck) ?? 0;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = key(nr, nc);
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc] && !visited.has(nk)) {
        const ng = curG + 1;
        if (!gScore.has(nk) || ng < (gScore.get(nk) ?? Infinity)) {
          gScore.set(nk, ng);
          cameFrom.set(nk, ck);
          heap.push([nr, nc], ng + manhattan([nr, nc], end));
          yield { type: "frontier", cell: [nr, nc] };
        }
      }
    }
  }

  yield { type: "done" };
}

const ALGORITHMS: Record<Algorithm, typeof bfs> = { bfs, dijkstra, astar };

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function Pathfinding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable refs that the animation loop reads
  const stateRef = useRef<{
    grid: boolean[][];
    rows: number;
    cols: number;
    cellSize: number;
    start: Cell;
    end: Cell;
    algorithm: Algorithm;
    runState: RunState;
    speed: number;
    visited: Set<string>;
    frontier: Set<string>;
    path: Cell[];
    visitedCount: number;
    gen: Generator<Step> | null;
    drawing: boolean;
    drawMode: "wall" | "clear";
    draggingStart: boolean;
    draggingEnd: boolean;
  }>({
    grid: [],
    rows: 0,
    cols: 0,
    cellSize: 16,
    start: [2, 2],
    end: [10, 10],
    algorithm: "astar",
    runState: "drawing",
    speed: 5,
    visited: new Set(),
    frontier: new Set(),
    path: [],
    visitedCount: 0,
    gen: null,
    drawing: false,
    drawMode: "wall",
    draggingStart: false,
    draggingEnd: false,
  });

  // React state for UI re-renders
  const [algorithm, setAlgorithm] = useState<Algorithm>("astar");
  const [runState, setRunState] = useState<RunState>("drawing");
  const [speed, setSpeed] = useState(5);
  const [visitedCount, setVisitedCount] = useState(0);

  const initGrid = useCallback((canvas: HTMLCanvasElement) => {
    const s = stateRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // Compute cell size to fill the canvas with ~16px cells
    const targetCell = 16 * dpr;
    const cols = Math.floor(canvas.width / targetCell);
    const rows = Math.floor(canvas.height / targetCell);
    const cellSize = Math.min(canvas.width / cols, canvas.height / rows);

    s.rows = rows;
    s.cols = cols;
    s.cellSize = cellSize;

    // Preserve walls that still fit; rebuild grid
    const oldGrid = s.grid;
    s.grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) =>
        r < oldGrid.length && c < (oldGrid[0]?.length ?? 0) ? oldGrid[r][c] : false,
      ),
    );

    // Clamp start/end
    s.start = [Math.min(s.start[0], rows - 1), Math.min(s.start[1], cols - 1)];
    s.end = [Math.min(s.end[0], rows - 1), Math.min(s.end[1], cols - 1)];

    // Default positions
    if (oldGrid.length === 0 || s.start[0] >= rows || s.start[1] >= cols) {
      s.start = [Math.floor(rows * 0.15), Math.floor(cols * 0.15)];
    }
    if (oldGrid.length === 0 || s.end[0] >= rows || s.end[1] >= cols) {
      s.end = [Math.floor(rows * 0.85), Math.floor(cols * 0.85)];
    }

    // Ensure start/end not on a wall
    s.grid[s.start[0]][s.start[1]] = false;
    s.grid[s.end[0]][s.end[1]] = false;
  }, []);

  const clearResults = useCallback(() => {
    const s = stateRef.current;
    s.visited.clear();
    s.frontier.clear();
    s.path = [];
    s.visitedCount = 0;
    s.gen = null;
    setVisitedCount(0);
  }, []);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = stateRef.current;

    // Reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      s.speed = 1;
      setSpeed(1);
    }

    initGrid(canvas);

    // ── Resize observer ──
    const observer = new ResizeObserver(() => {
      initGrid(canvas);
      clearResults();
      s.runState = "drawing";
      setRunState("drawing");
    });
    observer.observe(canvas);

    // ── Mouse helpers ──
    function cellAt(e: PointerEvent): Cell | null {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      const col = Math.floor(x / s.cellSize);
      const row = Math.floor(y / s.cellSize);
      if (row >= 0 && row < s.rows && col >= 0 && col < s.cols) {
        return [row, col];
      }
      return null;
    }

    function isStartOrEnd(r: number, c: number) {
      return (r === s.start[0] && c === s.start[1]) || (r === s.end[0] && c === s.end[1]);
    }

    function onPointerDown(e: PointerEvent) {
      const cell = cellAt(e);
      if (!cell) return;
      const [r, c] = cell;

      // Check if dragging start or end
      if (r === s.start[0] && c === s.start[1]) {
        s.draggingStart = true;
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      if (r === s.end[0] && c === s.end[1]) {
        s.draggingEnd = true;
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      if (s.runState !== "drawing" && s.runState !== "done") return;
      if (isStartOrEnd(r, c)) return;

      // Clear previous results when drawing in "done" state
      if (s.runState === "done") {
        clearResults();
        s.runState = "drawing";
        setRunState("drawing");
      }

      s.drawing = true;
      s.drawMode = s.grid[r][c] ? "clear" : "wall";
      s.grid[r][c] = s.drawMode === "wall";
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      const cell = cellAt(e);
      if (!cell) return;
      const [r, c] = cell;

      if (s.draggingStart) {
        if (!s.grid[r][c] && !(r === s.end[0] && c === s.end[1])) {
          s.start = [r, c];
          if (s.runState === "done") {
            clearResults();
            s.runState = "drawing";
            setRunState("drawing");
          }
        }
        return;
      }
      if (s.draggingEnd) {
        if (!s.grid[r][c] && !(r === s.start[0] && c === s.start[1])) {
          s.end = [r, c];
          if (s.runState === "done") {
            clearResults();
            s.runState = "drawing";
            setRunState("drawing");
          }
        }
        return;
      }

      if (!s.drawing) return;
      if (isStartOrEnd(r, c)) return;
      s.grid[r][c] = s.drawMode === "wall";
    }

    function onPointerUp() {
      s.drawing = false;
      s.draggingStart = false;
      s.draggingEnd = false;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ── Render loop ──
    let raf = 0;

    function render() {
      raf = requestAnimationFrame(render);
      const dpr = window.devicePixelRatio || 1;
      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const colors = COLORS[theme];

      const { rows, cols, cellSize } = s;
      const canvasW = cols * cellSize;
      const canvasH = rows * cellSize;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Offset to center grid
      const ox = (canvas.width - canvasW) / 2;
      const oy = (canvas.height - canvasH) / 2;
      ctx.setTransform(1, 0, 0, 1, ox, oy);

      // Background
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Visited cells
      ctx.fillStyle = colors.visited;
      for (const k of s.visited) {
        const [vr, vc] = k.split(",").map(Number);
        ctx.fillRect(vc * cellSize, vr * cellSize, cellSize, cellSize);
      }

      // Frontier cells
      ctx.fillStyle = colors.frontier;
      for (const k of s.frontier) {
        const [fr, fc] = k.split(",").map(Number);
        ctx.fillRect(fc * cellSize, fr * cellSize, cellSize, cellSize);
      }

      // Path cells
      if (s.path.length > 0) {
        ctx.fillStyle = colors.path;
        for (const [pr, pc] of s.path) {
          ctx.fillRect(pc * cellSize, pr * cellSize, cellSize, cellSize);
        }
      }

      // Walls
      ctx.fillStyle = colors.wall;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (s.grid[r]?.[c]) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }

      // Grid lines
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const y = Math.round(r * cellSize) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(canvasW, y);
      }
      for (let c = 0; c <= cols; c++) {
        const x = Math.round(c * cellSize) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasH);
      }
      ctx.stroke();

      // Start marker
      const sr = s.start[0];
      const sc = s.start[1];
      ctx.fillStyle = colors.start;
      ctx.beginPath();
      ctx.arc(
        sc * cellSize + cellSize / 2,
        sr * cellSize + cellSize / 2,
        cellSize * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // "S" label
      ctx.fillStyle = colors.text;
      ctx.font = `${Math.round(cellSize * 0.5)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", sc * cellSize + cellSize / 2, sr * cellSize + cellSize / 2);

      // End marker
      const er = s.end[0];
      const ec = s.end[1];
      ctx.fillStyle = colors.end;
      ctx.beginPath();
      ctx.arc(
        ec * cellSize + cellSize / 2,
        er * cellSize + cellSize / 2,
        cellSize * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // "E" label
      ctx.fillStyle = colors.text;
      ctx.fillText("E", ec * cellSize + cellSize / 2, er * cellSize + cellSize / 2);

      // Stats overlay (top-left, inside the grid)
      if (s.visitedCount > 0) {
        ctx.fillStyle = colors.text;
        ctx.font = `${Math.round(10 * dpr)}px monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`VISITED: ${s.visitedCount}`, 8 * dpr, 8 * dpr);
        if (s.path.length > 0) {
          ctx.fillText(`PATH: ${s.path.length}`, 8 * dpr, 22 * dpr);
        }
      }

      // Advance generator
      if (s.runState === "running" && s.gen) {
        for (let i = 0; i < s.speed; i++) {
          const result = s.gen.next();
          if (result.done) {
            s.runState = "done";
            setRunState("done");
            break;
          }
          const step = result.value;
          switch (step.type) {
            case "visit":
              s.frontier.delete(key(step.cell[0], step.cell[1]));
              s.visited.add(key(step.cell[0], step.cell[1]));
              s.visitedCount++;
              setVisitedCount(s.visitedCount);
              break;
            case "frontier":
              s.frontier.add(key(step.cell[0], step.cell[1]));
              break;
            case "path":
              s.path = step.cells;
              break;
            case "done":
              s.runState = "done";
              setRunState("done");
              break;
          }
          if (s.runState === "done") break;
        }
      }
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [initGrid, clearResults]);

  // ── Control handlers ──

  const handleRun = useCallback(() => {
    const s = stateRef.current;
    clearResults();
    const gen = ALGORITHMS[s.algorithm](s.grid, s.start, s.end, s.rows, s.cols);
    s.gen = gen;
    s.runState = "running";
    setRunState("running");
  }, [clearResults]);

  const handlePause = useCallback(() => {
    const s = stateRef.current;
    if (s.runState === "running") {
      s.runState = "paused";
      setRunState("paused");
    } else if (s.runState === "paused") {
      s.runState = "running";
      setRunState("running");
    }
  }, []);

  const handleStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.gen) {
      // Start fresh
      clearResults();
      s.gen = ALGORITHMS[s.algorithm](s.grid, s.start, s.end, s.rows, s.cols);
      s.runState = "paused";
      setRunState("paused");
    }
    // Advance one step
    const result = s.gen.next();
    if (result.done) {
      s.runState = "done";
      setRunState("done");
      return;
    }
    const step = result.value;
    switch (step.type) {
      case "visit":
        s.frontier.delete(key(step.cell[0], step.cell[1]));
        s.visited.add(key(step.cell[0], step.cell[1]));
        s.visitedCount++;
        setVisitedCount(s.visitedCount);
        break;
      case "frontier":
        s.frontier.add(key(step.cell[0], step.cell[1]));
        break;
      case "path":
        s.path = step.cells;
        break;
      case "done":
        s.runState = "done";
        setRunState("done");
        break;
    }
  }, [clearResults]);

  const handleClear = useCallback(() => {
    const s = stateRef.current;
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        s.grid[r][c] = false;
      }
    }
    clearResults();
    s.runState = "drawing";
    setRunState("drawing");
  }, [clearResults]);

  const handleAlgorithm = useCallback(
    (alg: Algorithm) => {
      const s = stateRef.current;
      s.algorithm = alg;
      setAlgorithm(alg);
      if (s.runState === "running" || s.runState === "paused") {
        clearResults();
        s.runState = "drawing";
        setRunState("drawing");
      }
    },
    [clearResults],
  );

  const handleSpeed = useCallback((val: number) => {
    stateRef.current.speed = val;
    setSpeed(val);
  }, []);

  const btnBase = "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors";
  const btnActive = "bg-foreground/10 text-foreground/80";
  const btnInactive = "text-foreground/30 hover:text-foreground/50";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none", cursor: "crosshair" }}
        aria-hidden="true"
      />

      {/* Controls overlay */}
      <div
        className="fixed bottom-16 left-1/2 z-10 -translate-x-1/2"
        style={{ touchAction: "none" }}
      >
        <div className="flex items-center gap-3 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          {/* Algorithm selector */}
          <div className="flex gap-1">
            {(["bfs", "dijkstra", "astar"] as const).map((alg) => (
              <button
                key={alg}
                onClick={() => handleAlgorithm(alg)}
                className={`${btnBase} ${algorithm === alg ? btnActive : btnInactive}`}
              >
                {alg === "astar" ? "A*" : alg.toUpperCase()}
              </button>
            ))}
          </div>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Run / Pause / Step */}
          <button
            onClick={handleRun}
            className={`${btnBase} ${btnInactive}`}
            disabled={runState === "running"}
          >
            {runState === "done" ? "RERUN" : "RUN"}
          </button>
          <button
            onClick={handlePause}
            className={`${btnBase} ${btnInactive}`}
            disabled={runState !== "running" && runState !== "paused"}
          >
            {runState === "paused" ? "RESUME" : "PAUSE"}
          </button>
          <button
            onClick={handleStep}
            className={`${btnBase} ${btnInactive}`}
            disabled={runState === "running"}
          >
            STEP
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Clear */}
          <button onClick={handleClear} className={`${btnBase} ${btnInactive}`}>
            CLEAR
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Speed */}
          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              SPD
            </span>
            <input
              type="range"
              min={1}
              max={30}
              value={speed}
              onChange={(e) => handleSpeed(Number(e.target.value))}
              className="h-1 w-16 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-5 font-mono text-[9px] text-foreground/30">{speed}</span>
          </label>

          {/* Visited count */}
          {visitedCount > 0 && (
            <>
              <span className="h-4 w-px bg-foreground/10" />
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
                {visitedCount} visited
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
