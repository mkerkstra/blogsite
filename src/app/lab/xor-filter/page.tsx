import type { Metadata } from "next";

import { XorFilter } from "@/features/lab/components/xor-filter";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { Term } from "@/features/lab/components/term";

export const metadata: Metadata = {
  title: "XOR Filter",
  description: "Hypergraph peeling builds a fingerprint table. Three XORs answer membership.",
  alternates: { canonical: "/lab/xor-filter" },
};

export default function XorFilterPage() {
  return (
    <>
      <XorFilter />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          xor filter
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          watch the peel, then query
        </p>
      </div>
      <LabInfoPanel>
        <p>
          An XOR filter encodes set membership in a compact{" "}
          <Term id="fingerprint">fingerprint</Term> table. For each key, three hash functions pick
          three table positions. The table is constructed so that XORing the three values at those
          positions yields the key&apos;s fingerprint. Querying is three lookups and two XORs.
        </p>
        <p>
          Construction works by <Term id="peeling">peeling</Term> a 3-uniform{" "}
          <Term id="hypergraph">hypergraph</Term>. Each key is a hyperedge connecting its three hash
          positions. Find a position touched by exactly one key (degree 1), remove that key, repeat.
          If every key gets removed, fingerprints can be assigned in reverse order: each removed
          key&apos;s solo position is set to make the XOR equation hold. If peeling fails, rehash
          and retry.
        </p>
        <p>
          Graf and Lemire introduced XOR filters in 2020, showing they use about 1.23x the
          theoretical minimum space (roughly 9.84 bits per element for 8-bit fingerprints). Binary
          Fuse Filters (Dietzfelbinger and Walzer, 2022) improve on this with a tapered table shape
          that reduces construction failure probability to near zero while matching the same space
          efficiency.
        </p>
        <p>
          The peeling process is equivalent to solving a random system of linear equations over{" "}
          <Term id="gf2">GF(2)</Term>. When the hypergraph is sparse enough (table size around
          1.23n), a random 3-uniform hypergraph is peelable with high probability. Watch the
          degree-1 vertices disappear one by one, then fingerprints fill in backwards.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://doi.org/10.1145/3376122"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Graf &amp; Lemire (JEA 2020)
          </a>
          {" / "}
          <a
            href="https://arxiv.org/abs/2201.01174"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Binary Fuse Filters (2022)
          </a>
          {" / "}
          <a
            href="https://en.wikipedia.org/wiki/Xor_filter"
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
