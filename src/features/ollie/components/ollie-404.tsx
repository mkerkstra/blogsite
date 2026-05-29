"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { olliePics } from "@/features/ollie/data/ollie";

/**
 * Random Ollie pic for the 404 page.
 *
 * This is a client component on purpose. The previous implementation
 * randomized server-side, which required `await headers()` in the root
 * not-found.tsx to opt that render into per-request dynamic mode. But
 * the root not-found is part of every route's render tree, so that one
 * call deopted the ENTIRE app to `ƒ Dynamic` — killing static
 * generation, CDN caching, the post-build twitter-strip, and the
 * JSON-LD injection site-wide (see docs/architecture/static-seo-routes.md).
 *
 * Picking the pic on the client keeps the 404 page (and therefore the
 * whole site) statically prerenderable. SSR + first client render show
 * pics[0] so there's no hydration mismatch; the effect swaps in a
 * random pic immediately after mount.
 */
export function Ollie404() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * olliePics.length));
  }, []);

  const pic = olliePics[index] ?? olliePics[0];

  return (
    <div className="reveal reveal-1 flex max-w-sm flex-col gap-2">
      <Image
        src={pic.src}
        alt={pic.alt}
        placeholder="blur"
        sizes="(max-width: 768px) 90vw, 384px"
        className="h-auto w-full border border-border"
      />
      <p className="font-mono text-[10px] italic tracking-wide text-muted-foreground">
        {pic.caption}
      </p>
    </div>
  );
}
