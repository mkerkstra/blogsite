import type { Metadata } from "next";

import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
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
      <LabInfoPanel>
        <p>
          Every pixel fires a ray into a 3D scene defined entirely by a{" "}
          <Term id="sdf">signed distance function (SDF)</Term>. Given any point in space, the SDF
          returns the distance to the nearest surface. The ray marcher uses{" "}
          <Term id="sphere-tracing">sphere tracing</Term>: it steps forward by exactly that distance
          each iteration. Because the SDF is a lower bound on the true distance, the ray is
          guaranteed never to overshoot a surface. Convergence is fast in open space and slows
          gracefully near geometry.
        </p>
        <p>
          The shapes are SDFs for sphere, box, torus, and octahedron, blended together with a smooth
          minimum (polynomial or exponential) that produces organic-looking joins instead of hard
          intersections. The infinite grid comes from applying fmod to the ray position before
          evaluating the SDF, effectively tiling a single cell across all of space. Each cell morphs
          at its own phase offset, so the grid breathes.
        </p>
        <p>
          Ambient occlusion is computed by sampling the distance field at a few points along the
          surface normal. If those samples return distances much smaller than their offset from the
          surface, the point is recessed and gets darkened. Soft shadows work by a similar
          principle: as a shadow ray marches toward the light, it tracks the closest pass to any
          geometry. The closer the near-miss, the darker the penumbra. Both effects cost only a few
          extra SDF evaluations per pixel.
        </p>
        <p>
          Normals are the gradient of the distance field, estimated with central differences. No
          geometry buffers, no vertices, no triangles. The entire scene is a single fullscreen{" "}
          <Term id="fragment-shader">fragment shader</Term> evaluating math per pixel. Move your
          mouse to orbit the camera and watch how the soft shadows shift across the infinite
          lattice.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://iquilezles.org/articles/distfunctions/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Inigo Quilez, SDF
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/Ray_marching"
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
