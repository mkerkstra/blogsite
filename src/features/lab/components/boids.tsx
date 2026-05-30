"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import {
  ControlGroup,
  LabSlider,
  Segmented,
  Toggle,
  Tool,
} from "@/features/lab/components/chrome/controls";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";

/* ────────────────────────────────────────────
   Boids flocking simulation — Canvas2D

   Craig Reynolds, "Flocks, Herds, and Schools:
   A Distributed Behavioral Model" (SIGGRAPH 1987)
   https://www.red3d.com/cwr/boids/
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const DEFAULT_COUNT = 500;
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

export function Boids({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<{
    boids: BoidState | null;
    separation: number;
    alignment: number;
    cohesion: number;
    trails: boolean;
    scatterMul: number;
    scatterHeld: boolean;
    mouseX: number;
    mouseY: number;
    mouseActive: boolean;
    shiftHeld: boolean;
    targetCount: number;
  }>({
    boids: null,
    separation: 1.0,
    alignment: 1.5,
    cohesion: 1.3,
    trails: true,
    scatterMul: 0,
    scatterHeld: false,
    mouseX: -9999,
    mouseY: -9999,
    mouseActive: false,
    shiftHeld: false,
    targetCount: DEFAULT_COUNT,
  });

  const [count, setCount] = useState(DEFAULT_COUNT);
  const [separation, setSeparation] = useState(1.0);
  const [alignment, setAlignment] = useState(1.5);
  const [cohesion, setCohesion] = useState(1.3);
  const [trails, setTrails] = useState(true);

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
    const reduced = prefersReducedMotion();

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

      const theme = getTheme();
      const bgColor = BG[theme];
      const boidColor = theme === "dark" ? "rgba(224,226,220,0.6)" : "rgba(10,10,10,0.5)";

      // ── Physics step (simplified if reduced motion) ──
      if (!reduced) {
        // Decay scatter (keep at 1 while held)
        if (s.scatterHeld) {
          s.scatterMul = 1;
        } else if (s.scatterMul > 0.01) {
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
        ctx.globalAlpha = 0.2;
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

  const handleTrails = useCallback((next: boolean) => {
    simRef.current.trails = next;
    setTrails(next);
  }, []);

  const handleScatter = useCallback(() => {
    simRef.current.scatterMul = 1;
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0, touchAction: "none", cursor: "crosshair" }}
        aria-hidden="true"
      />

      <LabChrome
        identity={{ name: "boids", scent: "reynolds flocking · move to attract" }}
        info={info}
      >
        <ControlGroup label="flock">
          <Segmented
            label="count"
            value={count}
            onChange={handleCount}
            options={[
              { value: 200, label: "200" },
              { value: 300, label: "300" },
              { value: 500, label: "500" },
              { value: 800, label: "800" },
              { value: 1200, label: "1200" },
            ]}
          />
        </ControlGroup>
        <ControlGroup label="weights">
          <LabSlider
            label="sep"
            min={0}
            max={3}
            step={0.1}
            value={separation}
            onChange={handleSeparation}
            format={(v) => v.toFixed(1)}
          />
          <LabSlider
            label="ali"
            min={0}
            max={3}
            step={0.1}
            value={alignment}
            onChange={handleAlignment}
            format={(v) => v.toFixed(1)}
          />
          <LabSlider
            label="coh"
            min={0}
            max={3}
            step={0.1}
            value={cohesion}
            onChange={handleCohesion}
            format={(v) => v.toFixed(1)}
          />
        </ControlGroup>
        <ControlGroup label="render">
          <Toggle label="trails" pressed={trails} onChange={handleTrails} />
          <Tool
            label="Scatter"
            title="Scatter the flock"
            onClick={handleScatter}
            icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
