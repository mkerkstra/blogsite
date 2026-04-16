"use client";

import * as React from "react";

/**
 * Subtle hint in the navbar advertising the ⌘K command palette.
 * Detects platform to show ⌘ on macOS and Ctrl elsewhere.
 * Hidden on mobile (no keyboard).
 */
export function CommandPaletteHint() {
  const [isMac, setIsMac] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const dispatch = () => {
    // Open the palette by dispatching the same keyboard event the
    // palette listens for.
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
    });
    document.dispatchEvent(event);
  };

  const modifier = mounted && !isMac ? "Ctrl" : "⌘";
  return (
    <button
      type="button"
      onClick={dispatch}
      aria-label={`${modifier} K, open command palette`}
      className="hidden h-8 items-center gap-1 px-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent sm:inline-flex"
    >
      <kbd className="border border-border px-1 py-0.5">{modifier}</kbd>
      <kbd className="border border-border px-1 py-0.5">K</kbd>
    </button>
  );
}
