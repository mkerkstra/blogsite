import { AgentHandoffs } from "@/features/lab/components/agent-handoffs";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "agent-handoffs",
  "Agent Handoffs",
  "Transfer control across specialists while preserving conversation state.",
);

export default function AgentHandoffsPage() {
  return (
    <>
      <AgentHandoffs />
      <div className="pointer-events-none fixed bottom-28 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          agent handoffs
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click nodes · space to pause · r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          An <Term id="agent-handoff">agent handoff</Term> moves active control from one agent or
          state to another. The handoff changes which prompt, tools, and obligations apply to the
          next turn, while the conversation keeps its accumulated state.
        </p>
        <p>
          A refund-review flow has natural stages. Intake collects the order ID and customer
          account. Verification checks eligibility. Resolution owns the refund action only after the
          required facts exist. The <Term id="active-agent">active agent</Term> state makes that
          stage boundary explicit.
        </p>
        <p>
          Handoffs serve <Term id="multi-stage-flow">multi-stage flows</Term> when each stage has
          entry criteria, exit criteria, and carried state. Bouncing appears when ownership rules
          are vague: agents transfer too often, ask for the same information twice, and weaken the
          user&apos;s sense of continuity.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://docs.langchain.com/oss/python/langchain/multi-agent/handoffs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            LangChain docs: Handoffs
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
