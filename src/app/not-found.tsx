import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { olliePics } from "@/features/ollie/data/ollie";

export default async function NotFound() {
  // headers() opts into dynamic rendering so Math.random() runs per request
  await headers();
  const pick = olliePics[Math.floor(Math.random() * olliePics.length)];

  return (
    <div className="flex flex-col gap-10 py-12" style={{ viewTransitionName: "page-body" }}>
      <div className="reveal flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          [404] · not found
        </p>
        <h1
          className="display-name font-display text-[clamp(3.5rem,11vw,6.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground"
          style={{ viewTransitionName: "display-heading" }}
        >
          dead link.
        </h1>
      </div>

      <div className="reveal reveal-1 flex max-w-sm flex-col gap-2">
        <Image
          src={pick.src}
          alt={pick.alt}
          placeholder="blur"
          sizes="(max-width: 768px) 90vw, 384px"
          className="h-auto w-full border border-border"
        />
        <p className="font-mono text-[10px] italic tracking-wide text-muted-foreground">
          {pick.caption}
        </p>
      </div>

      <p className="reveal reveal-2 max-w-prose text-[13px] leading-[1.7] text-muted-foreground">
        Whatever was here has either been moved, was never here, or got lost in the migration. The
        resume page is still the canonical entry point.
      </p>

      <div className="reveal reveal-3 flex items-baseline gap-3 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>↳</span>
        <Link href="/" className="text-foreground no-underline transition-colors hover:text-accent">
          back to /
        </Link>
        <span className="opacity-50">·</span>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground no-underline transition-colors hover:text-accent"
        >
          resume.pdf
        </a>
        <span className="opacity-50">·</span>
        <Link
          href="/ollie"
          className="text-foreground no-underline transition-colors hover:text-accent"
        >
          more ollie
        </Link>
      </div>
    </div>
  );
}
