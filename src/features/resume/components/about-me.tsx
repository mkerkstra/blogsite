import { ArrowUpRight } from "lucide-react";

import { aboutMe } from "../data/about-me";
import { CyclingPortrait } from "./cycling-portrait";

const META: { label: string; value: string; href?: string }[] = [
  { label: "loc", value: aboutMe.location },
  {
    label: "git",
    value: aboutMe.contact.github,
    href: aboutMe.contact.githubUrl,
  },
  {
    label: "in",
    value: aboutMe.contact.linkedin,
    href: aboutMe.contact.linkedinUrl,
  },
  {
    label: "@",
    value: aboutMe.contact.email,
    href: `mailto:${aboutMe.contact.email}`,
  },
];

export function AboutMe() {
  return (
    <section className="flex flex-col gap-8">
      {/* Hero — oversized italic display name */}
      <div className="reveal flex items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            ↳ {aboutMe.title}
          </p>
          <h1
            className="display-name font-display text-[clamp(3.5rem,11vw,6.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground"
            style={{ viewTransitionName: "display-heading" }}
          >
            {aboutMe.name}
          </h1>
        </div>
        <CyclingPortrait />
      </div>

      {/* Blurb */}
      <p className="reveal reveal-1 max-w-prose text-[13px] leading-[1.7] text-muted-foreground">
        {aboutMe.blurb}
      </p>

      {/* Meta strip — mono key/value pairs */}
      <dl className="reveal reveal-2 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border pt-4 text-[11px] sm:grid-cols-2">
        {META.map((m) => (
          <div key={m.label} className="flex items-baseline gap-3">
            <dt className="w-8 shrink-0 font-mono uppercase tracking-[0.15em] text-muted-foreground">
              {m.label}
            </dt>
            <dd className="font-mono text-foreground">
              {m.href ? (
                <a
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-0.5 no-underline transition-colors hover:text-accent"
                >
                  {m.value}
                  <ArrowUpRight className="h-3 w-3 -translate-y-0.5 opacity-50 transition-all group-hover:-translate-y-1 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              ) : (
                m.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
