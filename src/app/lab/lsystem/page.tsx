import type { Metadata } from "next";

import { LSystem } from "@/features/lab/components/lsystem";

export const metadata: Metadata = {
  title: "L-System",
  description: "Lindenmayer systems. Fractal trees from simple rewriting rules.",
  alternates: { canonical: "/lab/lsystem" },
};

export default function LSystemPage() {
  return (
    <>
      <LSystem />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          l-system
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          fractal rewriting
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Start with a string and a set of replacement rules. Apply the rules repeatedly.
              Interpret the result as turtle graphics: F draws forward, + and - turn, brackets save
              and restore position.
            </p>
            <p>
              A handful of characters and one rewriting rule produce trees, ferns, snowflakes, and
              dragons. Each iteration multiplies the complexity.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
