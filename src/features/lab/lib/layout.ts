/**
 * Single source of truth for the lab chrome bands. Both the canvas (JS, via
 * `labBounds`) and any HTML overlay (CSS, via the `--lab-inset-*` vars set on the
 * lab shell) read these, so nothing draws under the navbar or the control strip.
 * Change a band's height here and every lab rebalances — no more per-lab `navH`
 * guesses drifting out of sync (the root cause of the edge collisions).
 */
export const LAB_INSETS = {
  /** Navbar band at the top (h-12 + border ≈ 49px) plus breathing room. */
  top: 56,
  /** LabChrome control strip at the bottom (h-12) plus breathing room. */
  bottom: 56,
} as const;

export interface LabBounds {
  /** Left edge (device px). */
  x: number;
  /** Top edge — below the navbar band (device px). */
  y: number;
  /** Right edge (device px). */
  right: number;
  /** Bottom edge — above the control strip (device px). */
  bottom: number;
  /** Safe content width (device px). */
  width: number;
  /** Safe content height (device px). */
  height: number;
}

/**
 * Safe content rect for a full-bleed lab canvas, in device pixels.
 *
 * The canvas stays `inset-0` and the *background* may bleed to every edge; this
 * is where a lab should keep its **meaningful** content — labels, axes, the
 * primary elements, anything that must not slip under the navbar or the strip.
 * `width`/`height` are the backing-store dimensions (`canvas.width/height`).
 */
export function labBounds(width: number, height: number, dpr: number): LabBounds {
  const top = LAB_INSETS.top * dpr;
  const bottom = LAB_INSETS.bottom * dpr;
  return {
    x: 0,
    y: top,
    right: width,
    bottom: Math.max(top, height - bottom),
    width,
    height: Math.max(0, height - top - bottom),
  };
}
