"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import { ControlGroup, Segmented, Toggle } from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

type Pattern = "rotors" | "wave" | "radial";

interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

interface SimulationState {
  open: number;
  targetOpen: number;
  time: number;
  pattern: Pattern;
  showCuts: boolean;
  pointer: PointerState;
  panelCount: number;
}

interface Colors {
  bg: string;
  paper: string;
  paperAlt: string;
  crease: string;
  cut: string;
  shadow: string;
  accent: string;
  accentSoft: string;
  text: string;
  textDim: string;
}

const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "rotors", label: "rotors" },
  { id: "wave", label: "wave" },
  { id: "radial", label: "radial" },
];

function getColors(theme: "dark" | "light"): Colors {
  if (theme === "dark") {
    return {
      bg: "#0a0a0a",
      paper: "#e4e6dc",
      paperAlt: "#cfd6c7",
      crease: "rgba(10,10,10,0.42)",
      cut: "rgba(212,255,0,0.72)",
      shadow: "rgba(0,0,0,0.35)",
      accent: "#d4ff00",
      accentSoft: "rgba(212,255,0,0.18)",
      text: "rgba(224,226,220,0.62)",
      textDim: "rgba(224,226,220,0.28)",
    };
  }

  return {
    bg: "#f5f1e8",
    paper: "#fffdf5",
    paperAlt: "#e6dfd0",
    crease: "rgba(10,10,10,0.26)",
    cut: "rgba(42,138,14,0.72)",
    shadow: "rgba(58,45,24,0.16)",
    accent: "#2a8a0e",
    accentSoft: "rgba(42,138,14,0.16)",
    text: "rgba(10,10,10,0.58)",
    textDim: "rgba(10,10,10,0.24)",
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ease(n: number) {
  return n * n * (3 - 2 * n);
}

function rotatePoint(x: number, y: number, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

function patternPhase(
  pattern: Pattern,
  col: number,
  row: number,
  cx: number,
  cy: number,
  time: number,
) {
  if (pattern === "wave") return Math.sin(time * 1.2 + col * 0.7 - row * 0.45) * 0.18;
  if (pattern === "radial") return Math.sin(time * 0.65 + Math.hypot(cx, cy) * 0.012) * 0.14;
  return Math.sin(time * 0.8 + (col + row) * 0.45) * 0.08;
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  lift: number,
  parity: number,
  colors: Colors,
) {
  const squash = 1 - lift * 0.22;
  const shadowShift = lift * 14;
  const base = [
    { x: -radius, y: -radius * squash },
    { x: radius, y: -radius * squash },
    { x: radius, y: radius * squash },
    { x: -radius, y: radius * squash },
  ].map((p) => rotatePoint(p.x, p.y, angle));

  ctx.beginPath();
  ctx.moveTo(cx + base[0].x + shadowShift, cy + base[0].y + shadowShift);
  for (const p of base.slice(1)) ctx.lineTo(cx + p.x + shadowShift, cy + p.y + shadowShift);
  ctx.closePath();
  ctx.fillStyle = colors.shadow;
  ctx.fill();

  const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  gradient.addColorStop(0, parity > 0 ? colors.paper : colors.paperAlt);
  gradient.addColorStop(1, parity > 0 ? colors.paperAlt : colors.paper);

  ctx.beginPath();
  ctx.moveTo(cx + base[0].x, cy + base[0].y);
  for (const p of base.slice(1)) ctx.lineTo(cx + p.x, cy + p.y);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = colors.crease;
  ctx.lineWidth = 1;
  ctx.stroke();

  const creaseA = parity > 0 ? [base[0], base[2]] : [base[1], base[3]];
  ctx.beginPath();
  ctx.moveTo(cx + creaseA[0].x, cy + creaseA[0].y);
  ctx.lineTo(cx + creaseA[1].x, cy + creaseA[1].y);
  ctx.strokeStyle = colors.crease;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawDiamondHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  amount: number,
  colors: Colors,
) {
  const r = radius * (0.15 + amount * 0.75);
  const q = r * 0.62;

  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + q, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - q, cy);
  ctx.closePath();
  ctx.fillStyle = colors.bg;
  ctx.fill();
  ctx.strokeStyle = colors.accentSoft;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSlit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  angle: number,
  colors: Colors,
) {
  const dx = Math.cos(angle) * length * 0.5;
  const dy = Math.sin(angle) * length * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.strokeStyle = colors.cut;
  ctx.lineWidth = 1.25;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: SimulationState,
) {
  const theme = getTheme();
  const colors = getColors(theme);

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    0,
    width * 0.5,
    height * 0.42,
    width * 0.72,
  );
  gradient.addColorStop(0, colors.accentSoft);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const spacing = clamp(Math.min(width, height) / 9, 46, 78);
  const radius = spacing * 0.28;
  const cols = Math.ceil(width / spacing) + 6;
  const rows = Math.ceil(height / spacing) + 6;
  const startX = width * 0.5 - ((cols - 1) * spacing) / 2;
  const startY = height * 0.52 - ((rows - 1) * spacing) / 2;
  const pointerRadius = Math.max(width, height) * 0.24;

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const cx = startX + (col + 0.5) * spacing;
      const cy = startY + (row + 0.5) * spacing;
      if (cx < -spacing || cy < -spacing || cx > width + spacing || cy > height + spacing) continue;

      const dx = cx - width * 0.5;
      const dy = cy - height * 0.52;
      const localWave = patternPhase(state.pattern, col, row, dx, dy, state.time);
      const pointerDistance = state.pointer.active
        ? Math.hypot(cx - state.pointer.x, cy - state.pointer.y)
        : pointerRadius * 2;
      const pointerPull = Math.max(0, 1 - pointerDistance / pointerRadius);
      const amount = clamp(state.open + localWave + ease(pointerPull) * 0.42, 0, 1);

      if (amount > 0.07) {
        drawDiamondHole(ctx, cx, cy, radius * 1.12, amount, colors);
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = startX + col * spacing;
      const cy = startY + row * spacing;
      if (cx < -spacing || cy < -spacing || cx > width + spacing || cy > height + spacing) continue;

      const dx = cx - width * 0.5;
      const dy = cy - height * 0.52;
      const parity = (row + col) % 2 === 0 ? 1 : -1;
      const localWave = patternPhase(state.pattern, col, row, dx, dy, state.time);
      const pointerDistance = state.pointer.active
        ? Math.hypot(cx - state.pointer.x, cy - state.pointer.y)
        : pointerRadius * 2;
      const pointerPull = Math.max(0, 1 - pointerDistance / pointerRadius);
      const amount = clamp(state.open + localWave + ease(pointerPull) * 0.46, 0, 1);
      const angle = parity * (amount * 0.86 + 0.08);

      drawPanel(ctx, cx, cy, radius, angle, amount, parity, colors);
      if (state.showCuts) {
        const slitAngle = (parity > 0 ? 0 : Math.PI / 2) + angle * 0.18;
        drawSlit(ctx, cx, cy, radius * 1.65, slitAngle, colors);
      }
    }
  }

  // Live stats (OPEN%, PATTERN, PANELS) are lifted to the LabReadout HUD.
  state.panelCount = cols * rows;
}

export function Kirigami({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimulationState>({
    open: 0.64,
    targetOpen: 0.64,
    time: 0,
    pattern: "rotors",
    showCuts: true,
    pointer: { x: 0, y: 0, active: false },
    panelCount: 0,
  });
  const [targetOpen, setTargetOpen] = useState(0.64);
  const [pattern, setPattern] = useState<Pattern>("rotors");
  const [showCuts, setShowCuts] = useState(true);
  // Live telemetry lifted from the sim for the readout HUD.
  const [openPct, setOpenPct] = useState(64);
  const [panels, setPanels] = useState(0);

  const setOpenTarget = useCallback((next: number) => {
    simRef.current.targetOpen = next;
    setTargetOpen(next);
  }, []);

  const setPatternMode = useCallback((next: Pattern) => {
    simRef.current.pattern = next;
    setPattern(next);
  }, []);

  const toggleCuts = useCallback(() => {
    simRef.current.showCuts = !simRef.current.showCuts;
    setShowCuts(simRef.current.showCuts);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;
    const maybeCtx = canvasElement.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;
    const sim = simRef.current;
    const reduced = prefersReducedMotion();

    function resize(rect: DOMRectReadOnly) {
      const dpr = window.devicePixelRatio || 1;
      canvasElement.width = Math.max(1, Math.round(rect.width * dpr));
      canvasElement.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize(canvasElement.getBoundingClientRect());

    const observer = new ResizeObserver(([entry]) => resize(entry.contentRect));
    observer.observe(canvasElement);

    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        setOpenTarget(sim.targetOpen > 0.5 ? 0.16 : 0.74);
      }
      if (event.code === "KeyR") {
        setOpenTarget(0.64);
        setPatternMode("rotors");
      }
    }

    window.addEventListener("keydown", onKeyDown);

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      sim.time += reduced ? dt * 0.2 : dt;
      sim.open += (sim.targetOpen - sim.open) * (reduced ? 0.08 : 0.045);

      const dpr = window.devicePixelRatio || 1;
      drawScene(ctx, canvasElement.width / dpr, canvasElement.height / dpr, sim);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setOpenTarget, setPatternMode]);

  /* ── Lift sim telemetry to React state for the readout HUD ── */

  useEffect(() => {
    const id = window.setInterval(() => {
      const sim = simRef.current;
      setOpenPct(Math.round(sim.open * 100));
      setPanels(sim.panelCount);
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
        onClick={() => setOpenTarget(simRef.current.targetOpen > 0.5 ? 0.16 : 0.74)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          simRef.current.pointer = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            active: true,
          };
        }}
        onPointerLeave={() => {
          simRef.current.pointer.active = false;
        }}
      />
      <LabReadout corner="left">
        <Gauge label="open" value={`${openPct}%`} primary />
        <Gauge label="pattern" value={pattern} />
        <Gauge label="panels" value={panels} />
      </LabReadout>

      <LabChrome
        identity={{
          name: "kirigami",
          scent: "rotating-square lattice · click to open, pointer pulls",
        }}
        info={info}
      >
        <ControlGroup label="sheet">
          <Toggle
            label={targetOpen > 0.5 ? "open" : "closed"}
            pressed={targetOpen > 0.5}
            onChange={() => setOpenTarget(targetOpen > 0.5 ? 0.16 : 0.74)}
          />
          <Toggle label="cuts" pressed={showCuts} onChange={toggleCuts} />
        </ControlGroup>
        <ControlGroup label="pattern">
          <Segmented
            label="pattern"
            value={pattern}
            onChange={setPatternMode}
            options={PATTERNS.map((entry) => ({ value: entry.id, label: entry.label }))}
          />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
