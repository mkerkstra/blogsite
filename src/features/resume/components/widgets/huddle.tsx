import { WidgetFrame } from "./widget-frame";

export function Huddle() {
  return (
    <WidgetFrame label="huddle view" caption="one query · imaging × pms">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full"
        aria-hidden="true"
      >
        {/* Row 1 — 08:30 */}
        <text x="14" y="25" fontFamily="monospace" fontSize="7" fill="hsl(var(--muted-foreground))">
          08:30
        </text>
        <rect x="44" y="18" width="90" height="10" fill="currentColor" opacity="0.55" />
        <rect
          x="142"
          y="17"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="144" y="19" width="10" height="8" fill="currentColor" opacity="0.3" />
        <rect
          x="160"
          y="17"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="162" y="19" width="10" height="8" fill="currentColor" opacity="0.3" />
        <circle cx="192" cy="23" r="3" fill="currentColor" opacity="0.5" />

        {/* Row 2 — 09:00 */}
        <text x="14" y="43" fontFamily="monospace" fontSize="7" fill="hsl(var(--muted-foreground))">
          09:00
        </text>
        <rect x="44" y="36" width="76" height="10" fill="currentColor" opacity="0.55" />
        <rect
          x="142"
          y="35"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="144" y="37" width="10" height="8" fill="currentColor" opacity="0.3" />
        <circle cx="192" cy="41" r="3" fill="currentColor" opacity="0.5" />

        {/* Row 3 — 09:30 ACTIVE */}
        <text
          x="14"
          y="61"
          fontFamily="monospace"
          fontSize="7"
          fill="currentColor"
          fontWeight="500"
        >
          09:30
        </text>
        <rect x="44" y="54" width="96" height="10" fill="currentColor" opacity="0.9" />
        <rect
          x="142"
          y="53"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="144" y="55" width="10" height="8" fill="currentColor" opacity="0.3" />
        <rect
          x="160"
          y="53"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="162" y="55" width="10" height="8" fill="currentColor" opacity="0.3" />
        <rect
          x="178"
          y="53"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="180" y="55" width="10" height="8" fill="currentColor" opacity="0.3" />
        <circle cx="202" cy="59" r="3.5" fill="hsl(var(--accent))" stroke="currentColor" />

        {/* Row 4 — 10:00 */}
        <text x="14" y="79" fontFamily="monospace" fontSize="7" fill="hsl(var(--muted-foreground))">
          10:00
        </text>
        <rect x="44" y="72" width="82" height="10" fill="currentColor" opacity="0.55" />
        <rect
          x="142"
          y="71"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="144" y="73" width="10" height="8" fill="currentColor" opacity="0.3" />
        <rect
          x="160"
          y="71"
          width="14"
          height="12"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="162" y="73" width="10" height="8" fill="currentColor" opacity="0.3" />
        <circle cx="192" cy="77" r="3" fill="currentColor" opacity="0.5" />
      </svg>
    </WidgetFrame>
  );
}
