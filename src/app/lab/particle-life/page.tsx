import type { Metadata } from "next";

import { ParticleLife } from "@/features/lab/components/particle-life";

export const metadata: Metadata = {
  title: "Particle Life",
  description: "Emergent chemistry from simple attraction rules between colored particles.",
  alternates: { canonical: "/lab/particle-life" },
};

export default function ParticleLifePage() {
  return (
    <>
      <ParticleLife />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          particle life
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          emergent chemistry
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Six species of particles, each with random attraction or repulsion toward every other
              species. A 6x6 matrix of forces creates emergent behavior: cells, chains,
              predator-prey dynamics, oscillators.
            </p>
            <p>
              No intelligence, no goals. Just particles following simple force rules on a toroidal
              plane. Randomize to discover new chemistries.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
