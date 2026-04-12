import type { ReactNode } from "react";

/**
 * Shared chrome for every Experience widget. Hairline border, slightly
 * recessed background (muted token), uppercase mono label + caption.
 * Matches the editorial grammar — no rounded corners, no shadow, no
 * card-style chrome. Inner viz slot inherits text color so SVGs can use
 * `currentColor` for ink strokes.
 *
 * **Accessibility:** The frame is marked `aria-hidden="true"` because
 * widgets are decorative flare adjacent to the real semantic content
 * (the highlight prose). If a future widget ever needs to convey info
 * not present in the neighboring text, that individual widget can add
 * a `role="img"` + `aria-label` inside its SVG to re-expose itself.
 */
export function WidgetFrame({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-1.5 border border-border bg-muted/50 p-3 text-foreground"
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <div className="flex min-h-[88px] flex-1 items-center justify-center">{children}</div>
      <p className="font-mono text-[9px] tabular-nums tracking-wide text-muted-foreground">
        {caption}
      </p>
    </div>
  );
}
