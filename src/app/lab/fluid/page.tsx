import type { Metadata } from "next";

import { Fluid } from "@/features/lab/components/fluid";

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
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              A 2D velocity field evolves under the Navier-Stokes equations. Each frame: advect
              velocity through itself (semi-Lagrangian), compute divergence, solve for pressure via
              Jacobi iteration, then subtract the pressure gradient to enforce incompressibility.
              Dye rides the velocity field as a passive tracer.
            </p>
            <p>
              Moving your mouse injects velocity and dye as Gaussian splats. The pressure solver
              runs 25 Jacobi iterations per frame to keep the flow divergence-free. Every operation
              is a fullscreen fragment shader pass. No CPU physics. Six shader programs, eight
              framebuffers, one triangle.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
