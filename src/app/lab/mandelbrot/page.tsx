import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";
import { Mandelbrot } from "@/features/lab/components/mandelbrot";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "mandelbrot",
  "Mandelbrot",
  "GPU-rendered Mandelbrot set. Click to zoom, drag to pan.",
);

export default function MandelbrotPage() {
  return (
    <>
      <Mandelbrot />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          mandelbrot
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          click to zoom, drag to pan
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          For each pixel, map its screen coordinates to a complex number c and iterate z = z*z + c
          starting from z = 0. If the magnitude of z exceeds 2, the point has escaped and lies
          outside the Mandelbrot set. Points that never escape are inside the set and render black.
          The set&apos;s boundary has infinite perimeter but encloses finite area, a fractal with{" "}
          <Term id="hausdorff-dimension">Hausdorff dimension</Term> 2.
        </p>
        <p>
          The escape iteration count determines the color. Naive integer banding produces harsh
          contour lines, so this implementation uses smooth coloring: n - log2(log2(|z|)) at the
          escape point, which interpolates continuously between iteration bands. The result is a
          gradient that flows smoothly across the exterior, revealing the underlying potential
          function of the iteration.
        </p>
        <p>
          Rendered in a single <Term id="fragment-shader">fragment shader</Term> on the GPU. Every
          pixel evaluates the iteration loop independently, making the Mandelbrot set embarrassingly
          parallel and ideal for GPU computation. Zooming multiplies the maximum iteration count
          because finer structure near the boundary needs more iterations to resolve. Deep zooms
          eventually hit the precision limit of 32-bit floats, around 10^7x magnification, where the
          image pixelates.
        </p>
        <p>
          Click to zoom into any region. Drag to pan. Look for miniature copies of the full set
          embedded along filaments. Every bulb and antenna contains self-similar structure at
          arbitrary depth. The largest cardioid corresponds to period-1 orbits, the main bulb to
          period-2, and each smaller satellite to higher periods.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Mandelbrot_set"
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
