"use client";

import { useEffect, useRef, useState } from "react";

import {
  ANALOGIES,
  CONTEXTUAL_EXAMPLES,
  WORDS,
  type EmbeddingAnalogy,
  type EmbeddingContextualExample,
} from "@/features/lab/data/embedding-data";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

type ViewMode = "directions" | "context";

interface RenderState {
  mode: ViewMode;
  analogyIndex: number;
  contextIndex: number;
  time: number;
  reduced: boolean;
}

interface ThemeColors {
  bg: string;
  text: string;
  textBright: string;
  textDim: string;
  accent: string;
  accentDim: string;
  grid: string;
  cyan: string;
  orange: string;
  violet: string;
  panel: string;
}

function colors(): ThemeColors {
  if (getTheme() === "dark") {
    return {
      bg: "#0a0a0a",
      text: "rgba(224,226,220,0.62)",
      textBright: "rgba(224,226,220,0.92)",
      textDim: "rgba(224,226,220,0.28)",
      accent: "#d4ff00",
      accentDim: "rgba(212,255,0,0.24)",
      grid: "rgba(224,226,220,0.045)",
      cyan: "rgba(0,200,255,0.7)",
      orange: "rgba(255,160,100,0.72)",
      violet: "rgba(190,120,255,0.72)",
      panel: "rgba(10,10,10,0.72)",
    };
  }
  return {
    bg: "#f5f1e8",
    text: "rgba(10,10,10,0.58)",
    textBright: "rgba(10,10,10,0.88)",
    textDim: "rgba(10,10,10,0.25)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.2)",
    grid: "rgba(10,10,10,0.045)",
    cyan: "rgba(0,110,170,0.72)",
    orange: "rgba(190,90,30,0.7)",
    violet: "rgba(120,70,180,0.72)",
    panel: "rgba(245,241,232,0.76)",
  };
}

function point(baseX: number, baseY: number, W: number, H: number) {
  const padX = Math.min(96, W * 0.12);
  const padTop = 115;
  const padBot = 105;
  return {
    x: padX + baseX * (W - padX * 2),
    y: padTop + baseY * Math.max(140, H - padTop - padBot),
  };
}

function wordPoint(word: string, W: number, H: number) {
  const found = WORDS.find((item) => item.word === word);
  if (!found) return null;
  return { word: found.word, ...point(found.baseX, found.baseY, W, H) };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  phase: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const endX = x1 + dx * phase;
  const endY = y1 + dy * phase;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(dy, dx);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - 9 * Math.cos(angle - 0.35), endY - 9 * Math.sin(angle - 0.35));
  ctx.lineTo(endX - 9 * Math.cos(angle + 0.35), endY - 9 * Math.sin(angle + 0.35));
  ctx.closePath();
  ctx.fill();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  color: string,
  size = 11,
) {
  ctx.font = `${size}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

function drawTitle(ctx: CanvasRenderingContext2D, c: ThemeColors, mode: ViewMode) {
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.textDim;
  ctx.fillText("VECTOR STRUCTURE", 20, 58);
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillText(
    mode === "directions"
      ? "relationship offsets resolved in 384D, drawn in the 2D projection"
      : "same word surface, different context vectors and anchor neighborhoods",
    20,
    73,
  );
}

function drawDirections(
  ctx: CanvasRenderingContext2D,
  analogy: EmbeddingAnalogy,
  c: ThemeColors,
  W: number,
  H: number,
  time: number,
  reduced: boolean,
) {
  const a = wordPoint(analogy.a, W, H);
  const b = wordPoint(analogy.b, W, H);
  const cWord = wordPoint(analogy.c, W, H);
  const predicted = analogy.top[0] ? WORDS[analogy.top[0].idx] : undefined;
  const d = predicted ? wordPoint(predicted.word, W, H) : null;
  if (!a || !b || !cWord || !d) return;

  const phase = reduced ? 1 : 0.65 + 0.35 * Math.sin(time * 1.3) ** 2;

  drawArrow(ctx, b.x, b.y, a.x, a.y, c.accent, phase);
  drawArrow(ctx, cWord.x, cWord.y, d.x, d.y, c.cyan, phase);

  for (const item of [
    { p: a, color: c.accent },
    { p: b, color: c.text },
    { p: cWord, color: c.cyan },
    { p: d, color: c.cyan },
  ]) {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(item.p.x, item.p.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.p.x, item.p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, item.p.word, item.p.x, item.p.y - 28, c.textBright, 11);
  }

  const panelW = Math.min(460, W - 40);
  const panelX = Math.max(20, (W - panelW) / 2);
  const panelY = Math.max(130, H - 190);
  ctx.fillStyle = c.panel;
  ctx.fillRect(panelX, panelY, panelW, 76);
  ctx.strokeStyle = c.accentDim;
  ctx.strokeRect(panelX, panelY, panelW, 76);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "12px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.textBright;
  ctx.fillText(analogy.label, panelX + panelW / 2, panelY + 14);
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.text;
  ctx.fillText(
    `top match: ${predicted?.word ?? "?"} · cos=${analogy.top[0]?.score.toFixed(2) ?? "?"}`,
    panelX + panelW / 2,
    panelY + 37,
  );
}

function drawContext(
  ctx: CanvasRenderingContext2D,
  example: EmbeddingContextualExample,
  c: ThemeColors,
  W: number,
  H: number,
  time: number,
  reduced: boolean,
) {
  const pulse = reduced ? 0.5 : 0.35 + 0.25 * Math.sin(time * 2);

  for (const anchor of example.anchors) {
    const p = point(anchor.baseX, anchor.baseY, W, H);
    ctx.fillStyle = c.textDim;
    ctx.globalAlpha = 0.48;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawLabel(ctx, anchor.label, p.x, p.y + 14, c.textDim, 9);
  }

  const contextColors = [c.accent, c.orange, c.cyan, c.violet];
  example.contexts.forEach((context, index) => {
    const p = point(context.baseX, context.baseY, W, H);
    const color = contextColors[index % contextColors.length] ?? c.accent;

    for (const nearest of context.nearestAnchors) {
      const anchor = example.anchors.find((item) => item.label === nearest.label);
      if (!anchor) continue;
      const ap = point(anchor.baseX, anchor.baseY, W, H);
      ctx.strokeStyle = color;
      ctx.globalAlpha = Math.max(0.12, nearest.score * 0.34);
      ctx.lineWidth = 1 + nearest.score;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ap.x, ap.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, context.label, p.x, p.y - 28, c.textBright, 11);
  });

  const panelW = Math.min(520, W - 40);
  const panelX = Math.max(20, (W - panelW) / 2);
  const panelY = Math.max(130, H - 260);
  ctx.fillStyle = c.panel;
  ctx.fillRect(panelX, panelY, panelW, 108);
  ctx.strokeStyle = c.accentDim;
  ctx.strokeRect(panelX, panelY, panelW, 108);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.textDim;
  ctx.fillText(`surface word: "${example.word}"`, panelX + 16, panelY + 14);
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = c.textBright;
  ctx.fillText(example.note, panelX + 16, panelY + 32);

  example.contexts.forEach((context, index) => {
    const y = panelY + 56 + index * 20;
    ctx.fillStyle = contextColors[index % contextColors.length] ?? c.accent;
    ctx.fillText(context.label, panelX + 16, y);
    ctx.fillStyle = c.text;
    ctx.fillText(context.nearestAnchors.map((item) => item.label).join(" / "), panelX + 138, y);
  });
}

export function VectorStructure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const stateRef = useRef<RenderState>({
    mode: "directions",
    analogyIndex: 0,
    contextIndex: 0,
    time: 0,
    reduced: false,
  });

  const [mode, setMode] = useState<ViewMode>("directions");
  const [analogyIndex, setAnalogyIndex] = useState(0);
  const [contextIndex, setContextIndex] = useState(0);

  useEffect(() => {
    stateRef.current.mode = mode;
  }, [mode]);
  useEffect(() => {
    stateRef.current.analogyIndex = analogyIndex;
  }, [analogyIndex]);
  useEffect(() => {
    stateRef.current.contextIndex = contextIndex;
  }, [contextIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    stateRef.current.reduced = prefersReducedMotion();

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const observer = new ResizeObserver(setSize);
    observer.observe(canvas);

    let last = performance.now();
    const render = (now: number) => {
      rafRef.current = requestAnimationFrame(render);
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      const s = stateRef.current;
      if (!s.reduced) s.time += dt;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      if (W === 0 || H === 0) return;
      const c = colors();

      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 1;
      for (let gx = 60; gx < W; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 60; gy < H; gy += 60) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      drawTitle(ctx, c, s.mode);
      if (s.mode === "directions") {
        const analogy = ANALOGIES[s.analogyIndex] ?? ANALOGIES[0];
        if (analogy) drawDirections(ctx, analogy, c, W, H, s.time, s.reduced);
      } else {
        const example = CONTEXTUAL_EXAMPLES[s.contextIndex] ?? CONTEXTUAL_EXAMPLES[0];
        if (example) drawContext(ctx, example, c, W, H, s.time, s.reduced);
      }
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  const btnBase =
    "px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors cursor-pointer";
  const active = "bg-foreground/10 text-foreground/75";
  const inactive = "text-foreground/35 hover:text-foreground/60";
  const selectClass =
    "h-7 border border-foreground/15 bg-background/70 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/65 focus:border-accent focus:outline-none";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      <div className="fixed right-5 top-24 z-10 flex max-w-[calc(100vw-2.5rem)] flex-wrap items-center justify-end gap-2 bg-background/80 px-2 py-2 backdrop-blur-sm md:right-8">
        <button
          type="button"
          onClick={() => setMode("directions")}
          className={`${btnBase} ${mode === "directions" ? active : inactive}`}
        >
          directions
        </button>
        <button
          type="button"
          onClick={() => setMode("context")}
          className={`${btnBase} ${mode === "context" ? active : inactive}`}
        >
          context
        </button>

        {mode === "directions" ? (
          <select
            value={analogyIndex}
            aria-label="analogy"
            onChange={(event) => setAnalogyIndex(Number(event.target.value))}
            className={selectClass}
          >
            {ANALOGIES.map((analogy, index) => (
              <option key={analogy.label} value={index}>
                {analogy.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={contextIndex}
            aria-label="contextual example"
            onChange={(event) => setContextIndex(Number(event.target.value))}
            className={selectClass}
          >
            {CONTEXTUAL_EXAMPLES.map((example, index) => (
              <option key={example.word} value={index}>
                {example.word}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
