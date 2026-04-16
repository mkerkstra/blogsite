import type { Metadata } from "next";

import { Fourier } from "@/features/lab/components/fourier";

export const metadata: Metadata = {
  title: "Fourier",
  description: "Draw a shape. Watch rotating circles recreate it.",
  alternates: { canonical: "/lab/fourier" },
};

export default function FourierPage() {
  return (
    <>
      <Fourier />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          fourier
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          draw a shape
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Any closed curve can be decomposed into a sum of rotating circles at different
              frequencies. The Discrete Fourier Transform finds the amplitude and phase of each
              frequency component.
            </p>
            <p>
              More terms means more circles and a closer approximation. With enough terms, the
              epicycles retrace your original drawing exactly.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
