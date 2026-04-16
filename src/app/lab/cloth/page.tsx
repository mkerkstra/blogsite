import type { Metadata } from "next";

import { Cloth } from "@/features/lab/components/cloth";

export const metadata: Metadata = {
  title: "Cloth",
  description: "Verlet integration cloth. Drag to interact, pull to tear.",
  alternates: { canonical: "/lab/cloth" },
};

export default function ClothPage() {
  return (
    <>
      <Cloth />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          cloth
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          drag to interact, pull to tear
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Verlet integration: each particle remembers its current and previous position.
              Velocity is implicit. Constraints enforce fixed distances between neighbors.
            </p>
            <p>
              When a constraint stretches past 2.5x its rest length, it tears. Five relaxation
              passes per frame keep the cloth stable. Drag to push particles, pull hard to rip.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
