"use client";

import * as React from "react";

/**
 * Dev-only console filter.
 *
 * Silences specific React 19 console warnings that come from
 * third-party libraries we can't cleanly patch (mostly next-themes
 * emitting an inline <script> tag that React 19's reconciler
 * complains about). No impact in production — we early-return if
 * NODE_ENV isn't "development".
 *
 * Rule of thumb for what goes in SUPPRESSED_PATTERNS:
 * - Must be from a library we don't control
 * - Must be a known-benign false positive (the code works correctly)
 * - Must have a specific enough regex that it can't swallow real
 *   warnings on unrelated code
 *
 * Remove patterns here as upstream libraries release fixes.
 */

const SUPPRESSED_PATTERNS: RegExp[] = [
  // next-themes 0.4.6 renders <script dangerouslySetInnerHTML> for its
  // theme-init script, which React 19 warns about. The script DOES
  // execute correctly on initial SSR parse. Remove this pattern once
  // next-themes ships a React 19-compatible release.
  /Encountered a script tag while rendering React component/,
];

function shouldSuppress(args: unknown[]): boolean {
  const first = args[0];
  const msg =
    typeof first === "string"
      ? first
      : first instanceof Error
        ? first.message
        : typeof first === "object" && first !== null && "message" in first
          ? String((first as { message: unknown }).message)
          : "";
  return SUPPRESSED_PATTERNS.some((re) => re.test(msg));
}

export function DevConsoleFilter() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (shouldSuppress(args)) return;
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);
  return null;
}
