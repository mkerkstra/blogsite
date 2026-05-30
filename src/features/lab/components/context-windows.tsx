"use client";

import type { MutableRefObject, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";
import { ControlGroup, Segmented, Transport } from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";

type Strategy = "truncate" | "retrieve" | "compact";

interface Chunk {
  id: string;
  label: string;
  kind: "system" | "history" | "document" | "code" | "retrieval" | "request";
  tokens: number;
  relevance: number;
}

interface Allocation {
  chunk: Chunk;
  allocated: number;
  compressed: boolean;
  partial: boolean;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  allocation: Allocation;
}

interface SourceRect {
  x: number;
  y: number;
  w: number;
  h: number;
  chunk: Chunk;
}

interface Palette {
  bg: string;
  text: string;
  textDim: string;
  textFaint: string;
  line: string;
  lineStrong: string;
  window: string;
  reserve: string;
  overflow: string;
  attention: string;
  attentionHot: string;
  retrieval: string;
  summary: string;
  system: string;
  history: string;
  document: string;
  code: string;
  request: string;
  tooltipBg: string;
}

const DARK: Palette = {
  bg: "#0a0a0a",
  text: "rgba(224,226,220,0.78)",
  textDim: "rgba(224,226,220,0.45)",
  textFaint: "rgba(224,226,220,0.24)",
  line: "rgba(224,226,220,0.08)",
  lineStrong: "rgba(224,226,220,0.16)",
  window: "rgba(212,255,0,0.42)",
  reserve: "rgba(0,212,255,0.28)",
  overflow: "rgba(255,100,80,0.38)",
  attention: "rgba(212,255,0,0.22)",
  attentionHot: "rgba(212,255,0,0.72)",
  retrieval: "rgba(0,212,255,0.48)",
  summary: "rgba(255,180,50,0.48)",
  system: "rgba(180,120,255,0.5)",
  history: "rgba(224,226,220,0.24)",
  document: "rgba(100,200,255,0.42)",
  code: "rgba(255,150,90,0.42)",
  request: "rgba(212,255,0,0.58)",
  tooltipBg: "rgba(10,10,10,0.92)",
};

const LIGHT: Palette = {
  bg: "#f5f1e8",
  text: "rgba(10,10,10,0.72)",
  textDim: "rgba(10,10,10,0.46)",
  textFaint: "rgba(10,10,10,0.26)",
  line: "rgba(10,10,10,0.08)",
  lineStrong: "rgba(10,10,10,0.14)",
  window: "rgba(42,138,14,0.38)",
  reserve: "rgba(0,120,180,0.24)",
  overflow: "rgba(190,70,50,0.3)",
  attention: "rgba(42,138,14,0.18)",
  attentionHot: "rgba(42,138,14,0.62)",
  retrieval: "rgba(0,120,180,0.38)",
  summary: "rgba(180,100,20,0.36)",
  system: "rgba(110,70,170,0.38)",
  history: "rgba(10,10,10,0.18)",
  document: "rgba(0,120,180,0.28)",
  code: "rgba(180,80,30,0.28)",
  request: "rgba(42,138,14,0.46)",
  tooltipBg: "rgba(245,241,232,0.94)",
};

const CHUNKS: Chunk[] = [
  { id: "system", label: "system rules", kind: "system", tokens: 1200, relevance: 88 },
  { id: "issue", label: "ci failure brief", kind: "document", tokens: 9400, relevance: 70 },
  { id: "history-a", label: "early attempts", kind: "history", tokens: 16800, relevance: 36 },
  { id: "constraints", label: "review notes", kind: "document", tokens: 21400, relevance: 79 },
  { id: "logs", label: "latest logs", kind: "code", tokens: 12600, relevance: 58 },
  { id: "workflow", label: "workflow yaml", kind: "document", tokens: 18800, relevance: 92 },
  { id: "history-b", label: "recent chat", kind: "history", tokens: 15400, relevance: 64 },
  { id: "code", label: "source files", kind: "code", tokens: 17800, relevance: 83 },
  { id: "retrieval", label: "error lines", kind: "retrieval", tokens: 6600, relevance: 96 },
  { id: "question", label: "current fix", kind: "request", tokens: 1400, relevance: 100 },
];

const WINDOW_OPTIONS = [
  { label: "8K", tokens: 8_000 },
  { label: "32K", tokens: 32_000 },
  { label: "128K", tokens: 128_000 },
];

const STRATEGIES: { label: string; value: Strategy }[] = [
  { label: "truncate", value: "truncate" },
  { label: "retrieve", value: "retrieve" },
  { label: "compact", value: "compact" },
];

const RAW_TOTAL = CHUNKS.reduce((sum, chunk) => sum + chunk.tokens, 0);

function chunkColor(chunk: Chunk, palette: Palette): string {
  if (chunk.kind === "system") return palette.system;
  if (chunk.kind === "history") return palette.history;
  if (chunk.kind === "document") return palette.document;
  if (chunk.kind === "code") return palette.code;
  if (chunk.kind === "retrieval") return palette.retrieval;
  return palette.request;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) return `${Math.round(tokens / 100) / 10}k`;
  return String(tokens);
}

function reserveFor(windowTokens: number): number {
  return Math.max(1200, Math.round(windowTokens * 0.16));
}

function strategyDescription(strategy: Strategy): string {
  if (strategy === "truncate") {
    return "Truncation keeps the newest material and drops older middle chunks.";
  }
  if (strategy === "retrieve") {
    return "Retrieval spends the budget on high-scoring matches such as workflow files and error lines.";
  }
  return "Compaction rewrites older state into smaller records while discarding raw detail.";
}

function buildAllocations(strategy: Strategy, windowTokens: number): Allocation[] {
  const reserve = reserveFor(windowTokens);
  const usable = windowTokens - reserve;
  const system = CHUNKS[0];
  const request = CHUNKS[CHUNKS.length - 1];
  const middle = CHUNKS.slice(1, -1);
  const chosen = new Map<string, Allocation>();
  let remaining = Math.max(0, usable - system.tokens - request.tokens);

  chosen.set(system.id, {
    chunk: system,
    allocated: Math.min(system.tokens, usable),
    compressed: false,
    partial: system.tokens > usable,
  });
  chosen.set(request.id, {
    chunk: request,
    allocated: Math.min(
      request.tokens,
      Math.max(0, usable - (chosen.get(system.id)?.allocated ?? 0)),
    ),
    compressed: false,
    partial: false,
  });

  if (strategy === "truncate") {
    for (const chunk of [...middle].reverse()) {
      if (remaining <= 0) break;
      const allocated = Math.min(chunk.tokens, remaining);
      chosen.set(chunk.id, {
        chunk,
        allocated,
        compressed: false,
        partial: allocated < chunk.tokens,
      });
      remaining -= allocated;
    }
  } else if (strategy === "retrieve") {
    const ranked = [...middle].sort((a, b) => b.relevance - a.relevance);
    for (const chunk of ranked) {
      if (remaining <= 0) break;
      const budget = chunk.kind === "history" ? Math.round(chunk.tokens * 0.22) : chunk.tokens;
      const allocated = Math.min(budget, remaining);
      chosen.set(chunk.id, {
        chunk,
        allocated,
        compressed: allocated < chunk.tokens,
        partial: allocated < budget,
      });
      remaining -= allocated;
    }
  } else {
    for (const chunk of middle) {
      if (remaining <= 0) break;
      const compression = chunk.relevance >= 80 ? 0.22 : 0.1;
      const summarySize = Math.min(
        chunk.tokens,
        Math.max(320, Math.round(chunk.tokens * compression)),
      );
      const allocated = Math.min(summarySize, remaining);
      chosen.set(chunk.id, {
        chunk,
        allocated,
        compressed: summarySize < chunk.tokens,
        partial: allocated < summarySize,
      });
      remaining -= allocated;
    }
  }

  return CHUNKS.map((chunk) => chosen.get(chunk.id)).filter((value): value is Allocation => {
    return Boolean(value && value.allocated > 0);
  });
}

function buildMissing(allocations: Allocation[]): Chunk[] {
  const included = new Set(allocations.map((allocation) => allocation.chunk.id));
  return CHUNKS.filter((chunk) => !included.has(chunk.id));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (w <= 0 || h <= 0) return;
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number,
): void {
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  palette: Palette,
  align: CanvasTextAlign = "left",
): void {
  ctx.textAlign = align;
  ctx.fillStyle = palette.textFaint;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  fillText(ctx, text.toUpperCase(), x, y);
}

function getSourceRects(x: number, y: number, w: number): SourceRect[] {
  const rects: SourceRect[] = [];
  let cursor = x;

  for (const chunk of CHUNKS) {
    const width = Math.max(18, (chunk.tokens / RAW_TOTAL) * w);
    rects.push({
      x: cursor,
      y,
      w: width - 3,
      h: 28,
      chunk,
    });
    cursor += width;
  }

  return rects;
}

function getWindowRects(
  x: number,
  y: number,
  w: number,
  windowTokens: number,
  allocations: Allocation[],
): Rect[] {
  let cursor = x;

  return allocations.map((allocation) => {
    const chunkWidth = Math.max(16, (allocation.allocated / windowTokens) * w);
    const rect = {
      x: cursor + 2,
      y: y + 12,
      w: chunkWidth - 4,
      h: 38,
      allocation,
    };
    cursor += chunkWidth;
    return rect;
  });
}

function drawSourceLane(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  x: number,
  y: number,
  w: number,
  now: number,
): SourceRect[] {
  drawLabel(ctx, "raw material", x, y - 12, palette);
  const rects = getSourceRects(x, y, w);

  for (const rect of rects) {
    const { chunk } = rect;
    const color = chunkColor(chunk, palette);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = color;
    drawRoundedRect(ctx, rect.x, y, rect.w, rect.h, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (rect.w > 54) {
      ctx.fillStyle = palette.text;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      fillText(ctx, chunk.label, rect.x + 7, y + 17, rect.w - 9);
    }

    const phase = (now * 0.00008 + rect.x / w) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.sin(phase * Math.PI * 2) * 0.03})`;
    drawRoundedRect(ctx, rect.x, y, rect.w, rect.h, 5);
    ctx.fill();
  }

  return rects;
}

function drawBudgetBar(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  x: number,
  y: number,
  w: number,
  windowTokens: number,
  allocations: Allocation[],
): void {
  const reserve = reserveFor(windowTokens);
  const used = allocations.reduce((sum, allocation) => sum + allocation.allocated, 0);
  const dropped = Math.max(0, RAW_TOTAL - used);

  drawLabel(ctx, "token budget", x, y - 12, palette);
  ctx.strokeStyle = palette.lineStrong;
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, w, 30, 5);
  ctx.stroke();

  const usedWidth = Math.min(w, (used / windowTokens) * w);
  const reserveWidth = Math.min(w, (reserve / windowTokens) * w);

  ctx.fillStyle = palette.window;
  drawRoundedRect(ctx, x, y, usedWidth, 30, 5);
  ctx.fill();

  ctx.fillStyle = palette.reserve;
  drawRoundedRect(ctx, x + w - reserveWidth, y, reserveWidth, 30, 5);
  ctx.fill();

  if (dropped > 0) {
    ctx.fillStyle = palette.overflow;
    ctx.fillRect(x + usedWidth + 3, y + 11, Math.max(0, w - usedWidth - reserveWidth - 8), 8);
  }

  ctx.fillStyle = palette.text;
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  fillText(ctx, `${formatTokens(used)} placed`, x + 8, y + 19);
  ctx.textAlign = "right";
  fillText(ctx, `${formatTokens(reserve)} reply reserve`, x + w - 8, y + 19);

  ctx.fillStyle = palette.textDim;
  ctx.textAlign = "center";
  fillText(
    ctx,
    `${formatTokens(RAW_TOTAL)} raw input -> ${formatTokens(windowTokens)} window`,
    x + w / 2,
    y + 52,
  );
  ctx.textAlign = "left";
}

function drawWindowLane(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  x: number,
  y: number,
  w: number,
  strategy: Strategy,
  windowTokens: number,
  allocations: Allocation[],
  hoverRef: MutableRefObject<{ x: number; y: number } | null>,
  rectsRef: MutableRefObject<Rect[]>,
  now: number,
): void {
  drawLabel(ctx, "assembled prompt", x, y - 12, palette);
  const targetRects = getWindowRects(x, y, w, windowTokens, allocations);
  rectsRef.current = targetRects;
  const reserve = reserveFor(windowTokens);
  const usable = windowTokens - reserve;
  const usableWidth = (usable / windowTokens) * w;
  const reserveWidth = w - usableWidth;

  ctx.strokeStyle = palette.lineStrong;
  drawRoundedRect(ctx, x, y, w, 82, 6);
  ctx.stroke();

  for (const rect of targetRects) {
    const { allocation } = rect;
    const color = chunkColor(allocation.chunk, palette);
    ctx.fillStyle = color;
    ctx.globalAlpha = allocation.partial ? 0.48 : 0.78;
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (allocation.compressed) {
      ctx.strokeStyle = palette.textFaint;
      ctx.setLineDash([4, 4]);
      drawRoundedRect(ctx, rect.x + 2, rect.y + 2, Math.max(4, rect.w - 4), rect.h - 4, 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (rect.w > 50) {
      ctx.fillStyle = palette.text;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      fillText(ctx, allocation.chunk.label, rect.x + 6, y + 29, rect.w - 8);
      ctx.fillStyle = palette.textDim;
      fillText(ctx, formatTokens(allocation.allocated), rect.x + 6, y + 43, rect.w - 8);
    }

    const pulseOffset = (now * 0.055) % Math.max(1, rect.w);
    const pulseX =
      strategy === "compact" && allocation.compressed
        ? rect.x + rect.w - pulseOffset
        : rect.x + pulseOffset;
    ctx.strokeStyle = palette.attentionHot;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(pulseX, y + 8);
    ctx.lineTo(pulseX, y + 55);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = palette.reserve;
  drawRoundedRect(ctx, x + usableWidth, y + 12, reserveWidth - 3, 38, 5);
  ctx.fill();
  ctx.fillStyle = palette.textDim;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  fillText(ctx, "output", x + usableWidth + reserveWidth / 2, y + 35, reserveWidth - 8);

  ctx.strokeStyle = palette.window;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, x, y, usableWidth, 82, 6);
  ctx.stroke();

  const missing = buildMissing(allocations);
  ctx.fillStyle = palette.textFaint;
  ctx.textAlign = "left";
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  const missingLabel =
    strategy === "compact"
      ? "compacted: decisions and evidence retained; raw detail discarded"
      : missing.length
        ? `not in prompt: ${missing.map((chunk) => chunk.label).join(", ")}`
        : "everything fits in the active context";
  fillText(ctx, missingLabel, x + 8, y + 70, w - 16);

  const pointer = hoverRef.current;
  if (!pointer) return;

  const hovered = rectsRef.current.find((rect) => {
    return (
      pointer.x >= rect.x &&
      pointer.x <= rect.x + rect.w &&
      pointer.y >= rect.y &&
      pointer.y <= rect.y + rect.h
    );
  });
  if (!hovered) return;

  const { allocation } = hovered;
  const tipW = 236;
  const cssWidth = ctx.canvas.getBoundingClientRect().width;
  const cssHeight = ctx.canvas.getBoundingClientRect().height;
  const tipX = clamp(pointer.x + 14, 14, cssWidth - tipW - 14);
  const tipY = clamp(pointer.y - 72, 74, cssHeight - 146);
  ctx.fillStyle = palette.tooltipBg;
  drawRoundedRect(ctx, tipX, tipY, tipW, 72, 6);
  ctx.fill();
  ctx.strokeStyle = palette.lineStrong;
  ctx.stroke();
  ctx.fillStyle = palette.text;
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  fillText(ctx, allocation.chunk.label, tipX + 10, tipY + 20);
  ctx.fillStyle = palette.textDim;
  fillText(ctx, `raw: ${formatTokens(allocation.chunk.tokens)} tokens`, tipX + 10, tipY + 38);
  fillText(
    ctx,
    `placed: ${formatTokens(allocation.allocated)}${allocation.compressed ? " compressed" : ""}`,
    tipX + 10,
    tipY + 55,
  );
}

function quadraticPoint(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  t: number,
): { x: number; y: number } {
  const inv = 1 - t;
  return {
    x: inv * inv * sx + 2 * inv * t * cx + t * t * tx,
    y: inv * inv * sy + 2 * inv * t * cy + t * t * ty,
  };
}

function drawCompactionProcess(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  sourceRects: SourceRect[],
  targetRects: Rect[],
  now: number,
): void {
  const compressedTargets = targetRects.filter((rect) => rect.allocation.compressed);
  if (compressedTargets.length === 0) return;

  ctx.save();
  ctx.lineWidth = 1;

  for (let i = 0; i < compressedTargets.length; i++) {
    const target = compressedTargets[i];
    const source = sourceRects.find((rect) => rect.chunk.id === target.allocation.chunk.id);
    if (!source) continue;

    const sx = source.x + source.w / 2;
    const sy = source.y + source.h + 5;
    const tx = target.x + target.w / 2;
    const ty = target.y - 7;
    const cx = (sx + tx) / 2;
    const cy = Math.min(sy, ty) - 26 - (i % 3) * 8;

    const sourceColor = chunkColor(target.allocation.chunk, palette);
    ctx.strokeStyle = sourceColor;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
    ctx.stroke();

    for (let j = 0; j < 4; j++) {
      const t = (now * 0.00022 + i * 0.19 + j * 0.23) % 1;
      const point = quadraticPoint(sx, sy, cx, cy, tx, ty, t);
      const size = 2.5 + (j % 2) * 1.5;
      ctx.globalAlpha = 0.35 + t * 0.45;
      ctx.fillStyle = j % 2 === 0 ? sourceColor : palette.window;
      drawRoundedRect(ctx, point.x - size / 2, point.y - size / 2, size, size, 1.5);
      ctx.fill();
    }

    for (let j = 0; j < 4; j++) {
      const t = (now * 0.00016 + i * 0.13 + j * 0.31) % 1;
      const drift = Math.sin(t * Math.PI * 2 + i) * 12;
      const fallX = sx + drift + (j - 1) * 9;
      const fallY = sy + 8 + t * 72;
      const size = 5 - t * 2 + (j % 2);
      ctx.globalAlpha = Math.max(0.06, 0.82 - t * 0.72);
      ctx.fillStyle = palette.overflow;
      drawRoundedRect(ctx, fallX - size / 2, fallY - size / 2, size, size, 1.5);
      ctx.fill();
    }

    if (target.w > 54) {
      const phase = (now * 0.00042 + i * 0.17) % 1;
      const maxLineW = Math.max(8, target.w * 0.42);
      const lineW = Math.max(4, maxLineW * (1 - phase));
      const startX = target.x + target.w - 7 - maxLineW * phase;
      ctx.globalAlpha = 0.12 + (1 - phase) * 0.16;
      ctx.fillStyle = sourceColor;
      for (let j = 0; j < 3; j++) {
        const y = target.y + target.h - 10 - j * 5;
        ctx.fillRect(Math.max(target.x + 7, startX + j * 5), y, Math.max(3, lineW - j * 6), 1);
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.textFaint;
  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "right";
  const last = compressedTargets[compressedTargets.length - 1];
  fillText(ctx, "KEPT FACTS FLOW IN · DETAIL FALLS AWAY", last.x + last.w, last.y - 13, 260);
  ctx.restore();
}

function attentionStrength(x: number, strategy: Strategy, now: number): number {
  const edgeBoost = Math.exp(-x * 9) * 0.75 + Math.exp(-(1 - x) * 7) * 0.92;
  const middleDip = 1 - Math.exp(-Math.pow((x - 0.5) / 0.22, 2)) * 0.42;
  const retrievalPeak =
    strategy === "retrieve" ? Math.exp(-Math.pow((x - 0.62) / 0.08, 2)) * 0.8 : 0;
  const summaryLift = strategy === "compact" ? 0.22 : 0;
  const wave = Math.sin(now * 0.002 + x * 18) * 0.06;
  return clamp((edgeBoost + retrievalPeak + summaryLift + wave) * middleDip, 0.05, 1);
}

function drawAttentionMap(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  strategy: Strategy,
  now: number,
): void {
  drawLabel(ctx, "position attention", x, y - 12, palette);
  const cols = 42;
  const rows = 12;
  const cellW = w / cols;
  const cellH = h / rows;

  ctx.strokeStyle = palette.lineStrong;
  drawRoundedRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pos = col / (cols - 1);
      const rowBias = 0.72 + Math.sin(row * 0.8 + now * 0.0012) * 0.18;
      const strength = attentionStrength(pos, strategy, now) * rowBias;
      ctx.fillStyle = strength > 0.58 ? palette.attentionHot : palette.attention;
      ctx.globalAlpha = clamp(strength, 0.08, 0.78);
      ctx.fillRect(
        x + col * cellW + 1,
        y + row * cellH + 1,
        Math.max(1, cellW - 2),
        Math.max(1, cellH - 2),
      );
    }
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = palette.line;
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const pos = i / 80;
    const strength = attentionStrength(pos, strategy, now);
    const px = x + pos * w;
    const py = y + h + 38 - strength * 34;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = palette.window;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.fillStyle = palette.textFaint;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  fillText(ctx, "start", x, y + h + 54);
  ctx.textAlign = "center";
  fillText(ctx, "middle", x + w / 2, y + h + 54);
  ctx.textAlign = "right";
  fillText(ctx, "recent", x + w, y + h + 54);
}

export function ContextWindows({ info }: { info?: ReactNode }) {
  const descriptionId = useId();
  const liveRegionId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const rectsRef = useRef<Rect[]>([]);
  const strategyRef = useRef<Strategy>("retrieve");
  const windowRef = useRef(32_000);
  const pausedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const startTimeRef = useRef(0);

  const [strategy, setStrategy] = useState<Strategy>("retrieve");
  const [windowTokens, setWindowTokens] = useState(32_000);
  const [paused, setPaused] = useState(false);
  const currentAllocations = buildAllocations(strategy, windowTokens);
  const placedTokens = currentAllocations.reduce(
    (sum, allocation) => sum + allocation.allocated,
    0,
  );
  const droppedTokens = Math.max(0, RAW_TOTAL - placedTokens);
  const usableTokens = windowTokens - reserveFor(windowTokens);
  const compressedCount = currentAllocations.filter((allocation) => allocation.compressed).length;
  const promptSummary = currentAllocations
    .map((allocation) => {
      const mode = allocation.compressed ? "compacted" : "included";
      return `${allocation.chunk.label} (${mode}, ${formatTokens(allocation.allocated)})`;
    })
    .join("; ");

  useEffect(() => {
    strategyRef.current = strategy;
  }, [strategy]);

  useEffect(() => {
    windowRef.current = windowTokens;
  }, [windowTokens]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const reset = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const togglePause = useCallback(() => {
    setPaused((value) => !value);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    reducedMotionRef.current = prefersReducedMotion();
    startTimeRef.current = performance.now();

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const palette = getTheme() === "dark" ? DARK : LIGHT;
      const elapsed = pausedRef.current ? startTimeRef.current : time - startTimeRef.current;
      const now = reducedMotionRef.current ? 1200 : elapsed;
      const currentStrategy = strategyRef.current;
      const currentWindow = windowRef.current;
      const allocations = buildAllocations(currentStrategy, currentWindow);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const safeTop = 74;
      const safeBottom = Math.min(150, Math.max(118, height * 0.2));
      const margin = Math.min(width < 720 ? 22 : 56, Math.max(8, width * 0.08));
      const contentW = Math.max(180, width - margin * 2);
      const top = safeTop + (height < 680 ? 38 : 58);
      const sourceY = top + 42;
      const budgetY = sourceY + 70;
      const windowY = budgetY + 104;
      const mapY = windowY + 118;
      const mapH = Math.max(52, Math.min(128, height - safeBottom - mapY - 62));

      ctx.fillStyle = palette.text;
      ctx.font =
        width < 620
          ? "20px ui-monospace, SFMono-Regular, Menlo, monospace"
          : "28px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      fillText(ctx, "context windows", margin, top - 48);
      ctx.fillStyle = palette.textDim;
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
      fillText(
        ctx,
        "input, memory, attention, and the tokens that do not make the cut",
        margin,
        top - 24,
        contentW,
      );

      const sourceRects = drawSourceLane(ctx, palette, margin, sourceY, contentW, now);
      const targetRects = getWindowRects(margin, windowY, contentW, currentWindow, allocations);
      drawBudgetBar(ctx, palette, margin, budgetY, contentW, currentWindow, allocations);
      drawWindowLane(
        ctx,
        palette,
        margin,
        windowY,
        contentW,
        currentStrategy,
        currentWindow,
        allocations,
        hoverRef,
        rectsRef,
        now,
      );
      if (currentStrategy === "compact") {
        drawCompactionProcess(ctx, palette, sourceRects, targetRects, now);
      }
      drawAttentionMap(ctx, palette, margin, mapY, contentW, mapH, currentStrategy, now);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key.toLowerCase() === "r") {
        reset();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reset]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    hoverRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handlePointerLeave = useCallback(() => {
    hoverRef.current = null;
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        role="img"
        aria-label="Context window token budget visualization"
        aria-describedby={`${descriptionId} ${liveRegionId}`}
      />
      <section id={descriptionId} className="sr-only">
        <h2>Context windows</h2>
        <p>
          Visualization of a model assembling a prompt from raw material for a failing CI run. Raw
          material includes system rules, a failure brief, earlier fix attempts, review notes, fresh
          logs, workflow configuration, source files, retrieved error lines, and the current fix
          request.
        </p>
        <p>
          Current window: {formatTokens(windowTokens)} tokens. Reply reserve:{" "}
          {formatTokens(reserveFor(windowTokens))}. Placed: {formatTokens(placedTokens)}. Dropped:{" "}
          {formatTokens(droppedTokens)}.
        </p>
        <p>{strategyDescription(strategy)}</p>
        <p>Assembled prompt: {promptSummary}.</p>
      </section>
      <p id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
        Strategy {strategy}. Window {formatTokens(windowTokens)}.{" "}
        {paused ? "Animation paused." : "Animation running."}
      </p>

      <LabReadout corner="right">
        <Gauge label="usable" value={formatTokens(usableTokens)} />
        <Gauge label="placed" value={formatTokens(placedTokens)} primary />
        <Gauge label="dropped" value={formatTokens(droppedTokens)} />
        <Gauge label="compressed" value={compressedCount} />
      </LabReadout>

      <LabChrome
        identity={{ name: "context windows", scent: "token budget · hover the prompt" }}
        info={info}
      >
        <ControlGroup label="window">
          <Segmented
            label="size"
            value={windowTokens}
            onChange={setWindowTokens}
            options={WINDOW_OPTIONS.map((option) => ({
              value: option.tokens,
              label: option.label,
            }))}
          />
        </ControlGroup>
        <ControlGroup label="pack">
          <Segmented
            label="strategy"
            value={strategy}
            onChange={setStrategy}
            options={STRATEGIES}
          />
        </ControlGroup>
        <ControlGroup label="run" sticky>
          <Transport playing={!paused} onToggle={togglePause} onReset={reset} />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
