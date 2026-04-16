"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   L-system presets
   ──────────────────────────────────────────── */

type PresetId = "tree" | "bush" | "sierpinski" | "dragon" | "koch" | "fern";

interface Preset {
  label: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  maxIter: number;
  defaultIter: number;
}

const PRESETS: Record<PresetId, Preset> = {
  tree: {
    label: "TREE",
    axiom: "F",
    rules: { F: "FF+[+F-F-F]-[-F+F+F]" },
    angle: 22.5,
    maxIter: 6,
    defaultIter: 4,
  },
  bush: {
    label: "BUSH",
    axiom: "F",
    rules: { F: "F[+F]F[-F][F]" },
    angle: 25.7,
    maxIter: 6,
    defaultIter: 4,
  },
  sierpinski: {
    label: "SIERPINSKI",
    axiom: "F-G-G",
    rules: { F: "F-G+F+G-F", G: "GG" },
    angle: 120,
    maxIter: 7,
    defaultIter: 5,
  },
  dragon: {
    label: "DRAGON",
    axiom: "FX",
    rules: { X: "X+YF+", Y: "-FX-Y" },
    angle: 90,
    maxIter: 12,
    defaultIter: 10,
  },
  koch: {
    label: "KOCH",
    axiom: "F",
    rules: { F: "F+F-F-F+F" },
    angle: 90,
    maxIter: 5,
    defaultIter: 4,
  },
  fern: {
    label: "FERN",
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    angle: 25,
    maxIter: 6,
    defaultIter: 5,
  },
};

const PRESET_IDS: PresetId[] = ["tree", "bush", "sierpinski", "dragon", "koch", "fern"];

/* ────────────────────────────────────────────
   L-system generation
   ──────────────────────────────────────────── */

function generateString(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of current) {
      next += rules[ch] ?? ch;
    }
    current = next;
  }
  return current;
}

/* ────────────────────────────────────────────
   Turtle graphics interpreter
   ──────────────────────────────────────────── */

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
}

function interpretTurtle(lstring: string, angleDeg: number): Segment[] {
  const angleRad = (angleDeg * Math.PI) / 180;
  const segments: Segment[] = [];
  const stack: { x: number; y: number; angle: number; depth: number }[] = [];

  let x = 0;
  let y = 0;
  let angle = -Math.PI / 2; // Start pointing up
  let depth = 0;

  for (const ch of lstring) {
    switch (ch) {
      case "F":
      case "G": {
        const nx = x + Math.cos(angle);
        const ny = y + Math.sin(angle);
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
        x = nx;
        y = ny;
        break;
      }
      case "+":
        angle += angleRad;
        break;
      case "-":
        angle -= angleRad;
        break;
      case "[":
        stack.push({ x, y, angle, depth });
        depth++;
        break;
      case "]": {
        const state = stack.pop();
        if (state) {
          x = state.x;
          y = state.y;
          angle = state.angle;
          depth = state.depth;
        }
        break;
      }
      // X, Y, and other symbols are ignored during drawing
    }
  }

  return segments;
}

/* ────────────────────────────────────────────
   Compute bounding box and scale
   ──────────────────────────────────────────── */

function computeBounds(segments: Segment[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const seg of segments) {
    if (seg.x1 < minX) minX = seg.x1;
    if (seg.x2 < minX) minX = seg.x2;
    if (seg.y1 < minY) minY = seg.y1;
    if (seg.y2 < minY) minY = seg.y2;
    if (seg.x1 > maxX) maxX = seg.x1;
    if (seg.x2 > maxX) maxX = seg.x2;
    if (seg.y1 > maxY) maxY = seg.y1;
    if (seg.y2 > maxY) maxY = seg.y2;
  }

  return { minX, minY, maxX, maxY };
}

/* ────────────────────────────────────────────
   Max depth in segments
   ──────────────────────────────────────────── */

function maxDepth(segments: Segment[]): number {
  let max = 0;
  for (const seg of segments) {
    if (seg.depth > max) max = seg.depth;
  }
  return max;
}

/* ────────────────────────────────────────────
   Color interpolation
   ──────────────────────────────────────────── */

function lerpColor(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number,
  t: number,
): string {
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  const a = a1 + (a2 - a1) * t;
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function LSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activePreset, setActivePreset] = useState<PresetId>("tree");
  const [iterations, setIterations] = useState(PRESETS.tree.defaultIter);
  const [angleDeg, setAngleDeg] = useState(PRESETS.tree.angle);
  const [animate, setAnimate] = useState(true);

  // Refs for animation state
  const segmentsRef = useRef<Segment[]>([]);
  const drawIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const rafRef = useRef(0);

  /* ── Get available iteration values for the current preset ── */
  const getIterOptions = useCallback((presetId: PresetId) => {
    const preset = PRESETS[presetId];
    const options: number[] = [];
    for (let i = 2; i <= preset.maxIter; i++) {
      options.push(i);
    }
    return options;
  }, []);

  /* ── Generate and draw ── */
  const generate = useCallback(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    // Cancel any existing animation
    cancelAnimationFrame(rafRef.current);
    isAnimatingRef.current = false;

    const preset = PRESETS[activePreset];
    const lstring = generateString(preset.axiom, preset.rules, iterations);
    const segments = interpretTurtle(lstring, angleDeg);

    if (segments.length === 0) return;

    segmentsRef.current = segments;
    drawIndexRef.current = 0;

    const bounds = computeBounds(segments);
    const md = maxDepth(segments);

    const isDark = document.documentElement.classList.contains("dark");
    const bgColor = isDark ? "#0a0a0a" : "#f5f1e8";

    // Scale and center
    const bw = bounds.maxX - bounds.minX || 1;
    const bh = bounds.maxY - bounds.minY || 1;
    const padding = 60;
    const scaleX = (canvas.width - padding * 2) / bw;
    const scaleY = (canvas.height - padding * 2) / bh;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvas.width - bw * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - bh * scale) / 2 - bounds.minY * scale;

    // Color params
    const darkStart = { r: 224, g: 226, b: 220, a: 0.5 };
    const darkEnd = { r: 212, g: 255, b: 0, a: 0.6 };
    const lightStart = { r: 10, g: 10, b: 10, a: 0.4 };
    const lightEnd = { r: 42, g: 138, b: 14, a: 0.5 };
    const startColor = isDark ? darkStart : lightStart;
    const endColor = isDark ? darkEnd : lightEnd;

    // Max line width scales with fewer segments for visual balance
    const baseLineWidth = Math.max(0.5, Math.min(4, scale * 0.15));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = animate && !reduced;

    function drawSegment(seg: Segment) {
      const depthT = md > 0 ? seg.depth / md : 0;
      const color = lerpColor(
        startColor.r,
        startColor.g,
        startColor.b,
        startColor.a,
        endColor.r,
        endColor.g,
        endColor.b,
        endColor.a,
        depthT,
      );
      const lineWidth = Math.max(0.3, baseLineWidth * (1 - depthT * 0.7));

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(seg.x1 * scale + offsetX, seg.y1 * scale + offsetY);
      ctx.lineTo(seg.x2 * scale + offsetX, seg.y2 * scale + offsetY);
      ctx.stroke();
    }

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (shouldAnimate) {
      // Animated drawing: N segments per frame, scaled to total count
      const segmentsPerFrame = Math.max(1, Math.ceil(segments.length / 300));
      isAnimatingRef.current = true;

      function animateFrame() {
        if (!isAnimatingRef.current) return;

        const end = Math.min(drawIndexRef.current + segmentsPerFrame, segments.length);
        for (let i = drawIndexRef.current; i < end; i++) {
          drawSegment(segments[i]);
        }
        drawIndexRef.current = end;

        if (drawIndexRef.current < segments.length) {
          rafRef.current = requestAnimationFrame(animateFrame);
        } else {
          isAnimatingRef.current = false;
        }
      }

      rafRef.current = requestAnimationFrame(animateFrame);
    } else {
      // Instant drawing
      for (const seg of segments) {
        drawSegment(seg);
      }
    }
  }, [activePreset, iterations, angleDeg, animate]);

  /* ── Preset change handler ── */
  const handlePresetChange = useCallback((id: PresetId) => {
    setActivePreset(id);
    const preset = PRESETS[id];
    setAngleDeg(preset.angle);
    // Clamp iterations to preset max
    setIterations((prev) => Math.min(prev, preset.maxIter));
  }, []);

  /* ── Canvas setup and resize ── */
  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);

    const observer = new ResizeObserver(([entry]) => {
      const newW = Math.round(entry.contentRect.width);
      const newH = Math.round(entry.contentRect.height);
      canvas.width = newW;
      canvas.height = newH;
      generate();
    });
    observer.observe(canvas);

    // Theme observer: redraw on theme change
    const themeObserver = new MutationObserver(() => {
      generate();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      isAnimatingRef.current = false;
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, [generate]);

  /* ── Regenerate when params change ── */
  useEffect(() => {
    generate();
  }, [generate]);

  /* ── Styles ── */
  const btnBase = "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors";
  const btnInactive = "text-foreground/40 hover:text-foreground/70";
  const btnActive = "text-foreground/90";

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
        className="fixed bottom-16 left-1/2 z-10 -translate-x-1/2"
        style={{ touchAction: "none" }}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          {/* Preset buttons */}
          {PRESET_IDS.map((id) => (
            <button
              key={id}
              onClick={() => handlePresetChange(id)}
              className={`${btnBase} ${activePreset === id ? btnActive : btnInactive}`}
            >
              {PRESETS[id].label}
            </button>
          ))}

          <span className="h-4 w-px bg-foreground/10" />

          {/* Iterations selector */}
          <label className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              ITER
            </span>
            <select
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] text-foreground/60 outline-none"
            >
              {getIterOptions(activePreset).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Angle slider */}
          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              ANGLE
            </span>
            <input
              type="range"
              min={5}
              max={90}
              step={0.5}
              value={angleDeg}
              onChange={(e) => setAngleDeg(Number(e.target.value))}
              className="h-1 w-16 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-8 text-right font-mono text-[9px] tabular-nums text-foreground/30">
              {angleDeg.toFixed(1)}
            </span>
          </label>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Animate toggle */}
          <button
            onClick={() => setAnimate((prev) => !prev)}
            className={`${btnBase} ${animate ? btnActive : btnInactive}`}
          >
            ANIMATE
          </button>
        </div>
      </div>
    </>
  );
}
