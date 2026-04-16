"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ── Types ── */

interface TreeNode {
  token: string;
  prob: number;
  children: TreeNode[];
}

interface FlatNode {
  id: number;
  token: string;
  prob: number;
  depth: number;
  parentId: number | null;
  childIds: number[];
  /** Cumulative log-probability from root */
  cumProb: number;
}

interface LayoutNode extends FlatNode {
  x: number;
  y: number;
  /** 0..1 animation progress for scale-in */
  scaleAnim: number;
  /** 0..1 animation progress for label fade-in */
  labelAnim: number;
  /** Whether this node survived pruning */
  alive: boolean;
  /** 0..1 dim/strikethrough progress */
  pruneAnim: number;
  /** Whether this node is on the final winning path */
  winning: boolean;
  /** 0..1 glow animation for winning path */
  winAnim: number;
}

/* ── Pre-computed probability trees ── */

const PROMPTS: { prompt: string; tree: TreeNode }[] = [
  {
    prompt: "The",
    tree: {
      token: "The",
      prob: 1.0,
      children: [
        {
          token: "cat",
          prob: 0.35,
          children: [
            {
              token: "sat",
              prob: 0.45,
              children: [
                {
                  token: "on",
                  prob: 0.6,
                  children: [
                    {
                      token: "the",
                      prob: 0.55,
                      children: [
                        { token: "mat", prob: 0.4, children: [] },
                        { token: "roof", prob: 0.35, children: [] },
                        { token: "fence", prob: 0.15, children: [] },
                        { token: "floor", prob: 0.1, children: [] },
                      ],
                    },
                    {
                      token: "a",
                      prob: 0.3,
                      children: [
                        { token: "branch", prob: 0.5, children: [] },
                        { token: "ledge", prob: 0.3, children: [] },
                        { token: "wall", prob: 0.2, children: [] },
                      ],
                    },
                    { token: "its", prob: 0.15, children: [] },
                  ],
                },
                {
                  token: "and",
                  prob: 0.25,
                  children: [
                    { token: "watched", prob: 0.5, children: [] },
                    { token: "purred", prob: 0.35, children: [] },
                    { token: "waited", prob: 0.15, children: [] },
                  ],
                },
                { token: "still", prob: 0.15, children: [] },
              ],
            },
            {
              token: "ran",
              prob: 0.3,
              children: [
                {
                  token: "across",
                  prob: 0.45,
                  children: [
                    { token: "the", prob: 0.7, children: [] },
                    { token: "every", prob: 0.3, children: [] },
                  ],
                },
                {
                  token: "away",
                  prob: 0.35,
                  children: [
                    { token: "quickly", prob: 0.6, children: [] },
                    { token: "fast", prob: 0.4, children: [] },
                  ],
                },
                { token: "home", prob: 0.2, children: [] },
              ],
            },
            {
              token: "ate",
              prob: 0.15,
              children: [
                { token: "the", prob: 0.6, children: [] },
                { token: "some", prob: 0.4, children: [] },
              ],
            },
            {
              token: "slept",
              prob: 0.1,
              children: [
                { token: "all", prob: 0.5, children: [] },
                { token: "through", prob: 0.5, children: [] },
              ],
            },
          ],
        },
        {
          token: "old",
          prob: 0.28,
          children: [
            {
              token: "man",
              prob: 0.4,
              children: [
                {
                  token: "walked",
                  prob: 0.45,
                  children: [
                    { token: "slowly", prob: 0.6, children: [] },
                    { token: "away", prob: 0.4, children: [] },
                  ],
                },
                {
                  token: "sat",
                  prob: 0.35,
                  children: [
                    { token: "down", prob: 0.7, children: [] },
                    { token: "quietly", prob: 0.3, children: [] },
                  ],
                },
                { token: "spoke", prob: 0.2, children: [] },
              ],
            },
            {
              token: "house",
              prob: 0.35,
              children: [
                {
                  token: "stood",
                  prob: 0.5,
                  children: [
                    { token: "empty", prob: 0.6, children: [] },
                    { token: "alone", prob: 0.4, children: [] },
                  ],
                },
                {
                  token: "creaked",
                  prob: 0.3,
                  children: [
                    { token: "loudly", prob: 0.7, children: [] },
                    { token: "softly", prob: 0.3, children: [] },
                  ],
                },
                { token: "burned", prob: 0.2, children: [] },
              ],
            },
            { token: "tree", prob: 0.25, children: [] },
          ],
        },
        {
          token: "quick",
          prob: 0.2,
          children: [
            {
              token: "fox",
              prob: 0.5,
              children: [
                {
                  token: "jumped",
                  prob: 0.55,
                  children: [
                    { token: "over", prob: 0.7, children: [] },
                    { token: "high", prob: 0.3, children: [] },
                  ],
                },
                {
                  token: "ran",
                  prob: 0.3,
                  children: [
                    { token: "fast", prob: 0.6, children: [] },
                    { token: "north", prob: 0.4, children: [] },
                  ],
                },
                { token: "hid", prob: 0.15, children: [] },
              ],
            },
            {
              token: "brown",
              prob: 0.3,
              children: [
                { token: "fox", prob: 0.7, children: [] },
                { token: "dog", prob: 0.3, children: [] },
              ],
            },
            { token: "step", prob: 0.2, children: [] },
          ],
        },
        {
          token: "big",
          prob: 0.12,
          children: [
            {
              token: "dog",
              prob: 0.5,
              children: [
                { token: "barked", prob: 0.6, children: [] },
                { token: "ran", prob: 0.4, children: [] },
              ],
            },
            { token: "wave", prob: 0.3, children: [] },
            { token: "storm", prob: 0.2, children: [] },
          ],
        },
        {
          token: "red",
          prob: 0.05,
          children: [
            { token: "car", prob: 0.5, children: [] },
            { token: "light", prob: 0.3, children: [] },
            { token: "bird", prob: 0.2, children: [] },
          ],
        },
      ],
    },
  },
  {
    prompt: "Once",
    tree: {
      token: "Once",
      prob: 1.0,
      children: [
        {
          token: "upon",
          prob: 0.45,
          children: [
            {
              token: "a",
              prob: 0.8,
              children: [
                {
                  token: "time",
                  prob: 0.7,
                  children: [
                    {
                      token: "there",
                      prob: 0.6,
                      children: [
                        { token: "lived", prob: 0.5, children: [] },
                        { token: "was", prob: 0.35, children: [] },
                        { token: "stood", prob: 0.15, children: [] },
                      ],
                    },
                    {
                      token: "in",
                      prob: 0.25,
                      children: [
                        { token: "a", prob: 0.7, children: [] },
                        { token: "the", prob: 0.3, children: [] },
                      ],
                    },
                    { token: "long", prob: 0.15, children: [] },
                  ],
                },
                {
                  token: "hill",
                  prob: 0.15,
                  children: [
                    { token: "there", prob: 0.6, children: [] },
                    { token: "far", prob: 0.4, children: [] },
                  ],
                },
                { token: "midnight", prob: 0.15, children: [] },
              ],
            },
            {
              token: "the",
              prob: 0.2,
              children: [
                { token: "mountain", prob: 0.5, children: [] },
                { token: "shore", prob: 0.3, children: [] },
                { token: "hill", prob: 0.2, children: [] },
              ],
            },
          ],
        },
        {
          token: "more",
          prob: 0.25,
          children: [
            {
              token: "the",
              prob: 0.4,
              children: [
                {
                  token: "world",
                  prob: 0.5,
                  children: [
                    { token: "was", prob: 0.6, children: [] },
                    { token: "knew", prob: 0.4, children: [] },
                  ],
                },
                { token: "king", prob: 0.3, children: [] },
                { token: "door", prob: 0.2, children: [] },
              ],
            },
            {
              token: "I",
              prob: 0.35,
              children: [
                {
                  token: "thought",
                  prob: 0.5,
                  children: [
                    { token: "about", prob: 0.6, children: [] },
                    { token: "of", prob: 0.4, children: [] },
                  ],
                },
                { token: "knew", prob: 0.3, children: [] },
                { token: "saw", prob: 0.2, children: [] },
              ],
            },
            { token: "we", prob: 0.25, children: [] },
          ],
        },
        {
          token: "there",
          prob: 0.15,
          children: [
            {
              token: "was",
              prob: 0.6,
              children: [
                { token: "a", prob: 0.7, children: [] },
                { token: "nothing", prob: 0.3, children: [] },
              ],
            },
            { token: "lived", prob: 0.25, children: [] },
            { token: "stood", prob: 0.15, children: [] },
          ],
        },
        {
          token: "in",
          prob: 0.1,
          children: [
            { token: "a", prob: 0.6, children: [] },
            { token: "the", prob: 0.3, children: [] },
            { token: "every", prob: 0.1, children: [] },
          ],
        },
        {
          token: "again",
          prob: 0.05,
          children: [
            { token: "the", prob: 0.5, children: [] },
            { token: "I", prob: 0.3, children: [] },
            { token: "we", prob: 0.2, children: [] },
          ],
        },
      ],
    },
  },
  {
    prompt: "In",
    tree: {
      token: "In",
      prob: 1.0,
      children: [
        {
          token: "the",
          prob: 0.4,
          children: [
            {
              token: "beginning",
              prob: 0.3,
              children: [
                {
                  token: "there",
                  prob: 0.5,
                  children: [
                    { token: "was", prob: 0.7, children: [] },
                    { token: "existed", prob: 0.3, children: [] },
                  ],
                },
                {
                  token: "the",
                  prob: 0.3,
                  children: [
                    { token: "world", prob: 0.5, children: [] },
                    { token: "universe", prob: 0.5, children: [] },
                  ],
                },
                { token: "God", prob: 0.2, children: [] },
              ],
            },
            {
              token: "end",
              prob: 0.25,
              children: [
                {
                  token: "the",
                  prob: 0.5,
                  children: [
                    { token: "truth", prob: 0.5, children: [] },
                    { token: "answer", prob: 0.5, children: [] },
                  ],
                },
                {
                  token: "it",
                  prob: 0.3,
                  children: [
                    { token: "was", prob: 0.6, children: [] },
                    { token: "did", prob: 0.4, children: [] },
                  ],
                },
                { token: "nothing", prob: 0.2, children: [] },
              ],
            },
            {
              token: "dark",
              prob: 0.25,
              children: [
                {
                  token: "forest",
                  prob: 0.5,
                  children: [
                    { token: "a", prob: 0.6, children: [] },
                    { token: "the", prob: 0.4, children: [] },
                  ],
                },
                {
                  token: "room",
                  prob: 0.3,
                  children: [
                    { token: "sat", prob: 0.5, children: [] },
                    { token: "stood", prob: 0.5, children: [] },
                  ],
                },
                { token: "night", prob: 0.2, children: [] },
              ],
            },
            { token: "morning", prob: 0.2, children: [] },
          ],
        },
        {
          token: "a",
          prob: 0.3,
          children: [
            {
              token: "world",
              prob: 0.35,
              children: [
                {
                  token: "where",
                  prob: 0.5,
                  children: [
                    { token: "nothing", prob: 0.5, children: [] },
                    { token: "everything", prob: 0.5, children: [] },
                  ],
                },
                { token: "of", prob: 0.3, children: [] },
                { token: "without", prob: 0.2, children: [] },
              ],
            },
            {
              token: "small",
              prob: 0.3,
              children: [
                {
                  token: "town",
                  prob: 0.6,
                  children: [
                    { token: "there", prob: 0.6, children: [] },
                    { token: "near", prob: 0.4, children: [] },
                  ],
                },
                { token: "room", prob: 0.25, children: [] },
                { token: "house", prob: 0.15, children: [] },
              ],
            },
            {
              token: "quiet",
              prob: 0.2,
              children: [
                { token: "corner", prob: 0.5, children: [] },
                { token: "village", prob: 0.3, children: [] },
                { token: "place", prob: 0.2, children: [] },
              ],
            },
            { token: "land", prob: 0.15, children: [] },
          ],
        },
        {
          token: "every",
          prob: 0.15,
          children: [
            {
              token: "story",
              prob: 0.5,
              children: [
                { token: "there", prob: 0.6, children: [] },
                { token: "the", prob: 0.4, children: [] },
              ],
            },
            { token: "dream", prob: 0.3, children: [] },
            { token: "way", prob: 0.2, children: [] },
          ],
        },
        {
          token: "our",
          prob: 0.1,
          children: [
            { token: "world", prob: 0.5, children: [] },
            { token: "time", prob: 0.3, children: [] },
            { token: "minds", prob: 0.2, children: [] },
          ],
        },
        {
          token: "all",
          prob: 0.05,
          children: [
            { token: "things", prob: 0.6, children: [] },
            { token: "my", prob: 0.4, children: [] },
          ],
        },
      ],
    },
  },
  {
    prompt: "She",
    tree: {
      token: "She",
      prob: 1.0,
      children: [
        {
          token: "walked",
          prob: 0.3,
          children: [
            {
              token: "into",
              prob: 0.4,
              children: [
                {
                  token: "the",
                  prob: 0.7,
                  children: [
                    {
                      token: "room",
                      prob: 0.4,
                      children: [
                        { token: "and", prob: 0.6, children: [] },
                        { token: "quietly", prob: 0.4, children: [] },
                      ],
                    },
                    {
                      token: "forest",
                      prob: 0.3,
                      children: [
                        { token: "alone", prob: 0.5, children: [] },
                        { token: "without", prob: 0.5, children: [] },
                      ],
                    },
                    { token: "light", prob: 0.2, children: [] },
                    { token: "dark", prob: 0.1, children: [] },
                  ],
                },
                { token: "a", prob: 0.3, children: [] },
              ],
            },
            {
              token: "slowly",
              prob: 0.3,
              children: [
                {
                  token: "toward",
                  prob: 0.5,
                  children: [
                    { token: "the", prob: 0.7, children: [] },
                    { token: "him", prob: 0.3, children: [] },
                  ],
                },
                {
                  token: "through",
                  prob: 0.3,
                  children: [
                    { token: "the", prob: 0.7, children: [] },
                    { token: "each", prob: 0.3, children: [] },
                  ],
                },
                { token: "away", prob: 0.2, children: [] },
              ],
            },
            {
              token: "away",
              prob: 0.2,
              children: [
                { token: "from", prob: 0.6, children: [] },
                { token: "without", prob: 0.4, children: [] },
              ],
            },
            { token: "home", prob: 0.1, children: [] },
          ],
        },
        {
          token: "knew",
          prob: 0.25,
          children: [
            {
              token: "the",
              prob: 0.4,
              children: [
                {
                  token: "truth",
                  prob: 0.5,
                  children: [
                    { token: "about", prob: 0.6, children: [] },
                    { token: "behind", prob: 0.4, children: [] },
                  ],
                },
                {
                  token: "answer",
                  prob: 0.3,
                  children: [
                    { token: "before", prob: 0.5, children: [] },
                    { token: "already", prob: 0.5, children: [] },
                  ],
                },
                { token: "secret", prob: 0.2, children: [] },
              ],
            },
            {
              token: "that",
              prob: 0.35,
              children: [
                {
                  token: "something",
                  prob: 0.4,
                  children: [
                    { token: "was", prob: 0.7, children: [] },
                    { token: "had", prob: 0.3, children: [] },
                  ],
                },
                { token: "the", prob: 0.35, children: [] },
                { token: "it", prob: 0.25, children: [] },
              ],
            },
            { token: "everything", prob: 0.15, children: [] },
            { token: "nothing", prob: 0.1, children: [] },
          ],
        },
        {
          token: "looked",
          prob: 0.2,
          children: [
            {
              token: "at",
              prob: 0.45,
              children: [
                {
                  token: "the",
                  prob: 0.6,
                  children: [
                    { token: "sky", prob: 0.4, children: [] },
                    { token: "stars", prob: 0.35, children: [] },
                    { token: "map", prob: 0.25, children: [] },
                  ],
                },
                { token: "him", prob: 0.25, children: [] },
                { token: "her", prob: 0.15, children: [] },
              ],
            },
            {
              token: "up",
              prob: 0.3,
              children: [
                { token: "and", prob: 0.5, children: [] },
                { token: "at", prob: 0.3, children: [] },
                { token: "slowly", prob: 0.2, children: [] },
              ],
            },
            { token: "away", prob: 0.25, children: [] },
          ],
        },
        {
          token: "said",
          prob: 0.15,
          children: [
            {
              token: "nothing",
              prob: 0.4,
              children: [
                { token: "and", prob: 0.5, children: [] },
                { token: "but", prob: 0.5, children: [] },
              ],
            },
            { token: "quietly", prob: 0.35, children: [] },
            { token: "softly", prob: 0.25, children: [] },
          ],
        },
        {
          token: "never",
          prob: 0.1,
          children: [
            {
              token: "looked",
              prob: 0.4,
              children: [
                { token: "back", prob: 0.7, children: [] },
                { token: "away", prob: 0.3, children: [] },
              ],
            },
            { token: "spoke", prob: 0.35, children: [] },
            { token: "returned", prob: 0.25, children: [] },
          ],
        },
      ],
    },
  },
];

/* ── Flatten tree into indexed nodes ── */

function flattenTree(tree: TreeNode): FlatNode[] {
  const nodes: FlatNode[] = [];
  let nextId = 0;

  function walk(node: TreeNode, depth: number, parentId: number | null, cumProb: number): number {
    const id = nextId++;
    const cum = cumProb * node.prob;
    const flat: FlatNode = {
      id,
      token: node.token,
      prob: node.prob,
      depth,
      parentId,
      childIds: [],
      cumProb: cum,
    };
    nodes.push(flat);

    for (const child of node.children) {
      const childId = walk(child, depth + 1, id, cum);
      flat.childIds.push(childId);
    }
    return id;
  }

  walk(tree, 0, null, 1.0);
  return nodes;
}

/* ── Get max depth of the tree ── */

function getMaxDepth(nodes: FlatNode[]): number {
  let max = 0;
  for (const n of nodes) {
    if (n.depth > max) max = n.depth;
  }
  return max;
}

/* ── Theme colors ── */

interface ThemeColors {
  bg: string;
  accent: string;
  text: string;
  textDim: string;
  textVeryDim: string;
  edge: string;
  edgeDim: string;
  nodeBg: string;
  nodeBorder: string;
  pruneStrike: string;
}

function getThemeColors(): ThemeColors {
  const isDark = getTheme() === "dark";
  if (isDark) {
    return {
      bg: "#0a0a0a",
      accent: "#d4ff00",
      text: "rgba(224,226,220,0.85)",
      textDim: "rgba(224,226,220,0.45)",
      textVeryDim: "rgba(224,226,220,0.2)",
      edge: "rgba(224,226,220,0.25)",
      edgeDim: "rgba(224,226,220,0.08)",
      nodeBg: "rgba(224,226,220,0.04)",
      nodeBorder: "rgba(224,226,220,0.12)",
      pruneStrike: "rgba(224,226,220,0.25)",
    };
  }
  return {
    bg: "#f5f1e8",
    accent: "#2a8a0e",
    text: "rgba(10,10,10,0.85)",
    textDim: "rgba(10,10,10,0.45)",
    textVeryDim: "rgba(10,10,10,0.2)",
    edge: "rgba(10,10,10,0.2)",
    edgeDim: "rgba(10,10,10,0.06)",
    nodeBg: "rgba(10,10,10,0.03)",
    nodeBorder: "rgba(10,10,10,0.1)",
    pruneStrike: "rgba(10,10,10,0.2)",
  };
}

/* ── Easing ── */

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/* ── Layout computation ── */

function computeLayout(
  nodes: FlatNode[],
  canvasW: number,
  canvasH: number,
  maxDepth: number,
): LayoutNode[] {
  const paddingLeft = 80;
  const paddingRight = 40;
  const paddingTop = 100; // clear 48px navbar + stats
  const paddingBottom = 100; // clear footer
  const usableW = canvasW - paddingLeft - paddingRight;
  const usableH = canvasH - paddingTop - paddingBottom;
  const levelSpacing = maxDepth > 0 ? usableW / maxDepth : usableW;

  // Group nodes by depth
  const byDepth = new Map<number, FlatNode[]>();
  for (const n of nodes) {
    const arr = byDepth.get(n.depth);
    if (arr) {
      arr.push(n);
    } else {
      byDepth.set(n.depth, [n]);
    }
  }

  const layout: LayoutNode[] = [];
  const layoutMap = new Map<number, LayoutNode>();

  for (const n of nodes) {
    const depthNodes = byDepth.get(n.depth);
    const count = depthNodes ? depthNodes.length : 1;
    const idx = depthNodes ? depthNodes.indexOf(n) : 0;
    const x = paddingLeft + n.depth * levelSpacing;
    const vertSpacing = count > 1 ? usableH / (count - 1) : 0;
    const y = count > 1 ? paddingTop + idx * vertSpacing : paddingTop + usableH / 2;

    const ln: LayoutNode = {
      ...n,
      x,
      y,
      scaleAnim: 0,
      labelAnim: 0,
      alive: true,
      pruneAnim: 0,
      winning: false,
      winAnim: 0,
    };
    layout.push(ln);
    layoutMap.set(n.id, ln);
  }

  return layout;
}

/* ── Node dimensions ── */

const NODE_H = 28;
const NODE_RADIUS = 5;
const FONT_SIZE = 10;

/* ── Draw a single node ── */

function drawNode(ctx: CanvasRenderingContext2D, node: LayoutNode, theme: ThemeColors): void {
  const scale = easeOutCubic(node.scaleAnim);
  if (scale < 0.01) return;

  const labelText = node.token + " " + node.prob.toFixed(2);
  ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;
  const textW = ctx.measureText(labelText).width;
  const nodeW = textW + 16;
  const halfW = nodeW / 2;
  const halfH = NODE_H / 2;

  ctx.save();
  ctx.translate(node.x, node.y);
  ctx.scale(scale, scale);

  // Determine opacity
  const baseAlpha = node.alive ? 1.0 : Math.max(0.15, 1.0 - node.pruneAnim * 0.85);

  // Node background
  ctx.globalAlpha = baseAlpha;
  ctx.beginPath();
  ctx.roundRect(-halfW, -halfH, nodeW, NODE_H, NODE_RADIUS);

  if (node.winning && node.winAnim > 0) {
    // Winning glow
    const glowAlpha = node.winAnim * 0.2;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = glowAlpha;
    ctx.fill();
    ctx.globalAlpha = baseAlpha;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (node.alive) {
    ctx.fillStyle = theme.nodeBg;
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillStyle = theme.nodeBg;
    ctx.fill();
    ctx.strokeStyle = theme.nodeBorder;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Label text
  const labelAlpha = easeOutCubic(node.labelAnim) * baseAlpha;
  ctx.globalAlpha = labelAlpha;
  ctx.fillStyle = node.alive ? theme.text : theme.textDim;
  if (node.winning && node.winAnim > 0) {
    ctx.fillStyle = theme.accent;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelText, 0, 1);

  // Strikethrough for pruned
  if (!node.alive && node.pruneAnim > 0.3) {
    ctx.globalAlpha = ((node.pruneAnim - 0.3) / 0.7) * baseAlpha;
    ctx.strokeStyle = theme.pruneStrike;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, 1);
    ctx.lineTo(halfW - 4, 1);
    ctx.stroke();
  }

  ctx.restore();
}

/* ── Draw edge between nodes ── */

function drawEdge(
  ctx: CanvasRenderingContext2D,
  parent: LayoutNode,
  child: LayoutNode,
  theme: ThemeColors,
): void {
  if (child.scaleAnim < 0.01) return;

  const alive = parent.alive && child.alive;
  const winning = parent.winning && child.winning;
  const baseAlpha = alive ? 0.6 : Math.max(0.08, 0.6 * (1 - child.pruneAnim * 0.85));

  ctx.save();
  ctx.globalAlpha = baseAlpha * easeOutCubic(child.scaleAnim);

  // Get node widths for edge endpoints
  ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;
  const parentLabel = parent.token + " " + parent.prob.toFixed(2);
  const childLabel = child.token + " " + child.prob.toFixed(2);
  const parentHalfW = (ctx.measureText(parentLabel).width + 16) / 2;
  const childHalfW = (ctx.measureText(childLabel).width + 16) / 2;

  const x0 = parent.x + parentHalfW * easeOutCubic(parent.scaleAnim);
  const y0 = parent.y;
  const x1 = child.x - childHalfW * easeOutCubic(child.scaleAnim);
  const y1 = child.y;

  const cpx = (x0 + x1) / 2;

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);

  if (winning && child.winAnim > 0) {
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = child.winAnim * 0.8;
  } else if (alive) {
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 1;
  } else {
    ctx.strokeStyle = theme.edgeDim;
    ctx.lineWidth = 0.5;
  }

  ctx.stroke();
  ctx.restore();
}

/* ── Component ── */

export function BeamSearch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Simulation state refs
  const layoutRef = useRef<LayoutNode[]>([]);
  const flatRef = useRef<FlatNode[]>([]);
  const maxDepthRef = useRef(0);
  const promptIdxRef = useRef(0);
  const beamWidthRef = useRef(3);
  const speedRef = useRef(1);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);

  // Animation timeline
  const phaseRef = useRef<"idle" | "expand" | "score" | "prune" | "advance" | "win" | "reset">(
    "idle",
  );
  const phaseStartRef = useRef(0);
  const currentDepthRef = useRef(0);
  /** Set of node IDs that are active beams at the current depth */
  const activeBeamsRef = useRef<Set<number>>(new Set());
  /** Best completed sequence info */
  const bestSeqRef = useRef<{ tokens: string[]; prob: number }>({ tokens: [], prob: 0 });
  /** Current prompt text */
  const currentPromptRef = useRef("");

  // React state for controls
  const [beamWidth, setBeamWidth] = useState(3);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  // Stats state
  const [statsPrompt, setStatsPrompt] = useState("");
  const [statsBeamWidth, setStatsBeamWidth] = useState(3);
  const [statsActiveBeams, setStatsActiveBeams] = useState(0);
  const [statsBestSeq, setStatsBestSeq] = useState("");
  const [statsBestProb, setStatsBestProb] = useState(0);

  /* ── Initialize a new prompt ── */
  const initPrompt = useCallback((idx: number) => {
    const data = PROMPTS[idx % PROMPTS.length];
    const flat = flattenTree(data.tree);
    const md = getMaxDepth(flat);

    flatRef.current = flat;
    maxDepthRef.current = md;
    currentPromptRef.current = data.prompt;

    // Reset all animation state
    phaseRef.current = "idle";
    currentDepthRef.current = 0;
    activeBeamsRef.current = new Set([0]); // root is always active
    bestSeqRef.current = { tokens: [data.prompt], prob: 1.0 };

    setStatsPrompt(data.prompt);
    setStatsBestSeq(data.prompt);
    setStatsBestProb(1.0);
    setStatsActiveBeams(1);
  }, []);

  /* ── Build layout from flat nodes and canvas size ── */
  const rebuildLayout = useCallback((canvasW: number, canvasH: number) => {
    const flat = flatRef.current;
    const md = maxDepthRef.current;
    if (flat.length === 0) return;

    const newLayout = computeLayout(flat, canvasW, canvasH, md);

    // Preserve existing animation state where possible
    const oldMap = new Map<number, LayoutNode>();
    for (const ln of layoutRef.current) {
      oldMap.set(ln.id, ln);
    }
    for (const ln of newLayout) {
      const old = oldMap.get(ln.id);
      if (old) {
        ln.scaleAnim = old.scaleAnim;
        ln.labelAnim = old.labelAnim;
        ln.alive = old.alive;
        ln.pruneAnim = old.pruneAnim;
        ln.winning = old.winning;
        ln.winAnim = old.winAnim;
      }
    }

    layoutRef.current = newLayout;
  }, []);

  /* ── Reset to a new prompt ── */
  const resetToNextPrompt = useCallback(() => {
    promptIdxRef.current = (promptIdxRef.current + 1) % PROMPTS.length;
    initPrompt(promptIdxRef.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      rebuildLayout(rect.width, rect.height);
    }
    // Start the expansion phase for depth 1
    phaseRef.current = "expand";
    phaseStartRef.current = performance.now();
    currentDepthRef.current = 1;
  }, [initPrompt, rebuildLayout]);

  /* ── Get the sequence of tokens from root to a given node ── */
  const getSequence = useCallback((nodeId: number): string[] => {
    const flat = flatRef.current;
    const tokens: string[] = [];
    let current: FlatNode | undefined = flat[nodeId];
    while (current) {
      tokens.unshift(current.token);
      current = current.parentId !== null ? flat[current.parentId] : undefined;
    }
    return tokens;
  }, []);

  /* ── Keyboard handlers ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetToNextPrompt();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetToNextPrompt]);

  /* ── Main effect: canvas + render loop + simulation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    reducedRef.current = prefersReducedMotion();
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildLayout(rect.width, rect.height);
    }

    resize();

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);

    // Initialize first prompt
    initPrompt(0);
    resize();

    // Start expanding from depth 1
    phaseRef.current = "expand";
    phaseStartRef.current = performance.now();
    currentDepthRef.current = 1;

    // Root node is always visible
    const rootLayout = layoutRef.current[0];
    if (rootLayout) {
      rootLayout.scaleAnim = 1;
      rootLayout.labelAnim = 1;
      rootLayout.alive = true;
    }

    /* ── The per-level timing (ms) ── */
    const BASE_LEVEL_TIME = 1200;
    const EXPAND_FRAC = 0.3;
    const SCORE_FRAC = 0.25;
    const PRUNE_FRAC = 0.25;
    const ADVANCE_FRAC = 0.2;
    const WIN_DURATION = 3000;
    const RESET_DURATION = 800;

    function frame(now: number) {
      rafRef.current = requestAnimationFrame(frame);
      if (!canvas || !ctx) return;

      const theme = getThemeColors();
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w, h);

      const layout = layoutRef.current;
      if (layout.length === 0) return;

      const currentSpeed = speedRef.current;
      const levelTime = BASE_LEVEL_TIME / currentSpeed;
      const phase = phaseRef.current;
      const elapsed = now - phaseStartRef.current;
      const depth = currentDepthRef.current;
      const bw = beamWidthRef.current;
      const isPaused = pausedRef.current;

      /* ── Simulation step (unless paused) ── */
      if (!isPaused) {
        const nodesAtDepth = layout.filter((n) => n.depth === depth);
        // Which nodes at current depth have an active parent?
        const activeParents = activeBeamsRef.current;
        const candidatesAtDepth = nodesAtDepth.filter(
          (n) => n.parentId !== null && activeParents.has(n.parentId),
        );

        if (phase === "expand") {
          // Animate scale-in of nodes at current depth
          const expandTime = levelTime * EXPAND_FRAC;
          const progress = Math.min(1, elapsed / expandTime);
          for (const n of candidatesAtDepth) {
            n.scaleAnim = progress;
          }
          if (progress >= 1) {
            phaseRef.current = "score";
            phaseStartRef.current = now;
          }
        } else if (phase === "score") {
          // Animate labels fading in
          const scoreTime = levelTime * SCORE_FRAC;
          const progress = Math.min(1, elapsed / scoreTime);
          for (const n of candidatesAtDepth) {
            n.labelAnim = progress;
          }
          if (progress >= 1) {
            phaseRef.current = "prune";
            phaseStartRef.current = now;

            // Determine which beams survive: sort candidates by cumProb, keep top bw
            const sorted = [...candidatesAtDepth].sort((a, b) => b.cumProb - a.cumProb);
            const survivors = new Set<number>();
            for (let i = 0; i < Math.min(bw, sorted.length); i++) {
              survivors.add(sorted[i].id);
            }

            // Mark non-survivors as not alive
            for (const n of candidatesAtDepth) {
              if (!survivors.has(n.id)) {
                n.alive = false;
              }
            }

            // Update active beams set
            activeBeamsRef.current = survivors;
            setStatsActiveBeams(survivors.size);

            // Update best sequence
            if (sorted.length > 0) {
              const bestNode = sorted[0];
              const seq = getSequence(bestNode.id);
              bestSeqRef.current = { tokens: seq, prob: bestNode.cumProb };
              setStatsBestSeq(seq.join(" "));
              setStatsBestProb(bestNode.cumProb);
            }
          }
        } else if (phase === "prune") {
          // Animate pruned nodes dimming
          const pruneTime = levelTime * PRUNE_FRAC;
          const progress = Math.min(1, elapsed / pruneTime);
          for (const n of candidatesAtDepth) {
            if (!n.alive) {
              n.pruneAnim = progress;
            }
          }
          if (progress >= 1) {
            phaseRef.current = "advance";
            phaseStartRef.current = now;
          }
        } else if (phase === "advance") {
          const advanceTime = levelTime * ADVANCE_FRAC;
          const progress = Math.min(1, elapsed / advanceTime);
          if (progress >= 1) {
            const nextDepth = depth + 1;
            // Check if there are nodes at the next depth with active parents
            const nextNodes = layout.filter(
              (n) =>
                n.depth === nextDepth &&
                n.parentId !== null &&
                activeBeamsRef.current.has(n.parentId),
            );

            if (nextNodes.length === 0 || nextDepth > maxDepthRef.current) {
              // Done. Highlight winning path.
              phaseRef.current = "win";
              phaseStartRef.current = now;

              // Find the best leaf among active beams
              const activeIds = activeBeamsRef.current;
              let bestId = -1;
              let bestProb = -1;
              for (const id of activeIds) {
                const n = layout[id];
                if (n && n.cumProb > bestProb) {
                  bestProb = n.cumProb;
                  bestId = n.id;
                }
              }

              // Mark winning path
              if (bestId >= 0) {
                let current = bestId;
                while (current >= 0) {
                  const ln = layout[current];
                  if (ln) {
                    ln.winning = true;
                  }
                  const flat = flatRef.current[current];
                  current = flat && flat.parentId !== null ? flat.parentId : -1;
                }
              }
            } else {
              currentDepthRef.current = nextDepth;
              phaseRef.current = "expand";
              phaseStartRef.current = now;
            }
          }
        } else if (phase === "win") {
          // Animate winning path glow
          const progress = Math.min(1, elapsed / WIN_DURATION);
          const glowT = Math.min(1, progress * 3); // glow in first third
          for (const n of layout) {
            if (n.winning) {
              n.winAnim = easeOutCubic(Math.min(1, glowT));
            }
          }
          if (progress >= 1) {
            phaseRef.current = "reset";
            phaseStartRef.current = now;
          }
        } else if (phase === "reset") {
          const progress = Math.min(1, elapsed / RESET_DURATION);
          // Fade everything out
          for (const n of layout) {
            if (n.scaleAnim > 0) {
              n.scaleAnim = Math.max(0, 1 - progress);
            }
          }
          if (progress >= 1) {
            resetToNextPrompt();
          }
        }
      }

      /* ── Draw edges ── */
      for (const node of layout) {
        if (node.parentId === null) continue;
        const parent = layout[node.parentId];
        if (!parent) continue;
        drawEdge(ctx, parent, node, theme);
      }

      /* ── Draw nodes ── */
      for (const node of layout) {
        if (node.scaleAnim < 0.01) continue;
        drawNode(ctx, node, theme);
      }
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [initPrompt, rebuildLayout, getSequence, resetToNextPrompt]);

  /* ── Sync React state to refs ── */
  useEffect(() => {
    beamWidthRef.current = beamWidth;
    setStatsBeamWidth(beamWidth);
  }, [beamWidth]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* ── Handle beam width change: reset the current run ── */
  const handleBeamChange = useCallback(
    (bw: number) => {
      setBeamWidth(bw);
      beamWidthRef.current = bw;
      // Reset the current prompt to replay with new beam width
      initPrompt(promptIdxRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        rebuildLayout(rect.width, rect.height);
      }
      // Re-show root
      const rootLayout = layoutRef.current[0];
      if (rootLayout) {
        rootLayout.scaleAnim = 1;
        rootLayout.labelAnim = 1;
        rootLayout.alive = true;
      }
      phaseRef.current = "expand";
      phaseStartRef.current = performance.now();
      currentDepthRef.current = 1;
    },
    [initPrompt, rebuildLayout],
  );

  const handleReset = useCallback(() => {
    promptIdxRef.current = (promptIdxRef.current + 1) % PROMPTS.length;
    initPrompt(promptIdxRef.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      rebuildLayout(rect.width, rect.height);
    }
    const rootLayout = layoutRef.current[0];
    if (rootLayout) {
      rootLayout.scaleAnim = 1;
      rootLayout.labelAnim = 1;
      rootLayout.alive = true;
    }
    phaseRef.current = "expand";
    phaseStartRef.current = performance.now();
    currentDepthRef.current = 1;
  }, [initPrompt, rebuildLayout]);

  const handlePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);

  const beamOptions = [1, 2, 3, 5];

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* ── Stats overlay (top-left) ── */}
      <div className="fixed left-4 top-16 z-10 flex flex-col gap-1 rounded bg-background/80 px-3 py-2 backdrop-blur-sm">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
          prompt
        </div>
        <div className="font-mono text-[11px] text-foreground/70">&quot;{statsPrompt}&quot;</div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
          beam width
        </div>
        <div className="font-mono text-[11px] text-foreground/70">
          {statsBeamWidth === 1 ? "1 (greedy)" : statsBeamWidth}
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
          active beams
        </div>
        <div className="font-mono text-[11px] text-foreground/70">{statsActiveBeams}</div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
          best sequence
        </div>
        <div className="max-w-[200px] font-mono text-[11px] leading-tight text-foreground/70">
          {statsBestSeq}
        </div>
        <div className="font-mono text-[9px] text-foreground/30">p={statsBestProb.toFixed(4)}</div>
      </div>

      {/* ── Controls overlay (top-right) ── */}
      <div className="fixed right-4 top-16 z-10 flex flex-col gap-2 rounded bg-background/80 px-3 py-2 backdrop-blur-sm">
        {/* Beam width buttons */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
            beam width
          </div>
          <div className="mt-1 flex gap-1">
            {beamOptions.map((bw) => (
              <button
                key={bw}
                onClick={() => handleBeamChange(bw)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors ${
                  beamWidth === bw
                    ? "bg-foreground/10 text-foreground/80"
                    : "text-foreground/30 hover:text-foreground/50"
                }`}
              >
                {bw === 1 ? "1" : bw}
              </button>
            ))}
          </div>
          {beamWidth === 1 && (
            <div className="mt-0.5 font-mono text-[8px] text-foreground/25">greedy</div>
          )}
        </div>

        {/* Speed slider */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
            speed
          </div>
          <div className="mt-1 flex items-center gap-1">
            <input
              type="range"
              min={1}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="h-1 w-16 cursor-pointer accent-foreground/40"
            />
            <span className="w-6 font-mono text-[9px] text-foreground/30">{speed}x</span>
          </div>
        </div>

        {/* Pause / Reset */}
        <div className="flex gap-1">
          <button
            onClick={handlePause}
            className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/40 transition-colors hover:text-foreground/70"
          >
            {paused ? "play" : "pause"}
          </button>
          <button
            onClick={handleReset}
            className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/40 transition-colors hover:text-foreground/70"
          >
            reset
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="flex gap-2 border-t border-foreground/5 pt-1">
          <span className="font-mono text-[8px] text-foreground/20">space=pause</span>
          <span className="font-mono text-[8px] text-foreground/20">r=reset</span>
        </div>
      </div>
    </>
  );
}
