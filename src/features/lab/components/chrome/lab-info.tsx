"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "How it works" disclosure. Controlled by LabChrome (which owns the trigger,
 * the `?` / ⌘K wiring, and Escape). Rather than a side drawer that eats half the
 * view, it *rises from the strip* over the canvas: a height-capped panel anchored
 * above the strip, with a scrim that dims only the covered region. The artifact
 * keeps running and stays partly visible. It's a disclosure, not a mode.
 */
export function LabInfo({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* scrim — only over the covered (bottom) region; canvas stays visible above */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-x-0 bottom-0 z-20 h-[60vh] bg-gradient-to-t from-background/85 via-background/55 to-transparent transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        id="lab-info-panel"
        role="complementary"
        aria-label="How it works"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed inset-x-0 bottom-12 z-20 border-t border-accent/60 bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-out motion-reduce:transition-none",
          open ? "translate-y-0" : "pointer-events-none translate-y-[calc(100%+3rem)]",
        )}
      >
        <div className="mx-auto max-h-[44vh] w-full max-w-3xl overflow-y-auto px-5 py-5 md:px-8">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              how it works
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 inline-flex min-h-[24px] min-w-[24px] items-center justify-center text-muted-foreground transition-colors hover:text-accent"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-4 text-[13px] leading-[1.7] text-foreground/70">{children}</div>
        </div>
      </aside>
    </>
  );
}
