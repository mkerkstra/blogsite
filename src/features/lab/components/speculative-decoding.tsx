"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   Speculative Decoding — Canvas2D

   Visualizes the speculative decoding inference
   optimization: a fast draft model proposes K
   tokens, a large verifier accepts or rejects
   them in a single parallel pass.

   Leviathan et al. "Fast Inference from
   Transformers via Speculative Decoding" (2023)
   https://arxiv.org/abs/2302.01318
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   Token vocabulary
   ──────────────────────────────────────────── */

const VOCAB = [
  "\u2581The",
  "\u2581model",
  "\u2581gen",
  "erat",
  "es",
  "\u2581text",
  "\u2581by",
  "\u2581predict",
  "ing",
  "\u2581the",
  "\u2581next",
  "\u2581token",
  "\u2581in",
  "\u2581a",
  "\u2581sequence",
  "\u2581of",
  "\u2581words",
  "\u2581and",
  "\u2581sub",
  "word",
  "\u2581units",
  "\u2581that",
  "\u2581represent",
  "\u2581mean",
  "ing",
  "ful",
  "\u2581patterns",
  ".",
  "\u2581Each",
  "\u2581step",
  "\u2581builds",
  "\u2581on",
  "\u2581prev",
  "ious",
  "\u2581context",
  "\u2581to",
  "\u2581produce",
  "\u2581coher",
  "ent",
  "\u2581output",
  ",",
  "\u2581one",
  "\u2581piece",
  "\u2581at",
  "\u2581a",
  "\u2581time",
];

/* ────────────────────────────────────────────
   Theme palettes
   ──────────────────────────────────────────── */

const BG = { dark: "#0a0a0a", light: "#f5f1e8" } as const;

interface Palette {
  pending: string;
  accepted: string;
  rejected: string;
  correction: string;
  trackBg: string;
  text: string;
  textDim: string;
  textBright: string;
  draftBar: string;
  verifyBar: string;
  probBarDraft: string;
  probBarTarget: string;
  outline: string;
}

const DARK: Palette = {
  pending: "rgba(224,226,220,0.2)",
  accepted: "rgba(212,255,0,0.5)",
  rejected: "rgba(255,80,80,0.6)",
  correction: "rgba(0,212,255,0.5)",
  trackBg: "rgba(224,226,220,0.03)",
  text: "rgba(224,226,220,0.7)",
  textDim: "rgba(224,226,220,0.3)",
  textBright: "rgba(224,226,220,0.9)",
  draftBar: "rgba(212,255,0,0.25)",
  verifyBar: "rgba(0,212,255,0.20)",
  probBarDraft: "rgba(212,255,0,0.6)",
  probBarTarget: "rgba(0,212,255,0.6)",
  outline: "rgba(224,226,220,0.08)",
};

const LIGHT: Palette = {
  pending: "rgba(10,10,10,0.15)",
  accepted: "rgba(42,138,14,0.4)",
  rejected: "rgba(200,50,50,0.5)",
  correction: "rgba(0,120,180,0.5)",
  trackBg: "rgba(10,10,10,0.03)",
  text: "rgba(10,10,10,0.6)",
  textDim: "rgba(10,10,10,0.25)",
  textBright: "rgba(10,10,10,0.85)",
  draftBar: "rgba(42,138,14,0.15)",
  verifyBar: "rgba(0,120,180,0.15)",
  probBarDraft: "rgba(42,138,14,0.6)",
  probBarTarget: "rgba(0,120,180,0.6)",
  outline: "rgba(10,10,10,0.08)",
};

/* ────────────────────────────────────────────
   State machine
   ──────────────────────────────────────────── */

const enum Phase {
  DRAFTING = 0,
  PAUSE_BEFORE_VERIFY = 1,
  VERIFYING = 2,
  RESOLVING = 3,
  MIGRATING = 4,
}

/* ────────────────────────────────────────────
   Token types
   ──────────────────────────────────────────── */

interface DraftToken {
  text: string;
  x: number;
  targetX: number;
  opacity: number;
  status: "pending" | "accepted" | "rejected" | "discarded";
  draftProb: number;
  targetProb: number;
  showProb: number; // 0..1 for probability overlay animation
  shatterT: number; // 0..1 for discard animation
  checkT: number; // 0..1 for accept/reject icon animation
}

interface OutputToken {
  text: string;
  color: "accepted" | "correction";
  opacity: number;
  scale: number;
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

function easeInBack(t: number): number {
  const c = 1.70158;
  return (c + 1) * t * t * t - c * t * t;
}

function randomToken(): string {
  return VOCAB[Math.floor(Math.random() * VOCAB.length)] ?? "▁the";
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function SpeculativeDecoding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React state for control UI
  const [quality, setQuality] = useState(72);
  const [depth, setDepth] = useState(5);
  const [paused, setPaused] = useState(false);

  // Mutable simulation state
  const simRef = useRef<{
    phase: Phase;
    phaseT: number; // time elapsed in current phase (ms)
    quality: number; // acceptance probability 0.4..0.95
    depth: number; // K tokens per batch

    draftTokens: DraftToken[];
    draftIndex: number; // how many draft tokens have been "emitted" so far
    verifyIndex: number; // how far the verifier sweep has progressed
    firstRejectIdx: number; // index of first rejection (-1 if none)
    verifyDone: boolean;

    outputTokens: OutputToken[];
    totalGenerated: number;
    totalAccepted: number;
    cycleCount: number;
    tokPerSecSpec: number;
    tokPerSecNaive: number;

    paused: boolean;
    lastFrameTime: number;

    // Layout cache
    dpr: number;
  }>({
    phase: Phase.DRAFTING,
    phaseT: 0,
    quality: 0.72,
    depth: 5,
    draftTokens: [],
    draftIndex: 0,
    verifyIndex: -1,
    firstRejectIdx: -1,
    verifyDone: false,
    outputTokens: [],
    totalGenerated: 0,
    totalAccepted: 0,
    cycleCount: 0,
    tokPerSecSpec: 0,
    tokPerSecNaive: 0,
    paused: false,
    lastFrameTime: 0,
    dpr: 1,
  });

  // ── Start a new draft cycle ──

  const startDraftCycle = useCallback(() => {
    const s = simRef.current;
    s.phase = Phase.DRAFTING;
    s.phaseT = 0;
    s.draftIndex = 0;
    s.verifyIndex = -1;
    s.firstRejectIdx = -1;
    s.verifyDone = false;

    const tokens: DraftToken[] = [];
    for (let i = 0; i < s.depth; i++) {
      const accepted = Math.random() < s.quality;
      const draftProb = 0.3 + Math.random() * 0.5;
      const targetProb = accepted
        ? draftProb + Math.random() * (1 - draftProb) * 0.5
        : Math.max(0.05, draftProb - 0.2 - Math.random() * 0.4);

      tokens.push({
        text: randomToken(),
        x: 0,
        targetX: 0,
        opacity: 0,
        status: "pending",
        draftProb,
        targetProb,
        showProb: 0,
        shatterT: 0,
        checkT: 0,
      });
    }
    s.draftTokens = tokens;
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
    s.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * s.dpr);
    canvas.height = Math.round(rect.height * s.dpr);

    // ── ResizeObserver ──
    const observer = new ResizeObserver(([entry]) => {
      s.dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(entry.contentRect.width * s.dpr);
      canvas.height = Math.round(entry.contentRect.height * s.dpr);
    });
    observer.observe(canvas);

    // ── Init first cycle ──
    startDraftCycle();
    s.lastFrameTime = performance.now();

    // ── Timing constants (ms) ──
    const DRAFT_EMIT_INTERVAL = reduced ? 200 : 100;
    const PAUSE_DURATION = reduced ? 400 : 250;
    const VERIFY_SWEEP_DURATION = reduced ? 600 : 400;
    const RESOLVE_DURATION = reduced ? 800 : 600;
    const MIGRATE_DURATION = reduced ? 600 : 400;

    // ── Layout helpers ──

    function getLayout(w: number, h: number) {
      const dpr = s.dpr;
      const navH = 52 * dpr;
      const pad = navH + 16 * dpr;
      const tokenW = 72 * dpr;
      const tokenH = 28 * dpr;
      const tokenGap = 8 * dpr;
      const fontSize = 11 * dpr;
      const labelFontSize = 9 * dpr;
      const smallFontSize = 8 * dpr;
      const tinyFontSize = 7 * dpr;

      // Output row at top
      const outputY = pad + 30 * dpr;
      const outputTokenW = 60 * dpr;
      const outputTokenH = 22 * dpr;
      const outputGap = 5 * dpr;

      // Tracks in middle
      const trackTop = h * 0.3;
      const trackH = 50 * dpr;
      const trackGap = 24 * dpr;
      const draftTrackY = trackTop;
      const verifyTrackY = trackTop + trackH + trackGap;

      // Draft model bar
      const barW = 100 * dpr;
      const barH = 30 * dpr;
      const barX = pad;

      // Token start position (where they slide in from)
      const tokenStartX = barX + barW + 20 * dpr;

      // Stats area at bottom
      const statsY = h - 80 * dpr;

      return {
        pad,
        tokenW,
        tokenH,
        tokenGap,
        fontSize,
        labelFontSize,
        smallFontSize,
        tinyFontSize,
        outputY,
        outputTokenW,
        outputTokenH,
        outputGap,
        trackTop,
        trackH,
        trackGap,
        draftTrackY,
        verifyTrackY,
        barW,
        barH,
        barX,
        tokenStartX,
        statsY,
        dpr,
      };
    }

    // ── Draw rounded rect ──

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // ── Draw checkmark ──

    function drawCheck(cx: number, cy: number, size: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = pal().accepted;
      ctx.lineWidth = 2 * s.dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.4, cy);
      ctx.lineTo(cx - size * 0.1, cy + size * 0.35);
      ctx.lineTo(cx + size * 0.4, cy - size * 0.3);
      ctx.stroke();
      ctx.restore();
    }

    // ── Draw X mark ──

    function drawX(cx: number, cy: number, size: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = pal().rejected;
      ctx.lineWidth = 2 * s.dpr;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.3, cy - size * 0.3);
      ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
      ctx.moveTo(cx + size * 0.3, cy - size * 0.3);
      ctx.lineTo(cx - size * 0.3, cy + size * 0.3);
      ctx.stroke();
      ctx.restore();
    }

    // ── Palette getter ──

    function pal(): Palette {
      return getTheme() === "dark" ? DARK : LIGHT;
    }

    // ── Main frame ──

    let raf = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);

      const dt = Math.min(now - s.lastFrameTime, 50); // clamp to 50ms
      s.lastFrameTime = now;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const p = pal();
      const theme = getTheme();
      const L = getLayout(w, h);

      // ── Update state machine ──
      if (!s.paused) {
        s.phaseT += dt;

        switch (s.phase) {
          case Phase.DRAFTING: {
            const emitted = Math.min(Math.floor(s.phaseT / DRAFT_EMIT_INTERVAL) + 1, s.depth);
            // Assign positions and opacity to newly emitted tokens
            for (let i = s.draftIndex; i < emitted; i++) {
              const tok = s.draftTokens[i];
              if (!tok) continue;
              tok.targetX = L.tokenStartX + i * (L.tokenW + L.tokenGap);
              tok.x = L.barX + L.barW; // start from bar edge
            }
            s.draftIndex = emitted;

            // Animate tokens sliding to target
            for (let i = 0; i < s.draftIndex; i++) {
              const tok = s.draftTokens[i];
              if (!tok) continue;
              tok.x = lerp(tok.x, tok.targetX, 0.15);
              tok.opacity = Math.min(tok.opacity + 0.08, 1);
            }

            // When all emitted, move to pause
            if (emitted >= s.depth && s.phaseT > s.depth * DRAFT_EMIT_INTERVAL + 100) {
              s.phase = Phase.PAUSE_BEFORE_VERIFY;
              s.phaseT = 0;
            }
            break;
          }

          case Phase.PAUSE_BEFORE_VERIFY: {
            // Tokens continue settling
            for (let i = 0; i < s.draftTokens.length; i++) {
              const tok = s.draftTokens[i];
              if (!tok) continue;
              tok.x = lerp(tok.x, tok.targetX, 0.15);
            }
            if (s.phaseT >= PAUSE_DURATION) {
              s.phase = Phase.VERIFYING;
              s.phaseT = 0;
              s.verifyIndex = -1;
            }
            break;
          }

          case Phase.VERIFYING: {
            // Sweep reveal: progress from 0 to K
            const progress = Math.min(s.phaseT / VERIFY_SWEEP_DURATION, 1);
            const revealed = Math.floor(progress * s.depth);

            for (let i = s.verifyIndex + 1; i <= revealed && i < s.depth; i++) {
              const tok = s.draftTokens[i];
              if (!tok) continue;
              // Decide accept/reject based on probability comparison
              if (tok.targetProb >= tok.draftProb * 0.85) {
                tok.status = "accepted";
              } else {
                tok.status = "rejected";
                if (s.firstRejectIdx === -1) {
                  s.firstRejectIdx = i;
                  // Mark all subsequent as discarded
                  for (let j = i + 1; j < s.depth; j++) {
                    const dj = s.draftTokens[j];
                    if (dj) dj.status = "discarded";
                  }
                }
              }
              s.verifyIndex = i;
            }

            // Animate probability overlays
            for (let i = 0; i < s.depth; i++) {
              const tok = s.draftTokens[i];
              if (!tok) continue;
              if (i <= s.verifyIndex) {
                tok.showProb = Math.min(tok.showProb + 0.06, 1);
                tok.checkT = Math.min(tok.checkT + 0.06, 1);
              }
              if (tok.status === "discarded") {
                tok.shatterT = Math.min(tok.shatterT + 0.04, 1);
              }
            }

            if (progress >= 1 && s.phaseT >= VERIFY_SWEEP_DURATION + 100) {
              s.phase = Phase.RESOLVING;
              s.phaseT = 0;
            }
            break;
          }

          case Phase.RESOLVING: {
            // Animate shatter for discarded tokens, glow for accepted
            const progress = Math.min(s.phaseT / RESOLVE_DURATION, 1);

            for (let i = 0; i < s.depth; i++) {
              const tok = s.draftTokens[i];
              if (!tok) continue;
              if (tok.status === "discarded" || tok.status === "rejected") {
                tok.shatterT = Math.min(tok.shatterT + 0.05, 1);
                tok.opacity = Math.max(0, 1 - easeInBack(tok.shatterT));
              }
              tok.checkT = Math.min(tok.checkT + 0.04, 1);
            }

            if (progress >= 1) {
              // Collect results: accepted tokens + one correction
              let accepted = 0;
              for (let i = 0; i < s.depth; i++) {
                const tok = s.draftTokens[i];
                if (!tok) continue;
                if (tok.status === "accepted") {
                  s.outputTokens.push({
                    text: tok.text,
                    color: "accepted",
                    opacity: 0,
                    scale: 0,
                  });
                  accepted++;
                } else {
                  break; // stop at first non-accepted
                }
              }
              // Verifier emits corrected token
              s.outputTokens.push({
                text: randomToken(),
                color: "correction",
                opacity: 0,
                scale: 0,
              });

              const generated = accepted + 1; // accepted + 1 correction
              s.totalGenerated += generated;
              s.totalAccepted += accepted;
              s.cycleCount++;

              // Update throughput estimates
              const avgAccepted = s.cycleCount > 0 ? s.totalAccepted / s.cycleCount : 0;
              // Speculative: (avgAccepted + 1) tokens per "cycle"
              // Naive: 1 token per cycle
              s.tokPerSecSpec = avgAccepted + 1;
              s.tokPerSecNaive = 1;

              // Trim output to prevent unbounded growth
              const maxVisible = 50;
              if (s.outputTokens.length > maxVisible) {
                s.outputTokens = s.outputTokens.slice(s.outputTokens.length - maxVisible);
              }

              s.phase = Phase.MIGRATING;
              s.phaseT = 0;
            }
            break;
          }

          case Phase.MIGRATING: {
            // Animate new output tokens appearing
            for (const tok of s.outputTokens) {
              tok.opacity = Math.min(tok.opacity + 0.06, 1);
              tok.scale = Math.min(tok.scale + 0.06, 1);
            }

            if (s.phaseT >= MIGRATE_DURATION) {
              startDraftCycle();
            }
            break;
          }
        }
      }

      // ─── RENDER ───

      // Background
      ctx.fillStyle = BG[theme];
      ctx.fillRect(0, 0, w, h);

      // ── Section labels ──
      ctx.save();
      ctx.font = `${L.labelFontSize}px monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = p.textDim;

      const outputLabelX = L.pad;
      const outputLabelY = L.outputY - 20 * L.dpr;
      ctx.fillText("OUTPUT SEQUENCE", outputLabelX, outputLabelY);

      const draftLabelY = L.draftTrackY - 18 * L.dpr;
      ctx.fillText("DRAFT MODEL (FAST)", L.pad, draftLabelY);

      const verifyLabelY = L.verifyTrackY - 18 * L.dpr;
      ctx.fillText("VERIFIER (PARALLEL)", L.pad, verifyLabelY);
      ctx.restore();

      // ── Output tokens row ──
      {
        const maxVisible = Math.floor((w - L.pad * 2) / (L.outputTokenW + L.outputGap));
        const visibleTokens = s.outputTokens.slice(Math.max(0, s.outputTokens.length - maxVisible));
        const startX = L.pad;

        for (let i = 0; i < visibleTokens.length; i++) {
          const tok = visibleTokens[i];
          if (!tok) continue;
          const tx = startX + i * (L.outputTokenW + L.outputGap);
          const ty = L.outputY;
          const ease = easeOutCubic(tok.scale);

          ctx.save();
          ctx.globalAlpha = tok.opacity * 0.9;

          // Scale from center
          const cx = tx + L.outputTokenW / 2;
          const cy = ty + L.outputTokenH / 2;
          ctx.translate(cx, cy);
          ctx.scale(ease, ease);
          ctx.translate(-cx, -cy);

          const color = tok.color === "accepted" ? p.accepted : p.correction;
          roundRect(tx, ty, L.outputTokenW, L.outputTokenH, 4 * L.dpr);
          ctx.fillStyle = color;
          ctx.fill();

          // Token text
          ctx.font = `${L.smallFontSize}px monospace`;
          ctx.fillStyle = p.textBright;
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillText(
            tok.text,
            tx + L.outputTokenW / 2,
            ty + L.outputTokenH / 2,
            L.outputTokenW - 4 * L.dpr,
          );

          ctx.restore();
        }
      }

      // ── Draft track background ──
      {
        const trackWidth = w - L.pad * 2;
        roundRect(L.pad, L.draftTrackY, trackWidth, L.trackH, 6 * L.dpr);
        ctx.fillStyle = p.trackBg;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Verify track background ──
      {
        const trackWidth = w - L.pad * 2;
        roundRect(L.pad, L.verifyTrackY, trackWidth, L.trackH, 6 * L.dpr);
        ctx.fillStyle = p.trackBg;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Draft model bar ──
      {
        const barY = L.draftTrackY + (L.trackH - L.barH) / 2;
        roundRect(L.barX, barY, L.barW, L.barH, 4 * L.dpr);
        ctx.fillStyle = p.draftBar;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulsing activity indicator during DRAFTING
        if (s.phase === Phase.DRAFTING) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
          ctx.save();
          ctx.globalAlpha = pulse * 0.4;
          roundRect(
            L.barX + 2 * L.dpr,
            barY + 2 * L.dpr,
            L.barW - 4 * L.dpr,
            L.barH - 4 * L.dpr,
            3 * L.dpr,
          );
          ctx.fillStyle = p.accepted;
          ctx.fill();
          ctx.restore();
        }

        ctx.font = `bold ${L.tinyFontSize}px monospace`;
        ctx.fillStyle = p.textDim;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("DRAFT", L.barX + L.barW / 2, barY + L.barH / 2);
      }

      // ── Verifier bar ──
      {
        const barY = L.verifyTrackY + (L.trackH - L.barH) / 2;
        roundRect(L.barX, barY, L.barW, L.barH, 4 * L.dpr);
        ctx.fillStyle = p.verifyBar;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulsing activity during VERIFYING
        if (s.phase === Phase.VERIFYING || s.phase === Phase.PAUSE_BEFORE_VERIFY) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          ctx.save();
          ctx.globalAlpha = pulse * 0.3;
          roundRect(
            L.barX + 2 * L.dpr,
            barY + 2 * L.dpr,
            L.barW - 4 * L.dpr,
            L.barH - 4 * L.dpr,
            3 * L.dpr,
          );
          ctx.fillStyle = p.correction;
          ctx.fill();
          ctx.restore();
        }

        ctx.font = `bold ${L.tinyFontSize}px monospace`;
        ctx.fillStyle = p.textDim;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("VERIFY", L.barX + L.barW / 2, barY + L.barH / 2);
      }

      // ── Draft tokens on draft track ──
      for (let i = 0; i < s.draftIndex && i < s.draftTokens.length; i++) {
        const tok = s.draftTokens[i];
        if (!tok) continue;
        const tx = tok.x;
        const ty = L.draftTrackY + (L.trackH - L.tokenH) / 2;

        ctx.save();

        // Shatter/discard animation
        if ((tok.status === "discarded" || tok.status === "rejected") && tok.shatterT > 0) {
          const sT = easeInBack(Math.min(tok.shatterT, 1));
          ctx.globalAlpha = tok.opacity * (1 - sT * 0.7);
          const cx = tx + L.tokenW / 2;
          const cy = ty + L.tokenH / 2;
          ctx.translate(cx, cy);
          ctx.scale(1 - sT * 0.3, 1 + sT * 0.15);
          ctx.translate(-cx, -cy);
          // Drop offset
          ctx.translate(0, sT * 20 * L.dpr);
        } else {
          ctx.globalAlpha = tok.opacity;
        }

        // Token background
        let bgColor = p.pending;
        if (tok.status === "accepted" && tok.checkT > 0.3) {
          bgColor = p.accepted;
        } else if (tok.status === "rejected" && tok.checkT > 0.3) {
          bgColor = p.rejected;
        }

        roundRect(tx, ty, L.tokenW, L.tokenH, 4 * L.dpr);
        ctx.fillStyle = bgColor;
        ctx.fill();

        // Token text
        ctx.font = `${L.smallFontSize}px monospace`;
        ctx.fillStyle = p.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tok.text, tx + L.tokenW / 2, ty + L.tokenH / 2, L.tokenW - 6 * L.dpr);

        ctx.restore();

        // ── Connection line to verify track ──
        if (s.phase >= Phase.VERIFYING && i <= s.verifyIndex) {
          const fromY = ty + L.tokenH;
          const toY = L.verifyTrackY + (L.trackH - L.tokenH) / 2;
          const lineX = tx + L.tokenW / 2;

          ctx.save();
          ctx.globalAlpha = tok.showProb * 0.2;
          ctx.strokeStyle = p.textDim;
          ctx.lineWidth = 1;
          ctx.setLineDash([3 * L.dpr, 3 * L.dpr]);
          ctx.beginPath();
          ctx.moveTo(lineX, fromY);
          ctx.lineTo(lineX, toY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // ── Verify track: probability comparison overlays ──
      if (s.phase >= Phase.VERIFYING) {
        for (let i = 0; i <= s.verifyIndex && i < s.draftTokens.length; i++) {
          const tok = s.draftTokens[i];
          if (!tok) continue;
          const tx = tok.targetX;
          const ty = L.verifyTrackY + (L.trackH - L.tokenH) / 2;

          ctx.save();
          const fadeIn = easeOutCubic(tok.showProb);
          ctx.globalAlpha = fadeIn;

          // Probability bar comparison — two bars side by side
          const barAreaW = L.tokenW;
          const singleBarW = barAreaW * 0.35;
          const barMaxH = L.tokenH * 0.85;
          const barGap = barAreaW * 0.08;

          const draftBarX = tx + (barAreaW - singleBarW * 2 - barGap) / 2;
          const targetBarX = draftBarX + singleBarW + barGap;

          const draftBarH = barMaxH * tok.draftProb;
          const targetBarH = barMaxH * tok.targetProb;

          const barBaseY = ty + L.tokenH - (L.tokenH - barMaxH) / 2;

          // Draft prob bar
          roundRect(draftBarX, barBaseY - draftBarH, singleBarW, draftBarH, 2 * L.dpr);
          ctx.fillStyle = p.probBarDraft;
          ctx.fill();

          // Target prob bar
          roundRect(targetBarX, barBaseY - targetBarH, singleBarW, targetBarH, 2 * L.dpr);
          ctx.fillStyle = p.probBarTarget;
          ctx.fill();

          // Labels below bars
          ctx.font = `${L.tinyFontSize * 0.85}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = p.textDim;
          ctx.fillText("d", draftBarX + singleBarW / 2, barBaseY + 1 * L.dpr);
          ctx.fillText("t", targetBarX + singleBarW / 2, barBaseY + 1 * L.dpr);

          ctx.restore();

          // ── Accept/reject icon above verify track token ──
          if (tok.checkT > 0.2) {
            const iconAlpha = easeOutCubic(Math.min((tok.checkT - 0.2) / 0.8, 1));
            const iconSize = 10 * L.dpr;
            const iconCx = tx + L.tokenW / 2;
            const iconCy = ty - 10 * L.dpr;

            if (tok.status === "accepted") {
              drawCheck(iconCx, iconCy, iconSize, iconAlpha);
            } else if (tok.status === "rejected" || tok.status === "discarded") {
              drawX(iconCx, iconCy, iconSize, iconAlpha * 0.8);
            }
          }
        }
      }

      // ── Verifier sweep indicator ──
      if (s.phase === Phase.VERIFYING && s.verifyIndex >= 0) {
        const sweepProgress = Math.min(s.phaseT / VERIFY_SWEEP_DURATION, 1);
        const sweepX = L.tokenStartX + sweepProgress * s.depth * (L.tokenW + L.tokenGap);
        const sweepY = L.verifyTrackY;

        ctx.save();
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(now * 0.01);
        ctx.strokeStyle = p.correction;
        ctx.lineWidth = 2 * L.dpr;
        ctx.setLineDash([4 * L.dpr, 4 * L.dpr]);
        ctx.beginPath();
        ctx.moveTo(sweepX, sweepY);
        ctx.lineTo(sweepX, sweepY + L.trackH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── Correction token indicator ──
      if (s.phase === Phase.RESOLVING || s.phase === Phase.MIGRATING) {
        const correctionIdx = s.firstRejectIdx >= 0 ? s.firstRejectIdx : s.depth;
        if (correctionIdx <= s.depth) {
          const tx = L.tokenStartX + correctionIdx * (L.tokenW + L.tokenGap);
          const ty = L.verifyTrackY + (L.trackH - L.tokenH) / 2;
          const fadeT = Math.min(s.phaseT / 300, 1);

          ctx.save();
          ctx.globalAlpha = easeOutCubic(fadeT) * 0.9;

          // Glow effect
          const glowSize = 4 * L.dpr;
          ctx.shadowColor = p.correction;
          ctx.shadowBlur = glowSize;

          roundRect(tx, ty, L.tokenW, L.tokenH, 4 * L.dpr);
          ctx.fillStyle = p.correction;
          ctx.fill();

          ctx.shadowBlur = 0;

          // Token text
          ctx.font = `bold ${L.smallFontSize}px monospace`;
          ctx.fillStyle = p.textBright;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("resample", tx + L.tokenW / 2, ty + L.tokenH / 2, L.tokenW - 4 * L.dpr);

          ctx.restore();

          // Arrow upward indicating "this replaces"
          ctx.save();
          ctx.globalAlpha = easeOutCubic(fadeT) * 0.5;
          ctx.strokeStyle = p.correction;
          ctx.lineWidth = 1.5 * L.dpr;
          const arrowX = tx + L.tokenW / 2;
          const arrowTop = ty - 6 * L.dpr;
          ctx.beginPath();
          ctx.moveTo(arrowX, ty);
          ctx.lineTo(arrowX, arrowTop);
          // Arrowhead
          ctx.moveTo(arrowX - 3 * L.dpr, arrowTop + 4 * L.dpr);
          ctx.lineTo(arrowX, arrowTop);
          ctx.lineTo(arrowX + 3 * L.dpr, arrowTop + 4 * L.dpr);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Phase indicator ──
      {
        const phaseNames = ["DRAFTING", "VERIFIER READING", "VERIFYING", "RESOLVING", "MIGRATING"];
        const phaseLabel = phaseNames[s.phase] ?? "";
        const pillX = w - L.pad - 120 * L.dpr;
        const pillY = L.draftTrackY + L.trackH + L.trackGap / 2 - 8 * L.dpr;

        ctx.save();
        ctx.font = `bold ${L.tinyFontSize}px monospace`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        // Dot indicator
        const dotColors = [p.accepted, p.textDim, p.correction, p.rejected, p.accepted];
        const dotX = pillX - 6 * L.dpr;
        const dotY = pillY;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3 * L.dpr, 0, Math.PI * 2);
        ctx.fillStyle = dotColors[s.phase] ?? p.textDim;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now * 0.005);
        ctx.fill();

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = p.text;
        ctx.fillText(phaseLabel, dotX - 8 * L.dpr, dotY);
        ctx.restore();
      }

      // ── Stats dashboard ──
      {
        ctx.save();
        const sy = L.statsY;
        const sx = L.pad;
        const colW = 150 * L.dpr;

        ctx.font = `${L.labelFontSize}px monospace`;
        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        // Divider line
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.pad, sy - 12 * L.dpr);
        ctx.lineTo(w - L.pad, sy - 12 * L.dpr);
        ctx.stroke();

        // Speculative throughput
        ctx.fillStyle = p.textDim;
        ctx.fillText("SPECULATIVE", sx, sy);
        ctx.font = `bold ${L.fontSize * 1.4}px monospace`;
        ctx.fillStyle = p.accepted;
        ctx.fillText(`${s.tokPerSecSpec.toFixed(1)}x`, sx, sy + 14 * L.dpr);

        // Naive throughput
        ctx.font = `${L.labelFontSize}px monospace`;
        ctx.fillStyle = p.textDim;
        ctx.fillText("NAIVE", sx + colW, sy);
        ctx.font = `bold ${L.fontSize * 1.4}px monospace`;
        ctx.fillStyle = p.text;
        ctx.fillText(`${s.tokPerSecNaive.toFixed(1)}x`, sx + colW, sy + 14 * L.dpr);

        // Acceptance rate
        const acceptRate =
          s.totalGenerated > 0 ? (s.totalAccepted / (s.totalAccepted + s.cycleCount)) * 100 : 0;
        ctx.font = `${L.labelFontSize}px monospace`;
        ctx.fillStyle = p.textDim;
        ctx.fillText("ACCEPT RATE", sx + colW * 2, sy);
        ctx.font = `bold ${L.fontSize * 1.4}px monospace`;
        ctx.fillStyle = acceptRate > 60 ? p.accepted : p.rejected;
        ctx.fillText(`${acceptRate.toFixed(0)}%`, sx + colW * 2, sy + 14 * L.dpr);

        // Draft length K
        ctx.font = `${L.labelFontSize}px monospace`;
        ctx.fillStyle = p.textDim;
        ctx.fillText("DEPTH K", sx + colW * 3, sy);
        ctx.font = `bold ${L.fontSize * 1.4}px monospace`;
        ctx.fillStyle = p.text;
        ctx.fillText(`${s.depth}`, sx + colW * 3, sy + 14 * L.dpr);

        // Total tokens
        ctx.font = `${L.labelFontSize}px monospace`;
        ctx.fillStyle = p.textDim;
        ctx.fillText("TOTAL TOKENS", sx + colW * 4, sy);
        ctx.font = `bold ${L.fontSize * 1.4}px monospace`;
        ctx.fillStyle = p.text;
        ctx.fillText(`${s.totalGenerated}`, sx + colW * 4, sy + 14 * L.dpr);

        ctx.restore();
      }

      // ── Paused indicator ──
      if (s.paused) {
        ctx.save();
        ctx.font = `bold ${L.fontSize * 1.2}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = p.textDim;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.003);
        ctx.fillText("PAUSED", w / 2, h / 2);
        ctx.restore();
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [startDraftCycle]);

  // ── Keyboard handler ──

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        const next = !simRef.current.paused;
        simRef.current.paused = next;
        setPaused(next);
      }

      if (e.key === "r" || e.key === "R") {
        if (e.metaKey || e.ctrlKey) return; // don't intercept browser reload
        e.preventDefault();
        const s = simRef.current;
        s.outputTokens = [];
        s.totalGenerated = 0;
        s.totalAccepted = 0;
        s.cycleCount = 0;
        s.tokPerSecSpec = 0;
        s.tokPerSecNaive = 0;
        s.paused = false;
        setPaused(false);
        startDraftCycle();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [startDraftCycle]);

  // ── Sync slider values to sim ──

  useEffect(() => {
    simRef.current.quality = quality / 100;
  }, [quality]);

  useEffect(() => {
    simRef.current.depth = depth;
  }, [depth]);

  // ── Styles ──

  const sliderLabel = "font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Controls overlay — top right */}
      <div
        className="fixed right-5 top-16 z-10 md:right-8 md:top-16"
        style={{ touchAction: "none" }}
      >
        <div className="flex flex-col gap-3 rounded bg-background/80 px-4 py-3 backdrop-blur-sm">
          {/* Draft quality slider */}
          <label className="flex items-center gap-3">
            <span className={sliderLabel}>QUALITY</span>
            <input
              type="range"
              min={40}
              max={95}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="h-1 w-20 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-8 font-mono text-[9px] text-foreground/30">{quality}%</span>
          </label>

          {/* Speculation depth K slider */}
          <label className="flex items-center gap-3">
            <span className={sliderLabel}>DEPTH K</span>
            <input
              type="range"
              min={1}
              max={8}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="h-1 w-20 appearance-none rounded bg-foreground/10 accent-foreground/40"
            />
            <span className="w-8 font-mono text-[9px] text-foreground/30">{depth}</span>
          </label>

          {/* Pause indicator */}
          {paused && (
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/20">
              paused
            </span>
          )}
        </div>
      </div>
    </>
  );
}
