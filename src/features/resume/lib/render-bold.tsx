import * as React from "react";

/**
 * Tiny renderer for **bold** spans inside resume highlight strings.
 * Bold spans render as accent-colored text (the editorial highlight),
 * not as semibold — the mono face is dense enough that color contrast reads better than weight contrast.
 */
export function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span
          key={i}
          className="text-foreground underline decoration-accent decoration-2 underline-offset-4"
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
