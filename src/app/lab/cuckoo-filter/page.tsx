import { CuckooFilter } from "@/features/lab/components/cuckoo-filter";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "cuckoo-filter",
  "Cuckoo Filter",
  "Fingerprints in a cuckoo hash table. Insertions kick, chains cascade.",
);

export default function CuckooFilterPage() {
  return (
    <>
      <CuckooFilter />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          cuckoo filter
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          insert to trigger kicks
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          A cuckoo filter stores set membership using <Term id="fingerprint">fingerprints</Term> in
          a <Term id="cuckoo-hashing">cuckoo hash table</Term>. Each item hashes to two candidate
          buckets. If both are full, a random existing fingerprint is evicted to its alternate
          bucket, creating a chain of displacements, the cuckoo kick. This continues until an empty
          slot is found or a maximum kick count is reached.
        </p>
        <p>
          The alternate bucket is computed from the current bucket index and the fingerprint itself:
          i&#8322; = i&#8321; XOR hash(fingerprint). This partial-key cuckoo hashing means the
          filter only needs to store fingerprints, not full keys. A lookup checks two buckets. A
          delete removes a matching fingerprint from either bucket.
        </p>
        <p>
          Fan et al. introduced cuckoo filters at CoNEXT 2014, showing they outperform Bloom filters
          in both space and speed for false positive rates below about 3%. With 4 slots per bucket
          and 8-bit fingerprints, a cuckoo filter achieves roughly 95% occupancy before insertions
          start failing. Vacuum Filters (Wang et al., 2019) and Morton Filters (Breslow and
          Jayasena, 2018) extend the idea with better locality and higher load factors.
        </p>
        <p>
          Watch the kick chains. Short chains (1-2 kicks) are common under low load. As occupancy
          climbs past 80%, chains get longer and more dramatic, sometimes cascading across half the
          table before finding an empty slot.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://doi.org/10.1145/2674005.2674994"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Fan et al. (CoNEXT 2014)
          </a>
          {" / "}
          <a
            href="https://en.wikipedia.org/wiki/Cuckoo_filter"
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
