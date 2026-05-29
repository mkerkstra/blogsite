import { AdvisorStrategy } from "@/features/lab/components/advisor-strategy";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "advisor-strategy",
  "Advisor Strategy",
  "A premium model advises while cheaper executors do the high-volume work.",
);

export default function AdvisorStrategyPage() {
  return (
    <>
      <LabHead slug="advisor-strategy" />
      <AdvisorStrategy />
      <div className="pointer-events-none fixed bottom-28 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          advisor strategy
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click nodes · space to pause · r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          The <Term id="advisor-strategy">advisor strategy</Term> keeps expensive reasoning focused
          on decisions that change the outcome. A high-capability{" "}
          <Term id="advisor-model">advisor model</Term> plans, reviews, and resolves ambiguity,
          while a cheaper <Term id="executor-model">executor model</Term> handles repeatable work.
          The pattern fits workflows where most steps are routine and a few steps need judgment.
        </p>
        <p>
          A refund-review agent makes the split concrete. Sonnet extracts the order ID, purchase
          date, policy window, and customer message. Opus reads only the disputed cases: missing
          evidence, unusual policy exceptions, repeated failed retries, or the final decision before
          money moves.
        </p>
        <p>
          The <Term id="escalation-policy">escalation policy</Term> is the contract between those
          roles. Confidence scores, deterministic rules, failed retries, and a final{" "}
          <Term id="quality-gate">quality gate</Term> decide when routine execution becomes advisor
          review. Frequent escalation recreates the cost of a single premium-model pipeline; rare
          escalation lets cheap-model errors reach the user.
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
