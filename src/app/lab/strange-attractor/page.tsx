import type { Metadata } from "next";

import { StrangeAttractor } from "@/features/lab/components/strange-attractor";

export const metadata: Metadata = {
  title: "Strange Attractor",
  description: "Thomas attractor visualized as 150k particle trails.",
  alternates: { canonical: "/lab/strange-attractor" },
};

export default function StrangeAttractorPage() {
  return (
    <>
      <StrangeAttractor />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          thomas attractor
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          move to orbit
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              150,000 particles trace paths through Thomas' cyclically symmetric attractor, a
              chaotic system defined by three coupled differential equations involving sine
              functions. Each particle integrates the ODE via fourth-order Runge-Kutta, producing
              smooth trajectories that never repeat.
            </p>
            <p>
              Particles are born near the attractor's center and die after a few seconds, fading in
              and out to create ghostly trails. A slow background fade preserves recent history. The
              3D structure is projected through a rotating camera you control with your mouse.
              Additive blending reveals density where orbits converge.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
