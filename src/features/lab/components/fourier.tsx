"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface Point {
  x: number;
  y: number;
}

interface FourierTerm {
  freq: number;
  amp: number;
  phase: number;
}

type Phase = "idle" | "drawing" | "playing";

/* ────────────────────────────────────────────
   Colors
   ──────────────────────────────────────────── */

const COLORS = {
  dark: {
    bg: "#0a0a0a",
    circle: "rgba(224,226,220,0.1)",
    radius: "rgba(224,226,220,0.2)",
    trace: "#d4ff00",
    userPath: "rgba(212,255,0,0.3)",
    text: "rgba(224,226,220,0.35)",
  },
  light: {
    bg: "#f5f1e8",
    circle: "rgba(10,10,10,0.08)",
    radius: "rgba(10,10,10,0.15)",
    trace: "#2a8a0e",
    userPath: "rgba(42,138,14,0.2)",
    text: "rgba(10,10,10,0.25)",
  },
} as const;

/* ────────────────────────────────────────────
   DFT
   ──────────────────────────────────────────── */

function dft(samples: Point[]): FourierTerm[] {
  const N = samples.length;
  const result: FourierTerm[] = [];
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += samples[n].x * Math.cos(angle) + samples[n].y * Math.sin(angle);
      im += -samples[n].x * Math.sin(angle) + samples[n].y * Math.cos(angle);
    }
    re /= N;
    im /= N;
    result.push({
      freq: k,
      amp: Math.sqrt(re * re + im * im),
      phase: Math.atan2(im, re),
    });
  }
  // Sort by amplitude descending so largest circles come first
  result.sort((a, b) => b.amp - a.amp);
  return result;
}

/* ────────────────────────────────────────────
   Resample path to evenly-spaced points
   ──────────────────────────────────────────── */

function resample(path: Point[], count: number): Point[] {
  if (path.length < 2) return path;

  // Calculate cumulative arc lengths
  const lengths: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }

  const totalLength = lengths[lengths.length - 1];
  if (totalLength < 1) return path;

  const result: Point[] = [];
  let pathIdx = 0;

  for (let i = 0; i < count; i++) {
    const targetDist = (i / count) * totalLength;

    // Advance along path until we straddle the target distance
    while (pathIdx < lengths.length - 2 && lengths[pathIdx + 1] < targetDist) {
      pathIdx++;
    }

    const segLen = lengths[pathIdx + 1] - lengths[pathIdx];
    const t = segLen > 0 ? (targetDist - lengths[pathIdx]) / segLen : 0;

    result.push({
      x: path[pathIdx].x + (path[pathIdx + 1].x - path[pathIdx].x) * t,
      y: path[pathIdx].y + (path[pathIdx + 1].y - path[pathIdx].y) * t,
    });
  }

  return result;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

const RESAMPLE_COUNT = 200;

export function Fourier() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable sim state read by the animation loop
  const simRef = useRef<{
    phase: Phase;
    rawPath: Point[];
    terms: FourierTerm[];
    tracedPath: Point[];
    time: number;
    maxTerms: number;
    speed: number;
  }>({
    phase: "idle",
    rawPath: [],
    terms: [],
    tracedPath: [],
    time: 0,
    maxTerms: 80,
    speed: 1,
  });

  // React state for UI controls
  const [phase, setPhase] = useState<Phase>("idle");
  const [maxTerms, setMaxTerms] = useState(80);
  const [speed, setSpeed] = useState(1);

  const handleClear = useCallback(() => {
    const s = simRef.current;
    s.phase = "idle";
    s.rawPath = [];
    s.terms = [];
    s.tracedPath = [];
    s.time = 0;
    setPhase("idle");
  }, []);

  const handleTerms = useCallback((val: number) => {
    simRef.current.maxTerms = val;
    setMaxTerms(val);
  }, []);

  const handleSpeed = useCallback((val: number) => {
    simRef.current.speed = val;
    setSpeed(val);
  }, []);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Size canvas ──
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // ── Seed a star shape so we don't start blank ──
    {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) * 0.35;
      const starPath: Point[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        starPath.push({
          x: cx + radius * Math.cos(outerAngle),
          y: cy + radius * Math.sin(outerAngle),
        });
        starPath.push({
          x: cx + radius * 0.4 * Math.cos(innerAngle),
          y: cy + radius * 0.4 * Math.sin(innerAngle),
        });
      }
      starPath.push(starPath[0]); // close the shape
      const resampled = resample(starPath, RESAMPLE_COUNT);
      s.terms = dft(resampled);
      s.rawPath = starPath;
      s.tracedPath = [];
      s.time = 0;
      s.phase = "playing";
      setPhase("playing");
    }

    // ── Pointer helpers ──
    function canvasCoords(e: PointerEvent): Point {
      const r = canvas.getBoundingClientRect();
      const dp = window.devicePixelRatio || 1;
      return {
        x: (e.clientX - r.left) * dp,
        y: (e.clientY - r.top) * dp,
      };
    }

    function onPointerDown(e: PointerEvent) {
      if (s.phase === "playing") return;
      s.phase = "drawing";
      setPhase("drawing");
      s.rawPath = [canvasCoords(e)];
      s.terms = [];
      s.tracedPath = [];
      s.time = 0;
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (s.phase !== "drawing") return;
      s.rawPath.push(canvasCoords(e));
    }

    function onPointerUp() {
      if (s.phase !== "drawing") return;
      if (s.rawPath.length < 10) {
        // Too few points, reset
        s.phase = "idle";
        setPhase("idle");
        s.rawPath = [];
        return;
      }

      // Resample and compute DFT
      const resampled = resample(s.rawPath, RESAMPLE_COUNT);
      s.terms = dft(resampled);
      s.tracedPath = [];
      s.time = 0;
      s.phase = "playing";
      setPhase("playing");
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ── Resize observer ──
    let resizeSkipFirst = true;
    const observer = new ResizeObserver(([entry]) => {
      if (resizeSkipFirst) {
        resizeSkipFirst = false;
        return;
      }
      const dp = window.devicePixelRatio || 1;
      canvas.width = Math.round(entry.contentRect.width * dp);
      canvas.height = Math.round(entry.contentRect.height * dp);
      // Reset on resize to avoid misaligned drawing
      if (s.phase !== "idle") {
        s.phase = "idle";
        setPhase("idle");
        s.rawPath = [];
        s.terms = [];
        s.tracedPath = [];
        s.time = 0;
      }
    });
    observer.observe(canvas);

    // ── Animation loop ──
    let raf = 0;
    let lastTime = performance.now();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const colors = COLORS[theme];
      const dp = window.devicePixelRatio || 1;

      // Clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── Idle: draw instruction text ──
      if (s.phase === "idle") {
        ctx.fillStyle = colors.text;
        ctx.font = `${12 * dp}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("draw something", canvas.width / 2, canvas.height / 2);
        return;
      }

      // ── Drawing: render user path in accent ──
      if (s.phase === "drawing") {
        if (s.rawPath.length > 1) {
          ctx.beginPath();
          ctx.moveTo(s.rawPath[0].x, s.rawPath[0].y);
          for (let i = 1; i < s.rawPath.length; i++) {
            ctx.lineTo(s.rawPath[i].x, s.rawPath[i].y);
          }
          ctx.strokeStyle = colors.trace;
          ctx.lineWidth = 2 * dp;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
        return;
      }

      // ── Playing: animate epicycles ──
      const terms = s.terms;
      if (terms.length === 0) return;

      const termCount = Math.min(s.maxTerms, terms.length);
      const N = terms.length; // total DFT size (= RESAMPLE_COUNT)
      const speedMult = reduced ? 0.3 : s.speed;

      // Advance time
      s.time += ((2 * Math.PI) / N) * speedMult * dt * 60;

      // Wrap time after one full cycle and clear trace for continuous loop
      if (s.time > 2 * Math.PI) {
        s.time -= 2 * Math.PI;
        s.tracedPath = [];
      }

      const t = s.time;

      // Draw the faded original path
      if (s.rawPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.rawPath[0].x, s.rawPath[0].y);
        for (let i = 1; i < s.rawPath.length; i++) {
          ctx.lineTo(s.rawPath[i].x, s.rawPath[i].y);
        }
        ctx.strokeStyle = colors.userPath;
        ctx.lineWidth = 1.5 * dp;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Compute epicycle chain
      let cx = 0;
      let cy = 0;

      // Sum the constant offset from all unused terms' DC-like contribution
      // (the first term in sorted order is the DC/mean if freq=0)
      for (let i = 0; i < termCount; i++) {
        const prevCx = cx;
        const prevCy = cy;
        const term = terms[i];
        const angle = term.freq * t + term.phase;
        cx += term.amp * Math.cos(angle);
        cy += term.amp * Math.sin(angle);

        // Draw circle
        ctx.beginPath();
        ctx.arc(prevCx, prevCy, term.amp, 0, 2 * Math.PI);
        ctx.strokeStyle = colors.circle;
        ctx.lineWidth = 1 * dp;
        ctx.stroke();

        // Draw radius line
        ctx.beginPath();
        ctx.moveTo(prevCx, prevCy);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = colors.radius;
        ctx.lineWidth = 1 * dp;
        ctx.stroke();
      }

      // Store traced point
      s.tracedPath.push({ x: cx, y: cy });

      // Draw traced path
      if (s.tracedPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.tracedPath[0].x, s.tracedPath[0].y);
        for (let i = 1; i < s.tracedPath.length; i++) {
          ctx.lineTo(s.tracedPath[i].x, s.tracedPath[i].y);
        }
        ctx.strokeStyle = colors.trace;
        ctx.lineWidth = 2 * dp;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Draw small dot at the tip
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * dp, 0, 2 * Math.PI);
      ctx.fillStyle = colors.trace;
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const btnBase = "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors";
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
      {phase === "playing" && (
        <div
          className="fixed bottom-16 left-1/2 z-10 -translate-x-1/2"
          style={{ touchAction: "none" }}
        >
          <div className="flex items-center gap-3 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm">
            <button onClick={handleClear} className={`${btnBase} ${btnInactive}`}>
              CLEAR
            </button>

            <span className="h-4 w-px bg-foreground/10" />

            <label className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
                TERMS
              </span>
              <input
                type="range"
                min={10}
                max={200}
                value={maxTerms}
                onChange={(e) => handleTerms(Number(e.target.value))}
                className="h-1 w-16 appearance-none rounded bg-foreground/10 accent-foreground/40"
              />
              <span className="w-6 font-mono text-[9px] text-foreground/30">{maxTerms}</span>
            </label>

            <span className="h-4 w-px bg-foreground/10" />

            <label className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
                SPD
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={speed}
                onChange={(e) => handleSpeed(Number(e.target.value))}
                className="h-1 w-16 appearance-none rounded bg-foreground/10 accent-foreground/40"
              />
              <span className="w-5 font-mono text-[9px] text-foreground/30">{speed}</span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
