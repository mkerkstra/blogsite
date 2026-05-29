import { EvaluatorOptimizer } from "@/features/lab/components/evaluator-optimizer";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "evaluator-optimizer",
  "Evaluator Optimizer",
  "Generate, critique, revise, and stop when the rubric passes.",
);

export default function EvaluatorOptimizerPage() {
  return (
    <>
      <LabHead slug="evaluator-optimizer" />
      <EvaluatorOptimizer />
      <div className="pointer-events-none fixed bottom-28 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          evaluator optimizer
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click nodes · space to pause · r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          The <Term id="evaluator-optimizer">evaluator-optimizer</Term> pattern splits creation and
          critique. One model proposes an answer, patch, or extraction. Another model or tool scores
          it against a rubric, then sends feedback into the next iteration. The loop exits when the
          score clears a threshold or a budget is exhausted.
        </p>
        <p>
          In the refund-review example, the optimizer drafts the decision and the evaluator checks
          the evidence: policy window, purchase amount, prior refunds, required disclosures, and
          confidence. The next draft is shaped by specific missing facts rather than a vague request
          to improve.
        </p>
        <p>
          The <Term id="rubric">rubric</Term> is the difference between convergence and churn.
          Tests, schemas, graders, and policy checks give the evaluator stable criteria. Vague
          critique can improve tone while damaging correctness; concrete criteria preserve the
          target across retries.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://www.anthropic.com/engineering/building-effective-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Anthropic: Building effective agents
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
