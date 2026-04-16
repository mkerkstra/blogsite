import type { Metadata } from "next";

import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
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
      <LabInfoPanel>
        <p>
          Six species of particles interact through a 6x6 force matrix. Each entry controls whether
          species A is attracted to or repelled by species B. The force function has a
          characteristic shape: strong repulsion at close range prevents overlap, then attraction or
          repulsion at medium range, which is the tunable part that creates all the interesting
          dynamics.
        </p>
        <p>
          Each randomization reshuffles all 36 entries, producing wildly different behavior from the
          same code. Some configurations yield stable clusters that resemble biological cells.
          Others create predator-prey cycles where one species chases another across the torus while
          a third trails behind scavenging the debris.
        </p>
        <p>
          The toroidal plane means particles that exit one edge reappear on the opposite side, so
          there are no boundary effects. No intelligence, no goals. Just particles following simple
          pairwise force rules with no awareness of anything beyond their local neighborhood.
        </p>
        <p>
          Randomize to discover new chemistries. When you find a configuration that produces
          interesting structure, watch how it evolves. Some are stable equilibria; others are
          transient patterns that eventually collapse or reorganize.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://www.ventrella.com/Clusters/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Ventrella, Clusters
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/Artificial_life"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Wikipedia
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
