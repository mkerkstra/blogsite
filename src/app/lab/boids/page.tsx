import { Boids } from "@/features/lab/components/boids";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "boids",
  "Boids",
  "Flocking simulation. Separation, alignment, cohesion.",
);

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
      <LabActions />
      <LabInfoPanel>
        <p>
          Craig Reynolds proposed boids in 1987 for procedural animation of bird flocks and fish
          schools. Three rules per agent: separate from nearby neighbors, align heading with the
          local flock, and cohere toward the group&apos;s center of mass. No leader, no global plan.
        </p>
        <p>
          Each rule operates within a limited <Term id="perception-radius">perception radius</Term>,
          so a boid only sees its nearest neighbors. The{" "}
          <Term id="emergent-behavior">emergent</Term>&nbsp;flocking, lane formation, and obstacle
          splitting all arise from purely local decisions. No agent has any knowledge of the
          flock&apos;s overall shape.
        </p>
        <p>
          The three force weights act as personality knobs. High separation produces nervous,
          jittery swarms that avoid contact. High cohesion creates tight schools that move as a
          dense mass. High alignment yields parallel columns that stream in formation. The balance
          between them determines the character of the flock.
        </p>
        <p>
          Move your cursor to attract the flock. Hold shift to scatter them. Tune the weights to see
          how the collective behavior shifts.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://www.red3d.com/cwr/boids/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Craig Reynolds (1987)
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
