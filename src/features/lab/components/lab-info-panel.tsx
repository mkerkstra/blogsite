"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LabInfoPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("toggle-lab-info", onToggle);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("toggle-lab-info", onToggle);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-5 z-10 cursor-pointer font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 transition-all hover:text-accent md:right-8",
          open && "pointer-events-none opacity-0",
        )}
        aria-expanded={open}
        aria-controls="lab-info-panel"
      >
        how it works
        <span className="ml-1.5 text-[8px] text-foreground/20">⇧?</span>
      </button>

      <aside
        id="lab-info-panel"
        role="complementary"
        aria-label="How it works"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-20 flex w-full flex-col border-l border-border bg-background/85 backdrop-blur-sm transition-transform duration-300 ease-out sm:max-w-md",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-6 md:px-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            how it works
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground transition-colors hover:text-accent"
            aria-label="Close panel"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 md:px-6">
          <div className="space-y-4 text-[13px] leading-[1.7] text-foreground/60">{children}</div>
        </div>
      </aside>
    </>
  );
}
