import { Download } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-5 md:px-8">
        <a
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground no-underline hover:text-accent"
        >
          kerkstra<span className="text-muted-foreground">.dev</span>
        </a>
        <div className="flex items-center gap-1">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download resume.pdf"
            className="inline-flex h-8 items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground no-underline transition-colors hover:text-accent"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">resume.pdf</span>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
