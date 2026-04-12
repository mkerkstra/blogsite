import { WidgetFrame } from "@/components/widget-frame";

export function PerformanceGauge() {
  return (
    <WidgetFrame label="performance" caption="LCP · CLS · INP">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        {/* Horizontal track */}
        <rect x="14" y="42" width="192" height="4" fill="currentColor" opacity="0.15" rx="2" />
        {/* Filled bar */}
        <rect x="14" y="42" width="192" height="4" fill="hsl(var(--accent))" rx="2" />
        {/* Metric markers */}
        <g fontSize="7" fill="hsl(var(--muted-foreground))">
          <circle cx="60" cy="44" r="6" fill="hsl(var(--background))" stroke="currentColor" />
          <text x="60" y="46.5" textAnchor="middle" fontSize="6" fill="currentColor">
            L
          </text>
          <text x="60" y="62" textAnchor="middle">
            LCP
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="6">
            0.8s
          </text>
          <circle cx="120" cy="44" r="6" fill="hsl(var(--background))" stroke="currentColor" />
          <text x="120" y="46.5" textAnchor="middle" fontSize="6" fill="currentColor">
            C
          </text>
          <text x="120" y="62" textAnchor="middle">
            CLS
          </text>
          <text x="120" y="72" textAnchor="middle" fontSize="6">
            0.00
          </text>
          <circle cx="180" cy="44" r="6" fill="hsl(var(--background))" stroke="currentColor" />
          <text x="180" y="46.5" textAnchor="middle" fontSize="6" fill="currentColor">
            I
          </text>
          <text x="180" y="62" textAnchor="middle">
            INP
          </text>
          <text x="180" y="72" textAnchor="middle" fontSize="6">
            &lt;50ms
          </text>
        </g>
        <text
          x="14"
          y="28"
          fontSize="9"
          fill="hsl(var(--accent))"
          fontWeight="600"
          className="font-mono"
        >
          100
        </text>
      </svg>
    </WidgetFrame>
  );
}
