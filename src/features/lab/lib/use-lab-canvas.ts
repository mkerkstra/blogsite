"use client";

import { useEffect, useRef } from "react";

import { type LabBounds, labBounds } from "./layout";

/** The full-bleed canvas every lab uses; the chrome floats translucent on top. */
export const LAB_CANVAS_CLASS = "fixed inset-0 h-full w-full bg-background";

export interface LabCanvasSize {
  /** Backing-store width (device px). */
  width: number;
  /** Backing-store height (device px). */
  height: number;
  dpr: number;
  /** Safe content rect (device px) — see `labBounds`. */
  bounds: LabBounds;
}

/**
 * Owns the boilerplate every canvas lab repeats: a full-bleed `<canvas>`, DPR
 * sizing, and a ResizeObserver. Context-agnostic — the lab pulls its own
 * `webgl2`/`2d` context off `canvasRef` and reads the live size from `sizeRef`
 * in its frame loop. The background bleeds to the edges; place content inside
 * `sizeRef.current.bounds`.
 *
 * Sizing runs synchronously on mount (before the lab's own setup effect, as long
 * as `useLabCanvas()` is called above it), so the lab can read a sized canvas.
 */
export function useLabCanvas(opts?: { onResize?: (size: LabCanvasSize) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef<LabCanvasSize>({
    width: 0,
    height: 0,
    dpr: 1,
    bounds: labBounds(0, 0, 1),
  });
  const onResizeRef = useRef(opts?.onResize);
  onResizeRef.current = opts?.onResize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      const prev = sizeRef.current;
      if (width === prev.width && height === prev.height && dpr === prev.dpr) return;
      canvas.width = width;
      canvas.height = height;
      const size: LabCanvasSize = { width, height, dpr, bounds: labBounds(width, height, dpr) };
      sizeRef.current = size;
      onResizeRef.current?.(size);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return { canvasRef, sizeRef };
}
