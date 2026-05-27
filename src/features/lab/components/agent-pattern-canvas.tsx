"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { btnActive, btnBase, btnInactive, controlBar } from "@/features/lab/lib/control-styles";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

type AgentNodeType = "control" | "worker" | "review" | "state" | "user" | "tool";
type Pace = "steady" | "busy" | "busier";
type PatternTone = "lime" | "cyan" | "amber" | "violet" | "red";

export type AgentPatternNode = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  type: AgentNodeType;
};

export type AgentPatternEdge = {
  from: string;
  to: string;
  label: string;
  bend?: number;
  dashed?: boolean;
};

export type AgentPatternMetric = {
  label: string;
  value: number;
};

export type AgentPatternScenario = {
  id: string;
  label: string;
  caption: string;
  nodes: AgentPatternNode[];
  edges: AgentPatternEdge[];
  metrics: AgentPatternMetric[];
};

export type AgentPatternConfig = {
  title: string;
  subtitle: string;
  tone?: PatternTone;
  initialScenarioId?: string;
  initialPace?: Pace;
  scenarios: AgentPatternScenario[];
};

const BG = { dark: "#0a0a0a", light: "#f5f1e8" } as const;
const FG = { dark: "rgba(224,226,220,", light: "rgba(10,10,10," } as const;
const ACCENT = { dark: "#d4ff00", light: "#2a8a0e" } as const;
const CYAN = { dark: "#62d9ff", light: "#0077a8" } as const;
const RED = { dark: "#ff6b6b", light: "#b42318" } as const;
const AMBER = { dark: "#ffd166", light: "#9f5f00" } as const;
const VIOLET = { dark: "#b894ff", light: "#7650b5" } as const;

type PatternPalette = {
  primary: string;
  secondary: string;
  tertiary: string;
};

function alpha(theme: "dark" | "light", value: number) {
  return `${FG[theme]}${value})`;
}

function patternPalette(tone: PatternTone, theme: "dark" | "light"): PatternPalette {
  if (tone === "cyan") {
    return { primary: CYAN[theme], secondary: ACCENT[theme], tertiary: VIOLET[theme] };
  }
  if (tone === "amber") {
    return { primary: AMBER[theme], secondary: RED[theme], tertiary: CYAN[theme] };
  }
  if (tone === "violet") {
    return { primary: VIOLET[theme], secondary: AMBER[theme], tertiary: CYAN[theme] };
  }
  if (tone === "red") {
    return { primary: RED[theme], secondary: AMBER[theme], tertiary: CYAN[theme] };
  }
  return { primary: ACCENT[theme], secondary: CYAN[theme], tertiary: AMBER[theme] };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function nodeColor(type: AgentNodeType, theme: "dark" | "light", primary: string) {
  switch (type) {
    case "control":
      return primary;
    case "worker":
      return CYAN[theme];
    case "review":
      return AMBER[theme];
    case "state":
      return VIOLET[theme];
    case "tool":
      return RED[theme];
    case "user":
      return alpha(theme, 0.86);
  }
}

function linePoint(
  start: { x: number; y: number },
  end: { x: number; y: number },
  bend: number,
  t: number,
) {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * cx + t * t * end.x;
  const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * cy + t * t * end.y;
  return { x, y };
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((entry, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    ctx.fillText(`${entry}${suffix}`, x, y + index * lineHeight);
  });
}

function relativeMetricLabel(value: number) {
  if (value >= 0.67) return "high";
  if (value >= 0.34) return "medium";
  return "low";
}

export function AgentPatternCanvas({ config }: { config: AgentPatternConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const descriptionId = useId();
  const liveRegionId = useId();
  const initialScenarioIndex = Math.max(
    0,
    config.scenarios.findIndex((scenario) => scenario.id === config.initialScenarioId),
  );
  const initialPace = config.initialPace ?? "steady";
  const [scenarioIndex, setScenarioIndex] = useState(initialScenarioIndex);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [pace, setPace] = useState<Pace>(initialPace);
  const reduceMotion = useMemo(
    () => (typeof window === "undefined" ? false : prefersReducedMotion()),
    [],
  );

  const scenario = config.scenarios[scenarioIndex] ?? config.scenarios[0];
  const selected =
    scenario.nodes.find((node) => node.id === selectedNode) ?? scenario.nodes[0] ?? null;
  const metricSummary = scenario.metrics
    .map((metric) => `${metric.label}: ${relativeMetricLabel(metric.value)}`)
    .join("; ");
  const nodeSummary = scenario.nodes
    .map((node) => `${node.label}, ${node.type}: ${node.detail}`)
    .join(" ");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scenario) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const nodePositions = new Map<string, { x: number; y: number }>();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const mapX = (x: number) => width * (0.08 + x * 0.84);
    const mapY = (y: number) => {
      const safeTop = 74;
      const safeBottom = Math.min(150, Math.max(118, height * 0.2));
      const usable = Math.max(260, height - safeTop - safeBottom);
      return safeTop + y * usable;
    };

    const draw = (time: number) => {
      const theme = getTheme();
      const palette = patternPalette(config.tone ?? "lime", theme);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = BG[theme];
      ctx.fillRect(0, 0, width, height);

      const grid = Math.max(32, Math.min(64, width / 18));
      ctx.strokeStyle = alpha(theme, 0.04);
      ctx.lineWidth = 1;
      for (let x = (time * 0.005) % grid; x < width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = (time * 0.003) % grid; y < height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      nodePositions.clear();
      for (const node of scenario.nodes) {
        nodePositions.set(node.id, { x: mapX(node.x), y: mapY(node.y) });
      }

      const pulseSpeed =
        reduceMotion || paused
          ? 0
          : pace === "busier"
            ? 0.00055
            : pace === "busy"
              ? 0.00034
              : 0.0002;
      const packetCount = pace === "busier" ? 3 : pace === "busy" ? 2 : 1;
      for (const edge of scenario.edges) {
        const start = nodePositions.get(edge.from);
        const end = nodePositions.get(edge.to);
        if (!start || !end) continue;
        const bend = edge.bend ?? 0;

        const c = linePoint(start, end, bend, 0.5);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(c.x, c.y, end.x, end.y);
        ctx.strokeStyle = alpha(theme, 0.13);
        ctx.lineWidth = 1.5;
        if (edge.dashed) ctx.setLineDash([7, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        for (let packet = 0; packet < packetCount; packet++) {
          const phase =
            (time * pulseSpeed + scenario.edges.indexOf(edge) * 0.17 + packet / packetCount) % 1;
          const p = linePoint(start, end, bend, phase);
          ctx.beginPath();
          ctx.arc(p.x, p.y, packet === 0 ? 4.5 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = edge.dashed ? palette.tertiary : palette.primary;
          ctx.globalAlpha = packet === 0 ? 1 : 0.58;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      for (const node of scenario.nodes) {
        const p = nodePositions.get(node.id);
        if (!p) continue;
        const isSelected = selected?.id === node.id;
        const w = Math.max(126, Math.min(178, width * 0.16));
        const h = 58;
        const x = p.x - w / 2;
        const y = p.y - h / 2;
        const color = nodeColor(node.type, theme, palette.primary);
        const selectedFill = node.type === "user" ? alpha(theme, 0.12) : `${color}22`;

        ctx.shadowColor = color;
        ctx.shadowBlur = isSelected ? 18 : 8;
        ctx.fillStyle = isSelected ? selectedFill : alpha(theme, 0.04);
        roundedRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = isSelected ? color : alpha(theme, 0.15);
        ctx.lineWidth = isSelected ? 1.5 : 1;
        roundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = "10px var(--font-geist-mono), monospace";
        ctx.textAlign = "left";
        ctx.fillText(node.type, x + 12, y + 18);

        ctx.fillStyle = alpha(theme, 0.84);
        ctx.font = "13px var(--font-geist-mono), monospace";
        ctx.fillText(node.label, x + 12, y + 38);
      }

      const panelWidth = Math.min(330, width - 32);
      const panelX = width < 760 ? width - panelWidth - 16 : width - panelWidth - 42;
      const safeBottom = Math.min(150, Math.max(118, height * 0.2));
      const panelY = 108;
      const panelHeight = 142;
      roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);
      ctx.fillStyle = theme === "dark" ? "rgba(10,10,10,0.72)" : "rgba(245,241,232,0.82)";
      ctx.fill();
      ctx.strokeStyle = alpha(theme, 0.13);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = palette.primary;
      ctx.font = "10px var(--font-geist-mono), monospace";
      ctx.fillText(config.title.toUpperCase(), panelX + 16, panelY + 24);

      ctx.textAlign = "right";
      ctx.fillStyle = alpha(theme, 0.34);
      ctx.fillText(
        `${scenario.nodes.length} nodes / ${scenario.edges.length} paths`,
        panelX + panelWidth - 16,
        panelY + 24,
      );

      ctx.fillStyle = alpha(theme, 0.82);
      ctx.font = "12px var(--font-geist-mono), monospace";
      ctx.textAlign = "left";
      drawWrappedText(ctx, scenario.caption, panelX + 16, panelY + 50, panelWidth - 32, 16, 2);

      ctx.fillStyle = alpha(theme, 0.36);
      ctx.font = "11px var(--font-geist-mono), monospace";
      drawWrappedText(
        ctx,
        selected ? selected.detail : config.subtitle,
        panelX + 16,
        panelY + 88,
        panelWidth - 32,
        15,
        2,
      );

      const stripY = panelY + panelHeight - 16;
      const stripW = (panelWidth - 42) / 3;
      scenario.metrics.slice(0, 3).forEach((metric, index) => {
        const x = panelX + 16 + index * (stripW + 5);
        const value = Math.max(0, Math.min(1, metric.value));
        ctx.fillStyle = alpha(theme, 0.08);
        roundedRect(ctx, x, stripY, stripW, 6, 3);
        ctx.fill();
        ctx.fillStyle =
          index === 0 ? palette.primary : index === 1 ? palette.secondary : palette.tertiary;
        roundedRect(ctx, x, stripY, stripW * value, 6, 3);
        ctx.fill();
      });

      const dotY = stripY - 13;
      for (let i = 0; i < Math.min(14, scenario.edges.length + packetCount); i++) {
        const pulse = Math.sin(time * 0.004 + i * 0.7) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(panelX + 17 + i * 10, dotY, 2 + pulse * 1.4, 0, Math.PI * 2);
        ctx.fillStyle =
          i % 3 === 0 ? palette.primary : i % 3 === 1 ? palette.secondary : palette.tertiary;
        ctx.globalAlpha = 0.35 + pulse * 0.45;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const metricY = Math.max(panelY + 210, height - safeBottom - 118);
      const metricWidth = Math.min(460, width - 36);
      const metricX = 18;
      scenario.metrics.forEach((metric, index) => {
        const y = metricY + index * 30;
        const value = Math.max(0, Math.min(1, metric.value));
        ctx.fillStyle = alpha(theme, 0.28);
        ctx.font = "10px var(--font-geist-mono), monospace";
        ctx.textAlign = "left";
        ctx.fillText(metric.label.toUpperCase(), metricX, y);
        ctx.fillStyle = alpha(theme, 0.08);
        roundedRect(ctx, metricX + 130, y - 10, metricWidth - 170, 8, 4);
        ctx.fill();
        ctx.fillStyle =
          index === 0 ? palette.primary : index === 1 ? palette.secondary : palette.tertiary;
        roundedRect(ctx, metricX + 130, y - 10, (metricWidth - 170) * value, 8, 4);
        ctx.fill();
        ctx.fillStyle = alpha(theme, 0.45);
        ctx.textAlign = "right";
        ctx.fillText(relativeMetricLabel(value).toUpperCase(), metricX + metricWidth, y);
      });

      if (!paused) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let closest: { id: string; distance: number } | null = null;
      for (const node of scenario.nodes) {
        const p = { x: mapX(node.x), y: mapY(node.y) };
        const distance = Math.hypot(p.x - x, p.y - y);
        if (distance < 92 && (!closest || distance < closest.distance)) {
          closest = { id: node.id, distance };
        }
      }
      if (closest) setSelectedNode(closest.id);
    };
    canvas.addEventListener("pointerdown", onPointerDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [config.title, scenario, selected?.id, selected?.detail, paused, pace, reduceMotion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key.toLowerCase() === "r") {
        setScenarioIndex(initialScenarioIndex);
        setSelectedNode(null);
        setPaused(false);
        setPace(initialPace);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [initialPace, initialScenarioIndex]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-screen w-screen touch-none"
        role="img"
        aria-label={`${config.title} agent pattern visualization`}
        aria-describedby={`${descriptionId} ${liveRegionId}`}
      />
      <section id={descriptionId} className="sr-only">
        <h2>{config.title}</h2>
        <p>{config.subtitle}</p>
        <p>
          Active scenario: {scenario.label}. {scenario.caption}
        </p>
        <p>Metrics: {metricSummary}.</p>
        <p>Nodes: {nodeSummary}</p>
      </section>
      <p id={liveRegionId} className="sr-only" aria-live="polite">
        Selected node: {selected ? `${selected.label}, ${selected.type}. ${selected.detail}` : ""}
        Animation pace: {pace}. {paused ? "Animation paused." : "Animation running."}
      </p>
      <div
        className={cn(
          controlBar,
          "bottom-28 max-w-[calc(100vw-2rem)] flex-wrap justify-center gap-2",
        )}
        role="toolbar"
        aria-label={`${config.title} visualization controls`}
      >
        <div className="flex flex-wrap items-center justify-center gap-1" aria-label="Scenarios">
          {config.scenarios.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(btnBase, scenarioIndex === index ? btnActive : btnInactive)}
              aria-pressed={scenarioIndex === index}
              aria-label={`Show ${item.label} scenario`}
              onClick={() => {
                setScenarioIndex(index);
                setSelectedNode(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-foreground/10" aria-hidden="true" />
        <button
          type="button"
          className={cn(btnBase, pace !== "steady" ? btnActive : btnInactive)}
          aria-label={`Animation pace: ${pace}. Activate to switch pace.`}
          onClick={() =>
            setPace((value) =>
              value === "steady" ? "busy" : value === "busy" ? "busier" : "steady",
            )
          }
        >
          {pace}
        </button>
        <button
          type="button"
          className={cn(btnBase, paused ? btnActive : btnInactive)}
          aria-pressed={paused}
          aria-label={paused ? "Resume animation" : "Pause animation"}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "play" : "pause"}
        </button>
      </div>
    </>
  );
}
