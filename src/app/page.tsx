import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { SocialMeta } from "@/components/social-meta";
import { AboutMe } from "@/features/resume/components/about-me";
import { Education } from "@/features/resume/components/education";
import { Experience } from "@/features/resume/components/experience";
import { Projects } from "@/features/resume/components/projects";
import { SectionLabel } from "@/features/resume/components/section-label";
import { Toolbox } from "@/features/resume/components/toolbox";
import { buildPersonSchema } from "@/features/resume/lib/person-schema";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_PERSON } from "@/lib/site";
import { buildPageSchema } from "@/lib/seo-schema";

export const metadata: Metadata = {
  // Override the layout's title template — homepage uses the absolute title.
  title: { absolute: DEFAULT_TITLE },
  alternates: { canonical: "/" },
};

export const revalidate = 86400;

export default function ResumePage() {
  return (
    <div className="flex flex-col gap-16" style={{ viewTransitionName: "page-body" }}>
      <SocialMeta title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} url="/" type="website" />
      <JsonLd
        data={[
          buildPersonSchema(),
          ...buildPageSchema({
            name: DEFAULT_TITLE,
            description: DEFAULT_DESCRIPTION,
            path: "/",
            type: "ProfilePage",
            extra: { mainEntity: SITE_PERSON },
          }),
        ]}
      />
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
