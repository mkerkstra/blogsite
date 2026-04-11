import type { Metadata } from "next";

import { reading, type Book, type ReadingShelf } from "@/features/reading/data/reading";
import { SectionLabel } from "@/features/resume/components/section-label";

export const metadata: Metadata = {
  title: "Reading",
  description:
    "Books Matt Kerkstra keeps reaching for — engineering, sci-fi, and the slow-moving stack.",
  alternates: { canonical: "/reading" },
  openGraph: {
    title: "Reading · kerkstra.dev",
    description:
      "Books Matt Kerkstra keeps reaching for — engineering, sci-fi, and the slow-moving stack.",
    url: "https://www.kerkstra.dev/reading",
    type: "profile",
  },
};

export const revalidate = 86400;

function BookRow({ book }: { book: Book }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-border py-4 md:grid-cols-[7rem_1fr] md:gap-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
        {book.year ?? ""}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2 text-[15px] leading-snug">
          {book.url ? (
            <a
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground no-underline transition-colors hover:text-accent"
            >
              {book.title}
            </a>
          ) : (
            <span className="font-medium text-foreground">{book.title}</span>
          )}
          <span className="text-muted-foreground">— {book.author}</span>
        </div>
        {book.note ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{book.note}</p>
        ) : null}
      </div>
    </div>
  );
}

function Shelf({ shelf, index }: { shelf: ReadingShelf; index: string }) {
  return (
    <section className="reveal flex flex-col gap-4">
      <SectionLabel index={index}>{shelf.label}</SectionLabel>
      {shelf.blurb ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">{shelf.blurb}</p>
      ) : null}
      <div className="flex flex-col">
        {shelf.books.map((book) => (
          <BookRow key={book.title} book={book} />
        ))}
      </div>
    </section>
  );
}

export default function ReadingPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="reveal flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          ↳ /reading
        </p>
        <h1 className="display-name font-display text-[clamp(2.5rem,8vw,4.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground">
          books I keep reaching for.
        </h1>
      </header>
      {reading.map((shelf, i) => (
        <Shelf key={shelf.id} shelf={shelf} index={String(i + 1).padStart(2, "0")} />
      ))}
    </div>
  );
}
