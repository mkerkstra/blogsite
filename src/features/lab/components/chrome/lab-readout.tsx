"use client";

import { cn } from "@/lib/utils";

import { LiveDot } from "./gauges";

/**
 * Live-telemetry HUD — the lab's *output* zone (eyes), pinned to the canvas top
 * to stay clear of the input strip at the bottom (hands). Borderless, translucent,
 * and `pointer-events-none`: you read it, you don't poke it. Keep it to ≤4 gauges
 * with one `primary`. Values must be tabular so they change without reflowing.
 */
export function LabReadout({
  corner = "left",
  children,
}: {
  corner?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      aria-label="Live metrics"
      className={cn(
        "pointer-events-none fixed top-[60px] z-10 flex select-none items-start gap-4 rounded bg-background/55 px-3 py-2 backdrop-blur-[2px] md:top-16",
        corner === "left" ? "left-5 md:left-8" : "right-5 md:right-8",
      )}
    >
      <span className="mt-0.5">
        <LiveDot />
      </span>
      {children}
    </div>
  );
}
