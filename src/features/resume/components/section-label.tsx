import * as React from "react";

export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        [{index}]
      </span>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">
        {children}
      </h2>
      <span className="rule" aria-hidden />
    </div>
  );
}
