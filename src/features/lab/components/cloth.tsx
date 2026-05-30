"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import { ControlGroup, LabSlider, Toggle, Tool } from "@/features/lab/components/chrome/controls";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;
}

interface Constraint {
  a: number;
  b: number;
  rest: number;
  active: boolean;
}

/* ────────────────────────────────────────────
   Colors
   ──────────────────────────────────────────── */

const COLORS = {
  dark: {
    bg: "#0a0a0a",
    line: "rgba(224,226,220,0.15)",
    stressed: "#d4ff00",
    pin: "rgba(224,226,220,0.3)",
  },
  light: {
    bg: "#f5f1e8",
    line: "rgba(10,10,10,0.12)",
    stressed: "#2a8a0e",
    pin: "rgba(10,10,10,0.2)",
  },
} as const;

/* ────────────────────────────────────────────
   Simulation factory
   ──────────────────────────────────────────── */

function createCloth(cols: number, rows: number, restDist: number, startX: number, startY: number) {
  const particles: Particle[] = [];
  const constraints: Constraint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * restDist;
      const y = startY + r * restDist;
      particles.push({
        x,
        y,
        prevX: x,
        prevY: y,
        pinned: r === 0,
      });
    }
  }

  // Horizontal constraints
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      constraints.push({ a, b, rest: restDist, active: true });
    }
  }

  // Vertical constraints
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * cols + c;
      const b = a + cols;
      constraints.push({ a, b, rest: restDist, active: true });
    }
  }

  return { particles, constraints };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

const COLS = 40;
const ROWS = 25;
const GRAVITY = 0.5;
const DAMPING = 0.99;
const TEAR_MULT = 2.5;
const MOUSE_RADIUS = 80;
const MOUSE_FORCE = 0.8;

export function Cloth({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable sim state read by the animation loop
  const simRef = useRef<{
    particles: Particle[];
    constraints: Constraint[];
    cols: number;
    rows: number;
    restDist: number;
    gravityOn: boolean;
    windOn: boolean;
    substeps: number;
  }>({
    particles: [],
    constraints: [],
    cols: COLS,
    rows: ROWS,
    restDist: 0,
    gravityOn: true,
    windOn: false,
    substeps: 5,
  });

  // React state for UI
  const [gravityOn, setGravityOn] = useState(true);
  const [windOn, setWindOn] = useState(false);
  const [substeps, setSubsteps] = useState(5);

  const initCloth = useCallback((w: number, h: number) => {
    const s = simRef.current;
    const marginX = w * 0.1;
    const usableW = w - marginX * 2;
    const usableH = h * 0.65;
    const restDist = Math.min(usableW / (COLS - 1), usableH / (ROWS - 1));
    const clothW = restDist * (COLS - 1);
    const startX = (w - clothW) / 2;
    const startY = h * 0.08;

    const { particles, constraints } = createCloth(COLS, ROWS, restDist, startX, startY);
    s.particles = particles;
    s.constraints = constraints;
    s.restDist = restDist;
    s.cols = COLS;
    s.rows = ROWS;
  }, []);

  const resetCloth = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCloth(canvas.width, canvas.height);
  }, [initCloth]);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;

    // Reduced motion
    const reduced = prefersReducedMotion();
    if (reduced) {
      s.substeps = 2;
      setSubsteps(2);
    }

    // ── Size canvas ──
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    initCloth(canvas.width, canvas.height);

    // Start with wind enabled so the cloth immediately billows
    s.windOn = true;
    setWindOn(true);

    // ── Mouse state ──
    const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, down: false };

    function onPointerDown(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      const dp = window.devicePixelRatio || 1;
      mouse.down = true;
      mouse.x = (e.clientX - r.left) * dp;
      mouse.y = (e.clientY - r.top) * dp;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      const dp = window.devicePixelRatio || 1;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = (e.clientX - r.left) * dp;
      mouse.y = (e.clientY - r.top) * dp;
    }

    function onPointerUp() {
      mouse.down = false;
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
      initCloth(canvas.width, canvas.height);
    });
    observer.observe(canvas);

    // ── Animation loop ──
    let raf = 0;
    const mouseRadius = MOUSE_RADIUS * (window.devicePixelRatio || 1);

    function frame() {
      raf = requestAnimationFrame(frame);

      const { particles, constraints, cols } = s;
      if (particles.length === 0) return;

      const theme = getTheme();
      const colors = COLORS[theme];

      // ── Physics update ──
      const grav = s.gravityOn ? GRAVITY : 0;

      // Apply forces and Verlet integration
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.pinned) continue;

        const vx = (p.x - p.prevX) * DAMPING;
        const vy = (p.y - p.prevY) * DAMPING;

        p.prevX = p.x;
        p.prevY = p.y;
        p.x += vx;
        p.y += vy + grav;

        // Wind
        if (s.windOn) {
          p.x += Math.sin(p.y * 0.01 + performance.now() * 0.002) * 0.5 + 0.3;
        }
      }

      // Mouse interaction
      if (mouse.down) {
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.pinned) continue;
          const mx = mouse.x - p.x;
          const my = mouse.y - p.y;
          const dist = Math.sqrt(mx * mx + my * my);
          if (dist < mouseRadius) {
            const influence = 1 - dist / mouseRadius;
            p.x += dx * influence * MOUSE_FORCE;
            p.y += dy * influence * MOUSE_FORCE;
          }
        }
      }

      // Constraint relaxation
      const tearDist = s.restDist * TEAR_MULT;
      for (let iter = 0; iter < s.substeps; iter++) {
        for (let i = 0; i < constraints.length; i++) {
          const c = constraints[i];
          if (!c.active) continue;

          const pa = particles[c.a];
          const pb = particles[c.b];
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.0001) continue;

          // Tear check
          if (dist > tearDist) {
            c.active = false;
            continue;
          }

          const diff = (c.rest - dist) / dist;
          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;

          if (!pa.pinned) {
            pa.x -= offsetX;
            pa.y -= offsetY;
          }
          if (!pb.pinned) {
            pb.x += offsetX;
            pb.y += offsetY;
          }
        }
      }

      // ── Render ──
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw constraints
      for (let i = 0; i < constraints.length; i++) {
        const c = constraints[i];
        if (!c.active) continue;

        const pa = particles[c.a];
        const pb = particles[c.b];
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const stress = dist / tearDist;

        if (stress > 0.6) {
          // Interpolate toward accent color as stress increases
          const t = (stress - 0.6) / 0.4;
          const alpha = 0.15 + t * 0.7;
          if (theme === "dark") {
            const r = Math.round(224 + (212 - 224) * t);
            const g = Math.round(226 + (255 - 226) * t);
            const b = Math.round(220 + (0 - 220) * t);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          } else {
            const r = Math.round(10 + (42 - 10) * t);
            const g = Math.round(10 + (138 - 10) * t);
            const b = Math.round(10 + (14 - 10) * t);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          }
          ctx.lineWidth = 1 + t;
        } else {
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // Draw pinned points
      ctx.fillStyle = colors.pin;
      for (let c = 0; c < cols; c++) {
        const p = particles[c];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [initCloth]);

  // ── Control handlers ──

  const handleGravity = useCallback((next: boolean) => {
    simRef.current.gravityOn = next;
    setGravityOn(next);
  }, []);

  const handleWind = useCallback((next: boolean) => {
    simRef.current.windOn = next;
    setWindOn(next);
  }, []);

  const handleSubsteps = useCallback((val: number) => {
    simRef.current.substeps = val;
    setSubsteps(val);
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
        identity={{ name: "cloth", scent: "verlet integration · drag to tear" }}
        info={info}
      >
        <ControlGroup label="forces">
          <Toggle label="gravity" pressed={gravityOn} onChange={handleGravity} />
          <Toggle label="wind" pressed={windOn} onChange={handleWind} />
        </ControlGroup>
        <ControlGroup label="solver">
          <LabSlider label="spd" min={1} max={15} value={substeps} onChange={handleSubsteps} />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Tool
            label="Reset (R)"
            title="Reset (R)"
            onClick={resetCloth}
            icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
