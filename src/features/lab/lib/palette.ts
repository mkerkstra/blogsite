/**
 * Shared theme palettes (sRGB) for WebGL lab experiments.
 *
 * Used by physarum, fluid, reaction-diffusion, and ray-march.
 * Maps the site's two-tone + lime accent into GL-friendly [r,g,b] triples.
 */
export const PALETTE = {
  light: {
    bg: [0.955, 0.945, 0.92],
    fg: [0.05, 0.05, 0.05],
    accent: [0.15, 0.55, 0.05],
  },
  dark: {
    bg: [0.03, 0.03, 0.03],
    fg: [0.88, 0.9, 0.87],
    accent: [0.2, 1.0, 0.35],
  },
} as const;

/**
 * Simpler two-color palette used by flow-field and strange-attractor.
 * No accent channel — just background and stroke color.
 */
export const TRAIL_PALETTE = {
  light: {
    bg: [0.955, 0.945, 0.92] as readonly number[],
    color: [0.08, 0.08, 0.08] as readonly number[],
  },
  dark: {
    bg: [0.012, 0.012, 0.012] as readonly number[],
    color: [0.8, 0.88, 0.78] as readonly number[],
  },
};
