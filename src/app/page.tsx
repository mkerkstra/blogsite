import { AboutMe } from "@/features/resume/components/about-me";
import { Experience } from "@/features/resume/components/experience";
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
        <SectionLabel index="02">Tools I like to work with</SectionLabel>
        <Toolbox />
      </section>
    </div>
  );
}
