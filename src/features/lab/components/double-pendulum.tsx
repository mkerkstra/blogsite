"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_INSETS } from "@/features/lab/lib/layout";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import {
  ControlGroup,
  Segmented,
  Toggle,
  Transport,
} from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

/* ────────────────────────────────────────────
   Double Pendulum — Chaotic Divergence

   Two double pendulums launched from nearly
   identical initial conditions (delta theta_2
   = 0.001 rad) to demonstrate sensitive
   dependence on initial conditions.

   Physics: Lagrangian mechanics with RK4
   integration. Standard coupled ODEs for the
   double pendulum system.
   ──────────────────────────────────────────── */

/* ── Constants ── */

const G = 9.81;
const L1 = 1;
const L2 = 1;
const M1 = 1;
const M2 = 1;
const TRAIL_MAX = 2000;
const BASE_SUBSTEPS = 4;
const DT = 1 / 240;
const DELTA_THETA = 0.001;
const INIT_THETA1 = 2.5;
const INIT_THETA2 = 2.5;

const BG = { dark: "#0a0a0a", light: "#f5f1e8" } as const;

/* ── Theme colors ── */

function getColors(theme: "dark" | "light") {
  return {
    bg: BG[theme],
    accent: theme === "dark" ? "#d4ff00" : "#2a8a0e",
    secondary: theme === "dark" ? "#00d4ff" : "#0088aa",
    arm: theme === "dark" ? "rgba(224,226,220,0.6)" : "rgba(10,10,10,0.5)",
    pivot: theme === "dark" ? "rgba(224,226,220,0.3)" : "rgba(10,10,10,0.3)",
    text: theme === "dark" ? "rgba(224,226,220,0.5)" : "rgba(10,10,10,0.4)",
    textBright: theme === "dark" ? "rgba(224,226,220,0.8)" : "rgba(10,10,10,0.7)",
  };
}

/* ── Pendulum state ── */

interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

/* ── Double pendulum equations of motion ── */

function derivatives(s: PendulumState): [number, number, number, number] {
  const { theta1, theta2, omega1, omega2 } = s;
  const dt = theta1 - theta2;
  const sinDt = Math.sin(dt);
  const cosDt = Math.cos(dt);
  const sin1 = Math.sin(theta1);

  const denom = 2 * M1 + M2 - M2 * Math.cos(2 * dt);

  const alpha1 =
    (-G * (2 * M1 + M2) * sin1 -
      M2 * G * Math.sin(theta1 - 2 * theta2) -
      2 * sinDt * M2 * (omega2 * omega2 * L2 + omega1 * omega1 * L1 * cosDt)) /
    (L1 * denom);

  const alpha2 =
    (2 *
      sinDt *
      (omega1 * omega1 * L1 * (M1 + M2) +
        G * (M1 + M2) * Math.cos(theta1) +
        omega2 * omega2 * L2 * M2 * cosDt)) /
    (L2 * denom);

  return [omega1, omega2, alpha1, alpha2];
}

/* ── RK4 integrator ── */

function rk4Step(s: PendulumState, dt: number): PendulumState {
  const [dth1_1, dth2_1, dom1_1, dom2_1] = derivatives(s);
  const s2: PendulumState = {
    theta1: s.theta1 + (dth1_1 * dt) / 2,
    theta2: s.theta2 + (dth2_1 * dt) / 2,
    omega1: s.omega1 + (dom1_1 * dt) / 2,
    omega2: s.omega2 + (dom2_1 * dt) / 2,
  };
  const [dth1_2, dth2_2, dom1_2, dom2_2] = derivatives(s2);
  const s3: PendulumState = {
    theta1: s.theta1 + (dth1_2 * dt) / 2,
    theta2: s.theta2 + (dth2_2 * dt) / 2,
    omega1: s.omega1 + (dom1_2 * dt) / 2,
    omega2: s.omega2 + (dom2_2 * dt) / 2,
  };
  const [dth1_3, dth2_3, dom1_3, dom2_3] = derivatives(s3);
  const s4: PendulumState = {
    theta1: s.theta1 + dth1_3 * dt,
    theta2: s.theta2 + dth2_3 * dt,
    omega1: s.omega1 + dom1_3 * dt,
    omega2: s.omega2 + dom2_3 * dt,
  };
  const [dth1_4, dth2_4, dom1_4, dom2_4] = derivatives(s4);

  return {
    theta1: s.theta1 + (dt / 6) * (dth1_1 + 2 * dth1_2 + 2 * dth1_3 + dth1_4),
    theta2: s.theta2 + (dt / 6) * (dth2_1 + 2 * dth2_2 + 2 * dth2_3 + dth2_4),
    omega1: s.omega1 + (dt / 6) * (dom1_1 + 2 * dom1_2 + 2 * dom1_3 + dom1_4),
    omega2: s.omega2 + (dt / 6) * (dom2_1 + 2 * dom2_2 + 2 * dom2_3 + dom2_4),
  };
}

/* ── Tip position (CSS pixels, relative to pivot) ── */

function tipPosition(
  s: PendulumState,
  scale: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const x1 = L1 * Math.sin(s.theta1) * scale;
  const y1 = L1 * Math.cos(s.theta1) * scale;
  const x2 = x1 + L2 * Math.sin(s.theta2) * scale;
  const y2 = y1 + L2 * Math.cos(s.theta2) * scale;
  return { x1, y1, x2, y2 };
}

/* ── Random initial conditions ── */

function randomInitial(): { a: PendulumState; b: PendulumState } {
  const th1 = Math.PI * 0.5 + Math.random() * Math.PI;
  const th2 = Math.PI * 0.5 + Math.random() * Math.PI;
  return {
    a: { theta1: th1, theta2: th2, omega1: 0, omega2: 0 },
    b: { theta1: th1, theta2: th2 + DELTA_THETA, omega1: 0, omega2: 0 },
  };
}

function defaultInitial(): { a: PendulumState; b: PendulumState } {
  return {
    a: { theta1: INIT_THETA1, theta2: INIT_THETA2, omega1: 0, omega2: 0 },
    b: { theta1: INIT_THETA1, theta2: INIT_THETA2 + DELTA_THETA, omega1: 0, omega2: 0 },
  };
}

/* ── Component ── */

export function DoublePendulum({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<{
    pendulumA: PendulumState;
    pendulumB: PendulumState;
    trailA: TrailPoint[];
    trailB: TrailPoint[];
    paused: boolean;
    showTrails: boolean;
    speedMultiplier: number;
    elapsed: number;
    isFirst: boolean;
  }>({
    pendulumA: defaultInitial().a,
    pendulumB: defaultInitial().b,
    trailA: [],
    trailB: [],
    paused: false,
    showTrails: true,
    speedMultiplier: 1,
    elapsed: 0,
    isFirst: true,
  });

  const [paused, setPaused] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [speed, setSpeed] = useState(1);
  // Live telemetry, lifted from the sim for the readout HUD.
  const [metrics, setMetrics] = useState({ elapsed: 0, divergence: 0 });

  /* ── Reset handler ── */

  const reset = useCallback((useRandom: boolean) => {
    const s = simRef.current;
    const init = useRandom ? randomInitial() : defaultInitial();
    s.pendulumA = init.a;
    s.pendulumB = init.b;
    s.trailA = [];
    s.trailB = [];
    s.elapsed = 0;
    s.isFirst = false;
  }, []);

  /* ── Toggle pause ── */

  const togglePause = useCallback(() => {
    const s = simRef.current;
    s.paused = !s.paused;
    setPaused(s.paused);
  }, []);

  /* ── Toggle trails ── */

  const toggleTrails = useCallback(() => {
    const s = simRef.current;
    s.showTrails = !s.showTrails;
    setShowTrails(s.showTrails);
  }, []);

  /* ── Set speed ── */

  const setSpeedMultiplier = useCallback((val: number) => {
    simRef.current.speedMultiplier = val;
    setSpeed(val);
  }, []);

  /* ── Effect: animation loop ── */

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;
    const reduced = prefersReducedMotion();

    /* ── Size canvas ── */
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ── Resize observer ── */
    const observer = new ResizeObserver(([entry]) => {
      const dp = window.devicePixelRatio || 1;
      canvas.width = Math.round(entry.contentRect.width * dp);
      canvas.height = Math.round(entry.contentRect.height * dp);
      ctx.setTransform(dp, 0, 0, dp, 0, 0);
      // Clear trails on resize since coordinates change
      s.trailA = [];
      s.trailB = [];
    });
    observer.observe(canvas);

    /* ── Keyboard ── */
    function onKeyDown(e: KeyboardEvent) {
      // Ignore keyboard shortcuts when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        const sim = simRef.current;
        sim.paused = !sim.paused;
        setPaused(sim.paused);
      }
      if (e.code === "KeyR") {
        reset(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);

    /* ── Animation loop ── */
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);

      const cssW = canvas.width / (window.devicePixelRatio || 1);
      const cssH = canvas.height / (window.devicePixelRatio || 1);
      const theme = getTheme();
      const colors = getColors(theme);

      /* ── Compute scale: arm length in CSS pixels ──
         Keep the pendulum clear of the navbar band (top) and the LabChrome
         control strip (bottom), both owned by LAB_INSETS. */
      const navH = LAB_INSETS.top; // navbar clearance
      const footerH = LAB_INSETS.bottom; // control-strip clearance
      const usableH = cssH - navH - footerH;
      const armScale = Math.min(cssW, usableH) * 0.18;
      const pivotX = cssW / 2;
      const pivotY = navH + usableH * 0.32;

      /* ── Physics step ── */
      if (!s.paused) {
        const substeps = reduced
          ? Math.max(1, BASE_SUBSTEPS * s.speedMultiplier - 2)
          : BASE_SUBSTEPS * s.speedMultiplier;

        for (let i = 0; i < substeps; i++) {
          s.pendulumA = rk4Step(s.pendulumA, DT);
          s.pendulumB = rk4Step(s.pendulumB, DT);
        }
        s.elapsed += DT * substeps;

        /* ── Record trail points ── */
        const tipA = tipPosition(s.pendulumA, armScale);
        const tipB = tipPosition(s.pendulumB, armScale);
        s.trailA.push({ x: pivotX + tipA.x2, y: pivotY + tipA.y2 });
        s.trailB.push({ x: pivotX + tipB.x2, y: pivotY + tipB.y2 });
        if (s.trailA.length > TRAIL_MAX) s.trailA.shift();
        if (s.trailB.length > TRAIL_MAX) s.trailB.shift();
      }

      /* ── Clear with semi-transparent bg for ghosting ── */
      if (s.showTrails) {
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, cssW, cssH);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, cssW, cssH);
      }

      /* ── Draw trails ── */
      if (s.showTrails) {
        drawTrail(ctx, s.trailA, colors.accent);
        drawTrail(ctx, s.trailB, colors.secondary);
      }

      /* ── Draw pendulums ── */
      const posA = tipPosition(s.pendulumA, armScale);
      const posB = tipPosition(s.pendulumB, armScale);

      // Pivot
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors.pivot;
      ctx.fill();

      // Pendulum A
      drawPendulum(ctx, pivotX, pivotY, posA, colors.accent, colors.arm);

      // Pendulum B
      drawPendulum(ctx, pivotX, pivotY, posB, colors.secondary, colors.arm);

      // Live stats (time, divergence, delta-theta) now live in the top
      // LabReadout HUD, lifted to React state via a throttled sync below.
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reset]);

  /* ── Lift sim telemetry to React state for the readout HUD ── */

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = simRef.current;
      setMetrics({
        elapsed: s.elapsed,
        divergence: Math.abs(s.pendulumA.theta2 - s.pendulumB.theta2),
      });
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      <LabReadout corner="left">
        <Gauge label="time" value={metrics.elapsed.toFixed(1)} unit="s" />
        <Gauge label="divergence" value={metrics.divergence.toFixed(4)} unit="rad" primary />
        <Gauge label="delta-theta" value={DELTA_THETA} unit="rad" />
      </LabReadout>

      <LabChrome
        identity={{ name: "double pendulum", scent: "rk4 lagrangian · space pause, r reset" }}
        info={info}
      >
        <ControlGroup label="view">
          <Toggle
            label={showTrails ? "trail on" : "trail off"}
            pressed={showTrails}
            onChange={toggleTrails}
          />
        </ControlGroup>
        <ControlGroup label="speed">
          <Segmented
            label="rate"
            value={speed}
            onChange={setSpeedMultiplier}
            options={[
              { value: 1, label: "1x" },
              { value: 2, label: "2x" },
              { value: 4, label: "4x" },
            ]}
          />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Transport playing={!paused} onToggle={togglePause} onReset={() => reset(true)} />
        </ControlGroup>
      </LabChrome>
    </>
  );
}

/* ── Draw helpers ── */

function drawTrail(ctx: CanvasRenderingContext2D, trail: TrailPoint[], color: string) {
  const len = trail.length;
  if (len < 2) return;

  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw trail as segments with fading opacity
  for (let i = 1; i < len; i++) {
    const alpha = (i / len) * 0.7;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  pos: { x1: number; y1: number; x2: number; y2: number },
  accentColor: string,
  armColor: string,
) {
  const jx = pivotX + pos.x1;
  const jy = pivotY + pos.y1;
  const tx = pivotX + pos.x2;
  const ty = pivotY + pos.y2;

  // Arms
  ctx.strokeStyle = armColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(jx, jy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(jx, jy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Joint mass
  ctx.beginPath();
  ctx.arc(jx, jy, 5, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Tip mass
  ctx.beginPath();
  ctx.arc(tx, ty, 8, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();
}
