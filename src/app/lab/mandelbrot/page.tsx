import type { Metadata } from "next";

import { Mandelbrot } from "@/features/lab/components/mandelbrot";

export const metadata: Metadata = {
  title: "Mandelbrot",
  description: "GPU-rendered Mandelbrot set. Click to zoom, drag to pan.",
  alternates: { canonical: "/lab/mandelbrot" },
};

export default function MandelbrotPage() {
  return (
    <>
      <Mandelbrot />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          mandelbrot
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          click to zoom, drag to pan
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              For each pixel, iterate z = z*z + c until escape or max iterations. The escape time
              determines the color. Smooth coloring interpolates between iteration bands using the
              final magnitude.
            </p>
            <p>
              Rendered in a single fragment shader on the GPU. Iterations scale with zoom depth to
              reveal finer detail at higher magnification.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
