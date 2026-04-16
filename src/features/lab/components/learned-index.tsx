"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Data structures
   ──────────────────────────────────────────── */

interface LeafNode {
  type: "leaf";
  keys: (number | null)[]; // null = gap
  model: { slope: number; intercept: number };
  maxError: number;
}

interface InnerNode {
  type: "inner";
  model: { slope: number; intercept: number };
  children: (LeafNode | InnerNode)[];
}

type ALEXNode = LeafNode | InnerNode;

interface AnimState {
  type: "idle" | "lookup" | "insert" | "split";
  /** Which inner/leaf nodes are highlighted along the traversal path */
  pathIndices: number[];
  /** Index of the target leaf among all leaves */
  targetLeaf: number;
  /** Position marker in gapped array (model prediction) */
  predictedPos: number;
  /** Cells being scanned during lookup correction */
  scanRange: [number, number];
  /** Index of the found/inserted cell */
  foundCell: number;
  /** For split: which leaf is splitting */
  splitLeaf: number;
  /** Progress 0-1 within current animation phase */
  phase: number;
  /** Current sub-step label */
  step: string;
  /** The key being looked up or inserted */
  key: number;
}

/* ────────────────────────────────────────────
   Linear regression
   ──────────────────────────────────────────── */

function trainModel(keys: number[], positions: number[]): { slope: number; intercept: number } {
  const n = keys.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: positions[0] ?? 0 };
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sx += keys[i];
    sy += positions[i];
    sxy += keys[i] * positions[i];
    sxx += keys[i] * keys[i];
  }
  const d = n * sxx - sx * sx;
  if (Math.abs(d) < 1e-10) return { slope: 0, intercept: sy / n };
  const slope = (n * sxy - sx * sy) / d;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

function predict(model: { slope: number; intercept: number }, key: number): number {
  return model.slope * key + model.intercept;
}

/* ────────────────────────────────────────────
   Tree building
   ──────────────────────────────────────────── */

const LEAF_CAPACITY = 16;
const GAP_RATIO = 0.3; // ~30% gaps initially

function makeGappedArray(sortedKeys: number[]): (number | null)[] {
  const n = sortedKeys.length;
  const capacity = Math.max(LEAF_CAPACITY, Math.ceil(n / (1 - GAP_RATIO)));
  const arr: (number | null)[] = Array.from<number | null>({ length: capacity }).fill(null);
  // Spread keys evenly with gaps in between
  for (let i = 0; i < n; i++) {
    const pos = Math.round((i / Math.max(n - 1, 1)) * (capacity - 1));
    arr[pos] = sortedKeys[i];
  }
  // Handle collisions: shift right
  const placed: (number | null)[] = Array.from<number | null>({ length: capacity }).fill(null);
  let writeIdx = 0;
  for (let i = 0; i < capacity; i++) {
    if (arr[i] !== null) {
      while (writeIdx < capacity && placed[writeIdx] !== null) writeIdx++;
      if (writeIdx < capacity) {
        placed[writeIdx] = arr[i];
        writeIdx++;
      }
    }
  }
  // Re-spread: collect non-null, distribute evenly
  const vals = placed.filter((v) => v !== null) as number[];
  const final: (number | null)[] = Array.from<number | null>({ length: capacity }).fill(null);
  for (let i = 0; i < vals.length; i++) {
    const pos = Math.round((i / Math.max(vals.length - 1, 1)) * (capacity - 1));
    // Find nearest free slot
    let p = pos;
    while (p < capacity && final[p] !== null) p++;
    if (p >= capacity) {
      p = pos - 1;
      while (p >= 0 && final[p] !== null) p--;
    }
    if (p >= 0 && p < capacity) final[p] = vals[i];
  }
  return final;
}

function trainLeafModel(leaf: LeafNode): { slope: number; intercept: number; maxError: number } {
  const keys: number[] = [];
  const positions: number[] = [];
  for (let i = 0; i < leaf.keys.length; i++) {
    const k = leaf.keys[i];
    if (k !== null) {
      keys.push(k);
      positions.push(i);
    }
  }
  if (keys.length === 0) return { slope: 0, intercept: 0, maxError: 0 };
  const model = trainModel(keys, positions);
  let maxErr = 0;
  for (let i = 0; i < keys.length; i++) {
    const pred = predict(model, keys[i]);
    maxErr = Math.max(maxErr, Math.abs(pred - positions[i]));
  }
  return { ...model, maxError: Math.ceil(maxErr) };
}

function buildTree(allKeys: number[]): InnerNode {
  const sorted = [...allKeys].sort((a, b) => a - b);
  const unique = [...new Set(sorted)];
  const n = unique.length;

  // Decide number of children (2-4 based on key count)
  let numChildren = 2;
  if (n > 12) numChildren = 3;
  if (n > 20) numChildren = 4;

  const groups: number[][] = [];
  const groupSize = Math.ceil(n / numChildren);
  for (let i = 0; i < numChildren; i++) {
    const start = i * groupSize;
    const end = Math.min(start + groupSize, n);
    if (start < n) {
      groups.push(unique.slice(start, end));
    }
  }

  // Build leaves
  const leaves: LeafNode[] = groups.map((g) => {
    const gapped = makeGappedArray(g);
    const leaf: LeafNode = {
      type: "leaf",
      keys: gapped,
      model: { slope: 0, intercept: 0 },
      maxError: 0,
    };
    const trained = trainLeafModel(leaf);
    leaf.model = { slope: trained.slope, intercept: trained.intercept };
    leaf.maxError = trained.maxError;
    return leaf;
  });

  // Train root model: key -> child index
  const rootKeys: number[] = [];
  const rootPositions: number[] = [];
  for (let i = 0; i < groups.length; i++) {
    for (const k of groups[i]) {
      rootKeys.push(k);
      rootPositions.push(i);
    }
  }
  const rootModel = trainModel(rootKeys, rootPositions);

  return { type: "inner", model: rootModel, children: leaves };
}

/* ────────────────────────────────────────────
   Tree operations
   ──────────────────────────────────────────── */

function getAllKeys(node: ALEXNode): number[] {
  if (node.type === "leaf") {
    return node.keys.filter((k) => k !== null) as number[];
  }
  const result: number[] = [];
  for (const child of node.children) {
    result.push(...getAllKeys(child));
  }
  return result;
}

function getLeaves(node: ALEXNode): LeafNode[] {
  if (node.type === "leaf") return [node];
  const result: LeafNode[] = [];
  for (const child of node.children) {
    result.push(...getLeaves(child));
  }
  return result;
}

function findLeafIndex(root: InnerNode, key: number): number {
  const pred = predict(root.model, key);
  const idx = Math.round(pred);
  return Math.max(0, Math.min(root.children.length - 1, idx));
}

function findInGappedArray(
  leaf: LeafNode,
  key: number,
): { predicted: number; found: number; scanRange: [number, number] } {
  const pred = predict(leaf.model, key);
  const predicted = Math.max(0, Math.min(leaf.keys.length - 1, Math.round(pred)));
  const maxScan = Math.max(leaf.maxError + 2, 4);

  const lo = Math.max(0, predicted - maxScan);
  const hi = Math.min(leaf.keys.length - 1, predicted + maxScan);

  // Scan outward from predicted position
  let found = -1;
  for (let d = 0; d <= maxScan; d++) {
    if (predicted + d < leaf.keys.length && leaf.keys[predicted + d] === key) {
      found = predicted + d;
      break;
    }
    if (predicted - d >= 0 && leaf.keys[predicted - d] === key) {
      found = predicted - d;
      break;
    }
  }

  return { predicted, found, scanRange: [lo, hi] };
}

function insertIntoLeaf(leaf: LeafNode, key: number): boolean {
  // Check if key already exists
  if (leaf.keys.includes(key)) return false;

  const pred = predict(leaf.model, key);
  const predicted = Math.max(0, Math.min(leaf.keys.length - 1, Math.round(pred)));

  // Find the insertion point maintaining sorted order
  // First find where the key belongs in sorted order
  let insertPos = predicted;

  // Adjust insertPos to maintain sorted order
  // Look left for smaller keys, right for larger keys
  for (let i = 0; i < leaf.keys.length; i++) {
    const v = leaf.keys[i];
    if (v !== null && v > key) {
      insertPos = i;
      break;
    }
    if (v !== null && v < key) {
      insertPos = i + 1;
    }
  }

  // Find nearest gap
  let gapPos = -1;
  for (let d = 0; d < leaf.keys.length; d++) {
    if (insertPos + d < leaf.keys.length && leaf.keys[insertPos + d] === null) {
      gapPos = insertPos + d;
      break;
    }
    if (insertPos - d >= 0 && leaf.keys[insertPos - d] === null) {
      gapPos = insertPos - d;
      break;
    }
  }

  if (gapPos === -1) return false; // No gaps

  // Shift elements to make room at insertPos
  if (gapPos > insertPos) {
    // Gap is to the right, shift elements right
    for (let i = gapPos; i > insertPos; i--) {
      leaf.keys[i] = leaf.keys[i - 1];
    }
    leaf.keys[insertPos] = key;
  } else if (gapPos < insertPos) {
    // Gap is to the left, shift elements left
    for (let i = gapPos; i < insertPos - 1; i++) {
      leaf.keys[i] = leaf.keys[i + 1];
    }
    leaf.keys[insertPos - 1] = key;
  } else {
    leaf.keys[gapPos] = key;
  }

  return true;
}

function leafIsFull(leaf: LeafNode): boolean {
  const gaps = leaf.keys.filter((k) => k === null).length;
  return gaps <= 1; // Almost full
}

function splitLeaf(parent: InnerNode, leafIdx: number): void {
  const leaf = parent.children[leafIdx] as LeafNode;
  const keys = leaf.keys.filter((k) => k !== null) as number[];
  keys.sort((a, b) => a - b);

  const mid = Math.floor(keys.length / 2);
  const leftKeys = keys.slice(0, mid);
  const rightKeys = keys.slice(mid);

  const leftGapped = makeGappedArray(leftKeys);
  const rightGapped = makeGappedArray(rightKeys);

  const leftLeaf: LeafNode = {
    type: "leaf",
    keys: leftGapped,
    model: { slope: 0, intercept: 0 },
    maxError: 0,
  };
  const rightLeaf: LeafNode = {
    type: "leaf",
    keys: rightGapped,
    model: { slope: 0, intercept: 0 },
    maxError: 0,
  };

  const leftTrained = trainLeafModel(leftLeaf);
  leftLeaf.model = { slope: leftTrained.slope, intercept: leftTrained.intercept };
  leftLeaf.maxError = leftTrained.maxError;

  const rightTrained = trainLeafModel(rightLeaf);
  rightLeaf.model = { slope: rightTrained.slope, intercept: rightTrained.intercept };
  rightLeaf.maxError = rightTrained.maxError;

  // Replace the leaf with two new leaves
  parent.children.splice(leafIdx, 1, leftLeaf, rightLeaf);

  // Retrain parent model
  const allRootKeys: number[] = [];
  const allRootPos: number[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    const childKeys = getAllKeys(parent.children[i]);
    for (const k of childKeys) {
      allRootKeys.push(k);
      allRootPos.push(i);
    }
  }
  parent.model = trainModel(allRootKeys, allRootPos);
}

function retrainLeaf(leaf: LeafNode): void {
  const trained = trainLeafModel(leaf);
  leaf.model = { slope: trained.slope, intercept: trained.intercept };
  leaf.maxError = trained.maxError;
}

/* ────────────────────────────────────────────
   Random key generators
   ──────────────────────────────────────────── */

type Distribution = "uniform" | "normal" | "skew";

function randomKey(dist: Distribution, existing: Set<number>): number {
  for (let attempt = 0; attempt < 200; attempt++) {
    let v: number;
    if (dist === "uniform") {
      v = Math.floor(Math.random() * 99) + 1;
    } else if (dist === "normal") {
      // Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = Math.round(50 + z * 15);
      v = Math.max(1, Math.min(99, v));
    } else {
      // Skew right (exponential-ish)
      v = Math.round(Math.pow(Math.random(), 2.5) * 98) + 1;
      v = Math.max(1, Math.min(99, v));
    }
    if (!existing.has(v)) return v;
  }
  // Fallback: find any unused key
  for (let i = 1; i <= 99; i++) {
    if (!existing.has(i)) return i;
  }
  return -1;
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
  cellFill: string;
  cellBorder: string;
  gridLine: string;
}

function getTheme(): ThemeColors {
  const isDark = document.documentElement.classList.contains("dark");
  if (isDark) {
    return {
      bg: "#0a0a0a",
      stroke: "rgba(224,226,220,0.15)",
      text: "rgba(224,226,220,0.8)",
      muted: "rgba(224,226,220,0.3)",
      accent: "#d4ff00",
      accentDim: "rgba(212,255,0,0.3)",
      cellFill: "rgba(224,226,220,0.06)",
      cellBorder: "rgba(224,226,220,0.1)",
      gridLine: "rgba(224,226,220,0.06)",
    };
  }
  return {
    bg: "#f5f1e8",
    stroke: "rgba(10,10,10,0.12)",
    text: "rgba(10,10,10,0.8)",
    muted: "rgba(10,10,10,0.3)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.3)",
    cellFill: "rgba(10,10,10,0.04)",
    cellBorder: "rgba(10,10,10,0.08)",
    gridLine: "rgba(10,10,10,0.05)",
  };
}

/* ────────────────────────────────────────────
   Initial keys
   ──────────────────────────────────────────── */

function generateInitialKeys(dist: Distribution): number[] {
  const keys: number[] = [];
  const existing = new Set<number>();
  for (let i = 0; i < 20; i++) {
    const k = randomKey(dist, existing);
    if (k > 0) {
      keys.push(k);
      existing.add(k);
    }
  }
  return keys;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function LearnedIndex() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<InnerNode | null>(null);
  const animRef = useRef<AnimState>({
    type: "idle",
    pathIndices: [],
    targetLeaf: -1,
    predictedPos: -1,
    scanRange: [0, 0],
    foundCell: -1,
    splitLeaf: -1,
    phase: 0,
    step: "",
    key: -1,
  });
  const animatingRef = useRef(false);
  const autoRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);
  const speedRef = useRef(1);
  const reducedMotionRef = useRef(false);

  const [distribution, setDistribution] = useState<Distribution>("uniform");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [nodeCount, setNodeCount] = useState(0);
  const [leafCount, setLeafCount] = useState(0);
  const [lookupValue, setLookupValue] = useState("");

  const distributionRef = useRef<Distribution>("uniform");

  /* ── Sleep helper ── */
  const sleep = useCallback((ms: number) => {
    const adjusted = reducedMotionRef.current ? 0 : ms / speedRef.current;
    return new Promise<void>((resolve) => setTimeout(resolve, adjusted));
  }, []);

  /* ── Initialize tree ── */
  const initTree = useCallback((dist: Distribution) => {
    const keys = generateInitialKeys(dist);
    const tree = buildTree(keys);
    treeRef.current = tree;
    setNodeCount(getAllKeys(tree).length);
    setLeafCount(getLeaves(tree).length);
    return tree;
  }, []);

  /* ── Update counts ── */
  const updateCounts = useCallback(() => {
    if (!treeRef.current) return;
    setNodeCount(getAllKeys(treeRef.current).length);
    setLeafCount(getLeaves(treeRef.current).length);
  }, []);

  /* ── Reset anim state ── */
  const resetAnim = useCallback(() => {
    animRef.current = {
      type: "idle",
      pathIndices: [],
      targetLeaf: -1,
      predictedPos: -1,
      scanRange: [0, 0],
      foundCell: -1,
      splitLeaf: -1,
      phase: 0,
      step: "",
      key: -1,
    };
  }, []);

  /* ── Lookup animation ── */
  const animateLookup = useCallback(
    async (key: number) => {
      const tree = treeRef.current;
      if (!tree || animatingRef.current) return;
      animatingRef.current = true;
      setIsAnimating(true);

      const anim = animRef.current;
      anim.type = "lookup";
      anim.key = key;

      // Step 1: Highlight root
      anim.step = "evaluate root model";
      anim.pathIndices = [-1]; // -1 = root
      await sleep(300);

      // Step 2: Find child
      const childIdx = findLeafIndex(tree, key);
      anim.pathIndices = [-1, childIdx];
      anim.targetLeaf = childIdx;
      anim.step = `model predicts child ${childIdx}`;
      await sleep(300);

      // Step 3: At leaf, evaluate model
      const leaf = tree.children[childIdx];
      if (leaf.type === "leaf") {
        const result = findInGappedArray(leaf, key);
        anim.predictedPos = result.predicted;
        anim.step = `predicted pos: ${result.predicted}`;
        await sleep(300);

        // Step 4: Scan
        anim.scanRange = result.scanRange;
        const lo = result.scanRange[0];
        const hi = result.scanRange[1];
        for (let i = lo; i <= hi; i++) {
          anim.foundCell = i;
          if (leaf.keys[i] === key) {
            anim.step = `found key ${key} at position ${i}`;
            await sleep(200);
            break;
          }
          await sleep(80);
        }

        if (result.found === -1) {
          anim.step = `key ${key} not found`;
          anim.foundCell = -1;
        } else {
          anim.foundCell = result.found;
        }
        await sleep(500);
      }

      resetAnim();
      animatingRef.current = false;
      setIsAnimating(false);
    },
    [sleep, resetAnim],
  );

  /* ── Insert animation ── */
  const animateInsert = useCallback(
    async (key: number) => {
      const tree = treeRef.current;
      if (!tree || animatingRef.current) return;

      const existing = new Set(getAllKeys(tree));
      if (existing.has(key)) return;

      animatingRef.current = true;
      setIsAnimating(true);

      const anim = animRef.current;
      anim.type = "insert";
      anim.key = key;

      // Step 1: Traverse to root
      anim.step = "evaluate root model";
      anim.pathIndices = [-1];
      await sleep(200);

      // Step 2: Find target leaf
      const childIdx = findLeafIndex(tree, key);
      anim.pathIndices = [-1, childIdx];
      anim.targetLeaf = childIdx;
      anim.step = `model predicts child ${childIdx}`;
      await sleep(200);

      // Step 3: Insert into leaf
      const leaf = tree.children[childIdx];
      if (leaf.type === "leaf") {
        const pred = predict(leaf.model, key);
        const predicted = Math.max(0, Math.min(leaf.keys.length - 1, Math.round(pred)));
        anim.predictedPos = predicted;
        anim.step = `inserting key ${key}`;
        await sleep(200);

        const success = insertIntoLeaf(leaf, key);
        if (success) {
          retrainLeaf(leaf);

          // Find where key ended up
          const keyIdx = leaf.keys.indexOf(key);
          anim.foundCell = keyIdx;
          anim.step = `key ${key} placed at position ${keyIdx}`;
          await sleep(300);

          // Check if leaf needs splitting
          if (leafIsFull(leaf)) {
            anim.type = "split";
            anim.splitLeaf = childIdx;
            anim.step = "leaf full, splitting";
            await sleep(400);

            splitLeaf(tree, childIdx);

            anim.step = "split complete, models retrained";
            await sleep(400);
          }
        }
      }

      updateCounts();
      resetAnim();
      animatingRef.current = false;
      setIsAnimating(false);
    },
    [sleep, resetAnim, updateCounts],
  );

  /* ── Insert random key ── */
  const handleInsertRandom = useCallback(() => {
    if (animatingRef.current || !treeRef.current) return;
    const existing = new Set(getAllKeys(treeRef.current));
    const key = randomKey(distributionRef.current, existing);
    if (key > 0) animateInsert(key);
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
        if (!treeRef.current) return;
        const existing = new Set(getAllKeys(treeRef.current));
        if (existing.size >= 99) {
          autoRef.current = false;
          setIsAuto(false);
          return;
        }
        const key = randomKey(distributionRef.current, existing);
        if (key > 0) animateInsert(key);
        autoTimerRef.current = setTimeout(autoStep, 1500 / speedRef.current);
      }
      autoStep();
    }
  }, [animateInsert]);

  /* ── Lookup handler ── */
  const handleLookup = useCallback(() => {
    const v = parseInt(lookupValue, 10);
    if (!Number.isNaN(v) && v >= 1 && v <= 99) {
      animateLookup(v);
    }
  }, [lookupValue, animateLookup]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
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
    resetAnim();
    initTree(distributionRef.current);
  }, [resetAnim, initTree]);

  /* ── Render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    initTree(distributionRef.current);

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

      const theme = getTheme();
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, cw, ch);

      const tree = treeRef.current;
      if (!tree) return;

      const anim = animRef.current;
      const leaves = getLeaves(tree);
      const allKeys = getAllKeys(tree).sort((a, b) => a - b);

      // Layout: left panel = CDF, right panel = tree
      const divider = cw * 0.55;
      const margin = { top: 70, bottom: 140, left: 50, right: 30 };

      // ─── Draw divider line ───
      ctx.beginPath();
      ctx.moveTo(divider, 60);
      ctx.lineTo(divider, ch - 60);
      ctx.strokeStyle = theme.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      // ═══════════════════════════════════════
      // LEFT PANEL: CDF Plot
      // ═══════════════════════════════════════

      const plotLeft = margin.left;
      const plotRight = divider - margin.right;
      const plotTop = margin.top;
      const plotBottom = ch - margin.bottom;
      const plotW = plotRight - plotLeft;
      const plotH = plotBottom - plotTop;

      // Axis range
      const keyMin = 0;
      const keyMax = 100;
      const rankMax = Math.max(allKeys.length, 1);

      function keyToX(k: number): number {
        return plotLeft + ((k - keyMin) / (keyMax - keyMin)) * plotW;
      }
      function rankToY(r: number): number {
        return plotBottom - (r / rankMax) * plotH;
      }

      // Grid lines
      ctx.strokeStyle = theme.gridLine;
      ctx.lineWidth = 0.5;
      for (let k = 0; k <= 100; k += 20) {
        const x = keyToX(k);
        ctx.beginPath();
        ctx.moveTo(x, plotTop);
        ctx.lineTo(x, plotBottom);
        ctx.stroke();
      }
      for (let r = 0; r <= rankMax; r += Math.max(1, Math.ceil(rankMax / 5))) {
        const y = rankToY(r);
        ctx.beginPath();
        ctx.moveTo(plotLeft, y);
        ctx.lineTo(plotRight, y);
        ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = theme.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, plotTop);
      ctx.lineTo(plotLeft, plotBottom);
      ctx.lineTo(plotRight, plotBottom);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = theme.muted;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let k = 0; k <= 100; k += 20) {
        ctx.fillText(String(k), keyToX(k), plotBottom + 6);
      }
      ctx.fillText("key", plotLeft + plotW / 2, plotBottom + 20);

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let r = 0; r <= rankMax; r += Math.max(1, Math.ceil(rankMax / 5))) {
        ctx.fillText(String(r), plotLeft - 6, rankToY(r));
      }

      ctx.save();
      ctx.translate(plotLeft - 34, plotTop + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("rank", 0, 0);
      ctx.restore();

      // Title
      ctx.fillStyle = theme.muted;
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("CDF", plotLeft, plotTop - 8);

      // Plot empirical CDF dots
      for (let i = 0; i < allKeys.length; i++) {
        const x = keyToX(allKeys[i]);
        const y = rankToY(i + 1);

        const isNewKey = anim.type !== "idle" && allKeys[i] === anim.key;

        ctx.beginPath();
        ctx.arc(x, y, isNewKey ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isNewKey ? theme.accent : theme.text;
        ctx.globalAlpha = isNewKey ? 1 : 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Plot model segments (one per leaf)
      let cumRank = 0;
      for (let li = 0; li < leaves.length; li++) {
        const leaf = leaves[li];
        const leafKeys = leaf.keys.filter((k) => k !== null) as number[];
        if (leafKeys.length === 0) {
          continue;
        }
        leafKeys.sort((a, b) => a - b);

        const segStartKey = leafKeys[0];
        const segEndKey = leafKeys[leafKeys.length - 1];
        const segStartRank = cumRank + 1;
        const segEndRank = cumRank + leafKeys.length;

        const isTargetLeaf = anim.targetLeaf === li && anim.type !== "idle";

        ctx.beginPath();
        ctx.moveTo(keyToX(segStartKey), rankToY(segStartRank));
        ctx.lineTo(keyToX(segEndKey), rankToY(segEndRank));
        ctx.strokeStyle = isTargetLeaf ? theme.accent : theme.accentDim;
        ctx.lineWidth = isTargetLeaf ? 2.5 : 1.5;
        ctx.stroke();

        // Small label for segment
        const midX = (keyToX(segStartKey) + keyToX(segEndKey)) / 2;
        const midY = (rankToY(segStartRank) + rankToY(segEndRank)) / 2;
        ctx.fillStyle = theme.muted;
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`L${li}`, midX, midY - 4);

        cumRank += leafKeys.length;
      }

      // ═══════════════════════════════════════
      // RIGHT PANEL: Tree + Gapped Arrays
      // ═══════════════════════════════════════

      const rightLeft = divider + 20;
      const rightW = cw - rightLeft - 20;
      const treeTop = 70;

      // Root node
      const rootX = rightLeft + rightW / 2;
      const rootY = treeTop + 20;
      const rootW = 80;
      const rootH = 28;

      const isRootHighlighted = anim.pathIndices.includes(-1);

      // Root rectangle
      ctx.beginPath();
      ctx.roundRect(rootX - rootW / 2, rootY - rootH / 2, rootW, rootH, 3);
      ctx.strokeStyle = isRootHighlighted ? theme.accent : theme.stroke;
      ctx.lineWidth = isRootHighlighted ? 2 : 1;
      ctx.stroke();
      if (isRootHighlighted) {
        ctx.fillStyle = theme.accentDim;
        ctx.fill();
      }

      // Root text
      ctx.fillStyle = isRootHighlighted ? theme.accent : theme.text;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const rootSlope = tree.model.slope.toFixed(2);
      ctx.fillText(`m=${rootSlope}`, rootX, rootY);

      // Label
      ctx.fillStyle = theme.muted;
      ctx.font = "7px monospace";
      ctx.textBaseline = "bottom";
      ctx.fillText("root", rootX, rootY - rootH / 2 - 3);

      // Leaf gapped arrays
      const leafAreaTop = rootY + rootH / 2 + 40;
      const numLeaves = leaves.length;
      const maxCellSize = 18;
      const cellGap = 1;

      // Calculate available space per leaf
      const leafSpacing = rightW / Math.max(numLeaves, 1);

      for (let li = 0; li < numLeaves; li++) {
        const leaf = leaves[li];
        const arrLen = leaf.keys.length;

        // Center this leaf's array in its allotted space
        const leafCenterX = rightLeft + leafSpacing * (li + 0.5);

        // Determine cell size to fit
        const availW = leafSpacing - 10;
        const cellSize = Math.min(
          maxCellSize,
          Math.max(8, (availW - cellGap * (arrLen - 1)) / arrLen),
        );
        const totalArrW = arrLen * (cellSize + cellGap) - cellGap;
        const arrStartX = leafCenterX - totalArrW / 2;
        const arrY = leafAreaTop;

        const isTarget = anim.targetLeaf === li && anim.type !== "idle";
        const isSplitting = anim.type === "split" && anim.splitLeaf === li;

        // Edge from root to leaf
        ctx.beginPath();
        ctx.moveTo(rootX, rootY + rootH / 2);
        ctx.lineTo(leafCenterX, arrY - 12);
        ctx.strokeStyle = isTarget || anim.pathIndices.includes(li) ? theme.accent : theme.stroke;
        ctx.lineWidth = isTarget ? 1.5 : 0.5;
        ctx.stroke();

        // Leaf label
        ctx.fillStyle = isTarget ? theme.accent : theme.muted;
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`leaf ${li}`, leafCenterX, arrY - 14);

        // Model info
        ctx.fillStyle = theme.muted;
        ctx.font = "6px monospace";
        ctx.textBaseline = "top";
        const slopeText = `m=${leaf.model.slope.toFixed(1)}`;
        ctx.fillText(slopeText, leafCenterX, arrY + cellSize + 6);

        // Prediction marker above array
        if (isTarget && anim.predictedPos >= 0) {
          const predX = arrStartX + anim.predictedPos * (cellSize + cellGap) + cellSize / 2;
          ctx.beginPath();
          ctx.moveTo(predX, arrY - 8);
          ctx.lineTo(predX - 3, arrY - 12);
          ctx.lineTo(predX + 3, arrY - 12);
          ctx.closePath();
          ctx.fillStyle = theme.accent;
          ctx.fill();
        }

        // Draw gapped array cells
        for (let ci = 0; ci < arrLen; ci++) {
          const cx = arrStartX + ci * (cellSize + cellGap);
          const cy = arrY;
          const val = leaf.keys[ci];

          const isScanCell =
            isTarget &&
            ci >= anim.scanRange[0] &&
            ci <= anim.scanRange[1] &&
            anim.type === "lookup";
          const isFoundCell = isTarget && ci === anim.foundCell;
          const isPredicted = isTarget && ci === anim.predictedPos;

          if (val !== null) {
            // Occupied cell
            ctx.fillStyle = isFoundCell
              ? theme.accent
              : isSplitting
                ? theme.accentDim
                : isScanCell
                  ? theme.accentDim
                  : theme.cellFill;
            ctx.fillRect(cx, cy, cellSize, cellSize);
            ctx.strokeStyle = isFoundCell
              ? theme.accent
              : isPredicted
                ? theme.accent
                : theme.cellBorder;
            ctx.lineWidth = isFoundCell || isPredicted ? 1.5 : 0.5;
            ctx.strokeRect(cx, cy, cellSize, cellSize);

            // Value text
            if (cellSize >= 12) {
              ctx.fillStyle = isFoundCell ? theme.bg : theme.text;
              ctx.font = `${Math.min(8, cellSize - 4)}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.globalAlpha = isFoundCell ? 1 : 0.6;
              ctx.fillText(String(val), cx + cellSize / 2, cy + cellSize / 2);
              ctx.globalAlpha = 1;
            }
          } else {
            // Gap cell (empty)
            ctx.strokeStyle = theme.cellBorder;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(cx, cy, cellSize, cellSize);
            ctx.setLineDash([]);
          }
        }
      }

      // Animation step label
      if (anim.type !== "idle" && anim.step) {
        ctx.fillStyle = theme.accent;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(anim.step, cw / 2, ch - 86);
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [initTree]);

  /* ── Speed sync ── */
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /* ── Distribution sync ── */
  useEffect(() => {
    distributionRef.current = distribution;
  }, [distribution]);

  const btnClass =
    "rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40";
  const btnActiveClass =
    "rounded border border-foreground/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/80";

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
        {/* Distribution picker */}
        <div className="flex items-center gap-1">
          {(["uniform", "normal", "skew"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDistribution(d)}
              className={distribution === d ? btnActiveClass : btnClass}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-foreground/10" />

        {/* Insert */}
        <button onClick={handleInsertRandom} disabled={isAnimating} className={btnClass}>
          insert
        </button>

        {/* Auto */}
        <button onClick={toggleAuto} className={isAuto ? btnActiveClass : btnClass}>
          {isAuto ? "stop" : "auto"}
        </button>

        <div className="h-4 w-px bg-foreground/10" />

        {/* Lookup */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={99}
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLookup();
            }}
            placeholder="key"
            disabled={isAnimating}
            className="w-12 rounded border border-foreground/10 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/70 placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none disabled:opacity-40"
          />
          <button onClick={handleLookup} disabled={isAnimating} className={btnClass}>
            lookup
          </button>
        </div>

        <div className="h-4 w-px bg-foreground/10" />

        {/* Speed */}
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

        {/* Reset */}
        <button onClick={handleReset} className={btnClass}>
          reset
        </button>

        {/* Counters */}
        <span className="font-mono text-[9px] text-foreground/25">
          n={nodeCount} leaves={leafCount}
        </span>
      </div>
    </>
  );
}
