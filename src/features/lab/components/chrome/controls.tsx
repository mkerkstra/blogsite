"use client";

import { useId } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

/** Tiny uppercase field label shared by every control. */
export const fieldLabel = "font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground";

/**
 * A cluster of controls of one kind (Setup · Transport · Meta), grouped per
 * Gestalt. `sticky` groups (the primary verb — transport) never fold into the
 * overflow sheet when the strip runs out of room; everything else folds first.
 * The `label` doubles as the sheet section heading and the scent fragment.
 */
export function ControlGroup({
  label,
  sticky: _sticky,
  children,
}: {
  label?: string;
  sticky?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {label && (
        <span className="hidden font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/30 md:inline">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/** Hairline divider between control groups. */
export function ControlDivider() {
  return <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />;
}

/**
 * Icon button — the base for every tappable control (tools, transport).
 * h-8/min-w-8 keeps the tap target ≥24px (WCAG 2.5.8); `primary` outlines the
 * one verb that anchors the strip.
 */
export function Tool({
  label,
  title,
  icon,
  onClick,
  active,
  pressed,
  primary,
}: {
  label: string;
  title?: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  pressed?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-muted-foreground transition-colors hover:text-accent",
        primary && "border border-foreground/20 text-foreground hover:text-accent",
        active && "text-accent",
      )}
    >
      {icon}
    </button>
  );
}

/** Labeled range slider with a non-reflowing tabular value readout. */
export function LabSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <span className="flex items-center gap-2">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-20 cursor-pointer accent-foreground/50"
      />
      <span className="min-w-[3ch] font-mono text-[9px] tabular-nums text-foreground/50">
        {format ? format(value) : value}
      </span>
    </span>
  );
}

/** Play/pause + reset — the protected "primary verb" cluster. */
export function Transport({
  playing,
  onToggle,
  onReset,
}: {
  playing: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Tool
        label="Reset (R)"
        title="Reset (R)"
        onClick={onReset}
        icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
      />
      <Tool
        label={playing ? "Pause (Space)" : "Play (Space)"}
        title={playing ? "Pause (Space)" : "Play (Space)"}
        onClick={onToggle}
        pressed={playing}
        primary
        icon={
          playing ? (
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )
        }
      />
    </div>
  );
}

/** Labeled select; the associated `<label>` is the accessible name (select-name). */
export function LabSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <span className="flex items-center gap-2">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-7 cursor-pointer rounded border border-foreground/15 bg-background/60 px-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/80 focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** −/+ stepper with a non-reflowing value. The glyph buttons carry aria-labels. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <span className="flex items-center gap-2">
      {label && <span className={fieldLabel}>{label}</span>}
      <span className="inline-flex items-center rounded border border-foreground/15">
        <button
          type="button"
          aria-label={`Decrease ${label ?? "value"}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="inline-flex h-7 w-6 items-center justify-center text-foreground/60 transition-colors hover:text-accent"
        >
          −
        </button>
        <span className="min-w-[2.5ch] text-center font-mono text-[10px] tabular-nums text-foreground/80">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label ?? "value"}`}
          onClick={() => onChange(Math.min(max, value + step))}
          className="inline-flex h-7 w-6 items-center justify-center text-foreground/60 transition-colors hover:text-accent"
        >
          +
        </button>
      </span>
    </span>
  );
}

/** A row of mutually-exclusive option buttons (sizes, distributions, modes). */
export function Segmented<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <span className="flex items-center gap-2">
      {label && <span className={fieldLabel}>{label}</span>}
      <span className="inline-flex items-center gap-0.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              "inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded px-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
              value === o.value
                ? "bg-foreground/10 text-foreground/90"
                : "text-foreground/40 hover:text-foreground/70",
            )}
          >
            {o.label}
          </button>
        ))}
      </span>
    </span>
  );
}

/** Single on/off control (its visible text is the accessible name). */
export function Toggle({
  label,
  pressed,
  onChange,
}: {
  label: string;
  pressed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!pressed)}
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-[24px] items-center rounded px-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
        pressed
          ? "bg-foreground/10 text-foreground/90"
          : "text-foreground/40 hover:text-foreground/70",
      )}
    >
      {label}
    </button>
  );
}
