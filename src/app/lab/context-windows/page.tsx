import { ContextWindows } from "@/features/lab/components/context-windows";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";
import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "context-windows",
  "Context Windows",
  "The prompt budget that controls what an AI model can actually see.",
);

export default function ContextWindowsPage() {
  return (
    <>
      <LabHead slug="context-windows" />
      <ContextWindows />
      <LabActions />
      <LabInfoPanel>
        <p>
          A <Term id="context-window">context window</Term> is the finite workspace a model can use
          for one request. System rules, chat history, retrieved documents, tool results, the
          current question, and the future answer all compete for one{" "}
          <Term id="token-budget">token budget</Term>.
        </p>
        <p>
          A failing CI run shows the tradeoff. The prompt may contain a failure brief, early fix
          attempts, review notes, fresh logs, workflow configuration, source files, retrieved error
          lines, and the current fix request. The model can use only the pieces that fit, so each
          packing strategy decides which facts remain available when it proposes the next patch.
        </p>
        <p>
          The first computation is <Term id="prefill">prefill</Term>, where the transformer reads
          the chosen material and stores attention state in the <Term id="kv-cache">KV cache</Term>.
          Larger windows carry more of the CI thread, but they also increase memory use, first-token
          latency, and irrelevant text.
        </p>
        <p>
          Long context still has position bias. Models often use information near the beginning and
          end more reliably than information buried in the middle, a behavior studied as{" "}
          <Term id="lost-in-the-middle">lost in the middle</Term>. Tokens can fit in the window and
          still have weak influence on the final answer.
        </p>
        <p>
          The packing controls show three losses. <Term id="truncation">Truncation</Term> keeps the
          newest logs and current request, but drops earlier constraints and failed commands.{" "}
          <Term id="rag">Retrieval</Term> spends the budget on high-scoring matches like workflow
          files, source files, and error lines. <Term id="context-compaction">Compaction</Term>{" "}
          rewrites the prior conversation into a smaller memory, preserving decisions and evidence
          while losing exact wording and weak signals.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://arxiv.org/abs/1706.03762"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Vaswani et al. 2017
          </a>
          {" · "}
          <a
            href="https://arxiv.org/abs/2307.03172"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Liu et al. 2023
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
