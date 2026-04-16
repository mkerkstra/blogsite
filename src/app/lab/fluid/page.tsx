import type { Metadata } from "next";

import { Fluid } from "@/features/lab/components/fluid";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Fluid",
  description: "Real-time Navier-Stokes fluid simulation on the GPU.",
  alternates: { canonical: "/lab/fluid" },
};

export default function FluidPage() {
  return (
    <>
      <Fluid />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          navier-stokes fluid
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          drag to inject
        </p>
      </div>
      <LabInfoPanel>
        <p>
          A 2D velocity field evolves under the <Term id="navier-stokes">Navier-Stokes</Term>{" "}
          equations, based on Jos Stam&apos;s &quot;Stable Fluids&quot; (1999), the paper that made
          real-time fluid simulation practical. The key insight is{" "}
          <Term id="semi-lagrangian">semi-Lagrangian advection</Term>: instead of pushing fluid
          forward (which explodes), you trace each cell backward through the velocity field and
          sample where it came from. This is unconditionally stable regardless of timestep or
          velocity magnitude.
        </p>
        <p>
          Each frame runs four stages: advect velocity through itself, compute the divergence of the
          result, solve for pressure via <Term id="jacobi-iteration">Jacobi iteration</Term>, then
          subtract the pressure gradient to project the field back to divergence-free. This last
          step is the <Term id="helmholtz-hodge">Helmholtz-Hodge decomposition</Term>: any vector
          field splits uniquely into a divergence-free part and a curl-free (gradient) part.
          Subtracting the gradient part enforces incompressibility.
        </p>
        <p>
          The pressure solver runs 25 Jacobi iterations per frame, a tradeoff between accuracy and
          speed. More iterations produce cleaner incompressibility but cost proportionally more
          fragment shader passes. <Term id="vorticity-confinement">Vorticity confinement</Term> is
          applied after the pressure projection to re-inject rotational energy lost to numerical
          dissipation, keeping small-scale swirls alive instead of letting them smear into laminar
          flow.
        </p>
        <p>
          Moving your mouse injects velocity and dye as{" "}
          <Term id="gaussian-splat">Gaussian splats</Term>. Dye rides the velocity field as a
          passive tracer, revealing the flow structure. Every operation is a fullscreen{" "}
          <Term id="fragment-shader">fragment shader</Term> pass. No CPU physics. Six shader
          programs, eight framebuffers, one triangle. Watch for vortex shedding behind fast-moving
          injections and the way dye filaments stretch and fold into fractal-like structures.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_equations"
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
