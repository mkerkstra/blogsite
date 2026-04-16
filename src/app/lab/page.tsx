import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SectionLabel } from "@/features/resume/components/section-label";
import { sections } from "@/features/lab/data/experiments";

export const metadata: Metadata = {
  title: "Lab",
  description: "Visual experiments and algorithm visualizations by Matt Kerkstra.",
  alternates: { canonical: "/lab" },
};

// Tiny solid blurs to fill the card before the optimized WebP arrives.
// One per theme — dark previews are near-black, light previews are near-cream.
const BLUR_DARK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAACgpqunAAAAFElEQVR42mNkqGf4z8DAwMRAJgAANh4COJZbwL4AAAAASUVORK5CYII=";
const BLUR_LIGHT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAACgpqunAAAAFklEQVR42mP8/4ehnoGBgYmBHKDPAACvJgMBxLqvuwAAAABJRU5ErkJggg==";

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

            <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2">
              {section.experiments.map((exp) => {
                counter++;
                const indexLabel = String(counter).padStart(2, "0");
                return (
                  <Link
                    key={exp.slug}
                    href={`/lab/${exp.slug}`}
                    className="group flex flex-col gap-3 no-underline"
                  >
                    <div className="relative aspect-[1200/630] w-full overflow-hidden border border-border bg-muted/30 transition-colors group-hover:border-accent">
                      <Image
                        src={`/lab-previews/${exp.slug}.dark.png`}
                        alt={`${exp.title} preview`}
                        fill
                        sizes="(min-width: 640px) 384px, 100vw"
                        priority={counter <= 2}
                        placeholder="blur"
                        blurDataURL={BLUR_DARK}
                        className="theme-only-dark object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <Image
                        src={`/lab-previews/${exp.slug}.light.png`}
                        alt=""
                        aria-hidden
                        fill
                        sizes="(min-width: 640px) 384px, 100vw"
                        placeholder="blur"
                        blurDataURL={BLUR_LIGHT}
                        className="theme-only-light object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
                        [{indexLabel}]
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-sm text-foreground transition-colors group-hover:text-accent">
                          {exp.title}
                        </span>
                        <p className="mt-0.5 text-sm text-muted-foreground">{exp.description}</p>
                      </div>
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
