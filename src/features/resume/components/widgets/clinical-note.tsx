import { WidgetFrame } from "./widget-frame";

export function ClinicalNote() {
  return (
    <WidgetFrame label="live templating" caption="voice + context → structured note">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full"
        aria-hidden="true"
      >
        <rect
          x="34"
          y="8"
          width="152"
          height="82"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        <rect x="44" y="16" width="60" height="5" fill="currentColor" opacity="0.7" />
        <line x1="44" y1="32" x2="176" y2="32" stroke="currentColor" opacity="0.5" />
        <line x1="44" y1="40" x2="168" y2="40" stroke="currentColor" opacity="0.5" />
        <line x1="44" y1="48" x2="158" y2="48" stroke="currentColor" opacity="0.5" />
        <rect x="44" y="55" width="88" height="5" fill="hsl(var(--accent))" opacity="0.6" />
        <line x1="44" y1="57.5" x2="132" y2="57.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="132" y="54" width="1.5" height="8" fill="currentColor" className="widget-blink" />
        <line x1="44" y1="66" x2="176" y2="66" stroke="currentColor" opacity="0.15" />
        <line x1="44" y1="74" x2="176" y2="74" stroke="currentColor" opacity="0.15" />
        <line x1="44" y1="82" x2="140" y2="82" stroke="currentColor" opacity="0.15" />
      </svg>
    </WidgetFrame>
  );
}
