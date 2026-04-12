import { WidgetFrame } from "@/components/widget-frame";

export function CompoundingArc() {
  return (
    <WidgetFrame label="compounding arc" caption="1 seed · n derivatives">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        <line x1="14" y1="80" x2="210" y2="80" stroke="currentColor" opacity="0.4" />
        <g fontSize="7" fill="hsl(var(--muted-foreground))">
          <text x="18" y="90">
            {"'23"}
          </text>
          <text x="70" y="90">
            {"'24"}
          </text>
          <text x="125" y="90">
            {"'25"}
          </text>
          <text x="180" y="90">
            {"'26"}
          </text>
        </g>
        <circle cx="24" cy="80" r="5" fill="hsl(var(--accent))" stroke="currentColor" />
        <path
          d="M24,80 C50,80 60,58 82,58"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
        <path
          d="M24,80 C60,80 100,36 132,36"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
        <path
          d="M24,80 C80,80 150,18 192,18"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
        <path
          d="M24,80 C90,80 160,62 200,62"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
        <circle cx="82" cy="58" r="3" fill="hsl(var(--background))" stroke="currentColor" />
        <circle cx="132" cy="36" r="3" fill="hsl(var(--background))" stroke="currentColor" />
        <circle cx="192" cy="18" r="3" fill="hsl(var(--background))" stroke="currentColor" />
        <circle cx="200" cy="62" r="3" fill="hsl(var(--background))" stroke="currentColor" />
      </svg>
    </WidgetFrame>
  );
}
