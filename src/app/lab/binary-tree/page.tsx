import { BinaryTree } from "@/features/lab/components/binary-tree";
import { LabInfoPanel } from "@/features/lab/components/lab-info-panel";
import { LabActions } from "@/features/lab/components/lab-actions";
import { Term } from "@/features/lab/components/term";

import { labMetadata } from "@/features/lab/lib/metadata";

export const metadata = labMetadata(
  "binary-tree",
  "Binary Tree",
  "AVL tree insertions with animated rotations.",
);

export default function BinaryTreePage() {
  return (
    <>
      <BinaryTree />
      <div className="pointer-events-none fixed bottom-6 left-5 z-10 select-none md:left-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          avl tree
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/25">
          insert to grow
        </p>
      </div>
      <LabActions />
      <LabInfoPanel>
        <p>
          An AVL tree is a self-balancing <Term id="bst">binary search tree</Term>. After every
          insertion, each node checks its <Term id="balance-factor">balance factor</Term> (left
          height minus right height). If any node exceeds +/-1, a rotation restores balance.
        </p>
        <p>
          Georgy Adelson-Velsky and Evgenii Landis introduced the AVL tree in 1962, making it the
          first self-balancing BST. Four rotation cases handle every imbalance: left-left and
          right-right require a single rotation, while left-right and right-left require a double
          rotation (rotate the child first, then the parent).
        </p>
        <p>
          The height difference at every node is maintained at most 1, which means an AVL tree of n
          nodes has height at most ~1.44 log&#8322;(n). This is stricter than a{" "}
          <Term id="red-black-tree">red-black tree</Term>, giving faster lookups at the cost of more
          rotations during insertion.
        </p>
        <p>
          Watch the search path light up as a value finds its place. When imbalance triggers, nodes
          rearrange through single or double rotations. The tree never degenerates into a linked
          list, guaranteeing O(log n) operations.
        </p>
        <p className="border-t border-border pt-2">
          <a
            href="https://en.wikipedia.org/wiki/AVL_tree"
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
