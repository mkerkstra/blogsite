import { DoublePendulum } from "@/features/lab/components/double-pendulum";
import { Term } from "@/features/lab/components/term";

import { LabHead } from "@/features/lab/components/lab-head";
import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "double-pendulum",
  "Double Pendulum",
  "Chaos in two arms. Nearly identical starts, wildly different paths.",
);

export default function DoublePendulumPage() {
  return (
    <>
      <LabHead slug="double-pendulum" />
      <DoublePendulum
        info={
          <>
            <p>
              A <Term id="double-pendulum">double pendulum</Term> is two rigid arms connected end to
              end, swinging freely under gravity. Despite its simplicity, it is one of the classic
              examples of <Term id="deterministic-chaos">deterministic chaos</Term>. The system
              obeys exact equations, yet tiny differences in starting conditions lead to completely
              different trajectories.
            </p>
            <p>
              Two pendulums are launched simultaneously from nearly identical positions. Pendulum A
              starts at angles (2.5, 2.500) radians. Pendulum B starts at (2.5, 2.501). The
              difference is 0.001 radians, less than a tenth of a degree. For the first few seconds
              they move together. Then they diverge, dramatically and irreversibly.
            </p>
            <p>
              This is{" "}
              <Term id="sensitive-dependence">sensitive dependence on initial conditions</Term>,
              popularly called the butterfly effect. The divergence grows exponentially,
              characterized by the system&apos;s{" "}
              <Term id="lyapunov-exponent">Lyapunov exponent</Term>. No amount of measurement
              precision can predict the long-term behavior. The physics is exact, the predictions
              are not.
            </p>
            <p>
              The simulation uses <Term id="runge-kutta">RK4 integration</Term> (fourth-order
              Runge-Kutta) with multiple substeps per frame for numerical stability. The equations
              of motion come from <Term id="lagrangian-mechanics">Lagrangian mechanics</Term>,
              treating the system as two coupled nonlinear differential equations.
            </p>
            <p className="border-t border-border pt-2">
              <a
                href="https://en.wikipedia.org/wiki/Double_pendulum"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                Wikipedia: Double pendulum
              </a>
            </p>
          </>
        }
      />
    </>
  );
}
