import { WidgetFrame } from "@/components/widget-frame";

export function SeoFlow() {
  return (
    <WidgetFrame label="seo" caption="sitemap → pages → metadata">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        <rect
          x="8"
          y="32"
          width="52"
          height="24"
          fill="hsl(var(--background))"
          stroke="currentColor"
          rx="1"
        />
        <text x="34" y="47" textAnchor="middle" fontSize="7" fill="currentColor">
          sitemap.xml
        </text>
        <g className="widget-flow-step widget-flow-step-1">
          <line x1="60" y1="44" x2="78" y2="44" stroke="currentColor" />
          <polygon points="78,41 84,44 78,47" fill="currentColor" />
        </g>
        <rect
          x="84"
          y="32"
          width="44"
          height="24"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          rx="1"
        />
        <text x="106" y="47" textAnchor="middle" fontSize="7" fill="hsl(var(--accent-foreground))">
          pages
        </text>
        <g className="widget-flow-step widget-flow-step-2">
          <line x1="128" y1="44" x2="146" y2="44" stroke="currentColor" />
          <polygon points="146,41 152,44 146,47" fill="currentColor" />
        </g>
        <rect
          x="152"
          y="32"
          width="56"
          height="24"
          fill="hsl(var(--background))"
          stroke="currentColor"
          rx="1"
        />
        <text x="180" y="47" textAnchor="middle" fontSize="7" fill="currentColor">
          metadata
        </text>
        <g fontSize="6" fill="hsl(var(--muted-foreground))">
          <text x="34" y="68" textAnchor="middle">
            crawlable
          </text>
          <text x="106" y="68" textAnchor="middle">
            indexable
          </text>
          <text x="180" y="68" textAnchor="middle">
            descriptive
          </text>
        </g>
      </svg>
    </WidgetFrame>
  );
}
