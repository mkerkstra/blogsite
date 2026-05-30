import { Cloth } from "@/features/lab/components/cloth";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "cloth",
  "Cloth",
  "Verlet integration cloth. Drag to interact, pull to tear.",
);

export default function ClothPage() {
  return (
    <>
      <LabHead slug="cloth" />
      <Cloth
        info={
          <>
            <p>
              <Term id="verlet-integration">Verlet integration</Term>: each particle stores its
              current and previous position. Velocity is implicit in the difference between the two,
              giving second-order accuracy without ever computing velocity explicitly. That makes it
              trivial to satisfy positional constraints after each step, which is exactly what cloth
              needs.
            </p>
            <p>
              Constraints enforce fixed distances between neighbors via{" "}
              <Term id="gauss-seidel">Gauss-Seidel relaxation</Term>. Each pass propagates
              corrections further across the mesh, so five passes per frame let information travel
              roughly five links outward. More passes mean stiffer fabric; fewer passes produce
              stretchy, rubbery behavior.
            </p>
            <p>
              Tearing works by removing any constraint that stretches past 2.5x its rest length.
              Once a link breaks it never reforms, so rips propagate naturally along stress lines.
              The result is realistic failure behavior from a trivially simple rule.
            </p>
            <p>
              Drag to push particles around. Pull hard and fast to concentrate stress and watch the
              cloth rip along the path of maximum strain.
            </p>
            <p className="border-t border-border pt-2">
              <a
                href="https://en.wikipedia.org/wiki/Verlet_integration"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                Wikipedia
              </a>
            </p>
          </>
        }
      />
    </>
  );
}
