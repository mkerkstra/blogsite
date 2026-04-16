"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type StepType = "compare" | "swap" | "done";
interface Step {
  type: StepType;
  indices: [number, number];
}

interface AlgoState {
  name: string;
  arr: number[];
  gen: Generator<Step, void, undefined>;
  comparisons: number;
  swaps: number;
  active: [number, number] | null;
  done: boolean;
}

type RunState = "idle" | "running" | "paused" | "done";

/* ────────────────────────────────────────────
   Generator-based sorting algorithms
   Each yields after every comparison or swap.
   ──────────────────────────────────────────── */

function* quicksortGen(arr: number[]): Generator<Step, void, undefined> {
  function* partition(lo: number, hi: number): Generator<Step, number, undefined> {
    const pivot = arr[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield { type: "compare", indices: [j, hi] };
      if (arr[j] < pivot) {
        yield { type: "swap", indices: [i, j] };
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    yield { type: "swap", indices: [i, hi] };
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    return i;
  }

  function* sort(lo: number, hi: number): Generator<Step, void, undefined> {
    if (lo < hi) {
      const p: number = yield* partition(lo, hi);
      yield* sort(lo, p - 1);
      yield* sort(p + 1, hi);
    }
  }

  yield* sort(0, arr.length - 1);
  yield { type: "done", indices: [0, 0] };
}

function* mergesortGen(arr: number[]): Generator<Step, void, undefined> {
  function* sort(lo: number, hi: number): Generator<Step, void, undefined> {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    yield* sort(lo, mid);
    yield* sort(mid + 1, hi);
    yield* merge(lo, mid, hi);
  }

  function* merge(lo: number, mid: number, hi: number): Generator<Step, void, undefined> {
    const tmp = arr.slice(lo, hi + 1);
    let i = 0;
    let j = mid - lo + 1;
    let k = lo;
    while (i <= mid - lo && j <= hi - lo) {
      yield { type: "compare", indices: [lo + i, lo + j] };
      if (tmp[i] <= tmp[j]) {
        arr[k] = tmp[i];
        yield { type: "swap", indices: [k, lo + i] };
        i++;
      } else {
        arr[k] = tmp[j];
        yield { type: "swap", indices: [k, lo + j] };
        j++;
      }
      k++;
    }
    while (i <= mid - lo) {
      arr[k] = tmp[i];
      yield { type: "swap", indices: [k, lo + i] };
      i++;
      k++;
    }
    while (j <= hi - lo) {
      arr[k] = tmp[j];
      yield { type: "swap", indices: [k, lo + j] };
      j++;
      k++;
    }
  }

  yield* sort(0, arr.length - 1);
  yield { type: "done", indices: [0, 0] };
}

function* heapsortGen(arr: number[]): Generator<Step, void, undefined> {
  const n = arr.length;

  function* heapify(size: number, i: number): Generator<Step, void, undefined> {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < size) {
      yield { type: "compare", indices: [l, largest] };
      if (arr[l] > arr[largest]) largest = l;
    }
    if (r < size) {
      yield { type: "compare", indices: [r, largest] };
      if (arr[r] > arr[largest]) largest = r;
    }
    if (largest !== i) {
      yield { type: "swap", indices: [i, largest] };
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      yield* heapify(size, largest);
    }
  }

  // Build max-heap
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  // Extract
  for (let end = n - 1; end > 0; end--) {
    yield { type: "swap", indices: [0, end] };
    [arr[0], arr[end]] = [arr[end], arr[0]];
    yield* heapify(end, 0);
  }

  yield { type: "done", indices: [0, 0] };
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function generateArray(len: number): number[] {
  return Array.from({ length: len }, () => 5 + Math.random() * 90);
}

function createAlgoState(
  name: string,
  base: number[],
  genFn: (a: number[]) => Generator<Step, void, undefined>,
): AlgoState {
  const arr = base.slice();
  return {
    name,
    arr,
    gen: genFn(arr),
    comparisons: 0,
    swaps: 0,
    active: null,
    done: false,
  };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function Sorting() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const algosRef = useRef<AlgoState[]>([]);
  const stateRef = useRef<RunState>("idle");
  const speedRef = useRef(5);
  const rafRef = useRef(0);

  const [runState, setRunState] = useState<RunState>("idle");
  const [speed, setSpeed] = useState(5);

  /* ── Advance one algorithm by one step ── */
  const stepAlgo = useCallback((algo: AlgoState): void => {
    if (algo.done) return;
    const result = algo.gen.next();
    if (result.done) {
      algo.done = true;
      algo.active = null;
      return;
    }
    const step = result.value;
    if (step.type === "done") {
      algo.done = true;
      algo.active = null;
    } else if (step.type === "compare") {
      algo.comparisons++;
      algo.active = step.indices;
    } else if (step.type === "swap") {
      algo.swaps++;
      algo.active = step.indices;
    }
  }, []);

  /* ── Step all algorithms once ── */
  const stepAll = useCallback(
    (count: number) => {
      const algos = algosRef.current;
      for (let s = 0; s < count; s++) {
        for (const algo of algos) {
          stepAlgo(algo);
        }
      }
      if (algos.every((a) => a.done)) {
        stateRef.current = "done";
        setRunState("done");
      }
    },
    [stepAlgo],
  );

  /* ── Draw ── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const algos = algosRef.current;
    if (algos.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const isDark = document.documentElement.classList.contains("dark");

    const bg = isDark ? "#0a0a0a" : "#f5f1e8";
    const barColor = isDark ? "rgba(224,226,220,0.6)" : "rgba(10,10,10,0.5)";
    const accentColor = isDark ? "#d4ff00" : "#2a8a0e";
    const sortedColor = isDark ? "rgba(224,226,220,0.9)" : "rgba(10,10,10,0.85)";
    const textColor = isDark ? "rgba(224,226,220,0.7)" : "rgba(10,10,10,0.6)";
    const mutedColor = isDark ? "rgba(224,226,220,0.35)" : "rgba(10,10,10,0.3)";
    const dividerColor = "rgba(128,128,128,0.2)";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const panelW = w / 3;
    const headerH = 48;
    const bottomPad = 80;
    const barAreaH = h - headerH - bottomPad;
    const dpr = window.devicePixelRatio || 1;

    for (let p = 0; p < 3; p++) {
      const algo = algos[p];
      const x0 = p * panelW;
      const arr = algo.arr;
      const n = arr.length;
      const gap = 1;
      const totalGap = gap * (n - 1);
      const barW = Math.max(1, (panelW - 20 - totalGap) / n);
      const barStartX = x0 + 10;

      // Panel header
      ctx.font = `${10 * dpr}px monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = textColor;
      ctx.fillText(algo.name.toUpperCase(), x0 + 10, 14);
      ctx.fillStyle = mutedColor;
      ctx.fillText(`CMP ${algo.comparisons}  SWP ${algo.swaps}`, x0 + 10, 14 + (14 * dpr) / dpr);

      // Bars
      for (let i = 0; i < n; i++) {
        const barH = (arr[i] / 100) * barAreaH;
        const bx = barStartX + i * (barW + gap);
        const by = headerH + barAreaH - barH;

        if (algo.done) {
          ctx.fillStyle = sortedColor;
        } else if (algo.active && (i === algo.active[0] || i === algo.active[1])) {
          ctx.fillStyle = accentColor;
        } else {
          ctx.fillStyle = barColor;
        }
        ctx.fillRect(bx, by, barW, barH);
      }

      // Panel divider
      if (p < 2) {
        ctx.strokeStyle = dividerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0 + panelW, 0);
        ctx.lineTo(x0 + panelW, h);
        ctx.stroke();
      }
    }
  }, []);

  /* ── Reset / generate ── */
  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const base = generateArray(60);
    algosRef.current = [
      createAlgoState("quicksort", base, quicksortGen),
      createAlgoState("mergesort", base, mergesortGen),
      createAlgoState("heapsort", base, heapsortGen),
    ];
    stateRef.current = "idle";
    setRunState("idle");
    draw();
  }, [draw]);

  /* ── Animation loop ── */
  const loop = useCallback(() => {
    if (stateRef.current !== "running") return;
    stepAll(speedRef.current);
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [stepAll, draw]);

  const play = useCallback(() => {
    if (stateRef.current === "done") return;
    stateRef.current = "running";
    setRunState("running");
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const pause = useCallback(() => {
    stateRef.current = "paused";
    setRunState("paused");
    cancelAnimationFrame(rafRef.current);
  }, []);

  const manualStep = useCallback(() => {
    if (stateRef.current === "running" || stateRef.current === "done") return;
    if (stateRef.current === "idle") {
      stateRef.current = "paused";
      setRunState("paused");
    }
    stepAll(1);
    draw();
  }, [stepAll, draw]);

  /* ── Mount ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      draw();
    };

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    // Generate initial array
    const base = generateArray(60);
    algosRef.current = [
      createAlgoState("quicksort", base, quicksortGen),
      createAlgoState("mergesort", base, mergesortGen),
      createAlgoState("heapsort", base, heapsortGen),
    ];
    draw();

    // Auto-start unless reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      speedRef.current = 1;
      setSpeed(1);
      stateRef.current = "paused";
      setRunState("paused");
    } else {
      stateRef.current = "running";
      setRunState("running");
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [draw, loop]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    speedRef.current = v;
    setSpeed(v);
  }, []);

  const handleGenerate = useCallback(() => {
    reset();
    // Auto-start after generating
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      stateRef.current = "running";
      setRunState("running");
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [reset, loop]);

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
          onClick={handleGenerate}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/60 transition-colors hover:text-foreground/90"
        >
          generate
        </button>
        <span className="text-foreground/10">|</span>
        <button
          onClick={runState === "running" ? pause : play}
          disabled={runState === "done"}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/60 transition-colors hover:text-foreground/90 disabled:text-foreground/20"
        >
          {runState === "running" ? "pause" : "play"}
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
            max={50}
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
