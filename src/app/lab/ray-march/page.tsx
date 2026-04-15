import type { Metadata } from "next";

import { RayMarch } from "@/features/lab/components/ray-march";

export const metadata: Metadata = {
  title: "Ray March",
  description: "Signed distance field rendering in a fragment shader.",
  alternates: { canonical: "/lab/ray-march" },
};

export default function RayMarchPage() {
  return (
    <>
      <RayMarch />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          signed distance fields
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          move to orbit
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Every pixel fires a ray into a 3D scene. The scene is a math function: given any
              point, return the distance to the nearest surface. The ray steps forward by that
              distance until it hits something.
            </p>
            <p>
              The shapes are signed distance fields for sphere, box, torus, and octahedron, blended
              with a smooth minimum. Domain repetition tiles them infinitely. Each cell morphs at
              its own phase. Normals, AO, and soft shadows all derive from the same distance
              function. No geometry, no vertices. Just math per pixel.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
