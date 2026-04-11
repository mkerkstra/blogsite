import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-5 md:px-8">
        <a
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground no-underline hover:text-accent"
        >
          kerkstra<span className="text-muted-foreground">.dev</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
