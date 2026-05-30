import { GameOfLife } from "@/features/lab/components/game-of-life";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "game-of-life",
  "Game of Life",
  "Conway's cellular automaton. Draw cells and watch them evolve.",
);

export default function GameOfLifePage() {
  return (
    <>
      <LabHead slug="game-of-life" />
      <GameOfLife
        info={
          <>
            <p>
              Four rules. A live cell with 2 or 3 neighbors survives. A dead cell with exactly 3
              neighbors comes alive. Everything else dies. That is the entire program. Conway
              designed them by trial and error: he wanted a system complex enough for universal
              computation but simple enough to hand-simulate on a Go board.
            </p>
            <p>
              In 1970 Bill Gosper discovered the <Term id="glider-gun">glider gun</Term>, a pattern
              that periodically emits gliders. That was the key result. Gliders act as signals, guns
              act as emitters, and collisions act as logic gates. Together they proved the Game of
              Life is <Term id="turing-complete">Turing-complete</Term>: anything computable can, in
              principle, be built from these four rules.
            </p>
            <p>
              The automaton exhibits three classes of persistent structure. Still lifes (blocks,
              beehives) are stable. Oscillators (blinkers, pulsars) cycle through a fixed period.
              Spaceships (gliders, lightweight spaceships) translate across the grid. Everything
              else either decays into one of these forms or grows without bound.
            </p>
            <p>
              Draw cells or load a pattern and press play. Watch how random initial conditions
              settle into a mix of still lifes and oscillators, punctuated by the occasional glider
              escaping to infinity.
            </p>
            <p className="border-t border-border pt-2">
              <a
                href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                Wikipedia
              </a>
              {" · "}
              <a
                href="https://conwaylife.com/wiki/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                LifeWiki
              </a>
            </p>
          </>
        }
      />
    </>
  );
}
