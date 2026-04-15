import type { Metadata } from "next";

import { Physarum } from "@/features/lab/components/physarum";

export const metadata: Metadata = {
  title: "Physarum",
  description: "Slime mold simulation with 262k agents on the GPU.",
  alternates: { canonical: "/lab/physarum" },
};

export default function PhysarumPage() {
  return (
    <>
      <Physarum />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          physarum slime mold
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
              262,144 agents wander a 2D surface, each sensing pheromone concentration at three
              points ahead. They turn toward the strongest signal and deposit their own trail as
              they move. A diffusion pass blurs and decays the trail each frame.
            </p>
            <p>
              The result is emergent: no agent knows about any other, yet they self-organize into
              branching vascular networks. Agent state lives in a float texture, updated per-frame
              by a fragment shader. Deposits scatter via GL_POINTS into the trail framebuffer. Your
              cursor warps the agents' turn bias, pulling the network toward you.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
