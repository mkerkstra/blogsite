import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";
import { StrangeAttractor } from "@/features/lab/components/strange-attractor";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "strange-attractor",
  "Strange Attractor",
  "Thomas attractor visualized as 150k particle trails.",
);

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
      <LabActions />
      <LabInfoPanel>
        <p>
          150,000 particles trace paths through Thomas&apos; cyclically symmetric attractor, a
          chaotic system defined by three coupled differential equations involving sine functions.
          The system has cyclic symmetry: each variable&apos;s equation has the same form, rotated
          through the triple (x, y, z). This symmetry gives the attractor its characteristic
          three-lobed structure. Each particle integrates the ODE via fourth-order{" "}
          <Term id="runge-kutta">Runge-Kutta</Term>, producing smooth trajectories that never
          repeat.
        </p>
        <p>
          The damping parameter b controls how &quot;tight&quot; the orbits are. At higher b values,
          the system settles into a simple <Term id="limit-cycle">limit cycle</Term>. As b decreases
          toward zero, the attractor transitions through increasingly complex chaotic behavior:
          orbits wander further before folding back, loops multiply, and the structure fills more of{" "}
          <Term id="phase-space">phase space</Term>. The value used here sits in the chaotic regime
          where trajectories are bounded but aperiodic.
        </p>
        <p>
          Fourth-order Runge-Kutta is essential because cheaper integrators (Euler, midpoint)
          accumulate error fast enough to push particles off the attractor entirely. RK4 evaluates
          the derivative four times per step and combines them with specific weights, keeping
          trajectories faithful to the true dynamics over thousands of frames.
        </p>
        <p>
          Particles are born near the attractor&apos;s center and die after a few seconds, fading in
          and out to create ghostly trails. A slow background fade preserves recent history. The 3D
          structure is projected through a rotating camera you control with your mouse.{" "}
          <Term id="additive-blending">Additive blending</Term>&nbsp;reveals density where orbits
          converge, making the attractor&apos;s{" "}
          <Term id="invariant-measure">invariant measure</Term> visible as brightness.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Attractor#Strange_attractor"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Wikipedia
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
