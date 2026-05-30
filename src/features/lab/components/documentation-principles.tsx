"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { ControlGroup, Segmented } from "@/features/lab/components/chrome/controls";
import { Gauge } from "@/features/lab/components/chrome/gauges";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { LabReadout } from "@/features/lab/components/chrome/lab-readout";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { LAB_CANVAS_CLASS } from "@/features/lab/lib/use-lab-canvas";

type Mode = "tutorial" | "how-to" | "reference" | "explanation";

interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

interface SimulationState {
  mode: Mode;
  functionalVisual: boolean;
  time: number;
  pointer: PointerState;
}

interface Principle {
  id: string;
  title: string;
  body: string;
  scores: Record<Mode, number>;
  kind: "signal" | "support" | "noise";
}

interface ExampleRow {
  label: string;
  text: string;
}

interface ModeExample {
  eyebrow: string;
  title: string;
  intro: string;
  rows: ExampleRow[];
  diagramLabels: [string, string, string, string];
}

interface Colors {
  bg: string;
  fg: string;
  muted: string;
  faint: string;
  line: string;
  card: string;
  cardAlt: string;
  accent: string;
  accentSoft: string;
  reject: string;
  shadow: string;
}

const MODES: { id: Mode; label: string }[] = [
  { id: "tutorial", label: "tutorial" },
  { id: "how-to", label: "how-to" },
  { id: "reference", label: "reference" },
  { id: "explanation", label: "explain" },
];

const MODE_LABELS: Record<Mode, string> = {
  tutorial: "Tutorial",
  "how-to": "How-to",
  reference: "Reference",
  explanation: "Explanation",
};

const PRINCIPLES: Principle[] = [
  {
    id: "claim",
    title: "central claim",
    body: "Open with the main idea.",
    kind: "signal",
    scores: { tutorial: 0.5, "how-to": 0.45, reference: 0.55, explanation: 1 },
  },
  {
    id: "vocabulary",
    title: "working vocabulary",
    body: "Define recurring terms before they carry the argument.",
    kind: "signal",
    scores: { tutorial: 0.7, "how-to": 0.55, reference: 0.8, explanation: 0.98 },
  },
  {
    id: "recap-example",
    title: "threaded example",
    body: "Use one concrete scenario, then keep returning to it.",
    kind: "signal",
    scores: { tutorial: 0.8, "how-to": 0.5, reference: 0.18, explanation: 0.95 },
  },
  {
    id: "diagram",
    title: "functional visual",
    body: "Show the actual transformation, not decoration.",
    kind: "signal",
    scores: { tutorial: 0.58, "how-to": 0.45, reference: 0.62, explanation: 0.9 },
  },
  {
    id: "context",
    title: "why and tradeoffs",
    body: "Explain why the structure exists.",
    kind: "signal",
    scores: { tutorial: 0.35, "how-to": 0.32, reference: 0.28, explanation: 0.94 },
  },
];

const MODE_MATERIAL: Principle[] = [
  {
    id: "field-list",
    title: "field list",
    body: "Exact names and flags belong in generated reference.",
    kind: "support",
    scores: { tutorial: 0.35, "how-to": 0.62, reference: 1, explanation: 0.26 },
  },
  {
    id: "steps",
    title: "runbook steps",
    body: "Imperative task instructions serve a how-to guide.",
    kind: "support",
    scores: { tutorial: 0.85, "how-to": 1, reference: 0.22, explanation: 0.1 },
  },
  {
    id: "filler",
    title: "rhetorical filler",
    body: "Slogans, cute labels, and self-description burn attention.",
    kind: "noise",
    scores: { tutorial: 0.18, "how-to": 0.12, reference: 0.06, explanation: 0.05 },
  },
];

const MODE_EXAMPLES: Record<Mode, ModeExample> = {
  tutorial: {
    eyebrow: "tutorial example",
    title: "First documentation edit",
    intro: "A novice learns the standard by improving one small paragraph.",
    rows: [
      { label: "learner", text: "A new teammate has never used the documentation standard." },
      {
        label: "starting point",
        text: "The draft opens with vague background and undefined terms.",
      },
      { label: "guided move", text: "Pick a mode, define two terms, then rewrite the opener." },
      { label: "result", text: "The reader sees the claim before the details." },
    ],
    diagramLabels: ["draft", "mode", "rewrite", "learn"],
  },
  "how-to": {
    eyebrow: "how-to example",
    title: "Refresh a stale doc",
    intro: "A practitioner needs the shortest reliable path to finish a doc edit.",
    rows: [
      { label: "goal", text: "Update a stale guide without duplicating generated reference." },
      {
        label: "prepare",
        text: "Identify the doc mode and the generated reference it depends on.",
      },
      { label: "edit", text: "Bump verification, remove duplicated facts, and link the source." },
      { label: "verify", text: "Run formatting and doc checks before calling it done." },
    ],
    diagramLabels: ["open", "edit", "check", "ship"],
  },
  reference: {
    eyebrow: "reference example",
    title: "Doc metadata shape",
    intro: "A lookup page gives exact fields without teaching or persuading.",
    rows: [
      { label: "required keys", text: "title, audience, status, and last-verified." },
      { label: "status values", text: "draft, active, deprecated, or archived." },
      { label: "mode values", text: "tutorial, how-to, reference, or explanation." },
      {
        label: "generated refs",
        text: "Routes, schema, modules, and ADRs link to generated pages.",
      },
    ],
    diagramLabels: ["field", "type", "value", "lookup"],
  },
  explanation: {
    eyebrow: "explanation example",
    title: "Session recap pipeline",
    intro: "A teammate needs a reusable model of how activity becomes a recap.",
    rows: [
      { label: "claim", text: "Activity events become a recap through explicit stages." },
      { label: "vocabulary", text: "Event, stage, recap, and reader model are named up front." },
      { label: "thread", text: "The same session recap pipeline appears in every section." },
      { label: "tradeoff", text: "Rejected alternatives explain why recap stages are explicit." },
    ],
    diagramLabels: ["events", "select", "summarize", "recap"],
  },
};

function getColors(theme: "dark" | "light"): Colors {
  if (theme === "dark") {
    return {
      bg: "#0a0a0a",
      fg: "rgba(245,241,232,0.82)",
      muted: "rgba(245,241,232,0.48)",
      faint: "rgba(245,241,232,0.18)",
      line: "rgba(245,241,232,0.14)",
      card: "rgba(245,241,232,0.08)",
      cardAlt: "rgba(245,241,232,0.12)",
      accent: "#d4ff00",
      accentSoft: "rgba(212,255,0,0.17)",
      reject: "rgba(245,241,232,0.24)",
      shadow: "rgba(0,0,0,0.32)",
    };
  }

  return {
    bg: "#f5f1e8",
    fg: "rgba(10,10,10,0.8)",
    muted: "rgba(10,10,10,0.52)",
    faint: "rgba(10,10,10,0.18)",
    line: "rgba(10,10,10,0.14)",
    card: "rgba(255,255,255,0.5)",
    cardAlt: "rgba(255,255,255,0.72)",
    accent: "#2a8a0e",
    accentSoft: "rgba(42,138,14,0.16)",
    reject: "rgba(10,10,10,0.22)",
    shadow: "rgba(58,45,24,0.14)",
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

interface CompilerMetrics {
  coherence: number;
  vocabulary: number;
  example: number;
  load: number;
}

/** Derive the live "document compiler" readout from the current mode + visual. */
function computeMetrics(mode: Mode, functionalVisual: boolean): CompilerMetrics {
  const activePrinciples = PRINCIPLES.filter((principle) => principle.scores[mode] >= 0.62);
  const activeMaterial = MODE_MATERIAL.filter((principle) => principle.scores[mode] >= 0.62);
  const visualBonus = functionalVisual ? 0.1 : -0.1;
  const coherence = activePrinciples.length
    ? activePrinciples.reduce((sum, principle) => sum + principle.scores[mode], 0) /
      activePrinciples.length
    : 0;
  const vocabulary = activePrinciples.some((principle) => principle.id === "vocabulary")
    ? 0.94
    : 0.36;
  const example = activePrinciples.some((principle) => principle.id === "recap-example")
    ? 0.9
    : 0.28;
  const load = clamp(
    0.5 + visualBonus - MODE_MATERIAL.length * 0.015 + activeMaterial.length * 0.02,
    0.08,
    0.96,
  );
  return { coherence, vocabulary, example, load };
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
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
  return lines;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  colors: Colors,
) {
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.muted;
  ctx.fillText(text.toUpperCase(), x, y);
}

function drawPrincipleCard(
  ctx: CanvasRenderingContext2D,
  principle: Principle,
  x: number,
  y: number,
  width: number,
  height: number,
  active: boolean,
  hover: boolean,
  colors: Colors,
) {
  ctx.save();
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = active ? 12 : 4;
  ctx.shadowOffsetY = active ? 6 : 2;

  drawRoundRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = active ? colors.cardAlt : colors.card;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = hover ? colors.accent : active ? colors.accentSoft : colors.line;
  ctx.lineWidth = hover ? 1.8 : 1;
  ctx.stroke();

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = active ? colors.fg : colors.muted;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(principle.title.toUpperCase(), x + 11, y + 10);

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = active ? colors.muted : colors.reject;
  const lines = wrapText(ctx, principle.body, width - 22).slice(0, 2);
  lines.forEach((line, index) => ctx.fillText(line, x + 11, y + 27 + index * 12));

  ctx.restore();
}

function drawModeMaterial(
  ctx: CanvasRenderingContext2D,
  principle: Principle,
  x: number,
  y: number,
  width: number,
  mode: Mode,
  colors: Colors,
) {
  const score = principle.scores[mode];
  const accepted = score >= 0.62;

  drawRoundRect(ctx, x, y, width, 38, 7);
  ctx.fillStyle = accepted ? colors.accentSoft : colors.card;
  ctx.fill();
  ctx.strokeStyle = accepted ? colors.accentSoft : colors.line;
  ctx.stroke();

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = accepted ? colors.fg : colors.reject;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(principle.title.toUpperCase(), x + 10, y + 9);

  ctx.fillStyle = accepted ? colors.muted : colors.reject;
  ctx.fillText(accepted ? "use in this mode" : "move elsewhere", x + 10, y + 23);
}

function drawModeGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  state: SimulationState,
  colors: Colors,
) {
  drawRoundRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = colors.card;
  ctx.fill();
  ctx.strokeStyle = colors.line;
  ctx.stroke();

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.accent;
  ctx.textAlign = "center";
  ctx.fillText("DIÁTAXIS", x + width / 2, y + 20);

  ctx.font = "18px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.fg;
  ctx.fillText(state.mode.toUpperCase(), x + width / 2, y + height / 2 + 4);

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.muted;
  ctx.fillText("ONE DOCUMENT JOB", x + width / 2, y + height - 18);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colors: Colors,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 5;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.55) * size, y2 - Math.sin(angle - 0.55) * size);
  ctx.lineTo(x2 - Math.cos(angle + 0.55) * size, y2 - Math.sin(angle + 0.55) * size);
  ctx.closePath();
  ctx.fillStyle = colors.accent;
  ctx.fill();
}

function drawTinyTextLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widths: number[],
  colors: Colors,
  activeIndex = -1,
) {
  widths.forEach((lineWidth, index) => {
    drawRoundRect(ctx, x, y + index * 7, lineWidth, 3, 2);
    ctx.fillStyle = index === activeIndex ? colors.accent : colors.faint;
    ctx.fill();
  });
}

function drawFunctionalDiagram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  mode: Mode,
  labels: [string, string, string, string],
  colors: Colors,
) {
  if (mode === "tutorial") {
    const leftW = width * 0.35;
    const rightW = width * 0.38;
    drawRoundRect(ctx, x, y, leftW, 48, 6);
    ctx.fillStyle = colors.card;
    ctx.fill();
    ctx.strokeStyle = colors.line;
    ctx.stroke();
    drawTinyTextLines(
      ctx,
      x + 11,
      y + 12,
      [leftW - 42, leftW - 20, leftW - 55, leftW - 34],
      colors,
    );

    drawArrow(ctx, x + leftW + 12, y + 24, x + leftW + 48, y + 24, colors);

    drawRoundRect(ctx, x + leftW + 60, y, rightW, 48, 6);
    ctx.fillStyle = colors.accentSoft;
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.stroke();
    drawTinyTextLines(
      ctx,
      x + leftW + 71,
      y + 12,
      [rightW - 24, rightW - 58, rightW - 36, rightW - 76],
      colors,
      0,
    );

    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillStyle = colors.muted;
    ctx.textAlign = "left";
    ctx.fillText("BEFORE", x, y + 62);
    ctx.fillText("CLAIM FIRST", x + leftW + 60, y + 62);
    return;
  }

  if (mode === "how-to") {
    const stepW = (width - 36) / 4;
    labels.forEach((label, index) => {
      const sx = x + index * (stepW + 12);
      drawRoundRect(ctx, sx, y + 4, stepW, 42, 6);
      ctx.fillStyle = index === labels.length - 1 ? colors.accentSoft : colors.card;
      ctx.fill();
      ctx.strokeStyle = index === labels.length - 1 ? colors.accent : colors.line;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx + 13, y + 18, 5, 0, Math.PI * 2);
      ctx.strokeStyle = colors.accent;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 10, y + 18);
      ctx.lineTo(sx + 12, y + 21);
      ctx.lineTo(sx + 17, y + 14);
      ctx.stroke();

      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.fillText(label.toUpperCase(), sx + stepW / 2, y + 34);

      if (index < labels.length - 1) {
        drawArrow(ctx, sx + stepW + 3, y + 25, sx + stepW + 10, y + 25, colors);
      }
    });
    return;
  }

  if (mode === "reference") {
    const tableH = 58;
    drawRoundRect(ctx, x, y, width, tableH, 6);
    ctx.fillStyle = colors.card;
    ctx.fill();
    ctx.strokeStyle = colors.line;
    ctx.stroke();

    const cols = [0, width * 0.34, width * 0.62, width];
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + width, y + 18);
    cols.slice(1, -1).forEach((col) => {
      ctx.moveTo(x + col, y);
      ctx.lineTo(x + col, y + tableH);
    });
    ctx.strokeStyle = colors.line;
    ctx.stroke();

    ["field", "type", "value"].forEach((header, index) => {
      const hx = x + cols[index] + 9;
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = index === 2 ? colors.accent : colors.muted;
      ctx.textAlign = "left";
      ctx.fillText(header.toUpperCase(), hx, y + 12);
    });

    [
      ["mode", "enum", "explain"],
      ["verified", "date", "2026-05-27"],
      ["status", "enum", "active"],
    ].forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = colIndex === 2 ? colors.fg : colors.muted;
        ctx.fillText(cell.toUpperCase(), x + cols[colIndex] + 9, y + 31 + rowIndex * 9);
      });
    });
    return;
  }

  const eventX = x + 10;
  const eventY = y + 8;
  for (let i = 0; i < 10; i++) {
    const dx = (i % 5) * 12;
    const dy = Math.floor(i / 5) * 12;
    ctx.beginPath();
    ctx.arc(eventX + dx, eventY + dy, 3, 0, Math.PI * 2);
    ctx.fillStyle = i < 6 ? colors.accentSoft : colors.faint;
    ctx.fill();
  }

  drawArrow(ctx, x + 76, y + 19, x + 112, y + 19, colors);

  ctx.beginPath();
  ctx.moveTo(x + 122, y + 4);
  ctx.lineTo(x + 166, y + 4);
  ctx.lineTo(x + 150, y + 32);
  ctx.lineTo(x + 150, y + 47);
  ctx.lineTo(x + 138, y + 47);
  ctx.lineTo(x + 138, y + 32);
  ctx.closePath();
  ctx.fillStyle = colors.card;
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.stroke();

  drawArrow(ctx, x + 176, y + 25, x + 213, y + 25, colors);

  drawRoundRect(ctx, x + 225, y + 2, width - 225, 50, 6);
  ctx.fillStyle = colors.accentSoft;
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.stroke();
  drawTinyTextLines(ctx, x + 238, y + 13, [width - 262, width - 290, width - 250], colors, 0);

  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.muted;
  ctx.textAlign = "left";
  labels.forEach((label, index) => {
    const positions = [x + 3, x + 120, x + 225, x + width - 38];
    ctx.fillText(label.toUpperCase(), positions[index], y + 66);
  });
}

function drawDecorativeDiagram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  mode: Mode,
  colors: Colors,
) {
  const height = 62;
  const midY = y + height / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + width, y + 2);
  ctx.moveTo(x, y + height - 2);
  ctx.lineTo(x + width, y + height - 2);
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (mode === "tutorial") {
    ctx.font = "34px 'JetBrains Mono', monospace";
    ctx.fillStyle = colors.accentSoft;
    ctx.textAlign = "left";
    ctx.fillText("01", x + 4, y + 43);
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = colors.muted;
    ctx.fillText("START HERE", x + 76, y + 18);
    drawTinyTextLines(ctx, x + 76, y + 29, [width - 118, width - 172, width - 138], colors, 0);
    ctx.beginPath();
    ctx.moveTo(x + 57, y + 9);
    ctx.lineTo(x + 57, y + height - 9);
    ctx.strokeStyle = colors.accentSoft;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (mode === "how-to") {
    for (let i = 0; i < 4; i++) {
      const sx = x + 24 + i * ((width - 48) / 3);
      ctx.beginPath();
      ctx.arc(sx, midY - 5, 7, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? colors.accentSoft : colors.faint;
      ctx.fill();
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1).padStart(2, "0"), sx, midY + 16);
      drawRoundRect(ctx, sx - 16, midY + 23, 32, 3, 2);
      ctx.fillStyle = colors.faint;
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (mode === "reference") {
    ctx.font = "28px 'JetBrains Mono', monospace";
    ctx.fillStyle = colors.accentSoft;
    ctx.textAlign = "left";
    ctx.fillText("META", x + 2, y + 42);
    const colX = x + 128;
    for (let col = 0; col < 4; col++) {
      const cx = colX + col * 44;
      ctx.beginPath();
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx, y + height - 12);
      ctx.strokeStyle = colors.faint;
      ctx.stroke();
      for (let row = 0; row < 4; row++) {
        drawRoundRect(ctx, cx + 10, y + 16 + row * 8, 22 - row * 2, 3, 2);
        ctx.fillStyle = row === col % 4 ? colors.accentSoft : colors.faint;
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  const centerX = x + width / 2;
  ctx.font = "26px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.accentSoft;
  ctx.textAlign = "center";
  ctx.fillText("RECAP", centerX, y + 39);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(centerX, midY, 27 + i * 8, -0.25 + i * 0.35, Math.PI * 1.08 + i * 0.25);
    ctx.strokeStyle = i === 1 ? colors.accentSoft : colors.faint;
    ctx.lineWidth = i === 1 ? 1.5 : 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + 18, midY);
  ctx.lineTo(centerX - 65, midY);
  ctx.moveTo(centerX + 65, midY);
  ctx.lineTo(x + width - 18, midY);
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawExamplePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  state: SimulationState,
  colors: Colors,
) {
  const example = MODE_EXAMPLES[state.mode];
  const rowTop = y + 108;
  const rowGap = 34;

  drawRoundRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = colors.card;
  ctx.fill();
  ctx.strokeStyle = colors.line;
  ctx.stroke();

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(example.eyebrow.toUpperCase(), x + 18, y + 16);

  ctx.font = "17px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.fg;
  ctx.fillText(example.title, x + 18, y + 39);

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.muted;
  wrapText(ctx, example.intro, width - 36)
    .slice(0, 2)
    .forEach((line, index) => ctx.fillText(line, x + 18, y + 67 + index * 13));

  example.rows.forEach((row, index) => {
    const rowY = rowTop + index * rowGap;
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = colors.fg;
    ctx.fillText(row.label.toUpperCase(), x + 18, rowY);
    ctx.fillStyle = colors.muted;
    wrapText(ctx, row.text, width - 36)
      .slice(0, 1)
      .forEach((line) => ctx.fillText(line, x + 18, rowY + 15));
  });

  const diagramY = y + height - 72;
  drawLabel(
    ctx,
    state.functionalVisual ? "functional visual" : "decorative visual",
    x + 18,
    diagramY - 14,
    colors,
  );
  if (state.functionalVisual) {
    drawFunctionalDiagram(
      ctx,
      x + 18,
      diagramY,
      width - 36,
      state.mode,
      example.diagramLabels,
      colors,
    );
  } else {
    drawDecorativeDiagram(ctx, x + 18, diagramY, width - 36, state.mode, colors);
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: SimulationState,
) {
  const theme = getTheme();
  const colors = getColors(theme);
  const activePrinciples = PRINCIPLES.filter((principle) => principle.scores[state.mode] >= 0.62);

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width * 0.58,
    height * 0.32,
    0,
    width * 0.58,
    height * 0.32,
    width * 0.68,
  );
  gradient.addColorStop(0, colors.accentSoft);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const margin = clamp(width * 0.045, 20, 58);
  const top = clamp(height * 0.18, 124, 146);
  const leftW = clamp(width * 0.29, 280, 360);
  const rightW = clamp(width * 0.36, 360, 460);
  const gateW = clamp(width * 0.16, 160, 212);
  const cardH = 48;
  const gap = 12;
  const leftX = margin;
  const gateX = width * 0.5 - gateW / 2;
  const rightX = width - margin - rightW;
  const gateY = top + 88;
  const gateH = clamp(height * 0.18, 120, 154);

  ctx.font = "18px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.fg;
  ctx.fillText("Documentation principles", margin, top - 64);

  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = colors.muted;
  ctx.fillText("Concepts first. Then one example shows how they behave.", margin, top - 39);

  drawLabel(ctx, "principles", leftX, top - 16, colors);
  drawModeGate(ctx, gateX, gateY, gateW, gateH, state, colors);

  const activeIds = new Set(activePrinciples.map((principle) => principle.id));
  const hoverId = PRINCIPLES.find((principle, index) => {
    const y = top + index * (cardH + gap);
    return (
      state.pointer.active &&
      state.pointer.x >= leftX &&
      state.pointer.x <= leftX + leftW &&
      state.pointer.y >= y &&
      state.pointer.y <= y + cardH
    );
  })?.id;

  PRINCIPLES.forEach((principle, index) => {
    const y = top + index * (cardH + gap);
    const isActive = activeIds.has(principle.id);

    if (isActive) {
      ctx.beginPath();
      ctx.moveTo(leftX + leftW + 4, y + cardH / 2);
      ctx.bezierCurveTo(
        gateX - 36,
        y + cardH / 2,
        gateX - 24,
        gateY + gateH / 2,
        gateX,
        gateY + gateH / 2,
      );
      ctx.strokeStyle = colors.accentSoft;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    drawPrincipleCard(
      ctx,
      principle,
      leftX,
      y,
      leftW,
      cardH,
      isActive,
      hoverId === principle.id,
      colors,
    );
  });

  drawExamplePanel(ctx, rightX, top, rightW, 358, state, colors);

  const materialX = gateX;
  const materialY = gateY + gateH + 26;
  drawLabel(ctx, "mode-specific material", materialX, materialY - 12, colors);
  MODE_MATERIAL.forEach((principle, index) => {
    drawModeMaterial(ctx, principle, materialX, materialY + index * 44, gateW, state.mode, colors);
  });
}

export function DocumentationPrinciples({ info }: { info?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimulationState>({
    mode: "explanation",
    functionalVisual: true,
    time: 0,
    pointer: { x: 0, y: 0, active: false },
  });
  const [mode, setMode] = useState<Mode>("explanation");
  const [functionalVisual, setFunctionalVisual] = useState(true);
  const currentExample = MODE_EXAMPLES[mode];
  const metrics = computeMetrics(mode, functionalVisual);

  const setModeState = useCallback((next: Mode) => {
    simRef.current.mode = next;
    setMode(next);
  }, []);

  const toggleVisual = useCallback(() => {
    simRef.current.functionalVisual = !simRef.current.functionalVisual;
    setFunctionalVisual(simRef.current.functionalVisual);
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
      if (event.key === "1") setModeState("tutorial");
      if (event.key === "2") setModeState("how-to");
      if (event.key === "3") setModeState("reference");
      if (event.key === "4") setModeState("explanation");
      if (event.code === "KeyV") toggleVisual();
    }

    window.addEventListener("keydown", onKeyDown);

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sim.time += reduced ? dt * 0.25 : dt;

      const dpr = window.devicePixelRatio || 1;
      drawScene(ctx, canvasElement.width / dpr, canvasElement.height / dpr, sim);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setModeState, toggleVisual]);

  return (
    <>
      <section className="sr-only" aria-labelledby="documentation-principles-title">
        <h1 id="documentation-principles-title">Documentation Principles</h1>
        <p>
          This lab compares Diátaxis documentation modes and shows how a visual can either explain a
          concrete example or decorate it without adding structure.
        </p>
        <p aria-live="polite" aria-atomic="true">
          Current mode: {MODE_LABELS[mode]}. Current visual style:{" "}
          {functionalVisual ? "functional" : "decorative"}. Example: {currentExample.title}.{" "}
          {currentExample.intro}
        </p>
        <h2>Current Example Details</h2>
        <ul>
          {currentExample.rows.map((row) => (
            <li key={row.label}>
              {row.label}: {row.text}
            </li>
          ))}
        </ul>
        <h2>Documentation Principles</h2>
        <ul>
          {PRINCIPLES.map((principle) => (
            <li key={principle.id}>
              {principle.title}: {principle.body}
            </li>
          ))}
        </ul>
      </section>
      <canvas
        ref={canvasRef}
        className={LAB_CANVAS_CLASS}
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
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

      <LabReadout corner="right">
        <Gauge label="coherence" value={metrics.coherence.toFixed(2)} primary />
        <Gauge label="vocabulary" value={metrics.vocabulary.toFixed(2)} />
        <Gauge label="example" value={metrics.example.toFixed(2)} />
        <Gauge label="reader load" value={metrics.load.toFixed(2)} />
      </LabReadout>

      <LabChrome
        identity={{
          name: "documentation principles",
          scent: "diátaxis compiler · pick a mode, toggle the visual",
        }}
        info={info}
      >
        <ControlGroup label="document">
          <Segmented
            label="mode"
            value={mode}
            onChange={setModeState}
            options={MODES.map((entry) => ({ value: entry.id, label: entry.label }))}
          />
        </ControlGroup>
        <ControlGroup label="visual">
          <Segmented
            label="diagram"
            value={functionalVisual ? "functional" : "decorative"}
            onChange={(next) => {
              const wantFunctional = next === "functional";
              if (wantFunctional !== functionalVisual) toggleVisual();
            }}
            options={[
              { value: "functional", label: "functional" },
              { value: "decorative", label: "decorative" },
            ]}
          />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
