import type { Metadata } from "next";

import { Voronoi } from "@/features/lab/components/voronoi";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "Voronoi",
  description: "Nearest-neighbor tessellation. Every point owns the space closest to it.",
  alternates: { canonical: "/lab/voronoi" },
};

export default function VoronoiPage() {
  return (
    <>
      <Voronoi />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          voronoi
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click to add · drag to move
        </p>
      </div>
      <LabInfoPanel>
        <p>
          A <Term id="voronoi-diagram">Voronoi diagram</Term> partitions space so that every point
          is assigned to its nearest seed. The boundary between two cells is the set of points
          equidistant from both seeds. The result is a tessellation of convex polygons that tiles
          the plane with no gaps.
        </p>
        <p>
          The dual of a Voronoi diagram is the{" "}
          <Term id="delaunay-triangulation">Delaunay triangulation</Term>. Connect two seeds
          whenever their Voronoi cells share an edge. The result is a triangulation with the
          property that no point lies inside any triangle&apos;s{" "}
          <Term id="circumcircle">circumcircle</Term>. This maximizes the minimum angle across all
          triangles, avoiding thin slivers.
        </p>
        <p>
          This implementation uses the <Term id="bowyer-watson">Bowyer-Watson algorithm</Term> to
          build the Delaunay triangulation incrementally. For each new point: find all triangles
          whose circumcircle contains it, remove them to create a polygonal hole, then
          re-triangulate the hole. The Voronoi vertices are the circumcenters of the resulting
          triangles.
        </p>
        <p>
          Voronoi diagrams appear everywhere: cell biology (cell territories), geography (nearest
          facility maps), materials science (crystal grain boundaries), and computational geometry
          (mesh generation). They are also the foundation of{" "}
          <Term id="lloyd-relaxation">Lloyd relaxation</Term>, which iteratively moves seeds to
          their cell centroids to create evenly-spaced distributions.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Voronoi_diagram"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Wikipedia: Voronoi diagram
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
