import { glossary } from "@/features/lab/data/glossary";

/**
 * Inline glossary tooltip for domain-specific terms.
 * Dotted underline; hover/focus reveals a definition via CSS ::after.
 * No child elements — uses data-tip + pseudo-element to avoid
 * interfering with inline text whitespace.
 */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  const def = glossary[id];
  if (!def) return <>{children}</>;

  return (
    <span
      data-tip={def}
      tabIndex={0}
      className="term-tip cursor-help border-b border-dotted border-muted-foreground/40 focus-visible:outline-1 focus-visible:outline-accent"
    >
      {children}
    </span>
  );
}
