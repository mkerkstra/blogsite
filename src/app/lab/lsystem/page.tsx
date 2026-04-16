import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { LSystem } from "@/features/lab/components/lsystem";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "lsystem",
  "L-System",
  "Lindenmayer systems. Fractal trees from simple rewriting rules.",
);

export default function LSystemPage() {
  return (
    <>
      <LSystem />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          l-system
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/20">
          fractal rewriting
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          Start with a string and a set of replacement rules. Apply the rules repeatedly. Interpret
          the result as turtle graphics: F draws forward, + and - turn, brackets save and restore
          position.
        </p>
        <p>
          Aristid Lindenmayer invented L-systems in 1968 to model plant growth. The key insight is
          parallel rewriting: every symbol is replaced simultaneously in each iteration, unlike
          sequential Markov chains.
        </p>
        <p>
          The bracket operators create branching by pushing and popping the turtle&apos;s state.
          Each open bracket saves position and heading; each close bracket restores them, letting
          the turtle jump back to a fork point.
        </p>
        <p>
          Small changes in the branching angle produce dramatically different organisms, from ferns
          to dragon curves to the Sierpinski triangle. A handful of characters and one rewriting
          rule are enough to generate surprising complexity.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="http://algorithmicbotany.org/papers/abop/abop.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            The Algorithmic Beauty of Plants
          </a>
          {" · "}
          <a
            href="https://en.wikipedia.org/wiki/L-system"
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
