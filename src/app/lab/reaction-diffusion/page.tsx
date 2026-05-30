import { ReactionDiffusion } from "@/features/lab/components/reaction-diffusion";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "reaction-diffusion",
  "Reaction Diffusion",
  "Gray-Scott reaction diffusion simulation running on the GPU.",
);

export default function ReactionDiffusionPage() {
  return (
    <>
      <LabHead slug="reaction-diffusion" />
      <ReactionDiffusion
        info={
          <>
            <p>
              Two virtual chemicals (U and V) diffuse across a 2D grid and react with each other
              according to the Gray-Scott model. U feeds V, V inhibits U, and both diffuse at
              different rates. The balance between feed rate (F), kill rate (k), and the diffusion
              ratio determines the pattern.{" "}
              <Term id="pearson-classification">Pearson&apos;s classification</Term> maps the (F, k)
              parameter space into distinct morphologies: spots, stripes, mitosis, coral growth,
              pulsating solitons, and labyrinthine mazes. Small shifts in these two numbers produce
              radically different worlds.
            </p>
            <p>
              The reaction-diffusion update applies a discrete <Term id="laplacian">Laplacian</Term>{" "}
              stencil to approximate spatial diffusion. Each <Term id="texel">texel</Term>
              &nbsp;samples its four cardinal neighbors, weights them against the center, and feeds
              the result into the Gray-Scott rate equations. The Laplacian&apos;s kernel size
              determines how far chemicals spread per timestep. Multiple simulation steps per frame
              accelerate the dynamics without changing the spatial resolution.
            </p>
            <p>
              Each frame, a <Term id="fragment-shader">fragment shader</Term> runs the Gray-Scott
              equations on every texel simultaneously. Two{" "}
              <Term id="framebuffer">framebuffers</Term> ping-pong the state: one reads while the
              other writes, then they swap. The render pass maps V concentration to color. No CPU
              simulation. Pure GPU.
            </p>
            <p>
              Clicking seeds a burst of V chemical at that point, nucleating new pattern growth that
              propagates outward and interacts with existing structures. Moving your mouse locally
              shifts the feed/kill parameters, warping the dynamics in real time. Watch for areas
              where two pattern regimes collide. The boundary between them often produces the most
              visually complex behavior.
            </p>
            <p className="border-t border-border pt-2">
              <a
                href="https://www.karlsims.com/rd.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                Karl Sims
              </a>
              {" · "}
              <a
                href="https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system"
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
