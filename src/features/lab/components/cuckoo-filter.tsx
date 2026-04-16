"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   Cuckoo filter data structure
   ──────────────────────────────────────────── */

const NUM_BUCKETS = 8;
const BUCKET_SIZE = 4;
const MAX_KICKS = 500;

interface CuckooState {
  buckets: (number | null)[][];
  itemCount: number;
}

function createFilter(): CuckooState {
  const buckets: (number | null)[][] = [];
  for (let i = 0; i < NUM_BUCKETS; i++) {
    buckets.push(Array.from<number | null>({ length: BUCKET_SIZE }).fill(null));
  }
  return { buckets, itemCount: 0 };
}

/** Silently insert a key into the filter (no animation). Returns true on success. */
function silentInsert(state: CuckooState, key: number): boolean {
  const fp = fingerprint(key);
  const i1 = primaryBucket(key);
  const i2 = altBucket(i1, fp);

  for (let s = 0; s < BUCKET_SIZE; s++) {
    if (state.buckets[i1][s] === null) {
      state.buckets[i1][s] = fp;
      state.itemCount++;
      return true;
    }
  }
  for (let s = 0; s < BUCKET_SIZE; s++) {
    if (state.buckets[i2][s] === null) {
      state.buckets[i2][s] = fp;
      state.itemCount++;
      return true;
    }
  }

  let curBucket = Math.random() < 0.5 ? i1 : i2;
  let curFp = fp;
  for (let k = 0; k < MAX_KICKS; k++) {
    const slot = Math.floor(Math.random() * BUCKET_SIZE);
    const evicted = state.buckets[curBucket][slot] ?? 0;
    state.buckets[curBucket][slot] = curFp;
    curFp = evicted;
    curBucket = altBucket(curBucket, curFp);
    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (state.buckets[curBucket][s] === null) {
        state.buckets[curBucket][s] = curFp;
        state.itemCount++;
        return true;
      }
    }
  }
  return false;
}

function createSeededFilter(): { filter: CuckooState; nextKey: number } {
  const filter = createFilter();
  const SEED_COUNT = 12;
  let key = 1;
  for (let i = 0; i < SEED_COUNT; i++) {
    silentInsert(filter, key);
    key++;
  }
  return { filter, nextKey: key };
}

function fingerprint(x: number): number {
  let h = x | 0;
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  h = (h >>> 16) ^ h;
  return ((h >>> 0) % 255) + 1; // 1-255 nonzero
}

function primaryBucket(x: number): number {
  let h = Math.imul(x, 0x9e3779b9);
  return (h >>> 0) % NUM_BUCKETS;
}

function altBucket(i: number, fp: number): number {
  let h = Math.imul(fp, 0x5bd1e995);
  return ((i ^ (h >>> 0)) >>> 0) % NUM_BUCKETS;
}

function fpHex(fp: number): string {
  return "0x" + fp.toString(16).toUpperCase().padStart(2, "0");
}

/* ────────────────────────────────────────────
   Animation types
   ──────────────────────────────────────────── */

interface KickStep {
  fromBucket: number;
  fromSlot: number;
  toBucket: number;
  toSlot: number;
  fp: number;
}

interface InsertAnimation {
  type: "insert";
  key: number;
  fp: number;
  i1: number;
  i2: number;
  kicks: KickStep[];
  finalBucket: number;
  finalSlot: number;
  failed: boolean;
  /** Snapshot of all buckets after the insert completes (for easy state replay). */
  resultBuckets: (number | null)[][] | null;
}

interface LookupAnimation {
  type: "lookup";
  key: number;
  fp: number;
  i1: number;
  i2: number;
  found: boolean;
  foundBucket: number;
  foundSlot: number;
}

interface DeleteAnimation {
  type: "delete";
  key: number;
  fp: number;
  i1: number;
  i2: number;
  found: boolean;
  foundBucket: number;
  foundSlot: number;
}

type Animation = InsertAnimation | LookupAnimation | DeleteAnimation;

/* Animation playback state */
interface PlaybackState {
  animation: Animation;
  phase: "highlight-candidates" | "kick" | "place" | "found" | "not-found" | "delete-fade" | "done";
  kickIndex: number;
  progress: number; // 0-1 within current phase
  startTime: number;
  phaseStartTime: number;
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
  error: string;
  slotFill: string;
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
      error: "rgba(255,80,80,0.6)",
      slotFill: "rgba(224,226,220,0.08)",
    };
  }
  return {
    bg: "#f5f1e8",
    stroke: "rgba(10,10,10,0.12)",
    text: "rgba(10,10,10,0.8)",
    muted: "rgba(10,10,10,0.3)",
    accent: "#2a8a0e",
    accentDim: "rgba(42,138,14,0.3)",
    error: "rgba(200,40,40,0.5)",
    slotFill: "rgba(10,10,10,0.05)",
  };
}

/* ────────────────────────────────────────────
   Bezier helpers
   ──────────────────────────────────────────── */

function quadBezierPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
): [number, number] {
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function CuckooFilter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const speedRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const animatingRef = useRef(false);

  // Filter state (ref for render loop) — seed with 12 items
  const seedRef = useRef(createSeededFilter());
  const filterRef = useRef<CuckooState>(seedRef.current.filter);

  // Animation playback
  const playbackRef = useRef<PlaybackState | null>(null);

  // Info text for display
  const infoTextRef = useRef<string[]>([]);

  // Key counter for auto-insert (starts after seeded keys)
  const nextKeyRef = useRef(seedRef.current.nextKey);

  // Auto mode
  const autoRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React state for controls
  const [speed, setSpeed] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [lookupKey, setLookupKey] = useState("");
  const [insertKey, setInsertKey] = useState("");
  const [loadDisplay, setLoadDisplay] = useState("0/32");

  /* ── Update load display ── */
  const updateLoad = useCallback(() => {
    const f = filterRef.current;
    setLoadDisplay(`${f.itemCount}/${NUM_BUCKETS * BUCKET_SIZE}`);
  }, []);

  /* ── Compute insert animation (does NOT mutate state) ── */
  const computeInsert = useCallback((key: number): InsertAnimation => {
    const f = filterRef.current;
    const fp = fingerprint(key);
    const i1 = primaryBucket(key);
    const i2 = altBucket(i1, fp);

    // Try i1
    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (f.buckets[i1][s] === null) {
        // Build result snapshot with direct placement
        const snap = f.buckets.map((b) => [...b]);
        snap[i1][s] = fp;
        return {
          type: "insert",
          key,
          fp,
          i1,
          i2,
          kicks: [],
          finalBucket: i1,
          finalSlot: s,
          failed: false,
          resultBuckets: snap,
        };
      }
    }
    // Try i2
    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (f.buckets[i2][s] === null) {
        const snap = f.buckets.map((b) => [...b]);
        snap[i2][s] = fp;
        return {
          type: "insert",
          key,
          fp,
          i1,
          i2,
          kicks: [],
          finalBucket: i2,
          finalSlot: s,
          failed: false,
          resultBuckets: snap,
        };
      }
    }

    // Must kick
    const kicks: KickStep[] = [];
    // Work on a copy
    const buckCopy = f.buckets.map((b) => [...b]);
    let curBucket = Math.random() < 0.5 ? i1 : i2;
    let curFp = fp;

    for (let k = 0; k < MAX_KICKS; k++) {
      const evictSlot = Math.floor(Math.random() * BUCKET_SIZE);
      const evictedFp = buckCopy[curBucket][evictSlot] ?? 0;
      buckCopy[curBucket][evictSlot] = curFp;

      const destBucket = altBucket(curBucket, evictedFp);

      // Try to place evicted fp
      for (let s = 0; s < BUCKET_SIZE; s++) {
        if (buckCopy[destBucket][s] === null) {
          buckCopy[destBucket][s] = evictedFp;
          kicks.push({
            fromBucket: curBucket,
            fromSlot: evictSlot,
            toBucket: destBucket,
            toSlot: s,
            fp: evictedFp,
          });
          return {
            type: "insert",
            key,
            fp,
            i1,
            i2,
            kicks,
            finalBucket: curBucket,
            finalSlot: evictSlot,
            failed: false,
            resultBuckets: buckCopy.map((b) => [...b]),
          };
        }
      }

      kicks.push({
        fromBucket: curBucket,
        fromSlot: evictSlot,
        toBucket: destBucket,
        toSlot: -1,
        fp: evictedFp,
      });
      curFp = evictedFp;
      curBucket = destBucket;
    }

    return {
      type: "insert",
      key,
      fp,
      i1,
      i2,
      kicks,
      finalBucket: -1,
      finalSlot: -1,
      failed: true,
      resultBuckets: null,
    };
  }, []);

  /* ── Apply insert to actual filter state ── */
  const applyInsert = useCallback(
    (anim: InsertAnimation) => {
      if (anim.failed || !anim.resultBuckets) return;
      const f = filterRef.current;
      // Copy the pre-computed result buckets into the live state
      for (let b = 0; b < NUM_BUCKETS; b++) {
        for (let s = 0; s < BUCKET_SIZE; s++) {
          f.buckets[b][s] = anim.resultBuckets[b][s];
        }
      }
      f.itemCount++;
      updateLoad();
    },
    [updateLoad],
  );

  /* ── Compute lookup animation ── */
  const computeLookup = useCallback((key: number): LookupAnimation => {
    const f = filterRef.current;
    const fp = fingerprint(key);
    const i1 = primaryBucket(key);
    const i2 = altBucket(i1, fp);

    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (f.buckets[i1][s] === fp) {
        return { type: "lookup", key, fp, i1, i2, found: true, foundBucket: i1, foundSlot: s };
      }
    }
    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (f.buckets[i2][s] === fp) {
        return { type: "lookup", key, fp, i1, i2, found: true, foundBucket: i2, foundSlot: s };
      }
    }

    return { type: "lookup", key, fp, i1, i2, found: false, foundBucket: -1, foundSlot: -1 };
  }, []);

  /* ── Compute delete animation ── */
  const computeDelete = useCallback((key: number): DeleteAnimation => {
    const f = filterRef.current;
    const fp = fingerprint(key);
    const i1 = primaryBucket(key);
    const i2 = altBucket(i1, fp);

    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (f.buckets[i1][s] === fp) {
        return { type: "delete", key, fp, i1, i2, found: true, foundBucket: i1, foundSlot: s };
      }
    }
    for (let s = 0; s < BUCKET_SIZE; s++) {
      if (f.buckets[i2][s] === fp) {
        return { type: "delete", key, fp, i1, i2, found: true, foundBucket: i2, foundSlot: s };
      }
    }

    return { type: "delete", key, fp, i1, i2, found: false, foundBucket: -1, foundSlot: -1 };
  }, []);

  /* ── Start an animation ── */
  const startAnimation = useCallback((anim: Animation) => {
    const now = performance.now();
    const phase =
      anim.type === "insert"
        ? "highlight-candidates"
        : anim.type === "lookup"
          ? "highlight-candidates"
          : "highlight-candidates";
    playbackRef.current = {
      animation: anim,
      phase,
      kickIndex: 0,
      progress: 0,
      startTime: now,
      phaseStartTime: now,
    };
    animatingRef.current = true;
    setIsAnimating(true);

    // Set info text
    if (anim.type === "insert") {
      infoTextRef.current = [
        `inserting key ${anim.key} -> fp: ${fpHex(anim.fp)} -> buckets [${anim.i1}, ${anim.i2}]`,
      ];
    } else if (anim.type === "lookup") {
      infoTextRef.current = [
        `lookup key ${anim.key} -> fp: ${fpHex(anim.fp)} -> buckets [${anim.i1}, ${anim.i2}]`,
      ];
    } else {
      infoTextRef.current = [
        `delete key ${anim.key} -> fp: ${fpHex(anim.fp)} -> buckets [${anim.i1}, ${anim.i2}]`,
      ];
    }
  }, []);

  /* ── Run insert ── */
  const doInsert = useCallback(
    (key: number) => {
      if (animatingRef.current) return;
      const anim = computeInsert(key);
      startAnimation(anim);
    },
    [computeInsert, startAnimation],
  );

  /* ── Run lookup ── */
  const doLookup = useCallback(
    (key: number) => {
      if (animatingRef.current) return;
      const anim = computeLookup(key);
      startAnimation(anim);
    },
    [computeLookup, startAnimation],
  );

  /* ── Run delete ── */
  const doDelete = useCallback(
    (key: number) => {
      if (animatingRef.current) return;
      const anim = computeDelete(key);
      startAnimation(anim);
    },
    [computeDelete, startAnimation],
  );

  /* ── Clear filter ── */
  const doClear = useCallback(() => {
    if (animatingRef.current) return;
    const seed = createSeededFilter();
    filterRef.current = seed.filter;
    nextKeyRef.current = seed.nextKey;
    playbackRef.current = null;
    infoTextRef.current = [];
    updateLoad();
  }, [updateLoad]);

  /* ── Auto mode ── */
  const scheduleAuto = useCallback(() => {
    if (!autoRef.current) return;
    const delay = 1500 / speedRef.current;
    autoTimerRef.current = setTimeout(() => {
      if (!autoRef.current) return;
      if (animatingRef.current) {
        // Wait a bit and try again
        scheduleAuto();
        return;
      }
      const key = nextKeyRef.current++;
      doInsert(key);
      scheduleAuto();
    }, delay);
  }, [doInsert]);

  const toggleAuto = useCallback(() => {
    const next = !autoRef.current;
    autoRef.current = next;
    setAutoMode(next);
    if (next) {
      scheduleAuto();
    } else {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    }
  }, [scheduleAuto]);

  /* ── Speed sync ── */
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /* ── Cleanup auto timer ── */
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  /* ── Render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    reducedMotionRef.current = prefersReducedMotion();
    updateLoad();

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

    /* ── Layout constants ── */
    const SLOT_W = 32;
    const SLOT_H = 28;
    const SLOT_GAP_Y = 2;
    const BUCKET_GAP_X = 8;
    const HEADER_H = 16;

    /* ── Get slot position in canvas coordinates ── */
    function getSlotPos(
      cw: number,
      ch: number,
      bucket: number,
      slot: number,
    ): { x: number; y: number } {
      const totalW = NUM_BUCKETS * SLOT_W + (NUM_BUCKETS - 1) * BUCKET_GAP_X;
      const totalH = HEADER_H + BUCKET_SIZE * SLOT_H + (BUCKET_SIZE - 1) * SLOT_GAP_Y;
      const startX = (cw - totalW) / 2;
      // Center within the usable area between navbar (48px) and controls/footer (~140px)
      const usableTop = 60;
      const usableBottom = ch - 140;
      const usableH = usableBottom - usableTop;
      const startY = usableTop + (usableH - totalH) / 2;

      const x = startX + bucket * (SLOT_W + BUCKET_GAP_X);
      const y = startY + HEADER_H + slot * (SLOT_H + SLOT_GAP_Y);
      return { x, y };
    }

    function getGridBounds(cw: number, ch: number) {
      const totalW = NUM_BUCKETS * SLOT_W + (NUM_BUCKETS - 1) * BUCKET_GAP_X;
      const totalH = HEADER_H + BUCKET_SIZE * SLOT_H + (BUCKET_SIZE - 1) * SLOT_GAP_Y;
      const startX = (cw - totalW) / 2;
      const usableTop = 60;
      const usableBottom = ch - 140;
      const usableH = usableBottom - usableTop;
      const startY = usableTop + (usableH - totalH) / 2;
      return { startX, startY, totalW, totalH };
    }

    /* ── Phase durations in ms (before speed adjustment) ── */
    const HIGHLIGHT_DUR = 500;
    const KICK_DUR = 400;
    const PLACE_DUR = 200;
    const FOUND_DUR = 600;
    const NOT_FOUND_DUR = 500;
    const DELETE_FADE_DUR = 300;

    /* ── Advance animation phases ── */
    function advancePlayback(now: number) {
      const pb = playbackRef.current;
      if (!pb) return;
      const spd = speedRef.current;
      const reduced = reducedMotionRef.current;
      const elapsed = (now - pb.phaseStartTime) * spd;
      const anim = pb.animation;

      if (pb.phase === "highlight-candidates") {
        const dur = reduced ? 50 : HIGHLIGHT_DUR;
        pb.progress = Math.min(1, elapsed / dur);
        if (elapsed >= dur) {
          if (anim.type === "insert") {
            const ins = anim as InsertAnimation;
            if (ins.kicks.length > 0) {
              pb.phase = "kick";
              pb.kickIndex = 0;
              pb.phaseStartTime = now;
              pb.progress = 0;
              infoTextRef.current.push(
                `kick #1: fp ${fpHex(ins.kicks[0].fp)} evicted from bucket ${ins.kicks[0].fromBucket}`,
              );
            } else {
              pb.phase = "place";
              pb.phaseStartTime = now;
              pb.progress = 0;
              // Apply the insert now
              applyInsert(ins);
            }
          } else if (anim.type === "lookup") {
            const lu = anim as LookupAnimation;
            pb.phase = lu.found ? "found" : "not-found";
            pb.phaseStartTime = now;
            pb.progress = 0;
            if (lu.found) {
              infoTextRef.current.push(
                `found fp ${fpHex(lu.fp)} in bucket ${lu.foundBucket} slot ${lu.foundSlot}`,
              );
            } else {
              infoTextRef.current.push("not found");
            }
          } else {
            const del = anim as DeleteAnimation;
            if (del.found) {
              pb.phase = "delete-fade";
              pb.phaseStartTime = now;
              pb.progress = 0;
              infoTextRef.current.push(
                `deleting fp ${fpHex(del.fp)} from bucket ${del.foundBucket}`,
              );
            } else {
              pb.phase = "not-found";
              pb.phaseStartTime = now;
              pb.progress = 0;
              infoTextRef.current.push("not found");
            }
          }
        }
      } else if (pb.phase === "kick") {
        const ins = anim as InsertAnimation;
        const dur = reduced ? 50 : KICK_DUR;
        pb.progress = Math.min(1, elapsed / dur);
        if (elapsed >= dur) {
          // Move to next kick or to place phase
          if (pb.kickIndex < ins.kicks.length - 1) {
            pb.kickIndex++;
            pb.phaseStartTime = now;
            pb.progress = 0;
            const kick = ins.kicks[pb.kickIndex];
            infoTextRef.current.push(
              `kick #${pb.kickIndex + 1}: fp ${fpHex(kick.fp)} evicted from bucket ${kick.fromBucket}`,
            );
          } else {
            // All kicks done, apply and place
            applyInsert(ins);
            pb.phase = "place";
            pb.phaseStartTime = now;
            pb.progress = 0;
          }
        }
      } else if (pb.phase === "place") {
        const dur = reduced ? 50 : PLACE_DUR;
        pb.progress = Math.min(1, elapsed / dur);
        if (elapsed >= dur) {
          pb.phase = "done";
          animatingRef.current = false;
          setIsAnimating(false);
        }
      } else if (pb.phase === "found") {
        const dur = reduced ? 50 : FOUND_DUR;
        pb.progress = Math.min(1, elapsed / dur);
        if (elapsed >= dur) {
          pb.phase = "done";
          animatingRef.current = false;
          setIsAnimating(false);
        }
      } else if (pb.phase === "not-found") {
        const dur = reduced ? 50 : NOT_FOUND_DUR;
        pb.progress = Math.min(1, elapsed / dur);
        if (elapsed >= dur) {
          pb.phase = "done";
          animatingRef.current = false;
          setIsAnimating(false);
        }
      } else if (pb.phase === "delete-fade") {
        const dur = reduced ? 50 : DELETE_FADE_DUR;
        pb.progress = Math.min(1, elapsed / dur);
        if (elapsed >= dur) {
          // Actually delete the fingerprint
          const del = anim as DeleteAnimation;
          if (del.found) {
            const f = filterRef.current;
            f.buckets[del.foundBucket][del.foundSlot] = null;
            f.itemCount--;
            updateLoad();
          }
          pb.phase = "done";
          animatingRef.current = false;
          setIsAnimating(false);
        }
      }
    }

    /* ── Main draw ── */
    function drawFrame(now: number) {
      if (!canvas || !ctx) return;
      rafRef.current = requestAnimationFrame(drawFrame);

      const theme = getThemeColors();
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, cw, ch);

      const f = filterRef.current;
      const pb = playbackRef.current;

      // Advance animation
      if (pb && pb.phase !== "done") {
        advancePlayback(now);
      }

      const { startX, startY } = getGridBounds(cw, ch);

      // Determine which buckets are candidates
      let candidateBuckets: Set<number> = new Set();
      let accentSlot: { bucket: number; slot: number } | null = null;
      let errorBuckets: Set<number> = new Set();
      let fadeSlot: { bucket: number; slot: number; alpha: number } | null = null;
      let placeSlot: { bucket: number; slot: number; scale: number } | null = null;

      if (pb && pb.phase !== "done") {
        const anim = pb.animation;
        candidateBuckets.add(anim.i1);
        candidateBuckets.add(anim.i2);

        if (pb.phase === "found") {
          const lu = anim as LookupAnimation;
          accentSlot = { bucket: lu.foundBucket, slot: lu.foundSlot };
        } else if (pb.phase === "not-found") {
          errorBuckets.add(anim.i1);
          errorBuckets.add(anim.i2);
        } else if (pb.phase === "delete-fade") {
          const del = anim as DeleteAnimation;
          fadeSlot = { bucket: del.foundBucket, slot: del.foundSlot, alpha: 1 - pb.progress };
        } else if (pb.phase === "place") {
          const ins = anim as InsertAnimation;
          if (!ins.failed) {
            placeSlot = {
              bucket: ins.finalBucket,
              slot: ins.finalSlot,
              scale: easeInOut(pb.progress),
            };
          }
        }
      }

      // ── Draw bucket headers ──
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      for (let b = 0; b < NUM_BUCKETS; b++) {
        const x = startX + b * (SLOT_W + BUCKET_GAP_X) + SLOT_W / 2;
        const y = startY + HEADER_H - 4;
        ctx.fillStyle = candidateBuckets.has(b) ? theme.accent : theme.muted;
        ctx.globalAlpha = candidateBuckets.has(b) ? 0.9 : 0.5;
        ctx.fillText(String(b), x, y);
        ctx.globalAlpha = 1;
      }

      // ── Draw slots ──
      for (let b = 0; b < NUM_BUCKETS; b++) {
        for (let s = 0; s < BUCKET_SIZE; s++) {
          const pos = getSlotPos(cw, ch, b, s);
          const val = f.buckets[b][s];

          const isCandidateBucket = candidateBuckets.has(b);
          const isErrorBucket = errorBuckets.has(b);
          const isAccent = accentSlot !== null && accentSlot.bucket === b && accentSlot.slot === s;
          const isFade = fadeSlot !== null && fadeSlot.bucket === b && fadeSlot.slot === s;
          const isPlace = placeSlot !== null && placeSlot.bucket === b && placeSlot.slot === s;

          // Slot background
          if (isAccent) {
            ctx.fillStyle = theme.accent;
            ctx.globalAlpha = 0.4 + 0.3 * Math.sin((pb?.progress ?? 0) * Math.PI);
            ctx.fillRect(pos.x, pos.y, SLOT_W, SLOT_H);
            ctx.globalAlpha = 1;
          } else if (val !== null) {
            ctx.fillStyle = theme.slotFill;
            ctx.fillRect(pos.x, pos.y, SLOT_W, SLOT_H);
          }

          // Slot border
          if (isErrorBucket && pb && pb.phase === "not-found") {
            ctx.strokeStyle = theme.error;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 1 - pb.progress * 0.5;
          } else if (isAccent) {
            ctx.strokeStyle = theme.accent;
            ctx.lineWidth = 2;
          } else if (isCandidateBucket && pb && pb.phase === "highlight-candidates") {
            ctx.strokeStyle = theme.accent;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(pb.progress * Math.PI * 2);
          } else if (isCandidateBucket) {
            ctx.strokeStyle = theme.accent;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
          } else if (val === null) {
            // Empty: dashed border
            ctx.strokeStyle = theme.stroke;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.7;
            ctx.setLineDash([3, 3]);
          } else {
            ctx.strokeStyle = theme.stroke;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.6;
          }

          ctx.strokeRect(pos.x, pos.y, SLOT_W, SLOT_H);
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;

          // Slot content
          if (val !== null) {
            let drawAlpha = 1;
            let drawScale = 1;

            if (isFade && fadeSlot) {
              drawAlpha = fadeSlot.alpha;
            }
            if (isPlace && placeSlot) {
              drawScale = placeSlot.scale;
            }

            ctx.save();
            if (drawScale !== 1) {
              const cx = pos.x + SLOT_W / 2;
              const cy = pos.y + SLOT_H / 2;
              ctx.translate(cx, cy);
              ctx.scale(drawScale, drawScale);
              ctx.translate(-cx, -cy);
            }
            ctx.globalAlpha = drawAlpha;
            ctx.fillStyle = isAccent ? theme.accent : theme.text;
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(fpHex(val), pos.x + SLOT_W / 2, pos.y + SLOT_H / 2);
            ctx.restore();
          }
        }
      }

      // ── Draw kick arcs ──
      if (pb && pb.phase === "kick" && pb.animation.type === "insert") {
        const ins = pb.animation as InsertAnimation;

        // Draw completed kick arcs (dimmed)
        for (let k = 0; k < pb.kickIndex; k++) {
          const kick = ins.kicks[k];
          const from = getSlotPos(cw, ch, kick.fromBucket, kick.fromSlot);
          const to =
            kick.toSlot >= 0
              ? getSlotPos(cw, ch, kick.toBucket, kick.toSlot)
              : getSlotPos(cw, ch, kick.toBucket, 0);

          const fx = from.x + SLOT_W / 2;
          const fy = from.y;
          const tx = to.x + SLOT_W / 2;
          const ty = to.y;
          const mx = (fx + tx) / 2;
          const my = Math.min(fy, ty) - 60;

          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.quadraticCurveTo(mx, my, tx, ty);
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.15;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Draw current kick arc with traveling fingerprint
        const kick = ins.kicks[pb.kickIndex];
        if (kick) {
          const from = getSlotPos(cw, ch, kick.fromBucket, kick.fromSlot);
          // If toSlot is -1, we're going to evict from toBucket too. Show arc to middle of that bucket.
          const to =
            kick.toSlot >= 0
              ? getSlotPos(cw, ch, kick.toBucket, kick.toSlot)
              : getSlotPos(cw, ch, kick.toBucket, Math.floor(BUCKET_SIZE / 2));

          const fx = from.x + SLOT_W / 2;
          const fy = from.y;
          const tx = to.x + SLOT_W / 2;
          const ty = to.y;
          const mx = (fx + tx) / 2;
          const my = Math.min(fy, ty) - 60;

          const t = easeInOut(pb.progress);

          // Draw arc trail
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          // Draw partial arc up to current t
          const steps = Math.max(2, Math.floor(t * 30));
          for (let i = 1; i <= steps; i++) {
            const st = (i / steps) * t;
            const [sx, sy] = quadBezierPoint(fx, fy, mx, my, tx, ty, st);
            ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Draw traveling fingerprint ball
          const [bx, by] = quadBezierPoint(fx, fy, mx, my, tx, ty, t);
          const ballR = 10;

          ctx.beginPath();
          ctx.arc(bx, by, ballR, 0, Math.PI * 2);
          ctx.fillStyle = theme.accent;
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Fingerprint label inside ball
          ctx.fillStyle = theme.bg;
          ctx.font = "bold 7px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(fpHex(kick.fp), bx, by);
        }
      }

      // ── Info panel at top ──
      const infoLines = infoTextRef.current;
      if (infoLines.length > 0) {
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const maxLines = Math.min(infoLines.length, 4);
        const startLine = Math.max(0, infoLines.length - maxLines);
        for (let i = startLine; i < infoLines.length; i++) {
          const lineIdx = i - startLine;
          const alpha = lineIdx === maxLines - 1 ? 0.8 : 0.3 + (lineIdx / maxLines) * 0.3;
          ctx.fillStyle = theme.text;
          ctx.globalAlpha = alpha;
          ctx.fillText(infoLines[i], cw / 2, 60 + lineIdx * 16);
        }
        ctx.globalAlpha = 1;
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);

    // Auto-insert on startup
    autoRef.current = true;
    setAutoMode(true);
    scheduleAuto();

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [updateLoad, scheduleAuto]);

  /* ── Handlers ── */
  const handleInsertRandom = useCallback(() => {
    const key = nextKeyRef.current++;
    doInsert(key);
  }, [doInsert]);

  const handleInsertSpecific = useCallback(() => {
    const parsed = parseInt(insertKey, 10);
    if (Number.isNaN(parsed)) return;
    doInsert(parsed);
  }, [doInsert, insertKey]);

  const handleLookup = useCallback(() => {
    const parsed = parseInt(lookupKey, 10);
    if (Number.isNaN(parsed)) return;
    doLookup(parsed);
  }, [doLookup, lookupKey]);

  const handleDelete = useCallback(() => {
    const parsed = parseInt(lookupKey, 10);
    if (Number.isNaN(parsed)) return;
    doDelete(parsed);
  }, [doDelete, lookupKey]);

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
        {/* Insert random */}
        <button
          onClick={handleInsertRandom}
          disabled={isAnimating}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          insert
        </button>

        {/* Insert specific */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={insertKey}
            onChange={(e) => setInsertKey(e.target.value)}
            placeholder="#"
            className="w-12 rounded border border-foreground/10 bg-transparent px-1.5 py-1 font-mono text-[10px] text-foreground/60 outline-none placeholder:text-foreground/20"
          />
          <button
            onClick={handleInsertSpecific}
            disabled={isAnimating || !insertKey}
            className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
          >
            insert #
          </button>
        </div>

        {/* Auto toggle */}
        <button
          onClick={toggleAuto}
          className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            autoMode
              ? "border-foreground/30 text-foreground/80"
              : "border-foreground/10 text-foreground/50 hover:text-foreground/80"
          }`}
        >
          auto
        </button>

        {/* Lookup / delete */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={lookupKey}
            onChange={(e) => setLookupKey(e.target.value)}
            placeholder="key"
            className="w-12 rounded border border-foreground/10 bg-transparent px-1.5 py-1 font-mono text-[10px] text-foreground/60 outline-none placeholder:text-foreground/20"
          />
          <button
            onClick={handleLookup}
            disabled={isAnimating || !lookupKey}
            className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
          >
            lookup
          </button>
          <button
            onClick={handleDelete}
            disabled={isAnimating || !lookupKey}
            className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
          >
            delete
          </button>
        </div>

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

        {/* Clear */}
        <button
          onClick={doClear}
          disabled={isAnimating}
          className="rounded border border-foreground/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/50 hover:text-foreground/80 disabled:opacity-40"
        >
          clear
        </button>

        {/* Load indicator */}
        <span className="font-mono text-[9px] text-foreground/30">{loadDisplay}</span>
      </div>
    </>
  );
}
