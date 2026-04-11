import { WidgetFrame } from "./widget-frame";

export function AiTooling() {
  return (
    <WidgetFrame label="dev surface" caption="type-safe · AI-first · year early">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full"
        aria-hidden="true"
      >
        <g fontFamily="monospace" fontSize="7" fill="hsl(var(--muted-foreground))">
          <text x="18" y="22">
            01
          </text>
          <text x="18" y="36">
            02
          </text>
          <text x="18" y="50">
            03
          </text>
          <text x="18" y="64">
            04
          </text>
          <text x="18" y="78">
            05
          </text>
        </g>
        <g stroke="currentColor" strokeWidth="2" opacity="0.65">
          <line x1="36" y1="20" x2="120" y2="20" />
          <line x1="46" y1="34" x2="160" y2="34" />
          <line x1="46" y1="48" x2="130" y2="48" />
          <line x1="56" y1="62" x2="110" y2="62" />
          <line x1="46" y1="76" x2="144" y2="76" />
        </g>
        <rect
          x="134"
          y="44"
          width="60"
          height="8"
          fill="hsl(var(--accent))"
          stroke="currentColor"
        />
        <rect x="132" y="42" width="1.5" height="12" fill="currentColor" className="widget-blink" />
        <text
          x="200"
          y="50"
          textAnchor="end"
          fontFamily="monospace"
          fontSize="6"
          fill="currentColor"
          opacity="0.6"
        >
          ↩ accept
        </text>
      </svg>
    </WidgetFrame>
  );
}
