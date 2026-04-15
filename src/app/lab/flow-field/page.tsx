import type { Metadata } from "next";

import { FlowField } from "@/features/lab/components/flow-field";

export const metadata: Metadata = {
  title: "Flow Field",
  description: "GPU particle system driven by curl noise.",
  alternates: { canonical: "/lab/flow-field" },
};

export default function FlowFieldPage() {
  return (
    <>
      <FlowField />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          curl noise flow field
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          move to attract
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              100,000 particles are advected through a curl noise velocity field. Curl noise is
              divergence-free, so particles flow in swirling streams without clumping or dispersing.
              The noise evolves over time, creating organic turbulence.
            </p>
            <p>
              Positions update each frame and upload to a GPU buffer for point rendering. A
              semi-transparent background quad fades previous frames instead of clearing, creating
              persistent trails. Your mouse adds an attraction force that warps the flow. Additive
              blending makes the streams glow where particles converge.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
