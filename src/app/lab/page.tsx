import type { Metadata } from "next";
import Link from "next/link";

import { experiments } from "@/features/lab/data/experiments";

export const metadata: Metadata = {
  title: "Lab",
  description: "GPU-driven visual experiments by Matt Kerkstra.",
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  return (
    <div style={{ viewTransitionName: "page-body" }}>
      <h1
        className="font-display text-4xl italic"
        style={{ viewTransitionName: "display-heading" }}
      >
        lab
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        GPU experiments. Raw WebGL, no libraries.
      </p>

      <div className="mt-12 flex flex-col gap-8">
        {experiments.map((exp, i) => (
          <Link
            key={exp.slug}
            href={`/lab/${exp.slug}`}
            className="group flex items-baseline gap-4 no-underline"
          >
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
              [{String(i + 1).padStart(2, "0")}]
            </span>
            <div>
              <span className="font-mono text-sm text-foreground transition-colors group-hover:text-accent">
                {exp.title}
              </span>
              <p className="mt-0.5 text-sm text-muted-foreground">{exp.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
