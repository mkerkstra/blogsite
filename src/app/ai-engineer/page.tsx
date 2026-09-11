import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { SocialMeta } from "@/components/social-meta";
import { aiPositioning } from "@/features/resume/data/positioning";
import { SectionLabel } from "@/features/resume/components/section-label";

const TITLE = "Staff AI Engineer profile - Matt Kerkstra";
const DESCRIPTION =
  "Evidence-backed profile for Staff AI Engineer, Applied AI Engineer, and AI Platform Engineer roles.";

export const metadata: Metadata = {
  title: "AI Engineer",
  description: DESCRIPTION,
  alternates: { canonical: "/ai-engineer" },
};

export const revalidate = 86400;

export default function AiEngineerPage() {
  return (
    <div className="flex flex-col gap-12" style={{ viewTransitionName: "page-body" }}>
      <SocialMeta
        title={`${TITLE} · kerkstra.dev`}
        description={DESCRIPTION}
        url="/ai-engineer"
        type="profile"
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: "https://www.kerkstra.dev/ai-engineer",
          name: TITLE,
          description: DESCRIPTION,
          mainEntity: {
            "@type": "Person",
            name: "Matt Kerkstra",
            url: "https://www.kerkstra.dev",
            jobTitle: aiPositioning.targetRoleFamilies.map((role) => role.title),
            knowsAbout: aiPositioning.evidence.map((item) => item.label),
          },
        }}
      />

      <header className="reveal flex flex-col gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          ↳ /ai-engineer · role profile
        </p>
        <h1
          className="display-name font-display text-[clamp(2.8rem,9vw,5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground"
          style={{ viewTransitionName: "display-heading" }}
        >
          production AI, end to end.
        </h1>
        <p className="max-w-prose text-[14px] leading-[1.75] text-muted-foreground">
          I am a staff-level AI engineer who works at the boundary between AI product, evaluation,
          model-serving infrastructure, and backend systems. My current domain is clinical AI; the
          reusable specialty is shipping reliable LLM products whose quality is measured by what
          users actually do.
        </p>
      </header>

      <section className="reveal reveal-1 flex flex-col gap-4">
        <SectionLabel index="01">Role fit</SectionLabel>
        <div className="flex flex-col">
          {aiPositioning.targetRoleFamilies.map((role) => (
            <article
              key={role.title}
              className="grid grid-cols-1 gap-2 border-t border-border py-4 md:grid-cols-[9rem_1fr] md:gap-8"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {role.fit}
              </p>
              <div className="flex flex-col gap-1">
                <h2 className="text-[15px] font-medium text-foreground">{role.title}</h2>
                <p className="text-[13px] leading-[1.7] text-muted-foreground">{role.rationale}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="reveal reveal-2 flex flex-col gap-4">
        <SectionLabel index="02">Evidence</SectionLabel>
        <div className="flex flex-col">
          {aiPositioning.evidence.map((item) => (
            <article
              key={item.label}
              className="grid grid-cols-1 gap-2 border-t border-border py-4 md:grid-cols-[9rem_1fr] md:gap-8"
            >
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {item.label}
              </h2>
              <p className="text-[13px] leading-[1.7] text-foreground/90">{item.proof}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reveal reveal-3 flex flex-col gap-4">
        <SectionLabel index="03">Boundaries</SectionLabel>
        <ul className="flex list-disc flex-col gap-3 pl-5 text-[13px] leading-[1.7] text-muted-foreground">
          {aiPositioning.boundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
