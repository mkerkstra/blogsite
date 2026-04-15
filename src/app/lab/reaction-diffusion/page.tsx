import type { Metadata } from "next";

import { ReactionDiffusion } from "@/features/lab/components/reaction-diffusion";

export const metadata: Metadata = {
  title: "Reaction Diffusion",
  description: "Gray-Scott reaction diffusion simulation running on the GPU.",
  alternates: { canonical: "/lab/reaction-diffusion" },
};

export default function ReactionDiffusionPage() {
  return (
    <>
      <ReactionDiffusion />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          gray-scott reaction diffusion
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click to seed
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Two virtual chemicals (U and V) diffuse across a 2D grid and react with each other. U
              feeds V, V inhibits U. The balance between feed rate, kill rate, and diffusion speed
              determines the pattern: spots, stripes, or labyrinthine mazes.
            </p>
            <p>
              Each frame, a fragment shader runs the Gray-Scott equations on every texel
              simultaneously. Two framebuffers ping-pong the state. The render pass maps
              concentration to color. Your mouse locally shifts the feed/kill parameters, warping
              the dynamics. No CPU simulation. Pure GPU.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
