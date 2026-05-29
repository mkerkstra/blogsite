import { DocumentationPrinciples } from "@/features/lab/components/documentation-principles";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "documentation-principles",
  "Documentation Principles",
  "A document compiler for Diátaxis mode, vocabulary, examples, visuals, and cognitive load.",
);

export default function DocumentationPrinciplesPage() {
  return (
    <>
      <LabHead slug="documentation-principles" />
      <DocumentationPrinciples />
      <LabActions />
      <LabInfoPanel>
        <p>
          Internal documentation works when every structural choice protects the reader's working
          memory. A doc with one <Term id="diataxis">Diátaxis</Term> mode, defined terms, one
          recurring example, and a visual that shows the real transformation gives the reader a
          model they can reuse after the page is closed.
        </p>
        <p>
          The recurring example here is a session-recap pipeline being explained to a teammate. The
          doc's mode is explanation because the teammate needs to understand why activity events
          become a recap through specific stages. Its{" "}
          <Term id="working-vocabulary">working vocabulary</Term> names activity event, stage,
          recap, and reader model before those terms carry the argument.
        </p>
        <p>
          Each section starts with the claim the reader needs to keep, then adds detail in
          decreasing order of importance. That <Term id="inverted-pyramid">inverted pyramid</Term>{" "}
          shape combines with <Term id="given-before-new">given-before-new</Term> ordering: the
          recap stays familiar while each paragraph adds one new constraint, alternative, or
          consequence.
        </p>
        <p>
          The diagram earns its space only when it shows the system's actual transformation: inputs,
          labeled stages, and output. The same standard trims prose. A sentence remains when it
          changes the reader's <Term id="mental-model">mental model</Term>; otherwise it consumes{" "}
          <Term id="cognitive-load">cognitive load</Term> without carrying the explanation.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://diataxis.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Diátaxis
          </a>
          {" · "}
          <a
            href="https://www.plainlanguage.gov/guidelines/organize/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Plain language organization
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
