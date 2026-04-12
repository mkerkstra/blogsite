import type { Metadata } from "next";

import { craftNotes } from "@/features/colophon/data/craft-notes";
import { stack } from "@/features/colophon/data/stack";
import { tokenGroups } from "@/features/colophon/data/tokens";
import { SectionLabel } from "@/features/resume/components/section-label";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How kerkstra.dev is built. Stack, typography, color tokens, Lighthouse scores, and the accessibility principles behind the design.",
  alternates: { canonical: "/colophon" },
};

export default function ColophonPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="reveal flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          ↳ /colophon
        </p>
        <h1 className="display-name font-display text-[clamp(2.5rem,8vw,4.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground">
          how this site is built.
        </h1>
      </header>

      {/* Stack */}
      <section className="reveal reveal-1 flex flex-col gap-4">
        <SectionLabel index="01">Stack</SectionLabel>
        <div className="flex flex-col">
          {stack.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-1 gap-2 border-t border-border py-3 md:grid-cols-[7rem_1fr] md:gap-8"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
                {item.label}
              </div>
              <div className="text-[13px] text-foreground/90">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="reveal reveal-2 flex flex-col gap-4">
        <SectionLabel index="02">Typography</SectionLabel>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              --font-display · Newsreader
            </p>
            <p className="font-display text-[2rem] italic leading-tight text-foreground">
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              --font-sans · Hanken Grotesk
            </p>
            <div className="flex flex-col gap-1">
              <p className="font-sans text-[15px] font-normal text-foreground">
                Regular 400. The quick brown fox jumps over the lazy dog.
              </p>
              <p className="font-sans text-[15px] font-medium text-foreground">
                Medium 500. The quick brown fox jumps over the lazy dog.
              </p>
              <p className="font-sans text-[15px] font-semibold text-foreground">
                Semibold 600. The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              --font-mono · JetBrains Mono
            </p>
            <p className="font-mono text-[13px] text-foreground">
              const site = &quot;kerkstra.dev&quot;;
            </p>
          </div>
        </div>
      </section>

      {/* Color Tokens */}
      <section className="reveal reveal-3 flex flex-col gap-4">
        <SectionLabel index="03">Color tokens</SectionLabel>
        <div className="flex flex-col gap-6">
          {tokenGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {group.tokens.map((token) => (
                  <div key={token.variable} className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 shrink-0 border border-border"
                      style={{ background: `hsl(var(${token.variable}))` }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-foreground/90">{token.name}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {token.variable}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Craft Notes */}
      <section className="reveal reveal-4 flex flex-col gap-4">
        <SectionLabel index="04">Craft</SectionLabel>
        <ul className="flex flex-col gap-2">
          {craftNotes.map((note) => (
            <li key={note} className="flex gap-2.5 text-[13px] leading-[1.7] text-foreground/90">
              <span
                aria-hidden
                className="mt-[3px] shrink-0 font-mono text-[10px] text-muted-foreground"
              >
                ·
              </span>
              {note}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
