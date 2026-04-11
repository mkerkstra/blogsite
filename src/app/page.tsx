import { AboutMe } from "@/features/resume/components/about-me";
import { Education } from "@/features/resume/components/education";
import { Experience } from "@/features/resume/components/experience";
import { Projects } from "@/features/resume/components/projects";
import { SectionLabel } from "@/features/resume/components/section-label";
import { Toolbox } from "@/features/resume/components/toolbox";

export const revalidate = 86400;

export default function ResumePage() {
  return (
    <div className="flex flex-col gap-16">
      <AboutMe />

      <section className="reveal reveal-3 flex flex-col gap-4">
        <SectionLabel index="01">Where I&apos;ve worked</SectionLabel>
        <Experience />
      </section>

      <section className="reveal reveal-4 flex flex-col gap-4">
        <SectionLabel index="02">Side projects</SectionLabel>
        <Projects />
      </section>

      <section className="reveal reveal-4 flex flex-col gap-4">
        <SectionLabel index="03">Tools I like to work with</SectionLabel>
        <Toolbox />
      </section>

      <section className="reveal reveal-4 flex flex-col gap-4">
        <SectionLabel index="04">Education</SectionLabel>
        <Education />
      </section>
    </div>
  );
}
