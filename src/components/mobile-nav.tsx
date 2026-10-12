"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export const MOBILE_NAV_LINKS = [
  { href: "/", label: "Resume" },
  { href: "/ai-engineer", label: "AI engineering" },
  { href: "/now", label: "Now" },
  { href: "/reading", label: "Reading" },
  { href: "/lab", label: "Lab" },
  { href: "/colophon", label: "Colophon" },
] as const;

/**
 * Below `sm` the primary nav and ⌘K hint are hidden, so this is the only way
 * to reach other pages on a phone. The panel drops below the header instead
 * of growing it: lab pages lay out around a fixed navbar height (LAB_INSETS).
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Close after client-side navigation.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        {open ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Menu className="h-4 w-4" aria-hidden="true" />
        )}
        Menu
      </button>
      {open ? (
        <nav
          id="mobile-nav-panel"
          aria-label="Primary"
          className="absolute inset-x-0 top-full border-b border-border bg-background"
        >
          <ul className="mx-auto flex w-full max-w-3xl flex-col px-5 py-2">
            {MOBILE_NAV_LINKS.map((link) => {
              const current = link.href === pathname;
              return (
                <li key={link.href} className="border-t border-border first:border-t-0">
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center text-[15px] no-underline transition-colors hover:text-accent ${
                      current ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
