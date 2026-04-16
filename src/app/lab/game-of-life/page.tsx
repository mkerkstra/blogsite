import type { Metadata } from "next";
import { GameOfLife } from "@/features/lab/components/game-of-life";

export const metadata: Metadata = {
  title: "Game of Life",
  description: "Conway's cellular automaton. Draw cells and watch them evolve.",
  alternates: { canonical: "/lab/game-of-life" },
};

export default function GameOfLifePage() {
  return (
    <>
      <GameOfLife />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          game of life
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          draw cells, watch them evolve
        </p>
      </div>
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              Four rules. A live cell with 2 or 3 neighbors survives. A dead cell with exactly 3
              neighbors comes alive. Everything else dies. That is the entire program.
            </p>
            <p>
              From these rules emerge gliders, oscillators, guns, and Turing-complete computation.
              Draw cells or load a pattern and press play.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
