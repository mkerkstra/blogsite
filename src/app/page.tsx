import type { Metadata } from "next";

import { AboutMe } from "@/features/resume/components/about-me";
import { Education } from "@/features/resume/components/education";
import { Experience } from "@/features/resume/components/experience";
import { Projects } from "@/features/resume/components/projects";
import { SectionLabel } from "@/features/resume/components/section-label";
import { Toolbox } from "@/features/resume/components/toolbox";

export const metadata: Metadata = {
  // Override the layout's title template — homepage uses the absolute title.
  title: { absolute: "Matt Kerkstra - Software Engineer" },
  alternates: { canonical: "/" },
};

// JSON-LD Person schema is injected into the prerendered HTML by
// scripts/post-process-html.ts at build time, NOT through React.
// Rendering <script type="application/ld+json"> in React's tree
// triggers a hydration warning that drops Lighthouse best-practices,
// and next/script defers the script to runtime where crawlers can't
// see it. Post-build injection sidesteps both problems.

export const revalidate = 86400;

export default function ResumePage() {
  return (
    <div className="flex flex-col gap-16" style={{ viewTransitionName: "page-body" }}>
      <AboutMe />

      <section id="experience" className="reveal reveal-3 flex flex-col gap-4 scroll-mt-20">
        <SectionLabel index="01">Where I&apos;ve worked</SectionLabel>
        <Experience />
      </section>

      <section id="projects" className="reveal reveal-4 flex flex-col gap-4 scroll-mt-20">
        <SectionLabel index="02">Side projects</SectionLabel>
        <Projects />
      </section>

      <section id="tools" className="reveal reveal-4 flex flex-col gap-4 scroll-mt-20">
        <SectionLabel index="03">Tools I like to work with</SectionLabel>
        <Toolbox />
      </section>

      <section id="education" className="reveal reveal-4 flex flex-col gap-4 scroll-mt-20">
        <SectionLabel index="04">Education</SectionLabel>
        <Education />
      </section>
    </div>
  );
}
