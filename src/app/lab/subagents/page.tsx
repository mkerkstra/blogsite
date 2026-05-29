import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Subagents } from "@/features/lab/components/subagents";
import { Term } from "@/features/lab/components/term";
import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "subagents",
  "Subagents",
  "Specialized agents with separate context, tools, and scoped instructions.",
);

export default function SubagentsPage() {
  return (
    <>
      <LabHead slug="subagents" />
      <Subagents />
      <div className="pointer-events-none fixed bottom-28 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          subagents
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click nodes · space to pause · r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          A <Term id="subagent">subagent</Term> is a bounded worker with its own prompt, context
          window, and optional tool permissions. The parent conversation keeps the main goal, while
          the worker investigates one slice of the problem and returns a compact result.
        </p>
        <p>
          In the refund-review example, one subagent can inspect policy text, another can summarize
          the customer conversation, and a third can verify order history. Each worker may read a
          large amount of material. The parent receives only the evidence that affects the refund
          decision.
        </p>
        <p>
          The core value is <Term id="context-isolation">context isolation</Term>. Noisy logs,
          documentation sweeps, and alternative analyses stay outside the main thread until they
          become findings. Predictability comes from narrow scope: the worker&apos;s model, tools,
          permissions, and output shape match the delegated task.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://code.claude.com/docs/en/sub-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Claude Code docs: Subagents
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
