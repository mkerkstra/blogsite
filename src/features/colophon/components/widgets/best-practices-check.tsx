import { WidgetFrame } from "@/components/widget-frame";

export function BestPracticesCheck() {
  return (
    <WidgetFrame label="best practices" caption="security · standards · correctness">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        <g transform="translate(24, 12)">
          <rect width="12" height="12" fill="hsl(var(--accent))" rx="1" />
          <path
            d="M3,6 L5,8.5 L9,3.5"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth="1.5"
            fill="none"
          />
          <text x="18" y="10" fontSize="8" fill="currentColor">
            HTTPS everywhere
          </text>
        </g>
        <g transform="translate(24, 32)">
          <rect width="12" height="12" fill="hsl(var(--accent))" rx="1" />
          <path
            d="M3,6 L5,8.5 L9,3.5"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth="1.5"
            fill="none"
          />
          <text x="18" y="10" fontSize="8" fill="currentColor">
            Zero console errors
          </text>
        </g>
        <g transform="translate(24, 52)">
          <rect width="12" height="12" fill="hsl(var(--accent))" rx="1" />
          <path
            d="M3,6 L5,8.5 L9,3.5"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth="1.5"
            fill="none"
          />
          <text x="18" y="10" fontSize="8" fill="currentColor">
            No deprecated APIs
          </text>
        </g>
        <g transform="translate(24, 72)">
          <rect width="12" height="12" fill="hsl(var(--accent))" rx="1" />
          <path
            d="M3,6 L5,8.5 L9,3.5"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth="1.5"
            fill="none"
          />
          <text x="18" y="10" fontSize="8" fill="currentColor">
            Images sized correctly
          </text>
        </g>
      </svg>
    </WidgetFrame>
  );
}
