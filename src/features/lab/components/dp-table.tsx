"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { StepForward } from "lucide-react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import {
  ControlGroup,
  LabSelect,
  LabSlider,
  Tool,
  Transport,
} from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

/* ── Types ── */

interface CellStep {
  row: number;
  col: number;
  value: number;
  deps: { r: number; c: number }[];
  match: boolean;
}

type SimState = "idle" | "running" | "paused" | "done" | "traceback";

/* ── Preset string pairs ──
   The chrome has no free-text primitive, so the typed inputs become a curated
   set of recognizable edit-distance demo pairs. The classic SATURDAY/SUNDAY
   pair (Levenshtein's textbook example) stays the default. */

const PAIRS: { value: string; label: string; a: string; b: string }[] = [
  { value: "saturday", label: "saturday / sunday", a: "SATURDAY", b: "SUNDAY" },
  { value: "kitten", label: "kitten / sitting", a: "KITTEN", b: "SITTING" },
  { value: "intention", label: "intention / execution", a: "INTENTION", b: "EXECUTION" },
  { value: "flaw", label: "flaw / lawn", a: "FLAW", b: "LAWN" },
  { value: "sunday", label: "sunday / saturday", a: "SUNDAY", b: "SATURDAY" },
];

/* ── Palette ── */

const PALETTE = {
  dark: {
    bg: "#0a0a0a",
    cellBorder: "rgba(224,226,220,0.1)",
    filled: "rgba(224,226,220,0.06)",
    accent: "rgba(212,255,0,0.3)",
    depArrow: "rgba(212,255,0,0.5)",
    traceAccent: "rgba(212,255,0,0.8)",
    text: "rgba(224,226,220,0.7)",
    textDim: "rgba(224,226,220,0.35)",
    labelText: "rgba(224,226,220,0.5)",
  },
  light: {
    bg: "#f5f1e8",
    cellBorder: "rgba(10,10,10,0.08)",
    filled: "rgba(10,10,10,0.04)",
    accent: "rgba(42,138,14,0.2)",
    depArrow: "rgba(42,138,14,0.4)",
    traceAccent: "rgba(42,138,14,0.7)",
    text: "rgba(10,10,10,0.6)",
    textDim: "rgba(10,10,10,0.25)",
    labelText: "rgba(10,10,10,0.45)",
  },
};

/* ── Edit Distance Generator ── */

function* editDistanceGen(a: string, b: string): Generator<CellStep> {
  const m = a.length;
  const n = b.length;

  // Base case: row 0
  for (let j = 0; j <= n; j++) {
    const deps: { r: number; c: number }[] = j > 0 ? [{ r: 0, c: j - 1 }] : [];
    yield { row: 0, col: j, value: j, deps, match: false };
  }

  // Base case: col 0 (skip (0,0) already yielded)
  for (let i = 1; i <= m; i++) {
    yield { row: i, col: 0, value: i, deps: [{ r: i - 1, c: 0 }], match: false };
  }

  // Fill table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from<number>({ length: n + 1 }).fill(0),
  );
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 0; i <= m; i++) dp[i][0] = i;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = a[i - 1] === b[j - 1];
      const cost = match ? 0 : 1;
      const del = dp[i - 1][j] + 1;
      const ins = dp[i][j - 1] + 1;
      const sub = dp[i - 1][j - 1] + cost;
      dp[i][j] = Math.min(del, ins, sub);

      const deps: { r: number; c: number }[] = [
        { r: i - 1, c: j },
        { r: i, c: j - 1 },
        { r: i - 1, c: j - 1 },
      ];

      yield { row: i, col: j, value: dp[i][j], deps, match };
    }
  }
}

function computeTraceback(
  table: (number | null)[][],
  a: string,
  b: string,
): { r: number; c: number }[] {
  const path: { r: number; c: number }[] = [];
  let i = a.length;
  let j = b.length;
  path.push({ r: i, c: j });

  while (i > 0 || j > 0) {
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const diag = table[i - 1][j - 1] ?? Infinity;
      const up = table[i - 1][j] ?? Infinity;
      const left = table[i][j - 1] ?? Infinity;
      if (diag <= up && diag <= left) {
        i--;
        j--;
      } else if (up <= left) {
        i--;
      } else {
        j--;
      }
    }
    path.push({ r: i, c: j });
  }

  return path.reverse();
}

/* ── Component ── */

export function DpTable({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pair, setPair] = useState(PAIRS[0].value);
  const [simState, setSimState] = useState<SimState>("idle");
  const [speed, setSpeed] = useState(1);
  // Live telemetry, lifted from the sim for the readout HUD.
  const [distance, setDistance] = useState<number | null>(null);

  const active = PAIRS.find((p) => p.value === pair) ?? PAIRS[0];
  const stringA = active.a;
  const stringB = active.b;

  // Refs for animation loop access
  const stateRef = useRef<{
    table: (number | null)[][];
    currentCell: { row: number; col: number } | null;
    dependencies: { r: number; c: number }[];
    tracebackPath: { r: number; c: number }[];
    gen: Generator<CellStep> | null;
    simState: SimState;
    speed: number;
    stringA: string;
    stringB: string;
    frameCount: number;
    traceAnimIndex: number;
  }>({
    table: [],
    currentCell: null,
    dependencies: [],
    tracebackPath: [],
    gen: null,
    simState: "idle",
    speed: 1,
    stringA: PAIRS[0].a,
    stringB: PAIRS[0].b,
    frameCount: 0,
    traceAnimIndex: 0,
  });

  // Sync reactive state to ref
  useEffect(() => {
    stateRef.current.speed = speed;
  }, [speed]);

  useEffect(() => {
    stateRef.current.simState = simState;
  }, [simState]);

  const initTable = useCallback((a: string, b: string) => {
    const s = stateRef.current;
    s.table = Array.from({ length: a.length + 1 }, () =>
      Array.from<number | null>({ length: b.length + 1 }).fill(null),
    );
    s.currentCell = null;
    s.dependencies = [];
    s.tracebackPath = [];
    s.gen = editDistanceGen(a, b);
    s.stringA = a;
    s.stringB = b;
    s.frameCount = 0;
    s.traceAnimIndex = 0;
  }, []);

  const reset = useCallback(() => {
    initTable(stringA, stringB);
    setDistance(null);
    setSimState("running");
  }, [stringA, stringB, initTable]);

  // Auto-start on mount and string changes
  useEffect(() => {
    initTable(stringA, stringB);
    setDistance(null);
    setSimState("running");
  }, [stringA, stringB, initTable]);

  const stepOnce = useCallback((): boolean => {
    const s = stateRef.current;
    if (!s.gen) return false;
    const result = s.gen.next();
    if (result.done) return false;
    const { row, col, value, deps } = result.value;
    s.table[row][col] = value;
    s.currentCell = { row, col };
    s.dependencies = deps;
    s.frameCount++;
    return true;
  }, []);

  const handleStep = useCallback(() => {
    const s = stateRef.current;
    if (s.simState === "done" || s.simState === "traceback") return;
    if (s.simState !== "paused" && s.simState !== "idle") return;
    const hasMore = stepOnce();
    if (!hasMore) {
      s.tracebackPath = computeTraceback(s.table, s.stringA, s.stringB);
      s.traceAnimIndex = s.tracebackPath.length;
      s.currentCell = null;
      s.dependencies = [];
      setDistance(s.table[s.stringA.length]?.[s.stringB.length] ?? null);
      setSimState("done");
    }
  }, [stepOnce]);

  const handlePlayPause = useCallback(() => {
    setSimState((prev) => {
      if (prev === "running") return "paused";
      if (prev === "paused" || prev === "idle") return "running";
      if (prev === "done" || prev === "traceback") return prev;
      return prev;
    });
  }, []);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    // If reduced motion, fill everything instantly
    if (reduced) {
      const s = stateRef.current;
      if (s.gen) {
        let result = s.gen.next();
        while (!result.done) {
          const { row, col, value } = result.value;
          s.table[row][col] = value;
          result = s.gen.next();
        }
        s.gen = null;
        s.currentCell = null;
        s.dependencies = [];
        s.tracebackPath = computeTraceback(s.table, s.stringA, s.stringB);
        s.traceAnimIndex = s.tracebackPath.length;
        setDistance(s.table[s.stringA.length]?.[s.stringB.length] ?? null);
        setSimState("done");
      }
    }

    // Resize handler
    const observer = new ResizeObserver(([entry]) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(entry.contentRect.width * dpr);
      canvas.height = Math.round(entry.contentRect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    observer.observe(canvas);

    // Initial size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let tickAccum = 0;
    let lastTime = performance.now();

    // Alias for closure — already proven non-null above
    const cvs = canvas;
    const g = ctx;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      const theme = getTheme();
      const colors = PALETTE[theme];
      const w = cvs.width / (window.devicePixelRatio || 1);
      const h = cvs.height / (window.devicePixelRatio || 1);

      // Step logic
      if (s.simState === "running" && !reduced) {
        const stepsPerSecond = s.speed * 8;
        tickAccum += dt * stepsPerSecond;
        const steps = Math.floor(tickAccum);
        tickAccum -= steps;
        for (let i = 0; i < steps; i++) {
          const hasMore = stepOnce();
          if (!hasMore) {
            s.tracebackPath = computeTraceback(s.table, s.stringA, s.stringB);
            s.traceAnimIndex = 0;
            s.currentCell = null;
            s.dependencies = [];
            setDistance(s.table[s.stringA.length]?.[s.stringB.length] ?? null);
            setSimState("traceback");
            break;
          }
        }
      }

      // Traceback animation
      if (s.simState === "traceback" && !reduced) {
        tickAccum += dt * 6;
        const steps = Math.floor(tickAccum);
        tickAccum -= steps;
        for (let i = 0; i < steps; i++) {
          if (s.traceAnimIndex < s.tracebackPath.length) {
            s.traceAnimIndex++;
          } else {
            setSimState("done");
            break;
          }
        }
      }

      // ── Draw ──
      g.clearRect(0, 0, w, h);
      g.fillStyle = colors.bg;
      g.fillRect(0, 0, w, h);

      const rows = s.stringA.length + 1;
      const cols = s.stringB.length + 1;
      if (rows <= 1 && cols <= 1) return;

      // Compute cell size
      const maxCellW = (w * 0.8) / (cols + 1);
      const maxCellH = (h * 0.7) / (rows + 1);
      const cellSize = Math.max(24, Math.min(40, maxCellW, maxCellH));

      const tableW = (cols + 1) * cellSize;
      const tableH = (rows + 1) * cellSize;
      const offsetX = (w - tableW) / 2;
      const offsetY = (h - tableH) / 2 - 20;

      // Traceback set for quick lookup
      const traceSet = new Set<string>();
      for (let ti = 0; ti < s.traceAnimIndex; ti++) {
        const c = s.tracebackPath[ti];
        if (c) traceSet.add(`${c.r},${c.c}`);
      }

      // Dependency set
      const depSet = new Set<string>();
      for (const d of s.dependencies) {
        depSet.add(`${d.r},${d.c}`);
      }

      // ── Draw string B along top ──
      g.font = `${Math.min(14, cellSize * 0.4)}px monospace`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = colors.labelText;
      for (let j = 0; j < s.stringB.length; j++) {
        const x = offsetX + (j + 2) * cellSize + cellSize / 2;
        const y = offsetY + cellSize / 2;
        g.fillText(s.stringB[j], x, y);
      }

      // ── Draw string A along left ──
      for (let i = 0; i < s.stringA.length; i++) {
        const x = offsetX + cellSize / 2;
        const y = offsetY + (i + 2) * cellSize + cellSize / 2;
        g.fillText(s.stringA[i], x, y);
      }

      // ── Draw cells ──
      const fontSize = Math.min(12, cellSize * 0.35);
      g.font = `${fontSize}px monospace`;

      for (let i = 0; i <= s.stringA.length; i++) {
        for (let j = 0; j <= s.stringB.length; j++) {
          const cx = offsetX + (j + 1) * cellSize;
          const cy = offsetY + (i + 1) * cellSize;
          const val = s.table[i]?.[j];
          const key = `${i},${j}`;
          const isCurrent = s.currentCell?.row === i && s.currentCell?.col === j;
          const isDep = depSet.has(key);
          const isTrace = traceSet.has(key);

          // Cell background
          if (isCurrent) {
            g.fillStyle = colors.accent;
            g.fillRect(cx, cy, cellSize, cellSize);
          } else if (isTrace) {
            g.fillStyle = colors.traceAccent;
            g.globalAlpha = 0.25;
            g.fillRect(cx, cy, cellSize, cellSize);
            g.globalAlpha = 1;
          } else if (isDep) {
            g.fillStyle = colors.depArrow;
            g.globalAlpha = 0.3;
            g.fillRect(cx, cy, cellSize, cellSize);
            g.globalAlpha = 1;
          } else if (val !== null && val !== undefined) {
            g.fillStyle = colors.filled;
            g.fillRect(cx, cy, cellSize, cellSize);
          }

          // Cell border
          g.strokeStyle = colors.cellBorder;
          g.lineWidth = 1;
          g.strokeRect(cx, cy, cellSize, cellSize);

          // Cell value
          if (val !== null && val !== undefined) {
            g.fillStyle = isCurrent || isTrace ? colors.text : colors.textDim;
            if (isTrace) g.fillStyle = colors.text;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText(String(val), cx + cellSize / 2, cy + cellSize / 2);
          }
        }
      }

      // ── Draw dependency arrows ──
      if (s.currentCell && s.dependencies.length > 0) {
        g.strokeStyle = colors.depArrow;
        g.lineWidth = 1.5;
        const targetX = offsetX + (s.currentCell.col + 1) * cellSize + cellSize / 2;
        const targetY = offsetY + (s.currentCell.row + 1) * cellSize + cellSize / 2;

        for (const dep of s.dependencies) {
          const fromX = offsetX + (dep.c + 1) * cellSize + cellSize / 2;
          const fromY = offsetY + (dep.r + 1) * cellSize + cellSize / 2;

          g.beginPath();
          g.moveTo(fromX, fromY);
          g.lineTo(targetX, targetY);
          g.stroke();

          // Arrowhead
          const angle = Math.atan2(targetY - fromY, targetX - fromX);
          const headLen = 6;
          g.beginPath();
          g.moveTo(targetX, targetY);
          g.lineTo(
            targetX - headLen * Math.cos(angle - Math.PI / 6),
            targetY - headLen * Math.sin(angle - Math.PI / 6),
          );
          g.moveTo(targetX, targetY);
          g.lineTo(
            targetX - headLen * Math.cos(angle + Math.PI / 6),
            targetY - headLen * Math.sin(angle + Math.PI / 6),
          );
          g.stroke();
        }
      }

      // ── Draw traceback path line ──
      if (s.traceAnimIndex > 1) {
        g.strokeStyle = colors.traceAccent;
        g.lineWidth = 2;
        g.beginPath();
        for (let ti = 0; ti < s.traceAnimIndex && ti < s.tracebackPath.length; ti++) {
          const c = s.tracebackPath[ti];
          const px = offsetX + (c.c + 1) * cellSize + cellSize / 2;
          const py = offsetY + (c.r + 1) * cellSize + cellSize / 2;
          if (ti === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.stroke();
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [stringA, stringB, stepOnce]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      <LabReadout corner="left">
        <Gauge label="state" value={simState} />
        <Gauge label="edit distance" value={distance ?? "..."} primary />
      </LabReadout>

      <LabChrome
        identity={{ name: "dp table", scent: "edit distance · wagner-fischer fill" }}
        info={info}
      >
        <ControlGroup label="input">
          <LabSelect
            label="pair"
            value={pair}
            onChange={setPair}
            options={PAIRS.map((p) => ({ value: p.value, label: p.label }))}
          />
        </ControlGroup>
        <ControlGroup label="speed">
          <LabSlider label="spd" min={1} max={10} value={speed} onChange={setSpeed} />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Tool
            label="Step"
            title="Step one cell"
            onClick={handleStep}
            icon={<StepForward className="h-3.5 w-3.5" aria-hidden="true" />}
          />
          <Transport playing={simState === "running"} onToggle={handlePlayPause} onReset={reset} />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
