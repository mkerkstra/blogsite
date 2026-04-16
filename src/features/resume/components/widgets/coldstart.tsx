import { WidgetFrame } from "@/components/widget-frame";

export function Coldstart() {
  return (
    <WidgetFrame label="time to interactive" caption="redux → react query migration">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        <text x="14" y="30" fontSize="8" fill="hsl(var(--muted-foreground))">
          before
        </text>
        <line x1="56" y1="28" x2="196" y2="28" stroke="currentColor" opacity="0.4" />
        <circle cx="70" cy="28" r="3" fill="currentColor" opacity="0.45" />
        <circle cx="100" cy="28" r="3" fill="currentColor" opacity="0.45" />
        <circle cx="130" cy="28" r="3" fill="currentColor" opacity="0.45" />
        <circle cx="160" cy="28" r="3" fill="currentColor" opacity="0.45" />
        <circle cx="188" cy="28" r="5" fill="currentColor" opacity="0.45" />

        <text x="14" y="60" fontSize="8" fill="hsl(var(--muted-foreground))">
          after
        </text>
        <line x1="56" y1="58" x2="196" y2="58" stroke="currentColor" opacity="0.4" />
        <circle
          cx="70"
          cy="58"
          r="3"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          className="widget-fast-dot widget-fast-dot-1"
        />
        <circle
          cx="92"
          cy="58"
          r="3"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          className="widget-fast-dot widget-fast-dot-2"
        />
        <circle
          cx="114"
          cy="58"
          r="5"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          className="widget-fast-dot widget-fast-dot-3"
        />

        <line x1="56" y1="78" x2="196" y2="78" stroke="currentColor" opacity="0.3" />
        <text x="14" y="90" fontSize="8" fill="hsl(var(--muted-foreground))">
          cold fetch −40% · bundle −20%
        </text>
      </svg>
    </WidgetFrame>
  );
}
