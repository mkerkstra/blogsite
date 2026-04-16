"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ── Types ── */

interface Token {
  text: string;
  x: number;
  targetX: number;
  width: number;
  targetWidth: number;
  merging: boolean;
  mergePartner: number; // index of partner, -1 if none
  opacity: number;
  glowIntensity: number;
}

interface MergeRule {
  left: string;
  right: string;
  result: string;
  frequency: number;
}

type SimState = "running" | "paused" | "highlighting" | "merging" | "done" | "cooldown";

/* ── Palette ── */

const PALETTE = {
  dark: {
    bg: "#0a0a0a",
    tokenBg: "rgba(224,226,220,0.06)",
    tokenBorder: "rgba(224,226,220,0.12)",
    tokenText: "rgba(224,226,220,0.8)",
    accent: "#d4ff00",
    accentDim: "rgba(212,255,0,0.15)",
    accentGlow: "rgba(212,255,0,0.4)",
    accentBright: "rgba(212,255,0,0.8)",
    textDim: "rgba(224,226,220,0.3)",
    textMid: "rgba(224,226,220,0.5)",
    text: "rgba(224,226,220,0.7)",
    ruleBg: "rgba(224,226,220,0.03)",
    divider: "rgba(224,226,220,0.08)",
    badge: "rgba(212,255,0,0.2)",
    badgeText: "rgba(212,255,0,0.9)",
    completedBg: "rgba(212,255,0,0.06)",
  },
  light: {
    bg: "#f5f1e8",
    tokenBg: "rgba(10,10,10,0.04)",
    tokenBorder: "rgba(10,10,10,0.1)",
    tokenText: "rgba(10,10,10,0.75)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.1)",
    accentGlow: "rgba(42,138,14,0.25)",
    accentBright: "rgba(42,138,14,0.7)",
    textDim: "rgba(10,10,10,0.25)",
    textMid: "rgba(10,10,10,0.4)",
    text: "rgba(10,10,10,0.6)",
    ruleBg: "rgba(10,10,10,0.02)",
    divider: "rgba(10,10,10,0.06)",
    badge: "rgba(42,138,14,0.15)",
    badgeText: "rgba(42,138,14,0.8)",
    completedBg: "rgba(42,138,14,0.05)",
  },
};

/* ── Sentences ── */

const SENTENCES = [
  "the cat sat on the mat and the cat ate",
  "low lower lowest lowering lowered",
  "machine learning learns from learned examples",
  "neural networks work with networked neurons",
];

/* ── Easing ── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ── BPE Logic ── */

function findMostFrequentPair(
  tokens: string[],
): { left: string; right: string; count: number } | null {
  const counts = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (!a || !b) continue;
    const key = `${a}\0${b}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  let best: { left: string; right: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (count < 2) continue;
    if (!best || count > best.count) {
      const [left, right] = key.split("\0");
      if (left && right) {
        best = { left, right, count };
      }
    }
  }

  // If no pair with count >= 2, return the most frequent pair (count >= 1) if any
  if (!best) {
    for (const [key, count] of counts) {
      if (!best || count > best.count) {
        const [left, right] = key.split("\0");
        if (left && right) {
          best = { left, right, count };
        }
      }
    }
  }

  return best;
}

function applyMerge(tokens: string[], left: string, right: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    if (curr === left && next === right) {
      result.push(left + right);
      i += 2;
    } else {
      if (curr !== undefined) result.push(curr);
      i++;
    }
  }
  return result;
}

function findMergePairIndices(tokens: string[], left: string, right: string): number[] {
  const indices: number[] = [];
  let i = 0;
  while (i < tokens.length - 1) {
    if (tokens[i] === left && tokens[i + 1] === right) {
      indices.push(i);
      i += 2; // skip past this pair
    } else {
      i++;
    }
  }
  return indices;
}

/* ── Measure text helper ── */

function measureTokenWidth(ctx: CanvasRenderingContext2D, text: string, fontSize: number): number {
  ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
  return ctx.measureText(text).width + fontSize * 1.2; // padding
}

/* ── Component ── */

export function Tokenizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [simState, setSimState] = useState<SimState>("running");
  const [speed, setSpeed] = useState(1);

  const stateRef = useRef<{
    tokens: Token[];
    tokenStrings: string[];
    mergeRules: MergeRule[];
    simState: SimState;
    speed: number;
    sentenceIndex: number;
    originalSentence: string;
    initialTokenCount: number;
    mergeCount: number;
    phaseTimer: number;
    highlightPairLeft: string;
    highlightPairRight: string;
    highlightFrequency: number;
    mergePairIndices: number[];
    mergeProgress: number;
    cooldownTimer: number;
    ruleScrollOffset: number;
    ruleTargetScroll: number;
    tokenFontSize: number;
    reduced: boolean;
  }>({
    tokens: [],
    tokenStrings: [],
    mergeRules: [],
    simState: "running",
    speed: 1,
    sentenceIndex: 0,
    originalSentence: "",
    initialTokenCount: 0,
    mergeCount: 0,
    phaseTimer: 0,
    highlightPairLeft: "",
    highlightPairRight: "",
    highlightFrequency: 0,
    mergePairIndices: [],
    mergeProgress: 0,
    cooldownTimer: 0,
    ruleScrollOffset: 0,
    ruleTargetScroll: 0,
    tokenFontSize: 13,
    reduced: false,
  });

  /* ── Initialize tokens from a sentence ── */

  const initTokens = useCallback((sentence: string, ctx: CanvasRenderingContext2D | null) => {
    const s = stateRef.current;
    s.originalSentence = sentence;
    // Split into characters, replacing spaces with visible marker
    const chars = sentence.split("").map((c) => (c === " " ? "\u2581" : c));
    s.tokenStrings = chars;
    s.mergeRules = [];
    s.mergeCount = 0;
    s.initialTokenCount = chars.length;
    s.phaseTimer = 0;
    s.highlightPairLeft = "";
    s.highlightPairRight = "";
    s.highlightFrequency = 0;
    s.mergePairIndices = [];
    s.mergeProgress = 0;
    s.cooldownTimer = 0;
    s.ruleScrollOffset = 0;
    s.ruleTargetScroll = 0;

    // Build token objects with positions
    const fontSize = s.tokenFontSize;
    if (ctx) {
      const tokenObjs: Token[] = [];
      let xPos = 0;
      for (const ch of chars) {
        const w = measureTokenWidth(ctx, ch, fontSize);
        tokenObjs.push({
          text: ch,
          x: xPos,
          targetX: xPos,
          width: w,
          targetWidth: w,
          merging: false,
          mergePartner: -1,
          opacity: 1,
          glowIntensity: 0,
        });
        xPos += w + 3; // 3px gap between tokens
      }
      s.tokens = tokenObjs;
    }
  }, []);

  /* ── Rebuild token positions ── */

  const rebuildTokenPositions = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    const fontSize = s.tokenFontSize;
    let xPos = 0;
    for (const tok of s.tokens) {
      const w = measureTokenWidth(ctx, tok.text, fontSize);
      tok.targetX = xPos;
      tok.targetWidth = w;
      tok.merging = false;
      tok.mergePartner = -1;
      tok.glowIntensity = 0;
      xPos += w + 3;
    }
  }, []);

  /* ── Reset ── */

  const reset = useCallback(
    (ctx: CanvasRenderingContext2D | null) => {
      const s = stateRef.current;
      s.sentenceIndex = (s.sentenceIndex + 1) % SENTENCES.length;
      const sentence = SENTENCES[s.sentenceIndex];
      if (sentence) {
        initTokens(sentence, ctx);
      }
      setSimState("running");
      s.simState = "running";
    },
    [initTokens],
  );

  /* ── Sync state to ref ── */

  useEffect(() => {
    stateRef.current.speed = speed;
  }, [speed]);

  useEffect(() => {
    stateRef.current.simState = simState;
  }, [simState]);

  /* ── Keyboard handler ── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        setSimState((prev) => {
          if (prev === "running" || prev === "highlighting") {
            stateRef.current.simState = "paused";
            return "paused";
          }
          if (prev === "paused") {
            stateRef.current.simState = "running";
            return "running";
          }
          return prev;
        });
      }
      if (e.code === "KeyR") {
        const canvas = canvasRef.current;
        const ctx = canvas ? canvas.getContext("2d") : null;
        reset(ctx);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  /* ── Canvas render loop ── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    stateRef.current.reduced = reduced;

    // Initial size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Init first sentence
    const firstSentence = SENTENCES[0];
    if (firstSentence) {
      initTokens(firstSentence, ctx);
    }

    // Resize observer
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const d = window.devicePixelRatio || 1;
      canvas.width = Math.round(entry.contentRect.width * d);
      canvas.height = Math.round(entry.contentRect.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    });
    observer.observe(canvas);

    // If reduced motion, fast-forward all merges
    if (reduced) {
      const s = stateRef.current;
      let pair = findMostFrequentPair(s.tokenStrings);
      while (pair) {
        s.mergeRules.push({
          left: pair.left,
          right: pair.right,
          result: pair.left + pair.right,
          frequency: pair.count,
        });
        s.tokenStrings = applyMerge(s.tokenStrings, pair.left, pair.right);
        s.mergeCount++;
        pair = findMostFrequentPair(s.tokenStrings);
        // Safety: stop at 100 merges
        if (s.mergeCount > 100) break;
      }
      // Rebuild token objects
      const tokObjs: Token[] = [];
      let xPos = 0;
      for (const str of s.tokenStrings) {
        const w = measureTokenWidth(ctx, str, s.tokenFontSize);
        tokObjs.push({
          text: str,
          x: xPos,
          targetX: xPos,
          width: w,
          targetWidth: w,
          merging: false,
          mergePartner: -1,
          opacity: 1,
          glowIntensity: 0,
        });
        xPos += w + 3;
      }
      s.tokens = tokObjs;
      setSimState("done");
      s.simState = "done";
    }

    let raf = 0;
    let lastTime = performance.now();
    const cvs = canvas;
    const g = ctx;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const rawDt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      const dt = rawDt * s.speed;
      const theme = getTheme();
      const colors = PALETTE[theme];
      const w = cvs.width / (window.devicePixelRatio || 1);
      const h = cvs.height / (window.devicePixelRatio || 1);

      /* ── State machine ── */

      if (s.simState === "running") {
        s.phaseTimer += dt;
        const stepDelay = 0.8 / s.speed;
        if (s.phaseTimer >= stepDelay) {
          s.phaseTimer = 0;
          // Find next pair
          const pair = findMostFrequentPair(s.tokenStrings);
          if (!pair) {
            s.simState = "done";
            setSimState("done");
          } else {
            s.highlightPairLeft = pair.left;
            s.highlightPairRight = pair.right;
            s.highlightFrequency = pair.count;
            s.mergePairIndices = findMergePairIndices(s.tokenStrings, pair.left, pair.right);
            // Set glow on matching tokens
            for (const idx of s.mergePairIndices) {
              const tokLeft = s.tokens[idx];
              const tokRight = s.tokens[idx + 1];
              if (tokLeft) {
                tokLeft.glowIntensity = 1;
                tokLeft.merging = true;
                tokLeft.mergePartner = idx + 1;
              }
              if (tokRight) {
                tokRight.glowIntensity = 1;
                tokRight.merging = true;
                tokRight.mergePartner = idx;
              }
            }
            s.simState = "highlighting";
            setSimState("highlighting");
          }
        }
      }

      if (s.simState === "highlighting") {
        s.phaseTimer += dt;
        const highlightDuration = 0.5 / s.speed;
        if (s.phaseTimer >= highlightDuration) {
          s.phaseTimer = 0;
          s.mergeProgress = 0;
          s.simState = "merging";
          setSimState("merging");
        }
      }

      if (s.simState === "merging") {
        s.mergeProgress += dt * 2.5 * s.speed;
        if (s.mergeProgress >= 1) {
          s.mergeProgress = 1;
          // Apply the merge
          s.mergeRules.push({
            left: s.highlightPairLeft,
            right: s.highlightPairRight,
            result: s.highlightPairLeft + s.highlightPairRight,
            frequency: s.highlightFrequency,
          });
          s.tokenStrings = applyMerge(s.tokenStrings, s.highlightPairLeft, s.highlightPairRight);
          s.mergeCount++;

          // Rebuild token objects from tokenStrings
          const tokObjs: Token[] = [];
          let xPos = 0;
          for (const str of s.tokenStrings) {
            const tw = measureTokenWidth(g, str, s.tokenFontSize);
            tokObjs.push({
              text: str,
              x: xPos,
              targetX: xPos,
              width: tw,
              targetWidth: tw,
              merging: false,
              mergePartner: -1,
              opacity: 1,
              glowIntensity: 0,
            });
            xPos += tw + 3;
          }
          s.tokens = tokObjs;

          // Scroll rule log
          const ruleLineHeight = 18;
          s.ruleTargetScroll = Math.max(0, s.mergeRules.length * ruleLineHeight - 200);

          s.phaseTimer = 0;
          s.simState = "running";
          setSimState("running");
        } else {
          // Animate merging tokens: slide right token left
          const ease = easeOutCubic(s.mergeProgress);
          for (const idx of s.mergePairIndices) {
            const tokLeft = s.tokens[idx];
            const tokRight = s.tokens[idx + 1];
            if (tokLeft && tokRight) {
              // Slide right token toward left
              const mergedWidth = measureTokenWidth(
                g,
                tokLeft.text + tokRight.text,
                s.tokenFontSize,
              );
              tokRight.x =
                tokRight.targetX -
                (tokRight.targetX - (tokLeft.targetX + mergedWidth - tokRight.width)) * ease;
              tokRight.opacity = 1 - ease * 0.3;
              tokLeft.width = tokLeft.targetWidth + (mergedWidth - tokLeft.targetWidth) * ease;
            }
          }
        }
      }

      if (s.simState === "done") {
        s.cooldownTimer += rawDt; // Use raw dt, not speed-adjusted
        if (s.cooldownTimer >= 3) {
          s.cooldownTimer = 0;
          s.sentenceIndex = (s.sentenceIndex + 1) % SENTENCES.length;
          const nextSentence = SENTENCES[s.sentenceIndex];
          if (nextSentence) {
            initTokens(nextSentence, g);
          }
          s.simState = "running";
          setSimState("running");
        }
      }

      // Animate rule scroll
      s.ruleScrollOffset += (s.ruleTargetScroll - s.ruleScrollOffset) * Math.min(1, rawDt * 8);

      // Animate token glow decay
      for (const tok of s.tokens) {
        if (!tok.merging) {
          tok.glowIntensity *= Math.max(0, 1 - rawDt * 3);
        }
        // Smoothly animate x toward target
        tok.x += (tok.targetX - tok.x) * Math.min(1, rawDt * 10);
        tok.width += (tok.targetWidth - tok.width) * Math.min(1, rawDt * 10);
      }

      /* ── Draw ── */

      g.clearRect(0, 0, w, h);
      g.fillStyle = colors.bg;
      g.fillRect(0, 0, w, h);

      const navbarOffset = 56;
      const padding = 32;
      const rulesPanelWidth = Math.min(260, w * 0.25);
      const mainAreaWidth = w - rulesPanelWidth - padding * 3;
      const mainAreaLeft = padding;

      /* ── Draw input sentence (top) ── */

      const sentenceY = navbarOffset + 24;
      g.font = `9px 'JetBrains Mono', monospace`;
      g.fillStyle = colors.textDim;
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText("INPUT", mainAreaLeft, sentenceY);

      g.font = `14px 'JetBrains Mono', monospace`;
      g.fillStyle = colors.text;
      g.textAlign = "left";
      g.textBaseline = "top";

      // Draw sentence with character boundaries
      const sentenceTextY = sentenceY + 18;
      const charSpacing = 0;
      let charX = mainAreaLeft;
      for (let i = 0; i < s.originalSentence.length; i++) {
        const ch = s.originalSentence[i];
        if (!ch) continue;
        const displayCh = ch === " " ? "\u2581" : ch;
        const charW = g.measureText(displayCh).width;

        // Subtle char boundary
        if (i > 0) {
          g.strokeStyle = colors.divider;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(charX - 1, sentenceTextY - 2);
          g.lineTo(charX - 1, sentenceTextY + 18);
          g.stroke();
        }

        g.fillStyle = colors.tokenText;
        g.fillText(displayCh, charX + 1, sentenceTextY);
        charX += charW + charSpacing + 3;
      }

      /* ── Draw tokens (main area) ── */

      const tokenAreaY = sentenceTextY + 44;

      g.font = `9px 'JetBrains Mono', monospace`;
      g.fillStyle = colors.textDim;
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText("TOKENS", mainAreaLeft, tokenAreaY);

      const tokY = tokenAreaY + 20;
      const fontSize = s.tokenFontSize;
      const tokHeight = fontSize + 14;

      // Calculate total width of all tokens to wrap them
      const gap = 3;
      let rowX = mainAreaLeft;
      let rowY = tokY;
      const maxRowWidth = mainAreaWidth;
      const rowHeight = tokHeight + 8;

      for (let i = 0; i < s.tokens.length; i++) {
        const tok = s.tokens[i];
        if (!tok) continue;

        const tokW = tok.width;

        // Wrap to next row if needed
        if (rowX + tokW > mainAreaLeft + maxRowWidth && rowX > mainAreaLeft) {
          rowX = mainAreaLeft;
          rowY += rowHeight;
        }

        const drawX = rowX;
        const drawY = rowY;

        // Token background
        const isHighlighted = tok.merging || tok.glowIntensity > 0.1;

        if (isHighlighted) {
          // Glow effect
          const glowAlpha = tok.glowIntensity * 0.4;
          g.shadowColor = colors.accent;
          g.shadowBlur = 12 * tok.glowIntensity;
          g.fillStyle = colors.accentDim;
          g.globalAlpha = 0.5 + glowAlpha;
          roundRect(g, drawX, drawY, tokW, tokHeight, 3);
          g.fill();
          g.shadowBlur = 0;
          g.globalAlpha = 1;

          // Accent border
          g.strokeStyle = colors.accentGlow;
          g.lineWidth = 1.5;
          roundRect(g, drawX, drawY, tokW, tokHeight, 3);
          g.stroke();
        } else {
          // Normal token
          const isMergedResult = tok.text.length > 1;
          g.fillStyle = isMergedResult ? colors.completedBg : colors.tokenBg;
          roundRect(g, drawX, drawY, tokW, tokHeight, 3);
          g.fill();

          g.strokeStyle = colors.tokenBorder;
          g.lineWidth = 1;
          roundRect(g, drawX, drawY, tokW, tokHeight, 3);
          g.stroke();
        }

        // Token text
        g.font = `${fontSize}px 'JetBrains Mono', monospace`;
        g.fillStyle = isHighlighted ? colors.accentBright : colors.tokenText;
        g.globalAlpha = tok.opacity;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(tok.text, drawX + tokW / 2, drawY + tokHeight / 2);
        g.globalAlpha = 1;

        rowX += tokW + gap;
      }

      /* ── Draw merge arrows for highlighting phase ── */

      if (s.simState === "highlighting" || s.simState === "merging") {
        // Draw small arrows between merge pairs
        // (Already shown via glow, but add connecting arc)
        g.strokeStyle = colors.accentGlow;
        g.lineWidth = 1.5;
      }

      /* ── Stats area ── */

      const statsY = Math.max(rowY + rowHeight + 30, tokenAreaY + 100);
      g.font = `9px 'JetBrains Mono', monospace`;
      g.fillStyle = colors.textDim;
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText("STATS", mainAreaLeft, statsY);

      const statsLineHeight = 18;
      g.font = `11px 'JetBrains Mono', monospace`;

      // Vocabulary size
      const uniqueTokens = new Set(s.tokenStrings).size;
      g.fillStyle = colors.textMid;
      g.fillText(`vocab size: ${uniqueTokens}`, mainAreaLeft, statsY + 16);

      // Merge count
      g.fillText(`merges: ${s.mergeCount}`, mainAreaLeft, statsY + 16 + statsLineHeight);

      // Compression ratio
      const ratio =
        s.initialTokenCount > 0
          ? (s.initialTokenCount / Math.max(1, s.tokenStrings.length)).toFixed(2)
          : "1.00";
      g.fillText(`compression: ${ratio}x`, mainAreaLeft, statsY + 16 + statsLineHeight * 2);

      // Current token count
      g.fillText(
        `tokens: ${s.initialTokenCount} \u2192 ${s.tokenStrings.length}`,
        mainAreaLeft,
        statsY + 16 + statsLineHeight * 3,
      );

      // Current merge highlight
      if (s.simState === "highlighting" || s.simState === "merging") {
        g.fillStyle = colors.accentBright;
        g.fillText(
          `merging: "${s.highlightPairLeft}" + "${s.highlightPairRight}" (${s.highlightFrequency}x)`,
          mainAreaLeft,
          statsY + 16 + statsLineHeight * 5,
        );
      }

      // Done message
      if (s.simState === "done") {
        g.fillStyle = colors.accentBright;
        g.fillText("complete - resetting...", mainAreaLeft, statsY + 16 + statsLineHeight * 5);
      }

      /* ── Merge rules panel (right side) ── */

      const rulesPanelX = w - rulesPanelWidth - padding;
      const rulesPanelY = navbarOffset + 24;
      const rulesPanelH = h - rulesPanelY - 80;

      g.font = `9px 'JetBrains Mono', monospace`;
      g.fillStyle = colors.textDim;
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText("MERGE LOG", rulesPanelX, rulesPanelY);

      // Panel background
      g.fillStyle = colors.ruleBg;
      const panelContentY = rulesPanelY + 16;
      roundRect(g, rulesPanelX - 8, panelContentY, rulesPanelWidth + 8, rulesPanelH - 16, 4);
      g.fill();

      // Clip for scrolling
      g.save();
      g.beginPath();
      g.rect(rulesPanelX - 8, panelContentY, rulesPanelWidth + 8, rulesPanelH - 16);
      g.clip();

      const ruleLineH = 22;
      const ruleStartY = panelContentY + 8 - s.ruleScrollOffset;

      for (let i = 0; i < s.mergeRules.length; i++) {
        const rule = s.mergeRules[i];
        if (!rule) continue;

        const ry = ruleStartY + i * ruleLineH;

        // Skip if outside visible area
        if (ry + ruleLineH < panelContentY || ry > panelContentY + rulesPanelH) continue;

        // Rule number
        g.font = `9px 'JetBrains Mono', monospace`;
        g.fillStyle = colors.textDim;
        g.textAlign = "left";
        g.textBaseline = "middle";
        const numStr = String(i + 1).padStart(2, "0");
        g.fillText(numStr, rulesPanelX, ry + ruleLineH / 2);

        // Rule content
        g.font = `10px 'JetBrains Mono', monospace`;
        const isLatest = i === s.mergeRules.length - 1;
        g.fillStyle = isLatest ? colors.accentBright : colors.textMid;

        const ruleText = `"${rule.left}" + "${rule.right}" \u2192 "${rule.result}"`;
        g.fillText(ruleText, rulesPanelX + 22, ry + ruleLineH / 2);

        // Frequency badge
        const badgeX = rulesPanelX + rulesPanelWidth - 28;
        g.fillStyle = colors.badge;
        roundRect(g, badgeX, ry + 3, 22, ruleLineH - 6, 2);
        g.fill();
        g.font = `8px 'JetBrains Mono', monospace`;
        g.fillStyle = colors.badgeText;
        g.textAlign = "center";
        g.fillText(`${rule.frequency}x`, badgeX + 11, ry + ruleLineH / 2);
        g.textAlign = "left";
      }

      g.restore();

      // Empty state
      if (s.mergeRules.length === 0) {
        g.font = `10px 'JetBrains Mono', monospace`;
        g.fillStyle = colors.textDim;
        g.textAlign = "left";
        g.textBaseline = "top";
        g.fillText("waiting for first merge...", rulesPanelX, panelContentY + 12);
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [initTokens, rebuildTokenPositions]);

  /* ── Handlers ── */

  const handlePlayPause = useCallback(() => {
    setSimState((prev) => {
      if (prev === "running" || prev === "highlighting") {
        stateRef.current.simState = "paused";
        return "paused";
      }
      if (prev === "paused") {
        stateRef.current.simState = "running";
        return "running";
      }
      return prev;
    });
  }, []);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext("2d") : null;
    reset(ctx);
  }, [reset]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Controls overlay — top-right */}
      <div
        className="fixed right-4 top-16 z-20 flex items-center gap-3 rounded bg-background/70 px-3 py-2 backdrop-blur-sm"
        style={{ zIndex: 20 }}
      >
        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
            spd
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 w-12 accent-foreground/40"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
            {speed}x
          </span>
        </label>

        <div className="h-4 w-px bg-foreground/10" />

        <button
          onClick={handlePlayPause}
          disabled={simState === "done" || simState === "merging" || simState === "cooldown"}
          className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/50 hover:text-foreground/80 disabled:opacity-30"
        >
          {simState === "running" || simState === "highlighting" ? "pause" : "play"}
        </button>

        <button
          onClick={handleReset}
          className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/50 hover:text-foreground/80"
        >
          reset
        </button>
      </div>
    </>
  );
}

/* ── Canvas helpers ── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
