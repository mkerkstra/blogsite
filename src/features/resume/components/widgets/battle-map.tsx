import { WidgetFrame } from "./widget-frame";

export function BattleMap() {
  return (
    <WidgetFrame label="battle map" caption="tokens · fog of war · initiative">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full"
        aria-hidden="true"
      >
        {/* toolbar dots */}
        <circle cx="18" cy="14" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="26" cy="14" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="34" cy="14" r="2" fill="currentColor" opacity="0.6" />
        {/* frame */}
        <rect
          x="12"
          y="22"
          width="196"
          height="62"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        {/* grid */}
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.3">
          <line x1="40" y1="22" x2="40" y2="84" />
          <line x1="68" y1="22" x2="68" y2="84" />
          <line x1="96" y1="22" x2="96" y2="84" />
          <line x1="124" y1="22" x2="124" y2="84" />
          <line x1="152" y1="22" x2="152" y2="84" />
          <line x1="180" y1="22" x2="180" y2="84" />
          <line x1="12" y1="43" x2="208" y2="43" />
          <line x1="12" y1="64" x2="208" y2="64" />
        </g>
        {/* fog of war */}
        <rect x="152" y="22" width="56" height="42" fill="currentColor" opacity="0.1" />
        {/* tokens */}
        <circle cx="54" cy="33" r="5" fill="hsl(var(--background))" stroke="currentColor" />
        <circle cx="82" cy="53" r="5" fill="hsl(var(--background))" stroke="currentColor" />
        <circle
          cx="110"
          cy="33"
          r="5"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          className="widget-pulse"
        />
        <circle cx="138" cy="74" r="5" fill="hsl(var(--background))" stroke="currentColor" />
        <circle cx="54" cy="74" r="5" fill="hsl(var(--background))" stroke="currentColor" />
      </svg>
    </WidgetFrame>
  );
}
