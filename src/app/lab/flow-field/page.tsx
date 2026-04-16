import { FlowField } from "@/features/lab/components/flow-field";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "flow-field",
  "Flow Field",
  "GPU particle system driven by curl noise.",
);

export default function FlowFieldPage() {
  return (
    <>
      <FlowField />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          curl noise flow field
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          move to attract
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          100,000 particles are advected through a <Term id="curl-noise">curl noise</Term> velocity
          field. The curl of a potential field is mathematically guaranteed to be{" "}
          <Term id="divergence-free">divergence-free</Term>: it has no sources or sinks, so
          particles neither clump together nor scatter apart. They flow in swirling, incompressible
          streams. The underlying potential is 3D{" "}
          <Term id="perlin-noise">Perlin or simplex noise</Term> evaluated at (x, y, time), so the
          field evolves smoothly and the turbulence feels organic rather than random.
        </p>
        <p>
          The key parameters are noise frequency, octave count, and time scale. Higher frequency
          produces tighter, more intricate swirls. More octaves layer fine detail on top of broad
          flow structure. The time scale controls how quickly the field morphs. Together they
          determine whether the flow looks like slow smoke, river currents, or violent turbulence.
        </p>
        <p>
          Particle positions live in a GPU buffer and update each frame via{" "}
          <Term id="transform-feedback">transform feedback</Term>, which lets the vertex shader
          write updated positions back to the buffer without a CPU roundtrip. This keeps the entire
          simulation on the GPU. Trail persistence comes from rendering a semi-transparent quad over
          the previous frame instead of clearing it, so old positions fade by alpha rather than
          disappearing instantly.
        </p>
        <p>
          Your mouse adds an attraction force that warps the flow locally.{" "}
          <Term id="additive-blending">Additive blending</Term> makes the streams glow where
          particles converge, revealing the underlying vector field structure. Watch for saddle
          points where streams split and for vortex cores where trails spiral inward.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://dl.acm.org/doi/10.1145/1276377.1276435"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Bridson et al., Curl-Noise (2007)
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
