"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Boids flocking simulation — Canvas2D

   Craig Reynolds, "Flocks, Herds, and Schools:
   A Distributed Behavioral Model" (SIGGRAPH 1987)
   https://www.red3d.com/cwr/boids/
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const DEFAULT_COUNT = 300;
const PERCEPTION_SQ = 60 * 60;
const MAX_SPEED = 4;
const MAX_FORCE = 0.1;
const MOUSE_RADIUS_SQ = 150 * 150;
const MOUSE_STRENGTH = 0.08;
const SCATTER_FORCE = 5;
const SCATTER_DECAY = 0.92;

const BG = { dark: "#0a0a0a", light: "#f5f1e8" } as const;

/* ────────────────────────────────────────────
   Boid data layout (SoA with typed arrays)
   ──────────────────────────────────────────── */

interface BoidState {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  count: number;
}

function createBoids(count: number, w: number, h: number): BoidState {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    x[i] = Math.random() * w;
    y[i] = Math.random() * h;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    vx[i] = Math.cos(angle) * speed;
    vy[i] = Math.sin(angle) * speed;
  }

  return { x, y, vx, vy, count };
}

/* ────────────────────────────────────────────
   Vector helpers
   ──────────────────────────────────────────── */

function limitVec(x: number, y: number, max: number): [number, number] {
  const magSq = x * x + y * y;
  if (magSq > max * max) {
    const mag = Math.sqrt(magSq);
    return [(x / mag) * max, (y / mag) * max];
  }
  return [x, y];
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function Boids() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<{
    boids: BoidState | null;
    separation: number;
    alignment: number;
    cohesion: number;
    trails: boolean;
    scatterMul: number;
    mouseX: number;
    mouseY: number;
    mouseActive: boolean;
    shiftHeld: boolean;
    targetCount: number;
  }>({
    boids: null,
    separation: 1.5,
    alignment: 1.0,
    cohesion: 1.0,
    trails: false,
    scatterMul: 0,
    mouseX: -9999,
    mouseY: -9999,
    mouseActive: false,
    shiftHeld: false,
    targetCount: DEFAULT_COUNT,
  });

  const [count, setCount] = useState(DEFAULT_COUNT);
  const [separation, setSeparation] = useState(1.5);
  const [alignment, setAlignment] = useState(1.0);
  const [cohesion, setCohesion] = useState(1.0);
  const [trails, setTrails] = useState(false);

  // ── Initializer ──

  const initBoids = useCallback((w: number, h: number) => {
    const s = simRef.current;
    s.boids = createBoids(s.targetCount, w, h);
  }, []);

  // ── Effect: animation loop ──

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
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    initBoids(canvas.width, canvas.height);

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const dp = window.devicePixelRatio || 1;
      const newW = Math.round(entry.contentRect.width * dp);
      const newH = Math.round(entry.contentRect.height * dp);

      const b = s.boids;
      if (b) {
        const oldW = canvas.width;
        const oldH = canvas.height;
        const scaleX = oldW > 0 ? newW / oldW : 1;
        const scaleY = oldH > 0 ? newH / oldH : 1;
        for (let i = 0; i < b.count; i++) {
          b.x[i] *= scaleX;
          b.y[i] *= scaleY;
        }
      }

      canvas.width = newW;
      canvas.height = newH;
    });
    observer.observe(canvas);

    // ── Mouse / keyboard handlers ──
    function onMouseMove(e: MouseEvent) {
      const dp = window.devicePixelRatio || 1;
      s.mouseX = e.clientX * dp;
      s.mouseY = e.clientY * dp;
      s.mouseActive = true;
    }

    function onMouseLeave() {
      s.mouseActive = false;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Shift") s.shiftHeld = true;
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Shift") s.shiftHeld = false;
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Animation loop ──
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);

      const b = s.boids;
      if (!b) return;

      const w = canvas.width;
      const h = canvas.height;
      const halfW = w / 2;
      const halfH = h / 2;

      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const bgColor = BG[theme];
      const boidColor = theme === "dark" ? "rgba(224,226,220,0.6)" : "rgba(10,10,10,0.5)";

      // ── Physics step (simplified if reduced motion) ──
      if (!reduced) {
        // Decay scatter
        if (s.scatterMul > 0.01) {
          s.scatterMul *= SCATTER_DECAY;
        } else {
          s.scatterMul = 0;
        }

        const sepWeight = s.separation + s.scatterMul * SCATTER_FORCE;
        const aliWeight = s.alignment;
        const cohWeight = s.cohesion;

        const mouseRadiusSqDpr = MOUSE_RADIUS_SQ * (window.devicePixelRatio || 1) ** 2;

        for (let i = 0; i < b.count; i++) {
          // Accumulators for three behaviors
          let sepX = 0,
            sepY = 0,
            sepCount = 0;
          let aliX = 0,
            aliY = 0,
            aliCount = 0;
          let cohX = 0,
            cohY = 0,
            cohCount = 0;

          const perceptionSqDpr = PERCEPTION_SQ * (window.devicePixelRatio || 1) ** 2;

          for (let j = 0; j < b.count; j++) {
            if (i === j) continue;

            let dx = b.x[j] - b.x[i];
            let dy = b.y[j] - b.y[i];

            // Toroidal wrapping
            if (dx > halfW) dx -= w;
            if (dx < -halfW) dx += w;
            if (dy > halfH) dy -= h;
            if (dy < -halfH) dy += h;

            const distSq = dx * dx + dy * dy;
            if (distSq === 0 || distSq > perceptionSqDpr) continue;

            const dist = Math.sqrt(distSq);

            // Separation
            sepX -= dx / dist;
            sepY -= dy / dist;
            sepCount++;

            // Alignment
            aliX += b.vx[j];
            aliY += b.vy[j];
            aliCount++;

            // Cohesion
            cohX += dx;
            cohY += dy;
            cohCount++;
          }

          let steerX = 0;
          let steerY = 0;

          // Separation steering
          if (sepCount > 0) {
            const [sx, sy] = limitVec(sepX / sepCount, sepY / sepCount, MAX_FORCE);
            steerX += sx * sepWeight;
            steerY += sy * sepWeight;
          }

          // Alignment steering
          if (aliCount > 0) {
            const avgVx = aliX / aliCount;
            const avgVy = aliY / aliCount;
            // Desired = average heading normalized * MAX_SPEED - current velocity
            const mag = Math.sqrt(avgVx * avgVx + avgVy * avgVy);
            if (mag > 0) {
              const desX = (avgVx / mag) * MAX_SPEED - b.vx[i];
              const desY = (avgVy / mag) * MAX_SPEED - b.vy[i];
              const [ax, ay] = limitVec(desX, desY, MAX_FORCE);
              steerX += ax * aliWeight;
              steerY += ay * aliWeight;
            }
          }

          // Cohesion steering
          if (cohCount > 0) {
            const avgX = cohX / cohCount;
            const avgY = cohY / cohCount;
            const mag = Math.sqrt(avgX * avgX + avgY * avgY);
            if (mag > 0) {
              const desX = (avgX / mag) * MAX_SPEED - b.vx[i];
              const desY = (avgY / mag) * MAX_SPEED - b.vy[i];
              const [cx, cy] = limitVec(desX, desY, MAX_FORCE);
              steerX += cx * cohWeight;
              steerY += cy * cohWeight;
            }
          }

          // Mouse interaction
          if (s.mouseActive) {
            let mdx = s.mouseX - b.x[i];
            let mdy = s.mouseY - b.y[i];
            if (mdx > halfW) mdx -= w;
            if (mdx < -halfW) mdx += w;
            if (mdy > halfH) mdy -= h;
            if (mdy < -halfH) mdy += h;

            const mDistSq = mdx * mdx + mdy * mdy;
            if (mDistSq < mouseRadiusSqDpr && mDistSq > 0) {
              const mDist = Math.sqrt(mDistSq);
              const mouseForce = s.shiftHeld ? -MOUSE_STRENGTH : MOUSE_STRENGTH;
              steerX += (mdx / mDist) * mouseForce;
              steerY += (mdy / mDist) * mouseForce;
            }
          }

          // Apply steering
          b.vx[i] += steerX;
          b.vy[i] += steerY;

          // Limit speed
          const [lvx, lvy] = limitVec(b.vx[i], b.vy[i], MAX_SPEED);
          b.vx[i] = lvx;
          b.vy[i] = lvy;

          // Update position with wrap
          b.x[i] = (((b.x[i] + b.vx[i]) % w) + w) % w;
          b.y[i] = (((b.y[i] + b.vy[i]) % h) + h) % h;
        }
      }

      // ── Render ──
      if (s.trails) {
        ctx.fillStyle = bgColor;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1.0;
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.fillStyle = boidColor;

      // Draw all boids as triangles
      const tipLen = 4;
      const baseAngle = (135 * Math.PI) / 180;
      const baseLen = 4;

      ctx.beginPath();

      for (let i = 0; i < b.count; i++) {
        const px = b.x[i];
        const py = b.y[i];
        const theta = Math.atan2(b.vy[i], b.vx[i]);

        // Tip
        const tipX = px + Math.cos(theta) * tipLen;
        const tipY = py + Math.sin(theta) * tipLen;

        // Base points
        const b1x = px + Math.cos(theta + baseAngle) * baseLen;
        const b1y = py + Math.sin(theta + baseAngle) * baseLen;
        const b2x = px + Math.cos(theta - baseAngle) * baseLen;
        const b2y = py + Math.sin(theta - baseAngle) * baseLen;

        ctx.moveTo(tipX, tipY);
        ctx.lineTo(b1x, b1y);
        ctx.lineTo(b2x, b2y);
        ctx.lineTo(tipX, tipY);
      }

      ctx.fill();
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [initBoids]);

  // ── Control handlers ──

  const handleCount = useCallback(
    (val: number) => {
      const s = simRef.current;
      s.targetCount = val;
      setCount(val);
      const maybeCanvas = canvasRef.current;
      if (!maybeCanvas) return;
      initBoids(maybeCanvas.width, maybeCanvas.height);
    },
    [initBoids],
  );

  const handleSeparation = useCallback((val: number) => {
    simRef.current.separation = val;
    setSeparation(val);
  }, []);

  const handleAlignment = useCallback((val: number) => {
    simRef.current.alignment = val;
    setAlignment(val);
  }, []);

  const handleCohesion = useCallback((val: number) => {
    simRef.current.cohesion = val;
    setCohesion(val);
  }, []);

  const handleTrails = useCallback(() => {
    const next = !simRef.current.trails;
    simRef.current.trails = next;
    setTrails(next);
  }, []);

  const handleScatter = useCallback(() => {
    simRef.current.scatterMul = 1;
  }, []);

  // ── Styles ──

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
        <div className="flex flex-wrap items-center justify-center gap-3 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          {/* Count selector */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              COUNT
            </span>
            {[100, 200, 300, 500].map((n) => (
              <button
                key={n}
                onClick={() => handleCount(n)}
                className={`${btnBase} ${count === n ? btnActive : btnInactive}`}
              >
                {n}
              </button>
            ))}
          </div>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Separation slider */}
          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              SEP
            </span>
            <input
              type="range"
              min={0}
              max={300}
              value={Math.round(separation * 100)}
              onChange={(e) => handleSeparation(Number(e.target.value) / 100)}
              className="h-1 w-14 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-6 font-mono text-[9px] text-foreground/30">
              {separation.toFixed(1)}
            </span>
          </label>

          {/* Alignment slider */}
          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              ALI
            </span>
            <input
              type="range"
              min={0}
              max={300}
              value={Math.round(alignment * 100)}
              onChange={(e) => handleAlignment(Number(e.target.value) / 100)}
              className="h-1 w-14 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-6 font-mono text-[9px] text-foreground/30">
              {alignment.toFixed(1)}
            </span>
          </label>

          {/* Cohesion slider */}
          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              COH
            </span>
            <input
              type="range"
              min={0}
              max={300}
              value={Math.round(cohesion * 100)}
              onChange={(e) => handleCohesion(Number(e.target.value) / 100)}
              className="h-1 w-14 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-6 font-mono text-[9px] text-foreground/30">
              {cohesion.toFixed(1)}
            </span>
          </label>

          <span className="h-4 w-px bg-foreground/10" />

          {/* Trails toggle */}
          <button
            onClick={handleTrails}
            className={`${btnBase} ${trails ? btnActive : btnInactive}`}
          >
            TRAILS
          </button>

          {/* Scatter button */}
          <button onClick={handleScatter} className={`${btnBase} ${btnInactive}`}>
            SCATTER
          </button>
        </div>
      </div>
    </>
  );
}
