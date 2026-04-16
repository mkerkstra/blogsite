import type { Metadata } from "next";
import { BinaryTree } from "@/features/lab/components/binary-tree";

export const metadata: Metadata = {
  title: "Binary Tree",
  description: "AVL tree insertions with animated rotations.",
  alternates: { canonical: "/lab/binary-tree" },
};

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
      <details className="fixed bottom-6 right-5 z-10 max-w-xs md:right-8">
        <summary className="cursor-pointer text-right font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 hover:text-foreground/50">
          how it works
        </summary>
        <div className="mt-2 rounded bg-background/80 p-3 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-[10px] leading-relaxed text-foreground/50">
            <p>
              An AVL tree is a self-balancing binary search tree. After every insertion, each node
              checks its balance factor (left height minus right height). If any node exceeds +/-1,
              a rotation restores balance.
            </p>
            <p>
              Watch the search path light up as a value finds its place. When imbalance triggers,
              nodes rearrange through single or double rotations. The tree never degenerates into a
              linked list, guaranteeing O(log n) operations.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
