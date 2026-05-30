"use client";

import { cn } from "@/lib/utils";

/** Tiny uppercase readout label. */
const readoutLabel =
  "font-mono text-[8px] uppercase tracking-[0.18em] text-foreground/35 leading-none";

/** Pulsing "live" marker; the pulse drops under prefers-reduced-motion. */
export function LiveDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
    />
  );
}

/** Single metric. `primary` makes it the big accent gauge the eye lands on. */
export function Gauge({
  label,
  value,
  unit,
  primary,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  primary?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={readoutLabel}>{label}</span>
      <span
        className={cn(
          "font-mono leading-none tabular-nums",
          primary ? "text-[15px] text-accent" : "text-[11px] text-foreground/90",
        )}
      >
        {value}
        {unit && (
          <span className={cn("ml-0.5 text-foreground/40", primary ? "text-[9px]" : "text-[7px]")}>
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

/** A counted-progress metric (e.g. step 17 / 64) with a hairline bar. */
export function ProgressGauge({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <span className={readoutLabel}>{label}</span>
      <span className="font-mono text-[13px] leading-none tabular-nums text-accent">
        {value}
        <span className="text-foreground/30">/{total}</span>
      </span>
      <span className="block h-[3px] w-16 rounded-full bg-border" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/** A segmented bar metric (e.g. 3 of 8 experts active). */
export function BarGauge({
  label,
  value,
  segments,
  active,
}: {
  label: string;
  value: React.ReactNode;
  segments: number;
  active: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={readoutLabel}>{label}</span>
      <span className="font-mono text-[12px] leading-none tabular-nums text-foreground/90">
        {value}
      </span>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn("h-1 w-2 rounded-[1px]", i < active ? "bg-accent" : "bg-border")}
          />
        ))}
      </span>
    </div>
  );
}

/** A formula readout (e.g. cos(a,b) = 0.82) — expression, not prose. */
export function FormulaGauge({
  label,
  expr,
  value,
}: {
  label: string;
  expr: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={readoutLabel}>{label}</span>
      <span className="font-mono text-[12px] leading-none tabular-nums">
        <span className="text-foreground/60">{expr}</span>
        <span className="mx-1 text-foreground/30">=</span>
        <span className="text-accent">{value}</span>
      </span>
    </div>
  );
}
