import Link from "next/link";

import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/85 backdrop-blur-sm">
      {/* Centered sign-off framed by hairline rules (the SectionLabel motif), with
          the lime `>_` brand glyph as the flourish. Hairlines fill what used to be
          dead space between a left-pinned copyright and right-pinned socials. */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-4 px-5 py-6 md:px-8">
        <span className="rule hidden sm:block" aria-hidden />
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="font-semibold leading-none text-accent" aria-hidden>
            &gt;_
          </span>
          <span>© {new Date().getFullYear()} · Matt Kerkstra</span>
          <span className="opacity-40" aria-hidden>
            ·
          </span>
          <Link href="/colophon" className="no-underline transition-colors hover:text-accent">
            colophon
          </Link>
          <span className="hidden opacity-40 sm:inline" aria-hidden>
            ·
          </span>
          <Socials />
        </div>
        <span className="rule hidden sm:block" aria-hidden />
      </div>
    </footer>
  );
}
