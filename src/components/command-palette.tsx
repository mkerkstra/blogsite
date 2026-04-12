"use client";

import { Command } from "cmdk";
import {
  ArrowUpRight,
  Briefcase,
  Code,
  Copy,
  Download,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  Moon,
  Sparkles,
  Sun,
  User,
  Wrench,
} from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import * as React from "react";

import { aboutMe } from "@/features/resume/data/about-me";

type ItemDef = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void | Promise<void>;
  keywords?: string[];
};

function jumpTo(id: string) {
  return () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    } else {
      window.location.href = `/#${id}`;
    }
  };
}

function openExternal(url: string) {
  return () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // Toggle on ⌘K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset copied indicator when palette closes
  React.useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const run = (perform: () => void | Promise<void>) => {
    void perform();
    setOpen(false);
  };

  const isDark = resolvedTheme === "dark";

  const sections: ItemDef[] = [
    { id: "jump-top", label: "Top of page", icon: User, perform: jumpTo("main") },
    { id: "jump-experience", label: "Experience", icon: Briefcase, perform: jumpTo("experience") },
    { id: "jump-projects", label: "Side projects", icon: Sparkles, perform: jumpTo("projects") },
    { id: "jump-tools", label: "Tools", icon: Wrench, perform: jumpTo("tools") },
    { id: "jump-education", label: "Education", icon: GraduationCap, perform: jumpTo("education") },
  ];

  const pages: ItemDef[] = [
    {
      id: "page-resume",
      label: "/  ·  resume",
      icon: User,
      perform: () => {
        window.location.href = "/";
      },
    },
    {
      id: "page-now",
      label: "/now  ·  what I'm doing now",
      icon: Sparkles,
      perform: () => {
        window.location.href = "/now";
      },
    },
    {
      id: "page-reading",
      label: "/reading  ·  books I keep reaching for",
      icon: GraduationCap,
      perform: () => {
        window.location.href = "/reading";
      },
    },
  ];

  const actions: ItemDef[] = [
    {
      id: "theme-toggle",
      label: isDark ? "Switch to light mode" : "Switch to dark mode",
      icon: isDark ? Sun : Moon,
      perform: () => {
        const next = isDark ? "light" : "dark";
        if (typeof document !== "undefined" && "startViewTransition" in document) {
          document.startViewTransition(() => setTheme(next));
        } else {
          setTheme(next);
        }
      },
      keywords: ["dark", "light", "mode"],
    },
    {
      id: "download-pdf",
      label: "Download resume.pdf",
      icon: Download,
      perform: () => {
        window.open("/resume.pdf", "_blank", "noopener,noreferrer");
      },
      keywords: ["resume", "pdf", "download"],
    },
    {
      id: "json-resume",
      label: "View JSON resume",
      icon: Code,
      perform: () => {
        window.open("/api/resume.json", "_blank");
      },
      keywords: ["json", "api", "schema"],
    },
    {
      id: "copy-email",
      label: copied ? "Email copied!" : "Copy email address",
      icon: Copy,
      perform: async () => {
        await navigator.clipboard.writeText(aboutMe.contact.email);
        setCopied(true);
        // keep palette open briefly so the user sees the confirmation
        setTimeout(() => setOpen(false), 700);
      },
      keywords: ["email", "clipboard"],
    },
  ];

  const links: ItemDef[] = [
    {
      id: "github",
      label: aboutMe.contact.github,
      icon: Github,
      perform: openExternal(aboutMe.contact.githubUrl),
    },
    {
      id: "linkedin",
      label: aboutMe.contact.linkedin,
      icon: Linkedin,
      perform: openExternal(aboutMe.contact.linkedinUrl),
    },
    {
      id: "email",
      label: aboutMe.contact.email,
      icon: Mail,
      perform: openExternal(`mailto:${aboutMe.contact.email}`),
    },
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh]"
    >
      <div
        className="w-full max-w-xl border border-border bg-background font-mono text-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            &gt;_
          </span>
          <Command.Input
            placeholder="search…"
            className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="ml-auto border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[420px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            no matches
          </Command.Empty>

          <CommandGroup label="Pages">
            {pages.map((item) => (
              <CommandItem key={item.id} item={item} onRun={run} />
            ))}
          </CommandGroup>

          <CommandGroup label="Sections">
            {sections.map((item) => (
              <CommandItem key={item.id} item={item} onRun={run} />
            ))}
          </CommandGroup>

          <CommandGroup label="Actions">
            {actions.map((item) => (
              <CommandItem key={item.id} item={item} onRun={run} />
            ))}
          </CommandGroup>

          <CommandGroup label="Links">
            {links.map((item) => (
              <CommandItem key={item.id} item={item} onRun={run} external />
            ))}
          </CommandGroup>
        </Command.List>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </Command.Dialog>
  );
}

function CommandGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={label}
      className="mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted-foreground"
    >
      {children}
    </Command.Group>
  );
}

function CommandItem({
  item,
  onRun,
  external = false,
}: {
  item: ItemDef;
  onRun: (perform: () => void | Promise<void>) => void;
  external?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Command.Item
      value={`${item.label} ${(item.keywords ?? []).join(" ")}`}
      onSelect={() => onRun(item.perform)}
      className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-foreground/90 aria-selected:bg-accent/15 aria-selected:text-accent"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{item.label}</span>
      {external ? <ArrowUpRight className="ml-auto h-3 w-3 opacity-50" /> : null}
    </Command.Item>
  );
}
