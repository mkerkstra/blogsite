/** Shared environment utilities for lab experiments. */

/** Returns the current theme based on the document root class. */
export function getTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Returns true when the user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
