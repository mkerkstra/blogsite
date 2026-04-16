import type { Metadata } from "next";

import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { Physarum } from "@/features/lab/components/physarum";

export const metadata: Metadata = {
  title: "Physarum",
  description: "Slime mold simulation with 262k agents on the GPU.",
  alternates: { canonical: "/lab/physarum" },
};

export default function PhysarumPage() {
  return (
    <>
      <Physarum />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          physarum slime mold
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          move to attract
        </p>
      </div>
      <LabInfoPanel>
        <p>
          262,144 agents wander a 2D surface, each sensing pheromone concentration at three points
          ahead: left, center, and right, offset by a sensor angle and sensor distance. This
          three-sensor arrangement creates <Term id="chemotaxis">chemotaxis</Term>. Each agent
          compares the three readings, turns toward the strongest signal, steps forward, and
          deposits its own trail. A diffusion pass blurs and decays the trail each frame.
        </p>
        <p>
          The algorithm was proposed by Jeff Jones (2010) to model the transport networks of
          Physarum polycephalum, a slime mold that solves shortest-path and network-optimization
          problems without centralized control. The model captures the essential feedback loop:
          agents reinforce paths they travel, and reinforced paths attract more agents.
        </p>
        <p>
          Sensor distance and sensor angle are the most sensitive parameters. Large sensor distance
          makes agents responsive to distant pheromone gradients, producing sparse, highway-like
          networks. Small sensor distance creates dense, capillary-like meshes. The diffusion kernel
          size controls branch thickness: a wider blur lets trails spread further before decaying,
          resulting in thicker veins. Decay rate determines how long abandoned paths persist.
        </p>
        <p>
          Agent state lives in a float texture, updated per-frame by a{" "}
          <Term id="fragment-shader">fragment shader</Term>. Deposits scatter via{" "}
          <Term id="gl-points">GL_POINTS</Term> into the trail framebuffer. The result is entirely
          emergent: no agent knows about any other, yet they self-organize into branching vascular
          networks. Your cursor warps the agents&apos; turn bias, pulling the network toward you.
          Watch for the network adapting in real time as it reroutes around your input.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://sagejenson.com/physarum"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Sage Jenson
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/Physarum_polycephalum"
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
