"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { glossary } from "@/features/lab/data/glossary";

/**
 * Inline glossary tooltip for domain-specific terms.
 * Dotted underline; hover/focus reveals a fixed-position definition.
 * The tooltip is portaled so it can clamp inside the info panel instead of
 * being clipped by the panel's scrolling container.
 */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  const def = glossary[id];
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number; maxWidth: number } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = anchor.closest("#lab-info-panel")?.getBoundingClientRect();
    const edge = 12;
    const minX = Math.max(edge, (panelRect?.left ?? 0) + edge);
    const maxRight = Math.min(
      window.innerWidth - edge,
      (panelRect?.right ?? window.innerWidth) - edge,
    );
    const maxWidth = Math.max(160, Math.min(208, maxRight - minX));

    tooltip.style.maxWidth = `${maxWidth}px`;
    const tooltipRect = tooltip.getBoundingClientRect();
    const width = Math.min(tooltipRect.width || maxWidth, maxWidth);
    const height = tooltipRect.height || 0;

    const centeredX = anchorRect.left + anchorRect.width / 2 - width / 2;
    const x = Math.max(minX, Math.min(centeredX, maxRight - width));
    const belowY = anchorRect.bottom + 8;
    const aboveY = anchorRect.top - height - 8;
    const y =
      belowY + height <= window.innerHeight - edge
        ? belowY
        : Math.max(edge, Math.min(aboveY, window.innerHeight - height - edge));

    setPosition({ x, y, maxWidth });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    let frame = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updatePosition]);

  if (!def) return <>{children}</>;

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-muted-foreground/40 focus-visible:outline-1 focus-visible:outline-accent"
      >
        {children}
      </span>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className="fixed z-[60] rounded border border-border bg-background px-2.5 py-1.5 text-[11px] leading-[1.5] text-foreground/70 shadow-md"
            style={{
              left: position?.x ?? 0,
              top: position?.y ?? 0,
              maxWidth: position?.maxWidth ?? 208,
              visibility: position ? "visible" : "hidden",
              pointerEvents: "none",
            }}
          >
            {def}
          </div>,
          document.body,
        )}
    </>
  );
}
