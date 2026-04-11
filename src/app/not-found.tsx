import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-10 py-12">
      <div className="reveal flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          [404] · not found
        </p>
        <h1 className="display-name font-display text-[clamp(3.5rem,11vw,6.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground">
          dead link.
        </h1>
      </div>

      <p className="reveal reveal-1 max-w-prose text-[13px] leading-[1.7] text-muted-foreground">
        Whatever was here has either been moved, was never here, or got lost in the migration. The
        resume page is still the canonical entry point.
      </p>

      <div className="reveal reveal-2 flex items-baseline gap-3 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>↳</span>
        <Link href="/" className="text-foreground no-underline transition-colors hover:text-accent">
          back to /
        </Link>
        <span className="opacity-50">·</span>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground no-underline transition-colors hover:text-accent"
        >
          resume.pdf
        </a>
      </div>
    </div>
  );
}
