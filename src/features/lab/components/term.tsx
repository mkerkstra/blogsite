import { glossary } from "@/features/lab/data/glossary";

/**
 * Inline glossary tooltip for domain-specific terms.
 * Dotted underline; hover reveals a definition via CSS ::after.
 * No child elements — uses data-tip + pseudo-element to avoid
 * interfering with inline text whitespace.
 */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  const def = glossary[id];
  if (!def) return <>{children}</>;

  return (
    <span
      data-tip={def}
      className="term-tip cursor-help border-b border-dotted border-foreground/30"
    >
      {children}
    </span>
  );
}
