import Link from "next/link";

import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <p>© {new Date().getFullYear()} · Matt Kerkstra</p>
          <span className="opacity-50">·</span>
          <Link href="/colophon" className="no-underline transition-colors hover:text-accent">
            colophon
          </Link>
        </div>
        <Socials />
      </div>
    </footer>
  );
}
