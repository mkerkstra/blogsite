import type { Metadata } from "next";

import { Cloth } from "@/features/lab/components/cloth";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Cloth",
  description: "Verlet integration cloth. Drag to interact, pull to tear.",
  alternates: { canonical: "/lab/cloth" },
};

export default function ClothPage() {
  return (
    <>
      <Cloth />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          cloth
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          drag to interact, pull to tear
        </p>
      </div>
      <LabInfoPanel>
        <p>
          <Term id="verlet-integration">Verlet integration</Term>: each particle stores its current
          and previous position. Velocity is implicit in the difference between the two, giving
          second-order accuracy without ever computing velocity explicitly. That makes it trivial to
          satisfy positional constraints after each step, which is exactly what cloth needs.
        </p>
        <p>
          Constraints enforce fixed distances between neighbors via{" "}
          <Term id="gauss-seidel">Gauss-Seidel relaxation</Term>. Each pass propagates corrections
          further across the mesh, so five passes per frame let information travel roughly five
          links outward. More passes mean stiffer fabric; fewer passes produce stretchy, rubbery
          behavior.
        </p>
        <p>
          Tearing works by removing any constraint that stretches past 2.5x its rest length. Once a
          link breaks it never reforms, so rips propagate naturally along stress lines. The result
          is realistic failure behavior from a trivially simple rule.
        </p>
        <p>
          Drag to push particles around. Pull hard and fast to concentrate stress and watch the
          cloth rip along the path of maximum strain.
        </p>
        <p className="border-t border-foreground/10 pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Verlet_integration"
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
