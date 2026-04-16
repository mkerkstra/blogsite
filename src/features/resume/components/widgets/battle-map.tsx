import { WidgetFrame } from "@/components/widget-frame";

export function BattleMap() {
  return (
    <WidgetFrame label="battle map" caption="pixi v8 · custom scene · fog + initiative">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full font-mono"
        aria-hidden="true"
      >
        {/* toolbar dots — tightened to top edge */}
        <circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="26" cy="6" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="34" cy="6" r="2" fill="currentColor" opacity="0.6" />
        {/* frame — expanded vertically so cells are close to square */}
        <rect
          x="12"
          y="12"
          width="196"
          height="76"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        {/* grid — 7 cols × 3 rows, cells ≈ 28×25 */}
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.3">
          <line x1="40" y1="12" x2="40" y2="88" />
          <line x1="68" y1="12" x2="68" y2="88" />
          <line x1="96" y1="12" x2="96" y2="88" />
          <line x1="124" y1="12" x2="124" y2="88" />
          <line x1="152" y1="12" x2="152" y2="88" />
          <line x1="180" y1="12" x2="180" y2="88" />
          <line x1="12" y1="37" x2="208" y2="37" />
          <line x1="12" y1="63" x2="208" y2="63" />
        </g>
        {/* fog of war — right 2 cols, top 2 rows */}
        <rect x="152" y="12" width="56" height="51" fill="currentColor" opacity="0.1" />
        {/* tokens at cell centers */}
        <circle
          cx="54"
          cy="25"
          r="5"
          fill="hsl(var(--background))"
          stroke="currentColor"
          className="widget-token widget-token-1"
        />
        <circle
          cx="82"
          cy="50"
          r="5"
          fill="hsl(var(--background))"
          stroke="currentColor"
          className="widget-token widget-token-2"
        />
        <circle
          cx="110"
          cy="25"
          r="5"
          fill="hsl(var(--accent))"
          stroke="currentColor"
          className="widget-pulse widget-token widget-token-3"
        />
        <circle
          cx="138"
          cy="76"
          r="5"
          fill="hsl(var(--background))"
          stroke="currentColor"
          className="widget-token widget-token-4"
        />
        <circle
          cx="54"
          cy="76"
          r="5"
          fill="hsl(var(--background))"
          stroke="currentColor"
          className="widget-token widget-token-2"
        />
      </svg>
    </WidgetFrame>
  );
}
