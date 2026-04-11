import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          © {new Date().getFullYear()} · Matt Kerkstra
        </p>
        <Socials />
      </div>
    </footer>
  );
}
