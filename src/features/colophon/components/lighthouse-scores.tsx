import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { lighthouseCategories } from "@/features/colophon/data/lighthouse-explainers";

import { AccessibilityTree } from "./widgets/accessibility-tree";
import { BestPracticesCheck } from "./widgets/best-practices-check";
import { PerformanceGauge } from "./widgets/performance-gauge";
import { SeoFlow } from "./widgets/seo-flow";

type LighthouseData = {
  scores: Record<string, number>;
  auditedAt: string;
  url: string;
};

const WIDGET_MAP: Record<string, () => React.JSX.Element> = {
  performance: PerformanceGauge,
  accessibility: AccessibilityTree,
  bestPractices: BestPracticesCheck,
  seo: SeoFlow,
};

function loadScores(): LighthouseData | null {
  const path = resolve("src/features/colophon/data/lighthouse.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as LighthouseData;
  } catch {
    return null;
  }
}

export function LighthouseScores() {
  const data = loadScores();

  if (!data) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground">
        Run <code className="text-foreground">pnpm audit:lighthouse</code> to generate Lighthouse
        scores.
      </p>
    );
  }

  const auditDate = new Date(data.auditedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {lighthouseCategories.map((cat) => {
          const score = data.scores[cat.id] ?? 0;
          return (
            <div key={cat.id} className="flex flex-col gap-1 border-t border-border pt-3">
              <span className="font-mono text-[32px] font-semibold tabular-nums leading-none text-accent">
                {score}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {cat.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        last audited {auditDate}
      </p>

      <div className="flex flex-col gap-6">
        {lighthouseCategories.map((cat) => {
          const WidgetComponent = WIDGET_MAP[cat.id];
          return (
            <div
              key={cat.id}
              className="grid grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-[1fr_200px] md:gap-6"
            >
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[13px] font-medium text-foreground">{cat.label}</h3>
                <p className="text-[12.5px] leading-[1.65] text-foreground/90">{cat.description}</p>
              </div>
              {WidgetComponent ? <WidgetComponent /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
