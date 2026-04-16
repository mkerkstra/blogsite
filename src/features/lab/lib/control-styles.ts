/**
 * Shared control bar styling for lab experiment UIs.
 * Used by the bottom-of-screen toolbar in each experiment.
 */

/** Base button class — mono, uppercase, small, with transition */
export const btnBase =
  "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors";

/** Active/selected button state — filled background */
export const btnActive = "bg-foreground/10 text-foreground/80";

/** Inactive/unselected button state — dim with hover */
export const btnInactive = "text-foreground/30 hover:text-foreground/50";

/** Control bar container — fixed at bottom-center with blur backdrop */
export const controlBar =
  "fixed bottom-16 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded bg-background/80 px-4 py-2.5 backdrop-blur-sm";

/** Vertical separator between control groups */
export const controlDivider = "h-4 w-px bg-foreground/10";

/** Tiny label above a slider or control group */
export const controlLabel = "font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30";
