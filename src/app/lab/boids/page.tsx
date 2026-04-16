import type { Metadata } from "next";

import { Boids } from "@/features/lab/components/boids";

export const metadata: Metadata = {
  title: "Boids",
  description: "Flocking simulation. Separation, alignment, cohesion.",
  alternates: { canonical: "/lab/boids" },
};

export default function BoidsPage() {
  return (
    <>
      <Boids />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          boids
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          flocking behavior
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Three rules per boid: separate from nearby neighbors, align heading with the local
              flock, and cohere toward the group center. No leader, no global plan.
            </p>
            <p>
              Move your cursor to attract the flock. Hold shift to scatter them. Tune the three
              force weights to see how behavior changes.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
