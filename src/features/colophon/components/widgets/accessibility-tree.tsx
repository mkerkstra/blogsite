import { WidgetFrame } from "@/components/widget-frame";

export function AccessibilityTree() {
  return (
    <WidgetFrame label="accessibility tree" caption="semantic html → screen reader nav">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        <rect
          x="85"
          y="4"
          width="50"
          height="14"
          fill="hsl(var(--background))"
          stroke="currentColor"
          rx="1"
        />
        <text x="110" y="14" textAnchor="middle" fontSize="7" fill="currentColor">
          &lt;html&gt;
        </text>
        <line
          x1="100"
          y1="18"
          x2="60"
          y2="34"
          stroke="currentColor"
          opacity="0.4"
          className="widget-tree-line widget-tree-line-depth-1"
        />
        <line
          x1="120"
          y1="18"
          x2="160"
          y2="34"
          stroke="currentColor"
          opacity="0.4"
          className="widget-tree-line widget-tree-line-depth-1"
        />
        <g className="widget-tree-node widget-tree-node-depth-1">
          <rect
            x="135"
            y="34"
            width="50"
            height="14"
            fill="hsl(var(--background))"
            stroke="currentColor"
            rx="1"
          />
          <text x="160" y="44" textAnchor="middle" fontSize="7" fill="currentColor">
            &lt;nav&gt;
          </text>
        </g>
        <g className="widget-tree-node widget-tree-node-depth-1">
          <rect
            x="35"
            y="34"
            width="50"
            height="14"
            fill="hsl(var(--accent))"
            stroke="currentColor"
            rx="1"
          />
          <text x="60" y="44" textAnchor="middle" fontSize="7" fill="hsl(var(--accent-foreground))">
            &lt;main&gt;
          </text>
        </g>
        <line
          x1="45"
          y1="48"
          x2="28"
          y2="64"
          stroke="currentColor"
          opacity="0.4"
          className="widget-tree-line widget-tree-line-depth-2"
        />
        <line
          x1="60"
          y1="48"
          x2="75"
          y2="64"
          stroke="currentColor"
          opacity="0.4"
          className="widget-tree-line widget-tree-line-depth-2"
        />
        <line
          x1="70"
          y1="48"
          x2="130"
          y2="64"
          stroke="currentColor"
          opacity="0.4"
          className="widget-tree-line widget-tree-line-depth-2"
        />
        <g className="widget-tree-node widget-tree-node-depth-2">
          <rect
            x="8"
            y="64"
            width="40"
            height="14"
            fill="hsl(var(--background))"
            stroke="currentColor"
            rx="1"
          />
          <text x="28" y="74" textAnchor="middle" fontSize="7" fill="currentColor">
            &lt;h1&gt;
          </text>
        </g>
        <g className="widget-tree-node widget-tree-node-depth-2">
          <rect
            x="55"
            y="64"
            width="50"
            height="14"
            fill="hsl(var(--background))"
            stroke="currentColor"
            rx="1"
          />
          <text x="80" y="74" textAnchor="middle" fontSize="6" fill="currentColor">
            &lt;section&gt;
          </text>
        </g>
        <g className="widget-tree-node widget-tree-node-depth-2">
          <rect
            x="112"
            y="64"
            width="50"
            height="14"
            fill="hsl(var(--background))"
            stroke="currentColor"
            rx="1"
          />
          <text x="137" y="74" textAnchor="middle" fontSize="6" fill="currentColor">
            &lt;section&gt;
          </text>
        </g>
      </svg>
    </WidgetFrame>
  );
}
