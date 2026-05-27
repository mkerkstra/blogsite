import { Hooks } from "@/features/lab/components/hooks";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "hooks",
  "Hooks",
  "Deterministic lifecycle callbacks for guardrails, audit trails, memory, and approvals.",
);

export default function HooksPage() {
  return (
    <>
      <Hooks />
      <div className="pointer-events-none fixed bottom-28 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          hooks
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          click nodes · space to pause · r to reset
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          A <Term id="agent-hook">hook</Term> is code attached to a lifecycle event. It runs because
          a boundary was crossed, not because the model remembered an instruction. That makes hooks
          useful for work that must be deterministic: permission checks, logging, context injection,
          notifications, and cleanup.
        </p>
        <p>
          In the refund-review example, a <Term id="pre-tool-use">pre-tool hook</Term> can inspect a
          proposed refund write before it runs. If the order ID is missing, the amount exceeds a
          policy limit, or the tool arguments touch the wrong system, the hook returns a denial and
          a reason the agent can act on.
        </p>
        <p>
          The complementary hooks happen after or around the turn. A{" "}
          <Term id="post-tool-use">post-tool hook</Term> can record the result or add context before
          the next model call. A prompt, compaction, session, or stop hook can load focused memory,
          archive evidence, send a notification, or close resources.
        </p>
        <p>
          Hooks are not magic policy. Matchers should be narrow, hook output should be explainable,
          and slow side effects should not block the main loop unless they really decide whether the
          action can proceed. Codex also documents `PreToolUse` as a guardrail rather than a
          complete enforcement boundary, because not every tool path is intercepted.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://code.claude.com/docs/en/agent-sdk/hooks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Claude Agent SDK: Hooks
          </a>
          <span className="mx-2 text-foreground/30">·</span>
          <a
            href="https://developers.openai.com/codex/hooks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Codex docs: Hooks
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
