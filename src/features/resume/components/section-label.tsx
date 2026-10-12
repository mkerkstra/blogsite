import * as React from "react";

export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[12px] font-medium tabular-nums text-accent">{index}</span>
      <h2 className="font-medium text-[13px] text-foreground">{children}</h2>
      <span className="rule" aria-hidden />
    </div>
  );
}
