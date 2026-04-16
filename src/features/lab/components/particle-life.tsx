"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Particle Life — Canvas2D

   Inspired by Jeffrey Ventrella's "Clusters" and
   Hunar Ahmad's "Particle Life" simulation.
   https://www.ventrella.com/Clusters/
   https://particle-life.com
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   Colors per species, by theme
   ──────────────────────────────────────────── */

const SPECIES_COLORS_DARK = [
  "#d4ff00", // lime
  "#00d4ff", // cyan
  "#ff6b6b", // red
  "#c084fc", // purple
  "#34d399", // emerald
  "#fbbf24", // amber
];

const SPECIES_COLORS_LIGHT = [
  "#2a8a0e", // green
  "#0e6a8a", // teal
  "#c0392b", // red
  "#7c3aed", // purple
  "#059669", // emerald
  "#d97706", // amber
];

const BG = { dark: "#0a0a0a", light: "#f5f1e8" } as const;

/* ────────────────────────────────────────────
   Simulation constants
   ──────────────────────────────────────────── */

const PARTICLE_COUNT = 800;
const INTERACTION_RADIUS = 120;
const REPULSION_RADIUS = 15;
const DT = 0.02;
const PARTICLE_DRAW_RADIUS = 2;

/* ────────────────────────────────────────────
   Force matrix helpers
   ──────────────────────────────────────────── */

function randomMatrix(n: number, symmetric: boolean): number[][] {
  const m: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Math.random() * 2 - 1),
  );
  if (symmetric) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        m[j][i] = m[i][j];
      }
    }
  }
  return m;
}

/* ────────────────────────────────────────────
   Particle data layout (SoA with typed arrays)
   ──────────────────────────────────────────── */

interface ParticleState {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  species: Uint8Array;
  count: number;
}

function createParticles(count: number, numSpecies: number, w: number, h: number): ParticleState {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);
  const species = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    x[i] = Math.random() * w;
    y[i] = Math.random() * h;
    vx[i] = 0;
    vy[i] = 0;
    species[i] = Math.floor(Math.random() * numSpecies);
  }

  return { x, y, vx, vy, species, count };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function ParticleLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable simulation state accessed by the animation loop
  const simRef = useRef<{
    particles: ParticleState | null;
    attraction: number[][];
    numSpecies: number;
    friction: number;
    symmetric: boolean;
  }>({
    particles: null,
    attraction: [],
    numSpecies: 6,
    friction: 0.5,
    symmetric: false,
  });

  // React state for the control UI
  const [numSpecies, setNumSpecies] = useState(6);
  const [friction, setFriction] = useState(0.5);
  const [symmetric, setSymmetric] = useState(false);

  // ── Initializer ──

  const initSim = useCallback((w: number, h: number) => {
    const s = simRef.current;
    s.attraction = randomMatrix(s.numSpecies, s.symmetric);
    s.particles = createParticles(PARTICLE_COUNT, s.numSpecies, w, h);
  }, []);

  // ── Randomize ──

  const randomize = useCallback(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    initSim(canvas.width, canvas.height);
  }, [initSim]);

  // ── Effect: animation loop ──

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;

    // Reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Size canvas ──
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    initSim(canvas.width, canvas.height);

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const dp = window.devicePixelRatio || 1;
      const newW = Math.round(entry.contentRect.width * dp);
      const newH = Math.round(entry.contentRect.height * dp);

      // Remap particle positions to new dimensions
      const p = s.particles;
      if (p) {
        const oldW = canvas.width;
        const oldH = canvas.height;
        const scaleX = oldW > 0 ? newW / oldW : 1;
        const scaleY = oldH > 0 ? newH / oldH : 1;
        for (let i = 0; i < p.count; i++) {
          p.x[i] *= scaleX;
          p.y[i] *= scaleY;
        }
      }

      canvas.width = newW;
      canvas.height = newH;
    });
    observer.observe(canvas);

    // ── Animation loop ──
    let raf = 0;
    // Scale radii by DPR so interactions feel the same at any pixel density
    const interactionR = INTERACTION_RADIUS * dpr;
    const interactionRSq = interactionR * interactionR;
    const repulsionR = REPULSION_RADIUS * dpr;
    const drawR = PARTICLE_DRAW_RADIUS * dpr;

    function frame() {
      raf = requestAnimationFrame(frame);

      const p = s.particles;
      if (!p) return;

      const w = canvas.width;
      const h = canvas.height;
      const halfW = w / 2;
      const halfH = h / 2;
      const attraction = s.attraction;
      const fric = s.friction;

      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const speciesColors = theme === "dark" ? SPECIES_COLORS_DARK : SPECIES_COLORS_LIGHT;
      const bgColor = BG[theme];

      // ── Physics step (skip if reduced motion — still render) ──
      const stepsPerFrame = reduced ? 1 : 3;

      for (let step = 0; step < stepsPerFrame; step++) {
        for (let i = 0; i < p.count; i++) {
          let fx = 0;
          let fy = 0;

          for (let j = 0; j < p.count; j++) {
            if (i === j) continue;

            let dx = p.x[j] - p.x[i];
            let dy = p.y[j] - p.y[i];

            // Wrap-around distance (toroidal)
            if (dx > halfW) dx -= w;
            if (dx < -halfW) dx += w;
            if (dy > halfH) dy -= h;
            if (dy < -halfH) dy += h;

            const distSq = dx * dx + dy * dy;
            if (distSq === 0 || distSq > interactionRSq) continue;

            const dist = Math.sqrt(distSq);

            if (dist < repulsionR) {
              // Close-range repulsion to prevent overlap
              const repulsionForce = (repulsionR - dist) * -0.5;
              fx += (dx / dist) * repulsionForce;
              fy += (dy / dist) * repulsionForce;
            } else {
              // Attraction/repulsion based on species interaction matrix
              const si = p.species[i];
              const sj = p.species[j];
              const row = attraction[si];
              const force = row ? (row[sj] ?? 0) : 0;
              const normalizedDist = dist / interactionR;
              const f = force * (1 - normalizedDist);
              fx += (dx / dist) * f;
              fy += (dy / dist) * f;
            }
          }

          p.vx[i] = (p.vx[i] + fx * DT) * fric;
          p.vy[i] = (p.vy[i] + fy * DT) * fric;
          p.x[i] = (((p.x[i] + p.vx[i]) % w) + w) % w;
          p.y[i] = (((p.y[i] + p.vy[i]) % h) + h) % h;
        }
      }

      // ── Render ──
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 0.85;

      // Group draws by species to minimize style changes
      for (let sp = 0; sp < s.numSpecies; sp++) {
        const color = speciesColors[sp] ?? speciesColors[0];
        ctx.fillStyle = color;
        ctx.beginPath();

        for (let i = 0; i < p.count; i++) {
          if (p.species[i] !== sp) continue;
          ctx.moveTo(p.x[i] + drawR, p.y[i]);
          ctx.arc(p.x[i], p.y[i], drawR, 0, Math.PI * 2);
        }

        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [initSim]);

  // ── Control handlers ──

  const handleSymmetry = useCallback(() => {
    const s = simRef.current;
    const next = !s.symmetric;
    s.symmetric = next;
    setSymmetric(next);

    // Rebuild matrix with new symmetry setting
    s.attraction = randomMatrix(s.numSpecies, next);
  }, []);

  const handleFriction = useCallback((val: number) => {
    simRef.current.friction = val;
    setFriction(val);
  }, []);

  const handleSpecies = useCallback(
    (val: number) => {
      const s = simRef.current;
      s.numSpecies = val;
      setNumSpecies(val);

      // Re-initialize with new species count
      const maybeCanvas = canvasRef.current;
      if (!maybeCanvas) return;
      initSim(maybeCanvas.width, maybeCanvas.height);
    },
    [initSim],
  );

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
        <div className="flex items-center gap-3 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          <button onClick={randomize} className={`${btnBase} ${btnInactive}`}>
            RANDOMIZE
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          <button
            onClick={handleSymmetry}
            className={`${btnBase} ${symmetric ? btnActive : btnInactive}`}
          >
            SYMMETRY
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          <label className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              FRIC
            </span>
            <input
              type="range"
              min={10}
              max={90}
              value={Math.round(friction * 100)}
              onChange={(e) => handleFriction(Number(e.target.value) / 100)}
              className="h-1 w-16 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-6 font-mono text-[9px] text-foreground/30">
              {friction.toFixed(1)}
            </span>
          </label>

          <span className="h-4 w-px bg-foreground/10" />

          <div className="flex items-center gap-1">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => handleSpecies(n)}
                className={`${btnBase} ${numSpecies === n ? btnActive : btnInactive}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
