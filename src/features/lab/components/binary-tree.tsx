"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   AVL tree data structures
   ──────────────────────────────────────────── */

interface AVLNode {
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;
}

interface NodePos {
  x: number;
  y: number;
}

/* ────────────────────────────────────────────
   AVL tree operations (pure, returns new nodes)
   ──────────────────────────────────────────── */

function height(n: AVLNode | null): number {
  return n ? n.height : 0;
}

function balanceFactor(n: AVLNode | null): number {
  return n ? height(n.left) - height(n.right) : 0;
}

function updateHeight(n: AVLNode): AVLNode {
  return { ...n, height: 1 + Math.max(height(n.left), height(n.right)) };
}

function rotateRight(y: AVLNode): AVLNode {
  const x = y.left;
  if (!x) return y;
  const t2 = x.right;
  const newY = updateHeight({ ...y, left: t2 });
  return updateHeight({ ...x, right: newY });
}

function rotateLeft(x: AVLNode): AVLNode {
  const y = x.right;
  if (!y) return x;
  const t2 = y.left;
  const newX = updateHeight({ ...x, right: t2 });
  return updateHeight({ ...y, left: newX });
}

function insertAVL(root: AVLNode | null, value: number): AVLNode {
  if (!root) {
    return { value, left: null, right: null, height: 1 };
  }
  if (value < root.value) {
    root = { ...root, left: insertAVL(root.left, value) };
  } else if (value > root.value) {
    root = { ...root, right: insertAVL(root.right, value) };
  } else {
    return root; // duplicate
  }

  root = updateHeight(root);
  const bf = balanceFactor(root);

  // LL
  if (bf > 1 && root.left && value < root.left.value) {
    return rotateRight(root);
  }
  // RR
  if (bf < -1 && root.right && value > root.right.value) {
    return rotateLeft(root);
  }
  // LR
  if (bf > 1 && root.left && value > root.left.value) {
    root = { ...root, left: rotateLeft(root.left) };
    return rotateRight(root);
  }
  // RL
  if (bf < -1 && root.right && value < root.right.value) {
    root = { ...root, right: rotateRight(root.right) };
    return rotateLeft(root);
  }

  return root;
}

function containsValue(root: AVLNode | null, value: number): boolean {
  if (!root) return false;
  if (value === root.value) return true;
  return value < root.value ? containsValue(root.left, value) : containsValue(root.right, value);
}

function getSearchPath(root: AVLNode | null, value: number): number[] {
  const path: number[] = [];
  let node = root;
  while (node) {
    path.push(node.value);
    if (value < node.value) node = node.left;
    else if (value > node.value) node = node.right;
    else break;
  }
  return path;
}

/** Check where imbalance occurs and what rotation type */
function findImbalance(
  root: AVLNode | null,
  value: number,
): { node: number; rotationType: string } | null {
  if (!root) return null;

  // Recurse to the inserted side first
  let childResult: { node: number; rotationType: string } | null = null;
  if (value < root.value) {
    childResult = findImbalance(root.left, value);
  } else if (value > root.value) {
    childResult = findImbalance(root.right, value);
  }
  if (childResult) return childResult;

  const bf = balanceFactor(root);
  if (bf > 1 && root.left && value < root.left.value)
    return { node: root.value, rotationType: "LL" };
  if (bf < -1 && root.right && value > root.right.value)
    return { node: root.value, rotationType: "RR" };
  if (bf > 1 && root.left && value > root.left.value)
    return { node: root.value, rotationType: "LR" };
  if (bf < -1 && root.right && value < root.right.value)
    return { node: root.value, rotationType: "RL" };
  return null;
}

/** Insert without rebalancing (BST insert only) */
function insertBST(root: AVLNode | null, value: number): AVLNode {
  if (!root) return { value, left: null, right: null, height: 1 };
  if (value < root.value) {
    const newRoot = { ...root, left: insertBST(root.left, value) };
    return updateHeight(newRoot);
  } else if (value > root.value) {
    const newRoot = { ...root, right: insertBST(root.right, value) };
    return updateHeight(newRoot);
  }
  return root;
}

/* ────────────────────────────────────────────
   Layout: compute x,y positions for each node
   ──────────────────────────────────────────── */

function computePositions(
  root: AVLNode | null,
  canvasWidth: number,
  topY: number,
  levelGap: number,
): Map<number, NodePos> {
  const positions = new Map<number, NodePos>();
  if (!root) return positions;

  // In-order traversal to assign x-indices
  const inorder: number[] = [];
  function walk(n: AVLNode | null) {
    if (!n) return;
    walk(n.left);
    inorder.push(n.value);
    walk(n.right);
  }
  walk(root);

  const count = inorder.length;
  const padding = 40;
  const usableWidth = canvasWidth - padding * 2;
  const xStep = count > 1 ? usableWidth / (count - 1) : 0;

  const indexMap = new Map<number, number>();
  inorder.forEach((v, i) => indexMap.set(v, i));

  function assign(n: AVLNode | null, depth: number) {
    if (!n) return;
    const idx = indexMap.get(n.value) ?? 0;
    const x = count > 1 ? padding + idx * xStep : canvasWidth / 2;
    const y = topY + depth * levelGap;
    positions.set(n.value, { x, y });
    assign(n.left, depth + 1);
    assign(n.right, depth + 1);
  }
  assign(root, 0);

  return positions;
}

function collectValues(root: AVLNode | null): number[] {
  if (!root) return [];
  return [...collectValues(root.left), root.value, ...collectValues(root.right)];
}

/* ────────────────────────────────────────────
   Theme detection
   ──────────────────────────────────────────── */

interface ThemeColors {
  bg: string;
  nodeStroke: string;
  nodeText: string;
  edge: string;
  accent: string;
  accentDim: string;
  balanced: string;
}

function getThemeColors(): ThemeColors {
  const isDark = getTheme() === "dark";
  if (isDark) {
    return {
      bg: "#0a0a0a",
      nodeStroke: "rgba(224,226,220,0.15)",
      nodeText: "rgba(224,226,220,0.8)",
      edge: "rgba(224,226,220,0.2)",
      accent: "#d4ff00",
      accentDim: "rgba(212,255,0,0.3)",
      balanced: "#4ade80",
    };
  }
  return {
    bg: "#f5f1e8",
    nodeStroke: "rgba(10,10,10,0.12)",
    nodeText: "rgba(10,10,10,0.8)",
    edge: "rgba(10,10,10,0.15)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.3)",
    balanced: "#16a34a",
  };
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const NODE_RADIUS = 18;
const LEVEL_GAP = 60;
const TOP_Y = 80;
const INITIAL_VALUES = [40, 20, 60, 10, 30, 50];

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function BinaryTree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<AVLNode | null>(null);
  const positionsRef = useRef<Map<number, NodePos>>(new Map());
  const renderPosRef = useRef<Map<number, NodePos>>(new Map());
  const animatingRef = useRef(false);
  const autoRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);
  const speedRef = useRef(1);
  const reducedMotionRef = useRef(false);

  // Visual state for highlighting
  const highlightPathRef = useRef<Set<number>>(new Set());
  const newlyInsertedRef = useRef<number | null>(null);
  const imbalanceNodeRef = useRef<number | null>(null);
  const rotationLabelRef = useRef<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [nodeCount, setNodeCount] = useState(0);

  /* ── Initialize tree with seed values ── */
  const initTree = useCallback(() => {
    let root: AVLNode | null = null;
    for (const v of INITIAL_VALUES) {
      root = insertAVL(root, v);
    }
    treeRef.current = root;
    setNodeCount(INITIAL_VALUES.length);
    return root;
  }, []);

  /* ── Recalculate target positions ── */
  const recalcPositions = useCallback((root: AVLNode | null, w: number) => {
    const pos = computePositions(root, w, TOP_Y, LEVEL_GAP);
    positionsRef.current = pos;
    return pos;
  }, []);

  /* ── Snap render positions to targets (no animation) ── */
  const snapPositions = useCallback(() => {
    renderPosRef.current = new Map(positionsRef.current);
  }, []);

  /* ── Sleep helper ── */
  const sleep = useCallback((ms: number) => {
    const adjusted = ms / speedRef.current;
    return new Promise<void>((resolve) => setTimeout(resolve, adjusted));
  }, []);

  /* ── Animate insertion ── */
  const animateInsert = useCallback(
    async (value: number) => {
      const canvas = canvasRef.current;
      if (!canvas || animatingRef.current) return;
      if (containsValue(treeRef.current, value)) return;

      animatingRef.current = true;
      setIsAnimating(true);
      const w = canvas.width / (window.devicePixelRatio || 1);
      const reduced = reducedMotionRef.current;

      // Step 1: Show search path
      const path = getSearchPath(treeRef.current, value);
      if (!reduced) {
        for (let i = 0; i <= path.length; i++) {
          highlightPathRef.current = new Set(path.slice(0, i));
          await sleep(300 / Math.max(1, path.length));
        }
        await sleep(150);
      }

      // Check if rotation will happen
      const preInsertTree = insertBST(treeRef.current, value);
      const imbalance = findImbalance(treeRef.current, value);
      const prePositions = computePositions(preInsertTree, w, TOP_Y, LEVEL_GAP);

      // Step 2: BST insert (show node appearing)
      newlyInsertedRef.current = value;

      if (imbalance && !reduced) {
        // Show the BST-inserted state first (before rotation)
        treeRef.current = preInsertTree;
        positionsRef.current = prePositions;

        // Lerp into pre-rotation positions
        const lerpStart = new Map(renderPosRef.current);
        // Add new node position
        const newNodePos = prePositions.get(value);
        if (newNodePos) {
          lerpStart.set(value, newNodePos);
          renderPosRef.current.set(value, newNodePos);
        }
        await lerpPositions(lerpStart, prePositions, 300);
        await sleep(200);

        // Step 3: Flash imbalance
        imbalanceNodeRef.current = imbalance.node;
        rotationLabelRef.current = imbalance.rotationType;
        await sleep(400);

        // Step 4: Perform rotation and animate
        const beforeRotation = new Map(renderPosRef.current);
        const balanced = insertAVL(
          // Re-insert from the tree BEFORE the BST insert to get proper AVL
          (() => {
            // Rebuild from all values except the new one, then insert with AVL
            let r: AVLNode | null = null;
            for (const v of collectValues(treeRef.current)) {
              if (v !== value) r = insertAVL(r, v);
            }
            return r;
          })(),
          value,
        );
        treeRef.current = balanced;
        const afterPositions = computePositions(balanced, w, TOP_Y, LEVEL_GAP);
        positionsRef.current = afterPositions;

        imbalanceNodeRef.current = null;
        await lerpPositions(beforeRotation, afterPositions, 500);
        rotationLabelRef.current = null;
      } else {
        // No rotation needed, just insert with AVL (same result as BST insert here)
        const newTree = insertAVL(treeRef.current, value);
        treeRef.current = newTree;
        const newPositions = computePositions(newTree, w, TOP_Y, LEVEL_GAP);
        positionsRef.current = newPositions;

        if (!reduced) {
          const lerpStart = new Map(renderPosRef.current);
          const newNodePos = newPositions.get(value);
          if (newNodePos) {
            lerpStart.set(value, newNodePos);
            renderPosRef.current.set(value, newNodePos);
          }
          await lerpPositions(lerpStart, newPositions, 300);
        } else {
          snapPositions();
        }
      }

      // Settle
      if (!reduced) await sleep(200);
      highlightPathRef.current = new Set();
      newlyInsertedRef.current = null;
      imbalanceNodeRef.current = null;
      rotationLabelRef.current = null;
      snapPositions();

      setNodeCount(collectValues(treeRef.current).length);
      animatingRef.current = false;
      setIsAnimating(false);
    },
    [sleep, snapPositions],
  );

  /* ── Lerp positions over duration ── */
  const lerpPositions = useCallback(
    (from: Map<number, NodePos>, to: Map<number, NodePos>, durationMs: number) => {
      const adjusted = durationMs / speedRef.current;
      return new Promise<void>((resolve) => {
        const startTime = performance.now();
        function tick() {
          const elapsed = performance.now() - startTime;
          const t = Math.min(1, elapsed / adjusted);
          // Ease out cubic
          const eased = 1 - (1 - t) ** 3;

          const current = new Map<number, NodePos>();
          // Combine all keys from both maps
          const allKeys = new Set([...from.keys(), ...to.keys()]);
          for (const key of allKeys) {
            const f = from.get(key);
            const target = to.get(key);
            if (f && target) {
              current.set(key, {
                x: f.x + (target.x - f.x) * eased,
                y: f.y + (target.y - f.y) * eased,
              });
            } else if (target) {
              current.set(key, target);
            } else if (f) {
              current.set(key, f);
            }
          }
          renderPosRef.current = current;

          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            renderPosRef.current = new Map(to);
            resolve();
          }
        }
        requestAnimationFrame(tick);
      });
    },
    [],
  );

  /* ── Insert handler ── */
  const handleInsert = useCallback(
    (value: number) => {
      if (animatingRef.current) return;
      if (Number.isNaN(value) || value < 0 || value > 999) return;
      animateInsert(value);
    },
    [animateInsert],
  );

  /* ── Random insert ── */
  const handleRandom = useCallback(() => {
    if (animatingRef.current) return;
    const existing = collectValues(treeRef.current);
    const available: number[] = [];
    for (let i = 1; i <= 99; i++) {
      if (!existing.includes(i)) available.push(i);
    }
    if (available.length === 0) return;
    const value = available[Math.floor(Math.random() * available.length)];
    animateInsert(value);
  }, [animateInsert]);

  /* ── Auto insert toggle ── */
  const toggleAuto = useCallback(() => {
    if (autoRef.current) {
      autoRef.current = false;
      setIsAuto(false);
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    } else {
      autoRef.current = true;
      setIsAuto(true);
      function autoStep() {
        if (!autoRef.current) return;
        if (animatingRef.current) {
          autoTimerRef.current = setTimeout(autoStep, 200);
          return;
        }
        const existing = collectValues(treeRef.current);
        const available: number[] = [];
        for (let i = 1; i <= 99; i++) {
          if (!existing.includes(i)) available.push(i);
        }
        if (available.length === 0) {
          autoRef.current = false;
          setIsAuto(false);
          return;
        }
        const value = available[Math.floor(Math.random() * available.length)];
        animateInsert(value);
        autoTimerRef.current = setTimeout(autoStep, 1500 / speedRef.current);
      }
      autoStep();
    }
  }, [animateInsert]);

  /* ── Clear tree ── */
  const handleClear = useCallback(() => {
    if (autoRef.current) {
      autoRef.current = false;
      setIsAuto(false);
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    }
    animatingRef.current = false;
    setIsAnimating(false);
    treeRef.current = null;
    positionsRef.current = new Map();
    renderPosRef.current = new Map();
    highlightPathRef.current = new Set();
    newlyInsertedRef.current = null;
    imbalanceNodeRef.current = null;
    rotationLabelRef.current = null;
    setNodeCount(0);
  }, []);

  /* ── Render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;

    // Rebind so TS narrows through closures
    const ctx = maybeCtx;

    reducedMotionRef.current = prefersReducedMotion();

    // Initialize tree
    const root = initTree();
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const w = rect.width;
      const pos = recalcPositions(treeRef.current, w);
      positionsRef.current = pos;
      renderPosRef.current = new Map(pos);
    }

    resize();

    // Also initialize positions for the seed tree
    {
      const rect = canvas.getBoundingClientRect();
      const pos = recalcPositions(root, rect.width);
      positionsRef.current = pos;
      renderPosRef.current = new Map(pos);
    }

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);

    function drawFrame() {
      if (!canvas || !ctx) return;
      rafRef.current = requestAnimationFrame(drawFrame);

      const theme = getThemeColors();
      const w = canvas.width;
      const h = canvas.height;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w / dpr, h / dpr);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w / dpr, h / dpr);

      const tree = treeRef.current;
      if (!tree) return;

      const positions = renderPosRef.current;
      const highlightPath = highlightPathRef.current;
      const newlyInserted = newlyInsertedRef.current;
      const imbalanceNode = imbalanceNodeRef.current;
      const rotationLabel = rotationLabelRef.current;

      // Draw edges
      function drawEdges(node: AVLNode | null) {
        if (!node) return;
        const pos = positions.get(node.value);
        if (!pos) return;

        for (const child of [node.left, node.right]) {
          if (!child) continue;
          const childPos = positions.get(child.value);
          if (!childPos) continue;

          const isHighlighted = highlightPath.has(node.value) && highlightPath.has(child.value);

          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(childPos.x, childPos.y);
          ctx.strokeStyle = isHighlighted ? theme.accent : theme.edge;
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.stroke();

          drawEdges(child);
        }
      }
      drawEdges(tree);

      // Draw nodes
      function drawNodes(node: AVLNode | null) {
        if (!node) return;
        const pos = positions.get(node.value);
        if (!pos) return;

        drawNodes(node.left);
        drawNodes(node.right);

        const isNew = newlyInserted === node.value;
        const isImbalanced = imbalanceNode === node.value;
        const isOnPath = highlightPath.has(node.value);
        const bf = balanceFactor(node);

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);

        if (isImbalanced) {
          ctx.fillStyle = theme.accent;
          ctx.fill();
          ctx.strokeStyle = theme.accent;
        } else if (isNew) {
          ctx.fillStyle = theme.accentDim;
          ctx.fill();
          ctx.strokeStyle = theme.accent;
        } else if (isOnPath) {
          ctx.fillStyle = theme.accentDim;
          ctx.fill();
          ctx.strokeStyle = theme.accent;
        } else {
          ctx.fillStyle = "transparent";
          ctx.fill();
          ctx.strokeStyle = theme.nodeStroke;
        }
        ctx.lineWidth = isImbalanced || isNew ? 2 : 1;
        ctx.stroke();

        // Node value
        ctx.fillStyle = isImbalanced ? theme.bg : theme.nodeText;
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(node.value), pos.x, pos.y);

        // Balance factor
        const bfColor = Math.abs(bf) > 1 ? theme.accent : theme.edge;
        ctx.fillStyle = bfColor;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${bf >= 0 ? "+" : ""}${bf}`, pos.x, pos.y - NODE_RADIUS - 3);
      }
      drawNodes(tree);

      // Draw rotation label
      if (rotationLabel && imbalanceNode !== null) {
        const imbalancePos = positions.get(imbalanceNode);
        if (imbalancePos) {
          ctx.fillStyle = theme.accent;
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(rotationLabel, imbalancePos.x, imbalancePos.y - NODE_RADIUS - 14);
        }
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);

    // Auto-insert on startup so the tree grows immediately
    autoRef.current = true;
    setIsAuto(true);
    function autoStep() {
      if (!autoRef.current) return;
      if (animatingRef.current) {
        autoTimerRef.current = setTimeout(autoStep, 200);
        return;
      }
      const existing = collectValues(treeRef.current);
      const available: number[] = [];
      for (let i = 1; i <= 99; i++) {
        if (!existing.includes(i)) available.push(i);
      }
      if (available.length === 0) {
        autoRef.current = false;
        setIsAuto(false);
        return;
      }
      const value = available[Math.floor(Math.random() * available.length)];
      animateInsert(value);
      autoTimerRef.current = setTimeout(autoStep, 1500 / speedRef.current);
    }
    autoStep();

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [initTree, recalcPositions, snapPositions, animateInsert]);

  /* ── Speed sync ── */
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Controls overlay */}
      <div
        className="fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        style={{
          background: "rgba(128,128,128,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "6px",
          padding: "8px 12px",
        }}
      >
        <input
          type="number"
          min={0}
          max={999}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = parseInt(inputValue, 10);
              if (!Number.isNaN(v)) {
                handleInsert(v);
                setInputValue("");
              }
            }
          }}
          placeholder="value"
          disabled={isAnimating}
          className="w-16 rounded border border-foreground/10 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/70 placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={() => {
            const v = parseInt(inputValue, 10);
            if (!Number.isNaN(v)) {
              handleInsert(v);
              setInputValue("");
            }
          }}
          disabled={isAnimating}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          insert
        </button>
        <button
          onClick={handleRandom}
          disabled={isAnimating}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          random
        </button>
        <button
          onClick={toggleAuto}
          className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            isAuto
              ? "border-foreground/30 text-foreground/80"
              : "border-foreground/10 text-foreground/50 hover:text-foreground/80"
          }`}
        >
          {isAuto ? "stop" : "auto"}
        </button>
        <button
          onClick={handleClear}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80"
        >
          clear
        </button>
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
        <span className="font-mono text-[9px] text-foreground/25">n={nodeCount}</span>
      </div>
    </>
  );
}
