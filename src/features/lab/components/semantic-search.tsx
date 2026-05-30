"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  DOCUMENT_CHUNKS,
  SEARCH_QUERIES,
  type EmbeddingDocumentChunk,
  type EmbeddingSearchQuery,
} from "@/features/lab/data/embedding-data";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import { ControlGroup, LabSelect, LabSlider } from "@/features/lab/components/chrome/controls";
import { FormulaGauge, Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

type Category = "all" | (typeof DOCUMENT_CHUNKS)[number]["category"];

interface RenderState {
  queryIndex: number;
  topK: number;
  threshold: number;
  category: Category;
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
  muted: string;
  reject: string;
}

const CATEGORIES = [
  "all",
  ...Array.from(new Set(DOCUMENT_CHUNKS.map((chunk) => chunk.category))),
] as Category[];

const INITIAL_QUERY_INDEX = Math.max(
  0,
  SEARCH_QUERIES.findIndex((query) => query.id === "vector-db"),
);

function colors(): ThemeColors {
  if (getTheme() === "dark") {
    return {
      bg: "#0a0a0a",
      text: "rgba(224,226,220,0.62)",
      textBright: "rgba(224,226,220,0.9)",
      textDim: "rgba(224,226,220,0.28)",
      accent: "#d4ff00",
      accentDim: "rgba(212,255,0,0.22)",
      grid: "rgba(224,226,220,0.045)",
      muted: "rgba(224,226,220,0.1)",
      reject: "rgba(255,120,90,0.55)",
    };
  }
  return {
    bg: "#f5f1e8",
    text: "rgba(10,10,10,0.58)",
    textBright: "rgba(10,10,10,0.88)",
    textDim: "rgba(10,10,10,0.26)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.2)",
    grid: "rgba(10,10,10,0.045)",
    muted: "rgba(10,10,10,0.1)",
    reject: "rgba(190,70,40,0.58)",
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function ease(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}

function pointFor(item: { baseX: number; baseY: number }, W: number, H: number) {
  const padX = Math.min(96, W * 0.12);
  const padTop = W < 640 ? 168 : 110;
  const padBot = W < 640 ? 150 : 110;
  return {
    x: padX + item.baseX * (W - padX * 2),
    y: padTop + item.baseY * Math.max(120, H - padTop - padBot),
  };
}

function rankedMatches(query: EmbeddingSearchQuery, category: Category) {
  return query.matches
    .map((match) => {
      const chunk = DOCUMENT_CHUNKS[match.idx];
      return chunk ? { chunk, score: match.score } : null;
    })
    .filter((match): match is { chunk: EmbeddingDocumentChunk; score: number } => {
      return match !== null && (category === "all" || match.chunk.category === category);
    });
}

interface Telemetry {
  ranked: number;
  passing: number;
  best: number;
}

export function SemanticSearch({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const stateRef = useRef<RenderState>({
    queryIndex: INITIAL_QUERY_INDEX,
    topK: 5,
    threshold: 0.36,
    category: "all",
    time: 0,
    reduced: false,
  });
  const telemetryRef = useRef<Telemetry>({ ranked: 0, passing: 0, best: 0 });

  const [queryIndex, setQueryIndex] = useState(INITIAL_QUERY_INDEX);
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.36);
  const [category, setCategory] = useState<Category>("all");
  const [telemetry, setTelemetry] = useState<Telemetry>({ ranked: 0, passing: 0, best: 0 });

  useEffect(() => {
    stateRef.current.queryIndex = queryIndex;
  }, [queryIndex]);
  useEffect(() => {
    stateRef.current.topK = topK;
  }, [topK]);
  useEffect(() => {
    stateRef.current.threshold = threshold;
  }, [threshold]);
  useEffect(() => {
    stateRef.current.category = category;
  }, [category]);

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
      const query = SEARCH_QUERIES[s.queryIndex] ?? SEARCH_QUERIES[0];
      if (!query) return;
      const matches = rankedMatches(query, s.category);
      const visible = matches.slice(0, s.topK);
      const passing = visible.filter((match) => match.score >= s.threshold);
      telemetryRef.current = {
        ranked: visible.length,
        passing: passing.length,
        best: visible[0]?.score ?? 0,
      };
      const isCompact = W < 640;
      const queryPoint = pointFor(query, W, H);
      const pulse = s.reduced ? 0.45 : 0.35 + 0.25 * Math.sin(s.time * 2.2);

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

      const matchIds = new Set(visible.map((match) => match.chunk.id));
      const passIds = new Set(passing.map((match) => match.chunk.id));

      for (const chunk of DOCUMENT_CHUNKS) {
        const pt = pointFor(chunk, W, H);
        const filtered = s.category !== "all" && chunk.category !== s.category;
        const ranked = matchIds.has(chunk.id);
        const pass = passIds.has(chunk.id);
        const alpha = filtered ? 0.14 : ranked ? 0.72 : 0.34;
        const radius = pass ? 6 : ranked ? 4.8 : 3.4;

        ctx.fillStyle = pass ? c.accent : ranked ? c.text : c.textDim;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if ((ranked || pass) && !isCompact) {
          ctx.font = `${pass ? 11 : 9}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = pass ? c.textBright : c.text;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(chunk.title, pt.x + 9, pt.y);
        }
      }

      for (let i = visible.length - 1; i >= 0; i--) {
        const match = visible[i];
        if (!match) continue;
        const pt = pointFor(match.chunk, W, H);
        const pass = match.score >= s.threshold;
        const t = ease((match.score - 0.2) / 0.55);
        ctx.strokeStyle = pass ? c.accentDim : c.reject;
        ctx.lineWidth = pass ? lerp(0.8, 3, t) : 1;
        ctx.setLineDash(pass ? [] : [4, 5]);
        ctx.beginPath();
        ctx.moveTo(queryPoint.x, queryPoint.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = lerp(queryPoint.x, pt.x, 0.52);
        const my = lerp(queryPoint.y, pt.y, 0.52);
        if (!isCompact) {
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillStyle = pass ? c.textBright : c.textDim;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(match.score.toFixed(2), mx, my - 8);
        }
      }

      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 7, 0, Math.PI * 2);
      ctx.fill();
      if (!isCompact) {
        ctx.font = "12px 'JetBrains Mono', monospace";
        ctx.fillStyle = c.textBright;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`"${query.label}"`, queryPoint.x, queryPoint.y - 28);
      }

      const panelW = Math.min(isCompact ? W - 40 : 360, W - 40);
      const panelX = isCompact ? 20 : W - panelW - 20;
      const panelY = isCompact ? Math.max(260, H - 330) : Math.max(130, H - 330);
      ctx.fillStyle = getTheme() === "dark" ? "rgba(10,10,10,0.72)" : "rgba(245,241,232,0.76)";
      ctx.fillRect(panelX, panelY, panelW, 220);
      ctx.strokeStyle = c.muted;
      ctx.strokeRect(panelX, panelY, panelW, 220);

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = c.textDim;
      ctx.fillText("RANKED CHUNKS", panelX + 14, panelY + 12);

      if (visible.length === 0) {
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillStyle = c.text;
        ctx.fillText("no chunks match the metadata filter", panelX + 14, panelY + 40);
      }

      for (let i = 0; i < Math.min(5, visible.length); i++) {
        const match = visible[i];
        if (!match) continue;
        const y = panelY + 38 + i * 33;
        const pass = match.score >= s.threshold;
        ctx.fillStyle = pass ? c.accentDim : "transparent";
        ctx.fillRect(panelX + 12, y - 4, panelW - 24, 25);
        ctx.fillStyle = pass ? c.accent : c.reject;
        ctx.fillRect(panelX + 12, y - 4, 3, 25);
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillStyle = pass ? c.textBright : c.text;
        ctx.fillText(`${String(i + 1).padStart(2, "0")} ${match.chunk.title}`, panelX + 24, y);
        ctx.textAlign = "right";
        ctx.fillText(match.score.toFixed(2), panelX + panelW - 16, y);
        ctx.textAlign = "left";
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = c.textDim;
        ctx.fillText(`${match.chunk.category} · ${match.chunk.source}`, panelX + 24, y + 14);
      }
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  // Lift the live ranking telemetry to React state for the readout HUD.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = telemetryRef.current;
      setTelemetry((prev) =>
        prev.ranked === t.ranked && prev.passing === t.passing && prev.best === t.best
          ? prev
          : { ranked: t.ranked, passing: t.passing, best: t.best },
      );
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      <LabReadout corner="left">
        <Gauge label="ranked" value={telemetry.ranked} />
        <Gauge label="passing" value={telemetry.passing} primary />
        <FormulaGauge label="best" expr="cos" value={telemetry.best.toFixed(2)} />
        <Gauge label="filter" value={category} />
      </LabReadout>

      <LabChrome
        identity={{ name: "semantic search", scent: "cosine ranking · query · threshold · filter" }}
        info={info}
      >
        <ControlGroup label="query">
          <LabSelect
            label="example"
            value={String(queryIndex)}
            onChange={(value) => setQueryIndex(Number(value))}
            options={SEARCH_QUERIES.map((query, index) => ({
              value: String(index),
              label: query.label,
            }))}
          />
        </ControlGroup>
        <ControlGroup label="retrieval">
          <LabSlider label="top-k" min={1} max={8} value={topK} onChange={setTopK} />
          <LabSlider
            label="threshold"
            min={0}
            max={0.8}
            step={0.01}
            value={threshold}
            onChange={setThreshold}
            format={(v) => v.toFixed(2)}
          />
        </ControlGroup>
        <ControlGroup label="filter">
          <LabSelect
            label="metadata"
            value={category}
            onChange={(value) => setCategory(value as Category)}
            options={CATEGORIES.map((value) => ({ value, label: value }))}
          />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
