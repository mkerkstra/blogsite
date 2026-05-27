import { Kirigami } from "@/features/lab/components/kirigami";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "kirigami",
  "Kirigami",
  "A cut-sheet mechanism. Rotate panels, open pores, and turn paper into motion.",
);

export default function KirigamiPage() {
  return (
    <>
      <Kirigami />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          kirigami
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          space to deploy - r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          <Term id="kirigami">Kirigami</Term> adds cuts to the folding vocabulary of origami.
          Instead of asking a solid sheet to stretch, the pattern lets rigid islands rotate around
          narrow hinges. The material changes shape because geometry moves, not because the paper
          itself becomes elastic.
        </p>
        <p>
          This sketch uses a rotating-square lattice. Each panel is drawn as a nearly rigid unit,
          while the bright slits mark the cut lines that separate neighboring panels. Opening the
          sheet rotates alternating squares in opposite directions, creating pores between them.
          Pointer movement locally increases the opening, like pulling on one patch of the sheet.
        </p>
        <p>
          The important behavior is <Term id="auxetic">auxetic</Term>. Many materials get narrower
          when stretched. Rotating-square kirigami can do the opposite: pull it in one direction and
          it expands sideways too, giving an effective negative{" "}
          <Term id="poisson-ratio">Poisson ratio</Term>. The layout, hinge stiffness, and cut length
          determine how much motion the sheet can absorb before the material itself has to strain.
        </p>
        <p>
          Engineers use these ideas as{" "}
          <Term id="mechanical-metamaterial">mechanical metamaterials</Term>: structures whose bulk
          behavior comes from pattern and mechanism rather than chemistry alone. Small changes in
          the cuts can tune stretch, porosity, bending, and snap-through behavior. Here the model is
          intentionally kinematic, so the visual emphasizes the motion of the mechanism over stress
          or fracture.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/Kirigami"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Wikipedia: Kirigami
          </a>
          {" · "}
          <a
            href="https://pubs.rsc.org/en/content/articlehtml/2017/ra/c6ra27333e"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Auxetic mechanical metamaterials
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
