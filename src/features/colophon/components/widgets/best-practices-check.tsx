import { WidgetFrame } from "@/components/widget-frame";

const items = [
  { y: 12, label: "HTTPS everywhere" },
  { y: 32, label: "Zero console errors" },
  { y: 52, label: "No deprecated APIs" },
  { y: 72, label: "Images sized correctly" },
] as const;

export function BestPracticesCheck() {
  return (
    <WidgetFrame label="best practices" caption="security · standards · correctness">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        {items.map((it, i) => (
          <g key={it.label} transform={`translate(24, ${it.y})`}>
            <rect width="12" height="12" fill="hsl(var(--accent))" rx="1" />
            <path
              d="M3,6 L5,8.5 L9,3.5"
              stroke="hsl(var(--accent-foreground))"
              strokeWidth="1.5"
              fill="none"
              className={`widget-check widget-check-${i + 1}`}
            />
            <text x="18" y="10" fontSize="8" fill="currentColor">
              {it.label}
            </text>
          </g>
        ))}
      </svg>
    </WidgetFrame>
  );
}
