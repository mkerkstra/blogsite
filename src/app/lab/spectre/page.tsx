import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";
import { Spectre } from "@/features/lab/components/spectre";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "spectre",
  "Spectre",
  "The aperiodic monotile. One shape, infinite non-repeating tiling.",
);

export default function SpectrePage() {
  return (
    <>
      <Spectre />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          spectre
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          aperiodic monotile (2023)
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          For over sixty years, mathematicians asked the{" "}
          <Term id="einstein-problem">einstein problem</Term>: does a single shape exist that tiles
          the plane but only in a non-repeating way? Penrose tilings (1974) achieved{" "}
          <Term id="aperiodic-tiling">aperiodic tiling</Term> with two shapes. The hat tile (March
          2023) brought it down to one, but required mirror flips. The spectre tile, published
          months later by Smith, Myers, Kaplan, and Goodman-Strauss, is the first true{" "}
          <Term id="monotile">aperiodic monotile</Term> that needs no reflections at all.
        </p>
        <p>
          The spectre is built from a 14-sided polygon derived from the hat tile by replacing
          straight edges with curves. Those curves break mirror symmetry, so the tile and its
          reflection are distinct shapes. This means the spectre tiles the plane using only
          rotations and translations, never flips. The resulting pattern provably never repeats: no
          finite translation maps the tiling onto itself.
        </p>
        <p>
          This visualization uses <Term id="substitution-tiling">substitution rules</Term> to
          generate the tiling. A small seed cluster is recursively inflated: at each level, every
          tile is replaced by a group of smaller copies arranged according to fixed rules. After
          several iterations, the hierarchy produces a tiling that covers the visible area. Colors
          encode which metatile role each spectre plays in the substitution, making the recursive
          structure visible.
        </p>
        <p>
          The result matters beyond geometry. Aperiodic tilings appear in quasicrystals, whose
          discovery won Dan Shechtman the 2011 Nobel Prize in Chemistry. The spectre proves that
          nature&apos;s simplest building block, a single shape, is enough to produce infinite
          complexity without repetition. Pan and zoom to explore the structure at different scales.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://arxiv.org/abs/2305.17743"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Smith et al. (2023)
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/Einstein_problem"
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
