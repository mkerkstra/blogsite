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
  finishRank: number | null;
}

type RunState = "idle" | "running" | "paused" | "done";

type AlgoId =
  | "quicksort"
  | "mergesort"
  | "heapsort"
  | "insertion"
  | "selection"
  | "bubble"
  | "shell"
  | "radix";

type Distribution = "random" | "reversed" | "nearly" | "few";

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

  for (let i = (n >> 1) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  for (let end = n - 1; end > 0; end--) {
    yield { type: "swap", indices: [0, end] };
    [arr[0], arr[end]] = [arr[end], arr[0]];
    yield* heapify(end, 0);
  }

  yield { type: "done", indices: [0, 0] };
}

function* insertionGen(arr: number[]): Generator<Step, void, undefined> {
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0) {
      yield { type: "compare", indices: [j - 1, j] };
      if (arr[j - 1] <= arr[j]) break;
      yield { type: "swap", indices: [j - 1, j] };
      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      j--;
    }
  }
  yield { type: "done", indices: [0, 0] };
}

function* selectionGen(arr: number[]): Generator<Step, void, undefined> {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      yield { type: "compare", indices: [j, minIdx] };
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      yield { type: "swap", indices: [i, minIdx] };
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  yield { type: "done", indices: [0, 0] };
}

function* bubbleGen(arr: number[]): Generator<Step, void, undefined> {
  for (let i = 0; i < arr.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < arr.length - 1 - i; j++) {
      yield { type: "compare", indices: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        yield { type: "swap", indices: [j, j + 1] };
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  yield { type: "done", indices: [0, 0] };
}

function* shellGen(arr: number[]): Generator<Step, void, undefined> {
  // Ciura gap sequence
  const gaps = [701, 301, 132, 57, 23, 10, 4, 1].filter((g) => g < arr.length);
  if (gaps.length === 0 || gaps[gaps.length - 1] !== 1) gaps.push(1);

  for (const gap of gaps) {
    for (let i = gap; i < arr.length; i++) {
      let j = i;
      while (j >= gap) {
        yield { type: "compare", indices: [j - gap, j] };
        if (arr[j - gap] <= arr[j]) break;
        yield { type: "swap", indices: [j - gap, j] };
        [arr[j - gap], arr[j]] = [arr[j], arr[j - gap]];
        j -= gap;
      }
    }
  }
  yield { type: "done", indices: [0, 0] };
}

function* radixGen(arr: number[]): Generator<Step, void, undefined> {
  // LSD radix sort (base 10) on integer part of values 0-99
  // We treat the array as integers for bucketing, preserving exact values
  const maxVal = Math.max(...arr);
  const digits = maxVal > 0 ? Math.floor(Math.log10(maxVal)) + 1 : 1;

  for (let d = 0; d < digits; d++) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    const divisor = 10 ** d;

    // Distribute into buckets
    for (let i = 0; i < arr.length; i++) {
      const digit = Math.floor(arr[i] / divisor) % 10;
      buckets[digit].push(arr[i]);
      yield { type: "compare", indices: [i, i] };
    }

    // Collect from buckets back into array
    let idx = 0;
    for (const bucket of buckets) {
      for (const val of bucket) {
        arr[idx] = val;
        yield { type: "swap", indices: [idx, idx] };
        idx++;
      }
    }
  }
  yield { type: "done", indices: [0, 0] };
}

/* ────────────────────────────────────────────
   Algorithm registry
   ──────────────────────────────────────────── */

const ALGO_REGISTRY: Record<
  AlgoId,
  { label: string; gen: (a: number[]) => Generator<Step, void, undefined> }
> = {
  quicksort: { label: "Quick", gen: quicksortGen },
  mergesort: { label: "Merge", gen: mergesortGen },
  heapsort: { label: "Heap", gen: heapsortGen },
  insertion: { label: "Insertion", gen: insertionGen },
  selection: { label: "Selection", gen: selectionGen },
  bubble: { label: "Bubble", gen: bubbleGen },
  shell: { label: "Shell", gen: shellGen },
  radix: { label: "Radix", gen: radixGen },
};

const ALL_ALGOS: AlgoId[] = [
  "quicksort",
  "mergesort",
  "heapsort",
  "insertion",
  "selection",
  "bubble",
  "shell",
  "radix",
];

const SIZES = [30, 60, 120, 200] as const;

const DISTRIBUTIONS: { id: Distribution; label: string }[] = [
  { id: "random", label: "Random" },
  { id: "reversed", label: "Reversed" },
  { id: "nearly", label: "Nearly" },
  { id: "few", label: "Few unique" },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function generateArray(len: number, dist: Distribution): number[] {
  switch (dist) {
    case "random":
      return Array.from({ length: len }, () => 5 + Math.random() * 90);
    case "reversed":
      return Array.from({ length: len }, (_, i) => 5 + ((len - 1 - i) / (len - 1)) * 90);
    case "nearly": {
      // Sorted with ~10% elements swapped
      const arr = Array.from({ length: len }, (_, i) => 5 + (i / (len - 1)) * 90);
      const swapCount = Math.max(1, Math.floor(len * 0.1));
      for (let s = 0; s < swapCount; s++) {
        const a = Math.floor(Math.random() * len);
        const b = Math.floor(Math.random() * len);
        [arr[a], arr[b]] = [arr[b], arr[a]];
      }
      return arr;
    }
    case "few": {
      // Only 5-8 distinct values
      const values = Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () =>
        Math.round(5 + Math.random() * 90),
      );
      return Array.from({ length: len }, () => values[Math.floor(Math.random() * values.length)]);
    }
  }
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
    finishRank: null,
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
  const [selected, setSelected] = useState<[AlgoId, AlgoId, AlgoId]>([
    "quicksort",
    "mergesort",
    "heapsort",
  ]);
  const [arraySize, setArraySize] = useState<number>(60);
  const [distribution, setDistribution] = useState<Distribution>("random");

  // Refs for config so animation loop can read latest values
  const selectedRef = useRef(selected);
  const arraySizeRef = useRef(arraySize);
  const distributionRef = useRef(distribution);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    arraySizeRef.current = arraySize;
  }, [arraySize]);
  useEffect(() => {
    distributionRef.current = distribution;
  }, [distribution]);

  /* ── Advance one algorithm by one step ── */
  const stepAlgo = useCallback((algo: AlgoState): void => {
    if (algo.done) return;
    const result = algo.gen.next();
    if (result.done) {
      algo.done = true;
      algo.active = null;
      if (algo.finishRank === null) {
        const finished = algosRef.current.filter((a) => a.done).length;
        algo.finishRank = finished;
      }
      return;
    }
    const step = result.value;
    if (step.type === "done") {
      algo.done = true;
      algo.active = null;
      if (algo.finishRank === null) {
        const finished = algosRef.current.filter((a) => a.done).length;
        algo.finishRank = finished;
      }
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

    const panelCount = algos.length;
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

    const panelW = w / panelCount;
    const dpr = window.devicePixelRatio || 1;
    const navH = 52 * dpr;
    const headerH = navH + 40 * dpr;
    const bottomPad = 80 * dpr;
    const barAreaH = h - headerH - bottomPad;
    const rankLabels = ["1ST", "2ND", "3RD"];

    for (let p = 0; p < panelCount; p++) {
      const algo = algos[p];
      const x0 = p * panelW;
      const arr = algo.arr;
      const n = arr.length;
      const gap = n > 100 ? 0 : 1;
      const totalGap = gap * (n - 1);
      const barW = Math.max(1, (panelW - 20 * dpr - totalGap) / n);
      const barStartX = x0 + 10 * dpr;
      const ops = algo.comparisons + algo.swaps;

      // Bars (drawn first, header overlays on top)
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

      // Header backdrop — gradient fading from bg to transparent
      const grad = ctx.createLinearGradient(x0, navH, x0, headerH + 12 * dpr);
      grad.addColorStop(0, bg);
      grad.addColorStop(0.6, bg);
      grad.addColorStop(1, isDark ? "rgba(10,10,10,0)" : "rgba(245,241,232,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x0, navH, panelW, headerH - navH + 12 * dpr);

      // Panel header — name + rank badge
      const textX = x0 + 10 * dpr;
      const nameY = navH + 6 * dpr;
      ctx.font = `bold ${11 * dpr}px monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = algo.done ? sortedColor : textColor;
      ctx.fillText(algo.name.toUpperCase(), textX, nameY);

      if (algo.finishRank !== null && algo.finishRank <= 3) {
        const nameW = ctx.measureText(algo.name.toUpperCase()).width;
        ctx.font = `bold ${9 * dpr}px monospace`;
        ctx.fillStyle = algo.finishRank === 1 ? accentColor : mutedColor;
        ctx.fillText(rankLabels[algo.finishRank - 1], textX + nameW + 8 * dpr, nameY + 1 * dpr);
      }

      // Stats line
      ctx.font = `${9 * dpr}px monospace`;
      ctx.fillStyle = mutedColor;
      const statsY = nameY + 16 * dpr;
      ctx.fillText(`CMP ${algo.comparisons}`, textX, statsY);
      const cmpW = ctx.measureText(`CMP ${algo.comparisons}`).width;
      ctx.fillText(`SWP ${algo.swaps}`, textX + cmpW + 10 * dpr, statsY);
      const swpW = ctx.measureText(`SWP ${algo.swaps}`).width;
      ctx.fillStyle = algo.done ? textColor : mutedColor;
      ctx.fillText(`OPS ${ops}`, textX + cmpW + 10 * dpr + swpW + 10 * dpr, statsY);

      // Panel divider
      if (p < panelCount - 1) {
        ctx.strokeStyle = dividerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0 + panelW, 0);
        ctx.lineTo(x0 + panelW, h);
        ctx.stroke();
      }
    }
  }, []);

  /* ── Build algo states from current config ── */
  const buildAlgos = useCallback(() => {
    const sel = selectedRef.current;
    const base = generateArray(arraySizeRef.current, distributionRef.current);
    algosRef.current = sel.map((id) => {
      const reg = ALGO_REGISTRY[id];
      return createAlgoState(reg.label, base, reg.gen);
    });
  }, []);

  /* ── Reset / generate ── */
  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    buildAlgos();
    stateRef.current = "idle";
    setRunState("idle");
    draw();
  }, [draw, buildAlgos]);

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
    buildAlgos();
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
  }, [draw, loop, buildAlgos]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    speedRef.current = v;
    setSpeed(v);
  }, []);

  const handleGenerate = useCallback(() => {
    reset();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      stateRef.current = "running";
      setRunState("running");
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [reset, loop]);

  /* ── Slot cycling: click a panel header to cycle its algorithm ── */
  const cycleSlot = useCallback((slot: 0 | 1 | 2) => {
    setSelected((prev) => {
      const next = [...prev] as [AlgoId, AlgoId, AlgoId];
      const current = prev[slot];
      const currentIdx = ALL_ALGOS.indexOf(current);
      // Find the next algorithm not already selected in another slot
      for (let offset = 1; offset <= ALL_ALGOS.length; offset++) {
        const candidate = ALL_ALGOS[(currentIdx + offset) % ALL_ALGOS.length];
        if (!prev.includes(candidate) || candidate === current) {
          next[slot] = candidate;
          break;
        }
      }
      return next;
    });
  }, []);

  // When config changes, rebuild and restart
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, arraySize, distribution]);

  const btnBase =
    "font-mono text-[10px] uppercase tracking-[0.12em] transition-colors px-1.5 py-0.5";
  const btnActive = "text-foreground/80";
  const btnInactive = "text-foreground/30 hover:text-foreground/50";

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
        className="fixed bottom-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 rounded bg-background/60 px-4 py-2.5 backdrop-blur-sm"
        style={{ zIndex: 10 }}
      >
        {/* Row 1: Algorithm slots */}
        <div className="flex items-center gap-1">
          {([0, 1, 2] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => cycleSlot(slot)}
              title="Click to cycle algorithm"
              className={`${btnBase} ${btnActive} rounded border border-foreground/10 px-2 py-0.5`}
            >
              {ALGO_REGISTRY[selected[slot]].label}
            </button>
          ))}

          <span className="mx-1 h-3 w-px bg-foreground/10" />

          {/* Array size */}
          {SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setArraySize(n)}
              className={`${btnBase} ${arraySize === n ? btnActive : btnInactive}`}
            >
              {n}
            </button>
          ))}

          <span className="mx-1 h-3 w-px bg-foreground/10" />

          {/* Distribution */}
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDistribution(d.id)}
              className={`${btnBase} ${distribution === d.id ? btnActive : btnInactive}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Row 2: Playback controls */}
        <div className="flex items-center gap-3">
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
      </div>
    </>
  );
}
