import type { Metadata } from "next";
import Image from "next/image";

import { ollieBio, olliePics } from "@/features/ollie/data/ollie";
import { SectionLabel } from "@/features/resume/components/section-label";

export const metadata: Metadata = {
  title: "Ollie",
  description:
    "Meet Ollie the chipoodle. Rescue dog, professional nook-finder, and the real star of kerkstra.dev.",
  robots: { index: false },
};

export default function OlliePage() {
  const gotchaDate = new Date(ollieBio.gotchaDay).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-12" style={{ viewTransitionName: "page-body" }}>
      <header className="reveal flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          ↳ /ollie
        </p>
        <h1
          className="display-name font-display text-[clamp(2.5rem,8vw,4.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground"
          style={{ viewTransitionName: "display-heading" }}
        >
          ollie.
        </h1>
      </header>

      <section className="reveal reveal-1 flex flex-col gap-4">
        <SectionLabel index="01">The dog</SectionLabel>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-[1.7] text-foreground/90">
            {ollieBio.breed}. {ollieBio.origin} dog. Gotcha day: {gotchaDate}.
          </p>
          <ul className="flex flex-col gap-1.5">
            {ollieBio.traits.map((trait) => (
              <li key={trait} className="flex gap-2.5 text-[13px] leading-[1.7] text-foreground/90">
                <span
                  aria-hidden
                  className="mt-[3px] shrink-0 font-mono text-[10px] text-muted-foreground"
                >
                  ·
                </span>
                {trait}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="reveal reveal-2 flex flex-col gap-4">
        <SectionLabel index="02">Gallery</SectionLabel>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {olliePics.map((pic) => (
            <div key={pic.alt} className="flex flex-col gap-1.5">
              <Image
                src={pic.src}
                alt={pic.alt}
                placeholder="blur"
                sizes="(max-width: 768px) 45vw, 240px"
                className="h-auto w-full border border-border"
              />
              <p className="font-mono text-[9px] italic tracking-wide text-muted-foreground">
                {pic.alt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
