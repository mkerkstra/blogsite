import type { Metadata } from "next";
import Link from "next/link";

import { SectionLabel } from "@/features/resume/components/section-label";
import { sections } from "@/features/lab/data/experiments";

export const metadata: Metadata = {
  title: "Lab",
  description: "Visual experiments and algorithm visualizations by Matt Kerkstra.",
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  let counter = 0;

  return (
    <div style={{ viewTransitionName: "page-body" }}>
      <h1
        className="font-display text-4xl italic"
        style={{ viewTransitionName: "display-heading" }}
      >
        lab
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Experiments. Raw WebGL, Canvas2D, no libraries.
      </p>

      {sections.map((section, sectionIndex) => {
        const sectionNumber = String(sectionIndex + 1).padStart(2, "0");
        return (
          <div key={section.label} className="mt-12">
            <SectionLabel index={sectionNumber}>{section.label}</SectionLabel>

            <div className="mt-6 flex flex-col gap-6 sm:gap-8">
              {section.experiments.map((exp) => {
                counter++;
                return (
                  <Link
                    key={exp.slug}
                    href={`/lab/${exp.slug}`}
                    className="group flex items-baseline gap-4 no-underline"
                  >
                    <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
                      [{String(counter).padStart(2, "0")}]
                    </span>
                    <div>
                      <span className="font-mono text-sm text-foreground transition-colors group-hover:text-accent">
                        {exp.title}
                      </span>
                      <p className="mt-0.5 text-sm text-muted-foreground">{exp.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
