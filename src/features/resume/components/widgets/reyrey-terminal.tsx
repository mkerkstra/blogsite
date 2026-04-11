import { WidgetFrame } from "./widget-frame";

export function ReyreyTerminal() {
  return (
    <WidgetFrame label="FORM-VCS v2.3" caption="distributed delivery · usage · billing">
      <svg
        viewBox="0 0 220 96"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[88px] w-full"
        aria-hidden="true"
      >
        {/* frame */}
        <rect
          x="10"
          y="10"
          width="200"
          height="78"
          fill="hsl(var(--background))"
          stroke="currentColor"
        />
        {/* title bar */}
        <rect x="10" y="10" width="200" height="14" fill="currentColor" />
        <text
          x="16"
          y="20"
          fontFamily="monospace"
          fontSize="7"
          fill="hsl(var(--background))"
          fontWeight="500"
        >
          ▌ FORM-VCS · VB6→PICK · 0042 FORMS
        </text>
        {/* content */}
        <g fontFamily="monospace" fontSize="7" fill="currentColor">
          <text x="16" y="36">
            {"> LIST ACTIVE"}
          </text>
          <text x="22" y="46" fill="hsl(var(--muted-foreground))">
            FRM-0412 r.14 DLR-9981 OK
          </text>
          <text x="22" y="56" fill="hsl(var(--muted-foreground))">
            FRM-0413 r.09 DLR-8832 OK
          </text>
          <text x="22" y="66" fill="hsl(var(--muted-foreground))">
            FRM-0414 r.22 DLR-7710 OK
          </text>
          <text x="16" y="80">
            {"> "}
          </text>
        </g>
        <rect x="24" y="74" width="5" height="7" fill="currentColor" className="widget-blink" />
      </svg>
    </WidgetFrame>
  );
}
