"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   Wavelet tree data structures
   ──────────────────────────────────────────── */

interface WTNode {
  bitvector: number[];
  chars: string[];
  alphabetLeft: string[];
  alphabetRight: string[];
  label: string;
  left: WTNode | null;
  right: WTNode | null;
  isLeaf: boolean;
  leafChar: string | null;
}

interface QueryStep {
  nodeIndex: number;
  position: number;
  counted: number;
  side: "left" | "right" | "done";
  highlightBits: number;
}

const PRESET_STRINGS = ["abracadabra", "mississippi", "tobeornottobe", "abcabcabc"];

/* ────────────────────────────────────────────
   Build the wavelet tree
   ──────────────────────────────────────────── */

function buildWaveletTree(chars: string[], alphabet: string[]): WTNode {
  if (alphabet.length <= 1) {
    return {
      bitvector: [],
      chars,
      alphabetLeft: [],
      alphabetRight: [],
      label: alphabet[0] ?? "",
      left: null,
      right: null,
      isLeaf: true,
      leafChar: alphabet[0] ?? null,
    };
  }

  const mid = Math.floor(alphabet.length / 2);
  const leftAlpha = alphabet.slice(0, mid);
  const rightAlpha = alphabet.slice(mid);
  const leftSet = new Set(leftAlpha);

  const bitvector: number[] = [];
  const leftChars: string[] = [];
  const rightChars: string[] = [];

  for (const c of chars) {
    if (leftSet.has(c)) {
      bitvector.push(0);
      leftChars.push(c);
    } else {
      bitvector.push(1);
      rightChars.push(c);
    }
  }

  const label = alphabet.join(" ");

  return {
    bitvector,
    chars,
    alphabetLeft: leftAlpha,
    alphabetRight: rightAlpha,
    label,
    left: leftAlpha.length > 0 ? buildWaveletTree(leftChars, leftAlpha) : null,
    right: rightAlpha.length > 0 ? buildWaveletTree(rightChars, rightAlpha) : null,
    isLeaf: false,
    leafChar: null,
  };
}

/* ────────────────────────────────────────────
   Flatten tree into array for layout
   ──────────────────────────────────────────── */

interface FlatNode {
  node: WTNode;
  depth: number;
  parentIndex: number | null;
  isLeftChild: boolean;
}

function flattenTree(root: WTNode): FlatNode[] {
  const result: FlatNode[] = [];
  function walk(node: WTNode, depth: number, parentIndex: number | null, isLeft: boolean) {
    const idx = result.length;
    result.push({ node, depth, parentIndex, isLeftChild: isLeft });
    if (node.left) walk(node.left, depth + 1, idx, true);
    if (node.right) walk(node.right, depth + 1, idx, false);
  }
  walk(root, 0, null, false);
  return result;
}

/* ────────────────────────────────────────────
   Rank query steps
   ──────────────────────────────────────────── */

function computeRankSteps(flatNodes: FlatNode[], queryChar: string, queryPos: number): QueryStep[] {
  const steps: QueryStep[] = [];
  let currentNodeIndex = 0;
  let currentPos = queryPos;

  while (currentNodeIndex < flatNodes.length) {
    const flat = flatNodes[currentNodeIndex];
    const node = flat.node;

    if (node.isLeaf) {
      steps.push({
        nodeIndex: currentNodeIndex,
        position: currentPos,
        counted: currentPos + 1,
        side: "done",
        highlightBits: 0,
      });
      break;
    }

    const leftSet = new Set(node.alphabetLeft);
    const goLeft = leftSet.has(queryChar);
    const targetBit = goLeft ? 0 : 1;

    let count = 0;
    for (let i = 0; i <= currentPos && i < node.bitvector.length; i++) {
      if (node.bitvector[i] === targetBit) count++;
    }

    steps.push({
      nodeIndex: currentNodeIndex,
      position: currentPos,
      counted: count,
      side: goLeft ? "left" : "right",
      highlightBits: currentPos + 1,
    });

    const newPos = count - 1;

    // Find child index in flat array
    let childIndex = -1;
    for (let i = currentNodeIndex + 1; i < flatNodes.length; i++) {
      if (flatNodes[i].parentIndex === currentNodeIndex) {
        if (goLeft && flatNodes[i].isLeftChild) {
          childIndex = i;
          break;
        }
        if (!goLeft && !flatNodes[i].isLeftChild) {
          childIndex = i;
          break;
        }
      }
    }

    if (childIndex === -1) {
      // Reached a missing child, shouldn't happen with valid input
      break;
    }

    currentNodeIndex = childIndex;
    currentPos = newPos;
  }

  return steps;
}

/* ────────────────────────────────────────────
   Theme
   ──────────────────────────────────────────── */

interface ThemeColors {
  bg: string;
  stroke: string;
  text: string;
  muted: string;
  accent: string;
  accentDim: string;
}

function getThemeColors(): ThemeColors {
  const isDark = getTheme() === "dark";
  if (isDark) {
    return {
      bg: "#0a0a0a",
      stroke: "rgba(224,226,220,0.15)",
      text: "rgba(224,226,220,0.8)",
      muted: "rgba(224,226,220,0.3)",
      accent: "#d4ff00",
      accentDim: "rgba(212,255,0,0.3)",
    };
  }
  return {
    bg: "#f5f1e8",
    stroke: "rgba(10,10,10,0.12)",
    text: "rgba(10,10,10,0.8)",
    muted: "rgba(10,10,10,0.3)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.3)",
  };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function WaveletTree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const speedRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const animatingRef = useRef(false);

  // Data state stored in refs for render loop
  const sourceStringRef = useRef("abracadabra");
  const treeRef = useRef<WTNode | null>(null);
  const flatNodesRef = useRef<FlatNode[]>([]);
  const queryCharRef = useRef<string | null>(null);
  const queryPosRef = useRef(0);

  // Animation state
  const activeStepsRef = useRef<QueryStep[]>([]);
  const currentStepRef = useRef(-1);
  const resultRef = useRef<number | null>(null);

  // React state for UI controls
  const [_sourceString, setSourceString] = useState("abracadabra");
  const [queryChar, setQueryChar] = useState<string | null>(null);
  const [queryPos, setQueryPos] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [uniqueChars, setUniqueChars] = useState<string[]>([]);
  const [resultDisplay, setResultDisplay] = useState<number | null>(null);

  /* ── Build tree from string ── */
  const rebuildTree = useCallback((str: string) => {
    const chars = str.split("");
    const alphabet = [...new Set(chars)].sort();
    const tree = buildWaveletTree(chars, alphabet);
    treeRef.current = tree;
    const flat = flattenTree(tree);
    flatNodesRef.current = flat;
    setUniqueChars(alphabet);

    // Reset query state
    queryCharRef.current = null;
    queryPosRef.current = 0;
    activeStepsRef.current = [];
    currentStepRef.current = -1;
    resultRef.current = null;
    setQueryChar(null);
    setQueryPos(0);
    setResultDisplay(null);
  }, []);

  /* ── Sleep helper ── */
  const sleep = useCallback((ms: number) => {
    const adjusted = ms / speedRef.current;
    return new Promise<void>((resolve) => setTimeout(resolve, adjusted));
  }, []);

  /* ── Run rank query animation ── */
  const runQuery = useCallback(async () => {
    if (animatingRef.current) return;
    const qc = queryCharRef.current;
    if (!qc) return;
    const qp = queryPosRef.current;
    const flat = flatNodesRef.current;
    if (flat.length === 0) return;

    animatingRef.current = true;
    setIsAnimating(true);
    setResultDisplay(null);
    resultRef.current = null;

    const steps = computeRankSteps(flat, qc, qp);
    activeStepsRef.current = steps;
    currentStepRef.current = -1;

    const reduced = reducedMotionRef.current;

    for (let i = 0; i < steps.length; i++) {
      currentStepRef.current = i;
      if (!reduced) {
        await sleep(400);
      }
    }

    // Show result
    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      const answer = lastStep.counted;
      resultRef.current = answer;
      setResultDisplay(answer);
    }

    if (!reduced) await sleep(600);

    animatingRef.current = false;
    setIsAnimating(false);
  }, [sleep]);

  /* ── Cycle through preset strings ── */
  const cycleString = useCallback(() => {
    if (animatingRef.current) return;
    const currentIdx = PRESET_STRINGS.indexOf(sourceStringRef.current);
    const nextIdx = (currentIdx + 1) % PRESET_STRINGS.length;
    const next = PRESET_STRINGS[nextIdx];
    sourceStringRef.current = next;
    setSourceString(next);
    rebuildTree(next);
  }, [rebuildTree]);

  /* ── Select query character ── */
  const selectChar = useCallback((c: string) => {
    if (animatingRef.current) return;
    queryCharRef.current = c;
    setQueryChar(c);
    activeStepsRef.current = [];
    currentStepRef.current = -1;
    resultRef.current = null;
    setResultDisplay(null);
  }, []);

  /* ── Select query position ── */
  const selectPos = useCallback((p: number) => {
    if (animatingRef.current) return;
    queryPosRef.current = p;
    setQueryPos(p);
    activeStepsRef.current = [];
    currentStepRef.current = -1;
    resultRef.current = null;
    setResultDisplay(null);
  }, []);

  /* ── Clear animation ── */
  const clearQuery = useCallback(() => {
    if (animatingRef.current) return;
    activeStepsRef.current = [];
    currentStepRef.current = -1;
    resultRef.current = null;
    setResultDisplay(null);
  }, []);

  /* ── Render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    reducedMotionRef.current = prefersReducedMotion();

    // Build initial tree
    rebuildTree(sourceStringRef.current);

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    resize();
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);

    function drawFrame() {
      if (!canvas || !ctx) return;
      rafRef.current = requestAnimationFrame(drawFrame);

      const theme = getThemeColors();
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, cw, ch);

      const flat = flatNodesRef.current;
      if (flat.length === 0) return;

      const str = sourceStringRef.current;
      const strLen = str.length;

      // ── Sizing ──
      // Calculate max bitvector length at any level for scaling
      const maxBvLen = Math.max(strLen, ...flat.map((f) => f.node.bitvector.length));
      const maxDepth = Math.max(...flat.map((f) => f.depth));

      // Adaptive cell sizing
      const maxCellW = 20;
      const maxCellH = 14;
      const cellGap = 2;
      const availW = cw * 0.85;
      const cellW = Math.min(maxCellW, Math.max(6, (availW - (maxBvLen - 1) * cellGap) / maxBvLen));
      const cellH = Math.min(maxCellH, cellW * 0.8);

      // Vertical layout
      const sourceY = 70;
      const sourceCharW = Math.min(22, (availW - (strLen - 1) * 2) / strLen);
      const sourceRowH = sourceCharW + 4;
      const treeStartY = sourceY + sourceRowH + 40;
      const levelH = cellH + 32;
      const treeH = (maxDepth + 1) * levelH;
      // If tree doesn't fit, scale levelH
      const maxTreeH = ch - treeStartY - 100;
      const scaledLevelH =
        treeH > maxTreeH ? Math.max(cellH + 18, maxTreeH / (maxDepth + 1)) : levelH;

      // Animation state
      const activeSteps = activeStepsRef.current;
      const currentStep = currentStepRef.current;
      const result = resultRef.current;

      // ── Draw source string ──
      const sourceStartX = (cw - (strLen * (sourceCharW + 2) - 2)) / 2;

      for (let i = 0; i < strLen; i++) {
        const x = sourceStartX + i * (sourceCharW + 2);
        const y = sourceY;

        // Highlight if this is the query position
        const qp = queryPosRef.current;
        const qc = queryCharRef.current;
        const isQueryPos = qc !== null && i === qp;
        const isQueryChar = qc !== null && str[i] === qc && i <= qp;

        if (isQueryPos && currentStep >= 0) {
          ctx.fillStyle = theme.accent;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x, y, sourceCharW, sourceCharW);
          ctx.globalAlpha = 1;
        } else if (isQueryChar && currentStep >= 0) {
          ctx.fillStyle = theme.accentDim;
          ctx.fillRect(x, y, sourceCharW, sourceCharW);
        }

        ctx.strokeStyle = isQueryPos ? theme.accent : theme.stroke;
        ctx.lineWidth = isQueryPos ? 1.5 : 0.5;
        ctx.strokeRect(x, y, sourceCharW, sourceCharW);

        ctx.fillStyle = isQueryPos ? theme.bg : theme.text;
        ctx.font = `${Math.min(13, sourceCharW * 0.65)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(str[i], x + sourceCharW / 2, y + sourceCharW / 2);
      }

      // Position indices below source string
      ctx.font = "8px monospace";
      ctx.fillStyle = theme.muted;
      ctx.textAlign = "center";
      for (let i = 0; i < strLen; i++) {
        const x = sourceStartX + i * (sourceCharW + 2) + sourceCharW / 2;
        ctx.fillText(String(i), x, sourceY + sourceCharW + 10);
      }

      // ── Label above source ──
      ctx.font = "9px monospace";
      ctx.fillStyle = theme.muted;
      ctx.textAlign = "center";
      ctx.fillText(`S = "${str}"`, cw / 2, sourceY - 12);

      // ── Compute node positions ──
      // Assign x positions: each node is centered relative to its bitvector width
      // Using a recursive approach: root is centered, children split the space
      interface NodeLayout {
        x: number;
        y: number;
        bvWidth: number;
      }
      const layouts = new Map<number, NodeLayout>();

      function layoutNode(idx: number, centerX: number, depth: number) {
        const f = flat[idx];
        const n = f.node;
        const bvLen = n.isLeaf ? 1 : n.bitvector.length;
        const bvWidth = bvLen * (cellW + cellGap) - cellGap;
        const y = treeStartY + depth * scaledLevelH;

        layouts.set(idx, { x: centerX, y, bvWidth });

        if (!n.isLeaf) {
          // Find children
          let leftChildIdx = -1;
          let rightChildIdx = -1;
          for (let i = idx + 1; i < flat.length; i++) {
            if (flat[i].parentIndex === idx) {
              if (flat[i].isLeftChild) leftChildIdx = i;
              else rightChildIdx = i;
            }
          }

          const leftBvLen =
            leftChildIdx >= 0
              ? flat[leftChildIdx].node.isLeaf
                ? 1
                : flat[leftChildIdx].node.bitvector.length
              : 0;
          const rightBvLen =
            rightChildIdx >= 0
              ? flat[rightChildIdx].node.isLeaf
                ? 1
                : flat[rightChildIdx].node.bitvector.length
              : 0;

          const leftBvW = leftBvLen * (cellW + cellGap) - cellGap;
          const rightBvW = rightBvLen * (cellW + cellGap) - cellGap;
          const spacing = Math.max(cellW * 2, 20);

          // Position children: left child to the left, right child to the right
          const totalChildrenW = leftBvW + spacing + rightBvW;
          const childrenStartX = centerX - totalChildrenW / 2;

          if (leftChildIdx >= 0) {
            layoutNode(leftChildIdx, childrenStartX + leftBvW / 2, depth + 1);
          }
          if (rightChildIdx >= 0) {
            layoutNode(rightChildIdx, childrenStartX + leftBvW + spacing + rightBvW / 2, depth + 1);
          }
        }
      }

      layoutNode(0, cw / 2, 0);

      // ── Draw edges ──
      for (let i = 0; i < flat.length; i++) {
        const f = flat[i];
        if (f.parentIndex === null) continue;
        const parentLayout = layouts.get(f.parentIndex);
        const childLayout = layouts.get(i);
        if (!parentLayout || !childLayout) continue;

        // Check if this edge is on the active query path
        let edgeActive = false;
        if (currentStep >= 0 && activeSteps.length > 0) {
          for (let s = 0; s <= currentStep && s < activeSteps.length; s++) {
            const step = activeSteps[s];
            if (step.nodeIndex === f.parentIndex) {
              // This parent is visited; check if child matches the side
              const nextStep = activeSteps[s + 1];
              if (nextStep && nextStep.nodeIndex === i) {
                edgeActive = true;
              }
            }
          }
        }

        ctx.beginPath();
        ctx.moveTo(parentLayout.x, parentLayout.y + cellH + 2);
        ctx.lineTo(childLayout.x, childLayout.y - 4);
        ctx.strokeStyle = edgeActive ? theme.accent : theme.stroke;
        ctx.lineWidth = edgeActive ? 1.5 : 0.5;
        ctx.globalAlpha = edgeActive ? 0.8 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ── Draw nodes ──
      for (let i = 0; i < flat.length; i++) {
        const f = flat[i];
        const n = f.node;
        const layout = layouts.get(i);
        if (!layout) continue;

        // Which animation step applies to this node?
        let nodeStep: QueryStep | null = null;
        let nodeStepIndex = -1;
        if (currentStep >= 0) {
          for (let s = 0; s <= currentStep && s < activeSteps.length; s++) {
            if (activeSteps[s].nodeIndex === i) {
              nodeStep = activeSteps[s];
              nodeStepIndex = s;
            }
          }
        }

        const isActiveNode = nodeStep !== null && nodeStepIndex === currentStep;

        if (n.isLeaf) {
          // Draw leaf as a single character cell
          const leafX = layout.x - cellW / 2;
          const leafY = layout.y;

          const isResult = nodeStep !== null && nodeStep.side === "done";

          if (isResult) {
            ctx.fillStyle = theme.accent;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(leafX, leafY, cellW, cellH);
            ctx.globalAlpha = 1;
          }

          ctx.strokeStyle = isResult ? theme.accent : theme.stroke;
          ctx.lineWidth = isResult ? 1.5 : 0.5;
          ctx.strokeRect(leafX, leafY, cellW, cellH);

          ctx.fillStyle = isResult ? theme.bg : theme.text;
          ctx.font = `${Math.min(11, cellW * 0.7)}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.leafChar ?? "", leafX + cellW / 2, leafY + cellH / 2);

          // Draw result count below leaf
          if (isResult && result !== null) {
            ctx.fillStyle = theme.accent;
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`rank = ${result}`, layout.x, leafY + cellH + 14);
          }
        } else {
          // Draw bitvector cells
          const bvLen = n.bitvector.length;
          const bvStartX = layout.x - layout.bvWidth / 2;

          for (let j = 0; j < bvLen; j++) {
            const cx = bvStartX + j * (cellW + cellGap);
            const cy = layout.y;
            const bit = n.bitvector[j];

            // Determine cell highlighting
            let cellHighlight: "none" | "scanned" | "counted" | "current" = "none";

            if (nodeStep !== null) {
              const targetBit = nodeStep.side === "left" ? 0 : 1;
              if (j < nodeStep.highlightBits) {
                cellHighlight = "scanned";
                if (bit === targetBit) {
                  cellHighlight = "counted";
                }
              }
              if (j === nodeStep.position) {
                cellHighlight = "current";
              }
            }

            // Fill
            if (cellHighlight === "current") {
              ctx.fillStyle = theme.accent;
              ctx.globalAlpha = 0.7;
              ctx.fillRect(cx, cy, cellW, cellH);
              ctx.globalAlpha = 1;
            } else if (cellHighlight === "counted") {
              ctx.fillStyle = theme.accent;
              ctx.globalAlpha = 0.4;
              ctx.fillRect(cx, cy, cellW, cellH);
              ctx.globalAlpha = 1;
            } else if (cellHighlight === "scanned") {
              ctx.fillStyle = theme.accentDim;
              ctx.globalAlpha = 0.3;
              ctx.fillRect(cx, cy, cellW, cellH);
              ctx.globalAlpha = 1;
            } else {
              // Default: dim fill for 1s, transparent for 0s
              if (bit === 1) {
                ctx.fillStyle = theme.stroke;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(cx, cy, cellW, cellH);
                ctx.globalAlpha = 1;
              }
            }

            // Border
            ctx.strokeStyle =
              cellHighlight === "current"
                ? theme.accent
                : cellHighlight !== "none"
                  ? theme.accent
                  : theme.stroke;
            ctx.lineWidth = cellHighlight === "current" ? 1.5 : 0.5;
            ctx.globalAlpha = cellHighlight !== "none" ? 0.8 : 0.4;
            ctx.strokeRect(cx, cy, cellW, cellH);
            ctx.globalAlpha = 1;

            // Bit text
            ctx.fillStyle = cellHighlight === "current" ? theme.bg : theme.text;
            ctx.font = `${Math.min(10, cellW * 0.6)}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = cellHighlight !== "none" ? 1 : 0.6;
            ctx.fillText(String(bit), cx + cellW / 2, cy + cellH / 2);
            ctx.globalAlpha = 1;
          }

          // Alphabet label below bitvector
          const labelY = layout.y + cellH + 10;
          ctx.font = "8px monospace";
          ctx.textAlign = "center";

          // Left label
          if (n.alphabetLeft.length > 0) {
            ctx.fillStyle = theme.muted;
            const leftLabel =
              n.alphabetLeft.length <= 4
                ? n.alphabetLeft.join(" ")
                : n.alphabetLeft.slice(0, 3).join(" ") + "..";
            const leftLabelX = layout.x - layout.bvWidth / 4;
            ctx.fillText(`0:${leftLabel}`, leftLabelX, labelY);
          }

          // Right label
          if (n.alphabetRight.length > 0) {
            ctx.fillStyle = theme.muted;
            const rightLabel =
              n.alphabetRight.length <= 4
                ? n.alphabetRight.join(" ")
                : n.alphabetRight.slice(0, 3).join(" ") + "..";
            const rightLabelX = layout.x + layout.bvWidth / 4;
            ctx.fillText(`1:${rightLabel}`, rightLabelX, labelY);
          }

          // Count label when animating
          if (isActiveNode && nodeStep) {
            ctx.fillStyle = theme.accent;
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            const countLabel =
              nodeStep.side === "left"
                ? `0-count: ${nodeStep.counted}`
                : `1-count: ${nodeStep.counted}`;
            ctx.fillText(countLabel, layout.x, layout.y - 8);
          }
        }
      }

      // ── Result overlay ──
      if (result !== null && queryCharRef.current) {
        ctx.fillStyle = theme.accent;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `rank("${queryCharRef.current}", ${queryPosRef.current}) = ${result}`,
          cw / 2,
          sourceY - 28,
        );
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);

    // Auto-run a rank query so the tree starts with an interesting result
    // rank('a', 7) in "abracadabra" = 4
    setTimeout(() => {
      queryCharRef.current = "a";
      queryPosRef.current = 7;
      setQueryChar("a");
      setQueryPos(7);
      // Give one frame for state to settle, then run
      setTimeout(() => runQuery(), 100);
    }, 500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [rebuildTree, runQuery]);

  /* ── Speed sync ── */
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /* ── Click handler for canvas (source string position selection) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleClick(e: MouseEvent) {
      if (!canvas || animatingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const str = sourceStringRef.current;
      const strLen = str.length;
      const availW = rect.width * 0.85;
      const sourceCharW = Math.min(22, (availW - (strLen - 1) * 2) / strLen);
      const sourceY = 70;
      const sourceStartX = (rect.width - (strLen * (sourceCharW + 2) - 2)) / 2;

      // Check if click is within source string area
      if (y >= sourceY && y <= sourceY + sourceCharW) {
        for (let i = 0; i < strLen; i++) {
          const cx = sourceStartX + i * (sourceCharW + 2);
          if (x >= cx && x <= cx + sourceCharW) {
            selectPos(i);
            return;
          }
        }
      }
    }

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [selectPos]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full cursor-pointer"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Controls overlay */}
      <div
        className="fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2"
        style={{
          background: "rgba(128,128,128,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "6px",
          padding: "8px 12px",
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        {/* Character buttons */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/30">
            char
          </span>
          {uniqueChars.map((c) => (
            <button
              key={c}
              onClick={() => selectChar(c)}
              disabled={isAnimating}
              className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider disabled:opacity-40 ${
                queryChar === c
                  ? "border-foreground/30 text-foreground/80"
                  : "border-foreground/10 text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Position display */}
        <span className="font-mono text-[9px] text-foreground/30">pos={queryPos}</span>

        {/* Query button */}
        <button
          onClick={runQuery}
          disabled={isAnimating || !queryChar}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          query
        </button>

        {/* Clear */}
        <button
          onClick={clearQuery}
          disabled={isAnimating}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          clear
        </button>

        {/* New string */}
        <button
          onClick={cycleString}
          disabled={isAnimating}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          new string
        </button>

        {/* Speed slider */}
        <div className="flex items-center gap-1">
          <label className="font-mono text-[9px] uppercase tracking-wider text-foreground/30">
            spd
          </label>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.25}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="h-1 w-14 cursor-pointer accent-foreground/40"
          />
          <span className="w-6 font-mono text-[9px] text-foreground/30">{speed}x</span>
        </div>

        {/* Result */}
        {resultDisplay !== null && queryChar && (
          <span className="font-mono text-[10px] text-foreground/60">
            rank({queryChar},{queryPos})={resultDisplay}
          </span>
        )}
      </div>
    </>
  );
}
