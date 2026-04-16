import type { Metadata } from "next";

import { Fourier } from "@/features/lab/components/fourier";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

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
      <LabInfoPanel>
        <p>
          Any closed curve can be decomposed into a sum of rotating circles at different
          frequencies. The <Term id="dft">Discrete Fourier Transform</Term> finds the amplitude and
          phase of each frequency component.
        </p>
        <p>
          The DFT treats the drawn path as a discrete signal sampled at N points. Each frequency
          component k corresponds to a circle rotating k times per cycle. The amplitude sets the
          circle&apos;s radius; the phase sets its starting angle.
        </p>
        <p>
          Low frequencies capture the shape&apos;s overall structure. High frequencies add fine
          detail and sharp corners. More terms means more circles and a closer approximation.
        </p>
        <p>
          The reconstruction is exact when all N terms are used because the DFT is invertible. With
          enough <Term id="epicycle">epicycles</Term> the traced path converges perfectly to your
          original drawing.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://www.jezzamon.com/fourier/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Jez Swanson, interactive
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/Discrete_Fourier_transform"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Wikipedia
          </a>
        </p>
      </LabInfoPanel>
    </>
  );
}
