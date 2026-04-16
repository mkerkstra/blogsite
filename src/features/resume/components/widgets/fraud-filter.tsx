import { WidgetFrame } from "@/components/widget-frame";

export function FraudFilter() {
  return (
    <WidgetFrame label="request filter" caption="chargebacks −50%">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        <g fill="currentColor" opacity="0.6">
          <rect x="14" y="20" width="24" height="6" />
          <rect x="14" y="32" width="24" height="6" />
          <rect x="14" y="44" width="24" height="6" />
          <rect x="14" y="56" width="24" height="6" />
          <rect x="14" y="68" width="24" height="6" />
        </g>
        <line
          x1="58"
          y1="16"
          x2="58"
          y2="80"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        <text x="58" y="92" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">
          check
        </text>
        <circle
          cx="58"
          cy="48"
          r="3"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          className="widget-packet"
        />
        <g fill="hsl(var(--background))" stroke="currentColor">
          <rect x="84" y="20" width="24" height="6" />
          <rect x="84" y="32" width="24" height="6" />
          <rect x="84" y="56" width="24" height="6" />
        </g>
        <rect x="84" y="44" width="24" height="6" fill="hsl(var(--accent))" stroke="currentColor" />
        <rect x="84" y="68" width="24" height="6" fill="hsl(var(--accent))" stroke="currentColor" />
        <text x="128" y="26" fontSize="8" fill="hsl(var(--muted-foreground))">
          accept
        </text>
        <text x="128" y="72" fontSize="8" fill="currentColor">
          reject
        </text>
        <text x="128" y="82" fontSize="7" fill="hsl(var(--muted-foreground))">
          embargoed / risk
        </text>
      </svg>
    </WidgetFrame>
  );
}
