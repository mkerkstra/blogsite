"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const CELL_SIZE = 8;

/* ────────────────────────────────────────────
   Pattern presets (relative coordinates)
   ──────────────────────────────────────────── */

type PatternId = "glider" | "gun" | "pulsar" | "rpentomino";

interface PatternDef {
  label: string;
  cells: [number, number][];
}

const PATTERNS: Record<PatternId, PatternDef> = {
  glider: {
    label: "Glider",
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  gun: {
    label: "Gosper Gun",
    cells: [
      // Left block
      [0, 4],
      [0, 5],
      [1, 4],
      [1, 5],
      // Left ship
      [10, 4],
      [10, 5],
      [10, 6],
      [11, 3],
      [11, 7],
      [12, 2],
      [12, 8],
      [13, 2],
      [13, 8],
      [14, 5],
      [15, 3],
      [15, 7],
      [16, 4],
      [16, 5],
      [16, 6],
      [17, 5],
      // Right ship
      [20, 2],
      [20, 3],
      [20, 4],
      [21, 2],
      [21, 3],
      [21, 4],
      [22, 1],
      [22, 5],
      [24, 0],
      [24, 1],
      [24, 5],
      [24, 6],
      // Right block
      [34, 2],
      [34, 3],
      [35, 2],
      [35, 3],
    ],
  },
  pulsar: {
    label: "Pulsar",
    cells: (() => {
      const offsets: [number, number][] = [];
      // The pulsar is symmetric across both axes. Define one quadrant and mirror.
      const quad: [number, number][] = [
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 1],
        [3, 1],
        [4, 1],
        [2, 6],
        [3, 6],
        [4, 6],
        [6, 2],
        [6, 3],
        [6, 4],
      ];
      // Mirror to all four quadrants
      for (const [r, c] of quad) {
        offsets.push([r, c]);
        offsets.push([r, 12 - c]);
        offsets.push([12 - r, c]);
        offsets.push([12 - r, 12 - c]);
      }
      // Deduplicate
      const seen = new Set<string>();
      const unique: [number, number][] = [];
      for (const [r, c] of offsets) {
        const key = `${r},${c}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push([r, c]);
        }
      }
      return unique;
    })(),
  },
  rpentomino: {
    label: "R-pentomino",
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
};

const PATTERN_IDS: PatternId[] = ["glider", "gun", "pulsar", "rpentomino"];

/* ────────────────────────────────────────────
   Grid helpers
   ──────────────────────────────────────────── */

function createGrid(cols: number, rows: number): Uint8Array {
  return new Uint8Array(cols * rows);
}

function idx(col: number, row: number, cols: number): number {
  return row * cols + col;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function GameOfLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable simulation state accessed by the animation loop
  const simRef = useRef<{
    cols: number;
    rows: number;
    grid: Uint8Array;
    prev: Uint8Array;
    back: Uint8Array;
    generation: number;
    playing: boolean;
    gps: number;
    lastTick: number;
    drawing: boolean;
    drawValue: number;
  }>({
    cols: 0,
    rows: 0,
    grid: new Uint8Array(0),
    prev: new Uint8Array(0),
    back: new Uint8Array(0),
    generation: 0,
    playing: false,
    gps: 10,
    lastTick: 0,
    drawing: false,
    drawValue: 1,
  });

  // React state for UI re-renders
  const [playing, setPlaying] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [gps, setGps] = useState(10);

  /* ── Initialize grid dimensions from canvas ── */
  const initGrid = useCallback((width: number, height: number) => {
    const s = simRef.current;
    const cols = Math.floor(width / CELL_SIZE);
    const rows = Math.floor(height / CELL_SIZE);

    // Preserve existing cells when resizing
    const oldGrid = s.grid;
    const oldCols = s.cols;
    const oldRows = s.rows;

    s.cols = cols;
    s.rows = rows;
    s.grid = createGrid(cols, rows);
    s.prev = createGrid(cols, rows);
    s.back = createGrid(cols, rows);

    // Copy cells that fit in both old and new dimensions
    const copyRows = Math.min(oldRows, rows);
    const copyCols = Math.min(oldCols, cols);
    for (let r = 0; r < copyRows; r++) {
      for (let c = 0; c < copyCols; c++) {
        s.grid[idx(c, r, cols)] = oldGrid[idx(c, r, oldCols)];
      }
    }
  }, []);

  /* ── Step: advance one generation ── */
  const step = useCallback(() => {
    const s = simRef.current;
    const { cols, rows, grid, back } = s;

    // Save current state as "previous" for rendering newborn/dying cells
    s.prev.set(grid);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Count live neighbors (toroidal wrapping)
        let neighbors = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = (r + dr + rows) % rows;
            const nc = (c + dc + cols) % cols;
            neighbors += grid[idx(nc, nr, cols)];
          }
        }

        const alive = grid[idx(c, r, cols)];
        // Conway's rules
        if (alive) {
          back[idx(c, r, cols)] = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          back[idx(c, r, cols)] = neighbors === 3 ? 1 : 0;
        }
      }
    }

    // Swap buffers
    s.grid = back;
    s.back = grid;
    s.generation++;
    setGeneration(s.generation);
  }, []);

  /* ── Clear grid ── */
  const clear = useCallback(() => {
    const s = simRef.current;
    s.grid.fill(0);
    s.prev.fill(0);
    s.back.fill(0);
    s.generation = 0;
    s.playing = false;
    setGeneration(0);
    setPlaying(false);
  }, []);

  /* ── Randomize grid ── */
  const randomize = useCallback(() => {
    const s = simRef.current;
    s.prev.set(s.grid);
    for (let i = 0; i < s.grid.length; i++) {
      s.grid[i] = Math.random() < 0.25 ? 1 : 0;
    }
    s.generation = 0;
    setGeneration(0);
  }, []);

  /* ── Load pattern centered in viewport ── */
  const loadPattern = useCallback((id: PatternId) => {
    const s = simRef.current;
    const pattern = PATTERNS[id];

    // Clear grid first
    s.grid.fill(0);
    s.prev.fill(0);
    s.generation = 0;
    setGeneration(0);

    // Find pattern bounding box
    let maxR = 0;
    let maxC = 0;
    for (const [c, r] of pattern.cells) {
      if (c > maxC) maxC = c;
      if (r > maxR) maxR = r;
    }

    // Center in grid
    const offsetC = Math.floor((s.cols - maxC) / 2);
    const offsetR = Math.floor((s.rows - maxR) / 2);

    for (const [c, r] of pattern.cells) {
      const gc = c + offsetC;
      const gr = r + offsetR;
      if (gc >= 0 && gc < s.cols && gr >= 0 && gr < s.rows) {
        s.grid[idx(gc, gr, s.cols)] = 1;
      }
    }
  }, []);

  /* ── Toggle play/pause ── */
  const togglePlay = useCallback(() => {
    const s = simRef.current;
    s.playing = !s.playing;
    setPlaying(s.playing);
  }, []);

  /* ── Manual step ── */
  const manualStep = useCallback(() => {
    step();
  }, [step]);

  /* ── Effect: Canvas setup and animation loop ── */
  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Size canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    initGrid(canvas.width, canvas.height);

    // Seed with a glider gun so the board starts alive
    {
      const pattern = PATTERNS.gun;
      const maxC = Math.max(...pattern.cells.map(([c]) => c));
      const maxR = Math.max(...pattern.cells.map(([, r]) => r));
      const offsetC = Math.floor((s.cols - maxC) / 2);
      const offsetR = Math.floor((s.rows - maxR) / 2);
      for (const [c, r] of pattern.cells) {
        const gc = c + offsetC;
        const gr = r + offsetR;
        if (gc >= 0 && gc < s.cols && gr >= 0 && gr < s.rows) {
          s.grid[idx(gc, gr, s.cols)] = 1;
        }
      }
      s.playing = true;
      setPlaying(true);
    }

    // Resize observer
    const observer = new ResizeObserver(([entry]) => {
      const newW = Math.round(entry.contentRect.width);
      const newH = Math.round(entry.contentRect.height);
      canvas.width = newW;
      canvas.height = newH;
      initGrid(newW, newH);
    });
    observer.observe(canvas);

    // ── Drawing (click/drag) ──
    const cellFromEvent = (e: PointerEvent): { col: number; row: number } | null => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const col = Math.floor(x / CELL_SIZE);
      const row = Math.floor(y / CELL_SIZE);
      if (col >= 0 && col < s.cols && row >= 0 && row < s.rows) {
        return { col, row };
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      s.drawing = true;
      const cell = cellFromEvent(e);
      if (cell) {
        // Toggle: if cell is alive, erase; if dead, draw
        const current = s.grid[idx(cell.col, cell.row, s.cols)];
        s.drawValue = current ? 0 : 1;
        s.grid[idx(cell.col, cell.row, s.cols)] = s.drawValue;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.drawing) return;
      const cell = cellFromEvent(e);
      if (cell) {
        s.grid[idx(cell.col, cell.row, s.cols)] = s.drawValue;
      }
    };

    const onPointerUp = () => {
      s.drawing = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    // ── Render loop ──
    let raf = 0;
    s.lastTick = performance.now();

    function render(now: number) {
      raf = requestAnimationFrame(render);

      const { cols, rows, grid, prev, gps: speed } = s;

      // Advance simulation at configured rate
      if (s.playing && !reduced) {
        const interval = 1000 / speed;
        if (now - s.lastTick >= interval) {
          s.lastTick = now - ((now - s.lastTick) % interval);
          step();
        }
      }

      // Theme detection
      const isDark = document.documentElement.classList.contains("dark");

      const bgColor = isDark ? "#0a0a0a" : "#f5f1e8";
      const aliveColor = isDark ? "rgba(224,226,220,0.8)" : "rgba(10,10,10,0.7)";
      const gridLineColor = isDark ? "rgba(224,226,220,0.04)" : "rgba(10,10,10,0.03)";
      const newbornColor = isDark ? "rgba(212,255,0,0.6)" : "rgba(42,138,14,0.5)";
      const dyingColor = isDark ? "rgba(224,226,220,0.25)" : "rgba(10,10,10,0.2)";

      const w = canvas.width;
      const h = canvas.height;

      // Clear
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // Draw grid lines
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const x = c * CELL_SIZE + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rows * CELL_SIZE);
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * CELL_SIZE + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(cols * CELL_SIZE, y);
      }
      ctx.stroke();

      // Draw cells in batches by type for fewer style changes
      // 1. Newborn cells (just became alive)
      ctx.fillStyle = newbornColor;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = idx(c, r, cols);
          if (grid[i] === 1 && prev[i] === 0) {
            ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
          }
        }
      }

      // 2. Surviving cells (alive in both prev and current)
      ctx.fillStyle = aliveColor;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = idx(c, r, cols);
          if (grid[i] === 1 && prev[i] === 1) {
            ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
          }
        }
      }

      // 3. Dying cells (alive in prev, dead now) -- faint ghost
      ctx.fillStyle = dyingColor;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = idx(c, r, cols);
          if (grid[i] === 0 && prev[i] === 1) {
            ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
          }
        }
      }
    }

    raf = requestAnimationFrame(render);

    // If reduced motion, start paused
    if (reduced) {
      s.playing = false;
      s.gps = 1;
      setPlaying(false);
      setGps(1);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [initGrid, step]);

  /* ── Speed change handler ── */
  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    simRef.current.gps = v;
    setGps(v);
  }, []);

  /* ── Styles ── */
  const btnBase =
    "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors text-foreground/40 hover:text-foreground/70";

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
        <div className="flex items-center gap-2 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          {/* Play / Pause */}
          <button onClick={togglePlay} className={btnBase}>
            {playing ? "PAUSE" : "PLAY"}
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Step */}
          <button onClick={manualStep} className={btnBase}>
            STEP
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Clear */}
          <button onClick={clear} className={btnBase}>
            CLEAR
          </button>

          {/* Random */}
          <button onClick={randomize} className={btnBase}>
            RANDOM
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Patterns */}
          {PATTERN_IDS.map((id) => (
            <button key={id} onClick={() => loadPattern(id)} className={btnBase}>
              {PATTERNS[id].label}
            </button>
          ))}

          <span className="h-4 w-px bg-foreground/10" />

          {/* Generation counter */}
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/50">
            GEN {generation}
          </span>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Speed slider */}
          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              SPD
            </span>
            <input
              type="range"
              min={1}
              max={30}
              value={gps}
              onChange={handleSpeedChange}
              className="h-1 w-16 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-5 text-right font-mono text-[9px] tabular-nums text-foreground/30">
              {gps}
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
